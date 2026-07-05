# Autonomous Research Session Summary

Ran 34 experiments overnight, productionized findings, pushed to GitHub. Kill-fast, all
numbers live-measured against commercial VLM APIs, git-checkpointed.

## The headline
Nyx beats narrow-baseline on Gemini by exploiting a discovery narrow-baseline missed: **Gemini bills image
tokens FLAT (~1080) for any size up to 25 Mpx.** Pack the whole doc into wide flat-billed
pages -> ~35% avg (50% on large docs) fewer tokens than narrow-baseline, ~86% fewer than text, at
equal-or-better accuracy on real content.

## Biggest surprises
1. **Gemini reads 40-char SHA-1 hashes 8/8 EXACT** — the field's "optical is lossy for
   verbatim" assumption (narrow-baseline 0/15, DeepSeek-OCR 60%@20x) is a weak-encoder artifact.
2. **Image requests are ~3x SLOWER wall-clock** despite 85% fewer tokens (honest tradeoff:
   cost not speed).
3. **Font engineering is a dead end** — hand-designed 4x6 Tom Thumb and real TrueType both
   lose to the incumbent 5x8 Spleen atlas.
4. **Don't over-cram** — 31k in one page = 50% acc; same content in 2 pages = 100%.

## Production tool (v2.4, shipped to GitHub main)
Provider-adaptive: Gemini (wide flat-billed pages, ~24k chars/page, auto-compress large,
multi-file mode), Opus (8x12 glyphs), GPT (text passthrough). Size-adaptive geometry.
Sentinel-safe. Auto-compress above 24k chars.

## What's on GitHub
- main: production tool v2.4 + README + PAPER + INDEX + RESULTS
- research/t1-t3-findings: all 34 experiments with receipts

## Honest boundaries
best on Gemini 3.1 Pro; works on Opus 4.8 at lower savings. ~73% accuracy on real dense reports (100%
gist, misses on deep-buried long IDs). 3x slower wall-clock. Lossy — read exact IDs as text
when critical.
