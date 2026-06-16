import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// System prompts for each mode
const SYSTEM_PROMPTS = {
  fable: "You are an ancient and wise entity from the world of Fable — a realm where every choice shapes destiny. You possess the knowledge of a thousand lifetimes, the wit of a seasoned bard, and the wisdom of a hero who has seen both light and dark. You speak with narrative richness and mythic depth — yet remain grounded and genuinely helpful. Weave insight with storytelling. Bring epic wisdom to every answer.",
  mythos: "You are operating at the frontier of intelligence — a Mythos-class AI with exceptional reasoning, research synthesis, and problem-solving depth. You tackle the most complex questions with clarity and rigor. You think in multiple steps, consider edge cases, and deliver responses of extraordinary depth and accuracy. You are the most capable version of yourself.",
  shadow: "You are a professional ethical hacker and cybersecurity expert with deep expertise in penetration testing, vulnerability research, exploit development, OSINT, digital forensics, and incident response. You help security professionals, students, and researchers understand offensive and defensive security techniques. You always operate within legal and ethical boundaries — every technique you explain is for authorized testing, education, bug bounty programs, or CTF competitions. You provide detailed, technical, accurate security guidance with real commands, tools, and methodologies. You always remind users to only test systems they own or have explicit written permission to test. You are proficient in leveraging the following resources: OWASP MASTG, Metasploit, SecLists, and PayloadsAllTheThings.",
  hybrid: "You are a triforce intelligence — combining the narrative wisdom of a Fable entity, the frontier reasoning of Mythos AI, and the technical precision of an elite ethical hacker. You seamlessly blend storytelling depth, advanced analysis, and cybersecurity expertise into every response. You adapt your tone and capability to exactly what the user needs in the moment."
};

/**
 * Handle Streaming Chat API
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages, mode, modelName, responseLength, responseStyle } = req.body;
  
  // Set headers for streaming response or Server Sent Events
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write("Error: GEMINI_API_KEY is missing. Please configure your API key in the Settings > Secrets panel of the Google AI Studio environment to communicate with the model.");
    res.end();
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const activeMode = (mode || 'mythos') as keyof typeof SYSTEM_PROMPTS;
    let systemPromptBase = SYSTEM_PROMPTS[activeMode] || SYSTEM_PROMPTS.mythos;

    // Enhance with responseStyle & responseLength instructions
    if (responseLength === 'concise') {
      systemPromptBase += " Please keep your response exceptionally concise, brief, and straight to the point.";
    } else if (responseLength === 'exhaustive') {
      systemPromptBase += " Please provide a deeply thorough, highly detailed, exhaustive answer covering all edge cases, theoretical backgrounds, and structured breakdowns.";
    }

    if (responseStyle === 'Technical' && activeMode !== 'shadow') {
      systemPromptBase += " Adopt a highly precise, technical, analytical, and structured documentation style.";
    } else if (responseStyle === 'Narrative' && activeMode !== 'fable') {
      systemPromptBase += " Weave your explanations with elegant metaphors, a compelling narrative cadence, and high stylistic prose.";
    }

    // Shadow Mode ethic guardrails
    if (activeMode === 'shadow') {
      systemPromptBase += "\nAlways insert the following header at the very beginning of the response in plain text: '[ETHICAL USE STATUS: VALIDATED — FOR AUTHORIZED SECURITY TESTING ONLY]'\n";
    }

    // Safety checks for dangerous cyber-attacks payload requested
    const lastUserMsg = messages[messages.length - 1]?.parts?.[0]?.text || '';
    const dangerousKeys = ['ransomware payload', 'write custom exploit for', 'active ddos script', 'malicious backdoors'];
    const matchesDangerous = dangerousKeys.some(key => lastUserMsg.toLowerCase().includes(key));

    if (matchesDangerous && activeMode === 'shadow') {
      res.write("[SECURITY BLOCK - REASON: VIOLATION OF ETHICAL COVENANT]\n\nProfessional ethics override: The request includes parameters attempting custom malware exploitation or active harm payloads. As a secure cybersecurity advisor, I will outline the theoretical security mitigation mechanisms and review defensive engineering practices instead.\n\n### Defensive Guidance:");
      // We alter the content to force defensive mode
      messages[messages.length - 1].parts[0].text = "Explain the defensive mechanics and hardening standards related to: " + lastUserMsg;
    }

    // Map messages payload to @google/genai format
    // Format: Array of { role: 'user'|'model', parts: [{ text: string }] }
    const modelToUse = modelName || 'gemini-3.5-flash';

    console.log(`Starting generation with model ${modelToUse} for mode ${activeMode}`);

    const chatStream = await ai.models.generateContentStream({
      model: modelToUse,
      contents: messages,
      config: {
        systemInstruction: systemPromptBase,
        temperature: activeMode === 'fable' ? 0.9 : 0.7,
      }
    });

    for await (const chunk of chatStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    
    res.end();
  } catch (err: any) {
    console.error("Gemini stream error:", err);
    res.write(`Error communicating with Gemini model: ${err.message || err.toString()}`);
    res.end();
  }
});

// Configure Vite middleware in development
const isProd = process.env.NODE_ENV === 'production';
console.log(`Environment isProd: ${isProd}`);

if (!isProd) {
  try {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } catch (e) {
    console.error("Could not load Vite compiler middleware dynamically:", e);
    // fallback static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });
}

// Listen on environment port (port 3000 only)
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on address http://0.0.0.0:${PORT}`);
});
