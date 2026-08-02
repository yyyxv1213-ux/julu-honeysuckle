# 巨鹿金银花产业智慧服务平台

面向巨鹿县金银花种植户、合作社、政府管理部门及行业关注者的产业信息服务平台。基于 `设计思路.md` 实现，Vite + Vue 3 + Element Plus，纯静态部署。

## 功能模块

| 路由 | 模块 | 说明 |
|---|---|---|
| `/` | 产业概览大屏 | 产业数据卡片、近五年种植/产量趋势、品种占比、主产乡镇分布（ECharts） |
| `/price` | 价格分析与预测 | 历史价格走势（可切换时间范围）、线性回归下三月预测（regression-js） |
| `/pest` | 病虫害识别 | 图片上传识别（本地图鉴兜底，可接百度AI API）、8 种常见病虫害图鉴 + 搜索 |
| `/qa` | 智能问答 | DeepSeek 大模型流式问答，API 不可用时自动切换本地 FAQ 关键词匹配 |
| `/policy` | 政策资讯 | 省市县三级政策与行业新闻，时间线展示 + 标签筛选 |
| `/tools` | 农户工具 | 烘干参数计算器（折干率/温度/时长）、收益估算器 |

## 快速开始

```bash
npm install
npm run dev      # 开发：http://localhost:5173
npm run build    # 打包：产出 dist/
npm run preview  # 预览打包结果
```

## DeepSeek API 配置（智能问答）

1. 复制 `.env.example` 为 `.env`
2. 填入你的 DeepSeek API Key：
   ```
   VITE_DEEPSEEK_API_KEY=sk-你的key
   ```
3. `.env` 已被 `.gitignore` 排除，不会提交到仓库

未配置 Key 时智能问答自动降级为本地 FAQ 关键词匹配（离线可用）。

## 数据说明

`src/data/` 下为静态 JSON 数据，均依据巨鹿县公开资料整理并合理模拟（种植面积、产量、价格行情、政策、病虫害图鉴），标注见各文件头部 `_note` 字段。如需接入真实数据，直接替换对应 JSON 即可。

## 部署（GitHub Pages）

```bash
npm run build
```

将 `dist/` 内容推送到 GitHub Pages（仓库 Settings → Pages → 选择分支目录），或上传至任意静态托管（OSS / Nginx）。

## 技术栈

Vite 5 · Vue 3 (Composition API) · Element Plus · ECharts 5 · Axios · Vue Router 4 · regression-js · marked

## 已知说明

- 病虫害识别当前为本地兜底模式（按文件名匹配图鉴），接入百度AI需在 `src/views/Pest.vue` 的 `onUpload` 中替换为真实 API 调用（跨域建议走 Vite 代理）
- 天气信息模块（和风天气 API）预留了设计位，因无 Key 未接入，可在价格页扩展
- 地图分布使用柱状图替代 GeoJSON 热力图（无行政区划数据），乡镇面积数据为模拟
