"""Test suite for the Bots Duel ML API."""

import pytest
from fastapi.testclient import TestClient
from ml.src.ml.main import app

client = TestClient(app)


def test_health_endpoint():
    """Test the health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "message": "Bots Duel ML API is running"}


def test_bot_play_endpoint():
    """Test the bot play endpoint with valid data."""
    test_data = {
        "grid": [[0, 0, 1], [0, -1, 0], [0, 0, 0]],
        "history": [
            {"x": 2, "y": 0, "player": 0},
            {"x": 1, "y": 1, "player": 1}
        ]
    }

    response = client.post("/bot/bot-1/play", json=test_data)
    assert response.status_code == 200

    data = response.json()
    assert "x" in data
    assert "y" in data
    assert "confidence" in data
    assert "reasoning" in data
    assert isinstance(data["x"], int)
    assert isinstance(data["y"], int)
    assert 0 <= data["x"] <= 2
    assert 0 <= data["y"] <= 2


def test_bot_play_invalid_bot():
    """Test the bot play endpoint with invalid bot ID."""
    test_data = {
        "grid": [[0, 0, 1], [0, -1, 0], [0, 0, 0]],
        "history": []
    }

    response = client.post("/bot/invalid-bot/play", json=test_data)
    assert response.status_code == 404


def test_bot_play_invalid_data():
    """Test the bot play endpoint with invalid data."""
    test_data = {
        "grid": "invalid",
        "history": []
    }

    response = client.post("/bot/bot-1/play", json=test_data)
    assert response.status_code == 422


def test_bots_list_endpoint():
    """Test the bots list endpoint."""
    response = client.get("/bots")
    assert response.status_code == 200

    data = response.json()
    assert "bots" in data
    assert len(data["bots"]) == 5

    for bot in data["bots"]:
        assert "id" in bot
        assert "name" in bot
        assert "strategy" in bot
