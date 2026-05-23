"""
Pydantic schemas used by the gateway.

Most routes simply forward whatever the React app sent through to Spring,
so we keep these schemas lenient (extra fields ignored, optional fields
where the underlying Java entity is permissive).
"""

from typing import List, Optional
from pydantic import BaseModel


# ── auth ──────────────────────────────────────────────────────

class SignupSchema(BaseModel):
    fullname: str
    phone: str
    email: str
    password: str
    role: Optional[str] = "Student"   # Student | Librarian | Staff

class SigninSchema(BaseModel):
    username: str   # the user's email
    password: str


# ── sections ──────────────────────────────────────────────────

class SectionSchema(BaseModel):
    name: str
    description: Optional[str] = ""


# ── resources ─────────────────────────────────────────────────

class ResourceSchema(BaseModel):
    sectionId: str
    title: str
    summary: Optional[str] = None
    body: Optional[str] = None
    author: Optional[str] = None
    year: Optional[int] = None
    pages: Optional[int] = None
    difficulty: Optional[str] = None
    period: Optional[str] = None
    origin: Optional[str] = None
    keyQuote: Optional[str] = None
    keyFact: Optional[str] = None
    impact: Optional[str] = None
    whyRead: Optional[str] = None
    whyStudy: Optional[str] = None
    tags: Optional[List[str]] = None
    keyThemes: Optional[List[str]] = None
    keyFigures: Optional[List[str]] = None
    keyFacts: Optional[List[str]] = None
    similarTo: Optional[List[str]] = None
    similarTopics: Optional[List[str]] = None
    relatedTopics: Optional[List[str]] = None


# ── borrows ───────────────────────────────────────────────────

class BorrowSchema(BaseModel):
    resourceId: Optional[int] = None
    bookTitle: str
    bookAuthor: Optional[str] = None
    section: Optional[str] = None
    borrowerName: str
    borrowerEmail: str
    borrowerRole: Optional[str] = "Student"
    borrowedOn: Optional[str] = None   # yyyy-MM-dd
    dueDate: Optional[str] = None      # yyyy-MM-dd
