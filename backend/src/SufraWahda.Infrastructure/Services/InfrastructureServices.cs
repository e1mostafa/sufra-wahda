using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Domain.Enums;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace SufraWahda.Infrastructure.Services;

// ─── JWT Service ──────────────────────────────────────────────────────────────
public class JwtService : IJwtService
{
    private readonly IConfiguration _config;
    private readonly SymmetricSecurityKey _key;

    public JwtService(IConfiguration config)
    {
        _config = config;
        _key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:Secret"]
                ?? throw new InvalidOperationException("Jwt:Secret is required")));
    }

    public string GenerateAccessToken(Guid userId, string phone, UserRole role)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("phone", phone),
            new Claim(ClaimTypes.Role, role.ToString()),
            new Claim("userId", userId.ToString())
        };

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(
            int.Parse(_config["Jwt:AccessTokenExpiryMinutes"] ?? "15"));

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public (Guid userId, UserRole role)? ValidateToken(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var validParams = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = _key,
                ValidateIssuer = true,
                ValidIssuer = _config["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _config["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = handler.ValidateToken(token, validParams, out _);
            var userIdClaim = principal.FindFirst("userId")?.Value;
            var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;

            if (userIdClaim == null || roleClaim == null) return null;
            if (!Guid.TryParse(userIdClaim, out var userId)) return null;
            if (!Enum.TryParse<UserRole>(roleClaim, out var role)) return null;

            return (userId, role);
        }
        catch { return null; }
    }
}

// ─── Redis Cache Service ──────────────────────────────────────────────────────
public class RedisCacheService : ICacheService
{
    private readonly IDatabase _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _db = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        try
        {
            var val = await _db.StringGetAsync(key);
            if (!val.HasValue) return default;
            return JsonSerializer.Deserialize<T>(val!);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis GET failed for key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        try
        {
            var json = JsonSerializer.Serialize(value);
            await _db.StringSetAsync(key, json, expiry ?? TimeSpan.FromHours(1));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try { await _db.KeyDeleteAsync(key); }
        catch (Exception ex) { _logger.LogWarning(ex, "Redis DEL failed for key: {Key}", key); }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        try
        {
            var server = _db.Multiplexer.GetServer(_db.Multiplexer.GetEndPoints().First());
            var keys = server.Keys(pattern: $"{prefix}*").ToArray();
            if (keys.Length > 0) await _db.KeyDeleteAsync(keys);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Redis prefix delete failed: {Prefix}", prefix); }
    }
}

// ─── Cloudinary Storage Service ───────────────────────────────────────────────
public class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryStorageService> _logger;

    public CloudinaryStorageService(IConfiguration config, ILogger<CloudinaryStorageService> logger)
    {
        _logger = logger;
        var account = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
    }

    public async Task<string> UploadImageAsync(
        Stream imageStream, string fileName, string folder, CancellationToken ct = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, imageStream),
            Folder = $"sufra-wahda/{folder}",
            Transformation = new Transformation()
                .Quality("auto").FetchFormat("auto"),
            Overwrite = false
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        if (result.Error != null)
        {
            _logger.LogError("Cloudinary upload error: {Error}", result.Error.Message);
            throw new InvalidOperationException($"فشل رفع الصورة: {result.Error.Message}");
        }

        return result.SecureUrl.ToString();
    }

    public async Task<bool> DeleteImageAsync(string publicId, CancellationToken ct = default)
    {
        var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId));
        return result.Result == "ok";
    }

    public string GetOptimizedUrl(string publicId, int width = 800, int height = 600)
        => _cloudinary.Api.UrlImgUp
            .Transform(new Transformation().Width(width).Height(height)
                .Crop("fill").Quality("auto").FetchFormat("auto"))
            .BuildUrl(publicId);
}

// ─── SMS Service (Vonage) ─────────────────────────────────────────────────────
public class VonageSmsService : ISmsService
{
    private readonly IConfiguration _config;
    private readonly ILogger<VonageSmsService> _logger;
    private readonly HttpClient _http;

    public VonageSmsService(
        IConfiguration config, ILogger<VonageSmsService> logger, HttpClient http)
    {
        _config = config; _logger = logger; _http = http;
    }

    public async Task SendOtpAsync(string phone, string code, CancellationToken ct = default)
    {
        var message = $"سُفرة واحدة: رمز التحقق الخاص بك هو {code}. صالح لمدة 5 دقائق.";
        await SendAsync(phone, message, ct);
    }

    public async Task SendOrderStatusAsync(string phone, string message, CancellationToken ct = default)
        => await SendAsync(phone, message, ct);

