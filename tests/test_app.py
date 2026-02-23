import pytest
from fastapi.testclient import TestClient
from src import app as app_module

@pytest.fixture(autouse=True)
def reset_state():
    # arrange: start each test with fresh activity data
    app_module.reset_activities()

@pytest.fixture
def client():
    return TestClient(app_module.app)


def test_get_activities_returns_initial_data(client):
    # Arrange: state is default from autouse fixture
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_adds_participant_and_reflects_in_get(client):
    # Arrange
    email = "newstudent@mergington.edu"
    activity = "Chess Club"

    # Act
    signup_resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert signup succeeded
    assert signup_resp.status_code == 200
    assert "Signed up" in signup_resp.json().get("message", "")

    # Act again: fetch activities
    get_resp = client.get("/activities")
    assert get_resp.status_code == 200
    participants = get_resp.json()[activity]["participants"]
    # Assert participant list contains the new email
    assert email in participants


def test_signup_nonexistent_activity_returns_404(client):
    # Arrange
    email = "foo@bar.com"
    activity = "Nonexistent"

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert resp.status_code == 404


def test_duplicate_signup_returns_400(client):
    # Arrange: pick an existing participant from default data
    activity = "Chess Club"
    email = "michael@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert resp.status_code == 400


def test_unregister_removes_participant_and_reflects(client):
    # Arrange
    activity = "Chess Club"
    email = "daniel@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 200

    # Assert removal by fetching
    get_resp = client.get("/activities")
    participants = get_resp.json()[activity]["participants"]
    assert email not in participants


def test_unregister_nonparticipant_returns_404(client):
    # Arrange
    activity = "Chess Club"
    email = "ghost@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    # Assert
    assert resp.status_code == 404


def test_unregister_invalid_activity_returns_404(client):
    # Arrange
    activity = "NoSuch"
    email = "someone@mergington.edu"

    # Act
    resp = client.post(f"/activities/{activity}/unregister", params={"email": email})
    # Assert
    assert resp.status_code == 404
