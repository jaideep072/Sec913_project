import httpx
from fastapi import APIRouter, Request, Response, HTTPException
from controllers._mongo_spring_proxy import MONGO_SPRING_URL

router = APIRouter()


@router.get("/mapping/{role}")
async def get_mapping(role: int):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{MONGO_SPRING_URL}/mapping/{role}")
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")


@router.post("/mapping")
async def save_mapping(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(f"{MONGO_SPRING_URL}/mapping", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")


@router.get("/menus")
async def get_menus():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{MONGO_SPRING_URL}/menus")
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")


@router.post("/menus")
async def add_menu(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(f"{MONGO_SPRING_URL}/menus", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")


@router.get("/roles")
async def get_roles():
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{MONGO_SPRING_URL}/roles")
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")


@router.post("/roles")
async def add_role(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(f"{MONGO_SPRING_URL}/roles", json=body)
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"MongoDB spring service is offline: {exc}")
