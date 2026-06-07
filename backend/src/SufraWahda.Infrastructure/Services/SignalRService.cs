using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using SufraWahda.Application.Common.Interfaces;

namespace SufraWahda.Infrastructure.Services;

// ─── SignalR Hub Interfaces ───────────────────────────────────────────────────
public interface IOrderHubClient
{
    Task OrderStatusChanged(object payload);
    Task DriverLocationUpdated(object payload);
    Task NewOrderReceived(object payload);
}

// ─── SignalR Realtime Service ─────────────────────────────────────────────────
public class SignalRRealtimeService : IRealtimeService
{
    private readonly IHubContext<OrderHub, IOrderHubClient> _hub;
    private readonly ILogger<SignalRRealtimeService> _logger;

    public SignalRRealtimeService(
        IHubContext<OrderHub, IOrderHubClient> hub,
        ILogger<SignalRRealtimeService> logger)
    {
        _hub = hub;
        _logger = logger;
    }

    public async Task NotifyOrderStatusChangeAsync(
        Guid orderId, string newStatus, CancellationToken ct = default)
    {
        var payload = new { OrderId = orderId, Status = newStatus, UpdatedAt = DateTime.UtcNow };
        await _hub.Clients.Group($"order:{orderId}")
            .OrderStatusChanged(payload);
        _logger.LogInformation("Notified order {OrderId} status: {Status}", orderId, newStatus);
    }

    public async Task NotifyRestaurantNewOrderAsync(
        Guid restaurantId, Guid orderId, CancellationToken ct = default)
    {
        var payload = new { OrderId = orderId, ReceivedAt = DateTime.UtcNow };
        await _hub.Clients.Group($"restaurant:{restaurantId}")
            .NewOrderReceived(payload);
    }

    public async Task NotifyDriverLocationAsync(
        Guid orderId, decimal lat, decimal lng, CancellationToken ct = default)
    {
        var payload = new { OrderId = orderId, Lat = lat, Lng = lng, At = DateTime.UtcNow };
        await _hub.Clients.Group($"order:{orderId}")
            .DriverLocationUpdated(payload);
    }
}

// ─── Order Hub ────────────────────────────────────────────────────────────────
public class OrderHub : Hub<IOrderHubClient>
{
    private readonly ILogger<OrderHub> _logger;

    public OrderHub(ILogger<OrderHub> logger) => _logger = logger;

    public async Task JoinOrderGroup(string orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order:{orderId}");
        _logger.LogInformation("Client joined order group: {OrderId}", orderId);
    }

    public async Task JoinRestaurantGroup(string restaurantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"restaurant:{restaurantId}");
        _logger.LogInformation("Restaurant {RestaurantId} connected", restaurantId);
    }

    public async Task UpdateDriverLocation(string orderId, decimal lat, decimal lng)
    {
        var payload = new { OrderId = orderId, Lat = lat, Lng = lng, At = DateTime.UtcNow };
        await Clients.Group($"order:{orderId}").DriverLocationUpdated(payload);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}

// ─── Notification Hub ─────────────────────────────────────────────────────────
public class NotificationHub : Hub
{
    public async Task JoinUserGroup(string userId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
}
