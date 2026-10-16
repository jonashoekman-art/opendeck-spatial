# Architecture & System Design: OpenDeck Spatial

## 1. Zero-Dependency Native Web Engine
OpenDeck Spatial uses native ES Modules (`<script type="module">`), modern Vanilla CSS Custom Properties, and standard Web Audio API AudioWorklets.
- **Boot Time:** < 50ms
- **Memory Footprint:** < 20MB RAM (ideal for Raspberry Pi)
- **Zero Build Step:** Runs directly via `node server.js` without requiring Webpack, Vite, or Babel bundling.

---

## 2. Audio Graph Topology
Each deck operates through an independent Web Audio API processing chain:

```text
[Audio Buffer Source (Demo or Local File)]
   │
   ▼
[VocalReducerWorklet (Mid/Side DSP with 160Hz Linkwitz-Riley LPF)]
   │
   ▼
[3-Band EQ (Low: 250Hz, Mid: 1kHz, High: 4kHz) with Instant Kill]
   │
   ▼
[Bipolar Filter (LPF -1.0 to HPF +1.0 with Center Detent)]
   │
   ▼
[Channel Gain & Analyser Node (60fps Canvas Waveform)]
   │
   ▼
[Virtual Dual-Rail Crossfader (Constant Power Curve)]
   │
   ▼
[Master Gain & AudioContext Destination (5.1.2 HDMI / Stereo)]
```

### Real-Time Vocal Reducer Math
1. **Decomposition:**
   $$M = \frac{L + R}{2}, \quad S = \frac{L - R}{2}$$
2. **Bass Preservation:** $M$ is passed through a 2nd-order Linkwitz-Riley Low-Pass Filter ($f_c = 160\text{ Hz}$, $Q = 0.5$) to extract $M_{\text{low}}$ (center kick and bass fundamentals).
3. **Mid-High Extraction:** $M_{\text{high}} = M - M_{\text{low}}$.
4. **Vocal Attenuation:** Scaled by $\alpha \in [0.0, 1.0]$:
   $$L_{\text{out}} = S + M_{\text{low}} + (\alpha \cdot M_{\text{high}})$$
   $$R_{\text{out}} = -S + M_{\text{low}} + (\alpha \cdot M_{\text{high}})$$

---

## 3. Adaptive 2-Tier Hardware Support
1. **Desktop View (>1024px):**
   - Optimized for macOS Clamshell Mode with external displays.
   - Dual horizontal parallel waveforms at top, Deck A controls on left, center Mixer, Deck B controls on right.
2. **Raspberry Pi 7" Touchscreen Kiosk (800x480):**
   - Strict `64x64px` minimum touch target size.
   - Fixed height allocation (38px header + 48px waveform + 280px decks + 100px bottom mixer bar) ensuring 0px vertical overflow.

---

## 4. Split-Hand External USB Keyboard Matrix
Designed for an external USB QWERTY keyboard, keeping the laptop closed:
- **Deck A (Left Hand):** `S` (Play/Pause), `A` (Cue), `D/F` (Nudge), `T` (Sync / Key Lock), `1-4` (Hot Cues), `Q-R` (Pads), `Z/X/C` (EQ kills), `V` (Vocal Mute/100%, Shift+V = 20% Guide).
- **Deck B (Right Hand):** `K` (Play/Pause), `J` (Cue), `L/;` (Nudge), `Y` (Sync / Key Lock), `7-0` (Hot Cues), `U-P` (Pads), `M/,/.` (EQ kills), `/` (Vocal Mute/100%).
- **Center & Global:** `ArrowLeft/Right` (Smooth Crossfader Glide), `Spacebar` (Big Party Drop: Confetti + Audio Riser).
