from app.models.briefing_point import PointType

def build_report_view_data(briefing):
    """
    Transform ORM briefing object into a template-safe view dict.
    """

    key_points = []
    risks = []

    for point in briefing.points:
        if point.type == PointType.KEY_POINT.value:
            key_points.append(point.content)
        elif point.type == PointType.RISK.value:
            risks.append(point.content)

    metrics = [
        {
            "name": m.name,
            "value": m.value
        }
        for m in briefing.metrics
    ]

    return {
        "title": f"{briefing.company_name} ({briefing.ticker}) Briefing",
        "company": briefing.company_name,
        "ticker": briefing.ticker,
        "sector": briefing.sector,
        "analyst": briefing.analyst_name,
        "summary": briefing.summary,
        "recommendation": briefing.recommendation,
        "key_points": key_points,
        "risks": risks,
        "metrics": metrics,
    }