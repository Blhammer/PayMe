﻿using Microsoft.AspNetCore.Mvc;
using PayMe.Application.Profiles;

namespace PayMe.API.Controllers
{
    public class ProfilesController : BaseApiController
    {
        [HttpGet("{username}")]
        public async Task<IActionResult> GetProfile(string username)
        {
            return HandleResult(await Mediator!.Send(new DetailsProfileUser.Query { Username = username }));
        }

        [HttpPut]
        public async Task<IActionResult> Edit(UpdateDetailsProfileUser.Command command)
        {
            return HandleResult(await Mediator!.Send(command));
        }
    }
}