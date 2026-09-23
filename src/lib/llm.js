import { METRICS, DIMENSIONS } from './metrics.js'

// ===== DeepSeek 配置 =====
// 注意：这是原站点暴露的 Demo 密钥，强烈建议替换为你自己的 DeepSeek API Key。
// 通过环境变量 VITE_DEEPSEEK_API_KEY 覆盖（参考 .env.example）。
export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-3b1fb1536ddd44e28fbf4b3cf40869e4'
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

const FLASH = 'deepseek-v4-flash'
const PRO = 'deepseek-v4-pro'

function buildBody(model, messages, opts = {}) {
  const body = {
    model,
    messages,
    temperature: opts.temperature ?? 0.1,
    max_tokens: opts.max_tokens ?? 4096,
  }
  if (opts.stream) body.stream = true
  if (opts.thinkingType) body.thinking = { type: opts.thinkingType }
  return body
}

async function complete(system, user, model = FLASH, think, maxTokens) {
  const body = buildBody(
    model,
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      thinkingType: model === FLASH ? 'disabled' : think ? 'enabled' : undefined,
      max_tokens: maxTokens,
    },
  )
  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${text}`)
  }
  return (await res.json()).choices?.[0]?.message?.content || ''
}

async function* stream(system, user, model = FLASH, think, maxTokens) {
  const body = buildBody(
    model,
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    {
      stream: true,
      temperature: 0.3,
      max_tokens: maxTokens,
      thinkingType: model === FLASH ? 'disabled' : think ? 'enabled' : undefined,
    },
  )
  const res = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${text}`)
  }
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buf = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() || ''
      for (const line of lines) {
        const s = line.trim()
        if (!s || !s.startsWith('data: ')) continue
        const data = s.slice(6)
        if (data === '[DONE]') continue
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta
          if (!delta) continue
          if (delta.content) yield delta.content
        } catch {}
      }
    }
  } finally {
    reader.releaseLock()
  }
}

// ===== 意图解析 =====
const PARSE_PROMPT = `你是一个 SaaS 数据分析平台的查询解析器。将用户的自然语言问题转换为结构化查询参数。

## 可用指标
${JSON.stringify(Object.entries(METRICS).map(([key, m]) => ({ key, label: m.label, aliases: m.aliases.slice(0, 5), defaultChart: m.chartType })), null, 2)}

## 可用维度
${JSON.stringify(Object.entries(DIMENSIONS).map(([key, d]) => ({ key, label: d.label })), null, 2)}

## 图表类型选择规则
根据查询意图选择最佳图表类型：
- line（折线图）：时间趋势、连续变化，如"最近几个月的 MRR 趋势"
- bar（柱状图）：分类对比、排名，如"各渠道的收入对比"
- pie（饼图）：占比分布、构成分析，如"各客户分层的收入占比"
- scatter（散点图）：相关性分析、分布关系，如"DAU 与留存率的关系"

## 输出格式
严格输出 JSON，不要包含 markdown 代码块标记或额外文字：
{
  "metrics": ["匹配的指标 key"],
  "dimensions": ["需要的维度 key"],
  "timeRange": { "start": "YYYY-MM", "end": "YYYY-MM" },
  "filters": [],
  "chartType": "line|bar|pie|scatter",
  "confidence": 0.0-1.0,
  "clarifying_question": "confidence < 0.7 时填写确认问题"
}

## 时间映射规则
- 本月 = 2026-05，上个月 = 2026-04
- 近3个月 = 2026-03 至 2026-05
- 近6个月 = 2025-12 至 2026-05
- 今年 = 2025-06 至 2026-05
- 近一年/过去一年 = 2025-06 至 2026-05
- 第8个月 = 2026-01
- 如果用户问单一月份（如"三月份"），必须返回该月份，由系统自动扩展上下文

## 意图映射规则
- "生意怎么样"/"经营状况"/"经营数据" → mrr + arr + new_customers
- "用户活跃度"/"用户活跃" → dau + mau + stickiness
- "流失情况"/"流失" → churn_rate + churned_customers
- "留存" → d7_retention + d30_retention
- "收入" → mrr + arr + expansion_mrr
- "成本" → cac
- "客户价值" → ltv
- "对比"/"比较" → 多个指标对比，chartType 用 bar
- "趋势"/"变化" → chartType 用 line
- "占比"/"分布"/"构成" → chartType 用 pie
- "相关"/"关系" → chartType 用 scatter
- 如果无法匹配到任何指标，confidence 设为 0.3 并给出 clarifying_question`