    private async Task SendAsync(string phone, string message, CancellationToken ct)
    {
        try
        {
            var apiKey = _config["Vonage:ApiKey"];
            var apiSecret = _config["Vonage:ApiSecret"];

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                _logger.LogWarning("[DEV MODE] SMS to {Phone}: {Message}", phone, message);
                return;
            }

            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["api_key"] = apiKey,
                ["api_secret"] = apiSecret,
                ["to"] = phone.Replace("+", "").Replace("-", "").Replace(" ", ""),
                ["from"] = "SufraWahda",
                ["text"] = message
            });

            var response = await _http.PostAsync(
                "https://rest.nexmo.com/sms/json", content, ct);

            if (!response.IsSuccessStatusCode)
                _logger.LogError("SMS failed to {Phone}: {Status}", phone, response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS exception for {Phone}", phone);
        }
    }
}

// ─── Email Service (SendGrid) ─────────────────────────────────────────────────
public class SendGridEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendGridEmailService> _logger;
    private readonly HttpClient _http;

    public SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger, HttpClient http)
    {
        _config = config; _logger = logger; _http = http;
    }

    public async Task SendWelcomeAsync(string email, string name, CancellationToken ct = default)
    {
        var subject = "أهلاً بك في سُفرة واحدة! 🍽️";
        var body = $"<div dir='rtl'><h2>أهلاً {name}!</h2><p>يسعدنا انضمامك لعائلة سُفرة واحدة.</p></div>";
        await SendAsync(email, subject, body, ct);
    }

    public async Task SendOrderConfirmationAsync(string email, string orderNumber, CancellationToken ct = default)
    {
        var subject = $"تأكيد الطلب #{orderNumber}";
        var body = $"<div dir='rtl'><h2>طلبك رقم {orderNumber} تم استلامه!</h2></div>";
        await SendAsync(email, subject, body, ct);
    }

    private async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct)
    {
        try
        {
            var apiKey = _config["SendGrid:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogWarning("[DEV] Email to {To}: {Subject}", to, subject);
                return;
            }

            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                personalizations = new[] { new { to = new[] { new { email = to } } } },
                from = new { email = "noreply@sufra-wahda.com", name = "سُفرة واحدة" },
                subject,
                content = new[] { new { type = "text/html", value = htmlBody } }
            };

            await _http.PostAsJsonAsync("https://api.sendgrid.com/v3/mail/send", payload, ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email failed to {To}", to);
        }
    }
}

// ─── Firebase Push Notification Service ──────────────────────────────────────
public class FirebasePushService : IPushNotificationService
{
    private readonly ILogger<FirebasePushService> _logger;
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public FirebasePushService(
        ILogger<FirebasePushService> logger, IConfiguration config, HttpClient http)
    {
        _logger = logger; _config = config; _http = http;
    }

    public async Task SendToUserAsync(
        Guid userId, string title, string body, object? data = null, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "[Push] To user {UserId}: {Title} - {Body}", userId, title, body);
        // Production: lookup FCM token from DB, call FCM API
        await Task.CompletedTask;
    }

    public async Task SendToMultipleAsync(
        IEnumerable<Guid> userIds, string title, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("[Push] Broadcast to {Count} users: {Title}", userIds.Count(), title);
        await Task.CompletedTask;
    }

    public async Task SendToTopicAsync(
        string topic, string title, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("[Push] Topic {Topic}: {Title}", topic, body);
        await Task.CompletedTask;
    }
}

// ─── Payment Service (Fawry + Stripe stub) ───────────────────────────────────
public class PaymentService : IPaymentService
{
    private readonly IConfiguration _config;
    private readonly ILogger<PaymentService> _logger;
    private readonly HttpClient _http;

    public PaymentService(IConfiguration config, ILogger<PaymentService> logger, HttpClient http)
    {
        _config = config; _logger = logger; _http = http;
    }

    public async Task<PaymentInitResult> InitiatePaymentAsync(
        PaymentRequest request, CancellationToken ct = default)
    {
        return request.Method switch
        {
            Domain.Enums.PaymentMethod.Fawry => await InitiateFawryAsync(request, ct),
            Domain.Enums.PaymentMethod.Visa or
            Domain.Enums.PaymentMethod.Mastercard => await InitiateStripeAsync(request, ct),
            Domain.Enums.PaymentMethod.Cash =>
                new PaymentInitResult(true, null, $"CASH-{request.OrderNumber}", null),
            _ => new PaymentInitResult(false, null, null, "طريقة دفع غير مدعومة")
        };
    }

    public async Task<bool> VerifyPaymentAsync(string reference, CancellationToken ct = default)
    {
        _logger.LogInformation("Verifying payment: {Ref}", reference);
        return await Task.FromResult(true); // stub
    }

