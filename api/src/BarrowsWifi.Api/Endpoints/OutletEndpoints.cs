
using BarrowsWifi.Api.Data;
using BarrowsWifi.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BarrowsWifi.Api.Endpoints;

public record OutletDto(
    int Id,
    string StpNumber,
    string Name,
    string Province,
    string ApStatus,
    bool IsActive,
    decimal? Latitude,
    decimal? Longitude);

public record OutletPagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int Total);

public static class OutletSearch
{
    public static IQueryable<Outlet> Apply(
        IQueryable<Outlet> outlets,
        string? search)
    {
        var query = outlets.Where(o => o.IsActive);
        if (string.IsNullOrWhiteSpace(search))
            return query;

        var term = search.Trim();
        return query.Where(o =>
            o.Name.Contains(term) ||
            o.StpNumber.Contains(term) ||
            o.Province.Contains(term));
    }
}

public static class OutletEndpoints
{
    public static void MapOutletEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/outlets")
            .WithTags("Outlets")
            .RequireAuthorization();

        group.MapGet("/", async (
            AppDbContext db,
            string? search,
            int? page,
            int? pageSize,
            CancellationToken ct) =>
        {
            var currentPage = page is null or < 1 ? 1 : page.Value;
            var size = pageSize is null or < 1 or > 100
                ? 25
                : pageSize.Value;

            var query = OutletSearch.Apply(db.Outlets.AsNoTracking(), search);

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderBy(o => o.Name)
                .ThenBy(o => o.Id)
                .Skip((currentPage - 1) * size)
                .Take(size)
                .Select(o => new OutletDto(
                    o.Id,
                    o.StpNumber,
                    o.Name,
                    o.Province,
                    o.ApStatus,
                    o.IsActive,
                    o.Latitude,
                    o.Longitude))
                .ToListAsync(ct);

            return Results.Ok(new OutletPagedResult<OutletDto>(
                items,
                currentPage,
                size,
                total));
        });

        group.MapGet("/{id:int}", async (
            int id,
            AppDbContext db,
            CancellationToken ct) =>
        {
            var outlet = await db.Outlets
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == id, ct);

            return outlet is null
                ? Results.NotFound()
                : Results.Ok(new OutletDto(
                    outlet.Id,
                    outlet.StpNumber,
                    outlet.Name,
                    outlet.Province,
                    outlet.ApStatus,
                    outlet.IsActive,
                    outlet.Latitude,
                    outlet.Longitude));
        });
    }
}
