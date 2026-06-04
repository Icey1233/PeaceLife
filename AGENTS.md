# AGENTS.md

## 协作流程

- 每次开始任务前，先用简短文字总结本次任务目标。
- 每次开始任务前，同时说明主要风险，例如可能影响的文件、外部依赖、权限限制、数据/密钥安全、兼容性或验证盲区。
- 如果任务目标或风险不明确，先读取项目上下文并基于现有代码做合理判断；只有在无法安全判断时再向用户确认。
- 执行修改时优先保持改动范围小，遵循项目现有结构和风格，不做与任务无关的重构。
- 不读取或输出敏感信息，例如 Home Assistant token、API key、secrets.yaml 中的秘密值，除非用户明确要求且确有必要。

## 完成后的验证

- 每次完成任务后，评估该任务是否可验证。
- 如果可验证，必须提供具体的验证方法，例如运行命令、访问页面、点击路径、预期结果或手动检查步骤。
- 如果已完成验证，说明实际执行的验证方式和结果。
- 如果未执行验证但可以验证，说明推荐验证步骤。
- 如果任务不可验证或当前环境无法验证，明确说明原因，并指出剩余风险。

## PeaceLife 项目提示

- 本项目是原生 Web/PWA 项目，主要入口是 `index.html`、`app.js`、`styles.css` 和 `server.mjs`。
- 本地运行通常使用 `node server.mjs`，默认地址是 `http://localhost:5173`。
- AI 管家依赖服务端环境变量，例如 `OPENAI_API_KEY`、`DEEPSEEK_API_KEY`、`AI_PROVIDER`、`OPENAI_MODEL`、`DEEPSEEK_MODEL`。
- Home Assistant 配置位于 `home-assistant/`，启动方式通常是 `docker compose up -d`，默认地址是 `http://localhost:8123`。
- Google Sheets 云同步脚本在 `google-apps-script.js`，前端需要填写 Apps Script Web App URL，而不是 Google Sheet 页面地址。
