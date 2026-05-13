export interface Token {
  id: string;
  text: string;
  role?: string;
}

export interface AttentionHead {
  id: string;
  name: string;
  description: string;
  matrix: number[][];
}

export interface AttentionData {
  sentenceId: string;
  sentenceDesc: string;
  tokens: Token[];
  heads: AttentionHead[];
}

/**
 * Build a matrix from sparse rules.
 * Self-attention (diagonal) is always 1.0 by default.
 */
function buildMatrix(
  len: number,
  rules: [number, number, number][] // [source, target, weight]
): number[][] {
  const m: number[][] = Array.from({ length: len }, (_, i) =>
    Array.from({ length: len }, (_, j): number => (i === j ? 1.0 : 0.03))
  );
  for (const [s, t, w] of rules) {
    m[s][t] = w;
  }
  return m;
}

/** Element-wise max across multiple matrices → "combined view" */
function combineMax(matrices: number[][][]): number[][] {
  const len = matrices[0].length;
  return Array.from({ length: len }, (_, i) =>
    Array.from({ length: len }, (_, j) =>
      Math.max(...matrices.map((m) => m[i][j]))
    )
  );
}

// ─────────────────────────────────────────────────
// Sentence 1: 用毒毒毒蛇，毒蛇会不会被毒毒死？
// ─────────────────────────────────────────────────
// Tokens:
//  0:用  1:毒(毒药)  2:毒(下毒)  3:毒蛇(宾语)  4:，
//  5:毒蛇(主语)  6:会  7:不  8:会  9:被
// 10:毒(自身毒液) 11:毒(毒害) 12:死  13:？
//
// 句意分析:
// "用 毒药 去毒 毒蛇，毒蛇 会不会 被 自身的毒 毒死？"
// - "用"(介词) 引出工具 → "毒"(名词/毒药)
// - "毒"(动词/下毒) 作用于 → "毒蛇"(宾语)
// - "毒蛇"(主语) = 同一条蛇，被动句中 "被" 引出施事者
// - "毒"(自身毒液) 是施事名词 → "毒"(动词/毒害) → "死"(结果补语)

const s1SyntaxRules: [number, number, number][] = [
  // "用" 介词管辖 "毒(毒药)"
  [0, 1, 0.90], [1, 0, 0.70],
  // "毒(动词)" 动宾关系 → "毒蛇(宾语)"
  [2, 3, 0.90], [3, 2, 0.75],
  // "用...毒" 介宾结构修饰 "毒(动词)"
  [2, 0, 0.60], [2, 1, 0.80],
  // "会不会" 语法固定搭配
  [6, 7, 0.85], [7, 6, 0.85], [7, 8, 0.85], [8, 7, 0.85], [6, 8, 0.70],
  // "被" 引出被动施事 → "毒(自身毒液)" → "毒(毒害)"
  [9, 10, 0.80], [9, 11, 0.85],
  // "毒(毒害)" 动补结构 → "死"
  [11, 12, 0.90], [12, 11, 0.80],
  // "毒蛇(主语)" 作为主语与谓语 "会" 的关系
  [5, 6, 0.70], [6, 5, 0.65],
  // "被" 的受事主语
  [9, 5, 0.70],
];

const s1CorefRules: [number, number, number][] = [
  // 两个 "毒蛇" 互相强关联（同一实体）
  [3, 5, 0.95], [5, 3, 0.95],
  // 三个名词性 "毒" 之间的实体关联
  // "毒药"(t1) vs "自身毒液"(t10) — 不同的毒，中等关联
  [1, 10, 0.60], [10, 1, 0.60],
  // "毒蛇" 与 "自身毒液" — 蛇拥有毒液
  [5, 10, 0.80], [3, 10, 0.65],
  [10, 5, 0.80], [10, 3, 0.65],
];

const s1CausalRules: [number, number, number][] = [
  // 因果链: 用毒药(工具) → 下毒(动作) → 毒蛇(受害者)
  [2, 1, 0.85], [2, 3, 0.80],
  // 结果链: 被 → 毒液(施事) → 毒害(动作) → 死(结果)
  [11, 10, 0.90], [11, 5, 0.85], [12, 11, 0.90], [12, 5, 0.80],
  // 前后两个动词 "毒" 之间的因果对比
  [2, 11, 0.70], [11, 2, 0.70],
  // "死" 关注整个因果链
  [12, 10, 0.75], [12, 9, 0.60],
];

