using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SufraWahda.Application.DTOs;
using SufraWahda.Application.Features.Orders;
using Swashbuckle.AspNetCore.Annotations;

namespace SufraWahda.API.Controllers;

[SwaggerTag("Orders — إدارة الطلبات")]
[Authorize]
public class OrdersController : BaseController
{
    private readonly IMediator _mediator;
    public OrdersController(IMediator mediator) => _mediator = mediator;

    /// <summary>سجل طلبات العميل</summary>
    [HttpGet]
    [SwaggerOperation(Summary = "سجل طلبات العميل الحالي")]
    public async Task<IActionResult> GetMyOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetCustomerOrdersQuery(page, pageSize), ct);
        return PagedResult(result);
    }

    /// <summary>تفاصيل طلب محدد</summary>
    [HttpGet("{id:guid}")]
    [SwaggerOperation(Summary = "تفاصيل طلب محدد")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetOrderDetailQuery(id), ct);
        return FromResult(result);
    }

    /// <summary>إنشاء طلب جديد</summary>
    [HttpPost]
    [SwaggerOperation(Summary = "إنشاء طلب جديد")]
    public async Task<IActionResult> PlaceOrder(
        [FromBody] PlaceOrderRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new PlaceOrderCommand(request), ct);
        return FromResult(result);
    }

    /// <summary>إلغاء طلب (العميل)</summary>
    [HttpPost("{id:guid}/cancel")]
    [SwaggerOperation(Summary = "إلغاء طلب من قِبل العميل")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new CancelOrderCommand(id), ct);
        return FromResult(result);
    }

    /// <summary>التحقق من صحة كوبون الخصم</summary>
    [HttpPost("validate-coupon")]
    [SwaggerOperation(Summary = "التحقق من كوبون الخصم")]
    public async Task<IActionResult> ValidateCoupon(
        [FromBody] ValidateCouponRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ValidateCouponQuery(request), ct);
        return FromResult(result);
    }
}

/// <summary>Restaurant Order Management</summary>
[ApiController]
[Route("api/v1/restaurant/orders")]
[Produces("application/json")]
[Authorize]
[SwaggerTag("Restaurant Orders — إدارة طلبات المطعم")]
public class RestaurantOrdersController : BaseController
{
    private readonly IMediator _mediator;
    public RestaurantOrdersController(IMediator mediator) => _mediator = mediator;

    /// <summary>جميع طلبات المطعم</summary>
    [HttpGet("{restaurantId:guid}")]
    [SwaggerOperation(Summary = "طلبات مطعم محدد")]
    public async Task<IActionResult> GetRestaurantOrders(
        Guid restaurantId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        // TODO: extend query with restaurantId filter
        var result = await _mediator.Send(new GetCustomerOrdersQuery(page, pageSize), ct);
        return PagedResult(result);
    }

    /// <summary>قبول طلب</summary>
    [HttpPut("{id:guid}/confirm")]
    [SwaggerOperation(Summary = "تأكيد/قبول طلب")]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new ConfirmOrderCommand(id), ct);
        return FromResult(result);
    }

    /// <summary>رفض طلب</summary>
    [HttpPut("{id:guid}/reject")]
    [SwaggerOperation(Summary = "رفض طلب مع سبب")]
    public async Task<IActionResult> Reject(
        Guid id, [FromBody] RejectOrderRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RejectOrderCommand(id, request.Reason), ct);
        return FromResult(result);
    }

    /// <summary>تحديد الطلب جاهز للاستلام</summary>
    [HttpPut("{id:guid}/ready")]
    [SwaggerOperation(Summary = "الطلب جاهز للاستلام من السائق")]
    public async Task<IActionResult> MarkReady(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new MarkOrderReadyCommand(id), ct);
        return FromResult(result);
    }
}

public record RejectOrderRequest(string Reason);
