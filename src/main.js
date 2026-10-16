/**
 * @file src/main.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck Main Entry Point
 * Orchestrates Dual-Deck AudioEngine, KeyboardMatrix, WaveformCanvas,
 * i18n localization, and accessibility controls.
 */

import { audioEngine } from './audio/AudioEngine.js';
import { appState } from './state/appState.js';
import { i18n } from './i18n/i18n.js';
import { keyboardMatrix } from './input/keyboardMatrix.js';
import { WaveformCanvas } from './components/WaveformCanvas.js';

let waveformCanvasInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize 60fps Waveform Canvas
  const canvasEl = document.getElementById('waveform-canvas');
  if (canvasEl) {
    waveformCanvasInstance = new WaveformCanvas(canvasEl);
  }

  // 2. Wire up UI Controls
  setupAccessibilityBar();
  setupMusicDrawer();
  setupDeckControls('A');
  setupDeckControls('B');
  setupMixerControls();
  setupDragAndDrop();

  // 3. Subscribe to reactive state updates
  appState.subscribe(renderUI);
  i18n.subscribe(() => renderUI(appState.get()));

  // 4. Keyboard visual activity feedback
  keyboardMatrix.onKeyActivity((code, isDown, shiftActive) => {
    updateKeyboardOverlays(shiftActive);
  });

  // Initial render
  renderUI(appState.get());
});

function setupAccessibilityBar() {
  const btnLang = document.getElementById('btn-toggle-lang');
  const btnMode = document.getElementById('btn-toggle-mode');
  const btnFont = document.getElementById('btn-toggle-font');
  const btnLayout = document.getElementById('btn-toggle-layout');
  const btnDemo = document.getElementById('btn-load-demo');

  btnLang?.addEventListener('click', () => {
    const next = i18n.getLocale() === 'nl' ? 'en' : 'nl';
    i18n.setLocale(next);
    document.documentElement.lang = next;
  });

  btnMode?.addEventListener('click', () => {
    appState.toggleKidsMode();
  });

  btnFont?.addEventListener('click', () => {
    const current = appState.get().fontFamily;
    const next = current === 'atkinson' ? 'dyslexic' : current === 'dyslexic' ? 'sans' : 'atkinson';
    appState.setFont(next);
  });

  btnLayout?.addEventListener('click', () => {
    appState.toggleLayout();
    document.body.setAttribute('data-layout', appState.get().activeLayout);
    if (waveformCanvasInstance) {
      setTimeout(() => waveformCanvasInstance.resize(), 100);
    }
  });

  btnDemo?.addEventListener('click', async () => {
    await audioEngine.init();
    appState.announce('🎵 Demo muziek succesvol geladen op Deck A en Deck B!');
  });
}

function setupMusicDrawer() {
  const btnOpenFolder = document.getElementById('btn-open-folder');
  const btnToggleDrawer = document.getElementById('btn-toggle-drawer');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawer = document.getElementById('music-drawer');
  const fileInput = document.getElementById('input-folder-picker');
  const trackListContainer = document.getElementById('drawer-track-list');

  const openDrawer = () => drawer?.classList.remove('hidden');
  const closeDrawer = () => drawer?.classList.add('hidden');

  btnToggleDrawer?.addEventListener('click', () => {
    if (drawer?.classList.contains('hidden')) {
      openDrawer();
    } else {
      closeDrawer();
    }
  });

  btnCloseDrawer?.addEventListener('click', closeDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !drawer?.classList.contains('hidden')) {
      closeDrawer();
    }
  });

  const handleAudioFiles = (files) => {
    const audioExts = ['.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac'];
    const validFiles = Array.from(files).filter(f => audioExts.some(ext => f.name.toLowerCase().endsWith(ext)));

    if (!trackListContainer) return;

    if (validFiles.length === 0) {
      trackListContainer.innerHTML = `<p class="empty-state">${i18n.t('app.no_tracks')}</p>`;
      openDrawer();
      return;
    }

    trackListContainer.innerHTML = '';
    validFiles.forEach(file => {
      const item = document.createElement('div');
      item.className = 'track-item';
      item.innerHTML = `
        <div class="track-info">
          <span class="track-name" title="${file.name}">🎵 ${file.name}</span>
          <span class="track-meta">${(file.size / (1024 * 1024)).toFixed(1)} MB</span>
        </div>
        <div class="track-actions">
          <button class="btn-load-deck btn-load-a" data-deck="A">${i18n.t('app.load_deck_a')}</button>
          <button class="btn-load-deck btn-load-b" data-deck="B">${i18n.t('app.load_deck_b')}</button>
        </div>
      `;

      item.querySelector('.btn-load-a')?.addEventListener('click', async () => {
        await audioEngine.loadFile(file, 'A');
        closeDrawer();
      });

      item.querySelector('.btn-load-b')?.addEventListener('click', async () => {
        await audioEngine.loadFile(file, 'B');
        closeDrawer();
      });

      trackListContainer.appendChild(item);
    });

    openDrawer();
    appState.announce(`${validFiles.length} liedjes gevonden in geselecteerde map.`);
  };

  btnOpenFolder?.addEventListener('click', async () => {
    // Try File System Access API first (Chrome, Edge, Opera)
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push(file);
          }
        }
        handleAudioFiles(files);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.warn('showDirectoryPicker failed, falling back to input:', err);
      }
    }
    // Fallback to directory input
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files) {
      handleAudioFiles(e.target.files);
    }
  });
}

