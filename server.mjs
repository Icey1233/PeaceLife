import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT || 5173);
const root = dirname(fileURLToPath(import.meta.url));

const requestedProvider = (process.env.AI_PROVIDER || "").trim().toLowerCase();
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1";
const openaiOrganization = process.env.OPENAI_ORG_ID || "";
const openaiProject = process.env.OPENAI_PROJECT_ID || "";
const deepseekApiKey = process.env.DEEPSEEK_API_KEY || "";
const deepseekModel = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";
const deepseekBaseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
const activeProvider = resolveProvider();
const cloudFetchTimeoutMs = 15000;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname === "/api/agent/status") {
    sendJson(response, 200, getAgentStatus());
    return;
  }

  if (url.pathname === "/api/agent") {
    await handleAgentRequest(request, response);
    return;
  }

  if (url.pathname === "/api/cloud-config") {
    await handleCloudConfigRequest(request, response);
    return;
  }

  if (url.pathname === "/api/cloud-config/push") {
    await handleCloudConfigPushRequest(request, response);
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(root, pathname));

  if (!filePath.startsWith(normalize(root))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(port, "0.0.0.0", () => {
  const status = getAgentStatus();
  const mode = status.connected
    ? `AI connected (${status.provider} · ${status.model})`
    : "AI not configured";
  console.log(`PeaceLife is running at http://localhost:${port} - ${mode}`);
});

async function handleAgentRequest(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const status = getAgentStatus();
  if (!status.connected) {
    sendJson(response, 401, {
      error: "AI_NOT_CONFIGURED",
      message: status.message
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const message = String(body.message || "").trim();
    const context = body.context || {};
    if (!message) {
      sendJson(response, 400, { error: "Message is required" });
      return;
    }

    const result = activeProvider === "deepseek"
      ? await askDeepSeekAgent(message, context)
      : await askOpenAiAgent(message, context);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, {
      error: "Agent failed",
      detail: error.message
    });
  }
}

async function handleCloudConfigRequest(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  let targetUrl = "";
  try {
    const body = await readJsonBody(request);
    targetUrl = String(body.url || "").trim();
    if (!targetUrl) {
      sendJson(response, 400, { error: "URL is required" });
      return;
    }

    const parsed = new URL(targetUrl);
    if (isGoogleSheetPageUrl(parsed)) {
      sendJson(response, 400, {
        error: "Use Apps Script Web App URL",
        detail: "请填写 Google Apps Script Web App URL，格式通常是 https://script.google.com/macros/s/.../exec，不是 docs.google.com/spreadsheets 表格页面地址。"
      });
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      sendJson(response, 400, { error: "Only http and https cloud config URLs are supported." });
      return;
    }

    parsed.searchParams.set("t", String(Date.now()));
    const cloudResponse = await fetch(parsed.href, {
      signal: AbortSignal.timeout(cloudFetchTimeoutMs),
      headers: {
        Accept: "application/json,text/plain,*/*"
      }
    });

    const text = await cloudResponse.text();
    if (!cloudResponse.ok) {
      sendJson(response, 502, {
        error: `Cloud config returned ${cloudResponse.status}`,
        detail: text.slice(0, 500)
      });
      return;
    }

    const json = parseCloudConfigText(text);
    sendJson(response, 200, json);
  } catch (error) {
    sendJson(response, 500, {
      error: "Cloud config fetch failed",
      detail: describeCloudFetchError(error, targetUrl)
    });
  }
}

async function handleCloudConfigPushRequest(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  let targetUrl = "";
  try {
    const body = await readJsonBody(request);
    targetUrl = String(body.url || "").trim();
    const config = body.config;
    if (!targetUrl) {
      sendJson(response, 400, { error: "URL is required" });
      return;
    }
    if (!config || typeof config !== "object") {
      sendJson(response, 400, { error: "Config payload is required" });
      return;
    }

    const parsed = new URL(targetUrl);
    if (isGoogleSheetPageUrl(parsed)) {
      sendJson(response, 400, {
        error: "Use Apps Script Web App URL",
        detail: "请填写 Google Apps Script Web App URL，格式通常是 https://script.google.com/macros/s/.../exec，不是 docs.google.com/spreadsheets 表格页面地址。"
      });
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      sendJson(response, 400, { error: "Only http and https cloud config URLs are supported." });
      return;
    }

    const cloudResponse = await fetch(parsed.href, {
      method: "POST",
      signal: AbortSignal.timeout(cloudFetchTimeoutMs),
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
        Accept: "application/json,text/plain,*/*"
      },
      body: JSON.stringify({
        action: "replaceConfig",
        config
      })
    });

    const text = await cloudResponse.text();
    if (!cloudResponse.ok) {
      sendJson(response, 502, {
        error: `Cloud config returned ${cloudResponse.status}`,
        detail: text.slice(0, 500)
      });
      return;
    }

    sendJson(response, 200, parseMaybeJson(text));
  } catch (error) {
    sendJson(response, 500, {
      error: "Cloud config push failed",
      detail: describeCloudFetchError(error, targetUrl)
    });
  }
}

async function askOpenAiAgent(message, context) {
  const headers = {
    Authorization: `Bearer ${openaiApiKey}`,
    "Content-Type": "application/json"
  };
  if (openaiOrganization) headers["OpenAI-Organization"] = openaiOrganization;
  if (openaiProject) headers["OpenAI-Project"] = openaiProject;

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: openaiModel,
      input: createAgentPrompt(message, context),
      text: {
        format: {
          type: "json_schema",
          name: "peacelife_agent_reply",
          strict: true,
          schema: getAgentReplySchema()
        }
      }
    })
  });

  if (!apiResponse.ok) {
    const text = await apiResponse.text();
    throw new Error(`OpenAI returned ${apiResponse.status}: ${text.slice(0, 240)}`);
  }

  const data = await apiResponse.json();
  return normalizeAgentReply(parseAgentJson(extractOpenAiText(data)), "openai", openaiModel);
}

