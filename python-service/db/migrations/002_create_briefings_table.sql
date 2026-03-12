CREATE TABLE briefings (
    id UUID PRIMARY KEY,

    company_name TEXT NOT NULL,
    ticker TEXT NOT NULL,
    sector TEXT,

    analyst_name TEXT,

    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,

    generated_html TEXT,
    generated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);