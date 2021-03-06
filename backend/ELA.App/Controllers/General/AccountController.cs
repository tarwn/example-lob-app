﻿using ELA.App.Controllers.Account.Models;
using ELA.App.Controllers.General.Utility;
using ELA.App.Security;
using ELA.App.StartupConfiguration;
using ELA.Common.Authentication;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ELA.App.Controllers.Account
{
    [AllowAnonymous]
    [Area("General")]
    [Route("/account")]
    public class AccountController : Controller
    {
        private ISignInManager _signInManager;
        private IAccountCookies _cookieHandler;

        public AccountController(ISignInManager signInManager, IAccountCookies cookieHandler)
        {
            _signInManager = signInManager;
            _cookieHandler = cookieHandler;
        }

        [HttpGet("login")]
        public async Task<IActionResult> LoginAsync(string returnUrl = null)
        {
            if (User.Identity.IsAuthenticated)
            {
                // they're already logged in - log them out and redirect
                //  we redirect because AntiForgery uses Principal when it generates the token so we need a clean request
                await HttpContext.SignOutAsync(SecurityConstants.CookieAuthScheme, new AuthenticationProperties()
                {
                    RedirectUri = "/account/login"
                });
            }
            return View("Login", new LoginModel { ReturnUrl = returnUrl });
        }

        [HttpPost("login")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> LoginAsync([FromForm] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                ViewData["ErrorMessage"] = "Username and password are both required";
                return View("Login", model);
            }

            var result = await _signInManager.SignInAsync(model.Username, model.Password);
            if (!result.IsSuccessful)
            {
                ViewData["ErrorMessage"] = "Username or password not found";
                return View("Login", model);
            }

            var identity = new ClaimsIdentity(new List<Claim>() {
                new Claim(ClaimNames.SessionId, result.SessionId.ToString()),
                new Claim(ClaimNames.UserId, result.UserId.ToString()),
                new Claim(ClaimNames.UserName, result.UserName)
            }, SecurityConstants.CookieAuthScheme);
            var principal = new ClaimsPrincipal(identity);
            await _cookieHandler.SignInAsync(HttpContext, SecurityConstants.CookieAuthScheme, principal);

            if (!string.IsNullOrEmpty(model.ReturnUrl))
            {
                return LocalRedirect(model.ReturnUrl);
            }

            return LocalRedirect("/");
        }

        [HttpGet("logout")]
        public async Task<IActionResult> LogoutAsync()
        {
            await _cookieHandler.SignOutAsync(HttpContext, SecurityConstants.CookieAuthScheme);
            return View("Logout");
        }


        [HttpGet("accessDenied")]
        public IActionResult AccessDenied()
        {
            return View("AccessDenied");
        }
    }
}
