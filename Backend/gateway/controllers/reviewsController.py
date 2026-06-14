import httpx
from fastapi import APIRouter, Header, Request, Response, HTTPException, Query
from typing import Optional

import os

router = APIRouter(prefix="/reviews")
NODE_SERVICE_URL = os.getenv("NODE_SERVICE_URL", "http://localhost:8002")
if NODE_SERVICE_URL and not NODE_SERVICE_URL.startswith("http"):
    NODE_SERVICE_URL = "http://" + NODE_SERVICE_URL

@router.get("")
async def get_reviews(resourceId: str = Query(...)):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{NODE_SERVICE_URL}/reviews", params={"resourceId": resourceId})
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Node.js reviews service is offline: {exc}")

@router.post("")
async def create_review(request: Request, Token: Optional[str] = Header(None)):
    if not Token:
        raise HTTPException(status_code=401, detail="Token header is missing")
    
    body = await request.json()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(
                f"{NODE_SERVICE_URL}/reviews", 
                json=body, 
                headers={"Token": Token}
            )
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Node.js reviews service is offline: {exc}")

@router.delete("/{review_id}")
async def delete_review(review_id: str, Token: Optional[str] = Header(None)):
    if not Token:
        raise HTTPException(status_code=401, detail="Token header is missing")
        
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.delete(
                f"{NODE_SERVICE_URL}/reviews/{review_id}", 
                headers={"Token": Token}
            )
            return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Node.js reviews service is offline: {exc}")
