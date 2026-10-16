/**
 * @file src/i18n/i18n.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck i18n Manager
 * Supports 'nl-BE' / 'nl' and 'en-US' / 'en' with Pro vs. Kids Mode dual-tone matrix.
 */

import nlLocale from './nl.json' with { type: 'json' };
import enLocale from './en.json' with { type: 'json' };

const dictionaries = {
  nl: nlLocale,
  en: enLocale
};

class I18nManager {
  constructor() {
    this.locale = 'nl';
    this.subscribers = new Set();
  }

  setLocale(lang) {
    const cleanLang = lang.startsWith('nl') ? 'nl' : 'en';
    if (this.locale !== cleanLang) {
      this.locale = cleanLang;
      this.notify();
    }
  }

  getLocale() {
    return this.locale;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.locale);
      } catch (err) {
        console.error('i18n subscriber error:', err);
      }
    });
  }

  /**
   * Translates a dotted key (e.g. 'deck.play') respecting the current tone ('pro' or 'kids')
   */
  t(path, options = {}) {
    const isKidsMode = options.isKidsMode ?? false;
    const toneSuffix = isKidsMode ? '_kids' : '_pro';
    const dict = dictionaries[this.locale] || dictionaries.nl;

    const parts = path.split('.');
    let current = dict;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current?.[parts[i]];
    }

    const lastKey = parts[parts.length - 1];
    // Try tone-specific key first
    let text = current?.[`${lastKey}${toneSuffix}`];
    if (text === undefined) {
      text = current?.[lastKey];
    }

    if (text === undefined) {
      return path; // Fallback to key
    }

    // Variable interpolation
    if (options.params) {
      return Object.entries(options.params).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }, text);
    }

    return text;
  }
}

export const i18n = new I18nManager();
