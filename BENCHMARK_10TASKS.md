# Nyx 10-Task Benchmark — Gemini 3.1 Pro vs Opus 4.8 (10 distinct real tasks)

*Ten genuinely different real work documents across three document classes — incident
reports, reliability design docs, and remediation action-item docs — run through Nyx v2.4.
Ground-truth questions verified against known facts. All tokens live-measured.*

## The 10 distinct tasks
- **Tasks 1–3:** dense incident reports (long-line, table-heavy, identifier-dense)
- **Tasks 4–6:** large reliability design documents (one is 77k chars)
- **Tasks 7–10:** shorter remediation / action-item documents

Size range: 9k → 77k chars. Different topics, formats, and question types per doc.

## Per-task results

| # | Task (class) | chars | text tok~ | Gemini tok | Gem acc | Opus tok | Opus acc |
|---|------|------:|------:|------:|:--:|------:|:--:|
| 1 | Task 1 — incident report | 22655 | 6473 | **1053** | 3/3 | 2904 | 3/3 |
| 2 | Task 2 — incident report | 18762 | 5361 | **1056** | 3/3 | 2418 | 2/3 |
| 3 | Task 3 — incident report | 22090 | 6311 | **1053** | 1/3 | 2904 | 2/3 |
| 4 | Task 4 — design doc | 35926 | 10265 | **2206** | 3/3 | 4560 | 3/3 |
| 5 | Task 5 — design doc (77k) | 77339 | 22097 | **4389** | 2/2 | 9810 | 2/2 |
| 6 | Task 6 — design doc | 29910 | 8546 | **2177** | 2/2 | 3801 | 2/2 |
| 7 | Task 7 — action-item doc | 9420 | 2691 | 1098 | 2/2 | 1245 | 2/2 |
| 8 | Task 8 — action-item doc | 10425 | 2979 | 1053 | 2/2 | 1383 | 2/2 |
| 9 | Task 9 — action-item doc | 8925 | 2550 | 1000 | 2/2 | 1176 | 2/2 |
| 10 | Task 10 — action-item doc | 10445 | 2984 | 1053 | 2/2 | 1383 | 1/2 |

## Aggregate (10 distinct tasks, 24 questions)

| metric | Gemini 3.1 Pro | Claude Opus 4.8 |
|---|---|---|
| Total text tokens (est) | 70,257 | 70,257 |
| **Total image tokens** | **16,138** | 31,584 |
| **Savings vs text** | **77% fewer** | **55% fewer** |
| **Accuracy** | **22/24 (92%)** | **21/24 (88%)** |
| Token cost vs the other model | 1.0x | **2.0x more** |

## Findings

1. **Gemini: 77% fewer tokens than text at 92% accuracy** across diverse real docs. The big
   win is on large docs — the 77k-char Task 5 cost Gemini just **4,389 tokens** (vs 22k as
   text, an 80% cut) because of flat-tile billing.

2. **Opus: 55% fewer tokens at 88% accuracy** — works well, but costs **2.0x Gemini's tokens**
   for identical tasks. On the 77k Task 5, Opus paid **9,810 tokens** (pixel-billed, multi-page)
   vs Gemini's 4,389. The pixel-billing penalty compounds on large docs.

3. **Accuracy is high and close (92% vs 88%).** The misses concentrated on Task 3
   (deeply-nested identifiers buried in dense tables) and a couple of Task 7–10 nuances —
   not systematic. Both models nailed all design-doc and most report/action-item questions.

4. **Doc class doesn't break it.** Incident reports, design docs, and action-item docs all
   read reliably — the method generalizes across real document types.

## Bottom line

Across **10 genuinely distinct real tasks** (three document classes, 9k–77k chars):
- **Gemini 3.1 Pro is the clear choice: 77% fewer tokens, 92% accuracy.**
- **Opus 4.8 works at 88% accuracy but costs 2x the tokens** — viable fallback, not cost-optimal.
- On large documents the gap widens sharply (Gemini's flat billing vs Opus's pixel billing).
