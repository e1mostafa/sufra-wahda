using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SufraWahda.Application.Common.Interfaces;
using SufraWahda.Application.Common.Models;
using SufraWahda.Application.DTOs;
using SufraWahda.Domain.Entities;
using SufraWahda.Domain.Enums;
using SufraWahda.Domain.Interfaces;

namespace SufraWahda.Application.Features.Auth;

// ─── Register ─────────────────────────────────────────────────────────────────
public record RegisterCommand(RegisterRequest Request) : IRequest<Result<AuthResponse>>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Request.FullName)
            .NotEmpty().WithMessage("الاسم مطلوب")
            .MaximumLength(100).WithMessage("الاسم لا يتجاوز 100 حرف");

        RuleFor(x => x.Request.Phone)
            .NotEmpty().WithMessage("رقم الهاتف مطلوب")
            .Matches(@"^(\+20|0020|0)?1[0125][0-9]{8}$").WithMessage("رقم الهاتف غير صحيح");

        RuleFor(x => x.Request.Password)
            .NotEmpty().WithMessage("كلمة المرور مطلوبة")
            .MinimumLength(8).WithMessage("كلمة المرور لا تقل عن 8 أحرف");

        RuleFor(x => x.Request.Email)
            .EmailAddress().WithMessage("البريد الإلكتروني غير صحيح")
            .When(x => !string.IsNullOrEmpty(x.Request.Email));
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwt;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        IUserRepository users, IUnitOfWork uow,
        IJwtService jwt, ILogger<RegisterCommandHandler> logger)
    {
        _users = users; _uow = uow; _jwt = jwt; _logger = logger;
    }

    public async Task<Result<AuthResponse>> Handle(RegisterCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        if (await _users.PhoneExistsAsync(req.Phone, ct))
            return Result<AuthResponse>.Conflict("رقم الهاتف مسجل مسبقاً");

        var user = new User
        {
            FullName = req.FullName,
            Phone = NormalizePhone(req.Phone),
            Email = req.Email?.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = UserRole.Customer,
            Status = UserStatus.PendingVerification,
            ReferralCode = GenerateReferralCode(req.FullName),
            IsPhoneVerified = false
        };

        if (!string.IsNullOrEmpty(req.ReferralCode))
        {
            var referrer = await _users.GetByReferralCodeAsync(req.ReferralCode, ct);
            if (referrer != null) user.ReferredBy = referrer.Id;
        }

        await _users.AddAsync(user, ct);

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Phone, user.Role);
        var refreshToken = _jwt.GenerateRefreshToken();

        user.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _uow.SaveChangesAsync(ct);
        _logger.LogInformation("New customer registered: {Phone}", user.Phone);

        return Result<AuthResponse>.Created(new AuthResponse(
            accessToken, refreshToken, DateTime.UtcNow.AddMinutes(15),
            MapToDto(user)));
    }

    private static string NormalizePhone(string phone)
    {
        phone = phone.Trim().Replace(" ", "").Replace("-", "");
        if (phone.StartsWith("+20")) return "0" + phone[3..];
        if (phone.StartsWith("0020")) return "0" + phone[4..];
        return phone;
    }

    private static string GenerateReferralCode(string name)
    {
        var prefix = name.Length >= 3 ? name[..3].ToUpper() : name.ToUpper();
        return prefix + Random.Shared.Next(10000, 99999);
    }

    private static UserDto MapToDto(User u) => new(
        u.Id, u.FullName, u.Phone, u.Email,
        u.ProfileImageUrl, u.Role, u.LoyaltyPoints,
        u.ReferralCode, u.IsPhoneVerified);
}

// ─── Login ────────────────────────────────────────────────────────────────────
public record LoginCommand(LoginRequest Request) : IRequest<Result<AuthResponse>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Request.Phone).NotEmpty().WithMessage("رقم الهاتف مطلوب");
        RuleFor(x => x.Request.Password).NotEmpty().WithMessage("كلمة المرور مطلوبة");
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwt;

    public LoginCommandHandler(IUserRepository users, IUnitOfWork uow, IJwtService jwt)
    {
        _users = users; _uow = uow; _jwt = jwt;
    }

    public async Task<Result<AuthResponse>> Handle(LoginCommand cmd, CancellationToken ct)
    {
        var user = await _users.GetByPhoneAsync(NormalizePhone(cmd.Request.Phone), ct);

        if (user == null || !BCrypt.Net.BCrypt.Verify(cmd.Request.Password, user.PasswordHash))
            return Result<AuthResponse>.Failure("رقم الهاتف أو كلمة المرور غير صحيحة", 401);

        if (user.Status == UserStatus.Suspended)
            return Result<AuthResponse>.Forbidden("الحساب موقوف. تواصل مع الدعم");

        var accessToken = _jwt.GenerateAccessToken(user.Id, user.Phone, user.Role);
        var refreshToken = _jwt.GenerateRefreshToken();

        // Revoke old tokens
        foreach (var t in user.RefreshTokens.Where(t => t.IsActive))
            t.IsRevoked = true;

        user.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
        user.LastLoginAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync(ct);

        return Result<AuthResponse>.Success(new AuthResponse(
            accessToken, refreshToken, DateTime.UtcNow.AddMinutes(15),
            new UserDto(user.Id, user.FullName, user.Phone, user.Email,
                user.ProfileImageUrl, user.Role, user.LoyaltyPoints,
                user.ReferralCode, user.IsPhoneVerified)));
    }

    private static string NormalizePhone(string phone)
    {
        phone = phone.Trim().Replace(" ", "");
        if (phone.StartsWith("+20")) return "0" + phone[3..];
        if (phone.StartsWith("0020")) return "0" + phone[4..];
        return phone;
    }
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────
public record SendOtpCommand(string Phone) : IRequest<Result<string>>;

