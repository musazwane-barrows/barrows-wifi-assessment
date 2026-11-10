using BarrowsWifi.Api.Data;
using BarrowsWifi.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BarrowsWifi.Api.Infrastructure;

public record CampaignReport(
    int CampaignId,
    string CampaignName,
    string Organisation,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    int Outlets,
    int Impressions,
    int UniqueUsers,
    int SurveyCompletes);

public static class ReportEventQueries
{
    public static IQueryable<ConnectionEvent> ForCampaign(
        IQueryable<ConnectionEvent> events,
        IQueryable<CampaignOutlet> campaignOutlets,
        Campaign campaign) =>
        events.Where(e =>
            e.CampaignId == campaign.Id &&
            campaignOutlets.Any(co =>
                co.CampaignId == campaign.Id &&
                co.OutletId == e.OutletId) &&
            e.OccurredAt >= campaign.StartsAt &&
            e.OccurredAt < campaign.EndsAt);

    public static IQueryable<Guid> DistinctEventIds(
        this IQueryable<ConnectionEvent> events,
        string eventType) =>
        events
            .Where(e => e.EventType == eventType)
            .Select(e => e.EventId)
            .Distinct();
}

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    public async Task<CampaignReport?> BuildAsync(int campaignId, CurrentUser user, CancellationToken ct)
    {
        var campaign = await _db.Campaigns
            .VisibleTo(user)
            .Include(c => c.Organisation)
            .FirstOrDefaultAsync(c => c.Id == campaignId, ct);
        if (campaign is null) return null;

        var events = ReportEventQueries.ForCampaign(
            _db.ConnectionEvents,
            _db.CampaignOutlets,
            campaign);
        var impressions = await events
            .DistinctEventIds(EventTypes.AdComplete)
            .CountAsync(ct);
        var uniqueUsers = await events
            .Where(e => e.EventType == EventTypes.AdComplete)
            .Select(e => e.DeviceHash)
            .Distinct()
            .CountAsync(ct);
        var surveys = await events
            .DistinctEventIds(EventTypes.SurveyComplete)
            .CountAsync(ct);
        var outlets = await _db.CampaignOutlets.CountAsync(co => co.CampaignId == campaignId, ct);

        return new CampaignReport(
            campaign.Id,
            campaign.Name,
            campaign.Organisation?.Name ?? "",
            campaign.StartsAt,
            campaign.EndsAt,
            outlets,
            impressions,
            uniqueUsers,
            surveys);
    }
}
