"""
Shared helper for calling the Spring Boot core service.

Every other controller imports `spring_request` from here and gets back
whatever JSON Spring sent (Spring's `{code, message}` shape passes through
untouched). The optional `token` header is forwarded so the Spring side
can authorize the call.
"""

import httpx

SPRING_URL = "http://localhost:8001"


async def spring_request(method: str,
                         path: str,
                         *,
                         json=None,
                         token: str = None,
                         params=None):
    """method: GET/POST/PUT/DELETE. path: starts with '/'."""
    headers = {}
    if token:
        headers["Token"] = token

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.request(
            method,
            SPRING_URL + path,
            json=json,
            params=params,
            headers=headers,
        )

    # Try to decode JSON; if Spring sent text (rare), return it raw.
    try:
        return response.json()
    except Exception:
        return {"code": response.status_code, "message": response.text}
