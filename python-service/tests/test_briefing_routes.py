from uuid import uuid4


def make_payload():
    return {
        "companyName": "Acme Holdings",
        "ticker": "ACME",
        "sector": "Industrial Technology",
        "analystName": "Jane Doe",
        "summary": (
            "Acme is benefiting from strong enterprise demand and improving "
            "operating leverage, though customer concentration remains a near-term risk."
        ),
        "recommendation": (
            "Monitor for margin expansion and customer diversification before "
            "increasing exposure."
        ),
        "keyPoints": [
            "Revenue grew 18% year-over-year in the latest quarter.",
            "Management raised full-year guidance.",
            "Enterprise subscriptions now account for 62% of recurring revenue.",
        ],
        "risks": [
            "Top two customers account for 41% of total revenue.",
            "International expansion may pressure margins over the next two quarters.",
        ],
        "metrics": [
            {
                "name": "Revenue Growth",
                "value": "18%",
            },
            {
                "name": "Operating Margin",
                "value": "22.4%",
            },
            {
                "name": "P/E Ratio",
                "value": "28.1x",
            },
        ],
    }


def test_create_briefing(client):
    response = client.post("/briefings", json=make_payload())

    assert response.status_code == 201
    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert "id" in body["data"]


def test_get_briefing_returns_full_details(client):
    create_response = client.post("/briefings", json=make_payload())
    briefing_id = create_response.json()["data"]["id"]

    response = client.get(f"/briefings/{briefing_id}")

    assert response.status_code == 200
    body = response.json()

    assert body["success"] is True
    assert body["error"] is None

    data = body["data"]
    assert data["id"] == briefing_id
    assert data["company_name"] == "Acme Holdings"
    assert data["ticker"] == "ACME"
    assert data["sector"] == "Industrial Technology"
    assert data["analyst_name"] == "Jane Doe"
    assert data["summary"] is not None
    assert data["recommendation"] is not None

    assert len(data["points"]) == 5
    assert len(data["metrics"]) == 3

    point_types = [point["type"] for point in data["points"]]
    assert point_types.count("key_point") == 3
    assert point_types.count("risk") == 2

    metric_names = [metric["name"] for metric in data["metrics"]]
    assert "Revenue Growth" in metric_names
    assert "Operating Margin" in metric_names
    assert "P/E Ratio" in metric_names

    assert data["generated_html"] is None


def test_generate_report(client):
    create_response = client.post("/briefings", json=make_payload())
    briefing_id = create_response.json()["data"]["id"]

    response = client.post(f"/briefings/{briefing_id}/generate")

    assert response.status_code == 200
    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert body["data"]["status"] == "generated"


def test_get_html_returns_rendered_html(client):
    create_response = client.post("/briefings", json=make_payload())
    briefing_id = create_response.json()["data"]["id"]

    client.post(f"/briefings/{briefing_id}/generate")

    response = client.get(f"/briefings/{briefing_id}/html")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

    html = response.text
    assert "<!DOCTYPE html>" in html
    assert "Acme Holdings (ACME)" in html
    assert "Industrial Technology" in html
    assert "Jane Doe" in html
    assert "Revenue Growth" in html
    assert "Operating Margin" in html
    assert "P/E Ratio" in html
    assert "28.1x" in html


def test_get_html_before_generation_returns_400(client):
    create_response = client.post("/briefings", json=make_payload())
    briefing_id = create_response.json()["data"]["id"]

    response = client.get(f"/briefings/{briefing_id}/html")

    assert response.status_code == 400
    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["message"] == "Report not generated yet"
    assert body["error"]["code"] == 400


def test_get_briefing_not_found(client):
    missing_id = str(uuid4())

    response = client.get(f"/briefings/{missing_id}")

    assert response.status_code == 404
    body = response.json()

    assert body["success"] is False
    assert body["data"] is None
    assert body["error"]["message"] == "Briefing not found"
    assert body["error"]["code"] == 404