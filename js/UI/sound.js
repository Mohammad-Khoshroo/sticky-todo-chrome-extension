/**
 * ===================================================================
 * FRIDGE STICKY NOTES — SKEUOMORPHIC SOUND ENGINE (موتور افکت‌های صوتی)
 * ===================================================================
 * Pure Web Audio API procedural synthesis for realistic skeuomorphic
 * refrigerator & stationery sound effects:
 * - stick:       Paper adhering to fridge surface / tape snap
 * - check:       Rewarding wooden pop / marimba task completion chime
 * - uncheck:     Soft wooden descending tap
 * - scribble:    Textured pencil lead scratching across paper
 * - erase:       Soft rubber friction swooshes
 * - crumple:     Granular paper crinkling into trash bin
 * - bell:        Resonant metallic brass bell chime
 * - click:       Tactile mechanical switch snap
 * - timerDing:   Triumphant dual-bell singing bowl chime on goal reached
 * - timerTick:   Sharp chronometer crown click
 *
 * Zero external audio files. 100% offline, zero lag, zero dependencies.
 */

(function (window) {
    'use strict';

    let audioCtx = null;
    let masterGain = null;
    let isSoundEnabled = true;

    // Load initial preference
    try {
        const saved = localStorage.getItem('fridge_sound_enabled');
        if (saved !== null) {
            isSoundEnabled = (saved === 'true');
        }
    } catch (e) {
        isSoundEnabled = true;
    }

    /**
     * Lazy-initialize or resume AudioContext on first user interaction.
     */
    function getContext() {
        if (!isSoundEnabled) return null;

        if (!audioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtxClass) return null;

            audioCtx = new AudioCtxClass();
            masterGain = audioCtx.createGain();
            // Default master volume: pleasant and gentle (26%)
            masterGain.gain.setValueAtTime(0.26, audioCtx.currentTime);
            masterGain.connect(audioCtx.destination);
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        return audioCtx;
    }

    /**
     * Helper to create a noise buffer (white/pink noise) for paper and friction textures.
     */
    function createNoiseBuffer(ctx, durationSec, filterFn) {
        const sampleRate = ctx.sampleRate;
        const bufferSize = Math.floor(sampleRate * durationSec);
        const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (filterFn) {
                // Custom noise filtering (e.g. pink noise integration)
                lastOut = filterFn(white, lastOut);
                data[i] = lastOut;
            } else {
                data[i] = white;
            }
        }
        return buffer;
    }

    const SoundEngine = {
        /**
         * Check if sound is currently enabled.
         */
        isEnabled: function () {
            return isSoundEnabled;
        },

        /**
         * Toggle sound effects on/off.
         */
        toggle: function () {
            isSoundEnabled = !isSoundEnabled;
            try {
                localStorage.setItem('fridge_sound_enabled', isSoundEnabled ? 'true' : 'false');
            } catch (e) {}

            SoundEngine.updateButtonUI();

            if (isSoundEnabled) {
                // Short affirmative feedback chirp
                SoundEngine.click();
            }
            return isSoundEnabled;
        },

        /**
         * Update sound toggle button icon & tooltip.
         */
        updateButtonUI: function () {
            const btn = document.getElementById('sound-toggle-btn');
            if (!btn) return;

            const iconWaves = btn.querySelector('.sound-icon-waves');
            const iconMuted = btn.querySelector('.sound-icon-muted');

            if (isSoundEnabled) {
                btn.classList.remove('is-muted');
                if (iconWaves) iconWaves.style.display = 'block';
                if (iconMuted) iconMuted.style.display = 'none';
            } else {
                btn.classList.add('is-muted');
                if (iconWaves) iconWaves.style.display = 'none';
                if (iconMuted) iconMuted.style.display = 'block';
            }

            const currentLang = (typeof currentLanguage !== 'undefined') ? currentLanguage : 'fa';
            const tip = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[currentLang])
                ? (isSoundEnabled ? TRANSLATIONS[currentLang].soundMuteTip : TRANSLATIONS[currentLang].soundUnmuteTip)
                : (isSoundEnabled ? 'قطع صدا' : 'وصل صدا');

            btn.setAttribute('title', tip);
            btn.setAttribute('aria-label', tip);
        },

        /**
         * 1. Paper sticking to fridge / tape snap
         */
        stick: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // Component A: Low tactile thump of paper hitting the magnetic surface
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

            oscGain.gain.setValueAtTime(0.4, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(oscGain);
            oscGain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.09);

            // Component B: Crisp paper surface rustle / tape tackiness
            const noise = createNoiseBuffer(ctx, 0.07);
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noise;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2400, now);
            filter.Q.setValueAtTime(1.8, now);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.001, now);
            noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.006);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

            noiseSource.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(masterGain);

            noiseSource.start(now);
            noiseSource.stop(now + 0.07);
        },

        /**
         * 2. Task Completion / Checkbox toggle
         */
        check: function (isChecked) {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            if (isChecked) {
                // Crisp, rewarding wooden pop / dual marimba chime
                // Note 1: 987.77Hz (B5)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(987.77, now);

                gain1.gain.setValueAtTime(0.001, now);
                gain1.gain.linearRampToValueAtTime(0.42, now + 0.005);
                gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

                osc1.connect(gain1);
                gain1.connect(masterGain);
                osc1.start(now);
                osc1.stop(now + 0.12);

                // Note 2: 1318.51Hz (E6) delayed by 25ms
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(1318.51, now + 0.025);

                gain2.gain.setValueAtTime(0.001, now + 0.025);
                gain2.gain.linearRampToValueAtTime(0.35, now + 0.03);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                osc2.connect(gain2);
                gain2.connect(masterGain);
                osc2.start(now + 0.025);
                osc2.stop(now + 0.16);

                // Tactile subtle wood tap
                const tap = ctx.createOscillator();
                const tapGain = ctx.createGain();
                tap.type = 'sine';
                tap.frequency.setValueAtTime(260, now);
                tap.frequency.exponentialRampToValueAtTime(80, now + 0.04);
                tapGain.gain.setValueAtTime(0.3, now);
                tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                tap.connect(tapGain);
                tapGain.connect(masterGain);
                tap.start(now);
                tap.stop(now + 0.045);
            } else {
                // Soft descending wooden tap for uncheck
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.exponentialRampToValueAtTime(415, now + 0.07);

                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now);
                osc.stop(now + 0.08);
            }
        },

        /**
         * 3. Pencil Scribble (خط زدن با مداد)
         */
        scribble: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            // 3 rapid micro-scratches of pencil lead across textured paper
            const scratchCount = 3;
            for (let i = 0; i < scratchCount; i++) {
                const startTime = now + (i * 0.045);
                const duration = 0.035 + (i * 0.005);
                const noise = createNoiseBuffer(ctx, duration);
                const source = ctx.createBufferSource();
                source.buffer = noise;

                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                // Varied frequencies simulate multi-stroke scribble
                const freqs = [3200, 3800, 2900];
                filter.frequency.setValueAtTime(freqs[i % freqs.length], startTime);
                filter.Q.setValueAtTime(2.2, startTime);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(0.28, startTime + 0.006);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                source.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);

                source.start(startTime);
                source.stop(startTime + duration + 0.005);
            }
        },

        /**
         * 4. Eraser Friction (پاک‌کردن با پاک‌کن)
         */
        erase: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            // Two soft muffled rubber friction swooshes
            for (let i = 0; i < 2; i++) {
                const startTime = now + (i * 0.085);
                const duration = 0.075;
                const noise = createNoiseBuffer(ctx, duration);
                const source = ctx.createBufferSource();
                source.buffer = noise;

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(750 + (i * 120), startTime);
                filter.Q.setValueAtTime(0.8, startTime);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

                source.connect(filter);
                filter.connect(gain);
                gain.connect(masterGain);

                source.start(startTime);
                source.stop(startTime + duration + 0.005);
            }
        },

        /**
         * 5. Paper Crumple & Trash (مچاله کردن کاغذ و انداختن در سطل)
         */
        crumple: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const duration = 0.28;

            // Generate granular crackle buffer
            const sampleRate = ctx.sampleRate;
            const bufferSize = Math.floor(sampleRate * duration);
            const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // High density impulsive random spikes simulate paper folds crushing
                const spike = (Math.random() < 0.22) ? (Math.random() * 2 - 1) : (Math.random() * 0.1 - 0.05);
                data[i] = spike;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1600, now);
            filter.frequency.exponentialRampToValueAtTime(2800, now + 0.12);
            filter.frequency.exponentialRampToValueAtTime(900, now + duration);
            filter.Q.setValueAtTime(1.5, now);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.38, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(masterGain);

            source.start(now);
            source.stop(now + duration + 0.01);
        },

        /**
         * 6. Brass Bell Chime (زنگوله یادآوری و تقویم)
         */
        bell: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const harmonics = [
                { freq: 1174.66, gain: 0.38, decay: 0.85 }, // D6 (fundamental)
                { freq: 2349.32, gain: 0.22, decay: 0.65 }, // D7 (1st overtone)
                { freq: 3520.00, gain: 0.14, decay: 0.45 }, // A7 (2nd overtone)
                { freq: 4698.64, gain: 0.07, decay: 0.30 }  // D8 (bright shimmer)
            ];

            harmonics.forEach(h => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(h.freq, now);

                gain.gain.setValueAtTime(0.001, now);
                gain.gain.linearRampToValueAtTime(h.gain, now + 0.004);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(now);
                osc.stop(now + h.decay + 0.02);
            });
        },

        /**
         * 7. Tactile mechanical switch snap (تغییر تم / بستن تقویم)
         */
        click: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // High impulse snap
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2200, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.02);

            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.025);

            // Low body damp
            const thump = ctx.createOscillator();
            const thumpGain = ctx.createGain();
            thump.type = 'triangle';
            thump.frequency.setValueAtTime(140, now);
            thump.frequency.exponentialRampToValueAtTime(40, now + 0.04);
            thumpGain.gain.setValueAtTime(0.2, now);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            thump.connect(thumpGain);
            thumpGain.connect(masterGain);
            thump.start(now);
            thump.stop(now + 0.045);
        },

        /**
         * 8. Chronometer Goal Reached Chime (تکمیل ۱۰۰٪ هدف تایمر تمرکز)
         */
        timerDing: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;

            // Note 1: C5 (523.25Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now);

            gain1.gain.setValueAtTime(0.001, now);
            gain1.gain.linearRampToValueAtTime(0.38, now + 0.008);
            gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

            osc1.connect(gain1);
            gain1.connect(masterGain);
            osc1.start(now);
            osc1.stop(now + 1.15);

            // Note 2: C6 (1046.50Hz) starting 140ms later with harmonic overtone
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1046.50, now + 0.14);

            gain2.gain.setValueAtTime(0.001, now + 0.14);
            gain2.gain.linearRampToValueAtTime(0.42, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);

            osc2.connect(gain2);
            gain2.connect(masterGain);
            osc2.start(now + 0.14);
            osc2.stop(now + 1.4);
        },

        /**
         * 9. Chronometer Crown Tick (شروع و استپ تایمر)
         */
        timerTick: function () {
            const ctx = getContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(3600, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.018);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.025);
        },

        /**
         * Initialize event listeners and unlock audio context on first gesture.
         */
        init: function () {
            function unlockAudio() {
                getContext();
                document.removeEventListener('pointerdown', unlockAudio);
                document.removeEventListener('keydown', unlockAudio);
            }
            document.addEventListener('pointerdown', unlockAudio, { passive: true });
            document.addEventListener('keydown', unlockAudio, { passive: true });

            const btn = document.getElementById('sound-toggle-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    SoundEngine.toggle();
                });
            }
            SoundEngine.updateButtonUI();
        }
    };

    // Expose globally
    window.SoundEngine = SoundEngine;

    // Bootstrap when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', SoundEngine.init);
    } else {
        SoundEngine.init();
    }

})(window);
