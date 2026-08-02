# 太行薪火 金银花开 产业指挥服务平台 — 项目交接文档

> 生成日期：2026-08-03 | 供新对话/新 agent 接手使用
> 项目路径：`D:\OneDrive\桌面\三下乡\julu-honeysuckle\`

## 一、项目是什么

面向巨鹿县金银花种植户/合作社/政府部门的产业信息服务平台。基于 `D:\OneDrive\桌面\三下乡\设计思路.md` 实现，纯静态部署（GitHub Pages），AI 能力由 Agnes AI 提供。

**线上地址**：https://yyyxv1213-ux.github.io/julu-honeysuckle/（已上线，200 可访问）

## 二、技术栈与结构

Vite 5 + Vue 3 (Composition API + `<script setup>`) + Element Plus + ECharts 5 + Axios + Vue Router 4 (hash 模式) + regression-js + marked。

```
julu-honeysuckle/
├── .github/workflows/deploy.yml   # GitHub Pages 自动构建部署（push 触发）
├── src/
│   ├── data/          # 静态数据 JSON（产业/价格/病虫害/政策/FAQ）—— 改数据只动这里
│   ├── utils/         # chatApi.js（Agnes 问答+FAQ 兜底）、storage.js（localStorage 带前缀）
│   ├── views/         # 六个页面：Overview/Price/Pest/Qa/Policy/Tools
│   ├── router/index.js # 六路由（hash 模式）
│   ├── App.vue        # 布局：侧边栏 + 顶栏 + 主区
│   └── main.js        # Element Plus 全量注册（含图标）
├── vite.config.js     # base:'./'（相对路径，双击 dist 或子路径部署均可）
└── package.json       # 依赖清单（注意 optionalDependencies 含 @emnapi core/runtime）
```

## 三、六大功能模块

| 路由 | 模块 | 说明 |
|---|---|---|
| `/` | 产业概览大屏 | 4 张数据卡 + 3 张 ECharts 图（五年趋势/品种饼图/乡镇分布），数据来自巨鹿县政府官网 |
| `/price` | 价格分析与预测 | 历史价格四档切换（近6/12/24月/全部）、regression 线性回归下三月预测、巨鹿实时天气（open-meteo 免费 API）+ Agnes AI 农事解读 |
| `/pest` | 病虫害识别 | 图片上传 → Agnes 多模态识别，四分支：病虫害/正常（健康）/非金银花（提示具体内容）/未知；8 种病虫害图鉴 + 搜索 |
| `/qa` | 智能问答 | Agnes 问答（`agnes-2.0-flash`），API 失败自动降级本地 FAQ 关键词匹配 |
| `/policy` | 政策资讯 | 巨鹿县政府官网真实文章（点击跳原文），按日期降序 + 标签筛选 + 标签记忆 |
| `/tools` | 农户工具 | 烘干参数计算器（折干率/温度/时长）、收益估算器 |

## 四、Agnes API 配置（关键）

**Agnes 不是 DeepSeek**——是独立 AI 网关（OpenAI 兼容格式），模型 `agnes-2.0-flash`，支持多模态（图片识别）。

- **本地开发**：`.env` 文件（已被 .gitignore 排除，**不要提交**）：
  ```
  VITE_AGNES_API_KEY=sk-...（用户提供）
  VITE_AGNES_API_URL=https://apihub.agnes-ai.com/v1/chat/completions
  VITE_AGNES_MODEL=agnes-2.0-flash
  ```
- **GitHub Pages 线上**：key 通过仓库 **Settings → Secrets → Actions** 的 `VITE_AGNES_API_KEY` 注入，workflow 构建时注入（见 deploy.yml）。
- **无 key 时降级**：问答→本地 FAQ；病虫害识别→本地图鉴；天气仍可用（open-meteo 无需 key）。
- ⚠️ **key 已明文出现在历史对话中，且构建产物（dist）会包含 key**——如需防泄露建议在 Agnes 控制台轮换 key。

## 五、Git 与部署状态

**仓库**：https://github.com/yyyxv1213-ux/julu-honeysuckle（main 分支，Public）

提交历史（5 个）：
```
53ffd43 fix: lock 补全 @emnapi core/runtime，修复 CI npm ci EUSAGE
de15ec9 ci: Actions Node 20→24 对齐本地，npm ci 降噪
070af13 docs: README 改为 Agnes 说明，删除 .env.example 与残留 icons
7d83950 ci: GitHub Pages 自动构建部署 workflow
49323f3 init: 巨鹿金银花产业智慧服务平台
```

**部署方式**：push main 自动触发 Actions → npm ci + build → deploy-pages。工作区当前干净（无未提交改动）。

**踩过的坑（重要）**：
1. CI 的 `npm ci` 报 EUSAGE（Missing @emnapi/core）——lock 在 Windows 生成时缺 Linux 平台 optional 依赖，已手工补 lock 条目修复（`package-lock.json` + `package.json` 的 optionalDependencies）。**以后本地改依赖后重新 `npm install` 可能再次破坏 lock 的 Linux 兼容性**——改依赖后务必 `npm ci` 验证，必要时补 @emnapi 条目。
2. Vite 8 要求 Node ≥20.19 / ≥22.12，workflow 用 Node 24。
3. 构建产物用相对路径（base:'./'），双击 dist/index.html 可独立运行。
4. Agnes 网关对图片大请求偶发 504/CORS 拦截——前端已做压缩（800px/JPEG75）+ fetch 重试 + content 为空自动提 token 重试。

## 六、验证命令

```bash
npm run dev      # 开发（http://localhost:5173）
npm run build    # 构建（产出 dist/）
npm run preview  # 预览构建产物
```

项目无自动化测试框架（纯前端演示项目），验证以浏览器实测 + build 通过为准。改动后至少跑 `npm run build` 确认无编译错误。

## 七、已知遗留事项

1. **index.html 的 `<title>` 仍是脚手架默认 "julu-honeysuckle"**——首次加载的标签页标题，路由切换后会被 router afterEach 覆盖为正常标题。可改 index.html 第 5 行附近。
2. 月度价格数据为模拟（参考行情趋势），核心产业数据（1.4 万吨/60%/34 亿/6 亿）为政府官网 2026-04 真实数据。
3. 乡镇种植面积分布（堤村乡 2.8 万亩等）为模拟，政府未公开分乡镇数据。
4. 政策页链接指向政府官网真实文章（8 篇），如需增删改 `src/data/policies.json`。
5. 病虫害识别真实效果依赖照片清晰度——建议用金银花叶片特写测试。
6. GitHub Actions 需要用户已配置 `VITE_AGNES_API_KEY` secret（若未配，线上 AI 问答走 FAQ 兜底，其余功能正常）。

## 八、目录中其他文件（项目外）

`D:\OneDrive\桌面\三下乡\` 根目录还有：申报书相关（shenbaoshu.txt、附件4 .doc、read_doc.py/r.py 提取脚本）、新闻稿素材（articles/、中国青年网/、中国大学生网/ 含实践照片 jpg）、`设计思路.md`（本项目需求来源）。这些是素材，不属于 julu-honeysuckle 项目本身。