const s1Syntax = buildMatrix(14, s1SyntaxRules);
const s1Coref = buildMatrix(14, s1CorefRules);
const s1Causal = buildMatrix(14, s1CausalRules);
const s1Combined = combineMax([s1Syntax, s1Coref, s1Causal]);

// ─────────────────────────────────────────────────
// Sentence 2: 今天我去面包店，买了一个面包，它真的很好吃。
// ─────────────────────────────────────────────────
// Tokens:
//  0:今天  1:我  2:去  3:面包店  4:，
//  5:买  6:了  7:一个  8:面包  9:，
// 10:它  11:真的  12:很  13:好吃  14:。
//
// 关键语义:
// - "它" 指代 "面包"（代词消解的经典案例）
// - "面包店" 与 "面包" 有上下位关系
// - "我" 是动作 "去"、"买" 的施事者

const s2SyntaxRules: [number, number, number][] = [
  // "我" 是 "去" 和 "买" 的主语
  [2, 1, 0.80], [5, 1, 0.75],
  // "去" → "面包店" 动宾
  [2, 3, 0.90], [3, 2, 0.70],
  // "买" → "面包" 动宾; "买了" 动补
  [5, 8, 0.90], [5, 6, 0.60], [8, 5, 0.65],
  // "一个" 量词修饰 "面包"
  [7, 8, 0.90], [8, 7, 0.75],
  // "它" → "好吃" 主谓
  [13, 10, 0.85], [10, 13, 0.70],
  // "真的很" 修饰 "好吃"
  [13, 12, 0.80], [13, 11, 0.65], [12, 13, 0.75], [11, 13, 0.70],
  // "今天" 时间状语修饰 "去"
  [0, 2, 0.60], [2, 0, 0.55],
];

const s2CorefRules: [number, number, number][] = [
  // ★ 核心: "它"(t10) 指代 "面包"(t8) — 最强
  [10, 8, 0.95], [8, 10, 0.85],
  // "面包店" 与 "面包" 上下位实体关联
  [3, 8, 0.65], [8, 3, 0.60],
  // "面包店" 与 "它" 弱关联（它不指代面包店，但有间接关系）
  [10, 3, 0.30], [3, 10, 0.25],
];

const s2Syntax = buildMatrix(15, s2SyntaxRules);
const s2Coref = buildMatrix(15, s2CorefRules);
const s2Combined = combineMax([s2Syntax, s2Coref]);

// ─────────────────────────────────────────────────
// Sentence 3: 把鼠标放到鼠标垫上。
// ─────────────────────────────────────────────────
// Tokens:
//  0:把  1:鼠标(设备)  2:放  3:到  4:鼠标垫(表面)  5:上  6:。
//
// 关键语义:
// - "把" 结构: 把 + 受事(鼠标) + 动词(放) + 处所(鼠标垫上)
// - "鼠标" 与 "鼠标垫" 有关联但是不同实体

const s3SyntaxRules: [number, number, number][] = [
  // 把字句结构: "把" 引出受事 "鼠标"
  [0, 1, 0.90], [1, 0, 0.70],
  // "把鼠标" 整体作为 "放" 的论元
  [2, 1, 0.85], [2, 0, 0.60],
  // "放" → "到" 动补
  [2, 3, 0.85], [3, 2, 0.80],
  // "到" → "鼠标垫上" 处所
  [3, 4, 0.90], [3, 5, 0.70],
  // "鼠标垫" + "上" 方位结构
  [4, 5, 0.90], [5, 4, 0.90],
  // "放" 也关注目的地
  [2, 4, 0.75], [2, 5, 0.55],
];

const s3CorefRules: [number, number, number][] = [
  // "鼠标"(设备) 与 "鼠标垫"(表面) — 不同实体但词汇有交集
  [1, 4, 0.70], [4, 1, 0.70],
];

const s3Syntax = buildMatrix(7, s3SyntaxRules);
const s3Coref = buildMatrix(7, s3CorefRules);
const s3Combined = combineMax([s3Syntax, s3Coref]);


