using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Application.Common.Models;
using SufraWahda.Application.DTOs;
using SufraWahda.Application.Features.Restaurants;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Interfaces;
using Swashbuckle.AspNetCore.Annotations;

namespace SufraWahda.API.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/[controller]")]
[Produces("application/json")]
[Authorize(Policy = "AdminOnly")]
[SwaggerTag("Admin — لوحة الإدارة")]
public abstract class AdminBaseController : BaseController { }

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
[SwaggerTag("Admin Dashboard")]
public class DashboardController : AdminBaseController
{
    private readonly IOrderRepository _orders;
    private readonly IRestaurantRepository _restaurants;
    private readonly IUserRepository _users;

    public DashboardController(
        IOrderRepository orders,
        IRestaurantRepository restaurants,
        IUserRepository users)
    {
        _orders = orders; _restaurants = restaurants; _users = users;
    }

    [HttpGet]
    [SwaggerOperation(Summary = "إحصائيات المنصة العامة")]
    public async Task<IActionResult> GetDashboard(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;

        var (todayRevenue, todayOrders) = await _orders.GetRevenueAsync(
            Guid.Empty, today, today.AddDays(1), ct);

        // Aggregate queries
        var totalRestaurants = await _restaurants.CountAsync(null, ct);
        var activeRestaurants = await _restaurants.CountAsync(
            r => r.Status == RestaurantStatus.Active, ct);
        var pendingRestaurants = await _restaurants.CountAsync(
            r => r.Status == RestaurantStatus.PendingApproval, ct);
        var totalCustomers = await _users.CountAsync(
            u => u.Role == UserRole.Customer, ct);
        var totalDrivers = await _users.CountAsync(
            u => u.Role == UserRole.Driver, ct);

        var dto = new AdminDashboardDto(
            totalRestaurants, activeRestaurants, pendingRestaurants,
            totalCustomers, totalDrivers, 0,
            todayOrders, todayRevenue, todayRevenue * 0.15m,
            0, 0, 0);

        return Ok(new ApiResponse<AdminDashboardDto>
        {
            Success = true, Data = dto, Message = "تم"
        });
    }
}

// ─── Admin Restaurants ────────────────────────────────────────────────────────
[Route("api/v1/admin/restaurants")]
[Authorize(Policy = "AdminOnly")]
[SwaggerTag("Admin Restaurants Management")]
public class AdminRestaurantsController : AdminBaseController
{
    private readonly IMediator _mediator;
    private readonly IRestaurantRepository _restaurants;
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUserService _currentUser;

    public AdminRestaurantsController(
        IMediator mediator, IRestaurantRepository restaurants,
        IUnitOfWork uow, ICurrentUserService currentUser)
    {
        _mediator = mediator; _restaurants = restaurants;
        _uow = uow; _currentUser = currentUser;
    }

    [HttpGet]
    [SwaggerOperation(Summary = "جميع المطاعم")]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetRestaurantsQuery(page, pageSize, search), ct);
        return PagedResult(result);
    }

    [HttpGet("pending")]
    [SwaggerOperation(Summary = "المطاعم في انتظار الموافقة")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var pending = await _restaurants.GetPendingApprovalAsync(ct);
        var dtos = pending.Select(r => new
        {
            r.Id, r.NameAr, r.Phone, r.Address, r.City,
            r.CreatedAt, OwnerName = r.Owner.FullName, OwnerPhone = r.Owner.Phone
        });
        return Ok(new ApiResponse<object> { Success = true, Data = dtos });
    }

    [HttpPut("{id:guid}/approve")]
    [SwaggerOperation(Summary = "الموافقة على مطعم")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var restaurant = await _restaurants.GetByIdAsync(id, ct);
        if (restaurant == null) return NotFound();

        restaurant.Approve(_currentUser.UserId!.Value);
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم الموافقة على المطعم" });
    }

    [HttpPut("{id:guid}/reject")]
    [SwaggerOperation(Summary = "رفض مطعم مع سبب")]
    public async Task<IActionResult> Reject(
        Guid id, [FromBody] RejectRestaurantRequest req, CancellationToken ct)
    {
        var restaurant = await _restaurants.GetByIdAsync(id, ct);
        if (restaurant == null) return NotFound();

        restaurant.Reject(req.Reason);
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم رفض المطعم" });
    }

    [HttpPut("{id:guid}/suspend")]
    [SwaggerOperation(Summary = "تعليق مطعم")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        var restaurant = await _restaurants.GetByIdAsync(id, ct);
        if (restaurant == null) return NotFound();

        restaurant.Status = RestaurantStatus.Suspended;
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم تعليق المطعم" });
    }

    [HttpPut("{id:guid}/commission")]
    [SwaggerOperation(Summary = "تعديل نسبة العمولة")]
    public async Task<IActionResult> UpdateCommission(
        Guid id, [FromBody] UpdateCommissionRequest req, CancellationToken ct)
    {
        var restaurant = await _restaurants.GetByIdAsync(id, ct);
        if (restaurant == null) return NotFound();

        restaurant.CommissionPercentage = req.CommissionPercentage;
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم تعديل العمولة" });
    }
}

// ─── Admin Users ──────────────────────────────────────────────────────────────
[Route("api/v1/admin/users")]
[Authorize(Policy = "AdminOnly")]
[SwaggerTag("Admin Users Management")]
public class AdminUsersController : AdminBaseController
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;

    public AdminUsersController(IUserRepository users, IUnitOfWork uow)
    {
        _users = users; _uow = uow;
    }

    [HttpGet("customers")]
    [SwaggerOperation(Summary = "جميع العملاء")]
    public async Task<IActionResult> GetCustomers(CancellationToken ct)
    {
        var customers = await _users.FindAsync(u => u.Role == UserRole.Customer, ct);
        var dtos = customers.Select(u => new
        {
            u.Id, u.FullName, u.Phone, u.Email, u.Status,
            u.LoyaltyPoints, u.CreatedAt, u.LastLoginAt
        });
        return Ok(new ApiResponse<object> { Success = true, Data = dtos });
    }

    [HttpGet("drivers")]
    [SwaggerOperation(Summary = "جميع السائقين")]
    public async Task<IActionResult> GetDrivers(CancellationToken ct)
    {
        var drivers = await _users.FindAsync(u => u.Role == UserRole.Driver, ct);
        var dtos = drivers.Select(u => new
        {
            u.Id, u.FullName, u.Phone, u.Status,
            DriverStatus = u.DriverProfile?.Status,
            u.DriverProfile?.TotalDeliveries,
            u.DriverProfile?.AverageRating,
            u.CreatedAt
        });
        return Ok(new ApiResponse<object> { Success = true, Data = dtos });
    }

    [HttpPut("{id:guid}/suspend")]
    [SwaggerOperation(Summary = "تعليق مستخدم")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return NotFound();
        user.Status = UserStatus.Suspended;
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم تعليق الحساب" });
    }

    [HttpPut("{id:guid}/activate")]
    [SwaggerOperation(Summary = "تفعيل مستخدم")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user == null) return NotFound();
        user.Status = UserStatus.Active;
        await _uow.SaveChangesAsync(ct);
        return Ok(new { Success = true, Message = "تم تفعيل الحساب" });
    }
}
