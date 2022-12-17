﻿using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PayMe.Application.Core;
using PayMe.Application.Interfaces;
using PayMe.Core;

namespace PayMe.Application.Profiles
{
    /// <summary>
    /// Service which changes Profile user data
    /// Anything that doesn't update the database is going to be a Query
    /// </summary>
    public class UpdateDetailsProfileUser
    {
        public class Command : IRequest<Result<Unit>>
        {
            public string FirstName { get; set; }
            public string LastName { get; set; }
        }

        public class CommandValidator : AbstractValidator<Command>
        {
            public CommandValidator()
            {
                RuleFor(x => x.FirstName).NotEmpty();
                RuleFor(x => x.LastName).NotEmpty();
            }
        }

        public class Handler : IRequestHandler<Command, Result<Unit>>
        {
            private readonly DataContext _context;
            private readonly IUserAccessor _userAccessor;

            public Handler(DataContext context, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _context = context;
            }

            public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
            {
                var user = await _context.Users.FirstOrDefaultAsync(x =>
                    x.UserName == _userAccessor.GetUsername(), cancellationToken: cancellationToken);

                user!.FirstName = request.FirstName ?? user.FirstName;
                user!.LastName = request.LastName ?? user.LastName;

                _context.Entry(user).State = EntityState.Modified;

                var success = await _context.SaveChangesAsync(cancellationToken) > 0;

                if (success) return Result<Unit>.Success(Unit.Value);

                return Result<Unit>.Failure("Problem updating profile");
            }
        }
    }
}