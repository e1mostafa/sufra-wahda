using FluentValidation;
using MediatR;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Application.Common.Models;
using SufraWahda.Application.DTOs;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Interfaces;

namespace SufraWahda.Application.Features.Orders;

// ─── Place Order ──────────────────────────────────────────────────────────────
public record PlaceOrderCommand(PlaceOrderRequest Request) : IRequest<Result<OrderSummaryDto>>;

public class PlaceOrderCommandValidator : AbstractValidator<PlaceOrderCommand>
{
    public PlaceOrderCommandValidator()
    {
        RuleFor(x => x.Request.RestaurantId).NotEmpty().WithMessage("يجب تحديد المطعم");
        RuleFor(x => x.Request.DeliveryAddress).NotEmpty().WithMessage("عنوان التوصيل مطلوب");
        RuleFor(x => x.Request.Items).NotEmpty().WithMessage("يجب إضافة منتجات للطلب");
        RuleFor(x => x.Request.Items)
            .Must(items => items.All(i => i.Quantity > 0))
            .WithMessage("كمية المنتج يجب أن تكون أكبر من صفر");
    }
}

public class PlaceOrderCommandHandler : IRequestHandler<PlaceOrderCommand, Result<OrderSummaryDto>>
{
    private readonly IOrderRepository _orders;
    private readonly IRestaurantRepository _restaurants;
    private readonly IProductRepository _products;
    private readonly ICouponRepository _coupons;
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeService _realtime;
    private readonly IPushNotificationService _push;

    public PlaceOrderCommandHandler(
        IOrderRepository orders, IRestaurantRepository restaurants,
        IProductRepository products, ICouponRepository coupons,
        IUserRepository users, IUnitOfWork uow,
        ICurrentUserService currentUser, IRealtimeService realtime,
        IPushNotificationService push)
    {
        _orders = orders; _restaurants = restaurants; _products = products;
        _coupons = coupons; _users = users; _uow = uow;
        _currentUser = currentUser; _realtime = realtime; _push = push;
    }

    public async Task<Result<OrderSummaryDto>> Handle(PlaceOrderCommand cmd, CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue)
            return Result<OrderSummaryDto>.Unauthorized();

        var req = cmd.Request;
        var restaurant = await _restaurants.GetByIdAsync(req.RestaurantId, ct);

        if (restaurant == null)
            return Result<OrderSummaryDto>.NotFound("المطعم غير موجود");
        if (!restaurant.IsOpen)
            return Result<OrderSummaryDto>.Failure("المطعم مغلق حالياً");
        if (restaurant.Status != RestaurantStatus.Active)
            return Result<OrderSummaryDto>.Failure("المطعم غير متاح");

        // Build order items and calculate subtotal
        var orderItems = new List<OrderItem>();
        decimal subtotal = 0;

