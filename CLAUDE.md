# Content Factory

3-agent content pipeline: Gemini research → Claude blog writer → Claude social variants.

## Rules

- Short terminal responses only
- No browser automation for testing — user tests manually
- FastAPI serves frontend from /static (no CORS, no separate frontend deploy)
- Render free tier (512MB) — no heavy libraries
- Dev model: claude-haiku-4-5, final demo: claude-sonnet-4-5
- Claude responses may contain ThinkingBlock before TextBlock — iterate response.content by type, never index 0
- Keys from env vars: ANTHROPIC_API_KEY, GEMINI_API_KEY
- Dark Linear-inspired UI: bg #0a0a0b, surface #131316, border #26262b, accent #5e6ad2, Inter + JetBrains Mono
- No fake UI elements, purposeful animation only, mobile responsive
- Commit to git after each working feature
