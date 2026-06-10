from fastapi import APIRouter, Header, Body
from typing import Optional, Dict, Any
from ._spring_proxy import spring_request

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def list_users(token: Optional[str] = Header(None)):
    return await spring_request("GET", "/admin/users", token=token)

@router.put("/users/{user_id}/role")
async def set_role(user_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    return await spring_request("PUT", f"/admin/users/{user_id}/role", json=body, token=token)

@router.put("/users/{user_id}/status")
async def set_status(user_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    return await spring_request("PUT", f"/admin/users/{user_id}/status", json=body, token=token)

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, token: Optional[str] = Header(None)):
    return await spring_request("DELETE", f"/admin/users/{user_id}", token=token)

@router.get("/audit")
async def audit(token: Optional[str] = Header(None)):
    return await spring_request("GET", "/admin/audit", token=token)