        foreach (var itemReq in req.Items)
        {
            var product = await _products.GetByIdAsync(itemReq.ProductId, ct);
            if (product == null || product.RestaurantId != req.RestaurantId)
                return Result<OrderSummaryDto>.Failure($"المنتج غير موجود أو لا ينتمي لهذا المطعم");
            if (!product.IsAvailable)
                return Result<OrderSummaryDto>.Failure($"المنتج '{product.NameAr}' غير متاح حالياً");

            var unitPrice = product.EffectivePrice;
            // Add options price
            if (itemReq.SelectedOptions?.Any() == true)
            {
                foreach (var opt in itemReq.SelectedOptions)
                {
                    var option = product.Options.FirstOrDefault(o => o.Id == opt.OptionId);
                    if (option != null)
                    {
                        foreach (var valId in opt.ValueIds)
                        {
                            var val = option.Values.FirstOrDefault(v => v.Id == valId);
                            if (val != null) unitPrice += val.AdditionalPrice;
                        }
                    }
                }
            }

            var itemTotal = unitPrice * itemReq.Quantity;
            subtotal += itemTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductNameAr = product.NameAr,
                ProductImageUrl = product.ImageUrl,
                Quantity = itemReq.Quantity,
                UnitPrice = unitPrice,
                TotalPrice = itemTotal,
                Notes = itemReq.Notes
            });
        }

        if (subtotal < restaurant.MinOrderAmount)
            return Result<OrderSummaryDto>.Failure(
                $"الحد الأدنى للطلب هو {restaurant.MinOrderAmount} ج.م");

        // Apply coupon
        decimal discountAmount = 0;
        Guid? couponId = null;
        if (!string.IsNullOrEmpty(req.CouponCode))
        {
            var coupon = await _coupons.GetByCodeAsync(req.CouponCode, ct);
            if (coupon == null || !coupon.IsValid)
                return Result<OrderSummaryDto>.Failure("كود الخصم غير صحيح أو منتهي الصلاحية");

            var userUsage = await _coupons.GetUserUsageCountAsync(coupon.Id, _currentUser.UserId.Value, ct);
            if (userUsage >= coupon.MaxUsesPerUser)
                return Result<OrderSummaryDto>.Failure("لقد استخدمت هذا الكوبون مسبقاً");

            discountAmount = coupon.Type == CouponType.FreeDelivery
                ? restaurant.DeliveryFee
                : coupon.CalculateDiscount(subtotal);
            couponId = coupon.Id;
        }

        // Loyalty points
        var customer = await _users.GetByIdAsync(_currentUser.UserId.Value, ct);
        int loyaltyUsed = 0;
        decimal loyaltyDiscount = 0;
        if (req.LoyaltyPointsToUse > 0 && customer != null)
        {
            loyaltyUsed = Math.Min(req.LoyaltyPointsToUse, customer.LoyaltyPoints);
            loyaltyDiscount = loyaltyUsed * 0.10m; // 0.10 EGP per point
            discountAmount += loyaltyDiscount;
        }

        var totalDiscount = Math.Min(discountAmount, subtotal);
        var deliveryFee = req.CouponCode != null
            ? (discountAmount == restaurant.DeliveryFee ? 0 : restaurant.DeliveryFee)
            : restaurant.DeliveryFee;
        var total = subtotal - (totalDiscount - loyaltyDiscount) - loyaltyDiscount + deliveryFee;
        total = Math.Max(total, 0);

        var pointsEarned = (int)Math.Floor(total);

        var orderNumber = await _orders.GenerateOrderNumberAsync(ct);
        var order = new Order
        {
            OrderNumber = orderNumber,
            CustomerId = _currentUser.UserId.Value,
            RestaurantId = req.RestaurantId,
            Status = OrderStatus.Pending,
            PaymentMethod = req.PaymentMethod,
            PaymentStatus = req.PaymentMethod == PaymentMethod.Cash
                ? PaymentStatus.Pending
                : PaymentStatus.Pending,
            Subtotal = subtotal,
            DeliveryFee = deliveryFee,
            DiscountAmount = totalDiscount,
            TotalAmount = total,
            CouponId = couponId,
            LoyaltyPointsUsed = loyaltyUsed,
            LoyaltyPointsEarned = pointsEarned,
            DeliveryAddress = req.DeliveryAddress,
            DeliveryLatitude = req.DeliveryLatitude,
            DeliveryLongitude = req.DeliveryLongitude,
            DeliveryNotes = req.DeliveryNotes,
            CustomerNotes = req.CustomerNotes,
            EstimatedDeliveryAt = DateTime.UtcNow.AddMinutes(restaurant.EstimatedDeliveryMinutes + 15)
        };

        foreach (var item in orderItems) { item.OrderId = order.Id; order.Items.Add(item); }

        order.StatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id, Status = OrderStatus.Pending
        });

        // Update customer loyalty points
        if (customer != null && loyaltyUsed > 0)
            customer.LoyaltyPoints -= loyaltyUsed;

        await _orders.AddAsync(order, ct);
        if (couponId.HasValue)
        {
            var coupon = await _coupons.GetByIdAsync(couponId.Value, ct);
            if (coupon != null) coupon.UsedCount++;
        }

        restaurant.TotalOrders++;
        await _uow.SaveChangesAsync(ct);

        // Notify restaurant in real-time
        await _realtime.NotifyRestaurantNewOrderAsync(req.RestaurantId, order.Id, ct);
        await _push.SendToUserAsync(restaurant.OwnerId,
            "طلب جديد! 🛎️", $"طلب جديد رقم {orderNumber}", ct: ct);

        var summary = new OrderSummaryDto(
            order.Id, order.OrderNumber,
            new RestaurantSummaryDto(restaurant.Id, restaurant.NameAr, restaurant.NameEn,
                restaurant.LogoUrl, restaurant.CoverImageUrl, null,
                restaurant.AverageRating, restaurant.TotalRatings,
                restaurant.DeliveryFee, restaurant.EstimatedDeliveryMinutes,
                restaurant.IsOpen, restaurant.IsFeatured, restaurant.IsSponsored,
                restaurant.MinOrderAmount, restaurant.Tags),
            order.Status, order.PaymentMethod, order.PaymentStatus,
            order.TotalAmount, order.DeliveryFee, order.DiscountAmount,
            order.DeliveryAddress, order.CreatedAt, order.EstimatedDeliveryAt,
            orderItems.Sum(i => i.Quantity));

        return Result<OrderSummaryDto>.Created(summary, "تم إرسال طلبك بنجاح");
    }
}