async function askDeepSeekAgent(message, context) {
  const apiResponse = await fetch(`${deepseekBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: [
        {
          role: "system",
          content: [
            "你是 PeaceLife 的家庭生活智能管家。",
            "你的首要任务是直接回答用户当前输入的问题。",
            "不要默认总结待办事项；只有用户的问题明确和生活安排相关时才引用生活上下文。",
            "必须输出合法 JSON，不要输出 Markdown。",
            "JSON 格式示例：{\"title\":\"管家建议\",\"summary\":\"一句结论\",\"steps\":[\"步骤一\"],\"actions\":[\"可加入临时事项的行动\"]}",
            "字段必须是 title, summary, steps, actions。steps 和 actions 都是字符串数组。"
          ].join("\n")
        },
        {
          role: "user",
          content: createAgentPrompt(message, context)
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200
    })
  });

  if (!apiResponse.ok) {
    const text = await apiResponse.text();
    throw new Error(`DeepSeek returned ${apiResponse.status}: ${text.slice(0, 240)}`);
  }

  const data = await apiResponse.json();
  return normalizeAgentReply(parseAgentJson(data.choices?.[0]?.message?.content || ""), "deepseek", deepseekModel);
}

function createAgentPrompt(message, context) {
  const useLifeContext = shouldUseLifeContext(message);
  const contextText = useLifeContext
    ? `当前 PeaceLife 生活知识库：${JSON.stringify(context, null, 2)}`
    : "本次问题不需要使用 PeaceLife 生活知识库。除非用户追问生活安排，否则不要引用待办、SOP、天气、设备或提醒。";

  return [
    "你是 PeaceLife 的 AI 管家。你的首要任务是直接回答用户刚刚输入的问题。",
    "你必须先判断用户在问什么，然后回答这个问题本身。不要把普通问题改写成生活待办总结。",
    "PeaceLife 数据只是可选知识库，不是每次回答的主题。只有当问题和生活安排、家务、提醒、天气、设备、SOP 或用户习惯相关时，才引用这些数据。",
    "如果用户问的是一般知识、解释、建议、写作、翻译、代码、概念、聊天或开放问题，请正常回答问题，不要提待办、状态、天气或事项。",
    "如果用户的问题确实需要行动建议，再把 actions 填成可以加入临时事项的短句；否则 actions 返回空数组。",
    "不要编造无法从上下文读取的数据。涉及真实设备控制时只提出建议，不要声称已经执行。",
    "请输出 JSON，格式为：{\"title\":\"...\",\"summary\":\"...\",\"steps\":[\"...\"],\"actions\":[\"...\"]}。",
    "title 是回答标题；summary 必须是对用户原问题的直接回答；steps 是补充说明、推理、建议或步骤；actions 只放可加入临时事项的行动。",
    `是否使用生活知识库：${useLifeContext ? "是" : "否"}`,
    "",
    `用户问题：${message}`,
    "",
    contextText
  ].join("\n");
}

function shouldUseLifeContext(message) {
  const text = String(message || "").toLowerCase();
  return [
    "起床", "出门", "离家", "回家", "睡觉", "待办", "提醒", "日程", "计划", "今天",
    "明天", "天气", "下雨", "雨伞", "雨衣", "温度", "防晒", "家务", "清洁", "收拾",
    "猫", "猫咪", "猫砂", "空调", "设备", "home assistant", "ha", "sop", "事项",
    "买", "采购", "购物", "窗户", "门", "生活", "管家", "帮我安排", "帮我检查"
  ].some((keyword) => text.includes(keyword));
}

function getAgentReplySchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      steps: {
        type: "array",
        items: { type: "string" }
      },
      actions: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["title", "summary", "steps", "actions"]
  };
}

function normalizeAgentReply(parsed, provider, model) {
  return {
    mode: provider,
    provider,
    model,
    title: parsed.title || "管家建议",
    summary: parsed.summary || "我已经看过当前状态，可以先处理下面这些事项。",
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    actions: Array.isArray(parsed.actions) ? parsed.actions : []
  };
}

function resolveProvider() {
  if (requestedProvider === "deepseek") return "deepseek";
  if (requestedProvider === "openai") return "openai";
  if (deepseekApiKey) return "deepseek";
  if (openaiApiKey) return "openai";
  return requestedProvider || "not_configured";
}

function getAgentStatus() {
  if (activeProvider === "deepseek") {
    const valid = isUsableApiKey(deepseekApiKey);
    return {
      connected: valid,
      mode: valid ? "deepseek" : "not_configured",
      provider: "deepseek",
      model: valid ? deepseekModel : null,
      message: deepseekApiKey
        ? "DEEPSEEK_API_KEY looks invalid. Use the real key from DeepSeek, not the placeholder text."
        : "DEEPSEEK_API_KEY is not configured on the PeaceLife server."
    };
  }

  if (activeProvider === "openai") {
    const valid = isUsableApiKey(openaiApiKey);
    return {
      connected: valid,
      mode: valid ? "openai" : "not_configured",
      provider: "openai",
      model: valid ? openaiModel : null,
      message: openaiApiKey
        ? "OPENAI_API_KEY looks invalid. Use the real key from OpenAI, not the placeholder text."
        : "OPENAI_API_KEY is not configured on the PeaceLife server."
    };
  }

  return {
    connected: false,
    mode: "not_configured",
    provider: null,
    model: null,
    message: "Set AI_PROVIDER with OPENAI_API_KEY or DEEPSEEK_API_KEY on the PeaceLife server."
  };
}

function isUsableApiKey(value) {
  const key = String(value || "").trim();
  return key.startsWith("sk-") && /^[\x21-\x7e]+$/.test(key);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function parseCloudConfigText(text) {
  if (/^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
    const htmlText = extractHtmlText(text);
    if (/script function not found/i.test(htmlText)) {
      throw new Error(`Google Apps Script 返回错误页：${htmlText}。请确认脚本包含 doGet()，保存后重新部署 Web App，并继续使用 /exec 地址。`);
    }
    throw new Error(`Cloud config response is an HTML page: ${htmlText.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Cloud config response is not JSON.");
    return JSON.parse(match[0]);
  }
}

function extractHtmlText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function isGoogleSheetPageUrl(url) {
  return url.hostname === "docs.google.com" && url.pathname.includes("/spreadsheets/");
}

function describeCloudFetchError(error, targetUrl) {
  const cause = error?.cause || {};
  const parts = [
    error?.message,
    cause.code ? `code=${cause.code}` : "",
    cause.message ? `cause=${cause.message}` : "",
    getSafeHostText(targetUrl)
  ].filter(Boolean);
  const diagnosis = getCloudFetchDiagnosis(error, cause);
  return diagnosis ? `${parts.join(" · ")}。${diagnosis}` : parts.join(" · ");
}

function getSafeHostText(targetUrl) {
  try {
    return `host=${new URL(String(targetUrl || "")).hostname}`;
  } catch {
    return "";
  }
}

function getCloudFetchDiagnosis(error, cause) {
  const text = `${error?.name || ""} ${error?.message || ""} ${cause.code || ""} ${cause.message || ""}`.toLowerCase();
  if (text.includes("timeout") || text.includes("abort")) {
    return "本机后端访问云文档超时，请检查 Google 是否能从当前网络或代理被 Node.js 访问。";
  }
  if (text.includes("enotfound") || text.includes("eai_again")) {
    return "本机后端无法解析云文档域名，请检查 DNS、代理或网络连接。";
  }
  if (text.includes("econnreset") || text.includes("etimedout") || text.includes("econnrefused")) {
    return "本机后端连接云文档被中断或拒绝，常见原因是代理没有提供给 Node.js。";
  }
  if (text.includes("certificate") || text.includes("tls") || text.includes("ssl")) {
    return "HTTPS 证书或 TLS 握手失败，请检查代理证书或公司网络拦截。";
  }
  if (text.includes("script.google.com") || text.includes("google")) {
    return "如果浏览器能打开但这里失败，通常是 Node.js 没走系统代理；可给启动命令加 HTTPS_PROXY/HTTP_PROXY。";
  }
  return "";
}

function parseMaybeJson(text) {
  try {
    return parseCloudConfigText(text);
  } catch {
    return { ok: true, text: text.slice(0, 500) };
  }
}

function extractOpenAiText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
      if (content.type === "text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function parseAgentJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { summary: text };
    try {
      return JSON.parse(match[0]);
    } catch {
      return { summary: text };
    }
  }
}
