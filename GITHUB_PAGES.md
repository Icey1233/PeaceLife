# GitHub Pages 部署说明

PeaceLife 可以作为静态 PWA 部署到 GitHub Pages。页面、提醒、收件箱、天气、语音播报、PWA 安装和 Apps Script 云配置同步都可以在 Pages 上运行。

## 部署步骤

1. 把本项目推送到 GitHub 仓库。
2. 在 GitHub 仓库中打开 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 `GitHub Actions`。
4. 推送到 `main` 或 `master` 分支，或在 `Actions` 页面手动运行 `Deploy PeaceLife to GitHub Pages`。
5. 部署完成后，在 Actions 日志或 `Settings -> Pages` 中复制 Pages 地址。

## 已发布的文件

部署工作流只发布这些静态文件：

- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`
- `sw.js`
- `icons/`

不会发布 `home-assistant/`、`server.mjs`、`google-apps-script.js`、数据库、日志或任何 Home Assistant 配置。

## GitHub Pages 上的能力

- 本地提醒、今日时间线、生活状态、主动建议、临时事项分拣：可用。
- PWA 安装和离线缓存：GitHub Pages 是 HTTPS，现代浏览器中可用。
- 浏览器通知：取决于浏览器和系统权限；iPad 建议从 Safari 添加到主屏幕后使用。
- 语音播报：取决于浏览器的 `speechSynthesis` 支持。
- 天气：使用浏览器直接请求公开天气接口，通常可用。
- Apps Script 云配置：填写 Apps Script Web App URL 后可用，不要填写 Google Sheet 页面地址。

## GitHub Pages 上暂不可用的能力

- AI Agent `/api/agent`：GitHub Pages 不能运行 `server.mjs`，所以不能在 Pages 上直接保存 API Key 或代理 OpenAI/DeepSeek 请求。
- 服务端云配置代理 `/api/cloud-config`：Pages 上会改为浏览器直接请求 Apps Script URL。
- Home Assistant 控制：如果 Home Assistant 只在内网 HTTP 上，HTTPS 页面可能因为浏览器混合内容或 CORS 限制无法访问。建议给 Home Assistant 配 HTTPS 反向代理，并允许跨源访问。

## AI Agent 后续方案

如果要在 GitHub Pages 上保留 AI Agent，推荐新增一个独立 HTTPS 后端：

- Cloudflare Workers
- Vercel Serverless Function
- Netlify Function
- 自建 HTTPS Node 服务

前端再配置一个公开的 `AGENT_API_URL` 或在界面中填写 Agent API 地址。不要把 OpenAI/DeepSeek API Key 写进前端代码或 GitHub Pages。
