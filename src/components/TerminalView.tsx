import React, { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  id: string;
  type: 'input' | 'output';
  content: string;
}

export const TerminalView = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'output', content: 'Welcome to Shadow Linux Terminal (v2.0.12)' },
    { id: '2', type: 'output', content: 'Type "help" for a list of available commands.' },
    { id: '3', type: 'output', content: 'root@shadow-node:~#' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const newLine: TerminalLine = { id: Date.now().toString(), type: 'input', content: `root@shadow-node:~# ${trimmed}` };
    
    let output = '';
    if (trimmed === 'help') {
      output = 'Available commands: ls, pwd, whoami, clear, echo, ping <target>';
    } else if (trimmed === 'ls') {
      output = 'bin  boot  dev  etc  home  lib  opt  root  run  sbin  tmp  usr  var';
    } else if (trimmed === 'whoami') {
      output = 'root';
    } else if (trimmed === 'clear') {
      setLines([]);
      return;
    } else if (trimmed.startsWith('ping')) {
      output = `PING ${trimmed.split(' ')[1] || '127.0.0.1'}: 64 bytes of data from 127.0.0.1: icmp_seq=0 ttl=64 time=0.045 ms`;
    } else if (trimmed === '') {
        output = '';
    } else {
      output = `bash: ${trimmed.split(' ')[0]}: command not found`;
    }

    const outputLine: TerminalLine = { id: (Date.now() + 1).toString(), type: 'output', content: output };
    setLines(prev => [...prev, newLine, outputLine]);
  };

  return (
    <div className="flex-1 bg-[#010A01] text-[#00FF41] p-4 font-mono text-sm overflow-y-auto">
      {lines.map(line => (
        <div key={line.id} className="mb-1 whitespace-pre-wrap">
          {line.content}
        </div>
      ))}
      <div className="flex">
        <span>root@shadow-node:~# </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCommand(input);
              setInput('');
            }
          }}
          className="flex-1 bg-transparent border-none outline-none text-[#00FF41] ml-2"
          autoFocus
        />
      </div>
      <div ref={endRef} />
    </div>
  );
};