    public async Task<bool> RefundAsync(string reference, decimal amount, CancellationToken ct = default)
    {
        _logger.LogInformation("Refunding {Amount} for {Ref}", amount, reference);
        return await Task.FromResult(true); // stub
    }

    private async Task<PaymentInitResult> InitiateFawryAsync(
        PaymentRequest req, CancellationToken ct)
    {
        try
        {
            var merchantCode = _config["Fawry:MerchantCode"] ?? "";
            var securityKey = _config["Fawry:SecurityKey"] ?? "";

            if (string.IsNullOrEmpty(merchantCode))
            {
                _logger.LogWarning("[DEV] Fawry payment simulated for {Order}", req.OrderNumber);
                return new PaymentInitResult(true, null, $"FAWRY-{req.OrderNumber}", null);
            }

            var referenceNumber = $"SW-{req.OrderNumber}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
            var payload = new
            {
                merchantCode,
                merchantRefNum = referenceNumber,
                customerMobile = req.CustomerPhone,
                customerEmail = req.CustomerEmail,
                customerName = "Customer",
                chargeItems = new[]
                {
                    new
                    {
                        itemId = req.OrderNumber,
                        description = $"طلب رقم {req.OrderNumber}",
                        price = req.Amount,
                        quantity = 1
                    }
                },
                returnUrl = req.ReturnUrl,
                authCaptureModePayment = false
            };

            return new PaymentInitResult(
                true,
                $"https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge?{referenceNumber}",
                referenceNumber, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fawry payment initiation failed");
            return new PaymentInitResult(false, null, null, "فشل في بدء عملية الدفع");
        }
    }

    private async Task<PaymentInitResult> InitiateStripeAsync(
        PaymentRequest req, CancellationToken ct)
    {
        try
        {
            var secretKey = _config["Stripe:SecretKey"] ?? "";
            if (string.IsNullOrEmpty(secretKey))
            {
                return new PaymentInitResult(true,
                    $"https://checkout.stripe.com/pay/test_{req.OrderNumber}",
                    $"STRIPE-{req.OrderNumber}", null);
            }
            // Production: create Stripe PaymentIntent or Checkout Session
            return new PaymentInitResult(true, null, $"STRIPE-{req.OrderNumber}", null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Stripe payment failed");
            return new PaymentInitResult(false, null, null, "فشل في الدفع");
        }
    }
}

// ─── Google Maps Service ──────────────────────────────────────────────────────
public class GoogleMapsService : IMapsService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;
    private readonly ILogger<GoogleMapsService> _logger;

    public GoogleMapsService(IConfiguration config, HttpClient http, ILogger<GoogleMapsService> logger)
    {
        _config = config; _http = http; _logger = logger;
    }

    public Task<double> CalculateDistanceKmAsync(
        decimal fromLat, decimal fromLng, decimal toLat, decimal toLng)
    {
        // Haversine formula
        const double R = 6371;
        var dLat = ToRad((double)(toLat - fromLat));
        var dLon = ToRad((double)(toLng - fromLng));
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
              + Math.Cos(ToRad((double)fromLat)) * Math.Cos(ToRad((double)toLat))
              * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Task.FromResult(R * c);
    }

    public async Task<GeocodingResult?> GeocodeAsync(string address, CancellationToken ct = default)
    {
        try
        {
            var apiKey = _config["GoogleMaps:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return new GeocodingResult(30.7492m, 31.0m, address); // Minya default

            var url = $"https://maps.googleapis.com/maps/api/geocode/json" +
                      $"?address={Uri.EscapeDataString(address + ", المنيا, مصر")}&key={apiKey}&language=ar";

            var response = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            var results = response.GetProperty("results");
            if (results.GetArrayLength() == 0) return null;

            var location = results[0].GetProperty("geometry").GetProperty("location");
            return new GeocodingResult(
                (decimal)location.GetProperty("lat").GetDouble(),
                (decimal)location.GetProperty("lng").GetDouble(),
                results[0].GetProperty("formatted_address").GetString() ?? address);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Geocoding failed for: {Address}", address);
            return null;
        }
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;
}

// ─── Current User Service ─────────────────────────────────────────────────────
public class CurrentUserService : ICurrentUserService
{
    public Guid? UserId { get; }
    public string? Phone { get; }
    public UserRole? Role { get; }
    public bool IsAuthenticated { get; }

    public CurrentUserService(Microsoft.AspNetCore.Http.IHttpContextAccessor httpContext)
    {
        var user = httpContext.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true) return;

        IsAuthenticated = true;
        var userIdClaim = user.FindFirst("userId")?.Value;
        if (Guid.TryParse(userIdClaim, out var id)) UserId = id;
        Phone = user.FindFirst("phone")?.Value;

        var roleClaim = user.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (Enum.TryParse<UserRole>(roleClaim, out var role)) Role = role;
    }
}
