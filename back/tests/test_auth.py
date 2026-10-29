from httpx import AsyncClient


async def test_register_returns_access_token_and_sets_refresh_cookie(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    response = await client.post("/auth/register", json=registered_user_body)

    assert response.status_code == 201
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]
    assert "refresh_token" in response.cookies


async def test_register_rejects_duplicate_email(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    await client.post("/auth/register", json=registered_user_body)
    response = await client.post("/auth/register", json=registered_user_body)

    assert response.status_code == 409


async def test_register_normalizes_email_case(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    await client.post("/auth/register", json=registered_user_body)

    response = await client.post(
        "/auth/register",
        json={**registered_user_body, "email": registered_user_body["email"].upper()},
    )

    assert response.status_code == 409


async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register", json={"email": "bob@example.com", "password": "short"}
    )

    assert response.status_code == 422


async def test_login_succeeds_with_correct_credentials(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    await client.post("/auth/register", json=registered_user_body)

    response = await client.post("/auth/login", json=registered_user_body)

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert "refresh_token" in response.cookies


async def test_login_rejects_wrong_password(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    await client.post("/auth/register", json=registered_user_body)

    response = await client.post(
        "/auth/login",
        json={**registered_user_body, "password": "wrong-password"},
    )

    assert response.status_code == 401


async def test_login_rejects_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "whatever123"}
    )

    assert response.status_code == 401


async def test_refresh_rotates_token_and_invalidates_old_one(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    await client.post("/auth/register", json=registered_user_body)
    old_refresh_token = client.cookies["refresh_token"]

    refresh_response = await client.post("/auth/refresh")
    assert refresh_response.status_code == 200
    new_refresh_token = client.cookies["refresh_token"]
    assert new_refresh_token != old_refresh_token

    # Reusing the now-rotated-out old refresh token must fail.
    client.cookies["refresh_token"] = old_refresh_token
    reuse_response = await client.post("/auth/refresh")
    assert reuse_response.status_code == 401


async def test_refresh_without_cookie_fails(client: AsyncClient) -> None:
    response = await client.post("/auth/refresh")

    assert response.status_code == 401


async def test_logout_clears_refresh_token_and_requires_access_token(
    client: AsyncClient, registered_user_body: dict[str, str]
) -> None:
    register_response = await client.post("/auth/register", json=registered_user_body)
    access_token = register_response.json()["access_token"]

    logout_response = await client.post(
        "/auth/logout", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert logout_response.status_code == 204

    refresh_response = await client.post("/auth/refresh")
    assert refresh_response.status_code == 401


async def test_logout_without_access_token_fails(client: AsyncClient) -> None:
    response = await client.post("/auth/logout")

    assert response.status_code == 401
