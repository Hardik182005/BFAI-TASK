import asyncio
import httpx
from main import app

async def test_endpoints():
    print("Starting BFAI Document Intelligence API Tests...")

    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # 1. Health check
        print("Testing GET /api/health...")
        res = await client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        print(f"Health OK: {data}")

        # 2. Documents list
        print("Testing GET /api/documents...")
        res = await client.get("/api/documents")
        assert res.status_code == 200
        docs = res.json()
        print(f"Documents: {len(docs)} indexed")

        # 3. Chat
        print("Testing POST /api/chat...")
        res = await client.post("/api/chat", json={
            "message": "What documents are available?",
            "conversation_history": []
        })
        assert res.status_code == 200
        chat_data = res.json()
        assert "answer" in chat_data
        print(f"Chat OK. Answer preview: {chat_data['answer'][:80]}...")

    print("\nAll BFAI API tests passed.")


if __name__ == "__main__":
    asyncio.run(test_endpoints())
