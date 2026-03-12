CREATE TABLE briefing_metrics (

    id UUID PRIMARY KEY,

    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    value TEXT NOT NULL
);