from fastapi import APIRouter, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from services.rag_agent import run_rag_agent
from services.security import sanitize_chat_query

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class ChatRequest(BaseModel):
    message: str
    conversation_history: list = []


@router.post("/chat")
@limiter.limit("30/minute")
async def chat(request: Request, body: ChatRequest):
    clean_message = sanitize_chat_query(body.message)
    if not clean_message:
        return {
            "answer": "Please enter a valid question.",
            "citations": [],
            "conversation_history": body.conversation_history,
        }
    result = run_rag_agent(clean_message, body.conversation_history)
    return result