// ─── Get Customer Orders ──────────────────────────────────────────────────────
public record GetCustomerOrdersQuery(int Page = 1, int PageSize = 10)
    : IRequest<Result<PagedResult<OrderSummaryDto>>>;

public class GetCustomerOrdersQueryHandler
    : IRequestHandler<GetCustomerOrdersQuery, Result<PagedResult<OrderSummaryDto>>>
{
    private readonly IOrderRepository _orders;
    private readonly ICurrentUserService _currentUser;

    public GetCustomerOrdersQueryHandler(IOrderRepository orders, ICurrentUserService currentUser)
    {
        _orders = orders; _currentUser = currentUser;
    }

    public async Task<Result<PagedResult<OrderSummaryDto>>> Handle(
        GetCustomerOrdersQuery q, CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue)
            return Result<PagedResult<OrderSummaryDto>>.Unauthorized();

        var (items, total) = await _orders.GetByCustomerAsync(
            _currentUser.UserId.Value, q.Page, q.PageSize, ct);

        var dtos = items.Select(o => new OrderSummaryDto(
            o.Id, o.OrderNumber,
            new RestaurantSummaryDto(o.Restaurant.Id, o.Restaurant.NameAr,
                o.Restaurant.NameEn, o.Restaurant.LogoUrl, o.Restaurant.CoverImageUrl,
                null, o.Restaurant.AverageRating, o.Restaurant.TotalRatings,
                o.Restaurant.DeliveryFee, o.Restaurant.EstimatedDeliveryMinutes,
                o.Restaurant.IsOpen, o.Restaurant.IsFeatured, o.Restaurant.IsSponsored,
                o.Restaurant.MinOrderAmount, o.Restaurant.Tags),
            o.Status, o.PaymentMethod, o.PaymentStatus,
            o.TotalAmount, o.DeliveryFee, o.DiscountAmount,
            o.DeliveryAddress, o.CreatedAt, o.EstimatedDeliveryAt,
            o.Items.Sum(i => i.Quantity)));

        return Result<PagedResult<OrderSummaryDto>>.Success(
            PagedResult<OrderSummaryDto>.Create(dtos, total, q.Page, q.PageSize));
    }
}

// ─── Get Order Detail ─────────────────────────────────────────────────────────
public record GetOrderDetailQuery(Guid OrderId) : IRequest<Result<OrderDetailDto>>;

