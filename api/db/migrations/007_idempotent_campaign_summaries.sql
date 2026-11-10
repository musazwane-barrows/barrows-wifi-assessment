
CREATE UNIQUE INDEX UX_CampaignSummaries_CampaignId
ON CampaignSummaries(CampaignId);
GO

ALTER TABLE SentEmails
ADD IdempotencyKey NVARCHAR(200) NULL;
GO

CREATE UNIQUE INDEX UX_SentEmails_IdempotencyKey
ON SentEmails(IdempotencyKey)
WHERE IdempotencyKey IS NOT NULL;
GO
