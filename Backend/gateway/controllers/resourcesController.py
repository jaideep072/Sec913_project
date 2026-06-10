from typing import Optional, Dict, Any
from fastapi import APIRouter, Header, Body
from models.schemas import ResourceSchema
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/resources")


@router.get("")
async def list_resources(Token: str = Header(...),
                         sectionId: Optional[str] = None):
    params = {"sectionId": sectionId} if sectionId else None
    return await spring_request("GET", "/resources", token=Token, params=params)


@router.get("/popular")
async def get_popular(Token: str = Header(...)):
    return await spring_request("GET", "/resources/popular", token=Token)


@router.get("/search")
async def search_resources(q: str, Token: str = Header(...)):
    params = {"q": q}
    return await spring_request("GET", "/resources/search", token=Token, params=params)


@router.get("/{resource_id}")
async def get_resource(resource_id: str, Token: str = Header(...)):
    return await spring_request("GET", f"/resources/{resource_id}", token=Token)


@router.get("/{resource_id}/similar")
async def get_similar(resource_id: str, Token: str = Header(...)):
    return await spring_request("GET", f"/resources/{resource_id}/similar", token=Token)


@router.post("")
async def create_resource(R: ResourceSchema, Token: str = Header(...)):
    # exclude_unset keeps None fields out so Spring's partial-update logic still applies cleanly
    return await spring_request("POST", "/resources",
                                json=R.model_dump(exclude_unset=True), token=Token)


@router.put("/{resource_id}")
async def update_resource(resource_id: str, R: ResourceSchema, Token: str = Header(...)):
    return await spring_request("PUT", f"/resources/{resource_id}",
                                json=R.model_dump(exclude_unset=True), token=Token)


@router.put("/{resource_id}/publish")
async def publish_resource(resource_id: str, body: Dict[str, Any] = Body(...), Token: str = Header(...)):
    return await spring_request("PUT", f"/resources/{resource_id}/publish", json=body, token=Token)


@router.delete("/{resource_id}")
async def delete_resource(resource_id: str, Token: str = Header(...)):
    return await spring_request("DELETE", f"/resources/{resource_id}", token=Token)
