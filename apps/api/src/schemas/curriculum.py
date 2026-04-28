from pydantic import BaseModel


class SubjectListItem(BaseModel):
    id: str
    class_level: int
    code: str
    name: str
    slug: str


class ChapterListItem(BaseModel):
    id: str
    name: str
    slug: str
    sequence_index: int


class SubjectListResponse(BaseModel):
    ok: bool = True
    items: list[SubjectListItem]


class ChapterListResponse(BaseModel):
    ok: bool = True
    items: list[ChapterListItem]
