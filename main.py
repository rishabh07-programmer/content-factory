from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.researcher import research_keyword
from agents.writer import write_blog

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


class ResearchRequest(BaseModel):
    keyword: str


@app.post("/api/research")
async def research(req: ResearchRequest):
    try:
        return await research_keyword(req.keyword)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class WriteRequest(BaseModel):
    keyword: str
    research: str


@app.post("/api/write")
async def write(req: WriteRequest):
    try:
        return await write_blog(req.keyword, req.research)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.mount("/", StaticFiles(directory="static", html=True), name="static")
