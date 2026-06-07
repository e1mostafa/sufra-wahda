using SufraWahda.Domain.Enums;

namespace SufraWahda.Application.Common.Interfaces;

// ─── Current User Service ─────────────────────────────────────────────────────
public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Phone { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin => Role is UserRole.Admin or UserRole.SuperAdmin;
    bool IsRestaurantOwner => Role == UserRole.RestaurantOwner;
    bool IsDriver => Role == UserRole.Driver;
    bool IsCustomer => Role == UserRole.Customer;
}

// ─── JWT Service ──────────────────────────────────────────────────────────────
public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string phone, UserRole role);
    string GenerateRefreshToken();
    (Guid userId, UserRole role)? ValidateToken(string token);
}

// ─── Storage Service (Cloudinary) ─────────────────────────────────────────────
public interface IStorageService
{
    Task<string> UploadImageAsync(Stream imageStream, string fileName, string folder, CancellationToken ct = default);
    Task<bool> DeleteImageAsync(string publicId, CancellationToken ct = default);
    string GetOptimizedUrl(string publicId, int width = 800, int height = 600);
}

// ─── SMS Service ──────────────────────────────────────────────────────────────
public interface ISmsService
{
    Task SendOtpAsync(string phone, string code, CancellationToken ct = default);
    Task SendOrderStatusAsync(string phone, string message, CancellationToken ct = default);
}

// ─── Email Service ────────────────────────────────────────────────────────────
public interface IEmailService
{
    Task SendWelcomeAsync(string email, string name, CancellationToken ct = default);
    Task SendOrderConfirmationAsync(string email, string orderNumber, CancellationToken ct = default);
}

// ─── Push Notification Service ────────────────────────────────────────────────
public interface IPushNotificationService
{
    Task SendToUserAsync(Guid userId, string title, string body, object? data = null, CancellationToken ct = default);
    Task SendToMultipleAsync(IEnumerable<Guid> userIds, string title, string body, CancellationToken ct = default);
    Task SendToTopicAsync(string topic, string title, string body, CancellationToken ct = default);
}

// ─── Real-time Hub Service ────────────────────────────────────────────────────
public interface IRealtimeService
{
    Task NotifyOrderStatusChangeAsync(Guid orderId, string newStatus, CancellationToken ct = default);
    Task NotifyRestaurantNewOrderAsync(Guid restaurantId, Guid orderId, CancellationToken ct = default);
    Task NotifyDriverLocationAsync(Guid orderId, decimal lat, decimal lng, CancellationToken ct = default);
}

// ─── Payment Service ──────────────────────────────────────────────────────────
public interface IPaymentService
{
    Task<PaymentInitResult> InitiatePaymentAsync(PaymentRequest request, CancellationToken ct = default);
    Task<bool> VerifyPaymentAsync(string reference, CancellationToken ct = default);
    Task<bool> RefundAsync(string reference, decimal amount, CancellationToken ct = default);
}

public record PaymentRequest(
    string OrderNumber,
    decimal Amount,
    string CustomerPhone,
    string CustomerEmail,
    Domain.Enums.PaymentMethod Method,
    string ReturnUrl,
    string WebhookUrl);

public record PaymentInitResult(
    bool Success,
    string? PaymentUrl,
    string? Reference,
    string? Error);

// ─── Cache Service ────────────────────────────────────────────────────────────
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default);
}

// ─── Maps Service ─────────────────────────────────────────────────────────────
public interface IMapsService
{
    Task<double> CalculateDistanceKmAsync(decimal fromLat, decimal fromLng, decimal toLat, decimal toLng);
    Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken ct = default);
}

public record GeocodingResult(decimal Latitude, decimal Longitude, string FormattedAddress);
