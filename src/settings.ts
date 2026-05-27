// ============================================================
// Простые булевые настройки: звук, вибрация.
// ============================================================

const SOUND_KEY = 'acki_merge_sound';
const VIB_KEY   = 'acki_merge_vibration';

function read(key: string, fallback = true): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === '1';
  } catch { return fallback; }
}

function write(key: string, value: boolean) {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* */ }
}

let sound = read(SOUND_KEY, true);
let vibration = read(VIB_KEY, true);

export const Settings = {
  get sound() { return sound; },
  get vibration() { return vibration; },
  setSound(v: boolean) { sound = v; write(SOUND_KEY, v); },
  setVibration(v: boolean) { vibration = v; write(VIB_KEY, v); },
};
