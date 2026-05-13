import { useState } from 'react';
import { PRESET_DATA } from './data';
import { AttentionVisualizer } from './components/AttentionVisualizer';
import { LessonModal } from './components/LessonModal';
import { Terminal, FileText, Github } from 'lucide-react';

function App() {
  const [activeSentenceId, setActiveSentenceId] = useState(PRESET_DATA[0].sentenceId);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const activeData = PRESET_DATA.find(d => d.sentenceId === activeSentenceId) || PRESET_DATA[0];

  return (
    <div className="min-h-screen bg-zinc-100 text-black flex flex-col font-sans selection:bg-neon selection:text-black">
      {/* Header - Brutalist Style */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-neon border-2 border-black brutalist-shadow-sm">
              <Terminal className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-black">
                Attention X-Ray
              </h1>
              <p className="text-sm font-mono font-bold text-zinc-600 uppercase tracking-wider mt-1">
                熊布朗 AI 实战营 Demo 02
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-200 border-2 border-black p-1 shadow-[2px_2px_0_0_#000]">
              {PRESET_DATA.map((data) => (
                <button
                  key={data.sentenceId}
                  onClick={() => setActiveSentenceId(data.sentenceId)}
                  className={`
                    px-4 py-2 text-sm font-black uppercase tracking-widest transition-all duration-200
                    ${activeSentenceId === data.sentenceId 
                      ? 'bg-black text-neon shadow-inner' 
                      : 'text-zinc-500 hover:text-black hover:bg-zinc-300'
                    }
                  `}
                >
                  <span className="hidden sm:inline">DATASET {PRESET_DATA.indexOf(data) + 1}</span>
                  <span className="sm:hidden">D{PRESET_DATA.indexOf(data) + 1}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsLessonModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-neon border-2 border-black font-black uppercase tracking-widest brutalist-shadow-hover transition-all hover:-translate-y-1 hover:-translate-x-1 active:translate-x-0 active:translate-y-0 active:shadow-none"
            >
              <FileText className="w-5 h-5" />
              查看配套教案
            </button>

            <a
              href="https://github.com/JumpX-Labs/ai-bootcamp-demo02-attention-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black font-black uppercase tracking-widest brutalist-shadow-hover transition-all hover:-translate-y-1 hover:-translate-x-1 active:translate-x-0 active:translate-y-0 active:shadow-none"
              title="View source on GitHub"
            >
              <Github className="w-5 h-5" />
              Source
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full p-6 flex flex-col mt-4">
        <div className="mb-6 flex justify-between items-end border-l-8 border-neon pl-4">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-widest text-black mb-2">
              Transformer Engine
            </h2>
            <p className="text-zinc-600 font-medium font-mono max-w-2xl text-sm leading-relaxed">
              {"//"} 交互指南：悬停在左侧 Token 网格中的任意节点，透视底层多头注意力机制（Multi-Head Attention）是如何跨越空间距离，分配全局权重的。
            </p>
          </div>
          
          {/* Mobile lesson button */}
          <button 
            onClick={() => setIsLessonModalOpen(true)}
            className="md:hidden flex items-center gap-2 px-3 py-2 bg-neon border-2 border-black font-black text-xs uppercase brutalist-shadow-sm"
          >
            <FileText className="w-4 h-4" />
            教案
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <AttentionVisualizer data={activeData} />
        </div>

        {/* Quote Footer - Editorial Style */}
        <div className="mt-16 mb-8 mx-auto max-w-4xl w-full">
          <div className="relative p-10 bg-white border-4 border-black brutalist-shadow group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 left-0 w-2 h-full bg-neon"></div>
            
            <div className="absolute top-0 right-0 bg-black text-neon px-3 py-1 text-xs font-mono font-bold uppercase tracking-widest">
              Core Principles
            </div>

            <div className="text-black leading-loose text-lg font-bold font-sans">
              <p className="mb-2">神经网络，让 AI <span className="bg-neon px-1">学会打分</span>。</p>
              <p className="mb-2">深度学习，让 AI <span className="bg-neon px-1">学会分层抽象</span>。</p>
              <p className="mb-4">Transformer，让 AI <span className="bg-neon px-1">学会理解关系</span>。</p>
              <p className="text-2xl font-black uppercase tracking-widest mt-6 pt-6 border-t-2 border-black border-dashed">
                这些能力叠加到语言上，就变成了 GPT。
              </p>
            </div>
          </div>
        </div>
      </main>

      <LessonModal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} />
    </div>
  );
}

export default App;