export async function parseQuery(question, context = '') {
  const raw = (
    await complete(
      PARSE_PROMPT,
      question + (context ? `\n\n对话上下文：\n${context}\n请结合上下文理解用户意图。` : ''),
    )
  )
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    const parsed = JSON.parse(raw)
    return {
      metrics: parsed.metrics || [],
      dimensions: parsed.dimensions || ['month'],
      timeRange: parsed.timeRange || { start: '2026-04', end: '2026-05' },
      filters: parsed.filters || [],
      chartType: parsed.chartType || 'line',
      confidence: parsed.confidence ?? 1,
      clarifying_question: parsed.clarifying_question,
    }
  } catch {
    return {
      metrics: ['mrr'],
      dimensions: ['month'],
      timeRange: { start: '2026-04', end: '2026-05' },
      filters: [],
      chartType: 'line',
      confidence: 0.3,
      clarifying_question: '我没太理解你的问题，你能换个方式描述一下你想查什么数据吗？',
    }
  }
}

// ===== 洞察分析 =====
const INSIGHT_PROMPT = `你是一个 SaaS 数据分析师。基于提供的完整时间序列数据，用中文写出结构化的分析洞察。

## 分析要求
- 对比当前周期与历史周期的数据变化，指出趋势方向（↑↓→）
- 必须引用具体数字、单位和时间点
- 优先使用环比（MoM）和同比（YoY）数据做对比
- 标注异常波动和拐点
- 使用业务语言，不用技术术语

## 输出格式
**核心发现**
1 句话概括最重要的数据变化

**趋势分析**
- 逐月/逐项列出关键数据变化，每项一行
- 格式：时间点 | 指标值 | 环比变化 | 说明

**对比亮点**
- 当前值 vs 历史同期对比
- 标注最高/最低点

**风险提示**（如有异常）
- 标注偏离正常范围的数据

## 禁止
- "建议关注数据"、"建议进一步分析"等空洞表述
- JSON 格式或代码块
- 超过 200 字的冗长段落`

export function formatResultsForInsight(results) {
  return results
    .map((r) => {
      const lines = []
      lines.push(`## ${r.metricLabel}（单位：${r.unit}）`)
      const series = r.data.map((d, i) => {
        const s = `${d.label}: ${d.value}`
        return i === 0 ? `${s}（起始）` : i === r.data.length - 1 ? `${s}（最新）` : s
      })
      lines.push(`完整时间序列（共 ${r.data.length} 个数据点）：`)
      lines.push(series.join(' | '))
      const cmp = r.comparison
      if (cmp) {
        if (cmp.mom) lines.push(`环比（MoM）：上月值 ${cmp.mom.value}，变化 ${cmp.mom.change > 0 ? '+' : ''}${cmp.mom.change}%`)
        if (cmp.yoy) lines.push(`同比（YoY）：去年同期值 ${cmp.yoy.value}，变化 ${cmp.yoy.change > 0 ? '+' : ''}${cmp.yoy.change}%`)
      }
      const values = r.data.map((d) => d.value)
      const max = Math.max(...values)
      const min = Math.min(...values)
      const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      lines.push(`统计：最高 ${max} | 最低 ${min} | 均值 ${avg} | 趋势 ${values[values.length - 1] > values[0] ? '上升' : '下降'}`)
      return lines.join('\n')
    })
    .join('\n\n---\n')
}

export function streamInsight(results, question) {
  return stream(
    INSIGHT_PROMPT,
    `用户问题：${question}\n\n完整查询数据：\n${formatResultsForInsight(results)}\n\n请基于以上完整时间序列数据，分析趋势、对比历史、标注异常：`,
    FLASH,
  )
}

export function insight(results, question) {
  return complete(
    INSIGHT_PROMPT,
    `用户问题：${question}\n\n完整查询数据：\n${formatResultsForInsight(results)}\n\n请基于以上完整时间序列数据，分析趋势、对比历史、标注异常：`,
    FLASH,
  )
}

