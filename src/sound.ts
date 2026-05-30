// ============================================================
// Sound Engine v5 — глухой деревянный + лопающиеся пузыри.
//
// Концепция по обратной связи:
//   - Слияние = "ДЕРЕВЯННОЕ постукивание" + "ПУЗЫРИК лопается"
//     Не колокольчики на каждое слияние! Звук тёплый, акустический.
//   - Только редкие топовые слияния (NACKL, BTC) — пышные колокола
//   - Fanfare остаётся для крупных событий (Shake Damage, NACKL unlock)
//
// Тембры:
//   - woodTap: глухой деревянный удар (для всех обычных слияний 0-7)
//   - bubble: лопающийся пузырь (для перелива и комбо)
//   - softBell: тихий тёплый колокол (ТОЛЬКО для уровней 8+)
//   - chime: пышный колокол (ТОЛЬКО для NACKL)
//   - fanfare: оркестр (события)
// ============================================================

import { Settings } from './settings';

class HDSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private reverbGain!: GainNode;
  private dryGain!: GainNode;
  private convolver!: ConvolverNode;
  private compressor!: DynamicsCompressorNode;
  private lowShelf!: BiquadFilterNode;
  private highShelf!: BiquadFilterNode;
  private initialized = false;

  private ensure() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    if (!Settings.sound) return false;
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      this.ctx = new Ctx();

      // === Цепочка обработки ===
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.75;
      this.masterGain.connect(this.ctx.destination);

      // Компрессор
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -16;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.2;
      this.compressor.connect(this.masterGain);

      // EQ — ОЧЕНЬ тёплый профиль: буст низа, сильный cut высокого
      this.lowShelf = this.ctx.createBiquadFilter();
      this.lowShelf.type = 'lowshelf';
      this.lowShelf.frequency.value = 250;
      this.lowShelf.gain.value = 3.5;
      this.lowShelf.connect(this.compressor);

      this.highShelf = this.ctx.createBiquadFilter();
      this.highShelf.type = 'highshelf';
      this.highShelf.frequency.value = 5000;
      this.highShelf.gain.value = -6;  // сильный cut верха для "тёплости"
      this.highShelf.connect(this.lowShelf);

      // Реверберация
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.createReverbIR(1.8, 2.2);
      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.25;
      this.convolver.connect(this.reverbGain);
      this.reverbGain.connect(this.highShelf);

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 1.0;
      this.dryGain.connect(this.highShelf);

      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  private createReverbIR(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const ir = this.ctx!.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = ir.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.pow(1 - t, decay);
        const early = (i < sampleRate * 0.05) ? Math.exp(-i / (sampleRate * 0.01)) * 0.3 : 0;
        channelData[i] = (Math.random() * 2 - 1) * envelope * 0.5 + early * (Math.random() * 2 - 1);
      }
    }
    return ir;
  }

  /** Воспроизвести тон с гармониками и огибающей */
  private playTone(opts: {
    freq: number;
    harmonics: number[];
    amplitudes: number[];
    duration: number;
    attack: number;
    decay?: number;
    sustain?: number;
    release: number;
    volume: number;
    pan?: number;
    reverbSend?: number;
    pitchSweepDown?: number;
    lowpass?: number;
    waveform?: OscillatorType;
    delay?: number;
  }) {
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const startAt = ctx.currentTime + (opts.delay || 0);
    const {
      freq, harmonics, amplitudes, duration, attack, release, volume,
    } = opts;
    const decay = opts.decay ?? 0.05;
    const sustain = opts.sustain ?? 0.3;
    const reverbSend = opts.reverbSend ?? 0.2;
    const waveform = opts.waveform || 'sine';

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0, startAt);
    voiceGain.gain.linearRampToValueAtTime(volume, startAt + attack);
    voiceGain.gain.linearRampToValueAtTime(volume * sustain, startAt + attack + decay);
    const releaseStart = startAt + duration;
    voiceGain.gain.setValueAtTime(volume * sustain, releaseStart);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    let toneNode: AudioNode = voiceGain;
    if (opts.lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = opts.lowpass;
      lp.Q.value = 0.7;
      voiceGain.connect(lp);
      toneNode = lp;
    }

    if (opts.pan !== undefined) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = opts.pan;
      toneNode.connect(panner);
      toneNode = panner;
    }

    toneNode.connect(this.dryGain);
    const rev = ctx.createGain();
    rev.gain.value = reverbSend;
    toneNode.connect(rev);
    rev.connect(this.convolver);

    for (let i = 0; i < harmonics.length; i++) {
      const osc = ctx.createOscillator();
      osc.type = waveform;
      const partialFreq = freq * harmonics[i];
      osc.frequency.setValueAtTime(partialFreq, startAt);
      if (opts.pitchSweepDown) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(20, partialFreq - opts.pitchSweepDown),
          releaseStart + release
        );
      }
      const partialGain = ctx.createGain();
      partialGain.gain.value = amplitudes[i] ?? amplitudes[amplitudes.length - 1];
      osc.connect(partialGain);
      partialGain.connect(voiceGain);
      osc.start(startAt);
      osc.stop(releaseStart + release + 0.05);
    }
  }

  /** Шумовая атака — короткий импульс шума с lowpass */
  private noiseAttack(opts: {
    duration: number;
    volume: number;
    lowpass: number;
    pan?: number;
    delay?: number;
  }) {
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const startAt = ctx.currentTime + (opts.delay || 0);

    const bufferSize = Math.floor(ctx.sampleRate * opts.duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.lowpass;
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + opts.duration);

    source.connect(filter);
    filter.connect(gain);

    let out: AudioNode = gain;
    if (opts.pan !== undefined) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = opts.pan;
      gain.connect(panner);
      out = panner;
    }
    out.connect(this.dryGain);

    source.start(startAt);
    source.stop(startAt + opts.duration + 0.01);
  }

  // ============================================================
  // ТЕМБРЫ
  // ============================================================

  /**
   * Wood tap — ГЛУХОЙ деревянный удар.
   * Это ОСНОВНОЙ звук слияний 0-7 уровней.
   * Никаких писков, никаких высоких гармоник. Тёплый, акустичный.
   */
  private woodTap(freq: number, pan = 0, volume = 0.35) {
    // Толстая шумовая атака (имитация удара по дереву)
    this.noiseAttack({
      duration: 0.05,
      volume: 0.22,
      lowpass: 600,  // только низы
      pan
    });
    // Деревянный резонанс
    this.playTone({
      freq,
      harmonics: [1, 1.5, 2.2],          // нерегулярные деревянные гармоники
      amplitudes: [1.0, 0.4, 0.12],
      duration: 0.10,
      attack: 0.002,
      decay: 0.05,
      sustain: 0.10,
      release: 0.20,
      volume,
      pan,
      reverbSend: 0.10,
      lowpass: 2400,                     // СИЛЬНО зажимаем верха
      waveform: 'triangle',
    });
  }

  /**
   * Bubble pop — лопающийся пузырь.
   * Используется для комбо (несколько пузырей подряд).
   * Звучит как "пвоп" — глухой плоп с быстрым sweep вниз.
   */
  private bubblePop(freq: number, pan = 0, volume = 0.3) {
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const startAt = ctx.currentTime;

    // Короткая шумовая атака
    this.noiseAttack({
      duration: 0.025,
      volume: 0.08,
      lowpass: 1200,
      pan
    });

    // Главный осциллятор с быстрым pitch sweep вниз (характерно для пузыря)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2.5, startAt);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startAt + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(volume, startAt + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2500;
    lp.Q.value = 2.5;  // лёгкий резонанс для "пузырности"

    osc.connect(gain);
    gain.connect(lp);

    let out: AudioNode = lp;
    if (pan !== 0) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      lp.connect(panner);
      out = panner;
    }
    out.connect(this.dryGain);
    const rev = ctx.createGain();
    rev.gain.value = 0.15;
    out.connect(rev);
    rev.connect(this.convolver);

    osc.start(startAt);
    osc.stop(startAt + 0.25);
  }

  /**
   * Soft bell — ТИХИЙ тёплый колокол.
   * Используется ТОЛЬКО для уровня 8-9 (предтоповые монеты).
   * Очень мягкий, глубокий — не режет уши.
   */
  private softBell(freq: number, pan = 0, volume = 0.22) {
    this.noiseAttack({ duration: 0.01, volume: 0.04, lowpass: 1800, pan });
    this.playTone({
      freq,
      harmonics: [1, 2.0, 3.0],   // только октавные, без нечётных металлов
      amplitudes: [1.0, 0.25, 0.06],
      duration: 0.35,
      attack: 0.008,
      decay: 0.15,
      sustain: 0.25,
      release: 0.8,
      volume,
      pan,
      reverbSend: 0.4,
      lowpass: 4000,               // не выше 4 кГц
      waveform: 'sine',
      pitchSweepDown: 4,
    });
  }

  /**
   * Crystal chime — ТОЛЬКО для NACKL (финальная монета).
   * Это редкий момент — можно позволить пышность.
   */
  private crystalChime(freq: number, pan = 0, volume = 0.28) {
    this.noiseAttack({ duration: 0.012, volume: 0.06, lowpass: 3000, pan });
    this.playTone({
      freq,
      harmonics: [1, 2, 3, 5],
      amplitudes: [1.0, 0.35, 0.18, 0.08],
      duration: 0.6,
      attack: 0.005,
      decay: 0.2,
      sustain: 0.4,
      release: 1.5,
      volume,
      pan,
      reverbSend: 0.5,
      lowpass: 5500,
      waveform: 'sine',
      pitchSweepDown: 5,
    });
    // Октавный shimmer
    this.playTone({
      freq: freq * 2,
      harmonics: [1, 2],
      amplitudes: [0.3, 0.1],
      duration: 0.3,
      attack: 0.015,
      decay: 0.1,
      sustain: 0.25,
      release: 0.8,
      volume: volume * 0.25,
      pan: pan * 0.5,
      reverbSend: 0.55,
      lowpass: 6500,
      waveform: 'sine',
    });
  }

  // ============================================================
  // ПУБЛИЧНОЕ API
  // ============================================================

  /**
   * Слияние монет — главный звук игры.
   * НОВАЯ ПОДДЕРЖКА:
   *   0-7: woodTap — глухое деревянное постукивание (90% времени)
   *   8-9: softBell — тихий мягкий колокол
   *   10:  crystalChime — пышный (только для NACKL)
   */
  merge(level: number) {
    if (!Settings.sound) return;
    // Пентатоника C minor — глубже и теплее чем major
    const scale = [
      // Октава 1 (низкая) — для woodTap
      130.81, 155.56, 174.61, 196.00,   // C3, Eb3, F3, G3
      // Октава 2 (средняя) — для woodTap
      261.63, 311.13, 349.23, 392.00,   // C4, Eb4, F4, G4
      // Октава 3 — для softBell
      523.25, 622.25,
      // Октава 4 — для crystalChime (NACKL)
      1046.50,
    ];
    const freq = scale[Math.min(level, scale.length - 1)];
    const pan = (Math.random() - 0.5) * 0.3;

    if (level <= 7) this.woodTap(freq, pan);
    else if (level <= 9) this.softBell(freq, pan);
    else this.crystalChime(freq, pan);
  }

  /**
   * Combo — лопающиеся пузыри! Несколько подряд.
   * Каждый комбо = 1 пузырь
   */
  combo(count: number) {
    if (!Settings.sound) return;
    const baseFreq = 280 + Math.min(count, 6) * 40;
    this.bubblePop(baseFreq, (Math.random() - 0.5) * 0.4, 0.25);
  }

  /**
   * NACKL unlocked — финальная монета. Восходящие колокола.
   */
  nacklUnlocked() {
    if (!Settings.sound) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.crystalChime(freq, (i % 2 === 0 ? -1 : 1) * 0.25, 0.30);
      }, i * 110);
    });
  }

  /**
   * Fanfare — торжественный звук. ОСТАЁТСЯ как ты просил.
   * Для Shake Damage и больших событий.
   */
  fanfare() {
    if (!Settings.sound) return;
    // Минорный аккорд для драмы: C-Eb-G-C
    const chord = [261.63, 311.13, 392.00, 523.25];
    chord.forEach((freq, i) => {
      this.crystalChime(freq, (i - 1.5) * 0.2, 0.25);
    });
    setTimeout(() => {
      this.crystalChime(1046.50, 0, 0.22);
    }, 220);
  }

  /**
   * Game over — нисходящая каденция. Тихо, без драмы.
   */
  gameOver() {
    if (!Settings.sound) return;
    const notes = [392.00, 349.23, 311.13, 261.63];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.softBell(freq, 0, 0.22);
      }, i * 240);
    });
  }

  /**
   * Drop — отпускание монеты сверху, монета летит вниз.
   * Короткий "вшик" — звук воздуха при падении.
   */
  drop() {
    if (!Settings.sound) return;
    this.noiseAttack({ duration: 0.12, volume: 0.10, lowpass: 800, pan: 0 });
    // Лёгкий sweep вниз для "падения"
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const startAt = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, startAt);
    osc.frequency.exponentialRampToValueAtTime(140, startAt + 0.20);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.10, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
    osc.connect(gain);
    gain.connect(this.dryGain);
    osc.start(startAt);
    osc.stop(startAt + 0.25);
  }

  /**
   * Thud — глухой удар монеты о дно/о другую монету.
   * Это новый звук! Вызывается из engine.ts при первом контакте монеты с миром.
   */
  thud(volumeMul: number = 1.0) {
    if (!Settings.sound) return;
    // Очень глухой удар — только низы. Громкость регулируется силой удара.
    const v = Math.max(0.3, Math.min(1.5, volumeMul));
    this.noiseAttack({ duration: 0.08, volume: 0.22 * v, lowpass: 400, pan: 0 });
    this.playTone({
      freq: 95,
      harmonics: [1, 2, 2.8],
      amplitudes: [1.0, 0.45, 0.15],
      duration: 0.06,
      attack: 0.001,
      decay: 0.03,
      sustain: 0.15,
      release: 0.18,
      volume: 0.20 * v,
      reverbSend: 0.10,
      lowpass: 1500,
      waveform: 'triangle',
    });
  }

  /** Click — глухой деревянный «тук» по кнопке.
   *  Низкая частота, сильно срезанные верха, очень короткий.
   *  Никаких писков и звонкости. */
  click() {
    if (!Settings.sound) return;
    this.noiseAttack({ duration: 0.018, volume: 0.06, lowpass: 500 });
    this.playTone({
      freq: 280,
      harmonics: [1, 1.4],
      amplitudes: [1.0, 0.15],
      duration: 0.025,
      attack: 0.001,
      decay: 0.015,
      sustain: 0.05,
      release: 0.05,
      volume: 0.09,
      reverbSend: 0.04,
      lowpass: 900,    // СИЛЬНО зажимаем верха — никаких «дзинь»
      waveform: 'triangle',
    });
  }

  /** Select — чуть выше click для выбора варианта, но тоже глухой. */
  select() {
    if (!Settings.sound) return;
    this.noiseAttack({ duration: 0.015, volume: 0.05, lowpass: 600 });
    this.playTone({
      freq: 360,
      harmonics: [1, 1.4],
      amplitudes: [1.0, 0.12],
      duration: 0.022,
      attack: 0.001,
      decay: 0.012,
      sustain: 0.05,
      release: 0.04,
      volume: 0.07,
      reverbSend: 0.04,
      lowpass: 1100,
      waveform: 'triangle',
    });
  }

  /** Unlock — служебный, только разблокирует AudioContext */
  unlock() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Purchase — чистый звук покупки: «деньги звякнули + успех».
   *  Без писка — два тёплых тона с реверберацией. */
  purchase() {
    if (!Settings.sound) return;
    // 1. Тёплый деревянный «чок» — деньги ушли
    this.noiseAttack({ duration: 0.04, volume: 0.12, lowpass: 700 });
    this.playTone({
      freq: 220,
      harmonics: [1, 2, 3],
      amplitudes: [1.0, 0.3, 0.1],
      duration: 0.08,
      attack: 0.002,
      decay: 0.04,
      sustain: 0.2,
      release: 0.15,
      volume: 0.18,
      reverbSend: 0.18,
      lowpass: 1800,
      waveform: 'triangle',
    });
    // 2. Через 90мс — мягкий восходящий аккорд (успех)
    setTimeout(() => {
      this.playTone({
        freq: 523.25, // C5
        harmonics: [1, 1.5, 2],
        amplitudes: [1.0, 0.3, 0.15],
        duration: 0.25,
        attack: 0.008,
        decay: 0.1,
        sustain: 0.4,
        release: 0.45,
        volume: 0.16,
        reverbSend: 0.35,
        lowpass: 3500,
        waveform: 'sine',
      });
      this.playTone({
        freq: 783.99, // G5
        harmonics: [1, 2],
        amplitudes: [0.7, 0.2],
        duration: 0.25,
        attack: 0.015,
        decay: 0.1,
        sustain: 0.4,
        release: 0.5,
        volume: 0.12,
        reverbSend: 0.4,
        lowpass: 3800,
        waveform: 'sine',
        delay: 0.05,
      });
    }, 90);
  }
}

export const Sound = new HDSoundEngine();

// === Авто-unlock AudioContext на ЛЮБОЙ user-gesture ===
// На iOS / Safari аудио блокируется до первого юзер-тапа. Без этого
// после blur'ов (свернуть/развернуть мини-апп) звук просто пропадает.
// Подвешиваем глобальные слушатели на касания/клики и при срабатывании
// вызываем Sound.unlock() — это резюмирует контекст и звук возвращается.
if (typeof window !== 'undefined') {
  const unlock = () => { Sound.unlock(); };
  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  });
  // Также при возврате в окно (visibilitychange) — резюмируем
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) Sound.unlock();
  });
}
