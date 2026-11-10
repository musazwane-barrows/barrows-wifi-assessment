using BarrowsWifi.Api.Domain;
using BarrowsWifi.Api.Endpoints;
using Xunit;

namespace BarrowsWifi.Api.Tests;

public class OutletSearchTests
{
    [Theory]
    [InlineData("Gugu", 1)]
    [InlineData("663600", 1)]
    [InlineData("Gauteng", 1)]
    public void Searches_active_outlets_by_name_stp_or_province(
        string search,
        int expectedId)
    {
        var outlets = new[]
        {
            new Outlet
            {
                Id = 1,
                Name = "Gugu Spaza",
                StpNumber = "663600",
                Province = "Gauteng",
                IsActive = true,
            },
            new Outlet
            {
                Id = 2,
                Name = "Closed Store",
                StpNumber = "123456",
                Province = "Gauteng",
                IsActive = false,
            },
        }.AsQueryable();

        var results = OutletSearch.Apply(outlets, search).Select(o => o.Id).ToArray();

        Assert.Equal(new[] { expectedId }, results);
    }

    [Fact]
    public void Trims_search_text_and_returns_empty_for_no_matches()
    {
        var outlets = new[]
        {
            new Outlet { Id = 1, Name = "Gugu Spaza", IsActive = true },
        }.AsQueryable();

        Assert.Equal(1, OutletSearch.Apply(outlets, "  Gugu  ").Count());
        Assert.Empty(OutletSearch.Apply(outlets, "missing"));
    }
}
