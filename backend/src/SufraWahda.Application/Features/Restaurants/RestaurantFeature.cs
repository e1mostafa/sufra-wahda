using FluentValidation;
using MediatR;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Application.Common.Models;
using SufraWahda.Application.DTOs;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Interfaces;

namespace SufraWahda.Application.Features.Restaurants;

// ─── Get Restaurants (Paged) ──────────────────────────────────────────────────
public record GetRestaurantsQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? CategoryId = null,
    string? City = null,
    bool? IsOpen = null,
    bool? IsFeatured = null,
    decimal? Lat = null,
    decimal? Lng = null) : IRequest<Result<PagedResult<RestaurantSummaryDto>>>;

public class GetRestaurantsQueryHandler
    : IRequestHandler<GetRestaurantsQuery, Result<PagedResult<RestaurantSummaryDto>>>
{
    private readonly IRestaurantRepository _restaurants;
    private readonly ICurrentUserService _currentUser;
    private readonly ICacheService _cache;

    public GetRestaurantsQueryHandler(
        IRestaurantRepository restaurants,
        ICurrentUserService currentUser,
        ICacheService cache)
    {
        _restaurants = restaurants;
        _currentUser = currentUser;
        _cache = cache;
    }

    public async Task<Result<PagedResult<RestaurantSummaryDto>>> Handle(
        GetRestaurantsQuery q, CancellationToken ct)
    {
        var (items, total) = await _restaurants.GetPagedAsync(
            q.Page, q.PageSize, q.Search, q.CategoryId, q.City, q.IsOpen, q.IsFeatured, ct);

        var dtos = items.Select(r => MapToSummary(r)).ToList();
        return Result<PagedResult<RestaurantSummaryDto>>.Success(
            PagedResult<RestaurantSummaryDto>.Create(dtos, total, q.Page, q.PageSize));
    }

    private static RestaurantSummaryDto MapToSummary(Restaurant r) => new(
        r.Id, r.NameAr, r.NameEn, r.LogoUrl, r.CoverImageUrl,
        r.Category?.NameAr, r.AverageRating, r.TotalRatings,
        r.DeliveryFee, r.EstimatedDeliveryMinutes,
        r.IsOpen, r.IsFeatured, r.IsSponsored, r.MinOrderAmount, r.Tags);
}

// ─── Get Restaurant By ID ─────────────────────────────────────────────────────
public record GetRestaurantByIdQuery(Guid Id) : IRequest<Result<RestaurantDetailDto>>;

public class GetRestaurantByIdQueryHandler
    : IRequestHandler<GetRestaurantByIdQuery, Result<RestaurantDetailDto>>
{
    private readonly IRestaurantRepository _restaurants;
    private readonly ICacheService _cache;

    public GetRestaurantByIdQueryHandler(IRestaurantRepository restaurants, ICacheService cache)
    {
        _restaurants = restaurants; _cache = cache;
    }

    public async Task<Result<RestaurantDetailDto>> Handle(
        GetRestaurantByIdQuery q, CancellationToken ct)
    {
        var cacheKey = $"restaurant:{q.Id}";
        var cached = await _cache.GetAsync<RestaurantDetailDto>(cacheKey, ct);
        if (cached != null) return Result<RestaurantDetailDto>.Success(cached);

        var r = await _restaurants.GetWithMenuAsync(q.Id, ct);
        if (r == null) return Result<RestaurantDetailDto>.NotFound("المطعم غير موجود");
        if (r.Status != RestaurantStatus.Active)
            return Result<RestaurantDetailDto>.NotFound("المطعم غير متاح");

        var dto = MapToDetail(r);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5), ct);
        return Result<RestaurantDetailDto>.Success(dto);
    }

    private static RestaurantDetailDto MapToDetail(Restaurant r) => new(
        r.Id, r.NameAr, r.NameEn, r.DescriptionAr,
        r.LogoUrl, r.CoverImageUrl, r.Phone, r.Address, r.City,
        r.AverageRating, r.TotalRatings, r.TotalOrders,
        r.DeliveryFee, r.EstimatedDeliveryMinutes, r.MinOrderAmount,
        r.MaxDeliveryRadiusKm, r.IsOpen, r.IsFeatured, r.Tags,
        r.OpeningHoursJson,
        r.MenuCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new MenuCategoryDto(
                c.Id, c.NameAr, c.NameEn, c.ImageUrl, c.DisplayOrder,
                c.Products
                    .Where(p => p.IsAvailable && p.DeletedAt == null)
                    .OrderBy(p => p.DisplayOrder)
                    .Select(p => MapProduct(p)))),
        r.Images.OrderBy(i => i.DisplayOrder)
            .Select(i => new RestaurantImageDto(i.Id, i.ImageUrl, i.DisplayOrder)));

    private static ProductDto MapProduct(Product p) => new(
        p.Id, p.NameAr, p.NameEn, p.DescriptionAr, p.ImageUrl,
        p.BasePrice, p.DiscountedPrice, p.EffectivePrice,
        p.Calories, p.IsAvailable, p.IsFeatured,
        p.PreparationMinutes, p.Tags, p.AverageRating,
        p.Options.OrderBy(o => o.DisplayOrder).Select(o => new ProductOptionDto(
            o.Id, o.NameAr, o.IsRequired, o.MinSelections, o.MaxSelections,
            o.Values.Select(v => new ProductOptionValueDto(
                v.Id, v.NameAr, v.AdditionalPrice, v.IsDefault)))));
}

