from fastapi import APIRouter, Header, Body, Query
from typing import Optional, Dict, Any
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/requests", tags=["requests"])

@router.get("")
async def list_requests(status: Optional[str] = None, token: Optional[str] = Header(None)):
    params = {"status": status} if status else None
    return await spring_request("GET", "/requests", token=token, params=params)

@router.post("")
async def create_request(body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    return await spring_request("POST", "/requests", json=body, token=token)

@router.put("/{request_id}/approve")
async def approve_request(request_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    return await spring_request("PUT", f"/requests/{request_id}/approve", json=body, token=token)

@router.put("/{request_id}/reject")
async def reject_request(request_id: str, body: Dict[str, Any] = Body(...), token: Optional[str] = Header(None)):
    return await spring_request("PUT", f"/requests/{request_id}/reject", json=body, token=token)

@router.put("/{request_id}/cancel")
async def cancel_request(request_id: str, token: Optional[str] = Header(None)):
    return await spring_request("PUT", f"/requests/{request_id}/cancel", token=token)
