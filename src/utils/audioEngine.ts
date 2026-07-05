import { SynthSettings, Tracks } from "../types";

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private bpm = 128;
  private currentStep = 0;
  
  // Timing parameters
  private nextNoteTime = 0.0;
  private timerId: number | null = null;
  private lookaheadMs = 25.0;
  private scheduleAheadTimeSec = 0.1;
  
  // Callback to update the UI step indicator
  private onStepCallback: ((step: number) => void) | null = null;

  // Audio nodes
  private masterGain: GainNode | null = null;
  private synthGainBus: GainNode | null = null; // sidechained
  private bassGainBus: GainNode | null = null;  // sidechained
  private drumsGainBus: GainNode | null = null; // not sidechained
  private sidechainGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  // Synthesis controls
  private settings: SynthSettings = {
    lfoRateHz: 3.0,
    cutoffHz: 800,
    resonance: 3.0,
    decaySec: 0.5,
    sidechainAmount: 0.7,
    reverbWet: 0.4
  };

  private tracks: Tracks = {
    lead: Array(16).fill(""),
    subBass: Array(16).fill(""),
    kick: Array(16).fill(0),
    snare: Array(16).fill(0),
    hihat: Array(16).fill(0)
  };

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;

    // Create context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create master nodes
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Create sub buses
    this.synthGainBus = this.ctx.createGain();
    this.bassGainBus = this.ctx.createGain();
    this.drumsGainBus = this.ctx.createGain();

    // Sidechain bus setup (leads and bass go through sidechain)
    this.sidechainGain = this.ctx.createGain();
    this.sidechainGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.synthGainBus.connect(this.sidechainGain);
    this.bassGainBus.connect(this.sidechainGain);

    // Reverb node & Wet/Dry routing
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulseResponse(this.ctx, 2.5, 1.2); // 2.5s duration, 1.2s decay

    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(this.settings.reverbWet, this.ctx.currentTime);

    this.reverbDryGain = this.ctx.createGain();
    this.reverbDryGain.gain.setValueAtTime(1.0 - this.settings.reverbWet, this.ctx.currentTime);

    // Route buses
    // Sidechained leads & bass split into Dry and Reverb paths
    this.sidechainGain.connect(this.reverbDryGain);
    this.sidechainGain.connect(this.reverbNode);

    // Drums split into Dry and Reverb paths
    this.drumsGainBus.connect(this.reverbDryGain);
    this.drumsGainBus.connect(this.reverbNode);

    // Connect Reverb to Wet Gain
    this.reverbNode.connect(this.reverbWetGain);

    // Connect Dry & Wet path to Master Gain
    this.reverbDryGain.connect(this.masterGain);
    this.reverbWetGain.connect(this.masterGain);
  }

  // Generate beautiful cinematic reverb programmatically!
  private createReverbImpulseResponse(context: AudioContext, duration: number, decay: number): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const impulse = context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const percent = i / length;
      // Exponential decay envelope
      const env = Math.exp(-percent * decay * 5.0) * (1.0 - percent * 0.2);
      
      // Random white noise shaped by the decay envelope with some ambient filtering (moving average)
      let noiseL = Math.random() * 2 - 1;
      let noiseR = Math.random() * 2 - 1;

      left[i] = noiseL * env;
      right[i] = noiseR * env;
    }

    return impulse;
  }

  public setCallback(onStep: (step: number) => void) {
    this.onStepCallback = onStep;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(220, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public isEnginePlaying(): boolean {
    return this.isPlaying;
  }

  public setTracks(tracks: Tracks) {
    this.tracks = tracks;
  }

  public setSynthSettings(settings: SynthSettings) {
    this.settings = settings;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Update dry/wet mix
    this.reverbWetGain?.gain.setTargetAtTime(settings.reverbWet, now, 0.1);
    this.reverbDryGain?.gain.setTargetAtTime(1.0 - settings.reverbWet, now, 0.1);
  }

  public start(bpm?: number) {
    this.init();
    if (this.isPlaying) return;

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    if (bpm) this.bpm = bpm;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx!.currentTime;
    
    this.schedulerLoop();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private schedulerLoop() {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTimeSec) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(() => this.schedulerLoop(), this.lookaheadMs);
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPerStep = secondsPerBeat / 4.0; // 16th notes
    this.nextNoteTime += secondsPerStep;

    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(step: number, time: number) {
    // Notify React layer
    if (this.onStepCallback) {
      // Use requestAnimationFrame so UI updates align with screen refresh
      requestAnimationFrame(() => {
        if (this.isPlaying && this.onStepCallback) {
          this.onStepCallback(step);
        }
      });
    }

    // 1. Trigger Kick (And activate Sidechain Ducking!)
    if (this.tracks.kick[step] === 1) {
      this.playKickSound(time);
      this.applySidechainDucking(time);
    }

    // 2. Trigger Snare / Clap
    if (this.tracks.snare[step] === 1) {
      this.playSnareSound(time);
    }

    // 3. Trigger Hi-hat
    if (this.tracks.hihat[step] === 1) {
      this.playHihatSound(time);
    }

    // 4. Trigger Lead Chord
    const leadNote = this.tracks.lead[step];
    if (leadNote && leadNote.trim() !== "") {
      this.playLeadSynth(leadNote, time);
    }

    // 5. Trigger Sub-Bass
    const bassNote = this.tracks.subBass[step];
    if (bassNote && bassNote.trim() !== "") {
      this.playSubBass(bassNote, time);
    }
  }

  // --- Dynamic Sidechain Ducking (Signature Future Bass Pump) ---
  private applySidechainDucking(time: number) {
    if (!this.ctx || !this.sidechainGain) return;

    const duckTime = 0.05; // Extremely fast ducking
    const recoverTime = 0.20; // Ramps back up over 200ms
    const depth = 1.0 - this.settings.sidechainAmount; // How quiet it gets (e.g. 0.3 if sidechain amount is 0.7)

    const now = time;
    this.sidechainGain.gain.setValueAtTime(1.0, now);
    // Exponentially duck down immediately
    this.sidechainGain.gain.exponentialRampToValueAtTime(Math.max(0.01, depth), now + duckTime);
    // Smoothly linear ramp back up to full volume
    this.sidechainGain.gain.linearRampToValueAtTime(1.0, now + duckTime + recoverTime);
  }

  // --- Synthesizer Sound Generation ---

  // Detuned Super-saw Lead Synthesizer
  public playLeadSynth(noteString: string, time: number, customDecay?: number) {
    if (!this.ctx || !this.synthGainBus) return;

    const notes = noteString.split(",").map(n => n.trim());
    const duration = customDecay || this.settings.decaySec;

    notes.forEach((noteName, idx) => {
      const freq = this.noteToFreq(noteName);
      if (freq <= 0) return;

      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const osc3 = this.ctx!.createOscillator();

      // Detuned Super-saw wave for a cinematic wide sound
      osc1.type = "sawtooth";
      osc2.type = "sawtooth";
      osc3.type = "sawtooth";

      osc1.frequency.setValueAtTime(freq, time);
      // Detune left and right oscillators
      osc2.frequency.setValueAtTime(freq - (4 + idx * 2), time);
      osc3.frequency.setValueAtTime(freq + (4 + idx * 2), time);

      // Filter modulation (Lowpass modulated by LFO)
      const filter = this.ctx!.createBiquadFilter();
      filter.type = "lowpass";
      
      // Sweep cutoff frequency down dynamically (filter envelope)
      filter.Q.setValueAtTime(this.settings.resonance, time);
      filter.frequency.setValueAtTime(this.settings.cutoffHz * 2.5, time);
      filter.frequency.exponentialRampToValueAtTime(this.settings.cutoffHz, time + duration);

      // Pulsing Wobble effect via automated filter envelope modulation (LFO)
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();

      lfo.type = "sine";
      lfo.frequency.setValueAtTime(this.settings.lfoRateHz, time);
      lfoGain.gain.setValueAtTime(this.settings.cutoffHz * 0.6, time); // wobble intensity

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Chord level gain envelope
      const ampGain = this.ctx!.createGain();
      ampGain.gain.setValueAtTime(0.0, time);
      ampGain.gain.linearRampToValueAtTime(0.18 / notes.length, time + 0.02); // 20ms attack
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + duration); // decay to silence

      // Connect nodes
      osc1.connect(ampGain);
      osc2.connect(ampGain);
      osc3.connect(ampGain);

      ampGain.connect(filter);
      filter.connect(this.synthGainBus!);

      // Start and Stop
      osc1.start(time);
      osc2.start(time);
      osc3.start(time);
      lfo.start(time);

      osc1.stop(time + duration + 0.1);
      osc2.stop(time + duration + 0.1);
      osc3.stop(time + duration + 0.1);
      lfo.stop(time + duration + 0.1);
    });
  }

  // Deep Pure Sub-Bass (Analog Sine rumble)
  public playSubBass(noteName: string, time: number) {
    if (!this.ctx || !this.bassGainBus) return;

    const freq = this.noteToFreq(noteName);
    if (freq <= 0) return;

    // Pitch it down 1 octave if it's too high for sub bass
    let subFreq = freq;
    while (subFreq > 130) {
      subFreq = subFreq / 2.0;
    }

    const subOsc = this.ctx.createOscillator();
    subOsc.type = "sine"; // Pure smooth low frequency
    subOsc.frequency.setValueAtTime(subFreq, time);

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0.0, time);
    bassGain.gain.linearRampToValueAtTime(0.35, time + 0.02); // punchy 20ms attack
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4); // fast decay

    subOsc.connect(bassGain);
    bassGain.connect(this.bassGainBus);

    subOsc.start(time);
    subOsc.stop(time + 0.45);
  }

  // --- Procedural Drums ---

  // Heavy Analog-modeled Sub Kick
  public playKickSound(time: number) {
    if (!this.ctx || !this.drumsGainBus) return;

    const kickOsc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();

    kickOsc.type = "sine";
    
    // Quick frequency sweep from 140Hz down to 42Hz for punchy low-end impact
    kickOsc.frequency.setValueAtTime(140, time);
    kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

    kickGain.gain.setValueAtTime(0.0, time);
    kickGain.gain.linearRampToValueAtTime(0.8, time + 0.005); // near-instant attack
    kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25); // fast decay

    kickOsc.connect(kickGain);
    kickGain.connect(this.drumsGainBus);

    kickOsc.start(time);
    kickOsc.stop(time + 0.28);
  }

  // Bandpass-filtered Noise Snare / Clap
  public playSnareSound(time: number) {
    if (!this.ctx || !this.drumsGainBus) return;

    // Create a tiny white noise buffer
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 0.3; // 300ms
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to give it that electronic "crack" sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(2.0, time);

    const snareGain = this.ctx.createGain();
    snareGain.gain.setValueAtTime(0.0, time);
    snareGain.gain.linearRampToValueAtTime(0.45, time + 0.008); // Snappy snap
    snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22); // Clap decay

    // Add a quick sine-wave tail for the lower "body" of the snare (180Hz)
    const bodyOsc = this.ctx.createOscillator();
    bodyOsc.type = "triangle";
    bodyOsc.frequency.setValueAtTime(180, time);
    bodyOsc.frequency.linearRampToValueAtTime(100, time + 0.08);

    const bodyGain = this.ctx.createGain();
    bodyGain.gain.setValueAtTime(0.0, time);
    bodyGain.gain.linearRampToValueAtTime(0.25, time + 0.01);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.drumsGainBus);

    noiseNode.connect(filter);
    filter.connect(snareGain);
    snareGain.connect(this.drumsGainBus);

    noiseNode.start(time);
    bodyOsc.start(time);

    noiseNode.stop(time + 0.25);
    bodyOsc.stop(time + 0.12);
  }

  // Highpass-filtered Crisp Glitch Hi-hat
  public playHihatSound(time: number) {
    if (!this.ctx || !this.drumsGainBus) return;

    // Generate white noise
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 0.06; // 60ms decay
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Highpass filter above 9kHz for crispness
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(9000, time);

    const hihatGain = this.ctx.createGain();
    hihatGain.gain.setValueAtTime(0.0, time);
    hihatGain.gain.linearRampToValueAtTime(0.15, time + 0.002);
    hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noiseNode.connect(filter);
    filter.connect(hihatGain);
    hihatGain.connect(this.drumsGainBus);

    noiseNode.start(time);
    noiseNode.stop(time + 0.06);
  }

  // --- Interactive Ethereal Synth Vocal Chop Generator ---
  public playEtherealVocalChop(noteName: string, time: number) {
    this.init();
    if (!this.ctx || !this.synthGainBus) return;

    const freq = this.noteToFreq(noteName);
    if (freq <= 0) return;

    const now = time || this.ctx.currentTime;

    // Warm vowel sound: Triangle + Square with pitch bend and formant filter
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    
    osc1.type = "triangle";
    osc2.type = "sawtooth";

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq + 3.0, now); // detuned

    // Quick vocal sliding/bend (ethereal slide)
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 0.3);

    osc2.frequency.exponentialRampToValueAtTime(freq * 1.5 + 3.0, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(freq * 1.1 + 3.0, now + 0.3);

    // Ethereal Vibrato (LFO)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(6.2, now); // 6.2Hz vibrato
    vibratoGain.gain.setValueAtTime(5.0, now); // subtle pitch bend depth
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc1.frequency);
    vibratoGain.connect(osc2.frequency);

    // Formant Filter sweep to emulate vocal vowels "Ah -> Oh -> Uh"
    const formantFilter = this.ctx.createBiquadFilter();
    formantFilter.type = "bandpass";
    formantFilter.Q.setValueAtTime(4.5, now);
    formantFilter.frequency.setValueAtTime(800, now);
    formantFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
    formantFilter.frequency.linearRampToValueAtTime(700, now + 0.35);

    const chopGain = this.ctx.createGain();
    chopGain.gain.setValueAtTime(0.0, now);
    chopGain.gain.linearRampToValueAtTime(0.24, now + 0.03); // breathy fade-in
    chopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    // Routings
    osc1.connect(chopGain);
    osc2.connect(chopGain);
    chopGain.connect(formantFilter);
    formantFilter.connect(this.synthGainBus);

    // Triggers
    osc1.start(now);
    osc2.start(now);
    vibrato.start(now);

    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
    vibrato.stop(now + 0.4);
  }

  // --- Helper: Note to Frequency converter ---
  private noteToFreq(note: string): number {
    const notesMap: { [key: string]: number } = {
      "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, 
      "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
    };
    
    const regex = /^([A-G]#?|Db|Eb|Gb|Ab|Bb)(\d)$/i;
    const match = note.match(regex);
    if (!match) return 0;

    const noteName = match[1].toUpperCase();
    const octave = parseInt(match[2], 10);
    const noteValue = notesMap[noteName];

    // Formula to calculate frequency of a MIDI note
    const midiNote = 12 * (octave + 1) + noteValue;
    return 440.0 * Math.pow(2.0, (midiNote - 69) / 12.0);
  }
}

// Export a singleton instance of the Audio Engine
export const audioEngineInstance = new AudioEngine();
