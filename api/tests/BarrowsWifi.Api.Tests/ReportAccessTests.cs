using BarrowsWifi.Api.Domain;
using BarrowsWifi.Api.Infrastructure;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace BarrowsWifi.Api.Tests;

public class ReportAccessTests
{
    [Fact]
    public void Client_user_cannot_see_campaigns_from_another_organisation()
    {
        var campaigns = new[]
        {
            new Campaign { Id = 1, OrganisationId = 10 },
            new Campaign { Id = 2, OrganisationId = 20 },
        }.AsQueryable();
        var user = new CurrentUser(1, "viewer@example.test", Roles.ClientViewer, 10);

        var visibleCampaignIds = campaigns.VisibleTo(user).Select(c => c.Id).ToArray();

        Assert.Equal(new[] { 1 }, visibleCampaignIds);
    }

    [Fact]
    public void Platform_admin_can_see_campaigns_from_all_organisations()
    {
        var campaigns = new[]
        {
            new Campaign { Id = 1, OrganisationId = 10 },
            new Campaign { Id = 2, OrganisationId = 20 },
        }.AsQueryable();
        var user = new CurrentUser(1, "admin@example.test", Roles.PlatformAdmin, 10);

        var visibleCampaignIds = campaigns.VisibleTo(user).Select(c => c.Id).ToArray();

        Assert.Equal(new[] { 1, 2 }, visibleCampaignIds);
    }

    [Fact]
    public async Task Expired_tokens_are_rejected_by_configured_validation_parameters()
    {
        var options = new JwtOptions
        {
            Issuer = "test-issuer",
            Audience = "test-audience",
            SigningKey = "test-signing-key-that-is-at-least-32-bytes",
            LifetimeMinutes = -10,
        };
        var token = new TokenService(Options.Create(options))
            .Issue(new User
            {
                Id = 1,
                Email = "viewer@example.test",
                Role = Roles.ClientViewer,
                OrganisationId = 10,
            }).Token;

        var result = await new JsonWebTokenHandler().ValidateTokenAsync(
            token,
            options.CreateTokenValidationParameters());

        Assert.False(result.IsValid);
        Assert.IsType<SecurityTokenInvalidLifetimeException>(result.Exception);
    }
}
