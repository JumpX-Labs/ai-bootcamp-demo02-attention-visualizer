import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AttentionData } from '../data';
import { TerminalSquare } from 'lucide-react';

interface AttentionVisualizerProps {
  data: AttentionData;
}

interface TokenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const AttentionVisualizer: React.FC<AttentionVisualizerProps> = ({ data }) => {
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);
  const [activeHeadIndex, setActiveHeadIndex] = useState(0);
  const [tokenRects, setTokenRects] = useState<TokenRect[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenElsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Blinking cursor state for the terminal idle view
  const [cursorBlink, setCursorBlink] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setCursorBlink(b => !b), 500);
    return () => clearInterval(interval);
  }, []);

  // Reset head when sentence changes
  useLayoutEffect(() => {
    setActiveHeadIndex(0);
    setHoveredTokenIndex(null);
  }, [data.sentenceId]);

  const measureTokens = useCallback(() => {
    if (!containerRef.current) return;
    const cRect = containerRef.current.getBoundingClientRect();
    const rects: TokenRect[] = data.tokens.map((_, i) => {
      const el = tokenElsRef.current[i];
      if (!el) return { x: 0, y: 0, width: 0, height: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left - cRect.left + r.width / 2,
        y: r.top - cRect.top + r.height / 2,
        width: r.width,
        height: r.height,
      };
    });
    setTokenRects(rects);
  }, [data]);

  useLayoutEffect(() => {
    requestAnimationFrame(measureTokens);
    window.addEventListener('resize', measureTokens);
    return () => window.removeEventListener('resize', measureTokens);
  }, [measureTokens]);

  const currentHead = data.heads[activeHeadIndex] || data.heads[0];
  const activeWeights = hoveredTokenIndex !== null ? currentHead.matrix[hoveredTokenIndex] : null;

  const sortedWeights = activeWeights
    ? data.tokens
        .map((t, i) => ({ token: t, weight: activeWeights[i], index: i }))
        .filter((item) => item.index !== hoveredTokenIndex && item.weight > 0.02)
        .sort((a, b) => b.weight - a.weight)
    : [];

  const lines: { key: string; d: string; weight: number }[] = [];
  if (hoveredTokenIndex !== null && activeWeights && tokenRects.length === data.tokens.length) {
    const src = tokenRects[hoveredTokenIndex];
    data.tokens.forEach((_, ti) => {
      if (ti === hoveredTokenIndex) return;
      const w = activeWeights[ti];
      if (w < 0.05) return;
      const tgt = tokenRects[ti];
      if (!src || !tgt) return;
      const dist = Math.sqrt((tgt.x - src.x) ** 2 + (tgt.y - src.y) ** 2);
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y + tgt.y) / 2 - dist * 0.25;
      lines.push({
        key: `${hoveredTokenIndex}-${ti}`,
        d: `M ${src.x} ${src.y} Q ${mx} ${my} ${tgt.x} ${tgt.y}`,
        weight: w,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Brutalist Head Selector */}
      <div className="flex flex-wrap items-center gap-3">
        {data.heads.map((head, i) => (
          <button
            key={head.id}
            onClick={() => setActiveHeadIndex(i)}
            className={`
              px-5 py-2 text-sm font-black uppercase tracking-widest border-2 border-black transition-all
              ${activeHeadIndex === i
                ? 'bg-black text-neon brutalist-shadow-sm translate-x-[-2px] translate-y-[-2px]'
                : 'bg-white text-black hover:bg-zinc-200'
              }
            `}
          >
            {head.name}
          </button>
        ))}
        <div className="ml-auto text-xs font-mono font-bold uppercase tracking-wider text-black bg-zinc-200 px-3 py-1 border-2 border-black hidden lg:block max-w-lg truncate">
          {currentHead.description}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full lg:h-[600px] gap-6">
        
        {/* Canvas Area - Light/Geek Style */}
        <div
          className="relative flex-1 flex items-center justify-center min-h-[480px] lg:min-h-0 h-full border-4 border-black bg-white brutalist-shadow overflow-hidden"
          ref={containerRef}
        >
          {/* Blueprint Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
            <AnimatePresence>
              {lines.map((l) => (
                <motion.path
                  key={l.key}
                  d={l.d}
                  fill="none"
                  stroke="#000" // Solid black for brutalist look
                  strokeWidth={Math.max(2, l.weight * 12)}
                  strokeLinecap="square"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: l.weight * 0.9 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              ))}
            </AnimatePresence>
          </svg>

          {/* Token Grid */}
          <div className="relative flex flex-wrap justify-center gap-4 p-8 max-w-4xl mx-auto" style={{ zIndex: 10 }}>
            {data.tokens.map((token, index) => {
              const isHovered = hoveredTokenIndex === index;
              const weight = activeWeights ? activeWeights[index] : 0;
              const isTarget = hoveredTokenIndex !== null && !isHovered && weight > 0.05;

              let boxShadow = '2px 2px 0px 0px rgba(0,0,0,1)';
              let bg = '#ffffff';
              let textColor = '#000000';
              let borderColor = '#000000';
              let translate = 'translate(0px, 0px)';

              if (isHovered) {
                // Fluorescent focus state
                boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
                bg = '#ccff00';
                textColor = '#000';
                translate = 'translate(-4px, -4px)';
              } else if (isTarget) {
                // Target highlight state
                const intensity = Math.min(weight, 1);
                bg = `rgba(0, 0, 0, ${0.05 + intensity * 0.15})`;
                boxShadow = `${2 + intensity * 4}px ${2 + intensity * 4}px 0px 0px rgba(0,0,0,1)`;
                translate = `translate(-${intensity * 4}px, -${intensity * 4}px)`;
              }

              return (
                <div
                  key={token.id}
                  ref={(el) => { tokenElsRef.current[index] = el; }}
                  onMouseEnter={() => setHoveredTokenIndex(index)}
                  onMouseLeave={() => setHoveredTokenIndex(null)}
                  className="cursor-crosshair select-none border-2 px-5 py-3 transition-all duration-200 font-sans"
                  style={{
                    boxShadow,
                    background: bg,
                    color: textColor,
                    borderColor,
                    transform: translate,
                  }}
                >
                  <div className="text-2xl font-black uppercase tracking-wider text-center">{token.text}</div>
                  {token.role && (
                    <div
                      className="text-xs mt-1.5 text-center font-bold font-mono uppercase tracking-widest"
                      style={{ color: isHovered ? '#000' : '#666', transition: 'color 0.2s' }}
                    >
                      {token.role}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payload View (Terminal Panel) */}
        <div className="w-full lg:w-[380px] flex flex-col h-[500px] lg:h-full bg-black border-4 border-black brutalist-shadow relative overflow-hidden text-neon font-mono">
          
          <div className="flex items-center gap-2 border-b-2 border-zinc-800 p-4 bg-zinc-900">
            <TerminalSquare className="w-5 h-5 text-neon" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">
              Payload View
            </h3>
            <span className="ml-auto text-xs bg-neon text-black px-2 py-1 font-bold">
              {currentHead.id}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto terminal-scrollbar p-5 relative z-10">
            <AnimatePresence mode="popLayout">
              {hoveredTokenIndex !== null ? (
                <div key="panel-active" className="space-y-6">
                  
                  <div className="border border-neon/50 p-4 bg-neon/10">
                    <div className="text-xs text-neon/70 uppercase tracking-widest mb-2">{"//"} Active Query Token</div>
                    <div className="text-xl font-black text-white">
                      {data.tokens[hoveredTokenIndex].text}
                      {data.tokens[hoveredTokenIndex].role && (
                        <span className="text-sm font-normal text-zinc-400 ml-3">
                          [{data.tokens[hoveredTokenIndex].role}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-xs text-neon/70 uppercase tracking-widest border-b border-neon/30 pb-2 mb-4">
                      Attention Distribution (Key, Value)
                    </div>
                    {sortedWeights.map(({ token, weight }) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        key={token.id}
                        className="flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-end">
                          <span className="font-bold text-white text-sm">
                            {token.text} <span className="text-xs text-zinc-500 font-normal">[{token.role}]</span>
                          </span>
                          <span className="text-sm font-bold text-neon">
                            {(weight * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-800 border border-zinc-700">
                          <motion.div
                            className="h-full bg-neon shadow-[0_0_8px_#ccff00]"
                            initial={{ width: 0 }}
                            animate={{ width: `${weight * 100}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div
                  key="panel-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-start justify-start text-zinc-500 mt-4 space-y-2"
                >
                  <p className="text-neon/80 text-sm">{"//"} SYSTEM STANDBY</p>
                  <p className="text-xs">AWAITING HOVER EVENT ON TARGET GRID...</p>
                  <p className="text-xs text-white flex items-center mt-4">
                    {">"} {cursorBlink ? '█' : '\u00A0'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
