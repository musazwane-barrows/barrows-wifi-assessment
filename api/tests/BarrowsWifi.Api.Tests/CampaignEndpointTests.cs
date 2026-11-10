using BarrowsWifi.Api.Domain;
using BarrowsWifi.Api.Endpoints;
using Xunit;

namespace BarrowsWifi.Api.Tests;

public class CampaignEndpointTests
{
    [Fact]
    public void Idempotency_retry_matches_the_same_campaign_request()
    {
        var startsAt = new DateTimeOffset(2026, 11, 1, 0, 0, 0, TimeSpan.FromHours(2));
        var endsAt = startsAt.AddDays(30);
        var request = new CreateCampaignRequest(
            "  Summer Launch ",
            startsAt,
            endsAt,
            50000,
            new[] { 7, 3, 7 });
        var campaign = new Campaign
        {
            OrganisationId = 4,
            Name = "Summer Launch",
            StartsAt = startsAt,
            EndsAt = endsAt,
            BudgetZar = 50000,
            Outlets = new()
            {
                new CampaignOutlet { OutletId = 3 },
                new CampaignOutlet { OutletId = 7 },
            },
        };

        Assert.True(CampaignEndpoints.MatchesRequest(campaign, request, 4, new[] { 3, 7 }));
        Assert.False(CampaignEndpoints.MatchesRequest(campaign, request, 5, new[] { 3, 7 }));
        Assert.False(CampaignEndpoints.MatchesRequest(campaign, request, 4, new[] { 3 }));
    }
}
