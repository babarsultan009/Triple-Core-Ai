
// Security tools registry with simulated command translation logic
export const SECURITY_TOOLS = [
  { name: "Nmap", keywords: ["scan", "port", "nmap", "network"], command: "nmap -sV -p- <target>", description: "Network scanner" },
  { name: "SQLMap", keywords: ["sql", "injection", "database"], command: "sqlmap -u <target> --batch", description: "Automated SQL injection" },
  { name: "Metasploit", keywords: ["exploit", "msf", "metasploit"], command: "msfconsole -q -x 'use exploit/multi/handler; set LHOST <ip>; exploit'", description: "Exploitation framework" },
  { name: "BurpSuite", keywords: ["burp", "proxy", "web"], command: "burpsuite_cli --target <target>", description: "Web proxy scanner" },
  { name: "Hydra", keywords: ["brute", "password", "login"], command: "hydra -l user.txt -P pass.txt <target> http-get", description: "Login cracker" },
  { name: "OWASP MASTG", keywords: ["mobile", "android", "ios"], command: "mastg-cli scan <target>", description: "Mobile security guide" },
  { name: "SecLists", keywords: ["list", "wordlist", "payload"], command: "seclists-cli search <pattern>", description: "Collection of wordlists" },
  { name: "PayloadsAllTheThings", keywords: ["payloads", "xss", "sqli"], command: "payloads-cli get <type>", description: "Payload collection" },
  { name: "ReconFTW", keywords: ["recon", "enum"], command: "reconftw -d <target>", description: "Automated reconnaissance" },
  { name: "TorBot", keywords: ["darkweb", "tor"], command: "torbot --url <target>", description: "Dark Web OSINT Tool" },
];

export const translateAndExecute = (prompt: string): { toolName: string; actualCommand: string; mockOutput: string } | null => {
  const lowerPrompt = prompt.toLowerCase();
  const tool = SECURITY_TOOLS.find(t => t.keywords.some(k => lowerPrompt.includes(k)));

  if (!tool) return null;

  // Simple mock transformation
  const target = lowerPrompt.match(/(?:at|to) (\S+)/)?.[1] || "example.com";
  const actualCommand = tool.command.replace("<target>", target);

  return {
    toolName: tool.name,
    actualCommand,
    mockOutput: `[Simulated Output for ${tool.name}] Starting ${tool.name} on ${target}...\nSuccessfully performed ${tool.description} task.\nResults: No critical findings.`
  };
};
