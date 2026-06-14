from typing import Optional
from fastapi import APIRouter, Header
from models.schemas import ResourceSchema
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/resources")


@router.get("")
async def list_resources(Token: str = Header(...),
                         sectionId: Optional[str] = None):
    params = {"sectionId": sectionId} if sectionId else None
    return await spring_request("GET", "/resources", token=Token, params=params)


@router.get("/search")
async def search_resources(q: str, Token: str = Header(...)):
    return await spring_request("GET", "/resources/search", token=Token, params={"q": q})


@router.get("/{resource_id}")
async def get_resource(resource_id: int, Token: str = Header(...)):
    return await spring_request("GET", f"/resources/{resource_id}", token=Token)


@router.post("")
async def create_resource(R: ResourceSchema, Token: str = Header(...)):
    # exclude_unset keeps None fields out so Spring's partial-update logic still applies cleanly
    return await spring_request("POST", "/resources",
                                json=R.model_dump(exclude_unset=True), token=Token)


@router.put("/{resource_id}")
async def update_resource(resource_id: int, R: ResourceSchema, Token: str = Header(...)):
    return await spring_request("PUT", f"/resources/{resource_id}",
                                json=R.model_dump(exclude_unset=True), token=Token)


@router.delete("/{resource_id}")
async def delete_resource(resource_id: int, Token: str = Header(...)):
    return await spring_request("DELETE", f"/resources/{resource_id}", token=Token)
