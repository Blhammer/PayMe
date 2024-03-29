﻿using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using PayMe.API.Models;
using PayMe.API.Services;
using PayMe.Domain.Entities;
using PayMe.Infrastructure.Email;

namespace PayMe.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly Token _tokenService;
        private readonly EmailSender _emailSender;

        public AccountController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            Token tokenService,
            EmailSender emailSender)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _emailSender = emailSender;
        }

        /// <summary>
        /// Login Service
        /// </summary>
        /// <param name="loginDto"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<ProfileUserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.Users.Include(p => p.Photos)
                .FirstOrDefaultAsync(y => y.Email == loginDto.Email);

            if (user == null) return Unauthorized("Invalid email");

            if (!user.EmailConfirmed) return Unauthorized("Email not confirmed");

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (result.Succeeded)
            {
                await SetRefreshToken(user);

                return CreateUserObject(user);
            }

            return Unauthorized("Invalid password");
        }

        /// <summary>
        /// Register Service with email confirmation
        /// </summary>
        /// <param name="registerDto"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<ProfileUserDto>> Register(RegisterDto registerDto)
        {
            if (await _userManager.Users.AnyAsync(x => x.Email == registerDto.Email))
            {
                ModelState.AddModelError("email", "Email taken!");
                return ValidationProblem();
            }

            if (await _userManager.Users.AnyAsync(x => x.UserName == registerDto.Username))
            {
                ModelState.AddModelError("username", "Username taken!");
                return ValidationProblem();
            }

            var user = new AppUser
            {
                UserName = registerDto.Username,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Age = registerDto.Age,
                Email = registerDto.Email,
                Bio = ""
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded) return BadRequest("Problem registering user");

            var origin = Request.Headers["origin"];

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var verifyUrl = $"{origin}/account/verifyEmail?token={token}&email={user.Email}";
            var message =
                $"<p>Please click the link to verify your email address:</p><p><a href='{verifyUrl}'>Click to verify email</a></p>";

            await _emailSender.SendEmailAsync(user.Email, "Please verify email", message);

            return Ok("Registration success - please verify email");
        }

        [AllowAnonymous]
        [HttpGet("doesEmailExist")]
        public async Task<IActionResult> CheckEmailExists(string email)
        {
            var userEmail = await _userManager.FindByEmailAsync(email);

            if (userEmail != null)
            {
                return Ok(new { doesEmailExist = true });
            }

            return Ok(new { doesEmailExist = false });
        }

        /// <summary>
        /// Reset a password.
        /// </summary>
        /// <param name="resetPasswordUserDto">A new password passed as an argument</param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPut("resetPassword")]
        public async Task<ActionResult<ResetPasswordUserDto>> ResetPassword(ResetPasswordUserDto resetPasswordUserDto)
        {
            var user = await _userManager.Users.SingleOrDefaultAsync(x => x.Email == resetPasswordUserDto.Email);
            if (user == null)
            {
                return NotFound("User not found!");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var decodedTokenBytes = WebEncoders.Base64UrlDecode(token);
            var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

            var result = await _userManager.ResetPasswordAsync(user, decodedToken, resetPasswordUserDto.Password);
            if (!result.Succeeded)
            {
                return BadRequest("Password reset failed");
            }

            return Ok("Password reset successfully!");
        }

        /// <summary>
        /// Verification of the email used to register
        /// </summary>
        /// <param name="token"></param>
        /// <param name="email"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpPost("verifyEmail")]
        public async Task<IActionResult> VerifyEmail(string token, string email)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null) return Unauthorized();

            var decodedTokenBytes = WebEncoders.Base64UrlDecode(token);
            var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);
            var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

            if (!result.Succeeded) return BadRequest("Could not verify email address");

            return Ok("Email confirmed - you can now login");
        }

        /// <summary>
        /// Resend the verification of the email used to register again
        /// </summary>
        /// <param name="email"></param>
        /// <returns></returns>
        [AllowAnonymous]
        [HttpGet("resendEmailConfirmationLink")]
        public async Task<IActionResult> ResendEmailConfirmationLink(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null) return Unauthorized();

            var origin = Request.Headers["origin"];
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));

            var verifyUrl = $"{origin}/account/verifyEmail?token={token}&email={user.Email}";
            var message =
                $"<p>Please click the below link to verify your email address:</p><p><a href='{verifyUrl}'>Click to verify email</a></p>";

            await _emailSender.SendEmailAsync(user.Email, "Please verify email", message);

            return Ok("Email verification link resent");
        }

        /// <summary>
        /// Get current user, used in the client app
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpGet]
        public async Task<ActionResult<ProfileUserDto>> GetCurrentUser()
        {
            var user = await _userManager.Users 
                .FirstOrDefaultAsync(x => x.Email == User.FindFirstValue(ClaimTypes.Email));

            await SetRefreshToken(user!);

            return CreateUserObject(user!);
        }

        /// <summary>
        /// User object created after login
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        private ProfileUserDto CreateUserObject(AppUser user)
        {
            return new ProfileUserDto
            {
                Username = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Age = user.Age,
                Bio = user.Bio,
                RoleName = user.RoleName,
                Token = _tokenService.CreateToken(user),
                Image = user.Photos.FirstOrDefault(x => x.IsMain)?.Url!
            };
        }

        /// <summary>
        /// Refresh expired token service
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpPost("refreshToken")]
        public async Task<ActionResult<ProfileUserDto>> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            
            var user = await _userManager.Users
                .Include(r => r.RefreshTokens)
                .Include(p => p.Photos)
                .FirstOrDefaultAsync(x =>
                    x.UserName == User.FindFirstValue(ClaimTypes.Name));

            if (user == null) return Unauthorized();

            var oldToken = user.RefreshTokens.SingleOrDefault(x =>
                x.Token == refreshToken);

            if (oldToken != null && !oldToken.IsActive) return Unauthorized();

            return CreateUserObject(user);
        }

        /// <summary>
        /// Refresh token service
        /// </summary>
        /// <param name="user"></param>
        private async Task SetRefreshToken(AppUser user)
        {
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshTokens = new List<RefreshToken>();

            user.RefreshTokens.Add(refreshToken);

            await _userManager.UpdateAsync(user);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("refreshToken", refreshToken.Token, cookieOptions);
        }
    }
}