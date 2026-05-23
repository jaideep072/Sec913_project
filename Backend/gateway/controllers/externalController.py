"""
Gateway proxy for external API integrations (Open Library, arXiv).

Architecture:
  Frontend (React)  →  Gateway (:8000)  →  Spring Boot (:8001)  →  External API

The Spring Boot side does the actual HTTP calls; this controller just
forwards the request with the user's Token header so Spring can authorize.
"""

from fastapi import APIRouter, Header
from controllers._spring_proxy import spring_request

router = APIRouter(prefix="/external")


# ── Open Library (books) ────────────────────────────────────


@router.get("/books")
async def search_books(q: str, limit: int = 10, Token: str = Header(...)):
    return await spring_request("GET", "/external/books",
                                token=Token, params={"q": q, "limit": limit})


@router.post("/books/import")
async def import_book(body: dict, Token: str = Header(...)):
    return await spring_request("POST", "/external/books/import",
                                json=body, token=Token)


@router.post("/books/request")
async def request_book(body: dict, Token: str = Header(...)):
    """Student flow: import unpublished + create PENDING BookRequest in one call."""
    return await spring_request("POST", "/external/books/request",
                                json=body, token=Token)


# ── arXiv (papers) ──────────────────────────────────────────


@router.get("/arxiv")
async def search_arxiv(q: str, limit: int = 10, Token: str = Header(...)):
    """Search arXiv papers by keyword. Returns title, abstract, authors, categories."""
    return await spring_request("GET", "/external/arxiv",
                                token=Token, params={"q": q, "limit": limit})


@router.post("/arxiv/import")
async def import_arxiv(body: dict, Token: str = Header(...)):
    """Import an arXiv paper as a local Resource (Librarian/Admin only)."""
    return await spring_request("POST", "/external/arxiv/import",
                                json=body, token=Token)


@router.post("/arxiv/request")
async def request_arxiv(body: dict, Token: str = Header(...)):
    """Student flow: import unpublished + create PENDING BookRequest in one call."""
    return await spring_request("POST", "/external/arxiv/request",
                                json=body, token=Token)