public class GetOrderDetailQueryHandler
    : IRequestHandler<GetOrderDetailQuery, Result<OrderDetailDto>>
{
    private readonly IOrderRepository _orders;
    private readonly ICurrentUserService _currentUser;

    public GetOrderDetailQueryHandler(IOrderRepository orders, ICurrentUserService currentUser)
    {
        _orders = orders; _currentUser = currentUser;
    }

    public async Task<Result<OrderDetailDto>> Handle(GetOrderDetailQuery q, CancellationToken ct)
    {
        var order = await _orders.GetWithDetailsAsync(q.OrderId, ct);
        if (order == null) return Result<OrderDetailDto>.NotFound("الطلب غير موجود");

        // Authorization: customer can see their own, restaurant owner can see theirs
        if (!_currentUser.IsAdmin
            && order.CustomerId != _currentUser.UserId
            && order.Restaurant.OwnerId != _currentUser.UserId
            && order.DriverId != _currentUser.UserId)
            return Result<OrderDetailDto>.Forbidden();

        var statusLabels = new Dictionary<OrderStatus, string>
        {
            [OrderStatus.Pending] = "في الانتظار",
            [OrderStatus.Confirmed] = "تم التأكيد",
            [OrderStatus.Preparing] = "يُحضَّر",
            [OrderStatus.ReadyForPickup] = "جاهز للاستلام",
            [OrderStatus.PickedUp] = "تم الاستلام",
            [OrderStatus.OnTheWay] = "في الطريق",
            [OrderStatus.Delivered] = "تم التسليم",
            [OrderStatus.Cancelled] = "ملغي",
            [OrderStatus.Refunded] = "مسترجع"
        };

        DriverTrackingDto? driverDto = null;
        if (order.Driver != null)
        {
            var profile = order.Driver.DriverProfile;
            driverDto = new DriverTrackingDto(
                order.Driver.Id, order.Driver.FullName, order.Driver.Phone,
                profile?.CurrentLatitude, profile?.CurrentLongitude);
        }

        var dto = new OrderDetailDto(
            order.Id, order.OrderNumber,
            new RestaurantSummaryDto(order.Restaurant.Id, order.Restaurant.NameAr,
                order.Restaurant.NameEn, order.Restaurant.LogoUrl, null, null,
                order.Restaurant.AverageRating, order.Restaurant.TotalRatings,
                order.Restaurant.DeliveryFee, order.Restaurant.EstimatedDeliveryMinutes,
                order.Restaurant.IsOpen, order.Restaurant.IsFeatured, false,
                order.Restaurant.MinOrderAmount, null),
            order.Status, order.PaymentMethod, order.PaymentStatus,
            order.Subtotal, order.DeliveryFee, order.TaxAmount,
            order.DiscountAmount, order.TotalAmount,
            order.DeliveryAddress, order.CustomerNotes, order.DeliveryNotes,
            order.CreatedAt, order.EstimatedDeliveryAt, order.DeliveredAt,
            order.Items.Select(i => new OrderItemDto(
                i.ProductId, i.ProductNameAr, i.ProductImageUrl,
                i.Quantity, i.UnitPrice, i.TotalPrice, i.Notes)),
            order.StatusHistory
                .OrderBy(h => h.CreatedAt)
                .Select(h => new OrderStatusHistoryDto(
                    h.Status, statusLabels.GetValueOrDefault(h.Status, ""), h.CreatedAt)),
            driverDto);

        return Result<OrderDetailDto>.Success(dto);
    }
}

// ─── Confirm Order (Restaurant) ───────────────────────────────────────────────
public record ConfirmOrderCommand(Guid OrderId) : IRequest<Result<bool>>;

public class ConfirmOrderCommandHandler : IRequestHandler<ConfirmOrderCommand, Result<bool>>
{
    private readonly IOrderRepository _orders;
    private readonly IRestaurantRepository _restaurants;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeService _realtime;
    private readonly IPushNotificationService _push;

