CREATE TABLE briefing_points (

    id UUID PRIMARY KEY,

    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,

    content TEXT NOT NULL,

    type TEXT NOT NULL CHECK (type IN ('key_point','risk')),

    position INTEGER NOT NULL
);