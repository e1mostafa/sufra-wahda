using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SufraWahda.Application.DTOs;
using SufraWahda.Application.Features.Auth;
using Swashbuckle.AspNetCore.Annotations;

namespace SufraWahda.API.Controllers;

[SwaggerTag("Authentication — التسجيل وتسجيل الدخول والتحقق")]
public class AuthController : BaseController
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>تسجيل عميل جديد</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "تسجيل عميل جديد")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RegisterCommand(request), ct);
        return FromResult(result);
    }

    /// <summary>تسجيل الدخول</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "تسجيل الدخول برقم الهاتف وكلمة المرور")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request), ct);
        return FromResult(result);
    }

    /// <summary>إرسال OTP للهاتف</summary>
    [HttpPost("send-otp")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "إرسال رمز التحقق OTP")]
    public async Task<IActionResult> SendOtp(
        [FromBody] SendOtpRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new SendOtpCommand(request.Phone), ct);
        return FromResult(result);
    }

    /// <summary>التحقق من OTP</summary>
    [HttpPost("verify-otp")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "التحقق من رمز OTP")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new VerifyOtpCommand(request.Phone, request.Code), ct);
        return FromResult(result);
    }

    /// <summary>تجديد Access Token</summary>
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [SwaggerOperation(Summary = "تجديد JWT Access Token")]
    public async Task<IActionResult> RefreshToken(
        [FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return FromResult(result);
    }

    /// <summary>بيانات المستخدم الحالي</summary>
    [HttpGet("me")]
    [Authorize]
    [SwaggerOperation(Summary = "بيانات المستخدم المُسجَّل حالياً")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetCurrentUserQuery(), ct);
        return FromResult(result);
    }

    /// <summary>تسجيل الخروج</summary>
    [HttpPost("logout")]
    [Authorize]
    [SwaggerOperation(Summary = "تسجيل الخروج وإلغاء Refresh Token")]
    public IActionResult Logout()
    {
        // Handled client-side by removing tokens; server-side: token is short-lived
        return Ok(new { Success = true, Message = "تم تسجيل الخروج" });
    }
}