export const PRESET_DATA: AttentionData[] = [
  {
    sentenceId: "poison-snake",
    sentenceDesc: "用毒毒毒蛇，毒蛇会不会被毒毒死？",
    tokens: [
      { id: "t0", text: "用", role: "介词" },
      { id: "t1", text: "毒", role: "名词(毒药)" },
      { id: "t2", text: "毒", role: "动词(下毒)" },
      { id: "t3", text: "毒蛇", role: "名词(宾语)" },
      { id: "t4", text: "，", role: "标点" },
      { id: "t5", text: "毒蛇", role: "名词(主语)" },
      { id: "t6", text: "会", role: "助动词" },
      { id: "t7", text: "不", role: "副词" },
      { id: "t8", text: "会", role: "助动词" },
      { id: "t9", text: "被", role: "介词(被动)" },
      { id: "t10", text: "毒", role: "名词(毒液)" },
      { id: "t11", text: "毒", role: "动词(毒害)" },
      { id: "t12", text: "死", role: "补语(结果)" },
      { id: "t13", text: "？", role: "标点" },
    ],
    heads: [
      {
        id: "s1-combined",
        name: "📊 综合视图",
        description: "所有注意力头的叠加：展示每个词在所有维度中的最大关联度。",
        matrix: s1Combined,
      },
      {
        id: "s1-syntax",
        name: "🔗 语法结构头",
        description: "关注局部语法依赖：介宾关系（用→毒药）、动宾关系（毒→毒蛇）、动补关系（毒→死）。",
        matrix: s1Syntax,
      },
      {
        id: "s1-coref",
        name: "🔍 实体指代头",
        description: "跨距离识别同一实体：两个'毒蛇'强关联，不同种类的'毒'之间中等关联。",
        matrix: s1Coref,
      },
      {
        id: "s1-causal",
        name: "⚡ 因果推理头",
        description: "追踪动作因果链：毒药(工具)→下毒(动作)→毒蛇(受害者)；毒液(施事)→毒害→死(结果)。",
        matrix: s1Causal,
      },
    ],
  },
  {
    sentenceId: "bread-pronoun",
    sentenceDesc: "今天我去面包店，买了一个面包，它真的很好吃。",
    tokens: [
      { id: "t0", text: "今天", role: "时间名词" },
      { id: "t1", text: "我", role: "代词(施事者)" },
      { id: "t2", text: "去", role: "动词" },
      { id: "t3", text: "面包店", role: "名词(处所)" },
      { id: "t4", text: "，", role: "标点" },
      { id: "t5", text: "买", role: "动词" },
      { id: "t6", text: "了", role: "助词(完成)" },
      { id: "t7", text: "一个", role: "数量词" },
      { id: "t8", text: "面包", role: "名词(受事)" },
      { id: "t9", text: "，", role: "标点" },
      { id: "t10", text: "它", role: "代词(→面包)" },
      { id: "t11", text: "真的", role: "副词" },
      { id: "t12", text: "很", role: "副词" },
      { id: "t13", text: "好吃", role: "形容词" },
      { id: "t14", text: "。", role: "标点" },
    ],
    heads: [
      {
        id: "s2-combined",
        name: "📊 综合视图",
        description: "所有注意力头叠加后的最大关联度。",
        matrix: s2Combined,
      },
      {
        id: "s2-syntax",
        name: "🔗 语法结构头",
        description: "动宾关系（去→面包店、买→面包）和修饰关系（真的很→好吃）。",
        matrix: s2Syntax,
      },
      {
        id: "s2-coref",
        name: "🔍 代词消解头",
        description: "将'它'强关联到'面包'（0.95）——这是代词消解的经典案例。",
        matrix: s2Coref,
      },
    ],
  },
  {
    sentenceId: "mouse-pad",
    sentenceDesc: "把鼠标放到鼠标垫上。",
    tokens: [
      { id: "t0", text: "把", role: "介词(把字句)" },
      { id: "t1", text: "鼠标", role: "名词(设备)" },
      { id: "t2", text: "放", role: "动词" },
      { id: "t3", text: "到", role: "动词补语" },
      { id: "t4", text: "鼠标垫", role: "名词(表面)" },
      { id: "t5", text: "上", role: "方位词" },
      { id: "t6", text: "。", role: "标点" },
    ],
    heads: [
      {
        id: "s3-combined",
        name: "📊 综合视图",
        description: "所有注意力头叠加后的全局视图。",
        matrix: s3Combined,
      },
      {
        id: "s3-syntax",
        name: "🔗 语法结构头",
        description: "把字句结构：把(引出)→鼠标(受事)→放(动作)→到→鼠标垫上(处所)。",
        matrix: s3Syntax,
      },
      {
        id: "s3-coref",
        name: "🔍 实体关联头",
        description: "\"鼠标\"(设备)与\"鼠标垫\"(表面)词汇相似但指代不同实体。",
        matrix: s3Coref,
      },
    ],
  },
];
