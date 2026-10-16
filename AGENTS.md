# AGENTS.md: OpenDeck Spatial Sing & Mix

## 1. Documentation & Header Standards (MANDATORY)
In all JavaScript, TypeScript, and Rust files, ALWAYS include a standard JSDoc/TSDoc file header containing:
- `@file` Relative file path and name
- `@author` Jonas Hoekman
- `@project` OpenDeck Spatial Sing & Mix (Ask the user for the Git remote URL when adding a remote)
- `@license` MIT

### Example Template:
```javascript
/**
 * @file src/audio/AudioEngine.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <https://github.com/jonashoekman-art/opendeck-spatial>
 * @license MIT
 * 
 * Description of module functionality...
 */
```

## 2. Core Mandates
1. **Accessibility First (Priority #1):**
   - WCAG 2.2 AAA contrast (7:1 minimum).
   - Colorblind-safe palettes: Deck A `#0072B2` (Blue), Deck B `#E69F00` (Gold).
   - Atkinson Hyperlegible, OpenDyslexic, and sans font toggles.
   - WAI-ARIA live regions (`aria-live="polite"`).
   - Touch targets >= 64x64px in Raspberry Pi 800x480 mode.
2. **Strict i18n (`nl-BE` & `en-US`):**
   - Support both `.pro` and `.kids` tone variants in locale dictionaries.
3. **Permissive Open Source Only (MIT):**
   - Zero GPL/AGPL dependencies.
4. **60fps Performance Rule:**
   - NEVER store high-frequency audio playhead or FFT data in React/reactive state.
   - Use `requestAnimationFrame` reading directly from `AudioEngine` onto `<canvas>`.
5. **Adaptive Hardware Tiers:**
   - macOS M3: Full DSP, HDMI 5.1.2.
   - Raspberry Pi Backup: Lightweight 2D canvas, 800x480 touchscreen layout, Mid/Side DSP vocal reducer (<2% CPU).