function setupDeckControls(deckId) {
  const prefix = deckId.toLowerCase();
  const deck = deckId === 'A' ? audioEngine.deckA : audioEngine.deckB;

  const btnPlay = document.getElementById(`btn-play-${prefix}`);
  const btnCue = document.getElementById(`btn-cue-${prefix}`);
  const sliderVocal = document.getElementById(`slider-vocal-${prefix}`);
  const sliderFilter = document.getElementById(`slider-filter-${prefix}`);

  btnPlay?.addEventListener('click', async () => {
    if (!audioEngine.initialized) {
      await audioEngine.init();
    }
    if (deck.isPlaying) {
      deck.pause();
    } else {
      deck.play();
    }
  });

  btnCue?.addEventListener('click', () => {
    deck.cue();
  });

  sliderVocal?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    deck.setVocalLevel(val);
  });

  sliderFilter?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    deck.setBipolarFilter(val);
  });

  // Double click resets to center detent
  sliderFilter?.addEventListener('dblclick', () => {
    deck.setBipolarFilter(0.0);
    sliderFilter.value = '0';
  });

  // Hot Cues & FX Pads
  for (let i = 0; i < 4; i++) {
    const pad = document.getElementById(`pad-${prefix}-${i}`);
    pad?.addEventListener('click', () => {
      deck.jumpToHotCue(i);
    });
  }
}

function setupMixerControls() {
  const crossfader = document.getElementById('crossfader');
  const btnParty = document.getElementById('btn-party');

  crossfader?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audioEngine.setCrossfader(val);
  });

  crossfader?.addEventListener('dblclick', () => {
    audioEngine.setCrossfader(0.0);
    crossfader.value = '0';
  });

  btnParty?.addEventListener('click', () => {
    audioEngine.triggerPartyDrop();
    keyboardMatrix.triggerVisualConfetti();
  });
}

function setupDragAndDrop() {
  const dropZones = [
    { el: document.getElementById('deck-card-a'), deckId: 'A' },
    { el: document.getElementById('deck-card-b'), deckId: 'B' }
  ];

  dropZones.forEach(({ el, deckId }) => {
    if (!el) return;
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.style.borderColor = '#38BDF8';
    });
    el.addEventListener('dragleave', () => {
      el.style.borderColor = '';
    });
    el.addEventListener('drop', async (e) => {
      e.preventDefault();
      el.style.borderColor = '';
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        await audioEngine.loadFile(file, deckId);
      }
    });
  });
}

function renderUI(state) {
  const isKids = state.isKidsMode;

  // Header labels
  const titleEl = document.getElementById('app-title');
  if (titleEl) titleEl.textContent = i18n.t('app.title', { isKidsMode: isKids });

  const btnMode = document.getElementById('btn-toggle-mode');
  if (btnMode) btnMode.textContent = isKids ? i18n.t('app.mode_kids') : i18n.t('app.mode_pro');

  const btnLang = document.getElementById('btn-toggle-lang');
  if (btnLang) btnLang.textContent = i18n.getLocale() === 'nl' ? '🇳🇱 NL' : '🇬🇧 EN';

  const btnFont = document.getElementById('btn-toggle-font');
  if (btnFont) btnFont.textContent = `🔤 ${state.fontFamily}`;

  const btnLayout = document.getElementById('btn-toggle-layout');
  if (btnLayout) btnLayout.textContent = state.activeLayout === 'desktop' ? '🖥️ Desktop' : '📱 Pi (800x480)';

  // Decks Play / Pause labels
  const btnPlayA = document.getElementById('btn-play-a');
  const btnPlayB = document.getElementById('btn-play-b');
  if (btnPlayA) {
    btnPlayA.innerHTML = `${state.deckA.isPlaying ? '⏸️' : '▶️'} <span>${i18n.t('deck.play', { isKidsMode: isKids })}</span> <span class="keycap-badge">[S]</span>`;
  }
  if (btnPlayB) {
    btnPlayB.innerHTML = `${state.deckB.isPlaying ? '⏸️' : '▶️'} <span>${i18n.t('deck.play', { isKidsMode: isKids })}</span> <span class="keycap-badge">[K]</span>`;
  }

  // Vocal Sliders
  const labelVocalA = document.getElementById('label-vocal-a');
  const labelVocalB = document.getElementById('label-vocal-b');
  if (labelVocalA) labelVocalA.textContent = i18n.t('deck.vocal_slider', { isKidsMode: isKids });
  if (labelVocalB) labelVocalB.textContent = i18n.t('deck.vocal_slider', { isKidsMode: isKids });

  // Filter Sliders
  const labelFilterA = document.getElementById('label-filter-a');
  const labelFilterB = document.getElementById('label-filter-b');
  if (labelFilterA) labelFilterA.textContent = i18n.t('deck.bipolar_filter', { isKidsMode: isKids });
  if (labelFilterB) labelFilterB.textContent = i18n.t('deck.bipolar_filter', { isKidsMode: isKids });

  // Party Button
  const btnParty = document.getElementById('btn-party');
  if (btnParty) {
    btnParty.innerHTML = `<span>${i18n.t('mixer.party_button', { isKidsMode: isKids })}</span> <span class="keycap-badge">[SPACE]</span>`;
  }

  updateKeyboardOverlays(state.shiftModifierActive);
}

function updateKeyboardOverlays(shiftActive) {
  const badgeVocalA = document.getElementById('badge-vocal-a');
  const badgeVocalB = document.getElementById('badge-vocal-b');
  if (badgeVocalA) badgeVocalA.textContent = shiftActive ? '[Shift+V: 20%]' : '[V: Mute/100%]';
  if (badgeVocalB) badgeVocalB.textContent = shiftActive ? '[Shift+/: 20%]' : '[/: Mute/100%]';
}
