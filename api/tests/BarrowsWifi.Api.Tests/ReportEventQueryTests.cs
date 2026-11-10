using BarrowsWifi.Api.Domain;
using BarrowsWifi.Api.Infrastructure;
using Xunit;

namespace BarrowsWifi.Api.Tests;

public class ReportEventQueryTests
{
    [Fact]
    public void Campaign_events_exclude_other_campaigns_outlets_and_flight_boundaries()
    {
        var startsAt = new DateTimeOffset(2026, 9, 1, 0, 0, 0, TimeSpan.FromHours(2));
        var endsAt = new DateTimeOffset(2026, 10, 1, 0, 0, 0, TimeSpan.FromHours(2));
        var campaign = new Campaign
        {
            Id = 1,
            StartsAt = startsAt,
            EndsAt = endsAt,
        };
        var campaignOutlets = new[]
        {
            new CampaignOutlet { CampaignId = 1, OutletId = 10 },
            new CampaignOutlet { CampaignId = 2, OutletId = 10 },
        }.AsQueryable();
        var eventId = Guid.NewGuid();
        var events = new[]
        {
            new ConnectionEvent
            {
                EventId = eventId,
                CampaignId = 1,
                OutletId = 10,
                EventType = EventTypes.AdComplete,
                OccurredAt = startsAt,
            },
            new ConnectionEvent
            {
                EventId = Guid.NewGuid(),
                CampaignId = 2,
                OutletId = 10,
                EventType = EventTypes.AdComplete,
                OccurredAt = startsAt.AddDays(1),
            },
            new ConnectionEvent
            {
                EventId = Guid.NewGuid(),
                CampaignId = 1,
                OutletId = 20,
                EventType = EventTypes.AdComplete,
                OccurredAt = startsAt.AddDays(1),
            },
            new ConnectionEvent
            {
                EventId = Guid.NewGuid(),
                CampaignId = 1,
                OutletId = 10,
                EventType = EventTypes.AdComplete,
                OccurredAt = endsAt,
            },
        }.AsQueryable();

        var reportEvents = ReportEventQueries.ForCampaign(events, campaignOutlets, campaign);

        Assert.Equal(new[] { eventId }, reportEvents.Select(e => e.EventId));
    }

    [Fact]
    public void Distinct_event_ids_ignore_retried_submissions_for_each_metric()
    {
        var adEventId = Guid.NewGuid();
        var surveyEventId = Guid.NewGuid();
        var events = new[]
        {
            new ConnectionEvent { EventId = adEventId, EventType = EventTypes.AdComplete },
            new ConnectionEvent { EventId = adEventId, EventType = EventTypes.AdComplete },
            new ConnectionEvent { EventId = surveyEventId, EventType = EventTypes.SurveyComplete },
            new ConnectionEvent { EventId = surveyEventId, EventType = EventTypes.SurveyComplete },
        }.AsQueryable();

        Assert.Equal(1, events.DistinctEventIds(EventTypes.AdComplete).Count());
        Assert.Equal(1, events.DistinctEventIds(EventTypes.SurveyComplete).Count());
    }
}
