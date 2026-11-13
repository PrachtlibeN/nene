from fastapi.testclient import TestClient

from app.main import create_app


def test_health_has_contract_shape_and_echoes_request_id() -> None:
    client = TestClient(create_app())
    response = client.get("/api/v1/health", headers={"X-Request-ID": "req-test-1"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "req-test-1"
    assert response.json()["contract_version"] == "0.3.0"
    assert response.json()["components"]["llm"]["models"]["roleplay"]


def test_non_health_endpoint_returns_error_envelope() -> None:
    client = TestClient(create_app())
    response = client.get("/api/v1/scenarios")

    assert response.status_code == 501
    assert response.json()["error"]["code"] == "NOT_IMPLEMENTED"
    assert response.json()["error"]["request_id"] == response.headers["X-Request-ID"]


def test_openapi_declares_exactly_fourteen_contract_endpoints() -> None:
    client = TestClient(create_app())
    paths = client.get("/openapi.json").json()["paths"]

    assert len(paths) == 11
    assert sum(len(path_item) for path_item in paths.values()) == 14


def test_validation_error_uses_standard_envelope() -> None:
    client = TestClient(create_app())
    response = client.post("/api/v1/sessions", json={})

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert response.json()["error"]["request_id"] == response.headers["X-Request-ID"]
