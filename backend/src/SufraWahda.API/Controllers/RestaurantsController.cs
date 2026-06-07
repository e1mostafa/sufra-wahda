using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SufraWahda.Application.DTOs;
using SufraWahda.Application.Features.Restaurants;
using Swashbuckle.AspNetCore.Annotations;

namespace SufraWahda.API.Controllers;

[SwaggerTag("Restaurants — إدارة المطاعم والقوائم")]
public class RestaurantsController : BaseController
{
    private readonly IMediator _mediator;
    public RestaurantsController(IMediator mediator) => _mediator = mediator;

    /// <summary>قائمة المطاعم مع فلترة وبحث</summary>
    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "استعراض المطاعم")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? city = null,
        [FromQuery] bool? isOpen = null,
        [FromQuery] bool? isFeatured = null,
        [FromQuery] decimal? lat = null,
        [FromQuery] decimal? lng = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetRestaurantsQuery(page, pageSize, search, categoryId, city, isOpen, isFeatured, lat, lng), ct);
        return PagedResult(result);
    }

    /// <summary>المطاعم المميزة</summary>
    [HttpGet("featured")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "المطاعم المميزة")]
    public async Task<IActionResult> GetFeatured(
        [FromQuery] int limit = 10, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetFeaturedRestaurantsQuery(limit), ct);
        return FromResult(result);
    }

    /// <summary>تفاصيل مطعم مع القائمة الكاملة</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "تفاصيل مطعم وقائمته")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetRestaurantByIdQuery(id), ct);
        return FromResult(result);
    }

    /// <summary>تسجيل مطعم جديد</summary>
    [HttpPost]
    [Authorize]
    [SwaggerOperation(Summary = "تسجيل مطعم جديد")]
    public async Task<IActionResult> Create(
        [FromBody] CreateRestaurantRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateRestaurantCommand(request), ct);
        return FromResult(result);
    }

    /// <summary>تغيير حالة المطعم (مفتوح/مغلق)</summary>
    [HttpPut("{id:guid}/open-status")]
    [Authorize]
    [SwaggerOperation(Summary = "تغيير حالة فتح/إغلاق المطعم")]
    public async Task<IActionResult> ToggleOpen(
        Guid id, [FromBody] ToggleOpenRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new ToggleRestaurantOpenCommand(id, request.IsOpen), ct);
        return FromResult(result);
    }

    /// <summary>تحليلات المطعم</summary>
    [HttpGet("{id:guid}/analytics")]
    [Authorize]
    [SwaggerOperation(Summary = "تحليلات الإيرادات والطلبات")]
    public async Task<IActionResult> GetAnalytics(
        Guid id, [FromQuery] int days = 7, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetRestaurantAnalyticsQuery(id, days), ct);
        return FromResult(result);
    }
}

public record ToggleOpenRequest(bool IsOpen);
