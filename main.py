from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.researcher import research_keyword
from agents.social import create_social_variants
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


class SocialRequest(BaseModel):
    keyword: str
    blog_post: str


@app.post("/api/social")
async def social(req: SocialRequest):
    try:
        return await create_social_variants(req.keyword, req.blog_post)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class GenerateRequest(BaseModel):
    keyword: str


@app.post("/api/generate")
async def generate(req: GenerateRequest):
    try:
        research_result = await research_keyword(req.keyword)
        blog_result = await write_blog(req.keyword, research_result["research"])
        social_result = await create_social_variants(
            req.keyword, blog_result["blog_post"]
        )
        return {
            "keyword": req.keyword,
            "research": research_result["research"],
            "blog_post": blog_result["blog_post"],
            "word_count": blog_result["word_count"],
            "variants": social_result["variants"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


app.mount("/", StaticFiles(directory="static", html=True), name="static")