public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand, Result<string>>
{
    private readonly IUnitOfWork _uow;
    private readonly ISmsService _sms;
    private readonly ICacheService _cache;

    public SendOtpCommandHandler(IUnitOfWork uow, ISmsService sms, ICacheService cache)
    {
        _uow = uow; _sms = sms; _cache = cache;
    }

    public async Task<Result<string>> Handle(SendOtpCommand cmd, CancellationToken ct)
    {
        // Rate limit: max 3 OTPs per phone per 10 minutes
        var rateLimitKey = $"otp:ratelimit:{cmd.Phone}";
        var count = await _cache.GetAsync<int>(rateLimitKey, ct);
        if (count >= 3)
            return Result<string>.Failure("تم تجاوز الحد الأقصى لإرسال الرمز. انتظر 10 دقائق", 429);

        var code = Random.Shared.Next(100000, 999999).ToString();
        var cacheKey = $"otp:{cmd.Phone}";
        await _cache.SetAsync(cacheKey, code, TimeSpan.FromMinutes(5), ct);
        await _cache.SetAsync(rateLimitKey, count + 1, TimeSpan.FromMinutes(10), ct);

        await _sms.SendOtpAsync(cmd.Phone, code, ct);
        return Result<string>.Success("تم الإرسال", "تم إرسال رمز التحقق إلى هاتفك");
    }
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────
public record VerifyOtpCommand(string Phone, string Code) : IRequest<Result<bool>>;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, Result<bool>>
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;
    private readonly ICacheService _cache;

    public VerifyOtpCommandHandler(IUserRepository users, IUnitOfWork uow, ICacheService cache)
    {
        _users = users; _uow = uow; _cache = cache;
    }

    public async Task<Result<bool>> Handle(VerifyOtpCommand cmd, CancellationToken ct)
    {
        var cacheKey = $"otp:{cmd.Phone}";
        var storedCode = await _cache.GetAsync<string>(cacheKey, ct);

        if (storedCode == null)
            return Result<bool>.Failure("الرمز منتهي الصلاحية أو لم يتم إرساله");

        if (storedCode != cmd.Code)
            return Result<bool>.Failure("الرمز غير صحيح");

        await _cache.RemoveAsync(cacheKey, ct);

        var user = await _users.GetByPhoneAsync(cmd.Phone, ct);
        if (user != null)
        {
            user.IsPhoneVerified = true;
            user.Status = UserStatus.Active;
            await _uow.SaveChangesAsync(ct);
        }

        return Result<bool>.Success(true, "تم التحقق بنجاح");
    }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────
public record RefreshTokenCommand(string Token) : IRequest<Result<AuthResponse>>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResponse>>
{
    private readonly IUserRepository _users;
    private readonly IUnitOfWork _uow;
    private readonly IJwtService _jwt;

    public RefreshTokenCommandHandler(IUserRepository users, IUnitOfWork uow, IJwtService jwt)
    {
        _users = users; _uow = uow; _jwt = jwt;
    }

    public async Task<Result<AuthResponse>> Handle(RefreshTokenCommand cmd, CancellationToken ct)
    {
        var users = await _users.FindAsync(
            u => u.RefreshTokens.Any(t => t.Token == cmd.Token), ct);
        var user = users.FirstOrDefault();

        if (user == null)
            return Result<AuthResponse>.Unauthorized("Refresh token غير صحيح");

        var token = user.RefreshTokens.FirstOrDefault(t => t.Token == cmd.Token);
        if (token == null || !token.IsActive)
            return Result<AuthResponse>.Unauthorized("Refresh token منتهي الصلاحية");

        token.IsRevoked = true;

        var newAccessToken = _jwt.GenerateAccessToken(user.Id, user.Phone, user.Role);
        var newRefreshToken = _jwt.GenerateRefreshToken();

        user.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, Token = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _uow.SaveChangesAsync(ct);

        return Result<AuthResponse>.Success(new AuthResponse(
            newAccessToken, newRefreshToken, DateTime.UtcNow.AddMinutes(15),
            new UserDto(user.Id, user.FullName, user.Phone, user.Email,
                user.ProfileImageUrl, user.Role, user.LoyaltyPoints,
                user.ReferralCode, user.IsPhoneVerified)));
    }
}

// ─── Get Current User ─────────────────────────────────────────────────────────
public record GetCurrentUserQuery : IRequest<Result<UserDto>>;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
{
    private readonly IUserRepository _users;
    private readonly ICurrentUserService _currentUser;

    public GetCurrentUserQueryHandler(IUserRepository users, ICurrentUserService currentUser)
    {
        _users = users; _currentUser = currentUser;
    }

    public async Task<Result<UserDto>> Handle(GetCurrentUserQuery query, CancellationToken ct)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.UserId.HasValue)
            return Result<UserDto>.Unauthorized();

        var user = await _users.GetByIdAsync(_currentUser.UserId.Value, ct);
        if (user == null) return Result<UserDto>.NotFound("المستخدم غير موجود");

        return Result<UserDto>.Success(new UserDto(
            user.Id, user.FullName, user.Phone, user.Email,
            user.ProfileImageUrl, user.Role, user.LoyaltyPoints,
            user.ReferralCode, user.IsPhoneVerified));
    }
}
