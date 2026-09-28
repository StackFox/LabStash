# Brag Plan: LabStash

## What is this app?
LabStash is temporary file-sharing for computer labs — upload from the lab PC, get a short code + QR, download later as a ZIP before it auto-deletes. No login, no email limits, no forgotten sign-outs.

## The angle
The last-five-minutes-of-lab heist. Class is ending, your work is trapped on THAT computer, and emailing yourself is humiliating. LabStash is the escape hatch: stash it, grab the key, walk out. Playful, a little smug, built for students who live this panic weekly.

## Hook (first 2-3 seconds)
Giant serif line: "Class is over. Your files live THERE now." — with a flickering lab-PC silhouette. The relatable dread earns the next 17 seconds.

## Key moments (the middle)
- The drop: files fall into the dashed upload zone, progress bar fills 0→100%, "Uploading 3 files" ticks up. The product DOING its thing.
- The key: mono orange short-code `ABC-234-XYZ` slams in, QR card pops beside it, countdown `00:59:59` + "1 time download" pills. Most video-worthy UI in the repo.
- The getaway: phone-style card types the code, file list appears (report.pdf, data.csv, slides.pptx), big orange "Download ZIP" button, then everything poofs with "Expired. Gone forever."

## Outro / punchline
"Take your work home. Not your account." — LabStash wordmark with orange dot. Final beat holds on the tagline from the real hero.

## User flow worth showing
Drop 3 files on lab PC → progress 0→100% → Ready-to-share card with short-code + QR + countdown → type code on second device → file list → Download ZIP → auto-expire.

## Tone
- Preset: default
- Creative direction: midnight lab escape — playful heist for your homework
- Interpretation: Punchy and warm, 5 comfortable scenes with room to read. Serif display for emotion, mono for the code. Motion is snappy (fast-in, then hold); humor comes from the relatable lab panic, not gags.

## Format: landscape — 1920x1080
## Duration: 20 seconds

## Visual identity (from the project)
- Background: #0a0a0b (canvas)
- Surface: #1a1a1d (cards), hairline #2a2a2e
- Accent: #f0532b (burnt orange, primary) + #3d4fc4 (indigo secondary, sparing)
- Text: #ffffff ink, body #b4b4ba, mute #7a7a81
- Display font: Instrument Serif (italic for emphasis, e.g. "Not your account.")
- Body font: Inter
- Mono font: SFMono-Regular / Consolas (short-code, countdown, file sizes)
- Strongest visual element: the Ready-to-share card — giant orange mono short-code, QR block, countdown pill, dashed upload zone. Dark premium lab aesthetic throughout.

## Share copy (draft)
Made LabStash. Upload from the lab computer, grab a code like ABC-234-XYZ, download it later as a ZIP. Built for the last five minutes of a lab session.

## Audio direction
- Role: warm bed
- Music: happy-beats-business-moves-vol-1-by-ende-dot-app.mp3 (most energetic, fits default tone)
- Music treatment: start at 0.0s, volume 0.35, no fade-in, fade out over final 2s under logo hold
- Music cue guidance: tempo 120.19 BPM; beat grid every ~0.5s from 3.02s (3.02, 3.52, 4.02, 4.53, 5.03, 5.53, 6.03 …); strong cues at 16.02, 17.02, 17.52, 18.02, 18.52, 20.02 for the outro lock; sequential card reveals snap to consecutive beats within ±0.10s; 1 major beat-lock (outro logo) within ±0.15s. Full preset at `<skill-dir>/assets/music/cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`.
- Audio-reactive treatment: subtle; RMS/bass breathes the orange glow behind the short-code card and hero headline. No waveforms, no visualizers.
- SFX posture: moderate; motion-matched, professional restraint
- Audio-coupled moments:
  - Scene 3 progress bar — soft ticking/drops as percent climbs
  - Scene 4 code typing — randomized keyboard ticks + card-place on file rows
  - Scene 5 logo — one short announcement bell, then let music fade
