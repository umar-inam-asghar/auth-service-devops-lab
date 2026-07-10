from app import app

def test_health():
    client = app.test_client()
    resp = client.get("/health")
    assert resp.status_code == 200

def test_login_disabled_by_default():
    client = app.test_client()
    resp = client.post("/login")
    assert resp.status_code == 503