import httpx
import os

MONGO_SPRING_URL = os.getenv("MONGO_SPRING_URL", "http://localhost:8020")
if MONGO_SPRING_URL and not MONGO_SPRING_URL.startswith("http"):
    MONGO_SPRING_URL = "http://" + MONGO_SPRING_URL


async def mongo_spring_request(method: str,
                              path: str,
                              *,
                              json=None,
                              token: str = None,
                              params=None):
    """
    Proxy helper for routing authentication and role mapping requests
    to the Spring Boot MongoDB core service running on Port 8020.
    """
    headers = {}
    if token:
        headers["Token"] = token

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method,
            MONGO_SPRING_URL + path,
            json=json,
            params=params,
            headers=headers,
        )

    try:
        return response.json()
    except Exception:
        return {"code": response.status_code, "message": response.text}
