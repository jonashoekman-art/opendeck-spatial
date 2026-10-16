# Antigravity IDE Rules & Agent Skills: OpenDeck Spatial Sing & Mix

## 1. Core Mandates (Read Before Writing Any Code)
1. **Accessibility First (Priority #1):**
   - Every UI component MUST meet **WCAG 2.2 AAA** contrast (7:1 minimum), use colorblind-safe palettes (Blue `#0072B2` for Deck A, Amber/Gold `#E69F00` or Magenta `#CC79A7` for Deck B), include full WAI-ARIA attributes, keyboard focus rings, and support `prefers-reduced-motion` (max 3 flashes/sec on projector visuals).
   - Never rely on color alone; always pair states with icons/shapes.
2. **Strict i18n (`nl-BE` & `en-US`):**
   - NEVER hardcode user-facing text in React components. Always use `useTranslation()` with keys from `/src/i18n/locales/{nl,en}.json`.
   - Every key must support both `.pro` and `.kids` label variants when `isKidsMode` is active.
3. **Permissive Open Source Only (MIT):**
   - All generated code is licensed under MIT. Only install npm/cargo packages with `MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, or `ISC` licenses. Strictly NO `GPL` or `AGPL` packages.
4. **English Codebase:**
   - All variable names, function names, Rust structs, TypeScript interfaces, and inline code comments MUST be written in **English**.
5. **60fps Audio & Visual Performance Rule:**
   - NEVER store high-frequency audio playhead positions, waveform scroll offsets, or FFT spectrum arrays inside React `useState` or Zustand stores that trigger React re-renders.
   - Use `requestAnimationFrame` loops reading directly from the `AudioEngine` singleton or `SharedArrayBuffer` to render onto HTML5 `<canvas>` refs.

---

## 2. Adaptive 2-Tier Hardware Awareness (`PRO_MAC` vs `LIGHT_PI`)
Always check the `systemTier` state (`'PRO_MAC' | 'LIGHT_PI'`):
- When running on **Raspberry Pi (`LIGHT_PI` / `800x480` viewport)**:
  - Disable local execution of heavy Python AI sidecars (`Demucs` and `Whisper`). Instead, read pre-computed stems/lyrics from the track's `.opendeck-cache/` folder or use the lightweight `VocalReducerWorklet` (Mid/Side DSP).
  - Switch the Projector Stage Window from 3D WebGL shaders to lightweight 2D Canvas/CSS animations.
  - Render the `800x480` Touchscreen Kiosk UI with minimum `64x64px` touch targets.

---

## 3. Modular Agent Skills (Load Context Per Task)
When implementing features, follow these 4 isolated skill domains:

### Skill A: `skill-audio-spatial-dsp`
- **Scope:** `/src/audio/**` and `/src-tauri/src/audio/**`
- **Responsibilities:**
  - Web Audio API graph per deck: `Source -> TimeStretchWorklet -> VocalReducerWorklet (or 4 Stems) -> 3BandEQ -> BipolarFilterWorklet -> SpatialMatrixMerger (8ch 5.1.2 HDMI) -> Destination`.
  - Mid/Side vocal cancellation preserving frequencies `< 160Hz` via Linkwitz-Riley LPF.
  - Secondary audio output routing for 3.5mm / Bluetooth Headphone Cue + configurable visual delay offset (`-500ms` to `+500ms`).

### Skill B: `skill-4d-hardware-bridge`
- **Scope:** `/src-tauri/src/hardware/**` and `/src/services/showControl.ts`
- **Responsibilities:**
  - Direct USB control of the **Gembird Power Strip** via `sispmctl` CLI (`sispmctl -o 1..4` / `sispmctl -f 1..4`) on both macOS and Linux.
  - Lightweight MQTT/Serial client (`rumqttc` / `serialport`) talking to the local Zigbee 3.0 USB Stick (`zigbee2mqtt` on `localhost:1883`) and IR Blaster for battery LED lights.
  - Enforce a strict **3000ms anti-chatter cooldown** on all 230V relays and automatic shutoff timers (`30s` max for Scent Diffuser, `20s` burst for Fans on Party Button).

### Skill C: `skill-accessible-adaptive-ui`
- **Scope:** `/src/components/**`, `/src/i18n/**`, and `/src/windows/**`
- **Responsibilities:**
  - Responsive layout switching between **Desktop Monitor Mode** (`>1024px`) and **Raspberry Pi 7" Touchscreen Mode** (`800x480`).
  - Secondary Tauri window (`/stage`) for the Projector showing syllable-synced `.lrc` Karaoke lyrics scaled by `deck.playbackRate`.
  - Built-in WebSocket server (`port 8765`) serving the mobile Android Multi-Touch Controller PWA (`/controller`) over Wi-Fi or USB Tethering.

### Skill D: `skill-keyboard-stencil-cad`
- **Scope:** `/src/input/keyboardMatrix.ts` and `/src/tools/StencilGenerator.tsx`
- **Responsibilities:**
  - External USB QWERTY keyboard mapper with `1/4-beat Auto-Quantize` in Kids Mode and smooth crossfader glide on Left/Right arrow hold.
  - 1:1 scale SVG/PDF generator (`usb-keyboard-kids-stencil.svg`) and parametric OpenSCAD generator (`usb-keycap-toppers-and-fader.scad`) for physical cardboard/3D-printed keyboard overlays.

---

## 4. Recommended Implementation Order (Vertical Slices)
1. **Slice 1 (Foundation, i18n & Accessibility Shell):** Initialize Tauri v2 + React + TypeScript + Tailwind + `i18next` (`nl`/`en`) + High-Contrast / Kids Mode theme switcher + `800x480` Pi Touchscreen responsive toggle.
2. **Slice 2 (Dual-Deck Audio & Real-Time Karaoke DSP):** Implement the dual audio engine, `VocalReducerWorklet` (Mid/Side with 160Hz bass preservation), Bipolar Filter, 5.1.2 HDMI channel routing, and External USB Keyboard Matrix.
3. **Slice 3 (Stage Projector Window & Synced Lyrics):** Build the pop-out projector window with `.lrc` parser, dynamic pitch-synced word highlighting, and photosensitive-safe particle effects.
4. **Slice 4 (Direct USB 4D Hardware Bridge):** Add Rust commands for `sispmctl` (Gembird USB strip), local Zigbee/IR triggers, relay safety timers, and the `Spacebar` Big Party Drop macro.
5. **Slice 5 (Android WebSocket PWA & Printable Stencil Generator):** Add the local WebSocket controller page and the SVG/OpenSCAD overlay export tool.