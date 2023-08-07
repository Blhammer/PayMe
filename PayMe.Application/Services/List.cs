﻿using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using PayMe.Application.CheckPayments;
using PayMe.Application.Core;
using PayMe.Application.Interfaces;
using PayMe.Core;

namespace PayMe.Application.Services
{
    public abstract class List
    {
        public class Query : IRequest<Result<PagedList<CheckPaymentDto>>>
        {
            public CheckPaymentParams Params { get; set; } = null!;
        }

        public class Handler : IRequestHandler<Query, Result<PagedList<CheckPaymentDto>>>
        {
            private readonly DataContext _context;
            private readonly IMapper _mapper;
            private readonly IUserAccessor _userAccessor;

            public Handler(DataContext context, IMapper mapper, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _context = context;
                _mapper = mapper;
            }

            public async Task<Result<PagedList<CheckPaymentDto>>> Handle(Query request,
                CancellationToken cancellationToken)
            {
                var query = _context.CheckPayments
                    .Where(chP => chP.CheckPaymentsUsers.Any(
                        cpu => cpu.AppUserId == _userAccessor.GetUserId()))
                    .OrderBy(d => d.Date)
                    .ProjectTo<CheckPaymentDto>(_mapper.ConfigurationProvider)
                    .AsQueryable();

                return Result<PagedList<CheckPaymentDto>>.Success(
                    await PagedList<CheckPaymentDto>.CreateAsync(
                        query,
                        request.Params.PageNumber,
                        request.Params.PageSize)
                );
            }
        }
    }
}