- Restraint rule: SFX sit under the music, never over it; no SFX on every word, only on arrivals and interactions.

## Storyboard

### Scene 1 — Hook: "Class is over" — 3s
What's on screen: near-black lab background, faint row of monitor silhouettes. Eyebrow "TEMPORARY STORAGE FOR COMPUTER LABS" then giant Instrument Serif "Class is over." + orange italic "Your files live THERE now." One monitor glows orange.
Sequential/interaction: none — two lines arrive (headline slams, italic line fades up 0.4s later) and hold.
Audio intent: music buildup under; a soft drop when the italic line lands.
Audio-coupled idea: none (let the dread land clean).
Music: upbeat bed, intro 0-3s (pre-beat buildup).
Transition mood: clean → Scene 2

### Scene 2 — Reveal: LabStash — 3s
What's on screen: "LabStash" wordmark with orange dot + tagline "Upload from the lab computer. Download it later. No account needed." Three step pills arrive: 01 Upload / 02 Get a key / 03 Download later. Verbatim copy from README + hero.
Sequential/interaction: yes — 3 step pills arrive one by one on the beat (~0.5s apart), then hold as a set.
Audio intent: lift as the product name lands; playful card sounds per pill.
Audio-coupled idea: card-by-card sequence (3 card-place/drop sounds, accent first and last).
Music: bed; beat grid window ~3.02–5.03s for the 3 pills.
Transition mood: clean → Scene 3

### Scene 3 — The drop: upload in action — 5s
What's on screen: recreated dashed upload zone ("Drop files here — or choose multiple files", "Maximum 50 MB per file · 500 MB total", expiry + download selects). Cursor drops 3 file chips (report.pdf 2.4 MB, data.csv 800 KB, slides.pptx 12 MB). Progress bar fills 0→100% with "68%" mono label. Ends on "Uploading 3 files…" state from FileUploader.tsx.
Sequential/interaction: yes — simulated drag-drop: 3 file chips land one by one, then progress bar fills over ~1.5s.
Audio intent: busy-but-tidy; drops per file, soft ticks under progress.
Audio-coupled idea: counter ticks + drop sounds synced to chips and bar.
Music: bed, mid-energy.
Transition mood: clean → Scene 4

### Scene 4 — The key: code + QR + getaway — 5s
What's on screen: recreated Ready-to-share card: green ✓ "Ready to share.", pills "Available for 00:59:59" + "Download limit 1 time", giant orange mono "ABC-234-XYZ", QR block, share row with Copy link. Then a second mini-card: typed code → file list → orange "Download ZIP" button. One line: "Scan it. Type it. Take it."
Sequential/interaction: yes — code types character by character, QR pops, file rows slide in one by one, cursor clicks Download ZIP.
Audio intent: peak payoff; typing ticks, card sounds per row, one success bell on the button click.
Audio-coupled idea: typed text (keyboard ticks) + beat-aligned file-row reveals + simulated click.
Music: bed, driving.
Transition mood: hard → Scene 5

### Scene 5 — Outro: punchline + logo — 4s
What's on screen: giant serif "Take your work home." + orange italic "Not your account." (verbatim hero H1). Below: LabStash wordmark + "Built for the last five minutes of a lab session." (verbatim hero-note). Orange glow breathes. Hold 2s settled.
Sequential/interaction: none — fast-in, long hold for readability.
Audio intent: resolve; one soft announcement bell on the tagline, music fades under the hold.
Audio-coupled idea: final logo moment (single bell, then fade).
Music: bed fades out over final 2s.
Transition mood: end (hold to black).

**Music mood for this video:** upbeat
**Audio summary:** Warm upbeat corporate bed throughout with a restrained motion-matched layer — drops for arrivals, ticks for typing/progress, one bell for the download payoff and one for the outro — fading under the final logo hold.
