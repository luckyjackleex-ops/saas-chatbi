# AI Analytics · SaaS ChatBI

一个面向 SaaS 场景的 AI 数据分析（ChatBI）Demo 项目，100% 复刻自 [saas-chaibi.netlify.app](https://saas-chaibi.netlify.app/)。用自然语言提问，拿到从图表、洞察到建议和报告的完整分析结果，开箱即用并内置 SaaS 行业指标体系。

## 功能

- **登录 / 角色切换**：内置 3 个 Demo 角色（`manager` / `pm` / `analyst`，密码均为 `demo123`），对应管理者、产品经理、数据分析师三种视角。
- **数据看板**：核心指标卡片、异常自动发现（Z-score）、多维度切换（汇总/地区/客户分层/时间）、MRR & NRR 趋势、世界地图客户分布、团队动态。
- **ChatBI**：自然语言 → 结构化查询解析（DeepSeek），流式 AI 洞察、策略建议、对比分析（t 检验）、SQL 预览、归因下钻、报告生成与导出。
- **语义层管理**：指标、别名、单位、图表类型、维度的增删改查（本地持久化）。
- **数据管理**：内置 4 张 Demo 数据表 + CSV 上传 / 排序 / 搜索 / 导出。
- **报告草稿箱**：报告查看、编辑、PDF 导出。
- **帮助中心 / 新手引导 / 演示模式**。

## 技术栈

- React 18 + Vite
- Tailwind CSS v4
- ECharts（`echarts` + `echarts-for-react`）
- lucide-react 图标
- react-router-dom v6
- DeepSeek API（意图识别 / 洞察 / 报告 / 策略建议）
- html2canvas + jsPDF（PDF 导出）、jStat（显著性检验）

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:5173`，用任意 Demo 账号登录（如 `manager / demo123`）。

## 部署

```bash
npm run build
```

`dist/` 目录为纯静态产物，可部署到 Netlify / Vercel / 任意静态托管。

> ⚠️ **API Key 提醒**：源码 `src/lib/llm.js` 中内置了原站点公开的 DeepSeek Demo 密钥。部署前请用你自己的 Key 替换，建议通过环境变量 `VITE_DEEPSEEK_API_KEY` 注入（参考 `.env.example`）。

## 目录结构

```
src/
├── main.jsx            # 入口（路由 + Provider）
├── App.jsx             # 路由定义
├── index.css           # Tailwind v4 主题 + 自定义样式
├── context/            # Auth / 演示引导 上下文
├── lib/                # 数据生成、指标体系、LLM、图表、异常检测、存储
├── components/         # 布局、图表、抽屉、聊天组件
└── pages/              # 9 个页面
```
