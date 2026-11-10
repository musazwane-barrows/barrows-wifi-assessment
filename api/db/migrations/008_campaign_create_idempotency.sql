
ALTER TABLE Campaigns
ADD CreateRequestKey NVARCHAR(100) NULL;
GO

CREATE UNIQUE INDEX UX_Campaigns_CreateRequestKey
ON Campaigns(CreateRequestKey)
WHERE CreateRequestKey IS NOT NULL;
GO
