import { useState, useEffect, useRef } from 'react';
import { 
  Sword, 
  Sparkles, 
  ShieldAlert, 
  Settings, 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Info, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Terminal, 
  Send, 
  Award, 
  FileText, 
  Lock, 
  Compass, 
  Activity, 
  Globe, 
  Radio, 
  Key, 
  Binary, 
  Bug, 
  Smartphone, 
  Cpu, 
  FlameKindling,
  Paperclip,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { TerminalView } from './components/TerminalView';
import { SECURITY_TOOLS, translateAndExecute } from './securityTools';

// Types
interface Message {
  id: string;
  role: 'user' | 'model';
  parts: { text: string }[];
  mode: 'fable' | 'mythos' | 'shadow' | 'hybrid';
  timestamp: string;
  error?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  mode: 'fable' | 'mythos' | 'shadow' | 'hybrid';
  pinned: boolean;
  createdAt: string;
}

export default function App() {
  // Persistence states from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('triple_mode_sessions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing sessions:", e);
      }
    }
    return [
      {
        id: 'initial',
        title: 'New Investigation',
        messages: [],
        mode: 'mythos',
        pinned: false,
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem('triple_mode_active_id') || 'initial';
  });

  const [activeMode, setActiveMode] = useState<'fable' | 'mythos' | 'shadow' | 'hybrid'>(() => {
    return (localStorage.getItem('triple_mode_active_mode') as any) || 'mythos';
  });

  // Security ethics states
  const [hasConfirmedEthics, setHasConfirmedEthics] = useState<boolean>(() => {
    return localStorage.getItem('triple_mode_ethics_confirmed') === 'true';
  });
  const [showEthicsModal, setShowEthicsModal] = useState<boolean>(false);
  const [ethicsChecked, setEthicsChecked] = useState<boolean>(false);

  // Appearance settings
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('triple_mode_light_mode') === 'true';
  });
  const [modelName, setModelName] = useState<string>(() => {
    return localStorage.getItem('triple_mode_model') || 'gemini-3.5-flash';
  });
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('triple_mode_font_size') as any) || 'medium';
  });
  const [responseLength, setResponseLength] = useState<'concise' | 'detailed' | 'exhaustive'>(() => {
    return (localStorage.getItem('triple_mode_length') as any) || 'detailed';
  });
  const [responseStyle, setResponseStyle] = useState<'Narrative' | 'Technical' | 'Balanced'>(() => {
    return (localStorage.getItem('triple_mode_format') as any) || 'Balanced';
  });
  const [codeTheme, setCodeTheme] = useState<'dracula' | 'monokai' | 'github_dark'>(() => {
    return (localStorage.getItem('triple_mode_code_theme') as any) || 'dracula';
  });
  const [isTerminalFont, setIsTerminalFont] = useState<boolean>(() => {
    return localStorage.getItem('triple_mode_terminal_font') === 'true';
  });
  const [showSecurityDisclaimers, setShowSecurityDisclaimers] = useState<boolean>(() => {
    return localStorage.getItem('triple_mode_disclaimer') !== 'false';
  });

  // UI States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [exportedStatus, setExportedStatus] = useState<string | null>(null);

  // References
  const messageEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('triple_mode_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('triple_mode_active_id', activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    localStorage.setItem('triple_mode_active_mode', activeMode);
    // Add grid/themes properties to body
    const bodyCls = document.body.className;
  }, [activeMode]);

  useEffect(() => {
    localStorage.setItem('triple_mode_ethics_confirmed', String(hasConfirmedEthics));
  }, [hasConfirmedEthics]);

  useEffect(() => {
    localStorage.setItem('triple_mode_light_mode', String(isLightMode));
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLightMode]);

  // Sync general settings variables
  useEffect(() => { localStorage.setItem('triple_mode_model', modelName); }, [modelName]);
  useEffect(() => { localStorage.setItem('triple_mode_font_size', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('triple_mode_length', responseLength); }, [responseLength]);
  useEffect(() => { localStorage.setItem('triple_mode_format', responseStyle); }, [responseStyle]);
  useEffect(() => { localStorage.setItem('triple_mode_code_theme', codeTheme); }, [codeTheme]);
  useEffect(() => { localStorage.setItem('triple_mode_terminal_font', String(isTerminalFont)); }, [isTerminalFont]);
  useEffect(() => { localStorage.setItem('triple_mode_disclaimer', String(showSecurityDisclaimers)); }, [showSecurityDisclaimers]);

  // Scroll to bottom on load/new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, isLoading]);

  // Handle active session info
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Toggle Pinned status
  const togglePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
  };

  // Delete chat session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Keep at least one empty session
      setSessions([
        {
          id: 'initial',
          title: 'New Investigation',
          messages: [],
          mode: 'mythos',
          pinned: false,
          createdAt: new Date().toISOString()
        }
      ]);
      setActiveSessionId('initial');
      return;
    }

    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Create standard new session
  const handleNewChat = (modeOverride?: any) => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'New Investigation',
      messages: [],
      mode: modeOverride || activeMode,
      pinned: false,
      createdAt: new Date().toISOString()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    if (modeOverride) {
      setActiveMode(modeOverride);
    }
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Handle mode switches with safety popups
  const selectMode = (mode: 'fable' | 'mythos' | 'shadow' | 'hybrid') => {
    if (mode === 'shadow' && !hasConfirmedEthics) {
      setShowEthicsModal(true);
      return;
    }
    setActiveMode(mode);
    
    // Update active session mode if it is empty
    if (activeSession && activeSession.messages.length === 0) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, mode } : s));
    }
  };

  // Accept ethical covenant
  const acceptEthicalCovenant = () => {
    if (ethicsChecked) {
      setHasConfirmedEthics(true);
      setShowEthicsModal(false);
      setActiveMode('shadow');
      // Update active session if empty
      if (activeSession && activeSession.messages.length === 0) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, mode: 'shadow' } : s));
      }
    }
  };

  // Suggested prompt actions
  const clickSuggestedPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const finalMsg = (customText || inputMessage).trim();
    if (!finalMsg || isLoading) return;

    if (activeMode === 'shadow') {
        const securityTool = translateAndExecute(finalMsg);
        if (securityTool) {
            setInputMessage('');
            const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const mockOutput = `[Running Security Tool: ${securityTool.toolName}]\nCommand: \`${securityTool.actualCommand}\`\n\nOutput: \n${securityTool.mockOutput}`;
            
            setSessions(prev => prev.map(s => 
                s.id === activeSessionId ? { 
                  ...s, 
                  messages: [...messages, { 
                    id: `msg_user_${Date.now()}`,
                    role: 'user',
                    parts: [{ text: finalMsg }],
                    mode: activeMode,
                    timestamp: timestampStr
                  }, {
                    id: `msg_model_${Date.now()}`,
                    role: 'model',
                    parts: [{ text: mockOutput }],
                    mode: activeMode,
                    timestamp: timestampStr
                  }]
                } : s
            ));
            return;
        }
    }

    // Reset input message
    setInputMessage('');

    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      parts: [{ text: finalMsg }],
      mode: activeMode,
      timestamp: timestampStr
    };

    // Append to current chat
    let updatedMsgs = [...messages, userMessage];
    
    // Auto design chat title from first 5 words of user prompt if session is still untitled
    let sessionTitle = activeSession.title;
    if (messages.length === 0) {
      const words = finalMsg.split(' ');
      sessionTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
    }

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { 
        ...s, 
        title: sessionTitle, 
        messages: updatedMsgs,
        mode: s.messages.length === 0 ? activeMode : s.mode
      } : s
    ));

    setIsLoading(true);

    const modelMessageId = `msg_model_${Date.now()}`;
    const initialModelMsg: Message = {
      id: modelMessageId,
      role: 'model',
      parts: [{ text: '' }],
      mode: activeMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { 
        ...s, 
        messages: [...updatedMsgs, initialModelMsg]
      } : s
    ));

    try {
      // Prepare history formatted for @google/genai server-side
      // [{ role: 'user'|'model', parts: [{ text: string }] }]
      const mappedHistory = updatedMsgs.map(m => ({
        role: m.role,
        parts: m.parts
      }));

      // Call API streaming
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: mappedHistory,
          mode: activeMode,
          modelName: modelName,
          responseLength: responseLength,
          responseStyle: responseStyle
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: Status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedResult = '';

      if (!reader) {
        throw new Error("Unable to establish readable streaming pipeline on client browser.");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        streamedResult += chunk;

        // Keep updating model content
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            const index = s.messages.findIndex(m => m.id === modelMessageId);
            if (index !== -1) {
              const updated = [...s.messages];
              updated[index] = {
                ...updated[index],
                parts: [{ text: streamedResult }]
              };
              return { ...s, messages: updated };
            }
          }
          return s;
        }));
      }

    } catch (err: any) {
      console.error("Chat streaming error:", err);
      // Update with error message
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const index = s.messages.findIndex(m => m.id === modelMessageId);
          if (index !== -1) {
            const updated = [...s.messages];
            updated[index] = {
              ...updated[index],
              error: true,
              parts: [{ text: `System Pipeline Failure: ${err.message || err.toString()}` }]
            };
            return { ...s, messages: updated };
          }
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Response
  const handleRegenerateResponse = async () => {
    if (messages.length <= 1 || isLoading) return;
    
    // Find last user message
    let lastUserMessageIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIdx = i;
        break;
      }
    }

    if (lastUserMessageIdx === -1) return;

    // Slice history up to user message
    const historicalMessages = messages.slice(0, lastUserMessageIdx + 1);
    
    // Update local session state (removing the old model reply)
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: historicalMessages } : s
    ));

    // Submit user prompt again
    const lastUserPrompt = messages[lastUserMessageIdx].parts[0].text;
    setInputMessage('');
    
    // Re-run handleSendMessage logic
    // We execute with timeout to let React finish rendering the sliced history
    setTimeout(() => {
      handleSendMessage(undefined, lastUserPrompt);
    }, 50);
  };

  // Copy text utility with feedback
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear all history logs
  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to completely erase all chat records and session logs? This cannot be undone.")) {
      const initialSess = [
        {
          id: 'initial',
          title: 'New Investigation',
          messages: [],
          mode: 'mythos',
          pinned: false,
          createdAt: new Date().toISOString()
        }
      ];
      setSessions(initialSess);
      setActiveSessionId('initial');
      setIsSettingsOpen(false);
    }
  };

  // Quick Action triggers for Cybersecurity Shadow mode panel
  const runSecurityWorkflow = (taskKey: string) => {
    let prefillPrompt = '';
    switch(taskKey) {
      case 'recon':
        prefillPrompt = "Analyze reconnaissance methodologies & passive OSINT vectors to map out the external attack surface of a sample target. Explain with whois, dnsrecon, and shodan commands.";
        break;
      case 'webapp':
        prefillPrompt = "Guide me through a methodology to detect and evaluate critical vulnerabilities on a staging target web service. Review SQL Injection (SQLi) and Cross-Site Scripting (XSS) bypass concepts from Owasp Top 10 with secure remediation code.";
        break;
      case 'network':
        prefillPrompt = "Explain network service scanning strategies using Nmap. Elaborate on TCP Syn scan, UDP scan, script scan flags, and how to analyze port discovery signatures safely.";
        break;
      case 'auth':
        prefillPrompt = "Assess authentication vulnerabilities and defense protocols. Show how brute-force testing can be performed ethically via hydra, and explain multi-factor hardening patterns.";
        break;
      case 'defense':
        prefillPrompt = "Review defense-in-depth security architectures: outline Web Application Firewalls (WAF) rule sets, Network Intrusion Detection (IDS) filtering, and local host endpoint hardening guidelines.";
        break;
      case 'malware':
        prefillPrompt = "Explain malware analysis frameworks in an isolated sandbox. Explain the difference between static signature inspection, automated PE headers analysis, and dynamic code behavioral analysis.";
        break;
      case 'mobile':
        prefillPrompt = "Map out a security audit workflow for a mobile app file (APK). Detail certificate parsing, decompiling with jadx-gui, locating sensitive hardcoded resources, and checking key integrity.";
        break;
      case 'ctf':
        prefillPrompt = "Break down standard jeopardy Capture-The-Flag (CTF) paradigms. Help me understand steps to solve a classic stack-smashing buffer overflow or cryptography puzzle.";
        break;
      case 'forensics':
        prefillPrompt = "Detail digital forensics procedures for scanning an endpoint affected by an incident. Explain memory dump extraction using Volatility and log investigation techniques.";
        break;
      case 'report':
        prefillPrompt = "Draft an executive penetration testing report template, complete with executive overview, identified vulnerabilities classified by CVSS, deep technical proofs of concept, and priority recommendations.";
        break;
    }
    setInputMessage(prefillPrompt);
  };

  // Format Code Themes
  const getCodeThemeClasses = () => {
    switch(codeTheme) {
      case 'monokai':
        return 'bg-amber-950/10 text-emerald-300 font-mono border border-emerald-500/10';
      case 'github_dark':
        return 'bg-[#0d1117] text-[#c9d1d9] font-mono border border-[#30363d]';
      case 'dracula':
      default:
        return 'bg-[#181a24] text-[#f8f8f2] font-mono border border-indigo-500/10';
    }
  };

  // Export transcript as Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    let mdText = `# Chat Session: ${activeSession.title}\n`;
    mdText += `Date: ${new Date(activeSession.createdAt).toLocaleDateString()}\n`;
    mdText += `Identity Model: ${modelName}\n`;
    mdText += `=====================================================\n\n`;

    messages.forEach(msg => {
      mdText += `### [${msg.role === 'user' ? 'USER' : 'ASSISTANT'} (${msg.mode.toUpperCase()})] - ${msg.timestamp}\n`;
      mdText += `${msg.parts[0].text}\n\n`;
      mdText += `---\n\n`;
    });

    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transcript_${activeSession.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportedStatus('Markdown exported successfully!');
    setTimeout(() => setExportedStatus(null), 3000);
  };

  // Export transcript as PDF with jsPDF
  const handleExportPDF = () => {
    if (messages.length === 0) return;
    
    try {
      const doc = new jsPDF();
      
      // Page title and configuration
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CONVERSATIONAL TRANSCRIPT SUMMARY", 20, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Investigation Focus: ${activeSession.title}`, 20, 28);
      doc.text(`Timestamp Period: ${new Date(activeSession.createdAt).toLocaleDateString()}`, 20, 34);
      doc.text(`Primary Model Service: ${modelName}`, 20, 40);
      doc.line(20, 44, 190, 44);

      let currentY = 52;
      doc.setFontSize(10);

      messages.forEach((msg, idx) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        const senderLabel = msg.role === 'user' ? 'USER' : 'TRIPLE-MODE COGNITIVE AI';
        doc.text(`[${idx+1}] ${senderLabel} (${msg.mode.toUpperCase()}) - ${msg.timestamp}`, 20, currentY);
        currentY += 6;

        doc.setFont("helvetica", "normal");
        
        // Remove markdown elements safely for plain-text presentation inside PDF
        const cleanMsgText = msg.parts[0].text
          .replace(/[#*`_~]/g, '')
          .replace(/\[ETHICAL USE STATUS: VALIDATED — FOR AUTHORIZED SECURITY TESTING ONLY\]/g, '(VE-VALIDATED)');
        
        // Split text to line width
        const lines = doc.splitTextToSize(cleanMsgText, 160);
        
        lines.forEach((line: string) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }
          doc.text(line, 20, currentY);
          currentY += 5;
        });

        currentY += 7; // spacing
      });

      doc.save(`session_report_${activeSessionId}.pdf`);
      setExportedStatus('PDF Document exported successfully!');
      setTimeout(() => setExportedStatus(null), 3000);
    } catch (e: any) {
      console.error("PDF generation failure:", e);
      setExportedStatus(`Failed to generate PDF: ${e.message}`);
      setTimeout(() => setExportedStatus(null), 3000);
    }
  };

  // Custom Inline Renderer for beautiful UI
  const formatMarkdownToReact = (text: string) => {
    if (!text) return null;

    // First break down by backticks/code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Is it a Code Block?
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : 'code';
        const code = match ? match[2] : part.slice(3, -3);
        const codeId = `code_${index}_${Date.now()}`;

        return (
          <div key={index} className="my-4 rounded-lg overflow-hidden border border-gray-800/80 shadow-2xl">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-950/80 text-xs text-gray-400 border-b border-gray-900 font-sans select-none">
              <span className="capitalize font-medium text-emerald-400 tracking-wider flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {language || 'document'}
              </span>
              <button 
                onClick={() => copyToClipboard(code, codeId)} 
                className="flex items-center gap-1 hover:text-white transition-colors py-0.5 px-2 rounded hover:bg-white/5 active:bg-white/10"
              >
                {copiedId === codeId ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {/* Pre block */}
            <pre className={`p-4 overflow-x-auto select-text text-sm leading-relaxed ${getCodeThemeClasses()}`}>
              <code className="block whitespace-pre font-mono">{code}</code>
            </pre>
          </div>
        );
      }

      // Render standard paragraph formatting
      // Break line by line to detect lists, tables, quotes, or headings
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-2">
          {lines.map((line, lineIdx) => {
            // Trim to match patterns
            const trimmed = line.trim();

            // Headings
            if (trimmed.startsWith('### ')) {
              return <h3 key={lineIdx} className="text-lg font-bold text-gray-100 pt-3 pb-1 flex items-center gap-2 border-b border-gray-850 font-mythos">{trimmed.slice(4)}</h3>;
            }
            if (trimmed.startsWith('## ')) {
              return <h2 key={lineIdx} className="text-xl font-extrabold text-indigo-400 pt-4 pb-2 font-mythos">{trimmed.slice(3)}</h2>;
            }
            if (trimmed.startsWith('# ')) {
              return <h1 key={lineIdx} className="text-2xl font-black text-amber-500 pt-5 pb-3 border-b border-gray-800 font-fable">{trimmed.slice(2)}</h1>;
            }

            // Bullet lists
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <ul key={lineIdx} className="list-disc pl-6 space-y-1 my-1 text-gray-200">
                  <li className="leading-relaxed">{parseInlineStyles(trimmed.slice(2))}</li>
                </ul>
              );
            }

            // Ordered lists
            if (/^\d+\.\s/.test(trimmed)) {
              const listText = trimmed.replace(/^\d+\.\s/, '');
              return (
                <ol key={lineIdx} className="list-decimal pl-6 space-y-1 my-1 text-gray-200">
                  <li className="leading-relaxed">{parseInlineStyles(listText)}</li>
                </ol>
              );
            }

            // Block Quotes
            if (trimmed.startsWith('> ')) {
              return (
                <blockquote key={lineIdx} className="pl-4 py-1 border-l-4 border-amber-600 bg-amber-950/5 italic text-amber-100/95 rounded-r my-2">
                  {parseInlineStyles(trimmed.slice(2))}
                </blockquote>
              );
            }

            // Watermark or verified ethics header
            if (trimmed.startsWith('[ETHICAL USE STATUS: VALIDATED') || trimmed.includes('ethical hacking only')) {
              return (
                <div key={lineIdx} className="flex items-center gap-1.5 text-xs font-mono text-emerald-400/90 py-1.5 border-y border-emerald-500/20 my-2 select-none tracking-wide bg-emerald-950/10 px-3 rounded">
                  <Radio size={12} className="animate-pulse" />
                  <span>{trimmed}</span>
                </div>
              );
            }

            // Empty line
            if (trimmed === '') {
              return <div key={lineIdx} className="h-2"></div>;
            }

            // Standard line parsing
            return <p key={lineIdx} className="leading-relaxed text-gray-200">{parseInlineStyles(line)}</p>;
          })}
        </div>
      );
    });
  };

  // Mini inline style parser for bold (**), italic (* or _), code (`)
  const parseInlineStyles = (txt: string) => {
    // Escape or format HTML tags
    const htmlParts = txt.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    
    return htmlParts.map((sub, sIdx) => {
      // Bold
      if (sub.startsWith('**') && sub.endsWith('**')) {
        return <strong key={sIdx} className="font-bold text-white tracking-wide">{sub.slice(2, -2)}</strong>;
      }
      // Italic
      if (sub.startsWith('*') && sub.endsWith('*')) {
        return <em key={sIdx} className="italic text-gray-300">{sub.slice(1, -1)}</em>;
      }
      // Inline Code
      if (sub.startsWith('`') && sub.endsWith('`')) {
        return <code key={sIdx} className="bg-gray-900 border border-gray-800 text-amber-400 font-mono text-xs px-1.5 py-0.5 rounded font-semibold">{sub.slice(1, -1)}</code>;
      }
      return sub;
    });
  };

  // Helper theme-builder matches
  const getAppThemeClasses = () => {
    switch (activeMode) {
      case 'fable':
        return {
          bg: 'bg-[#020617]',
          sidebarBg: 'bg-[#0f172a]',
          primary: 'amber',
          textAccent: 'text-amber-400',
          borderActive: 'focus-within:border-amber-500/50',
          gridBg: 'bg-fable-grid',
          accentGradient: 'from-amber-500/10 to-transparent',
          buttonPrimary: 'bg-amber-600 hover:bg-amber-500 text-black px-4.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider',
          themeBorder: 'border-amber-900/30',
          newChatBtn: 'bg-amber-600/10 border border-amber-500/30 text-amber-400 hover:bg-amber-600/20 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-2 tracking-wider select-none',
          activeSidebarItem: 'bg-amber-950/20 border-l-2 border-amber-500 px-3 py-2 text-xs text-amber-50 truncate',
        };
      case 'shadow':
        return {
          bg: 'bg-[#020617]',
          sidebarBg: 'bg-[#0f172a]',
          primary: 'emerald',
          textAccent: 'text-emerald-400',
          borderActive: 'focus-within:border-emerald-500/50',
          gridBg: 'bg-shadow-grid',
          accentGradient: 'from-emerald-500/10 to-transparent',
          buttonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-black px-4.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider font-mono',
          themeBorder: 'border-emerald-900/30',
          newChatBtn: 'bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-2 tracking-wider select-none font-mono',
          activeSidebarItem: 'bg-emerald-900/15 border-l-2 border-emerald-500 px-3 py-2 text-xs text-emerald-50 font-mono truncate',
        };
      case 'hybrid':
        return {
          bg: 'bg-[#020617]',
          sidebarBg: 'bg-[#0f172a]',
          primary: 'cyan',
          textAccent: 'text-cyan-400',
          borderActive: 'focus-within:border-cyan-500/50',
          gridBg: 'bg-mythos-grid',
          accentGradient: 'from-cyan-500/10 to-transparent',
          buttonPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-black px-4.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider',
          themeBorder: 'border-cyan-900/30',
          newChatBtn: 'bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/20 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-2 tracking-wider select-none',
          activeSidebarItem: 'bg-cyan-950/20 border-l-2 border-cyan-500 px-3 py-2 text-xs text-cyan-50 truncate',
        };
      case 'mythos':
      default:
        return {
          bg: 'bg-[#020617]',
          sidebarBg: 'bg-[#0f172a]',
          primary: 'violet',
          textAccent: 'text-violet-400',
          borderActive: 'focus-within:border-violet-500/50',
          gridBg: 'bg-mythos-grid',
          accentGradient: 'from-violet-500/10 to-transparent',
          buttonPrimary: 'bg-violet-600 hover:bg-violet-500 text-white px-4.5 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all tracking-wider',
          themeBorder: 'border-violet-900/30',
          newChatBtn: 'bg-violet-600/10 border border-violet-500/30 text-violet-400 hover:bg-violet-600/20 py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-2 tracking-wider select-none',
          activeSidebarItem: 'bg-violet-950/20 border-l-2 border-violet-500 px-3 py-2 text-xs text-violet-50 truncate',
        };
    }
  };

  const themeTheme = getAppThemeClasses();
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.messages.some(m => m.parts[0].text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`h-screen flex text-gray-200 select-none overflow-hidden font-sans ${themeTheme.bg} ${isTerminalFont ? 'font-shadow' : ''}`}>
      
      {/* EXPORTED FLOATING NOTIFICATION BANNER */}
      {exportedStatus && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-950/90 text-emerald-400 px-4 py-3 rounded-lg border border-emerald-500/30 shadow-2xl animate-bounce">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{exportedStatus}</span>
        </div>
      )}

      {/* MOBILE HEADER BUTTON BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-950 border-b border-gray-900 z-40 flex items-center justify-between px-4">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/5 active:bg-white/10">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-1.5 font-medium">
          {activeMode === 'fable' && <Sword size={18} className="text-amber-500" />}
          {activeMode === 'mythos' && <Sparkles size={18} className="text-violet-400" />}
          {activeMode === 'shadow' && <Terminal size={18} className="text-emerald-400" />}
          {activeMode === 'hybrid' && <Compass size={18} className="text-cyan-400" />}
          <span className="uppercase text-xs tracking-widest font-bold">
            {activeMode} Mode
          </span>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white rounded hover:bg-white/5 active:bg-white/10">
          <Settings size={20} />
        </button>
      </div>      {/* COLLAPSIBLE SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r ${themeTheme.themeBorder} flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-0 hidden md:flex'} md:relative transition-transform duration-200 ease-in-out`}>
        {/* SIDEBAR HEADER */}
        <div className={`p-4 border-b ${themeTheme.themeBorder} bg-[#0f172a]/95 flex items-center justify-between`}>
          <div className="flex items-center gap-2 select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-xs tracking-widest uppercase font-mono flex items-center gap-1 text-slate-200">
              TRIPLE CORE AI
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white rounded p-1">
            <X size={16} />
          </button>
        </div>

        {/* NEW SESSION ACTIONS */}
        <div className="p-4 space-y-2">
          <button 
            onClick={() => handleNewChat()}
            className={themeTheme.newChatBtn}
          >
            <Plus size={14} />
            + New Conversation
          </button>

          {/* QUICK SEARCH */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search history files..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/55 border border-slate-800 text-slate-300 placeholder-slate-500 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* SIDEBAR LIST */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-xs">
              No files archived.
            </div>
          ) : (
            <>
              {/* PINNED CHATS SECT */}
              {filteredSessions.some(s => s.pinned) && (
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-wider px-3 text-slate-500 font-bold mb-1.5 select-none">Recent Sessions</div>
                  {filteredSessions.filter(s => s.pinned).map(sess => (
                    <div 
                      key={sess.id}
                      onClick={() => {
                        setActiveSessionId(sess.id);
                        setActiveMode(sess.mode);
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      className={`group w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-all ${sess.id === activeSessionId ? themeTheme.activeSidebarItem : 'text-slate-400 hover:bg-[#020617]/45 hover:text-slate-100 border border-transparent rounded-md'}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {sess.mode === 'fable' && <Sword size={12} className="text-amber-500 shrink-0" />}
                        {sess.mode === 'mythos' && <Sparkles size={12} className="text-violet-400 shrink-0" />}
                        {sess.mode === 'shadow' && <Terminal size={12} className="text-emerald-400 shrink-0" />}
                        {sess.mode === 'hybrid' && <Compass size={12} className="text-cyan-400 shrink-0" />}
                        <span className="truncate pr-2 font-medium">{sess.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => togglePinSession(sess.id, e)} className="text-amber-500 opacity-100 p-1 rounded hover:bg-[#020617]/30 transition-all">
                          <Check size={12} />
                        </button>
                        <button onClick={(e) => deleteSession(sess.id, e)} className="lg:opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-[#020617]/30 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TIMELINE LOGS */}
              <div>
                <div className="text-[10px] uppercase tracking-wider px-3 text-slate-500 font-bold mb-1.5 select-none">Archive Timeline</div>
                {filteredSessions.filter(s => !s.pinned).map(sess => (
                  <div 
                    key={sess.id}
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setActiveMode(sess.mode);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`group w-full flex items-center justify-between px-3 py-2 text-xs cursor-pointer select-none transition-all ${sess.id === activeSessionId ? themeTheme.activeSidebarItem : 'text-slate-400 hover:bg-[#020617]/45 hover:text-slate-100 border border-transparent rounded-md'}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {sess.mode === 'fable' && <Sword size={12} className="text-amber-500/80 shrink-0" />}
                      {sess.mode === 'mythos' && <Sparkles size={12} className="text-violet-400/80 shrink-0" />}
                      {sess.mode === 'shadow' && <Terminal size={12} className="text-emerald-400/80 shrink-0" />}
                      {sess.mode === 'hybrid' && <Compass size={12} className="text-cyan-400/80 shrink-0" />}
                      <span className="truncate pr-2">{sess.title}</span>
                    </div>
                    <div className="flex items-center gap-1 select-none">
                      <button onClick={(e) => togglePinSession(sess.id, e)} className="lg:opacity-0 group-hover:opacity-100 text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-[#020617]/30 transition-all">
                        <span className="text-[10px] font-semibold text-slate-400 shrink-0 select-none">Pin</span>
                      </button>
                      <button onClick={(e) => deleteSession(sess.id, e)} className="lg:opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-[#020617]/30 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* WATERMARK LAB FOOTER */}
        <div className="p-4 border-t border-gray-900/60 text-[10px] font-mono select-none flex items-center justify-between text-gray-500">
          <span>COGNITIVE CORE INTEL v2.5</span>
          <span>ONLINE</span>
        </div>

      </div>

      {/* CORE DISPLAY STAGE */}
      <div className={`flex-1 flex flex-col relative w-full ${themeTheme.gridBg}`}>
        
        {/* OPTIONAL DISCLAIMER BANNER IN SHADOW MODE */}
        {activeMode === 'shadow' && showSecurityDisclaimers && (
          <div className="bg-red-950/20 border-b border-red-500/20 text-red-200 py-2 px-4 flex items-center justify-between z-10 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-400 shrink-0 animate-pulse" />
              <span>
                <strong>CYBERSECURITY RESEARCH ENVIRONMENT ACTIVE</strong> — All queries run under professional legal compliance bounds. Actions are strictly educational under bug bounty or CTF frameworks.
              </span>
            </div>
            <button onClick={() => setShowSecurityDisclaimers(false)} className="text-red-400 hover:text-white p-1 rounded">
              <X size={12} />
            </button>
          </div>
        )}

        {/* TOP COGNITIVE STAGE NAVIGATION / SELECTOR PANEL */}
        <div className={`hidden md:flex h-14 bg-[#020617]/80 backdrop-blur-md border-b ${themeTheme.themeBorder} items-center justify-between px-6 select-none z-10 shrink-0`}>
          {/* SIDER CONTROL BUTTONS */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className="p-1.5 border border-slate-800 bg-slate-900/40 text-slate-450 hover:text-white rounded-md transition-all"
            >
              <Menu size={16} />
            </button>
            <div className="text-xs uppercase tracking-widest font-mono text-slate-450 select-none">
              Cognitive Stage Selection
            </div>
          </div>

          {/* TRIPLE SELECTOR ACCENTS */}
          <div className={`flex items-center gap-1.5 bg-[#0f172a]/65 p-1 rounded-xl border ${themeTheme.themeBorder}`}>
            <button 
              onClick={() => selectMode('fable')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeMode === 'fable' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sword size={13} className={activeMode === 'fable' ? 'text-amber-400 animate-pulse' : ''} />
              🗡️ Fable Mode
            </button>

            <button 
              onClick={() => selectMode('mythos')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeMode === 'mythos' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Sparkles size={13} className={activeMode === 'mythos' ? 'text-violet-400' : ''} />
              🔮 Mythos Mode
            </button>

            <button 
              onClick={() => selectMode('shadow')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer ${activeMode === 'shadow' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300'} uppercase font-mono`}
            >
              <Terminal size={13} className={activeMode === 'shadow' ? 'text-emerald-400 font-mono' : ''} />
              💀 Shadow Mode
            </button>

            <button 
              onClick={() => selectMode('hybrid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeMode === 'hybrid' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Compass size={13} className={activeMode === 'hybrid' ? 'text-cyan-400' : ''} />
              🌀 Hybrid
            </button>
          </div>

          {/* RIGHT ACTION RIGS */}
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <div className={`flex items-center bg-[#0f172a] p-0.5 border ${themeTheme.themeBorder} rounded-lg`}>
                <button 
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800/30 active:bg-slate-800/60 rounded transition-all"
                >
                  <FileText size={12} className="text-violet-400" />
                  PDF Export
                </button>
                <div className={`h-4 w-[1px] bg-slate-800/60 mx-1`}></div>
                <button 
                  onClick={handleExportMarkdown}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800/30 active:bg-slate-800/60 rounded transition-all"
                >
                  <Download size={12} className="text-amber-400" />
                  MD Export
                </button>
              </div>
            )}

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-1.5 border ${themeTheme.themeBorder} bg-[#0f172a] text-slate-400 hover:text-white rounded-md transition-all hover:border-slate-700`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* MOBILE CHAT SELECTOR ACCENTS */}
        <div className="md:hidden mt-14 bg-gray-950/80 p-2 flex border-b border-gray-900 justify-around select-none shrink-0 z-10 overflow-x-auto gap-2">
          <button 
            onClick={() => selectMode('fable')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold uppercase ${activeMode === 'fable' ? 'bg-amber-600/10 text-amber-400 border border-amber-500/20' : 'text-gray-500'}`}
          >
            🗡️ Fable
          </button>
          <button 
            onClick={() => selectMode('mythos')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold uppercase ${activeMode === 'mythos' ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-gray-500'}`}
          >
            🔮 Mythos
          </button>
          <button 
            onClick={() => selectMode('shadow')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold uppercase ${activeMode === 'shadow' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-500'}`}
          >
            💀 Shadow
          </button>
          <button 
            onClick={() => selectMode('hybrid')}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold uppercase ${activeMode === 'hybrid' ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500'}`}
          >
            🌀 Hybrid
          </button>
        </div>

        {/* CHAT PLATFORM SCROLL PANE */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 select-text max-w-4xl mx-auto w-full"
        >
          {messages.length === 0 ? (
            /* EMPTY ENVIRONMENT DIRECTIVE AND PRESENTATIONS */
            <div className="flex flex-col items-center justify-center text-center mt-8 py-12 select-none">
              
              {/* BRAND IMAGE ACCENT CONTAINER */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gray-900 border ${themeTheme.themeBorder} shadow-2xl relative`}>
                  {activeMode === 'fable' && <Sword size={28} className="text-amber-500 animate-pulse" />}
                  {activeMode === 'mythos' && <Sparkles size={28} className="text-violet-400" />}
                  {activeMode === 'shadow' && <Terminal size={28} className="text-emerald-400" />}
                  {activeMode === 'hybrid' && <Compass size={28} className="text-cyan-400" />}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black border ${themeTheme.themeBorder} shadow`}>
                  <Activity size={10} className={themeTheme.textAccent} />
                </div>
              </div>

              {/* WELCOME MOTTO */}
              {activeMode === 'fable' && (
                <div className="max-w-md space-y-3">
                  <h2 className="text-2xl font-semibold font-fable text-amber-500 tracking-wider">🗡️ The Fable Narrative Wisdom</h2>
                  <p className="text-xs text-gray-400 leading-relaxed font-fable italic">
                    "Step inside and shape your path. We weave mythic insights with storytelling elegance. Every decision leaves its trace behind."
                  </p>
                </div>
              )}

              {activeMode === 'mythos' && (
                <div className="max-w-md space-y-3">
                  <h2 className="text-2xl font-bold font-mythos text-violet-400">🔮 Frontier Intelligence Mythos</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Access deep cognitive reasoning, multi-step problem solving, scientific models, and complex systems architecture synthesis.
                  </p>
                </div>
              )}

              {activeMode === 'shadow' && (
                <div className="max-w-lg space-y-3">
                  <h2 className="text-2xl font-bold font-shadow text-emerald-400 uppercase tracking-widest leading-none">💀 SHADOW NET COMPLIANT PROTOCOL</h2>
                  <p className="text-xs text-gray-500 font-mono tracking-wider leading-relaxed">
                    AUTHORIZATION SANCTIONED: ETHICAL CYBERSECURITY ENVIRONMENT ACTIVE. CORE ANALYTICS COVER OWASP TOP 10, NETWORK RECON, FORENSICS, & PENETRATION AUDITS.
                  </p>
                </div>
              )}

              {activeMode === 'hybrid' && (
                <div className="max-w-md space-y-3">
                  <h2 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">🌀 COGNITIVE TRIFORCE HYBRID</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Combining narrative grace, deep intelligence synthesis, and cybersecurity operational precision into a single dynamic stream.
                  </p>
                </div>
              )}

              {/* SECURITY WORKFLOWS PANEL (SHADOW MODE ONLY) */}
              {activeMode === 'shadow' && (
                <div className={`w-full max-w-2xl mt-8 pt-6 border-t ${themeTheme.themeBorder}`}>
                  <div className="text-[10px] uppercase font-mono text-emerald-400/80 mb-3 flex items-center gap-1.5 tracking-wider select-none font-bold">
                    <ShieldAlert size={12} className="animate-pulse" />
                    Interactive Cybersecurity Toolkit
                  </div>
                  <div className="grid grid-cols-2 shadow-inner sm:grid-cols-5 gap-2 select-none">
                    <button onClick={() => runSecurityWorkflow('recon')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Search size={14} className="text-emerald-400" />
                      <span>Recon & OSINT</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('webapp')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Globe size={14} className="text-emerald-400" />
                      <span>Web App Audit</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('network')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Radio size={14} className="text-emerald-400" />
                      <span>Net Scanning</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('auth')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Key size={14} className="text-emerald-400" />
                      <span>Pass Testing</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('defense')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Lock size={14} className="text-emerald-400" />
                      <span>Defense-in-depth</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('malware')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Bug size={14} className="text-emerald-400" />
                      <span>Malware Sandbox</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('mobile')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Smartphone size={14} className="text-emerald-400" />
                      <span>Mobile Hacking</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('ctf')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Award size={14} className="text-emerald-400" />
                      <span>CTF Solver</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('forensics')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <Cpu size={14} className="text-emerald-400" />
                      <span>Forensics & IR</span>
                    </button>
                    <button onClick={() => runSecurityWorkflow('report')} className="flex flex-col items-center gap-1.5 p-2 bg-[#0f172a]/45 border border-slate-800 hover:border-emerald-500/25 rounded-lg hover:bg-slate-850/30 cursor-pointer select-none text-[10px] font-medium tracking-wide transition-all text-slate-300">
                      <FileText size={14} className="text-emerald-400" />
                      <span>Report Draft</span>
                    </button>
                  </div>

                </div>
              )}

              {/* SUGGESTED STARTER PROMPTS */}
              <div className={`w-full max-w-xl mt-8 pt-6 border-t ${themeTheme.themeBorder} grid grid-cols-1 sm:grid-cols-2 gap-3 select-none`}>
                {activeMode === 'fable' && (
                  <>
                    <button onClick={() => clickSuggestedPrompt("Tell me a tale of a fallen hero who chose loyalty over survival")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-amber-500/25 hover:bg-amber-950/10 text-slate-300 transition-all">
                      🗡️ <strong>Epic Tale</strong>: Fallen hero seeking redemption
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Build me a dark fantasy world of magic governed by chemical equations")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-amber-500/25 hover:bg-amber-950/10 text-slate-300 transition-all">
                      📜 <strong>Worldbuilding</strong>: Medieval magic and science
                    </button>
                    <button onClick={() => clickSuggestedPrompt("What is the nature of light, light choices, and heavy consequences?")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-amber-500/25 hover:bg-amber-950/10 text-slate-300 transition-all">
                      💭 <strong>Lore Riddle</strong>: Philosophy of moral outcomes
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Write an epic quest narrative focused on preserving ancient scrolls")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-amber-500/25 hover:bg-amber-950/10 text-slate-300 transition-all">
                      🗺️ <strong>Legendary Quest</strong>: Guardians of library ashes
                    </button>
                  </>
                )}

                {activeMode === 'mythos' && (
                  <>
                    <button onClick={() => clickSuggestedPrompt("Deep dive into the architecture of quantum computing quantum decoherence mitigation")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-violet-500/25 hover:bg-violet-950/10 text-slate-300 transition-all">
                      ⚛️ <strong>Analysis</strong>: Quantum Decoherence mitigation
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Synthesize the key challenges of interstellar communications across massive relativistic constraints")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-violet-500/25 hover:bg-violet-950/10 text-slate-300 transition-all">
                      🌌 <strong>Synthesis</strong>: Interstellar relativistic communications
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Solve the three-prisoner problem with distinct multi-step probabilistic reasoning")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-violet-500/25 hover:bg-violet-950/10 text-slate-300 transition-all">
                      🔢 <strong>Math Reasoning</strong>: Multi-step Probability puzzle
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Analyze human language acquisition cognitive mechanics contrasted with LLM attention weight models")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-violet-500/25 hover:bg-violet-950/10 text-slate-300 transition-all">
                      🧠 <strong>Smart Model</strong>: Human acquisition vs LLM attention
                    </button>
                  </>
                )}

                {activeMode === 'shadow' && (
                  <>
                    <button onClick={() => clickSuggestedPrompt("How do I perform an authorized penetration testing evaluation on a web application staging endpoint?")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-emerald-500/25 hover:bg-emerald-950/10 text-slate-300 font-mono transition-all">
                      🔍 Web penetration testing workflow
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Explain the theoretical mechanics of stack block buffer overflow exploit vulnerabilities with defensive remediation.")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-emerald-500/25 hover:bg-emerald-950/10 text-slate-300 font-mono transition-all">
                      🔓 Buffer overflow vulnerability mechanics
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Help me solve an ethical entry-level Capture-The-Flag (CTF) binary reverse engineering challenge.")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-emerald-500/25 hover:bg-emerald-950/10 text-slate-300 font-mono transition-all">
                      🏁 Reverse engineering concepts for CTFs
                    </button>
                    <button onClick={() => clickSuggestedPrompt("What passive reconnaissance tools and Shodan queries provide information about open ports legally?")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-emerald-500/25 hover:bg-emerald-950/10 text-slate-300 font-mono transition-all">
                      📡 Passive scanning and Shodan recon syntax
                    </button>
                  </>
                )}

                {activeMode === 'hybrid' && (
                  <>
                    <button onClick={() => clickSuggestedPrompt("Combine the tale of a mythological digital fire guardian with the real defensive physics of cyber firewalls.")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-cyan-500/25 hover:bg-cyan-950/10 text-slate-300 transition-all">
                      🌀 <strong>Digital Guardian</strong>: Metaphors & network firewalls
                    </button>
                    <button onClick={() => clickSuggestedPrompt("Explain both the philosophical consequences of perfect machine memory and deep data compression algorithms.")} className="p-3 rounded-xl border border-slate-800 bg-[#0f172a]/45 text-start text-xs hover:border-cyan-500/25 hover:bg-cyan-950/10 text-slate-300 transition-all">
                      🧬 <strong>Philosophy & Math</strong>: Absolute memory & compression
                    </button>
                  </>
                )}
              </div>

            </div>
          ) : (
            /* CONVERSATION MESSAGES SCROLL */
            <div className="space-y-6">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                
                // Customize badges depending on the message mode
                const renderMessageBadge = () => {
                  if (isUser) return <span className="bg-gray-800 text-gray-300 text-[10px] px-2 py-0.5 rounded-full select-none">USER</span>;
                  
                  switch(message.mode) {
                    case 'fable':
                      return (
                        <span className="bg-amber-600/20 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-fable">
                          <Sword size={10} />
                          FABLE CORES
                        </span>
                      );
                    case 'shadow':
                      return (
                        <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <Terminal size={10} className="animate-pulse" />
                          SHADOW INTELLIGENCE (SE-SECURE)
                        </span>
                      );
                    case 'hybrid':
                      return (
                        <span className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Compass size={10} />
                          TRIFORCE HYBRID
                        </span>
                      );
                    case 'mythos':
                    default:
                      return (
                        <span className="bg-violet-600/20 text-violet-400 border border-violet-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mythos">
                          <Sparkles size={10} />
                          MYTHOS CORE v3.1
                        </span>
                      );
                  }
                };

                return (
                  <div 
                    key={message.id}
                    className={`flex flex-col gap-2 p-5 rounded-2xl border transition-all duration-300 select-text outline-none group ${isUser ? 'bg-slate-900/45 border-slate-800 text-slate-100 max-w-[85%] ml-auto shadow-inner' : `bg-slate-900/20 ${message.error ? 'border-red-500/20 bg-red-950/5' : themeTheme.themeBorder} text-slate-200 shadow-sm relative`}`}
                  >
                    {/* MESSAGE META METADATA */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/40 text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-2 select-none">
                        {renderMessageBadge()}
                        <span>•</span>
                        <span>{message.timestamp}</span>
                      </div>
                      
                      {/* ACCENT COPY BUTTON ON HOVER */}
                      {!isUser && (
                        <button 
                          onClick={() => copyToClipboard(message.parts[0].text, message.id)}
                          className="lg:opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 active:bg-slate-700 transition-opacity flex items-center gap-1"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-[10px] font-bold text-emerald-400 uppercase select-none">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span className="text-[10px] font-bold uppercase select-none">Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* TEXT BODY OUTLOOK */}
                    <div className={`pt-2 text-sm leading-relaxed ${fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap select-text">{message.parts[0].text}</p>
                      ) : (
                        message.parts[0].text === '' ? (
                          /* TYPING PULSE STATE */
                          <div className="flex items-center gap-3 py-2 text-slate-500 font-mono select-none">
                            <RefreshCw size={14} className="animate-spin text-emerald-400" />
                            <span className="animate-pulse text-xs">Stream active...</span>
                          </div>
                        ) : (
                          formatMarkdownToReact(message.parts[0].text)
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* BOTTOM SEND CONTROLS RIG */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-[#020617] to-transparent flex flex-col items-center justify-bottom shrink-0 select-none z-10 w-full">
          
          <form 
            onSubmit={handleSendMessage}
            className={`w-full max-w-4xl bg-[#0f172a]/95 border ${themeTheme.themeBorder} ${themeTheme.borderActive} p-1.5 rounded-2xl flex items-center gap-2 transition-all relative`}
          >
            <input 
              type="text"
              value={inputMessage}
              disabled={isLoading}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isLoading ? "Stream responding..." : `Query the intelligence engine inside ${activeMode.toUpperCase()} mode...`}
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none pl-4 py-2 text-sm"
            />
            
            {/* INPUT ACTIONS */}
            <div className="flex items-center gap-1 select-none">
              
              {/* REGENERATE RESPONSE */}
              {messages.length > 0 && !isLoading && (
                <button 
                  type="button"
                  onClick={handleRegenerateResponse}
                  title="Regenerate last answer"
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <RefreshCw size={15} />
                </button>
              )}

              {/* ACTION SEND */}
              <button 
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all select-none cursor-pointer ${inputMessage.trim() && !isLoading ? themeTheme.buttonPrimary : 'bg-[#020617]/50 border border-slate-800/60 text-slate-600 cursor-not-allowed'}`}
              >
                <Send size={14} />
              </button>

            </div>
          </form>

          {/* LOWER WATERMARK DISCLAIMER OR SHORTCUTS */}
          <div className="mt-2 text-[10px] text-slate-500 text-center font-mono select-none">
            {activeMode === 'shadow' 
              ? "AUTHORIZED SECURITY INVESTIGATION COMPLIANCE BOUND • PROTECDER CORE v2.5" 
              : "Powered by full-stack Google Gemini Core with narratively and technically enhanced intelligence guidelines."}
          </div>

        </div>

      </div>

      {/* COMPACT SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-gray-950 border border-gray-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col gap-4">
            
            {/* HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-950 text-white">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-indigo-400" />
                <span className="font-extrabold uppercase font-mythos tracking-wider text-sm select-none">Core Configuration Dashboard</span>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {/* OPTIONS BODY */}
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              
              {/* AI MODEL SELECTION */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-mono tracking-wider flex items-center gap-1">
                  <Cpu size={12} className="text-indigo-400" />
                  Primary Gemini Model Pipeline
                </label>
                <select 
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-gray-900 outline-none border border-gray-850 rounded-lg p-2 text-xs text-gray-200"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default - Near-instant, Intelligent)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Paid Tier - High Reasoning, Advanced Coding)</option>
                </select>
                <div className="text-[10px] text-gray-500 leading-3">
                  * Note: Pro model accesses deep STEM and advanced exploit-analysis. Flash resolves questions in milliseconds. Ensure credentials are valid.
                </div>
              </div>

              {/* RESPONSE LENGTH CONFIG */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono tracking-wider">Response Exhaustiveness</label>
                  <select 
                    value={responseLength}
                    onChange={(e: any) => setResponseLength(e.target.value)}
                    className="w-full bg-gray-900 outline-none border border-gray-850 rounded-lg p-2 text-xs text-gray-200 font-mono"
                  >
                    <option value="concise">Concise (Fast, Brief)</option>
                    <option value="detailed">Detailed (Standard)</option>
                    <option value="exhaustive">Exhaustive (Deep Lore/Audit)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono tracking-wider">Prose Style Filter</label>
                  <select 
                    value={responseStyle}
                    onChange={(e: any) => setResponseStyle(e.target.value)}
                    className="w-full bg-gray-900 outline-none border border-gray-850 rounded-lg p-2 text-xs text-gray-200"
                  >
                    <option value="Balanced">Balanced Mix</option>
                    <option value="Technical">Strictly Technical / Hard Code</option>
                    <option value="Narrative">Highly Stylized Storyteller</option>
                  </select>
                </div>
              </div>

              {/* FONT RESIZING AND TERMINAL STYLE */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-900 pb-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono tracking-wider">Display Font Size</label>
                  <select 
                    value={fontSize}
                    onChange={(e: any) => setFontSize(e.target.value)}
                    className="w-full bg-gray-900 outline-none border border-gray-850 rounded-lg p-2 text-xs text-gray-200"
                  >
                    <option value="small">Small size (compact)</option>
                    <option value="medium">Medium spacing (balanced)</option>
                    <option value="large">Large lettering (high visibility)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-gray-400 font-mono tracking-wider">Code Block Palette</label>
                  <select 
                    value={codeTheme}
                    onChange={(e: any) => setCodeTheme(e.target.value)}
                    className="w-full bg-gray-900 outline-none border border-gray-850 rounded-lg p-2 text-xs text-gray-200 font-mono"
                  >
                    <option value="dracula">Dracula Dark</option>
                    <option value="monokai">Monokai Contrast</option>
                    <option value="github_dark">GitHub Dark Slate</option>
                  </select>
                </div>
              </div>

              {/* TOGGLES PANEL */}
              <div className="space-y-2 select-none pt-1">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-300 font-medium">Terminal Monospace Font for Platform</span>
                  <input 
                    type="checkbox" 
                    checked={isTerminalFont}
                    onChange={(e) => setIsTerminalFont(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-300 font-medium">Render Shadow Mode Warning Banners</span>
                  <input 
                    type="checkbox" 
                    checked={showSecurityDisclaimers}
                    onChange={(e) => setShowSecurityDisclaimers(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-gray-300 font-medium">Interface Theme Override (Light)</span>
                  <input 
                    type="checkbox" 
                    checked={isLightMode}
                    onChange={(e) => setIsLightMode(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* CLEAR ALL DATA (DANGER ACTION) */}
              <div className="pt-4 border-t border-gray-900 flex justify-between gap-3 select-none">
                <button 
                  type="button"
                  onClick={handleClearAllHistory}
                  className="py-2 px-3 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-950/20 active:bg-red-950/40 text-xs font-semibold select-none flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Clear All History Records
                </button>
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="py-2 px-4 rounded-lg bg-gray-900 hover:bg-gray-850 text-white text-xs font-bold"
                >
                  Apply & Exit
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* REVERSIBLE COMPLIANCE/ETHICS POPUP MODAL */}
      {showEthicsModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 min-h-screen select-none animate-fadeIn font-mono">
          <div className="bg-gray-950 border border-emerald-500/20 w-full max-w-xl rounded-2xl shadow-emerald-500/10 shadow-2xl p-6 relative flex flex-col gap-5">
            
            {/* ALERT EMBLEM */}
            <div className="flex items-center gap-3 text-emerald-400 pb-3 border-b border-emerald-500/10">
              <ShieldAlert size={28} className="animate-pulse shrink-0" />
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-widest leading-none">SECURITY COVENANT VERIFICATION</h2>
                <span className="text-[10px] text-gray-500 tracking-wider">SHADOW PROTOCOL PENETRATION INTEGRITY RATING [SE-01]</span>
              </div>
            </div>

            {/* ETHICS CONTENT IN WORDS */}
            <div className="space-y-3.5 text-xs text-gray-300 leading-relaxed font-mono select-text">
              <p>
                You are entering <strong>SHADOW INTELLIGENCE MODE</strong>. This stage grants deep expertise in penetration testing, vulnerability assessment, exploit methodologies, reverse engineering, and OSINT analysis.
              </p>
              
              <div className="p-3 bg-[#08110b] border border-emerald-500/10 rounded-lg text-[11px] text-emerald-300 space-y-2">
                <p className="font-bold uppercase tracking-wider select-none text-emerald-400">🚨 ETHICAL COMPLIANCE DECREE:</p>
                <p>
                  "I hereby confirm that I will access, test, and audit only systems that I legally own, or for which I hold explicit, written, current authorization on an active engagement stage (Bug Bounty, PenTest, or CTF Challenge)."
                </p>
              </div>

              <p className="text-gray-400">
                Any use of these details for unauthorized intrusion, malware deployment, or digital disruption violates professional ethics and digital intrusion laws.
              </p>
            </div>

            {/* LEGAL ACCEPTANCE SELECTION */}
            <div className="space-y-3 select-none">
              <label className="flex items-start gap-3 cursor-pointer p-2.5 rounded-lg border border-gray-900 bg-[#070c09] hover:border-emerald-500/10 hover:bg-emerald-950/5">
                <input 
                  type="checkbox" 
                  checked={ethicsChecked}
                  onChange={(e) => setEthicsChecked(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 shrink-0 mt-0.5"
                />
                <span className="text-[11px] text-gray-300 tracking-wide select-none leading-relaxed">
                  I solemnise this ethical covenant and assume full legal and professional responsibility for any activities compiled.
                </span>
              </label>

              {/* ACTION COMPONENT PANEL */}
              <div className="flex justify-between items-center pt-2 select-none">
                <button 
                  type="button"
                  onClick={() => setShowEthicsModal(false)}
                  className="px-4 py-2 border border-gray-800 text-gray-400 hover:text-white rounded-lg text-xs hover:bg-white/5 font-semibold"
                >
                  DEPART STAGE
                </button>
                <button 
                  type="button"
                  disabled={!ethicsChecked}
                  onClick={acceptEthicalCovenant}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${ethicsChecked ? 'bg-emerald-600 text-black hover:bg-emerald-500 active:bg-emerald-700' : 'bg-gray-900 text-gray-600 border border-gray-850 cursor-not-allowed'}`}
                >
                  ENTER COGNITIVE ARCHIVE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
