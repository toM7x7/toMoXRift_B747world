# Thumbnail review — 2026-09-05

- Final: `public/thumbnail.png` (1280 × 720).
- Reproducible layout: `docs/screenshots/thumbnail-layout.html`; local preview at port 5184, viewport 1280 × 720, wait for `document.fonts.ready` before capture. Uses the locally downloaded official Noto Sans JP variable font (same font used by subset-font.py).
- Asset board: Claude full aircraft / gate; Sol open cutaway side / terminal; Astra aircraft / terminal / apron. All three are actual local world screenshots, not generated or repainted geometry.
- Sources: `thumbnail-claude-source.png`, `thumbnail-sol-open-side-source.png`, `thumbnail-astra-source.png`. Source scene validator PASS for all three. Camera coordinates appear in capture history; initial Sol shot from the terminal side is retained as `thumbnail-sol-source.png` but rejected for occlusion.
- Copy: B747 AIモデル比較展示会 / 機体も、空港も、まるごと比較。
- Names: Claude / Fable, GPT-5.6 Sol, GPT-6 Astra, matching the exhibition credits.
- Design: three equally sized panels, actual scenes dominate the body; deterministic HTML/CSS typography. Warm orange, yellow and cyan labels distinguish the three works. No synthetic scene additions.
- Full-size review: aircraft, surrounding facilities and Japanese glyphs are visible. No HUD or loading residue. Source crop preserves aircraft noses and tails. Sol shows its original cutaway geometry.
- Card-size review: title and all three model names remain legible at 480 × 270; aircraft silhouettes distinguish the works. Secondary details are intentionally subordinate.
- Scope: artwork comparison with differing production conditions / display scales; no equal-prompt or quality-ranking claim. Public headset / site visual acceptance remains with the user.

# Windows publish path repair

Version 2 upload used backslashes in nested Windows asset paths: normal slash GLB URLs returned 404 while encoded backslash URLs returned 200. All seven GLBs are now directly under public with unique `sol-*` / `astra-*` names. SHA256 of all seven model files was unchanged. Floor checks and production build passed after the path change. Verify the new CDN version before calling the release complete.