    public ConfirmOrderCommandHandler(
        IOrderRepository orders, IRestaurantRepository restaurants,
        IUnitOfWork uow, ICurrentUserService currentUser,
        IRealtimeService realtime, IPushNotificationService push)
    {
        _orders = orders; _restaurants = restaurants; _uow = uow;
        _currentUser = currentUser; _realtime = realtime; _push = push;
    }

    public async Task<Result<bool>> Handle(ConfirmOrderCommand cmd, CancellationToken ct)
    {
        var order = await _orders.GetWithDetailsAsync(cmd.OrderId, ct);
        if (order == null) return Result<bool>.NotFound("الطلب غير موجود");

        if (order.Restaurant.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Result<bool>.Forbidden();

        if (order.Status != OrderStatus.Pending)
            return Result<bool>.Failure("لا يمكن تأكيد هذا الطلب في حالته الحالية");

        order.UpdateStatus(OrderStatus.Confirmed, _currentUser.UserId);
        await _uow.SaveChangesAsync(ct);

        await _realtime.NotifyOrderStatusChangeAsync(order.Id, "Confirmed", ct);
        await _push.SendToUserAsync(order.CustomerId,
            "تم تأكيد طلبك ✅",
            $"طلبك رقم {order.OrderNumber} قيد التحضير الآن!", ct: ct);

        return Result<bool>.Success(true, "تم تأكيد الطلب");
    }
}

// ─── Reject Order (Restaurant) ────────────────────────────────────────────────
public record RejectOrderCommand(Guid OrderId, string Reason) : IRequest<Result<bool>>;

public class RejectOrderCommandHandler : IRequestHandler<RejectOrderCommand, Result<bool>>
{
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IPushNotificationService _push;

    public RejectOrderCommandHandler(
        IOrderRepository orders, IUnitOfWork uow,
        ICurrentUserService currentUser, IPushNotificationService push)
    {
        _orders = orders; _uow = uow; _currentUser = currentUser; _push = push;
    }

    public async Task<Result<bool>> Handle(RejectOrderCommand cmd, CancellationToken ct)
    {
        var order = await _orders.GetWithDetailsAsync(cmd.OrderId, ct);
        if (order == null) return Result<bool>.NotFound();

        if (order.Restaurant.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Result<bool>.Forbidden();

        if (order.Status != OrderStatus.Pending)
            return Result<bool>.Failure("لا يمكن رفض هذا الطلب");

        order.RejectionReason = cmd.Reason;
        order.UpdateStatus(OrderStatus.Cancelled, _currentUser.UserId, cmd.Reason);
        await _uow.SaveChangesAsync(ct);

        await _push.SendToUserAsync(order.CustomerId,
            "تم رفض طلبك ❌",
            $"طلبك رقم {order.OrderNumber} تم رفضه: {cmd.Reason}", ct: ct);

        return Result<bool>.Success(true, "تم رفض الطلب");
    }
}

// ─── Cancel Order (Customer) ──────────────────────────────────────────────────
public record CancelOrderCommand(Guid OrderId) : IRequest<Result<bool>>;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result<bool>>
{
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public CancelOrderCommandHandler(IOrderRepository orders, IUnitOfWork uow, ICurrentUserService cu)
    {
        _orders = orders; _uow = uow; _currentUser = cu;
    }