// ===== 报告生成 =====
const REPORT_PROMPT = `你是一个 SaaS 公司的资深数据分析师。你会收到三份材料：原始数据、AI 初步洞察、策略建议。

## 你的任务
基于以上三份材料，**重新撰写**一份独立的综合分析报告。你必须用自己的语言重新组织，**不得照搬或改写 AI 洞察的原文**。

## 报告结构
1. **标题** — 10 字以内，点明核心结论
2. **核心指标摘要** — 用你自己的话概括最重要的发现，列出 3-5 个关键数字
3. **趋势分析** — 结合原始数据中的时间序列，描述变化趋势和拐点
4. **异常与风险** — 标注偏离正常范围的数据点
5. **策略建议** — 提炼策略建议的核心要点（每点 1-2 句）

## 内容格式
每个 section 的 content 字段：
- 开头 1 句话概括本节要点（加粗）
- 后续用 "- " 开头的列表项分点展开
- 关键数字用 **粗体** 突出
- 涨跌用 ↑↓ 箭头

## 禁止（极其重要）
- **禁止照搬或改写 AI 洞察的原文**，你必须用不同的表述重新组织
- **禁止复制策略建议的原文**，你必须提炼为核心要点
- JSON 外的任何文字（只输出 JSON）
- "建议关注数据"、"建议进一步分析"等空洞话术

输出 JSON：
{
  "title": "报告标题",
  "sections": [
    { "title": "核心指标摘要", "content": "..." },
    { "title": "趋势分析", "content": "..." },
    { "title": "异常与风险", "content": "..." },
    { "title": "策略建议", "content": "..." }
  ]
}`

function formatForReport(results) {
  return results
    .map((r) => {
      const data = r.data.map((d) => `${d.label}: ${d.value}`).join(', ')
      let cmp = ''
      if (r.comparison) {
        if (r.comparison.mom) cmp += ` | 环比: ${r.comparison.mom.change > 0 ? '+' : ''}${r.comparison.mom.change}%`
        if (r.comparison.yoy) cmp += ` | 同比: ${r.comparison.yoy.change > 0 ? '+' : ''}${r.comparison.yoy.change}%`
      }
      return `${r.metricLabel}(${r.unit}): [${data}]${cmp}`
    })
    .join('\n')
}

export async function generateReport(question, insights, suggestions, results) {
  const raw = (
    await complete(
      REPORT_PROMPT,
      `用户问题：${question}\n\n===== 原始数据（请基于此数据独立分析）=====\n${formatForReport(results)}\n\n===== AI 初步洞察（参考，不得照搬）=====\n${insights}\n\n===== 策略建议（参考，必须提炼，不得照搬）=====\n${suggestions}\n`,
      FLASH,
    )
  )
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim()
  try {
    const parsed = JSON.parse(raw)
    const sections = (parsed.sections || []).map((s, i) => ({
      title: s.title,
      content: s.content,
      chartData: i === 0 ? results[0] : undefined,
      editable: true,
    }))
    return {
      id: `report-${Date.now()}`,
      title: parsed.title || '数据分析报告',
      createdAt: new Date().toISOString(),
      role: 'manager',
      sections,
    }
  } catch {
    return {
      id: `report-${Date.now()}`,
      title: '数据分析报告',
      createdAt: new Date().toISOString(),
      role: 'manager',
      sections: [
        { title: '核心指标摘要', content: insights, chartData: results[0], editable: true },
        { title: '策略建议', content: suggestions, editable: true },
      ],
    }
  }
}

// ===== 策略建议 =====
const SUGGESTION_PROMPT = `你是 SaaS 增长顾问。基于数据洞察，给出 1-2 条可执行的策略建议。

## 格式（每条 ≤80 字，一行）
→ [动作]：[针对谁]做什么，预期达到什么量化效果

## 要求
- 必须有具体数字
- 直接说结论，不要铺垫
- 不行就只给 1 条，但要精准

## 禁止
- "建议关注"、"进一步分析"、"持续观察"、"可能"、"也许"
- 表格、编号列表、加粗、分节标题
- 任何超过 80 字的句子`

export function generateSuggestions(prompt) {
  return stream(SUGGESTION_PROMPT, prompt, FLASH, undefined, 300)
}

export function generateSuggestionsFallback(prompt) {
  return complete(SUGGESTION_PROMPT, prompt, FLASH, undefined, 300)
}

// ===== 对比分析 =====
const COMPARE_PROMPT =
  '基于以下对比分析结果，用通俗易懂的中文给出业务解读。1-2 句话。\n\n## 要求\n- 用业务语言，不是统计术语\n- 告诉用户这意味着什么，接下来应该怎么做'

export function interpretComparison(data) {
  return complete(COMPARE_PROMPT, JSON.stringify(data, null, 2), FLASH)
}

export { complete, stream, PRO }
