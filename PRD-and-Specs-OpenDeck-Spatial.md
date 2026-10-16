# Master PRD & Technical Specifications: OpenDeck Spatial Sing & Mix

- **Version:** 1.0.0 (Spec-Driven Development Blueprint)
- **License:** MIT License (Strict requirement: Only permissive dependencies allowed: MIT, Apache-2.0, BSD, ISC. Zero GPL/AGPL code).
- **Primary Target:** macOS (Apple Silicon M3) in Clamshell Mode + External Monitor + Projector + HDMI 5.1.2 Dolby Atmos Soundbar (Porsche Design PDB90).
- **Backup / Portable Target:** Raspberry Pi (4/5) running Linux (`arm64`) with Official 7" Raspberry Pi DSI Touchscreen (`800x480`) + HDMI Projector/Soundbar output.
- **Core Philosophy:** Accessibility-First (#1 Priority), Multilingual (`nl-BE` & `en-US`), Local-First, Kid-Friendly (7+ years), and 4D Room-Synchronized.

---

## 1. Priority #1: Universal Accessibility (a11y) & Internationalization (i18n)

Accessibility is not an afterthought; it is the foundational constraint of every UI component, keyboard mapping, and projector visual.

### 1.1. Accessibility Requirements (WCAG 2.2 AAA Target)
1. **Colorblind-Safe & High-Contrast Palettes:**
   - Default deck colors use universal colorblind-safe pairs: **Deck A = High-Contrast Cyan/Blue (`#0072B2`)** and **Deck B = High-Contrast Amber/Gold (`#E69F00`)** or **Magenta (`#CC79A7`)**, avoiding problematic Red/Green combinations.
   - Waveforms use **Shape + Brightness + Pattern** in addition to color (e.g., Bass = Solid thick center bar, Mid = Hatched medium wave, Vocals = Outlined top crest) so frequency content is distinguishable without color vision.
   - Minimum contrast ratio of **7:1 (WCAG AAA)** on all controls, keycap badges, and projector karaoke lyrics.
2. **Typography & Dyslexia / Early-Reader Support (7-Year-Old Friendly):**
   - Built-in font toggle supporting **Atkinson Hyperlegible** and **OpenDyslexic** alongside clean geometric sans-serifs.
   - **Icon-First Pictographic Mode:** Every button pairs text with a distinct, persistent SVG/Emoji pictogram (`▶️`, `🎤`, `🥁`, `🎸`, `🎹`, `💨`, `🌸`, `🕯️`, `🎉`) so pre-readers, early readers, or users in dark party environments never rely on text alone.
3. **Screen Reader, Audio Description & Tactile Feedback:**
   - Full **WAI-ARIA** live regions (`aria-live="polite"`) for track loading, BPM changes, stem states, and remaining song time.
   - **Audio Cues in Headphone Channel:** Optional spoken/chime TTS prompts routed *exclusively* to the DJ Headphone Cue output (e.g., announcing *"Deck B geladen, 124 BPM, nog 15 seconden tot refrein"* / *"Deck B loaded, 124 BPM, 15 seconds to chorus"*).
   - **100% Keyboard Navigability:** Every function in the application can be operated without a mouse or touchscreen.
   - **Photosensitive Epilepsy Safety (Harding/WCAG 2.3.1 Rule):** Projector visuals and IR room lighting effects are strictly rate-limited to **< 3 flashes per second** with smooth luminance transitions. A prominent `"Calm Visuals / Reduced Motion"` toggle disables rapid particle bursts and strobe effects.
4. **Motor Accessibility & Sticky Controls:**
   - Minimum touch target size of **`64x64px`** on the Raspberry Pi Touchscreen and Android Controller (exceeding the `44x44px` standard).
   - **Latching Mode (No Hold Required):** Any hold-based action (like `Cue Hold` or `Spacebar Party Cut`) can be switched to a single-press toggle for users or children with limited fine motor control.

### 1.2. Internationalization (i18n) Architecture (`nl-BE` & `en-US`)
- **Framework:** `i18next` + `react-i18next` with strict TypeScript translation key validation (zero hardcoded UI strings allowed in `.tsx` files).
- **Supported Locales Out-of-the-Box:**
  1. `nl-BE` / `nl-NL` (Nederlands / Vlaams - Default)
  2. `en-US` (English)
- **Dual-Complexity Tone Matrix per Language:**
  Each locale file contains both `standard` (Pro DJ) and `kids` (7-year-old intuitive) phrasing:

```json
{
  "nl": {
    "deck": {
      "vocal_slider_pro": "Zangvolume (Stem Isolatie)",
      "vocal_slider_kids": "🎤 Zanger Zachter / Meezingen",
      "bipolar_filter_pro": "Bipolair Filter (LPF / HPF)",
      "bipolar_filter_kids": "🌊 Onderwater / Ruimte Geluid",
      "party_button_pro": "Drop & Kamer Effecten Trigger",
      "party_button_kids": "🎉 GROTE FEESTKNOP!"
    }
  },
  "en": {
    "deck": {
      "vocal_slider_pro": "Vocal Level (Stem Isolation)",
      "vocal_slider_kids": "🎤 Singer Volume / Sing-Along",
      "bipolar_filter_pro": "Bipolar Filter (LPF / HPF)",
      "bipolar_filter_kids": "🌊 Underwater / Space Sound",
      "party_button_pro": "Drop & Room FX Trigger",
      "party_button_kids": "🎉 BIG PARTY BUTTON!"
    }
  }
}
```

---

## 2. Adaptive 2-Tier System Architecture (MacBook M3 vs. Raspberry Pi Backup)

The application is built on **Tauri v2 (Rust Backend + WebView Frontend)** and automatically adapts its resource profile based on hardware detection (`SystemTier = 'PRO_MAC' | 'LIGHT_PI'`).

```text
+-----------------------------------------------------------------------------------+
|                      SINGLE CODEBASE (Tauri v2: Rust + React)                     |
+-----------------------------------------+-----------------------------------------+
| TIER 1: MACBOOK AIR M3 (Clamshell)      | TIER 2: RASPBERRY PI BACKUP (Light Mode)|
+-----------------------------------------+-----------------------------------------+
| - AI Stem Separation (Demucs Sidecar)   | - Zero AI Overhead (Reads pre-baked     |
| - AI Lyrics Timing (mlx-whisper Sidecar)|   .opendeck-cache stems or uses DSP)    |
| - Apple Music ScreenCaptureKit Loopback | - Real-time Mid/Side Vocal Reducer (<2%)|
| - 5.1.2 / 7.1 Spatial Audio HDMI Engine | - HDMI Audio Out + 3.5mm/USB Cue Out    |
| - 60fps WebGL Projector Visuals         | - 2D CSS/Canvas Light Projector Visuals |
| - External Monitor + Projector + Tablet | - Official 7" Pi Touchscreen (800x480)  |
|   + External USB Keyboard               |   + Projector + External USB Keyboard   |
+-----------------------------------------+-----------------------------------------+
                                          |
                          [ Plug & Switch Powered USB Hub ]
                                          |
        +---------------------------------+---------------------------------+
        |                                 |                                 |
[Extern USB Keyboard]          [Gembird USB Power Strip]         [Zigbee 3.0 USB Stick]
 + 3D/Cardboard Overlay         (sispmctl: Fans & Scent)          (Smart Plugs + IR Blaster)
```

### 2.1. The `.opendeck-cache` Pre-Bake Standard (Mac-to-Pi Portability)
Whenever a song (`song.mp3`) is analyzed on the MacBook Air M3, the app writes a portable subfolder next to the audio file:
```text
/Music/KidsParty/
  ├── LetItGo.mp3
  └── .opendeck-cache/
       └── LetItGo/
            ├── metadata.json       (BPM, Key, Beatgrid, Mood Color, Auto-4D Cues)
            ├── lyrics.lrc          (Word-level synced timestamps)
            ├── stem_vocals.ogg     (Optional pre-split stems for Pi Zero-CPU playback)
            ├── stem_drums.ogg
            ├── stem_bass.ogg
            └── stem_melody.ogg
```
When the USB drive is plugged into the Raspberry Pi, the Pi instantly gets full 4-stem control and word-synced karaoke **with 0% AI CPU load**. If a song has no `.opendeck-cache`, both Mac and Pi fall back to the instant **Mid/Side DSP Vocal Reducer**.

---

## 3. Specification 01: Audio, Karaoke DSP & Spatial 5.1.2 HDMI Engine

### 3.1. Supported Audio Formats & Sources
- **Local Files:** `.mp3`, `.wav`, `.m4a` (AAC & ALAC), `.flac`, `.ogg`.
- **Apple Music Integration (macOS Primary):**
  - *Mode A (Full Dolby Atmos Passthrough):* Native Apple Music app outputs Dolby Atmos via HDMI directly to the Porsche Design Soundbar. OpenDeck captures the system audio loopback via macOS `ScreenCaptureKit` (zero user configuration) solely to drive beat detection, projector lyrics sync, and 4D room effects.
  - *Mode B (Live Remix / Vocal Reduction on Stream):* OpenDeck routes the `ScreenCaptureKit` PCM ringbuffer through its internal DSP graph, enabling live Vocal Reduction, EQ, and Bipolar Filtering on streamed tracks.

### 3.2. Real-Time Zero-Latency Vocal Reducer (`VocalReducerWorklet.ts`)
Works on both MacBook M3 and Raspberry Pi (< 2% CPU usage) for any stereo track:
1. Convert Stereo $(L, R)$ into Mid/Side signals:
   $$M = \frac{L + R}{2}, \quad S = \frac{L - R}{2}$$
2. Preserve Center Bass & Kick Drum by passing $M$ through a 2nd-order Linkwitz-Riley Low-Pass Filter at $f_c = 160\text{ Hz}$ to obtain $M_{\text{low}}$, and high-pass for $M_{\text{high}} = M - M_{\text{low}}$.
3. Apply the user's Karaoke Vocal Slider $\alpha \in [0.0, 1.0]$ (where $0.0$ = Full Instrumental, $0.20$ = Guide Vocal, $1.0$ = Original):
   $$L_{\text{out}} = S + M_{\text{low}} + (\alpha \cdot M_{\text{high}})$$
   $$R_{\text{out}} = -S + M_{\text{low}} + (\alpha \cdot M_{\text{high}})$$

### 3.3. 5.1.2 / 7.1 Spatial HDMI Routing (Porsche Design Soundbar Optimization)
When connected via HDMI to a multi-channel receiver/soundbar, the `SpatialMatrixMerger` routes audio across up to 8 discrete PCM channels:
- **Channels 1 & 2 (Front L/R):** Main Drums, rhythm guitars, and stereo master image.
- **Channel 3 (Center):** Isolated Lead Vocals (or $M_{\text{high}}$) + optional TTS DJ accessibility cues (if configured). Lowering the Karaoke Vocal Slider directly attenuates the Center speaker so live singers in the room naturally replace the center channel!
- **Channel 4 (LFE / Subwoofer):** Mono sum of frequencies $< 120\text{ Hz}$ ($M_{\text{low}}$ + Bass stem).
- **Channels 5 & 6 (Surround L/R):** Backing melody, synths, and stereo width ($S$).
- **Channels 7 & 8 (Height / Atmos Top L/R):** High-frequency harmonic air and party sound effects (risers, confetti bursts).

### 3.4. Headphone Cue & Bluetooth Latency Compensation
- **Secondary Output (Cue):** Independent audio stream routed via Rust `cpal` / Web Audio `setSinkId()` to the 3.5mm Headphone Jack or Bluetooth headphones.
- **Visual/Audio Sync Offset (`-500ms` to `+500ms`):** Compensates for HDMI Soundbar DSP processing or Bluetooth delay so projector lyrics and 4D fan/light bursts hit on the exact perceived millisecond.

---

## 4. Specification 02: Direct USB 4D Show Control (Zero Home Assistant Needed)

To keep the Raspberry Pi and MacBook Air fast and self-contained, **we do not require Home Assistant**. All USB hardware plugged into the USB hub is controlled lightweight and directly.

### 4.1. Gembird USB Power Strip (`EG-PM2` / `SIS-PM`)
- **Direct USB Control via Rust Backend:**
  - Invokes `sispmctl` (installed via `brew install sispmctl` on macOS and `sudo apt install sispmctl` on Raspberry Pi) or talks directly via `libusb` (`rusb` crate, Vendor ID `0x04b4`, Product ID `0xfd13`).
- **Default 230V Outlet Mapping:**
  - `Outlet 1`: **Wind / Fans** (`sispmctl -o 1` / `sispmctl -f 1`)
  - `Outlet 2`: **Ultrasonic Scent Machine / Mist** (`sispmctl -o 2` / `sispmctl -f 2`)
  - `Outlet 3`: **Disco Light / Effect Motor** (`sispmctl -o 3` / `sispmctl -f 3`)
  - `Outlet 4`: **Auxiliary 230V Effect** (`sispmctl -o 4` / `sispmctl -f 4`)

### 4.2. Zigbee USB Stick & IR Blaster (Lightweight Direct Bridge)
We support two zero-bloat modes for the Zigbee USB Stick (e.g., Sonoff Zigbee 3.0 USB Dongle Plus) and IR Blaster:
1. **Standalone `zigbee2mqtt` + `mosquitto` Micro-Daemon (Recommended):**
   - Runs as a tiny background service (< 45 MB RAM on Pi/Mac) reading the USB serial port (`/dev/ttyUSB0` on Pi, `/dev/cu.usbserial-*` on Mac).
   - OpenDeck's Rust backend connects via the lightweight `rumqttc` crate to `localhost:1883`.
   - **Smart Plugs:** Publishes `{"state": "ON"}` to `zigbee2mqtt/smart_plug_1/set`.
   - **Zigbee IR Blaster (e.g., Tuya ZS06 / Moes UFO-R11):** Publishes pre-learned base64 IR codes to `zigbee2mqtt/ir_blaster/set` (`{"ir_code_to_send": "..."}`) to switch the wireless battery LED candles/pucks to *Warm White, Blue, Pink, Party Fade, or Off*.
2. **Direct USB Serial IR Blaster (If using a USB IR Transceiver):**
   - Rust `serialport` crate writes raw NEC/RC5 hex payloads directly over USB serial with < 5ms latency.

### 4.3. Mandatory Hardware Safety & Anti-Chatter Rules
- **3000ms Relay Lockout:** No 230V relay (Gembird or Zigbee Plug) can be switched faster than once every 3 seconds, even if a child mashes the keyboard buttons.
- **Auto-Shutoff Watchdogs:**
  - *Scent Machine (`Outlet 2`):* Maximum `30s` ON time per trigger, followed by a `60s` cooldown.
  - *Fans (`Outlet 1`):* Auto-off after `20s` when triggered via the `Spacebar` Party Button.
- **Panic / Exit Safe State:** Pressing `Esc` (or closing the app) immediately turns OFF the Fans and Scent Machine and sets the IR Battery Lights to a calm Warm White.

---

## 5. Specification 03: Multi-Screen Layouts, USB Keyboard Matrix & Printable Stencil

### 5.1. Adaptive Screen Modes
1. **Desktop / External Monitor View (`> 1024px`):** Full 2-Deck horizontal parallel waveforms, 3-band EQ, Bipolar Filters, Karaoke Vocal Sliders, 4D Show Control bar, and accessible Track Browser.
2. **Raspberry Pi Official Touchscreen View (`800x480` Kiosk Mode):**
   - Automatically hides complex menus and activates a high-contrast, `64x64px` minimum button layout.
   - Top bar (`60px`): Mini parallel beat-grid + Deck BPMs.
   - Center (`280px`): Split Blue (Deck A) / Amber-Gold (Deck B) touch zones with Play/Pause, touch Vocal Slider, and 4 large Stem/FX pads per deck.
   - Bottom (`140px`): Extra-wide Touch Crossfader + 4D Room Magic buttons (`💨 Wind`, `🌸 Geur`, `🕯️ Licht`) + Full-screen Song Drawer button (`📚 Liedjes`).
3. **Stage Projector Window (Beamer Output):**
   - Full-screen borderless window on secondary display.
   - Displays syllable-synced Karaoke lyrics (scaled automatically by deck `playbackRate`), upcoming line previews, instrumental countdown rings, and audio-reactive background visuals (WebGL on Mac, lightweight 2D Canvas on Pi).
4. **Android Tablet / Phone Controller (PWA over WebSocket / USB Tethering):**
   - Served locally at `http://<local-ip>:8765/controller` (works wirelessly over Wi-Fi or sub-2ms wired via Android USB Tethering / `adb reverse`).
   - Bidirectional state sync with haptic feedback (`navigator.vibrate`).

### 5.2. External USB Keyboard Matrix & Built-In Stencil Generator
Designed strictly for an **external USB keyboard** (keeping the MacBook Air safely closed in Clamshell Mode).

| Physical Key Zone | Deck A (Left - Blue) | Deck B (Right - Gold/Pink) | Kids Mode Function (with 1/4-Beat Auto-Quantize) |
| :--- | :--- | :--- | :--- |
| **Top Row (`F1`-`F8`)** | `F1`: 💨 Wind, `F2`: 🌸 Geur | `F5`: 🕯️ Licht Kleur, `F6`: 🪩 Disco | Triggers 4D Room Hardware with safety timers |
| **Number Row** | `1`: 🥁 Drum, `2`: 🎸 Bass, `3`: 🎹 Piano, `4`: 🎤 Zang | `7`: 🥁 Drum, `8`: 🎸 Bass, `9`: 🎹 Piano, `0`: 🎤 Zang | Toggles individual Stems (or triggers Hot Cues) |
| **QWERTY Row** | `Q`, `W`, `E`, `R` | `U`, `I`, `O`, `P` | Fun Sound Effects (Airhorn, Laser, Applause, Count-in) |
| **Home Row** | `A`: Cue, `S`: ▶️ Start/Stop | `J`: Cue, `K`: ▶️ Start/Stop | Primary transport controls |
| **Bottom Row** | `Z`: 🌊 Filter, `V`: 🔇🎤 Karaoke Toggle | `M`: 🌊 Filter, `/`: 🔇🎤 Karaoke Toggle | Instant Instrumental / Sing-along toggle |
| **Bottom Center** | **`[ SPACEBAR ]`** | **`[ LEFT / RIGHT ARROWS ]`** | `Space` = 🎉 Big Party Drop (Confetti + Wind + Lights); `Arrows` = Smooth Crossfader Glide |

### 5.3. Printable SVG & 3D OpenSCAD Stencil Exporter
The application includes a built-in **"Print Keyboard & Tablet Overlay"** modal that exports:
1. **`usb-keyboard-kids-stencil.svg` (1:1 Scale A4/A3 Cutout):** Ready to print and glue onto 3mm foamboard/cardboard or laser-cut, exposing *only* the active key islands with high-contrast Dutch/English labels and large pictograms.
2. **`usb-keycap-toppers-and-fader.scad` (3D Print OpenSCAD File):**
   - Printable oversized `2u x 2u` snap-on button caps for the `S` and `K` Play keys.
   - A mechanical sliding crossfader rail that clips onto the `Left` and `Right` arrow keys of an external USB keyboard.
   - A tactile finger-slot frame for the Android tablet / 7" Pi Touchscreen.