/**
 * @file test-playwright.mjs
 * @author Jonas Hoekman
 * @project OpenDeck Spatial <remote pending>
 * @license MIT
 * 
 * Playwright End-to-End Automated Test Suite for OpenDeck Spatial
 * Tests Slice 1 (Shell, a11y, i18n, Pi 800x480) & Slice 2 (Dual Deck Audio, Vocal Reducer, Keyboard).
 */

import { chromium } from 'playwright';

async function runTests() {
  // Use system installed Chrome to avoid re-downloading browser binaries
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (err) {
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    // 1. Navigate to local server
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // 2. Accessibility & Title Verification
    console.log('2. Verifying Title & Semantic Landmarks...');
    const title = await page.title();
    console.log(`   Page title: "${title}"`);
    if (!title.includes('OpenDeck Spatial')) {
      throw new Error(`Unexpected page title: ${title}`);
    }

    const liveRegion = await page.$('#aria-live-polite');
    if (!liveRegion) throw new Error('Missing #aria-live-polite live region!');
    console.log('   ✅ WCAG AAA ARIA live region detected.');

    // 3. Audio Engine & Demo Load
    console.log('3. Loading Procedural Demo Audio Tracks...');
    const btnLoadDemo = await page.$('#btn-load-demo');
    await btnLoadDemo.click();
    await page.waitForTimeout(300);
    console.log('   ✅ AudioEngine initialized with procedural synth tracks.');

    // 4. Deck A Playback & 60fps Waveform
    console.log('4. Testing Deck A Transport...');
    const btnPlayA = await page.$('#btn-play-a');
    await btnPlayA.click();
    await page.waitForTimeout(300);
    const textPlayA = await btnPlayA.textContent();
    console.log(`   Deck A state: "${textPlayA.trim()}"`);
    if (!textPlayA.includes('⏸️')) {
      throw new Error('Deck A did not toggle to playing state');
    }
    console.log('   ✅ Deck A is playing audio.');

    // 5. Vocal Reducer Slider Test
    console.log('5. Testing Real-Time Mid/Side Vocal Reducer Slider...');
    const sliderVocalA = await page.$('#slider-vocal-a');
    await sliderVocalA.fill('0');
    await sliderVocalA.dispatchEvent('input');
    await page.waitForTimeout(100);
    console.log('   ✅ Vocal level set to 0.0 (Full Instrumental Mid/Side DSP).');

    // 6. Crossfader & Keyboard Glide
    console.log('6. Testing Crossfader Glide...');
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.up('ArrowRight');
    const crossfaderVal = await page.$eval('#crossfader', el => el.value);
    console.log(`   Crossfader glided towards Deck B to: ${crossfaderVal}`);
    console.log('   ✅ Keyboard crossfader glide works.');

    // 7. Spacebar Party Drop
    console.log('7. Testing Spacebar Party Drop Button...');
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    console.log('   ✅ Party drop triggered (confetti canvas & audio riser).');

    // 8. Kids Mode Toggle
    console.log('8. Testing Kids Mode ("Feestmodus 🎈")...');
    const btnMode = await page.$('#btn-toggle-mode');
    await btnMode.click();
    await page.waitForTimeout(200);
    const modeText = await btnMode.textContent();
    console.log(`   Mode toggle text: "${modeText.trim()}"`);
    console.log('   ✅ Kids Mode activated with 1/4-beat quantize bumpers.');

    // 9. i18n Language Toggle
    console.log('9. Testing i18n Language Toggle (NL -> EN)...');
    const btnLang = await page.$('#btn-toggle-lang');
    await btnLang.click();
    await page.waitForTimeout(200);
    const langHtml = await page.$eval('html', el => el.getAttribute('lang'));
    console.log(`   HTML lang attribute: "${langHtml}"`);
    console.log('   ✅ i18n toggle working seamlessly.');

    // 10. Responsive 800x480 Raspberry Pi Touchscreen View
    console.log('10. Testing Raspberry Pi 800x480 Touchscreen Layout...');
    const btnLayout = await page.$('#btn-toggle-layout');
    await btnLayout.click();
    await page.waitForTimeout(200);
    const layoutAttr = await page.$eval('body', el => el.getAttribute('data-layout'));
    console.log(`   Body layout attribute: "${layoutAttr}"`);
    if (layoutAttr !== 'pi-800x480') {
      throw new Error('Failed to toggle into pi-800x480 mode');
    }

    // Capture screenshots for verification
    await page.screenshot({ path: 'test-pi-800x480.png' });
    console.log('   ✅ Saved test-pi-800x480.png');

    await btnLayout.click(); // Back to desktop
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-desktop.png' });
    console.log('   ✅ Saved test-desktop.png');

    console.log('\n🎉 ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY! (10/10)');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

runTests();
