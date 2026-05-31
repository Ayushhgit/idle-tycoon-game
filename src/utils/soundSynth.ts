// Tiny in-code sound synthesizer. Builds short WAV tones as base64 data URIs so
// the game has real SFX without shipping any audio asset files. Played via
// expo-av `Audio.Sound.createAsync({ uri })`.

const SAMPLE_RATE = 11025;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64FromBytes(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
  }
  return out;
}

function writeStr(dv: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) dv.setUint8(offset + i, str.charCodeAt(i));
}

function buildWav(samples: number[]): string {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buffer);
  writeStr(dv, 0, 'RIFF');
  dv.setUint32(4, 36 + n * 2, true);
  writeStr(dv, 8, 'WAVE');
  writeStr(dv, 12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, SAMPLE_RATE, true);
  dv.setUint32(28, SAMPLE_RATE * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  writeStr(dv, 36, 'data');
  dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(44 + i * 2, s * 0x7fff, true);
  }
  return 'data:audio/wav;base64,' + base64FromBytes(new Uint8Array(buffer));
}

interface Note {
  freq: number;
  dur: number;
  type?: 'sine' | 'square';
}

function renderNotes(notes: Note[], vol: number): number[] {
  const out: number[] = [];
  for (const note of notes) {
    const n = Math.floor(note.dur * SAMPLE_RATE);
    const attack = 0.006 * SAMPLE_RATE;
    const release = 0.03 * SAMPLE_RATE;
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, i / attack) * Math.min(1, (n - i) / release);
      let wave: number;
      if (note.type === 'square') {
        wave = Math.sin(2 * Math.PI * note.freq * t) >= 0 ? 1 : -1;
      } else {
        wave = Math.sin(2 * Math.PI * note.freq * t);
      }
      out.push(wave * vol * env);
    }
  }
  return out;
}

export type SoundKey =
  | 'tap'
  | 'critical'
  | 'purchase'
  | 'error'
  | 'achievement'
  | 'spin'
  | 'jackpot';

// Generated lazily once, cached.
let cache: Partial<Record<SoundKey, string>> | null = null;

export function getSoundUris(): Record<SoundKey, string> {
  if (cache) return cache as Record<SoundKey, string>;
  cache = {
    tap: buildWav(renderNotes([{ freq: 880, dur: 0.04 }], 0.22)),
    critical: buildWav(renderNotes([{ freq: 1046, dur: 0.05 }, { freq: 1568, dur: 0.08 }], 0.3)),
    purchase: buildWav(renderNotes([{ freq: 660, dur: 0.05 }, { freq: 990, dur: 0.08 }], 0.28)),
    error: buildWav(renderNotes([{ freq: 150, dur: 0.16, type: 'square' }], 0.22)),
    achievement: buildWav(
      renderNotes(
        [
          { freq: 523, dur: 0.08 },
          { freq: 659, dur: 0.08 },
          { freq: 784, dur: 0.08 },
          { freq: 1046, dur: 0.18 },
        ],
        0.3
      )
    ),
    spin: buildWav(renderNotes([{ freq: 440, dur: 0.06 }, { freq: 880, dur: 0.06 }], 0.22)),
    jackpot: buildWav(
      renderNotes(
        [
          { freq: 784, dur: 0.1 },
          { freq: 988, dur: 0.1 },
          { freq: 1318, dur: 0.1 },
          { freq: 1568, dur: 0.22 },
        ],
        0.32
      )
    ),
  };
  return cache as Record<SoundKey, string>;
}
