import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const LessonModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-zinc-100 border-4 border-black brutalist-shadow max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b-4 border-black bg-neon p-4">
              <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                <span className="bg-black text-neon px-2 py-1 text-sm font-mono">DOCS</span>
                配套教案：Transformer 核心原理解析
              </h2>
              <button 
                onClick={onClose}
                className="p-1 hover:bg-black hover:text-neon transition-colors border-2 border-transparent hover:border-black"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto terminal-scrollbar bg-zinc-50 text-black space-y-8 font-sans">
              
              <section className="border-l-4 border-black pl-6 space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-widest">1. 自注意力机制 (Self-Attention)</h3>
                <p className="text-lg leading-relaxed font-medium text-zinc-800">
                  在传统的神经网络中，机器阅读句子是“逐字逐句”扫描的，一旦句子变长，它就会像鱼的记忆一样忘记开头。
                </p>
                <div className="bg-black text-zinc-300 p-6 border-2 border-black font-mono text-sm shadow-[4px_4px_0_0_#ccff00]">
                  <span className="text-neon block mb-2">{">"} X-Ray 验证: 空间距离被打破</span>
                  当你在此 Demo 中将鼠标悬停在某个 Token 上时，你会看到它直接向全句的所有其他词发射连线。这证明了 Self-Attention 机制让 AI 具备了全局视野：任何一个词在处理时，都能<strong className="text-neon bg-black">“无视物理距离”</strong>，直接与其他词进行加权计算，得出自己在当前语境下的真实含义。
                </div>
              </section>

              <section className="border-l-4 border-black pl-6 space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-widest">2. 为什么要“多头”？(Multi-Head)</h3>
                <p className="text-lg leading-relaxed font-medium text-zinc-800">
                  人类在理解一段话时，大脑会同时进行多线程工作：一部分脑区在判断“谁对谁做了什么”（语法），另一部分在判断“它指的是哪个东西”（实体指代）。AI 也需要这种能力。
                </p>
                <div className="bg-black text-zinc-300 p-6 border-2 border-black font-mono text-sm shadow-[4px_4px_0_0_#ccff00]">
                  <span className="text-neon block mb-2">{">"} X-Ray 验证: 分工明确的注意力矩阵</span>
                  在 Demo 的左上方切换不同的<strong className="text-neon">【注意力头】</strong>，你会发现同一句话，连线网络完全重构了。这代表 Transformer 内部包含多组独立的 Attention 矩阵，它们就像一组“专家委员会”：
                  <ul className="mt-4 space-y-2 list-disc list-inside text-zinc-400">
                    <li><span className="text-white">Head 1 (语法头)：</span>专门抓取动宾搭配等局部关系。</li>
                    <li><span className="text-white">Head 2 (指代头)：</span>专注于跨越长距离解决代词“它”到底指谁的问题。</li>
                    <li><span className="text-white">Head 3 (因果头)：</span>负责理解动作产生的逻辑链条。</li>
                  </ul>
                </div>
              </section>

              <div className="bg-neon border-4 border-black p-6 text-center brutalist-shadow-sm mt-8">
                <p className="text-black font-black text-xl uppercase tracking-widest">
                  "Attention Is All You Need."
                </p>
                <p className="font-mono text-sm mt-2 font-bold text-black/70">-- Ashish Vaswani et al., 2017</p>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
