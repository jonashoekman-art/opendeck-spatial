/**
 * @file src/audio/VocalReducerWorklet.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck Spatial Sing & Mix - VocalReducerWorklet
 * 
 * Implements real-time Mid/Side phase cancellation with 160Hz bass preservation
 * according to PRD Specification 01, Section 3.2.
 * 
 * Math:
 * M = (L + R) / 2
 * S = (L - R) / 2
 * 
 * M is passed through a 2nd-order Linkwitz-Riley Low-Pass Filter at fc = 160 Hz (Q = 0.5)
 * to yield M_low (preserving center kick drum and bass fundamentals).
 * M_high = M - M_low
 * 
 * L_out = S + M_low + (vocalLevel * M_high)
 * R_out = -S + M_low + (vocalLevel * M_high)
 * 
 * License: MIT
 */

class VocalReducerProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'vocalLevel',
        defaultValue: 1.0,
        minValue: 0.0,
        maxValue: 1.0,
        automationRate: 'a-rate'
      }
    ];
  }

  constructor() {
    super();
    // 2nd-order Linkwitz-Riley LPF is two cascaded 1st-order filters, or a biquad with Q = 0.5
    // Coefficients for fc = 160 Hz
    this.fc = 160.0;
    this.q = 0.5; // Critically damped for Linkwitz-Riley alignment
    this.updateCoefficients(sampleRate);

    // Filter states for Mid channel (biquad Direct Form II Transposed)
    this.s1 = 0;
    this.s2 = 0;
  }

  updateCoefficients(sr) {
    const w0 = 2 * Math.PI * (this.fc / sr);
    const alpha = Math.sin(w0) / (2 * this.q);
    const cosw0 = Math.cos(w0);

    const b0 = (1 - cosw0) / 2;
    const b1 = 1 - cosw0;
    const b2 = (1 - cosw0) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cosw0;
    const a2 = 1 - alpha;

    // Normalized coefficients
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || input.length < 2 || !output || output.length < 2) {
      // Pass through if mono or disconnected
      if (input && input[0] && output && output[0]) {
        output[0].set(input[0]);
      }
      return true;
    }

    const inputL = input[0];
    const inputR = input[1];
    const outputL = output[0];
    const outputR = output[1];
    const vocalLevelParam = parameters.vocalLevel;
    const isConstantVocal = vocalLevelParam.length === 1;

    for (let i = 0; i < inputL.length; i++) {
      const l = inputL[i];
      const r = inputR[i];
      const vocalLevel = isConstantVocal ? vocalLevelParam[0] : vocalLevelParam[i];

      // 1. Mid/Side decomposition
      const mid = (l + r) * 0.5;
      const side = (l - r) * 0.5;

      // 2. Linkwitz-Riley 160Hz Low-Pass Filter on Mid channel (DF2T)
      const mLow = this.b0 * mid + this.s1;
      this.s1 = this.b1 * mid - this.a1 * mLow + this.s2;
      this.s2 = this.b2 * mid - this.a2 * mLow;

      // 3. High-frequency mid (contains center lead vocals, snare crack, dialogue)
      const mHigh = mid - mLow;

      // 4. Output reconstruction with vocal level scaling (0.0 to 1.0)
      outputL[i] = side + mLow + (vocalLevel * mHigh);
      outputR[i] = -side + mLow + (vocalLevel * mHigh);
    }

    return true;
  }
}

registerProcessor('vocal-reducer-processor', VocalReducerProcessor);