// ─── Get Featured Restaurants ─────────────────────────────────────────────────
public record GetFeaturedRestaurantsQuery(int Limit = 10)
    : IRequest<Result<IEnumerable<RestaurantSummaryDto>>>;

public class GetFeaturedRestaurantsQueryHandler
    : IRequestHandler<GetFeaturedRestaurantsQuery, Result<IEnumerable<RestaurantSummaryDto>>>
{
    private readonly IRestaurantRepository _restaurants;
    private readonly ICacheService _cache;

    public GetFeaturedRestaurantsQueryHandler(IRestaurantRepository r, ICacheService c)
    {
        _restaurants = r; _cache = c;
    }

    public async Task<Result<IEnumerable<RestaurantSummaryDto>>> Handle(
        GetFeaturedRestaurantsQuery q, CancellationToken ct)
    {
        var cacheKey = "restaurants:featured";
        var cached = await _cache.GetAsync<IEnumerable<RestaurantSummaryDto>>(cacheKey, ct);
        if (cached != null) return Result<IEnumerable<RestaurantSummaryDto>>.Success(cached);

        var items = await _restaurants.GetFeaturedAsync(q.Limit, ct);
        var dtos = items.Select(r => new RestaurantSummaryDto(
            r.Id, r.NameAr, r.NameEn, r.LogoUrl, r.CoverImageUrl,
            r.Category?.NameAr, r.AverageRating, r.TotalRatings,
            r.DeliveryFee, r.EstimatedDeliveryMinutes, r.IsOpen,
            r.IsFeatured, r.IsSponsored, r.MinOrderAmount, r.Tags));

        await _cache.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(10), ct);
        return Result<IEnumerable<RestaurantSummaryDto>>.Success(dtos);
    }
}

// ─── Create Restaurant ────────────────────────────────────────────────────────
public record CreateRestaurantCommand(CreateRestaurantRequest Request)
    : IRequest<Result<RestaurantSummaryDto>>;

public class CreateRestaurantCommandValidator : AbstractValidator<CreateRestaurantCommand>
{
    public CreateRestaurantCommandValidator()
    {
        RuleFor(x => x.Request.NameAr).NotEmpty().WithMessage("اسم المطعم مطلوب");
        RuleFor(x => x.Request.Phone).NotEmpty().WithMessage("رقم الهاتف مطلوب");
        RuleFor(x => x.Request.Address).NotEmpty().WithMessage("العنوان مطلوب");
        RuleFor(x => x.Request.DeliveryFee).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Request.MinOrderAmount).GreaterThanOrEqualTo(0);
    }
}

public class CreateRestaurantCommandHandler
    : IRequestHandler<CreateRestaurantCommand, Result<RestaurantSummaryDto>>
{
    private readonly IRestaurantRepository _restaurants;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public CreateRestaurantCommandHandler(
        IRestaurantRepository restaurants, IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _restaurants = restaurants; _uow = uow; _currentUser = currentUser;
    }

    public async Task<Result<RestaurantSummaryDto>> Handle(
        CreateRestaurantCommand cmd, CancellationToken ct)
    {
        if (!_currentUser.UserId.HasValue)
            return Result<RestaurantSummaryDto>.Unauthorized();

        var existing = await _restaurants.GetByOwnerAsync(_currentUser.UserId.Value, ct);
        if (existing != null)
            return Result<RestaurantSummaryDto>.Conflict("لديك مطعم مسجل مسبقاً");

        var req = cmd.Request;
        var restaurant = new Restaurant
        {
            OwnerId = _currentUser.UserId.Value,
            NameAr = req.NameAr,
            NameEn = req.NameEn,
            DescriptionAr = req.DescriptionAr,
            CategoryId = req.CategoryId,
            Phone = req.Phone,
            Email = req.Email,
            Address = req.Address,
            City = req.City,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            MinOrderAmount = req.MinOrderAmount,
            DeliveryFee = req.DeliveryFee,
            EstimatedDeliveryMinutes = req.EstimatedDeliveryMinutes,
            TaxId = req.TaxId,
            BankAccountNumber = req.BankAccountNumber,
            BankName = req.BankName,
            OpeningHoursJson = req.OpeningHoursJson,
            Tags = req.Tags,
            Status = RestaurantStatus.PendingApproval
        };

        await _restaurants.AddAsync(restaurant, ct);
        await _uow.SaveChangesAsync(ct);

        return Result<RestaurantSummaryDto>.Created(new RestaurantSummaryDto(
            restaurant.Id, restaurant.NameAr, restaurant.NameEn,
            null, null, null, 0, 0, restaurant.DeliveryFee,
            restaurant.EstimatedDeliveryMinutes, false, false, false,
            restaurant.MinOrderAmount, restaurant.Tags),
            "تم تسجيل المطعم وسيتم مراجعته قريباً");
    }
}

