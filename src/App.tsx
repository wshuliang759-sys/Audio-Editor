import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Square, 
  Sparkles, 
  Volume2, 
  Sliders, 
  Activity, 
  Info, 
  RefreshCw, 
  Music, 
  Trash2, 
  Layers, 
  Flame, 
  Cpu, 
  Compass,
  Check,
  AlertCircle
} from "lucide-react";
import { audioEngineInstance } from "./utils/audioEngine";
import { SynthSettings, Tracks, MusicPattern } from "./types";

// Standard minor scale notes to populate the note selector
const CHORD_OPTIONS = [
  "C4,Eb4,G4", "Ab3,C4,Eb4", "Bb3,D4,F4", "G3,Bb3,D4", "F3,Ab3,C4",
  "C4,Eb4,G4,Bb4", "Ab3,C4,Eb4,G4", "Bb3,D4,F4,Ab4",
  "C4", "Eb4", "F4", "G4", "Ab4", "Bb4", "C5"
];

const BASS_OPTIONS = [
  "C3", "Db3", "Eb3", "F3", "G3", "Ab3", "Bb3", "C2", "Eb2", "G2", "Ab2"
];

const TRANSLATIONS = {
  en: {
    sequencer: "Sequencer",
    futureBass: "Future Bass",
    synthwave: "Synthwave",
    ambientGlitch: "Ambient Glitch",
    bpmControl: "BPM CONTROL",
    scale: "SCALE",
    signalActive: "SIGNAL ACTIVE",
    studioStandby: "STUDIO STANDBY",
    nowProcessing: "NOW PROCESSING ARCHITECTURE",
    vocalChops: "ETHEREAL VOCAL MATRIX",
    vocalDesc: "Launch real-time atmospheric vocal chops with unique resonant sweep filters during live performance:",
    vocalChop1: "🌅 AETHER CHOP",
    vocalChop2: "🌌 ORBIT CHOP",
    vocalChop3: "🔮 NEBULA DRIFT",
    vocalChop4: "🌊 VOID ECHO",
    lead: "Super Lead",
    subBass: "Sub-Bass",
    kick: "Sub Kick",
    snare: "Noise Snare",
    hihat: "Crisp Hihat",
    neuralArchitect: "Neural Music Architect (Gemini AI)",
    neuralDesc: "Compose custom synth leads, deep sub-basses, side-chain compressions, and rhythmic patterns using artificial intelligence. Type any mood or style below.",
    generate: "GENERATE WORKSPACE",
    generating: "SYNTHESIZING...",
    quickPresets: "Quick Presets:",
    oscParams: "MODULAR OSC PARAMETERS",
    lfoRate: "LFO Wobble Rate",
    cutoff: "Lowpass Cutoff",
    resonance: "Resonance (Q)",
    decay: "Envelope Decay",
    effectsChain: "Master Effects Chain",
    compressor: "1. Sidechain Compressor",
    reverb: "2. Convolution Reverb",
    limiter: "3. High Fidelity Limiter",
    active: "ACTIVE",
    convolved: "CONVOLVED",
    bufferState: "AUDIO BUFFER STATE",
    stereoBuffered: "STEREO BUFFERED",
    rate: "SAMPLING RATE",
    depth: "BIT DEPTH",
    cpu: "CPU CONTEXT",
    channels: "CHANNELS",
    vocalPort: "G4 PORTAMENTO",
    vocalGlitch: "F4 GLITCH",
    vocalVowel: "EB4 VOWEL",
    vocalResonant: "C4 RESONANT",
    placeholder: "e.g. Dreamy Cyberpunk Sunset with rapid glitchy hihats and emotional chord sweeps...",
    clearMatrix: "Clear entire sequence matrix",
    stop: "Stop playback",
    start: "Start music engine",
    composeStep: "Compose Step",
    clearStep: "✕ CLEAR STEP NOTE",
    scaleLock: "Scale lock",
    close: "✕ Close",
    leadTrackDesc: "SUPERSAW POLY",
    bassTrackDesc: "ANALOG SINE",
    kickTrackDesc: "140HZ SWEEP",
    snareTrackDesc: "BANDPASS CLAP",
    hihatTrackDesc: "9KHZ HIGHPASS",
    activeFilter: "ACTIVE FILTER SPECTRUM",
    frequencyAnalyzer: "FREQUENCY ANALYZER"
  },
  zh: {
    sequencer: "步进音序器",
    futureBass: "未来贝斯 (Future Bass)",
    synthwave: "复古合成波 (Synthwave)",
    ambientGlitch: "氛围微脉冲 (Ambient Glitch)",
    bpmControl: "速度控制 (BPM)",
    scale: "调式音型",
    signalActive: "音频信号激活中",
    studioStandby: "音频引擎就绪中",
    nowProcessing: "当前处理声学架构",
    vocalChops: "太空空灵人声矩阵",
    vocalDesc: "在实时现场演奏期间，触发带有独特高通/带通共振扫频滤波器的实时大气人声切片：",
    vocalChop1: "🌅 以太切片",
    vocalChop2: "🌌 轨道人声",
    vocalChop3: "🔮 星云漂移",
    vocalChop4: "🌊 虚空回响",
    lead: "超级主音 (Lead)",
    subBass: "次重低音 (Sub-Bass)",
    kick: "重低音大鼓 (Kick)",
    snare: "噪波军鼓 (Snare)",
    hihat: "清脆踩镲 (Hihat)",
    neuralArchitect: "神经网络音乐架构师 (Gemini AI)",
    neuralDesc: "使用先进的大型语言模型生成符合您意图的合成器和声、低音贝斯、侧链压限以及极度协调的16步鼓点。在下方输入任意画面或意图。",
    generate: "AI 实时编曲合成",
    generating: "生成并部署中...",
    quickPresets: "快速预设:",
    oscParams: "模块化振荡器滤波器参数",
    lfoRate: "LFO 颤音频率",
    cutoff: "低通截止频率",
    resonance: "共鸣值 (Q值)",
    decay: "衰减释放时间",
    effectsChain: "主效果器链路由",
    compressor: "1. 侧链压限器",
    reverb: "2. 卷积空间混响",
    limiter: "3. High Fidelity Limiter",
    active: "运作中",
    convolved: "卷积中",
    bufferState: "音频流缓冲区状态",
    stereoBuffered: "双声道已缓冲",
    rate: "音频采样率",
    depth: "采样深度",
    cpu: "CPU核心负载",
    channels: "音轨模式",
    vocalPort: "G4 滑音控制",
    vocalGlitch: "F4 噪波控制",
    vocalVowel: "EB4 元音滤波器",
    vocalResonant: "C4 共振峰",
    placeholder: "例如：梦幻般的赛博朋克日落，带有快速闪烁的踩镲和充满情感的合成器和弦扫频...",
    clearMatrix: "清空当前编曲矩阵",
    stop: "停止播放",
    start: "开始播放",
    composeStep: "编辑第",
    clearStep: "✕ 清除当前步音符",
    scaleLock: "调式音阶锁定",
    close: "✕ 关闭",
    leadTrackDesc: "超级锯齿波复音",
    bassTrackDesc: "模拟纯正正弦波",
    kickTrackDesc: "140Hz扫频大鼓",
    snareTrackDesc: "带通噪波手掌拍",
    hihatTrackDesc: "9kHz高通清脆镲",
    activeFilter: "有源滤波器音频频谱",
    frequencyAnalyzer: "动态频谱分析器"
  }
};

