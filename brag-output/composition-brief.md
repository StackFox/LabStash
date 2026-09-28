# Hyperframes Composition Brief: LabStash

## Objective
Create a short launch-style brag video for LabStash.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: /home/stackfox/Work/LabStash
- Primary files read: frontend/app/page.tsx (hero H1, steps, FAQ), frontend/app/globals.css (design system), frontend/components/upload/FileUploader.tsx (upload + ready-to-share states), frontend/components/download/FileDownloader.tsx (code entry + ZIP flow), README.md
- Product name: LabStash
- Tagline / strongest claim: "Take your work home. Not your account."
- Key UI or visual moment to recreate: the Ready-to-share card — giant orange mono short-code ABC-234-XYZ, QR block, countdown pill "Available for 00:59:59", download-limit pill, dashed upload zone with progress bar
- Copy that must appear verbatim:
  - Take your work home. Not your account.
  - Built for the last five minutes of a lab session.
  - Upload from the lab computer. Download it later. No account needed.
  - ABC-234-XYZ
  - Drop files here
  - Ready to share.
  - Download ZIP

## Creative Direction
- Tone preset: default
- Creative direction: midnight lab escape — playful heist for your homework
- Interpretation: Punchy and warm; fast-in then hold for readability; serif display for emotion, mono for the code; humor from relatable lab panic.
- Angle: The last-five-minutes-of-lab heist. Class is ending, work is trapped on THAT computer, emailing yourself is humiliating. LabStash is the escape hatch: stash it, grab the key, walk out.
- Hook: first 2-3 seconds — "Class is over. Your files live THERE now." over glowing lab monitors.
- Outro / punchline: "Take your work home. Not your account." + LabStash wordmark.
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign

## Visual Identity
- Background: #0a0a0b (canvas); cards #1a1a1d; hairline #2a2a2e
- Text: #ffffff ink; body #c9c9ce (lightened from #b4b4ba for contrast headroom); muted labels #a1a1a8 (lightened from #7a7a81 for WCAG)
- Accent: #f0532b (burnt orange, primary); #3d4fc4 indigo sparing
- Display font: Instrument Serif via Google Fonts (fallback Georgia, serif); italic for emphasis lines
- Body font: Inter via Google Fonts (fallback system sans)
- Mono: SFMono-Regular, Consolas, monospace (short-code, countdown, sizes)
- Visual references from the project: dashed upload zone, step cards 01/02/03, Ready-to-share card with QR + countdown, pill buttons, hero H1 layout

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook "Class is over" — 3s — giant serif dread line + glowing monitors
2. Reveal LabStash — 3s — wordmark + tagline + 3 step pills arriving one by one
3. The drop (upload in action) — 5s — dashed zone, 3 file chips land, progress 0→100%
4. The key (code + QR + getaway) — 5s — typed ABC-234-XYZ, QR pop, file rows, Download ZIP click
5. Outro punchline + logo — 4s — "Take your work home. Not your account." + hold

## Audio
- Audio role: warm bed
- Audio arc: buildup under hook → lift on reveal → busy-tidy under upload → peak payoff on download click → resolve + fade under logo hold
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3
- Music treatment: start 0.0s, volume 0.35, no fade-in, fade out over final 2s under logo hold
- Music cue guidance: preset at `/home/stackfox/.agents/skills/brag/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json` (tempo 120.19 BPM; beat grid ~0.5s from 3.02s; strong cues 16.02, 17.02, 17.52, 18.02, 18.52, 20.02). 1 major beat-lock (outro logo ≈16.0s near 16.02 strong cue, ±0.15s). Sequential pills/rows snap to consecutive beats ±0.10s. Optional hints only — readability first.
- Audio-reactive treatment: subtle; RMS/bass breathes the orange glow behind short-code card and hero headline. No waveforms/visualizers.
- Audio-coupled moments:
  - Scene 3 progress — drop/tick sounds with chips + bar
  - Scene 4 typing + rows + click — keyboard ticks, card-place per row, click + bell on Download ZIP
  - Scene 5 logo — single soft bell, then music fade
- SFX selection guidance: motion-matched restraint; card sounds for pills/rows, drops for file chips, keypress for typed code, click for button, bell for payoffs. Prefer low high-frequency-risk files for repeated moments (see sfx-analysis.md).
- SFX analysis guidance: /home/stackfox/.agents/skills/brag/assets/sfx/sfx-analysis.md (+ .json); prefer low/medium HF risk for repeated/typing moments.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music and any Hyperframes-selected SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core` (composition contract + `data-*` timing), `hyperframes-animation` (motion), `hyperframes-creative` (design spec, beats, audio-reactive), `hyperframes-keyframes` (seek-safe keyframes), and `hyperframes-cli` (lint/check/render). /brag is its own workflow: do not enter the `hyperframes` entry-point intent interview and do not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer unless audio was explicitly disabled or documented as intentionally silent.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use only 1-3 strong cue locks in a 15-25s video unless the edit clearly benefits from more.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music, using the best Hyperframes-supported implementation.
- When music is present and the treatment is not `none`, consider Hyperframes audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion. Good targets are glow, depth, background warmth, card presence, title emphasis, or other existing visual elements. Avoid waveform/equalizer visuals, musical-note graphics, generic particle systems, strobing, or heavy pulsing.
- Use local assets for audio and any required runtime/media dependencies when possible.
- Run `hyperframes check` before render — it is brag's single gate.