// ─── Toggle Open/Close ────────────────────────────────────────────────────────
public record ToggleRestaurantOpenCommand(Guid RestaurantId, bool IsOpen)
    : IRequest<Result<bool>>;

public class ToggleRestaurantOpenCommandHandler
    : IRequestHandler<ToggleRestaurantOpenCommand, Result<bool>>
{
    private readonly IRestaurantRepository _restaurants;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;
    private readonly ICacheService _cache;

    public ToggleRestaurantOpenCommandHandler(
        IRestaurantRepository r, IUnitOfWork uow,
        ICurrentUserService cu, ICacheService c)
    {
        _restaurants = r; _uow = uow; _currentUser = cu; _cache = c;
    }

    public async Task<Result<bool>> Handle(ToggleRestaurantOpenCommand cmd, CancellationToken ct)
    {
        var r = await _restaurants.GetByIdAsync(cmd.RestaurantId, ct);
        if (r == null) return Result<bool>.NotFound();

        if (r.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Result<bool>.Forbidden();

        if (r.Status != RestaurantStatus.Active)
            return Result<bool>.Failure("المطعم غير مفعّل. لا يمكن تغيير الحالة");

        r.IsOpen = cmd.IsOpen;
        r.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync(ct);
        await _cache.RemoveAsync($"restaurant:{r.Id}", ct);
        await _cache.RemoveAsync("restaurants:featured", ct);

        return Result<bool>.Success(cmd.IsOpen,
            cmd.IsOpen ? "المطعم الآن مفتوح" : "المطعم الآن مغلق");
    }
}

// ─── Get Restaurant Analytics ─────────────────────────────────────────────────
public record GetRestaurantAnalyticsQuery(Guid RestaurantId, int Days = 7)
    : IRequest<Result<RestaurantAnalyticsDto>>;

public class GetRestaurantAnalyticsQueryHandler
    : IRequestHandler<GetRestaurantAnalyticsQuery, Result<RestaurantAnalyticsDto>>
{
    private readonly IOrderRepository _orders;
    private readonly ICurrentUserService _currentUser;
    private readonly IRestaurantRepository _restaurants;

    public GetRestaurantAnalyticsQueryHandler(
        IOrderRepository orders, ICurrentUserService currentUser, IRestaurantRepository restaurants)
    {
        _orders = orders; _currentUser = currentUser; _restaurants = restaurants;
    }

    public async Task<Result<RestaurantAnalyticsDto>> Handle(
        GetRestaurantAnalyticsQuery q, CancellationToken ct)
    {
        var restaurant = await _restaurants.GetByIdAsync(q.RestaurantId, ct);
        if (restaurant == null) return Result<RestaurantAnalyticsDto>.NotFound();

        if (restaurant.OwnerId != _currentUser.UserId && !_currentUser.IsAdmin)
            return Result<RestaurantAnalyticsDto>.Forbidden();

        var now = DateTime.UtcNow;
        var today = now.Date;

        var (todayRevenue, todayOrders) = await _orders.GetRevenueAsync(
            q.RestaurantId, today, today.AddDays(1), ct);
        var (weekRevenue, weekOrders) = await _orders.GetRevenueAsync(
            q.RestaurantId, today.AddDays(-7), today.AddDays(1), ct);
        var (monthRevenue, monthOrders) = await _orders.GetRevenueAsync(
            q.RestaurantId, today.AddDays(-30), today.AddDays(1), ct);

        var dto = new RestaurantAnalyticsDto(
            todayRevenue, weekRevenue, monthRevenue,
            todayOrders, weekOrders, monthOrders,
            monthOrders > 0 ? monthRevenue / monthOrders : 0,
            restaurant.AverageRating, restaurant.TotalRatings,
            new List<DailyRevenueDto>(),
            new List<TopProductDto>());

        return Result<RestaurantAnalyticsDto>.Success(dto);
    }
}