// Presets data
const PRESETS: { [key: string]: MusicPattern } = {
  "future_bass": {
    title: "AETHER GLOW",
    description: "Lush supersaw chords coupled with deep side-chained sub-bass and crisp syncopated percussion.",
    bpm: 128,
    scale: "C Minor",
    tracks: {
      lead: [
        "C4,Eb4,G4", "", "C4,Eb4,G4", "", 
        "G3,Bb3,D4", "", "G3,Bb3,D4", "", 
        "Ab3,C4,Eb4", "", "Ab3,C4,Eb4", "", 
        "Bb3,D4,F4", "", "Bb3,D4,F4", ""
      ],
      subBass: [
        "C3", "", "C3", "", 
        "G2", "", "G2", "", 
        "Ab2", "", "Ab2", "", 
        "Bb2", "", "Bb2", ""
      ],
      kick: [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
    },
    synthSettings: {
      lfoRateHz: 3.5,
      cutoffHz: 950,
      resonance: 4.2,
      decaySec: 0.65,
      sidechainAmount: 0.85,
      reverbWet: 0.45
    }
  },
  "neon_retro": {
    title: "MIDNIGHT DRIVE",
    description: "Pulsing synthwave vibes featuring sharp basslines, driving 4-on-the-floor beat, and atmospheric reverb.",
    bpm: 114,
    scale: "A Minor",
    tracks: {
      lead: [
        "C4", "E4", "G4", "C5", 
        "A3", "C4", "E4", "A4", 
        "F3", "A3", "C4", "F4", 
        "G3", "B3", "D4", "G4"
      ],
      subBass: [
        "C3", "C3", "C3", "C3", 
        "A2", "A2", "A2", "A2", 
        "F2", "F2", "F2", "F2", 
        "G2", "G2", "G2", "G2"
      ],
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hihat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1]
    },
    synthSettings: {
      lfoRateHz: 1.2,
      cutoffHz: 1200,
      resonance: 2.5,
      decaySec: 0.4,
      sidechainAmount: 0.4,
      reverbWet: 0.3
    }
  },
  "ambient_glitch": {
    title: "NEBULA DRIFT",
    description: "An ethereal and atmospheric soundscape featuring rapid micro-glitch hihats and long lingering chords.",
    bpm: 135,
    scale: "F# Minor",
    tracks: {
      lead: [
        "F#4,A4,C#5", "", "", "", 
        "E4,G#4,B4", "", "", "", 
        "D4,F#4,A4", "", "", "", 
        "C#4,E4,G#4", "", "", ""
      ],
      subBass: [
        "F#2", "", "F#2", "", 
        "E2", "", "E2", "", 
        "D2", "", "D2", "", 
        "C#2", "", "C#2", ""
      ],
      kick: [1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0],
      hihat: [1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1]
    },
    synthSettings: {
      lfoRateHz: 6.5,
      cutoffHz: 600,
      resonance: 5.5,
      decaySec: 1.1,
      sidechainAmount: 0.9,
      reverbWet: 0.6
    }
  }
};

