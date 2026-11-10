using BarrowsWifi.Api.Data;
using BarrowsWifi.Api.Domain;
using BarrowsWifi.Api.Infrastructure;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace BarrowsWifi.Api.Messaging;

/// <summary>
/// KES-212: when a campaign ends, generate its summary and email it to the client's admins.
/// </summary>
public class CampaignEndedConsumer : IConsumer<CampaignEnded>
{
    private readonly AppDbContext _db;
    private readonly ReportService _reports;
    private readonly IReportMailer _mailer;
    private readonly ILogger<CampaignEndedConsumer> _log;

    public CampaignEndedConsumer(
        AppDbContext db,
        ReportService reports,
        IReportMailer mailer,
        ILogger<CampaignEndedConsumer> log)
    {
        _db = db;
        _reports = reports;
        _mailer = mailer;
        _log = log;
    }

    public async Task Consume(ConsumeContext<CampaignEnded> context)
    {
        var campaign = await _db.Campaigns
            .AsNoTracking()
            .FirstOrDefaultAsync(
                c => c.Id == context.Message.CampaignId,
                context.CancellationToken);

        if (campaign is null)
        {
            _log.LogWarning("Campaign {CampaignId} was not found", context.Message.CampaignId);
            return;
        }

        var clientUser = new CurrentUser(0, "system", Roles.ClientAdmin, campaign.OrganisationId);
        var report = await _reports.BuildAsync(campaign.Id, clientUser, context.CancellationToken);
        if (report is null)
            return;

        var summary = await _db.CampaignSummaries
            .FirstOrDefaultAsync(s => s.CampaignId == campaign.Id, context.CancellationToken);

        if (summary is null)
        {
            summary = new CampaignSummary
            {
                CampaignId = campaign.Id,
                GeneratedAt = DateTimeOffset.UtcNow,
                Impressions = report.Impressions,
                UniqueUsers = report.UniqueUsers,
                SurveyCompletes = report.SurveyCompletes
            };

            _db.CampaignSummaries.Add(summary);
            await _db.SaveChangesAsync(context.CancellationToken);
        }

        var admins = await _db.Users
            .AsNoTracking()
            .Where(u => u.OrganisationId == campaign.OrganisationId && u.Role == Roles.ClientAdmin)
            .Select(u => new { u.Id, u.Email })
            .ToListAsync(context.CancellationToken);

        var subject = $"Campaign summary: {report.CampaignName}";
        var body =
            $"Campaign: {report.CampaignName}\n" +
            $"Organisation: {report.Organisation}\n" +
            $"Impressions: {summary.Impressions}\n" +
            $"Unique users: {summary.UniqueUsers}\n" +
            $"Survey completes: {summary.SurveyCompletes}\n";

        foreach (var admin in admins)
        {
            var idempotencyKey = $"campaign-summary:{campaign.Id}:user:{admin.Id}";
            await _mailer.SendAsync(
                admin.Email,
                subject,
                body,
                idempotencyKey,
                context.CancellationToken);
        }

        _log.LogInformation(
            "Campaign {CampaignId} summary sent to {RecipientCount} admins",
            campaign.Id,
            admins.Count);
    }
}