    public async Task<Result<bool>> Handle(CancelOrderCommand cmd, CancellationToken ct)
    {
        var order = await _orders.GetByIdAsync(cmd.OrderId, ct);
        if (order == null) return Result<bool>.NotFound();

        if (order.CustomerId != _currentUser.UserId)
            return Result<bool>.Forbidden();

        if (order.Status is not (OrderStatus.Pending or OrderStatus.Confirmed))
            return Result<bool>.Failure("لا يمكن إلغاء الطلب بعد بدء التحضير");

        order.UpdateStatus(OrderStatus.Cancelled, _currentUser.UserId, "إلغاء من قبل العميل");
        await _uow.SaveChangesAsync(ct);
        return Result<bool>.Success(true, "تم إلغاء الطلب");
    }
}

// ─── Mark Order Ready (Restaurant) ───────────────────────────────────────────
public record MarkOrderReadyCommand(Guid OrderId) : IRequest<Result<bool>>;

public class MarkOrderReadyCommandHandler : IRequestHandler<MarkOrderReadyCommand, Result<bool>>
{
    private readonly IOrderRepository _orders;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeService _realtime;

    public MarkOrderReadyCommandHandler(
        IOrderRepository orders, IUnitOfWork uow,
        ICurrentUserService currentUser, IRealtimeService realtime)
    {
        _orders = orders; _uow = uow; _currentUser = currentUser; _realtime = realtime;
    }

    public async Task<Result<bool>> Handle(MarkOrderReadyCommand cmd, CancellationToken ct)
    {
        var order = await _orders.GetWithDetailsAsync(cmd.OrderId, ct);
        if (order == null) return Result<bool>.NotFound();
        if (order.Restaurant.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Result<bool>.Forbidden();
        if (order.Status != OrderStatus.Preparing)
            return Result<bool>.Failure("الطلب ليس في مرحلة التحضير");

        order.UpdateStatus(OrderStatus.ReadyForPickup, _currentUser.UserId);
        await _uow.SaveChangesAsync(ct);
        await _realtime.NotifyOrderStatusChangeAsync(order.Id, "ReadyForPickup", ct);
        return Result<bool>.Success(true, "تم تحديث حالة الطلب");
    }
}

// ─── Validate Coupon ─────────────────────────────────────────────────────────
public record ValidateCouponQuery(ValidateCouponRequest Request)
    : IRequest<Result<ValidateCouponResponse>>;

public class ValidateCouponQueryHandler
    : IRequestHandler<ValidateCouponQuery, Result<ValidateCouponResponse>>
{
    private readonly ICouponRepository _coupons;
    private readonly ICurrentUserService _currentUser;

    public ValidateCouponQueryHandler(ICouponRepository coupons, ICurrentUserService cu)
    {
        _coupons = coupons; _currentUser = cu;
    }

    public async Task<Result<ValidateCouponResponse>> Handle(
        ValidateCouponQuery q, CancellationToken ct)
    {
        var coupon = await _coupons.GetByCodeAsync(q.Request.Code, ct);

        if (coupon == null || !coupon.IsValid)
            return Result<ValidateCouponResponse>.Success(
                new ValidateCouponResponse(false, "الكوبون غير صحيح أو منتهي الصلاحية", 0, null, null));

        if (coupon.RestaurantId.HasValue && coupon.RestaurantId != q.Request.RestaurantId)
            return Result<ValidateCouponResponse>.Success(
                new ValidateCouponResponse(false, "الكوبون غير صالح لهذا المطعم", 0, null, null));

        if (q.Request.OrderAmount < coupon.MinOrderAmount)
            return Result<ValidateCouponResponse>.Success(
                new ValidateCouponResponse(false,
                    $"الحد الأدنى للطلب هو {coupon.MinOrderAmount} ج.م", 0, null, null));

        if (_currentUser.UserId.HasValue)
        {
            var usage = await _coupons.GetUserUsageCountAsync(coupon.Id, _currentUser.UserId.Value, ct);
            if (usage >= coupon.MaxUsesPerUser)
                return Result<ValidateCouponResponse>.Success(
                    new ValidateCouponResponse(false, "لقد استخدمت هذا الكوبون مسبقاً", 0, null, null));
        }

        var discount = coupon.CalculateDiscount(q.Request.OrderAmount);
        return Result<ValidateCouponResponse>.Success(
            new ValidateCouponResponse(true, null, discount, coupon.Type, coupon.Value));
    }
}
