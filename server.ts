import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK securely on the server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI Features will be disabled.");
}

// REST API for generating musical patterns
app.post("/api/generate-pattern", async (req, res) => {
  const { prompt, style } = req.body;

  if (!ai) {
    return res.status(503).json({ 
      error: "AI Generation is temporarily unavailable because the API key is not configured. Please use standard pre-sets." 
    });
  }

  const moodPrompt = prompt || `A beautiful, atmospheric ${style || "Future Bass"} track with pulsing energy and deep melancholic vibes`;

  const promptText = `
    You are an expert AI music producer specializing in Modern Electronic, Cinematic Future Bass, and Ambient Synth-pop.
    Your task is to generate a fully coherent, beautiful 16-step electronic music pattern based on this description: "${moodPrompt}".
    
    You must output a highly coordinated MIDI and synthesizer parameter set:
    - BPM: Typically 128 for Future Bass / Chillstep.
    - Scale: Evocative minor scale (e.g., "C minor", "A minor", "F# minor").
    - Title: Create a high-tech, futuristic, evocative title (e.g., "Aether Echoes", "Sub-Zero Sunrise").
    - Synth Lead/Chords (lead): Standard future bass utilizes lush synth chords on steps. Create chord notes (e.g. arrays of pitches like "C4,Eb4,G4", "Ab3,C4,Eb4" or single notes like "C4", "Eb4") that sound harmonically rich in the selected scale. Each of the 16 steps must be a string containing notes separated by commas (e.g., "C4,Eb4,G4"), or empty string "" for a rest. Make it sound rhythmic!
    - Sub Bass (subBass): A deep sub-bass line that follows the root notes of the chords (e.g., "C3", "Ab2", "F2", "G2") in perfect harmony. Each of the 16 steps must be a string with the bass note or empty string "" for rest.
    - Kick (kick): An array of 16 numbers (0 or 1) indicating if the kick triggers on that step. Steps are 1-indexed for reference, step 1 is the downbeat. Kick must be strong on step 1 and step 9 (or syncopated e.g. steps 1, 4, 9, 11).
    - Snare (snare): An array of 16 numbers (0 or 1). In half-time electronic music, the snare hits strongly on step 5 and step 13.
    - Hihat/Glitch Perc (hihat): An array of 16 numbers (0 or 1) representing crisp hihats or glitchy atmospheric textures on offbeats (e.g. steps 3, 7, 11, 15).
    - Synth Settings:
       - lfoRateHz: LFO frequency in Hz to create the pulsing "wobble" effect (e.g., between 1.0 and 8.0 Hz).
       - cutoffHz: Base filter cutoff frequency (e.g. between 400 and 1500 Hz).
       - resonance: Filter Q factor (e.g. 2.0 to 6.0).
       - decaySec: Amp envelope decay (e.g. 0.2 to 1.2s).
       - sidechainAmount: Level of volume ducking triggered by the Kick (0.0 to 1.0).
       - reverbWet: Reverb mix level for spacious atmosphere (0.2 to 0.8).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "description", "bpm", "scale", "tracks", "synthSettings"],
          properties: {
            title: { type: Type.STRING, description: "Futuristic song title" },
            description: { type: Type.STRING, description: "A brief musical commentary on this layout" },
            bpm: { type: Type.INTEGER, description: "BPM of the track, default 128" },
            scale: { type: Type.STRING, description: "Musical key and scale" },
            tracks: {
              type: Type.OBJECT,
              required: ["lead", "subBass", "kick", "snare", "hihat"],
              properties: {
                lead: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "16 steps. Each is a note/chord list like 'C4,Eb4,G4' or empty string ''"
                },
                subBass: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "16 steps. Each is a deep note like 'C3' or empty string ''"
                },
                kick: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: "16 numbers: 0 or 1. Trigger for heavy sub-kick"
                },
                snare: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: "16 numbers: 0 or 1. Trigger for snare/clap"
                },
                hihat: {
                  type: Type.ARRAY,
                  items: { type: Type.INTEGER },
                  description: "16 numbers: 0 or 1. Trigger for glitch hihats"
                }
              }
            },
            synthSettings: {
              type: Type.OBJECT,
              required: ["lfoRateHz", "cutoffHz", "resonance", "decaySec", "sidechainAmount", "reverbWet"],
              properties: {
                lfoRateHz: { type: Type.NUMBER, description: "Frequency of LFO filter modulation" },
                cutoffHz: { type: Type.NUMBER, description: "Filter cutoff baseline" },
                resonance: { type: Type.NUMBER, description: "Filter Q factor" },
                decaySec: { type: Type.NUMBER, description: "Main chord decay time in seconds" },
                sidechainAmount: { type: Type.NUMBER, description: "Ducking amount from kick (0 to 1)" },
                reverbWet: { type: Type.NUMBER, description: "Spacious reverb dry/wet mix (0 to 1)" }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini");
    }

    const musicData = JSON.parse(resultText.trim());
    return res.json(musicData);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate track from prompt. Please try again.",
      details: error.message 
    });
  }
});

// Configure Vite or Static files depending on Environment
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cinematic Synth Studio running on http://localhost:${PORT}`);
  });
}

initializeServer();
