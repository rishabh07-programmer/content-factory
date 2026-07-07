import asyncio
import os

from google import genai
from google.genai import types

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY environment variable is not set")

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL = "models/gemini-2.5-flash"
TIMEOUT_SECONDS = 60

PROMPT_TEMPLATE = """You are researching the keyword "{keyword}" for a content writer \
who needs to outrank existing competitors. Use Google Search to find current, \
real information. Return your findings as structured markdown with these exact sections:

## Top 5 Ranking Articles
List the top 5 ranking articles/competitors for this keyword. For each: title + their angle.

## Common Themes
Themes and points that most competitors cover in common.

## Content Gaps
What competitors consistently miss or under-explain.

## Audience Pain Points
The real pain points and questions the target audience has around this keyword.

## Suggested Headlines
5 headlines that would beat the competition, based on the gaps found.

## Key Stats & Facts
Key stats/facts found via search, each with its source noted inline.
"""


async def research_keyword(keyword: str) -> dict:
    prompt = PROMPT_TEMPLATE.format(keyword=keyword)
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())]
    )

    response = await asyncio.wait_for(
        client.aio.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=config,
        ),
        timeout=TIMEOUT_SECONDS,
    )

    sources = []
    try:
        chunks = response.candidates[0].grounding_metadata.grounding_chunks or []
        sources = [c.web.uri for c in chunks if c.web and c.web.uri]
    except (AttributeError, IndexError, TypeError):
        pass

    return {
        "keyword": keyword,
        "research": response.text or "",
        "sources": sources,
    }
