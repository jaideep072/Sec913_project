from fastapi import APIRouter, Header
from models.schemas import SectionSchema
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/sections")


@router.get("")
async def list_sections(Token: str = Header(...)):
    return await spring_request("GET", "/sections", token=Token)


@router.post("")
async def create_section(S: SectionSchema, Token: str = Header(...)):
    return await spring_request("POST", "/sections", json=S.model_dump(), token=Token)


@router.put("/{section_id}")
async def update_section(section_id: str, S: SectionSchema, Token: str = Header(...)):
    return await spring_request("PUT", f"/sections/{section_id}",
                                json=S.model_dump(), token=Token)


@router.delete("/{section_id}")
async def delete_section(section_id: str, Token: str = Header(...)):
    return await spring_request("DELETE", f"/sections/{section_id}", token=Token)
