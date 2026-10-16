# Testing Guide: OpenDeck Spatial

## Automated End-to-End Testing with Playwright
OpenDeck Spatial includes a full E2E test suite verifying:
- WCAG 2.2 AAA accessibility landmarks & `#aria-live-polite` live regions.
- Real-time procedural audio synthesis & playback transport.
- Vocal Reducer slider interaction & Mid/Side DSP attenuation.
- Crossfader glide on keyboard arrow keys.
- Spacebar Big Party Drop (audio riser + particle confetti).
- Kids Mode ("Feestmodus 🎈") 1/4-beat quantize bumpers.
- Dynamic i18n language toggle (`nl` <-> `en`).
- Typography toggle (Atkinson Hyperlegible / OpenDyslexic / Sans).
- Responsive 800x480 Raspberry Pi Touchscreen kiosk layout & screenshot verification.

### Running Tests
Make sure the server is running:
```bash
node server.js
```

In a separate terminal, execute:
```bash
npm test
# or
node test-playwright.mjs
```

### Browser Compatibility
The test script automatically utilizes the system-installed Google Chrome via `channel: 'chrome'`, avoiding large browser download overheads.
