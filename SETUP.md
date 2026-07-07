# SETUP — Pre-flight checklist

*What to have in place before session 1. Kept deliberately short: this is a single-player, offline game, so most "backend" concerns don't apply.*

## Connect / install now (minimum to build)
- [ ] **GitHub repo** created; this package committed at the root.
- [ ] **Claude Code** installed (`npm i -g @anthropic-ai/claude-code`; needs a recent Node LTS). Docs: https://docs.claude.com/en/docs/claude-code/overview
- [ ] **GitHub MCP** connected to Claude Code so it can open branches/PRs/issues in natural language. Official server: https://github.com/github/github-mcp-server (hosted at `https://api.githubcopilot.com/mcp`, or run locally). Verify with `/mcp` inside Claude Code.
- [ ] **Node.js (recent LTS)** installed — the toolchain (TypeScript, Vite, React, Vitest, Capacitor) runs on it. Claude Code can scaffold all of it.
- [ ] **GitHub Actions** for CI (Claude Code can write the workflow: run engine tests + web build on push).
- [ ] `.env` + **GitHub Secrets** habit for any keys (never commit them). Add `.env` to `.gitignore` first thing.

## For the art phase (when cards start needing images)
- [ ] **Google AI Studio API key** (free): https://aistudio.google.com — this is the **Gemini image API (Nano Banana)** key. Free tier ~500 images/day; no subscription needed.
  - Note: your **ChatGPT subscription does not grant OpenAI API access**, and OpenAI's image models are weaker at character consistency — so Gemini is both cheaper and better for recurring heroes. Skip OpenAI for art.
- [ ] Decide **art aspect ratio** + generate **character-sheet references** for recurring heroes first (see `docs/05-art-direction.md`).
- [ ] (Optional) **Cloudflare R2 / S3** if you want art binaries out of git; otherwise git-LFS or commit small PNGs.
- [ ] (Optional) **ElevenLabs** for SFX / AI barks / hero voice lines later.

## Explicitly NOT needed
- ❌ **No payment processor** (Stripe/IAP) — free forever.
- ❌ **No backend / database / auth** (Supabase, Firebase) — single-player, saves on-device.
- ❌ **No servers / netcode** — no online, no PvP.
- ❌ **No runtime AI / LLM API** — the AI opponent is an in-engine heuristic; the game never calls an AI while running.
- ❌ **No web host decision yet** — dev runs locally; static hosting is a trivial later add if ever wanted.

## Accounts to create eventually (for shipping, not now)
- [ ] **Apple Developer Program** ($99/yr) — to publish the iOS build via Capacitor. (Android later: Google Play, one-time $25.)

## First session goal
Have Claude Code read `CLAUDE.md` then `docs/06-decisions-log.md`, then execute the **first engineering task**: stand up `/engine` + `/data`, load `data/cards.seed.json`, implement the effect-verb library, and drive the prototype's rules from data — deterministic and unit-tested. Everything local. No network.
