from httpx import AsyncClient


async def _register(client: AsyncClient, body: dict[str, str]) -> str:
    response = await client.post("/auth/register", json=body)
    return response.json()["access_token"]


async def test_me_returns_current_user(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    access_token = await _register(client, registered_user_body)

    response = await client.get(
        "/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == registered_user_body["email"]
    assert "password" not in body
    assert "password_hash" not in body


async def test_me_without_token_fails(client: AsyncClient) -> None:
    response = await client.get("/users/me")

    assert response.status_code == 401


async def test_me_with_garbage_token_fails(client: AsyncClient) -> None:
    response = await client.get(
        "/users/me", headers={"Authorization": "Bearer not-a-real-token"}
    )

    assert response.status_code == 401


async def test_delete_me_removes_account(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    access_token = await _register(client, registered_user_body)

    delete_response = await client.delete(
        "/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert delete_response.status_code == 204

    login_response = await client.post("/auth/login", json=registered_user_body)
    assert login_response.status_code == 401


async def test_delete_me_invalidates_refresh_token(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    access_token = await _register(client, registered_user_body)

    await client.delete(
        "/users/me", headers={"Authorization": f"Bearer {access_token}"}
    )

    refresh_response = await client.post("/auth/refresh")
    assert refresh_response.status_code == 401
