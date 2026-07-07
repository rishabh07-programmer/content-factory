import json
import os

from anthropic import AsyncAnthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is not set")

client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

MODEL = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
MAX_TOKENS = 3000

SYSTEM_PROMPT = (
    "You are a social media copywriter who adapts long-form content into "
    "platform-native posts. You respond ONLY with valid JSON, no preamble, "
    "no markdown code fences, no commentary."
)

USER_PROMPT_TEMPLATE = """Based on this blog post about "{keyword}", write 5 \
platform-specific social media variants.

BLOG POST:
{blog_post}

PLATFORM SPECS:
- twitter: a thread of 5-7 tweets, hook in the first tweet, each tweet under \
280 characters, numbered (e.g. "1/", "2/"). Join the tweets with newlines in \
a single string.
- linkedin: 150-250 words, professional but personal tone, use line breaks \
for readability, end with a question, include 3-5 hashtags.
- instagram: caption of 100-150 words, emoji-friendly, strong hook line, \
8-10 hashtags at the end.
- facebook: 80-120 words, conversational tone, shareable angle, 1-2 emojis \
max.
- whatsapp: 50-80 words, direct broadcast style for a business update, no \
hashtags, 1 emoji.

Respond with ONLY a JSON object in exactly this shape, no other text:
{{
  "twitter": "...",
  "linkedin": "...",
  "instagram": "...",
  "facebook": "...",
  "whatsapp": "..."
}}"""


def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


async def create_social_variants(keyword: str, blog_post: str) -> dict:
    prompt = USER_PROMPT_TEMPLATE.format(keyword=keyword, blog_post=blog_post)

    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = "".join(block.text for block in response.content if block.type == "text")
    variants = json.loads(_strip_fences(raw))

    return {"keyword": keyword, "variants": variants}
