from fastapi import APIRouter, Header
from models.schemas import SigninSchema, SignupSchema
from controllers._mongo_spring_proxy import mongo_spring_request

router = APIRouter(prefix="/authservice")

ROLE_MAP_STR_TO_INT = {
    "Student": 1,
    "User": 1,
    "Librarian": 2,
    "Manager": 2,
    "Staff": 2,
    "Admin": 3
}

ROLE_MAP_INT_TO_STR = {
    1: "Student",
    2: "Librarian",
    3: "Admin"
}


@router.post("/signup")
async def signup(U: SignupSchema):
    role_str = U.role or "Student"
    role_int = ROLE_MAP_STR_TO_INT.get(role_str, 1)

    body = {
        "fullname": U.fullname,
        "phone": U.phone,
        "email": U.email,
        "password": U.password,
        "role": role_int,
        "status": 1
    }
    print("GATEWAY SIGNUP BODY:", body, flush=True)
    res = await mongo_spring_request("POST", "/authservice/signup", json=body)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)


@router.post("/signin")
async def signin(U: SigninSchema):
    # Perform signin on the Spring Boot MongoDB service
    res = await mongo_spring_request("POST", "/authservice/signin", json=U.model_dump())
    if res.get("code") == 200 and "jwt" in res:
        # Fetch uinfo using the generated token to get user details
        uinfo_res = await mongo_spring_request("GET", "/authservice/uinfo", token=res["jwt"])
        if uinfo_res.get("code") == 200:
            role_int = uinfo_res.get("role", 1)
            res["role"] = ROLE_MAP_INT_TO_STR.get(role_int, "Student")
            res["fullname"] = uinfo_res.get("fullname", "")
            res["id"] = U.username  # Use email as the identifier (like frontend defaults)
    return JSONResponse(status_code=res.get("code", 500) if "code" in res else 200, content=res)


@router.get("/uinfo")
async def uinfo(Token: str = Header(...)):
    res = await mongo_spring_request("GET", "/authservice/uinfo", token=Token)
    if res.get("code") == 200:
        role_int = res.get("role", 1)
        res["role"] = ROLE_MAP_INT_TO_STR.get(role_int, "Student")
        res["id"] = res.get("email", "")
    return res

