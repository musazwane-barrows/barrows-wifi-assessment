
-- Remove legacy duplicate event submissions.
;WITH RankedEvents AS
(
    SELECT
        Id,
        ROW_NUMBER() OVER
        (
            PARTITION BY EventId
            ORDER BY ReceivedAt, Id
        ) AS DuplicateRank
    FROM ConnectionEvents
)
DELETE FROM RankedEvents
WHERE DuplicateRank > 1;
GO

-- Prevent duplicate event IDs in future submissions.
CREATE UNIQUE INDEX UX_ConnectionEvents_EventId
ON ConnectionEvents(EventId);
GO
