from pydantic import BaseModel


class HealthResponse(BaseModel):
    ok: bool
    service: str


class MessageResponse(BaseModel):
    ok: bool = True
    message: str
