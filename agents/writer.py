import os

from anthropic import AsyncAnthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
MAX_TOKENS = 4000

SYSTEM_PROMPT = (
    "You are an expert content writer. You write for humans first, SEO second. "
    "Your posts are clear, specific, and free of filler."
)

USER_PROMPT_TEMPLATE = """Write a long-form SEO blog post for the keyword "{keyword}".

Here is research on the competitive landscape for this keyword:

{research}

Instructions:
- 1200-1500 words
- Markdown format, with H2/H3 structure
- Open with a hook, not a generic intro
- Use the Content Gaps from the research as your unique angle — cover what \
competitors miss
- Include the stats/facts from the research where relevant
- End each major section with an actionable takeaway
- Close with a strong call to action

Write the full blog post now."""


async def write_blog(keyword: str, research: str) -> dict:
    prompt = USER_PROMPT_TEMPLATE.format(keyword=keyword, research=research)

    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    blog_post = "".join(
        block.text for block in response.content if block.type == "text"
    )

    return {
        "keyword": keyword,
        "blog_post": blog_post,
        "word_count": len(blog_post.split()),
    }
