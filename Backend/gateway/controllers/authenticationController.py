from fastapi import APIRouter, Header
from models.schemas import SigninSchema, SignupSchema
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/authservice")


@router.post("/signup")
async def signup(U: SignupSchema):
    return await spring_request("POST", "/authservice/signup", json=U.model_dump())


@router.post("/signin")
async def signin(U: SigninSchema):
    return await spring_request("POST", "/authservice/signin", json=U.model_dump())


@router.get("/uinfo")
async def uinfo(Token: str = Header(...)):
    return await spring_request("GET", "/authservice/uinfo", token=Token)
