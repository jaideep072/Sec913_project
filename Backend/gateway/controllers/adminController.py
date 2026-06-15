from fastapi import APIRouter, Header, Body
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse
from ._spring_proxy import spring_request
from ._mongo_spring_proxy import mongo_spring_request

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def list_users(token: Optional[str] = Header(None)):
    res = await mongo_spring_request("GET", "/admin/users", token=token)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)

@router.put("/users/{user_id}/role")
async def set_role(user_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    res = await mongo_spring_request("PUT", f"/admin/users/{user_id}/role", json=body, token=token)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)

@router.put("/users/{user_id}/status")
async def set_status(user_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    res = await mongo_spring_request("PUT", f"/admin/users/{user_id}/status", json=body, token=token)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, token: Optional[str] = Header(None)):
    res = await mongo_spring_request("DELETE", f"/admin/users/{user_id}", token=token)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)

@router.get("/audit")
async def audit(token: Optional[str] = Header(None)):
    res = await spring_request("GET", "/admin/audit", token=token)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)