export default function App() {
  // --- State variables ---
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(128);
  const [activeStep, setActiveStep] = useState(0);
  
  const PRESET_TRANSLATIONS = {
    en: {
      future_bass: {
        title: "AETHER GLOW",
        description: "Lush supersaw chords coupled with deep side-chained sub-bass and crisp syncopated percussion."
      },
      neon_retro: {
        title: "MIDNIGHT DRIVE",
        description: "Pulsing synthwave vibes featuring sharp basslines, driving 4-on-the-floor beat, and atmospheric reverb."
      },
      ambient_glitch: {
        title: "NEBULA DRIFT",
        description: "An ethereal and atmospheric soundscape featuring rapid micro-glitch hihats and long lingering chords."
      }
    },
    zh: {
      future_bass: {
        title: "以太之光 (AETHER GLOW)",
        description: "华丽的超级锯齿波和弦，搭配深邃的侧链次低音以及清脆的切分音打击乐，构建出极富流动感的音乐空间。"
      },
      neon_retro: {
        title: "深夜狂飙 (MIDNIGHT DRIVE)",
        description: "充满霓虹律动的复古合成器波，极具穿透力的模拟低音、强劲的四拍子鼓点与宽广的空间混响。"
      },
      ambient_glitch: {
        title: "星云漂移 (NEBULA DRIFT)",
        description: "空灵缥缈的星际氛围音景，伴随快速闪烁的微脉冲故障踩镲和悠长延绵的太空和弦扫频。"
      }
    }
  };

  // Track details
  const [title, setTitle] = useState("以太之光 (AETHER GLOW)");
  const [description, setDescription] = useState("华丽的超级锯齿波和弦，搭配深邃的侧链次低音以及清脆的切分音打击乐，构建出极富流动感的音乐空间。");
  const [scale, setScale] = useState("C Minor");
  
  const [tracks, setTracks] = useState<Tracks>({
    lead: [
      "C4,Eb4,G4", "", "C4,Eb4,G4", "", 
      "G3,Bb3,D4", "", "G3,Bb3,D4", "", 
      "Ab3,C4,Eb4", "", "Ab3,C4,Eb4", "", 
      "Bb3,D4,F4", "", "Bb3,D4,F4", ""
    ],
    subBass: [
      "C3", "", "C3", "", 
      "G2", "", "G2", "", 
      "Ab2", "", "Ab2", "", 
      "Bb2", "", "Bb2", ""
    ],
    kick: [1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
  });

  const [synthSettings, setSynthSettings] = useState<SynthSettings>({
    lfoRateHz: 3.5,
    cutoffHz: 950,
    resonance: 4.2,
    decaySec: 0.65,
    sidechainAmount: 0.85,
    reverbWet: 0.45
  });

  // AI Generation and search states
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Note editor popup states
  const [editingTrack, setEditingTrack] = useState<"lead" | "subBass" | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Quick prompt presets for users to click
  const QUICK_PROMPTS = lang === "zh" ? [
    { label: "🌅 赛博朋克日出", text: "Heavy futuristic bass synth, hyper-energetic kick rhythm, and stellar bright synth chords" },
    { label: "🌌 深空太空氛围", text: "Slow atmospheric drone bass, super wide reverb synth chops, and slow glitchy hats" },
    { label: "🔮 忧郁冷酷微光", text: "Sad atmospheric emotional minor chords, highly rhythmic side-chain wobble, soft hats" },
    { label: "🔥 高科技电子故障", text: "Complex syncopated glitch rhythms, aggressive fast-vibrato lead synth, and deep sub thumps" }
  ] : [
    { label: "🌅 Cyberpunk Sunrise", text: "Heavy futuristic bass synth, hyper-energetic kick rhythm, and stellar bright synth chords" },
    { label: "🌌 Deep Space Ambient", text: "Slow atmospheric drone bass, super wide reverb synth chops, and slow glitchy hats" },
    { label: "🔮 Melancholic Chill", text: "Sad atmospheric emotional minor chords, highly rhythmic side-chain wobble, soft hats" },
    { label: "🔥 High-Tech Glitch", text: "Complex syncopated glitch rhythms, aggressive fast-vibrato lead synth, and deep sub thumps" }
  ];

  // Auto-translate current title/description when language is changed and it matches a preset
  useEffect(() => {
    // Check if current is matching future_bass
    if (title.includes("AETHER GLOW") || title.includes("以太之光")) {
      setTitle(PRESET_TRANSLATIONS[lang].future_bass.title);
      setDescription(PRESET_TRANSLATIONS[lang].future_bass.description);
    } else if (title.includes("MIDNIGHT DRIVE") || title.includes("深夜狂飙")) {
      setTitle(PRESET_TRANSLATIONS[lang].neon_retro.title);
      setDescription(PRESET_TRANSLATIONS[lang].neon_retro.description);
    } else if (title.includes("NEBULA DRIFT") || title.includes("星云漂移")) {
      setTitle(PRESET_TRANSLATIONS[lang].ambient_glitch.title);
      setDescription(PRESET_TRANSLATIONS[lang].ambient_glitch.description);
    }
  }, [lang]);

  // Sync state with the Web Audio Engine on mount and update
  useEffect(() => {
    audioEngineInstance.setTracks(tracks);
    audioEngineInstance.setSynthSettings(synthSettings);
    audioEngineInstance.setBpm(bpm);
  }, [tracks, synthSettings, bpm]);

  // Handle visualizer and active step reporting from audioEngine
  useEffect(() => {
    audioEngineInstance.setCallback((step: number) => {
      setActiveStep(step);
    });

    // Setup visualizer drawing loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = audioEngineInstance.analyser ? audioEngineInstance.analyser.frequencyBinCount : 512;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      
      const width = canvas.width;
      const height = canvas.height;

      // Draw beautiful dark tech matrix grid behind visualizer
      ctx.fillStyle = "rgba(10, 10, 11, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      if (audioEngineInstance.analyser && isPlaying) {
        // Fetch audio frequencies
        audioEngineInstance.analyser.getByteFrequencyData(dataArray);

        // Render gorgeous glowing 3D-styled analyzer bars
        const barWidth = (width / bufferLength) * 2.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.95;

          // Multi-color spectrum gradient (orange -> purple -> cyan)
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, "#a855f7"); // purple
          grad.addColorStop(0.5, "#f97316"); // orange
          grad.addColorStop(1, "#06b6d4"); // cyan

          ctx.fillStyle = grad;
          // Soft rounded glow bars
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
          if (x > width) break;
        }

        // Draw overlay oscilloscope wave line for high tech feel
        audioEngineInstance.analyser.getByteTimeDomainData(dataArray);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1.5;

        const sliceWidth = width / bufferLength;
        let waveX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(waveX, y);
          } else {
            ctx.lineTo(waveX, y);
          }
          waveX += sliceWidth;
        }
        ctx.stroke();

      } else {
        // Subtle futuristic idle soundwave animation when paused
        ctx.beginPath();
        ctx.strokeStyle = "rgba(249, 115, 22, 0.35)"; // subtle orange glow
        ctx.lineWidth = 1.5;
        const time = Date.now() * 0.004;
        
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.015 + time) * 8 * Math.cos(i * 0.005 + time * 0.5);
          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }
        ctx.stroke();

        // Secondary slow purple wave
        ctx.beginPath();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.cos(i * 0.02 - time * 0.7) * 12 * Math.sin(i * 0.003 + time * 0.3);
          if (i === 0) {
            ctx.moveTo(i, y);
          } else {
            ctx.lineTo(i, y);
          }
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying]);

  // Handle transport controls
  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngineInstance.stop();
      setIsPlaying(false);
    } else {
      audioEngineInstance.start(bpm);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioEngineInstance.stop();
    setIsPlaying(false);
    setActiveStep(0);
  };

  const handleClear = () => {
    const cleared: Tracks = {
      lead: Array(16).fill(""),
      subBass: Array(16).fill(""),
      kick: Array(16).fill(0),
      snare: Array(16).fill(0),
      hihat: Array(16).fill(0)
    };
    setTracks(cleared);
  };

  // Preset loading handler
  const loadPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setTitle(preset.title);
      setDescription(preset.description);
      setBpm(preset.bpm);
      setScale(preset.scale);
      setTracks(preset.tracks);
      setSynthSettings(preset.synthSettings);
      setErrorMsg(null);
    }
  };

  // Grid step editing handlers
  const toggleDrumStep = (trackName: "kick" | "snare" | "hihat", index: number) => {
    const updated = { ...tracks };
    updated[trackName][index] = updated[trackName][index] === 1 ? 0 : 1;
    setTracks(updated);

    // Play instant audio trigger on click for solid user feedback!
    if (updated[trackName][index] === 1) {
      audioEngineInstance.init();
      if (trackName === "kick") audioEngineInstance.playKickSound(0);
      if (trackName === "snare") audioEngineInstance.playSnareSound(0);
      if (trackName === "hihat") audioEngineInstance.playHihatSound(0);
    }
  };

  const openNoteEditor = (trackName: "lead" | "subBass", index: number) => {
    setEditingTrack(trackName);
    setEditingStepIndex(index);
  };

  const selectStepNote = (note: string) => {
    if (editingTrack === null || editingStepIndex === null) return;

    const updated = { ...tracks };
    updated[editingTrack][editingStepIndex] = note;
    setTracks(updated);

    // Play preview of selected note instantly
    if (note && note !== "") {
      audioEngineInstance.init();
      if (editingTrack === "lead") {
        audioEngineInstance.playLeadSynth(note, 0, 0.4);
      } else {
        audioEngineInstance.playSubBass(note, 0);
      }
    }

    // Close the inline popup helper
    setEditingTrack(null);
    setEditingStepIndex(null);
  };

  const clearStepNote = () => {
    if (editingTrack === null || editingStepIndex === null) return;

    const updated = { ...tracks };
    updated[editingTrack][editingStepIndex] = "";
    setTracks(updated);
    setEditingTrack(null);
    setEditingStepIndex(null);
  };

  // Trigger manual Ethereal Vocal Chops live
  const triggerVocalChop = (vocalNote: string) => {
    audioEngineInstance.playEtherealVocalChop(vocalNote, 0);
  };

  // Secure Server-side Gemini AI pattern generation!
  const generateAIPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/generate-pattern", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt, style: "Future Bass" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to generate music composition.");
      }

      const data: MusicPattern = await response.json();
      
      // Update our synth studio state with pristine coordination!
      setTitle(data.title || "GEMINI EVOCATION");
      setDescription(data.description || "Synthesized using generative neural electronic design.");
      setBpm(data.bpm || 128);
      setScale(data.scale || "Unknown Scale");
      setTracks(data.tracks);
      setSynthSettings(data.synthSettings);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred. Using local presets.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0B] text-[#E0E0E0] font-sans selection:bg-orange-500 overflow-x-hidden antialiased scanline">
      
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-center justify-between px-8 py-5 border-b border-white/10 gap-4">
        <div className="flex items-center space-x-8 md:space-x-12 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-orange-500 animate-pulse shadow-[0_0_12px_rgba(249,115,22,0.8)]"></div>
            <div className="text-xl font-black tracking-tighter text-white font-display">SYNTHETIX.OS</div>
          </div>
          <nav className="hidden sm:flex space-x-6 text-[10px] uppercase tracking-[0.2em] font-bold text-white/50">
            <span className="text-white border-b-2 border-orange-500 pb-1 cursor-default">{TRANSLATIONS[lang].sequencer}</span>
            <span className="hover:text-white cursor-pointer transition" onClick={() => loadPreset("future_bass")}>{TRANSLATIONS[lang].futureBass}</span>
            <span className="hover:text-white cursor-pointer transition" onClick={() => loadPreset("neon_retro")}>{TRANSLATIONS[lang].synthwave}</span>
            <span className="hover:text-white cursor-pointer transition" onClick={() => loadPreset("ambient_glitch")}>{TRANSLATIONS[lang].ambientGlitch}</span>
          </nav>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6 w-full md:w-auto justify-end">
          {/* Language Switcher Button */}
          <div className="flex items-center space-x-1 bg-white/5 border border-white/10 rounded-lg p-1 shrink-0">
            <button 
              onClick={() => setLang("zh")} 
              className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${lang === "zh" ? "bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "text-white/60 hover:text-white"}`}
            >
              中文
            </button>
            <button 
              onClick={() => setLang("en")} 
              className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all cursor-pointer ${lang === "en" ? "bg-orange-500 text-black shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "text-white/60 hover:text-white"}`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <div className="flex flex-col items-start pr-3 border-r border-white/10">
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">{TRANSLATIONS[lang].bpmControl}</span>
              <div className="flex items-center space-x-2">
                <input 
                  type="range" 
                  min="60" 
                  max="180" 
                  value={bpm} 
                  onChange={(e) => setBpm(parseInt(e.target.value, 10))}
                  className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-sm font-mono font-bold text-white">{bpm}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">{TRANSLATIONS[lang].scale}</span>
              <span className="text-xs font-bold text-teal-400 font-mono tracking-tight">{scale}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-white/5 px-4 py-2.5 rounded-full border border-orange-500/20">
            <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.8)] animate-pulse" : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">{isPlaying ? TRANSLATIONS[lang].signalActive : TRANSLATIONS[lang].studioStandby}</span>
          </div>
        </div>
      </header>

      {/* Main Content Layout Grid */}
      <main className="flex-1 grid grid-cols-12 relative min-h-[500px]">
        
        {/* Left Branding Sidebar Section */}
        <div className="hidden lg:col-span-1 border-r border-white/10 lg:flex flex-col items-center py-12 justify-between">
          <span className="vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] text-white/20 font-black">HIGH FIDELITY NEURAL SOUND</span>
          <div className="w-[1px] h-32 bg-gradient-to-b from-orange-500 via-purple-500 to-transparent"></div>
          <span className="vertical-rl rotate-180 text-[10px] uppercase tracking-[0.5em] text-teal-400/30 font-black">ANALOG OSCILLATORS</span>
        </div>

        {/* Central Sequencer & Visualizer Station */}
        <div className="col-span-12 lg:col-span-8 p-6 md:p-8 flex flex-col space-y-6">
          
          {/* Active Song Information Card */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/[0.02] border border-white/5 p-6 rounded-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-500/5 to-purple-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-orange-500 font-bold mb-1.5 block">{TRANSLATIONS[lang].nowProcessing}</span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white font-display mb-2 uppercase">
                {title}
              </h1>
              <p className="max-w-xl text-xs md:text-sm text-white/60 font-light italic leading-relaxed">
                {description}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2 md:flex-col items-start md:items-end text-[10px] uppercase tracking-wider text-white/40 font-mono">
              <span className="bg-white/5 px-2.5 py-1 rounded border border-white/5">Side-chain: <strong className="text-orange-500">{(synthSettings.sidechainAmount * 100).toFixed(0)}%</strong></span>
              <span className="bg-white/5 px-2.5 py-1 rounded border border-white/5">Reverb: <strong className="text-teal-400">{(synthSettings.reverbWet * 100).toFixed(0)}% Wet</strong></span>
              <span className="bg-white/5 px-2.5 py-1 rounded border border-white/5">Max Ceiling: <strong className="text-purple-400">-0.1dB</strong></span>
            </div>
          </div>

          {/* Gemini AI Interactive Music Architect Prompt Bar */}
          <form onSubmit={generateAIPattern} className="bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-teal-500/10 border border-orange-500/20 p-5 rounded-xl">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white font-display">{TRANSLATIONS[lang].neuralArchitect}</h3>
            </div>
            <p className="text-[11px] text-white/50 mb-4 font-light">
              {TRANSLATIONS[lang].neuralDesc}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={TRANSLATIONS[lang].placeholder}
                className="flex-1 bg-black/40 border border-white/10 px-4 py-2.5 rounded-lg text-xs font-mono focus:outline-none focus:border-orange-500 text-white transition-all placeholder:text-white/20"
                disabled={isGenerating}
              />
              <button 
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold uppercase text-[10px] tracking-wider px-6 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{TRANSLATIONS[lang].generating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{TRANSLATIONS[lang].generate}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompts Tag Cloud */}
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-[9px] text-white/30 font-mono uppercase">{TRANSLATIONS[lang].quickPresets}</span>
              {QUICK_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(q.text)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-2.5 py-1 rounded text-[9px] font-mono text-white/70 hover:text-white transition cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {errorMsg && (
              <div className="mt-3 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-start space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Interactive Audio Waveform / Spectral Visualizer */}
          <div className="relative border border-white/10 rounded-xl bg-black/60 overflow-hidden h-36">
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full"
              width={650}
              height={144}
            />
            {/* Visualizer Floating Metrics Overlay */}
            <div className="absolute top-3 left-3 flex space-x-4 pointer-events-none text-[9px] font-mono tracking-wider text-white/40">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span>FREQUENCY ANALYZER</span>
              </span>
              <span>FFT_SIZE: 1024</span>
              <span>SAMPLING: STEREO</span>
            </div>
            
            <div className="absolute bottom-3 right-3 pointer-events-none text-[9px] font-mono text-white/30 tracking-widest">
              {TRANSLATIONS[lang].activeFilter || "ACTIVE FILTER SPECTRUM"}
            </div>
          </div>

          {/* Core Multi-Channel Step Sequencer Grid */}
          <div className="bg-[#121214] border border-white/10 rounded-xl p-4 md:p-6 space-y-4">
            
            {/* Sequencer Header with step index numbers */}
            <div className="grid grid-cols-12 gap-1 items-center pb-2 border-b border-white/5">
              <div className="col-span-3 text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">
                {lang === "zh" ? "声部音轨名称" : "TRACK NAME"}
              </div>
              <div className="col-span-9 grid grid-cols-16 gap-1.5">
                {Array(16).fill(0).map((_, i) => (
                  <div 
                    key={i} 
                    className={`text-[9px] font-mono text-center font-bold py-1 transition-all duration-150 ${activeStep === i && isPlaying ? "text-orange-500 scale-125 neon-glow-cyan" : "text-white/30"}`}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </div>
                ))}
              </div>
            </div>

            {/* TRACK 1: Chord/Lead Synth */}
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3 flex flex-col justify-start">
                <span className="text-[11px] font-black uppercase text-white tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>{TRANSLATIONS[lang].lead}</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono">{TRANSLATIONS[lang].leadTrackDesc}</span>
              </div>

              <div className="col-span-9 grid grid-cols-16 gap-1.5 relative">
                {tracks.lead.map((stepNote, i) => {
                  const isActive = stepNote !== "";
                  const isCurrent = activeStep === i && isPlaying;
                  return (
                    <button
                      key={i}
                      id={`seq-lead-${i}`}
                      onClick={() => openNoteEditor("lead", i)}
                      className={`h-11 rounded border text-[9px] font-mono flex flex-col items-center justify-between p-1 transition-all duration-150 group cursor-pointer ${
                        isActive 
                          ? "bg-gradient-to-b from-orange-500 to-orange-600 border-orange-400 text-black font-bold shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                          : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5 hover:border-white/10"
                      } ${isCurrent ? "ring-2 ring-white scale-105 z-10" : ""}`}
                    >
                      <span className="text-[7px] text-white/40 uppercase tracking-tighter">
                        CH
                      </span>
                      <span className="truncate w-full text-center text-[8px]">
                        {isActive ? stepNote.split(",")[0] : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRACK 2: Sub Bass */}
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3 flex flex-col justify-start">
                <span className="text-[11px] font-black uppercase text-white tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  <span>{TRANSLATIONS[lang].subBass}</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono">{TRANSLATIONS[lang].bassTrackDesc}</span>
              </div>

              <div className="col-span-9 grid grid-cols-16 gap-1.5 relative">
                {tracks.subBass.map((stepNote, i) => {
                  const isActive = stepNote !== "";
                  const isCurrent = activeStep === i && isPlaying;
                  return (
                    <button
                      key={i}
                      id={`seq-bass-${i}`}
                      onClick={() => openNoteEditor("subBass", i)}
                      className={`h-11 rounded border text-[9px] font-mono flex flex-col items-center justify-between p-1 transition-all duration-150 group cursor-pointer ${
                        isActive 
                          ? "bg-gradient-to-b from-purple-500 to-purple-600 border-purple-400 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]" 
                          : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5 hover:border-white/10"
                      } ${isCurrent ? "ring-2 ring-white scale-105 z-10" : ""}`}
                    >
                      <span className="text-[7px] text-white/40 uppercase tracking-tighter">
                        SUB
                      </span>
                      <span className="truncate w-full text-center text-[8px]">
                        {isActive ? stepNote : "-"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRACK 3: Kick Drum */}
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3 flex flex-col justify-start">
                <span className="text-[11px] font-black uppercase text-white tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span>{TRANSLATIONS[lang].kick}</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono">{TRANSLATIONS[lang].kickTrackDesc}</span>
              </div>

              <div className="col-span-9 grid grid-cols-16 gap-1.5">
                {tracks.kick.map((isActive, i) => {
                  const isCurrent = activeStep === i && isPlaying;
                  return (
                    <button
                      key={i}
                      id={`seq-kick-${i}`}
                      onClick={() => toggleDrumStep("kick", i)}
                      className={`h-9 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                        isActive === 1 
                          ? "bg-orange-500 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                      } ${isCurrent ? "ring-2 ring-white scale-105 z-10" : ""}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive === 1 ? "bg-black" : "bg-white/20"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRACK 4: Snare Drum / Clap */}
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3 flex flex-col justify-start">
                <span className="text-[11px] font-black uppercase text-white tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  <span>{TRANSLATIONS[lang].snare}</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono">{TRANSLATIONS[lang].snareTrackDesc}</span>
              </div>

              <div className="col-span-9 grid grid-cols-16 gap-1.5">
                {tracks.snare.map((isActive, i) => {
                  const isCurrent = activeStep === i && isPlaying;
                  return (
                    <button
                      key={i}
                      id={`seq-snare-${i}`}
                      onClick={() => toggleDrumStep("snare", i)}
                      className={`h-9 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                        isActive === 1 
                          ? "bg-purple-500 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                      } ${isCurrent ? "ring-2 ring-white scale-105 z-10" : ""}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive === 1 ? "bg-white" : "bg-white/20"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRACK 5: Glitch Hihat */}
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3 flex flex-col justify-start">
                <span className="text-[11px] font-black uppercase text-white tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>{TRANSLATIONS[lang].hihat}</span>
                </span>
                <span className="text-[9px] text-white/30 font-mono">{TRANSLATIONS[lang].hihatTrackDesc}</span>
              </div>

              <div className="col-span-9 grid grid-cols-16 gap-1.5">
                {tracks.hihat.map((isActive, i) => {
                  const isCurrent = activeStep === i && isPlaying;
                  return (
                    <button
                      key={i}
                      id={`seq-hihat-${i}`}
                      onClick={() => toggleDrumStep("hihat", i)}
                      className={`h-9 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer ${
                        isActive === 1 
                          ? "bg-teal-500 border-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.5)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                      } ${isCurrent ? "ring-2 ring-white scale-105 z-10" : ""}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isActive === 1 ? "bg-black" : "bg-white/20"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Scanline playhead helper */}
            {isPlaying && (
              <div className="relative h-1 w-full bg-white/5 rounded">
                <div 
                  className="absolute h-full w-2 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,1)] rounded transition-all duration-75"
                  style={{ left: `${(activeStep / 16) * 100}%` }}
                />
              </div>
            )}
          </div>

          {/* Interactive Note Picker Modal/Overlay */}
          {editingTrack !== null && editingStepIndex !== null && (
            <div className="bg-black/80 border border-white/10 p-5 rounded-xl backdrop-blur-md relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4 text-orange-500" />
                  <h4 className="text-xs font-bold uppercase tracking-widest font-mono">
                    {TRANSLATIONS[lang].composeStep} {editingStepIndex + 1} - {editingTrack === "lead" ? (lang === "zh" ? "超级主音和弦 (Super Lead Chords)" : "Super Lead (Chords)") : TRANSLATIONS[lang].subBass}
                  </h4>
                </div>
                <button 
                  onClick={() => { setEditingTrack(null); setEditingStepIndex(null); }}
                  className="text-white/40 hover:text-white text-xs cursor-pointer animate-pulse"
                >
                  {TRANSLATIONS[lang].close}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {(editingTrack === "lead" ? CHORD_OPTIONS : BASS_OPTIONS).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => selectStepNote(opt)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 p-2.5 rounded text-[11px] font-mono text-center transition-all text-white cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-between gap-2 border-t border-white/10 pt-4">
                <button
                  onClick={clearStepNote}
                  className="bg-red-500/15 hover:bg-red-500/35 text-red-400 border border-red-500/30 text-[10px] tracking-wider uppercase font-bold px-4 py-2 rounded-lg transition-all cursor-pointer"
                >
                  {TRANSLATIONS[lang].clearStep}
                </button>
                <div className="text-[10px] text-white/40 flex items-center font-mono">
                  {TRANSLATIONS[lang].scaleLock}: {scale}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Controls & Atmospheric Textures Pad */}
        <div className="col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-l border-white/10 p-6 md:p-8 flex flex-col justify-between space-y-8">
          
          <div className="space-y-8">
            
            {/* Modular Synthesizer Parameters */}
            <section className="space-y-5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-white font-bold italic font-display">{TRANSLATIONS[lang].oscParams}</h3>
              </div>
              
              <div className="space-y-4">
                {/* LFO Modulation rate */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/60">{TRANSLATIONS[lang].lfoRate}</span>
                    <span className="text-orange-500 font-bold">{synthSettings.lfoRateHz.toFixed(1)} Hz</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="10.0" 
                    step="0.1"
                    value={synthSettings.lfoRateHz}
                    onChange={(e) => setSynthSettings({ ...synthSettings, lfoRateHz: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>

                {/* Filter Cutoff */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/60">{TRANSLATIONS[lang].cutoff}</span>
                    <span className="text-teal-400 font-bold">{synthSettings.cutoffHz} Hz</span>
                  </div>
                  <input 
                    type="range" 
                    min="200" 
                    max="3000" 
                    step="50"
                    value={synthSettings.cutoffHz}
                    onChange={(e) => setSynthSettings({ ...synthSettings, cutoffHz: parseInt(e.target.value, 10) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                {/* Filter Resonance */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/60">{TRANSLATIONS[lang].resonance}</span>
                    <span className="text-purple-400 font-bold">{synthSettings.resonance.toFixed(1)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1.0" 
                    max="8.0" 
                    step="0.1"
                    value={synthSettings.resonance}
                    onChange={(e) => setSynthSettings({ ...synthSettings, resonance: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                </div>

                {/* Chord decay */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-white/60">{TRANSLATIONS[lang].decay}</span>
                    <span className="text-white font-bold">{synthSettings.decaySec.toFixed(2)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2.0" 
                    step="0.05"
                    value={synthSettings.decaySec}
                    onChange={(e) => setSynthSettings({ ...synthSettings, decaySec: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            </section>

            {/* Interactive Live Ambient Vocal Chop Launcher Pad */}
            <section className="space-y-5">
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-teal-400" />
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-white font-bold italic font-display">{TRANSLATIONS[lang].vocalChops}</h3>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed font-light">
                {TRANSLATIONS[lang].vocalDesc}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerVocalChop("C4")}
                  className="bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/40 p-3 rounded-lg text-left transition duration-150 group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-white group-hover:text-orange-500 font-display">{TRANSLATIONS[lang].vocalChop1}</div>
                  <div className="text-[8px] font-mono text-white/30">{TRANSLATIONS[lang].vocalResonant}</div>
                </button>
                <button 
                  onClick={() => triggerVocalChop("Eb4")}
                  className="bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/40 p-3 rounded-lg text-left transition duration-150 group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-white group-hover:text-purple-400 font-display">{TRANSLATIONS[lang].vocalChop2}</div>
                  <div className="text-[8px] font-mono text-white/30">{TRANSLATIONS[lang].vocalVowel}</div>
                </button>
                <button 
                  onClick={() => triggerVocalChop("F4")}
                  className="bg-white/5 hover:bg-teal-500/10 border border-white/5 hover:border-teal-500/40 p-3 rounded-lg text-left transition duration-150 group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-white group-hover:text-teal-400 font-display">{TRANSLATIONS[lang].vocalChop3}</div>
                  <div className="text-[8px] font-mono text-white/30">{TRANSLATIONS[lang].vocalGlitch}</div>
                </button>
                <button 
                  onClick={() => triggerVocalChop("G4")}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/30 p-3 rounded-lg text-left transition duration-150 group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-white group-hover:text-white font-display">{TRANSLATIONS[lang].vocalChop4}</div>
                  <div className="text-[8px] font-mono text-white/30">{TRANSLATIONS[lang].vocalPort}</div>
                </button>
              </div>
            </section>

            {/* Master FX Routing List */}
            <section className="space-y-4">
              <h3 className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold italic">{TRANSLATIONS[lang].effectsChain}</h3>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded border border-white/5 text-xs font-mono">
                  <span className="text-white/70">{TRANSLATIONS[lang].compressor}</span>
                  <span className="text-[9px] text-orange-500 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">{TRANSLATIONS[lang].active}</span>
                </li>
                <li className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded border border-white/5 text-xs font-mono">
                  <span className="text-white/70">{TRANSLATIONS[lang].reverb}</span>
                  <span className="text-[9px] text-teal-400 font-bold bg-teal-400/10 px-1.5 py-0.5 rounded border border-teal-400/20 uppercase">{TRANSLATIONS[lang].convolved}</span>
                </li>
                <li className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded border border-white/5 text-xs font-mono text-white/30">
                  <span>{TRANSLATIONS[lang].limiter}</span>
                  <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded uppercase">-0.1 dB</span>
                </li>
              </ul>
            </section>

          </div>

          {/* Master Transport Panel */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={handleStop}
                title={TRANSLATIONS[lang].stop}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:text-white/70 hover:bg-white/5 transition cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>

              <button 
                onClick={handlePlayPause}
                title={isPlaying ? (lang === "zh" ? "暂停音频引擎" : "Pause music engine") : TRANSLATIONS[lang].start}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-orange-500 hover:text-black hover:shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all cursor-pointer"
              >
                {isPlaying ? <Square className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-1" />}
              </button>

              <button 
                onClick={handleClear}
                title={TRANSLATIONS[lang].clearMatrix}
                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-black/40 p-2.5 rounded border border-white/5 text-[9px] font-mono text-white/40 uppercase">
              <span>{TRANSLATIONS[lang].bufferState}</span>
              <span className="text-teal-400 font-bold animate-pulse">{TRANSLATIONS[lang].stereoBuffered}</span>
            </div>
          </div>

        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="px-8 py-3 bg-black border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[9px] tracking-[0.2em] font-mono text-white/30 gap-2">
        <div className="flex flex-wrap gap-4 sm:gap-8 justify-center sm:justify-start">
          <span>{TRANSLATIONS[lang].rate}: 48.0 KHZ</span>
          <span>{TRANSLATIONS[lang].depth}: 24-BIT MULTI-VOICE</span>
          <span>{TRANSLATIONS[lang].cpu}: 14% EST.</span>
          <span>{TRANSLATIONS[lang].channels}: STEREO PUMP</span>
        </div>
        <div className="flex items-center">
          <span className="mr-4">SYNTH_OS ENGINE: V4.1.2-ALPHA</span>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-teal-400 animate-ping" : "bg-orange-500"}`}></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
