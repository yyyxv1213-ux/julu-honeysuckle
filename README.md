# 太行薪火 金银花开 产业指挥服务平台

面向巨鹿县金银花种植户、合作社、政府管理部门及行业关注者的产业信息服务平台。基于 `设计思路.md` 实现，Vite + Vue 3 + Element Plus，纯静态部署，AI 能力由 **Agnes AI** 提供。

## 功能模块

| 路由 | 模块 | 说明 |
|---|---|---|
| `/` | 产业概览大屏 | 产业数据卡片、近五年种植/产量趋势、品种占比、主产乡镇分布（ECharts，数据来自巨鹿县政府官网） |
| `/price` | 价格分析与预测 | 历史价格走势（可切换时间范围）、线性回归下三月预测、巨鹿实时天气 + Agnes AI 农事解读 |
| `/pest` | 病虫害识别 | 图片上传，Agnes 多模态识别病虫害/健康/非金银花内容，8 种常见病虫害图鉴 + 搜索 |
| `/qa` | 智能问答 | Agnes 大模型问答，API 不可用时自动切换本地 FAQ 关键词匹配 |
| `/policy` | 政策资讯 | 巨鹿县政府官网真实政策与新闻（点击跳转原文），按时间倒序 + 标签筛选 |
| `/tools` | 农户工具 | 烘干参数计算器（折干率/温度/时长）、收益估算器 |

## 快速开始

```bash
npm install
npm run dev      # 开发：http://localhost:5173
npm run build    # 打包：产出 dist/
npm run preview  # 预览打包结果
```

构建产物 `dist/` 使用相对路径，可直接双击打开或部署到任意静态托管（GitHub Pages / OSS / Nginx）。

## AI 能力配置（Agnes AI）

问答、病虫害识别、天气解读均使用 Agnes AI（模型 `agnes-2.0-flash`，OpenAI 兼容格式）。

**本地开发**：在项目根目录创建 `.env` 文件（已被 .gitignore 排除，不会提交）：
```
VITE_AGNES_API_KEY=sk-你的key
VITE_AGNES_API_URL=https://apihub.agnes-ai.com/v1/chat/completions
VITE_AGNES_MODEL=agnes-2.0-flash
```

**GitHub Pages 部署**：无需 .env 文件，在仓库 Settings → Secrets → Actions 添加 `VITE_AGNES_API_KEY`，push 后由 `.github/workflows/deploy.yml` 自动构建部署并注入 key。

未配置 key 时：问答自动降级为本地 FAQ 匹配，病虫害识别降级为本地图鉴，天气仍显示实时数据（open-meteo，无需 key）。

## 数据说明

`src/data/` 下为静态 JSON 数据，核心产业数据来自巨鹿县人民政府官网（2026-08 更新）：年产干花 1.4 万吨、占全国 60%、品牌价值超 34 亿元、全产业链中心投资 6 亿元；月度价格为参考公开行情的模拟数据（标注见文件头 `_note`）。替换真实数据只需改对应 JSON。

## 技术栈

Vite 5 · Vue 3 (Composition API) · Element Plus · ECharts 5 · Axios · Vue Router 4 · regression-js · marked · open-meteo
