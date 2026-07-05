export interface SynthSettings {
  lfoRateHz: number;
  cutoffHz: number;
  resonance: number;
  decaySec: number;
  sidechainAmount: number;
  reverbWet: number;
}

export interface Tracks {
  lead: string[];       // 16 steps, notes/chords separated by commas e.g. "C4,Eb4,G4"
  subBass: string[];    // 16 steps, bass notes e.g. "C3"
  kick: number[];       // 16 steps, 0 or 1
  snare: number[];      // 16 steps, 0 or 1
  hihat: number[];      // 16 steps, 0 or 1
}

export interface MusicPattern {
  title: string;
  description: string;
  bpm: number;
  scale: string;
  tracks: Tracks;
  synthSettings: SynthSettings;
}

export interface VisualizerData {
  frequencyBinCount: number;
  getByteFrequencyData: (array: Uint8Array) => void;
  getByteTimeDomainData: (array: Uint8Array) => void;
}
