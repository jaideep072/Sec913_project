from typing import Optional
from fastapi import APIRouter, Header
from pydantic import BaseModel
from models.schemas import BorrowSchema
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/borrows")


class ReturnSchema(BaseModel):
    returnedOn: Optional[str] = None   # yyyy-MM-dd; defaults to today on Spring side


@router.get("")
async def list_borrows(Token: str = Header(...)):
    return await spring_request("GET", "/borrows", token=Token)


@router.post("")
async def create_borrow(B: BorrowSchema, Token: str = Header(...)):
    return await spring_request("POST", "/borrows",
                                json=B.model_dump(exclude_unset=True), token=Token)


@router.put("/{borrow_id}/return")
async def mark_returned(borrow_id: int,
                        body: ReturnSchema = ReturnSchema(),
                        Token: str = Header(...)):
    return await spring_request("PUT", f"/borrows/{borrow_id}/return",
                                json=body.model_dump(), token=Token)


@router.delete("/{borrow_id}")
async def delete_borrow(borrow_id: int, Token: str = Header(...)):
    return await spring_request("DELETE", f"/borrows/{borrow_id}", token=Token)
