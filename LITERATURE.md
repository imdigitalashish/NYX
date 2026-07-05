# SOTA literature — text-as-image / context compression (searched 2026-07)

## Key papers
1. **DeepSeek-OCR: Contexts Optical Compression** (arXiv 2510.18234, Oct 2025) — the landmark.
   - Renders text to image, custom "DeepEncoder" keeps low activations at high resolution.
   - **97% OCR precision at <10x compression; ~60% at 20x.** Establishes the optical curve.
   - Beats GOT-OCR2.0 using 100 vision tokens/page; <800 tokens beats MinerU (6000+).
   - Insight: there's an OPTIMAL vision-token count per page; resolution is the lever.

2. **VIST / Vision-centric Token Compression** (NeurIPS 2025 spotlight, arXiv 2502.00791)
   - "slow-fast": render DISTANT/low-salience context to images (fast path, frozen light
     vision encoder), keep PROXIMAL window as text (slow path). Same acc, 2.3x fewer tokens.
   - **Probability-Informed Visual Enhancement (PVE): masks HIGH-FREQUENCY (function) words
     during training** so the encoder concentrates on semantically rich regions — like a
     skilled reader glossing over "the", "of".

3. **VIST2 / Global Context Compression w/ Interleaved Vision-Text** (arXiv 2601.10378, 2026)
   - Renders text chunks to "sketch images", interleaves with text. 4x compression,
     3x faster first-token, -77% memory, -74% FLOPS.

4. **Context Cascade Compression (C3)** (arXiv 2511.15244, 2025)
   - Pure-TEXT latent compression: 98% at 20x, 93% at 40x — BEATS optical (DeepSeek 60%@20x).
   - Caveat: requires TRAINING custom cascaded LLMs. Not usable with a frozen commercial API.
   - Establishes optical compression has a lower ceiling than learned latent — but that's
     for models you can train. We use frozen APIs, so optical is our only lever.

## What this means for Nyx (frozen commercial VLM, no training)
- We CAN'T do C3/VIST (need model training). Our niche: best possible OPTICAL packing for a
  FROZEN API — a space these papers don't optimize (they co-train encoder+decoder).
- VALIDATED ideas we can steal WITHOUT training:
  a) **Salience masking (from VIST PVE):** drop/shrink high-frequency function words before
     render. Fewer chars to pack -> higher effective density, IF model reconstructs gist.
  b) **Proximal-text / distant-image split (from VIST):** recent turns text, old imaged.
     (This is already Nyx's model; SOTA confirms it's the right architecture.)
  c) **Optimal vision-token count (from DeepSeek):** there's a resolution sweet spot — our
     T1/T3 cliff findings are the frozen-API version of this.
- NEW theses spawned below (T7, T8).
