const STORAGE_KEY = "peacelife.reminders.v1";
const COMPLETED_KEY = "peacelife.completed.v1";
const STATE_KEY = "peacelife.lifeState.v1";
const MODULE_DONE_KEY = "peacelife.moduleDone.v1";
const WEATHER_CITY_KEY = "peacelife.weatherCity.v1";
const WEATHER_CACHE_KEY = "peacelife.weatherCache.v1";
const HA_SETTINGS_KEY = "peacelife.homeAssistant.v1";
const INBOX_KEY = "peacelife.inbox.v1";
const CONFIG_STATES_KEY = "peacelife.configStates.v1";
const CLOUD_CONFIG_KEY = "peacelife.cloudConfig.v1";

const domains = [
  { id: "body", icon: "💪", title: "身体", detail: "起床、运动、午休、睡眠", states: ["awake", "sleep"] },
  { id: "cat", icon: "🐾", title: "猫咪", detail: "粮水、铲屎、清洁", states: ["awake", "home"] },
  { id: "home", icon: "🏠", title: "家务", detail: "清洁、通风、门窗、电器", states: ["awake", "home", "sleep"] },
  { id: "supplies", icon: "🧺", title: "物资", detail: "纸巾、洗护、妆药、待买", states: ["away", "home"] },
  { id: "mind", icon: "📓", title: "复盘", detail: "工作总结、生活总结、明日计划", states: ["sleep"] },
  { id: "devices", icon: "🌡️", title: "设备", detail: "空调、天气、Home Assistant", states: ["home", "sleep"] }
];

const inboxDomainFallback = { id: "mind", icon: "📓", title: "待分拣" };

const inboxDomainRules = [
  { id: "cat", keywords: ["猫", "猫咪", "猫砂", "湿粮", "生骨肉", "粮水", "铲屎"] },
  { id: "devices", keywords: ["空调", "设备", "home assistant", "ha", "温度", "加湿", "灯", "风扇"] },
  { id: "supplies", keywords: ["买", "采购", "补充", "纸巾", "湿巾", "洗护", "垃圾袋", "药", "妆", "键盘", "鼠标"] },
  { id: "home", keywords: ["清洁", "收拾", "窗", "门", "快递", "外包装", "床", "洗床品", "衣服", "家务", "修"] },
  { id: "body", keywords: ["运动", "锻炼", "睡", "午休", "喝水", "洗漱", "护肤", "防晒", "泡脚", "瑜伽", "拉伸"] },
  { id: "mind", keywords: ["总结", "复盘", "计划", "学习", "单词", "听力", "口语", "记录", "想法"] }
];

const inboxUrgencyRules = [
  { value: "high", label: "尽快", keywords: ["今天", "马上", "现在", "立刻", "出门前", "睡前", "回家前", "deadline", "必须", "紧急"] },
  { value: "medium", label: "近期", keywords: ["明天", "周末", "本周", "下班", "晚上", "早上", "午休", "采购", "补充"] }
];

const repeatLabels = {
  once: "仅今天",
  daily: "每天",
  weekdays: "工作日",
  weekends: "周末",
  weekly: "每周"
};

const sopReminders = [
  ["起床", "06:30", "daily", "收拾床铺、开窗换气、帕梅拉 10 分钟、洗漱、喝温开水。"],
  ["猫咪晨间照顾", "07:00", "daily", "铲屎、清洁补充粮水、准备湿粮或生骨肉。"],
  ["收拾自己", "07:30", "daily", "做发型、护肤和防晒，检查通勤出门清单。"],
  ["锻炼身体", "07:50", "daily", "按计划完成晨间锻炼。"],
  ["午饭", "12:00", "daily", "午饭时间。"],
  ["午休", "12:30", "weekdays", "看电视后午休，准备蒸汽眼罩。"],
  ["晚餐后收尾", "19:30", "daily", "吃完晚餐，进入洗澡、护理、清洁流程。"],
  ["晚间学习", "20:20", "daily", "单词、听力、口语，并做拉伸。"],
  ["总结和明日准备", "20:50", "daily", "今天工作总结、生活总结、明日清点、每周计划。"],
  ["收起手机", "21:40", "daily", "收起手机，进入泡脚、脚底按摩和学习。"],
  ["瑜伽拉筋", "22:00", "daily", "瑜伽、按摩全身和拉筋。"],
  ["阅读", "22:30", "daily", "准备睡前读物。"],
  ["必睡 Deadline", "23:00", "daily", "睡帽、睡袜、闭口贴，低温时注意保暖。"],
  ["每周六物资补充", "10:00", "weekly", "处理纸巾、湿巾、垃圾袋、洗护、衣物和妆药补充。"]
];

let states = loadJson(CONFIG_STATES_KEY, [
  {
    id: "awake",
    label: "我已起床",
    title: "离家事项",
    description: "来自 SOP：起床后到离家前，聚焦通勤、猫咪和出门准备。",
    items: [
      { id: "bed-air", icon: "🛏️", title: "床铺与通风", detail: "收拾床铺，开窗换气；确认纱窗锁死，风扇对流。", start: "06:30", end: "07:00" },
      { id: "morning-body", icon: "💪", title: "身体启动", detail: "帕梅拉 10 分钟、洗漱、温开水。", start: "06:40", end: "07:00" },
      { id: "cat-morning", icon: "🐾", title: "猫咪晨间照顾", detail: "铲屎，粮水清洁补充，准备湿粮或生骨肉。", start: "07:00", end: "07:30" },
      { id: "style-skincare", icon: "🧴", title: "发型和防晒", detail: "做发型、护肤，防晒霜不要漏。", start: "07:30", end: "07:50" },
      { id: "commute-kit", icon: "🎒", title: "通勤物品", detail: "纸巾、湿巾、湿厕纸、漱口水、清香剂、耳机。", start: "07:35", end: "07:50" },
      { id: "out-list", icon: "✅", title: "出门清单", detail: "充电宝、充电器、防晒霜；再确认门窗和电器。", start: "07:45", end: "07:55" }
    ]
  },
  {
    id: "away",
    label: "我已离家",
    title: "外出事项",
    description: "离家后保留远程确认、当日计划和回家前采购准备。",
    items: [
      { id: "lock", icon: "🚪", title: "确认门已锁好", detail: "离家后再看一眼门锁状态。", start: "08:00", end: "08:05" },
      { id: "schedule", icon: "📅", title: "查看今天日程", detail: "确认会议、通勤和要处理的事项。", start: "08:05", end: "08:15" },
      { id: "work-note", icon: "📝", title: "记录路上小事", detail: "把路上想到的待办、购物和总结素材先收下来。", start: "18:00", end: "19:00" },
      { id: "shopping-check", icon: "🛒", title: "回家前采购", detail: "对照待买和物资补充：键盘鼠标、洗面奶、纸巾、湿巾、洗护、妆药。", start: "18:30", end: "19:20" }
    ]
  },
  {
    id: "home",
    label: "我已回家",
    title: "回家整理",
    description: "来自 Rules：回家先洗手，外包装不进家门，外衣裤鞋不进卧室。",
    items: [
      { id: "package-rule", icon: "📦", title: "外包装处理", detail: "快递外包装盒禁止带入家门。", start: "19:20", end: "19:30" },
      { id: "wash-first", icon: "🧼", title: "回家第一步洗手", detail: "进门后先洗手，再做其他事。", start: "19:20", end: "19:30" },
      { id: "home-clothes", icon: "👚", title: "切换居家服", detail: "禁止穿外衣裤鞋进入卧室，将家居服挂在卧室外。", start: "19:25", end: "19:35" },
      { id: "dinner-clean", icon: "🛁", title: "晚间洗澡护理", detail: "19:30 后进入洗澡、护理、清洁，开窗通风 15 分钟。", start: "19:30", end: "20:20" },
      { id: "clean-list", icon: "🧽", title: "清洁清单", detail: "眉毛、指甲、耳朵、鼻子、肚脐、床铺、手机、耳机、猫咪换水补粮。", start: "19:30", end: "20:20" }
    ]
  },
  {
    id: "sleep",
    label: "我准备睡觉",
    title: "睡前准备",
    description: "睡前阶段只保留总结、学习、阅读和强制停机。",
    items: [
      { id: "summary-plan", icon: "📓", title: "总结和计划", detail: "20:50 做工作总结、生活总结、明日清点、每周计划。", start: "20:50", end: "21:25" },
      { id: "tomorrow-plan", icon: "👗", title: "明日准备", detail: "明日发型、明日穿着、明日食谱。", start: "21:25", end: "21:40" },
      { id: "phone-stop", icon: "📵", title: "22 点后禁手机", detail: "Rules：晚上 10 点后禁止看手机；21:40 开始收起手机。", start: "21:40", end: "22:00" },
      { id: "study-feet", icon: "🦶", title: "学习和泡脚", detail: "21:40-22:00 学习，泡脚和脚底按摩。", start: "21:40", end: "22:00" },
      { id: "yoga-reading", icon: "📖", title: "瑜伽和阅读", detail: "22:00 瑜伽拉筋，22:30 阅读睡前读物。", start: "22:00", end: "22:50" },
      { id: "sleep-deadline", icon: "🛌", title: "23:00 必睡", detail: "睡帽、睡袜、闭口贴；温度较低时佩戴保暖物。", start: "22:50", end: "23:00" }
    ]
  }
]);

const elements = {
  clock: document.querySelector("#clock"),
  dateLabel: document.querySelector("#dateLabel"),
  butlerSummary: document.querySelector("#butlerSummary"),
  captureForm: document.querySelector("#captureForm"),
  captureInput: document.querySelector("#captureInput"),
  speakButlerButton: document.querySelector("#speakButlerButton"),
  proactiveList: document.querySelector("#proactiveList"),
  speakProactiveButton: document.querySelector("#speakProactiveButton"),
  agentForm: document.querySelector("#agentForm"),
  agentInput: document.querySelector("#agentInput"),
  agentSendButton: document.querySelector("#agentSendButton"),
  agentReply: document.querySelector("#agentReply"),
  agentActionList: document.querySelector("#agentActionList"),
  speakAgentButton: document.querySelector("#speakAgentButton"),
  agentStatus: document.querySelector("#agentStatus"),
  exportConfigButton: document.querySelector("#exportConfigButton"),
  importConfigInput: document.querySelector("#importConfigInput"),
  cloudConfigForm: document.querySelector("#cloudConfigForm"),
  cloudConfigUrlInput: document.querySelector("#cloudConfigUrlInput"),
  cloudSyncIntervalInput: document.querySelector("#cloudSyncIntervalInput"),
  syncCloudConfigButton: document.querySelector("#syncCloudConfigButton"),
  pushCloudConfigButton: document.querySelector("#pushCloudConfigButton"),
  cloudSyncStatus: document.querySelector("#cloudSyncStatus"),
  stateTitle: document.querySelector("#stateTitle"),
  stateDescription: document.querySelector("#stateDescription"),
  stateButtons: document.querySelector("#stateButtons"),
  nextStateButton: document.querySelector("#nextStateButton"),
  moduleTitle: document.querySelector("#moduleTitle"),
  activeModule: document.querySelector("#activeModule"),
  resetModuleButton: document.querySelector("#resetModuleButton"),
  moduleList: document.querySelector("#moduleList"),
  weatherCard: document.querySelector("#weatherCard"),
  weatherForm: document.querySelector("#weatherForm"),
  cityInput: document.querySelector("#cityInput"),
  refreshWeatherButton: document.querySelector("#refreshWeatherButton"),
  deviceCard: document.querySelector("#deviceCard"),
  haForm: document.querySelector("#haForm"),
  haUrlInput: document.querySelector("#haUrlInput"),
  haTokenInput: document.querySelector("#haTokenInput"),
  haEntityInput: document.querySelector("#haEntityInput"),
  refreshDeviceButton: document.querySelector("#refreshDeviceButton"),
  domainList: document.querySelector("#domainList"),
  inboxList: document.querySelector("#inboxList"),
  clearInboxButton: document.querySelector("#clearInboxButton"),
  timeline: document.querySelector("#timeline"),
  todayCount: document.querySelector("#todayCount"),
  reminderList: document.querySelector("#reminderList"),
  form: document.querySelector("#reminderForm"),
  titleInput: document.querySelector("#titleInput"),
  timeInput: document.querySelector("#timeInput"),
  repeatInput: document.querySelector("#repeatInput"),
  messageInput: document.querySelector("#messageInput"),
  voiceInput: document.querySelector("#voiceInput"),
  notifyInput: document.querySelector("#notifyInput"),
  requestNotify: document.querySelector("#requestNotify"),
  demoReminder: document.querySelector("#demoReminder"),
  refreshAppButton: document.querySelector("#refreshAppButton"),
  seedButton: document.querySelector("#seedButton"),
  speakButton: document.querySelector("#speakButton"),
  installButton: document.querySelector("#installButton"),
  timelineTemplate: document.querySelector("#timelineItemTemplate"),
  reminderTemplate: document.querySelector("#reminderTemplate")
};

let reminders = loadJson(STORAGE_KEY, []);
let completed = loadJson(COMPLETED_KEY, {});
let currentStateId = localStorage.getItem(STATE_KEY) || "awake";
let moduleDone = loadJson(MODULE_DONE_KEY, {});
let weatherCity = localStorage.getItem(WEATHER_CITY_KEY) || "Shanghai";
let weatherCache = loadJson(WEATHER_CACHE_KEY, null);
let haSettings = loadJson(HA_SETTINGS_KEY, {
  url: "http://localhost:8123",
  token: "",
  entityId: "climate.bedroom_ac"
});
let inboxItems = loadJson(INBOX_KEY, []).map(normalizeInboxItem).filter(Boolean);
let cloudConfig = loadJson(CLOUD_CONFIG_KEY, {
  url: "",
  intervalMinutes: 0,
  lastSyncAt: "",
  autoSync: false
});
let deviceState = null;
let deviceError = "";
let lastAgentReplyText = "";
let agentConnected = false;
let installEvent = null;
let notifiedSlots = new Set();

init();

function init() {
  const missing = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([key]) => key);
  if (missing.length > 0) {
    console.error(`PeaceLife 页面结构不完整：${missing.join(", ")}`);
    return;
  }
  setDefaultTime();
  elements.cityInput.value = weatherCity;
  elements.haUrlInput.value = haSettings.url || "";
  elements.haTokenInput.value = haSettings.token || "";
  elements.haEntityInput.value = haSettings.entityId || "";
  elements.cloudConfigUrlInput.value = cloudConfig.url || "";
  elements.cloudSyncIntervalInput.value = String(cloudConfig.intervalMinutes || 0);
  render();
  tick();
  setInterval(tick, 1000);
  setInterval(checkDueReminders, 15000);
  setInterval(checkCloudAutoSync, 60000);
  bindEvents();
  registerServiceWorker();
  refreshAgentStatus();
  refreshWeather(false);
  refreshDevice(false);
}

function bindEvents() {
  elements.captureForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.captureInput.value.trim();
    if (!title) return;
    addInboxItem(title);
    elements.captureForm.reset();
  });

  elements.speakButlerButton.addEventListener("click", () => {
    speakText(getButlerSummaryText());
  });

  elements.speakProactiveButton.addEventListener("click", () => {
    speakText(getProactiveSummaryText());
  });

  elements.proactiveList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-proactive-action]");
    if (!button) return;
    addInboxItem(button.dataset.proactiveAction);
    button.textContent = "已加入";
    button.disabled = true;
  });

  elements.agentForm.addEventListener("submit", handleAgentSubmit);

  elements.speakAgentButton.addEventListener("click", () => {
    if (lastAgentReplyText) speakText(lastAgentReplyText);
  });

  elements.agentActionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-agent-action]");
    if (!button) return;
    addInboxItem(button.dataset.agentAction);
    button.textContent = "已加入";
    button.disabled = true;
  });

  elements.exportConfigButton.addEventListener("click", exportConfigWorkbook);
  elements.importConfigInput.addEventListener("change", importConfigWorkbook);
  elements.cloudConfigForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCloudConfigFromInputs();
    renderCloudSyncStatus();
  });
  elements.syncCloudConfigButton.addEventListener("click", () => syncCloudConfig(true));
  elements.pushCloudConfigButton.addEventListener("click", pushCloudConfig);

  elements.nextStateButton.addEventListener("click", () => {
    currentStateId = getNextState().id;
    localStorage.setItem(STATE_KEY, currentStateId);
    render();
  });

  elements.activeModule.addEventListener("change", (event) => {
    const input = event.target.closest("[data-module-item]");
    if (!input) return;
    moduleDone[getModuleItemKey(input.dataset.moduleItem)] = input.checked;
    saveJson(MODULE_DONE_KEY, moduleDone);
    renderModuleSummary();
  });

  elements.resetModuleButton.addEventListener("click", () => {
    const state = getCurrentState();
    for (const item of state.items) {
      delete moduleDone[getModuleItemKey(item.id)];
    }
    saveJson(MODULE_DONE_KEY, moduleDone);
    render();
  });

  elements.weatherForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const city = elements.cityInput.value.trim();
    if (!city) return;
    weatherCity = city;
    localStorage.setItem(WEATHER_CITY_KEY, weatherCity);
    refreshWeather(true);
  });

  elements.refreshWeatherButton.addEventListener("click", () => refreshWeather(true));
  elements.refreshDeviceButton.addEventListener("click", () => refreshDevice(true));

  elements.haForm.addEventListener("submit", (event) => {
    event.preventDefault();
    haSettings = {
      url: normalizeHaUrl(elements.haUrlInput.value),
      token: elements.haTokenInput.value.trim(),
      entityId: elements.haEntityInput.value.trim()
    };
    saveJson(HA_SETTINGS_KEY, haSettings);
    refreshDevice(true);
  });

  elements.deviceCard.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-device-action]");
    if (!action) return;
    await handleDeviceAction(action.dataset.deviceAction);
  });

  elements.inboxList.addEventListener("change", (event) => {
    const input = event.target.closest("[data-inbox-item]");
    if (!input) return;
    const item = inboxItems.find((entry) => entry.id === input.dataset.inboxItem);
    if (!item) return;
    item.done = input.checked;
    saveJson(INBOX_KEY, inboxItems);
    render();
  });

  elements.clearInboxButton.addEventListener("click", () => {
    inboxItems = inboxItems.filter((item) => !item.done);
    saveJson(INBOX_KEY, inboxItems);
    render();
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const reminder = {
      id: createId(),
      title: elements.titleInput.value.trim(),
      time: elements.timeInput.value,
      repeat: elements.repeatInput.value,
      message: elements.messageInput.value.trim(),
      voice: elements.voiceInput.checked,
      notify: elements.notifyInput.checked,
      active: true,
      createdAt: new Date().toISOString()
    };

    reminders.push(reminder);
    saveReminders();
    elements.form.reset();
    elements.voiceInput.checked = true;
    elements.notifyInput.checked = true;
    setDefaultTime();
    render();
  });

  elements.requestNotify.addEventListener("click", requestNotificationPermission);
  elements.demoReminder.addEventListener("click", addDemoReminder);
  elements.refreshAppButton.addEventListener("click", refreshApp);
  elements.seedButton.addEventListener("click", seedReminders);
  elements.speakButton.addEventListener("click", speakActiveModule);

  elements.reminderList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    const reminder = reminders.find((item) => item.id === card.dataset.id);
    if (!reminder) return;

    if (event.target.closest(".delete-button")) {
      reminders = reminders.filter((item) => item.id !== reminder.id);
      saveReminders();
      render();
    }

    if (event.target.closest(".toggle-button")) {
      reminder.active = !reminder.active;
      saveReminders();
      render();
    }
  });

  elements.timeline.addEventListener("click", (event) => {
    const item = event.target.closest("[data-complete-key]");
    if (!item || !event.target.closest(".complete-button")) return;
    completed[item.dataset.completeKey] = true;
    saveJson(COMPLETED_KEY, completed);
    render();
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event;
    elements.installButton.hidden = false;
  });

  elements.installButton.addEventListener("click", async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    installEvent = null;
    elements.installButton.hidden = true;
  });
}

function tick() {
  const now = new Date();
  elements.clock.textContent = now.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
  elements.dateLabel.textContent = now.toLocaleDateString("zh-CN", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
  checkDueReminders();
}

function render() {
  const today = getTodayOccurrences();
  renderButler(today);
  renderProactive(today);
  renderStateButtons();
  renderActiveModule();
  renderModuleSummary();
  renderWeather();
  renderDevice();
  renderDomains();
  renderInbox();
  renderCloudSyncStatus();
  renderTimeline(today);
  renderReminderList();
}

function renderStateButtons() {
  const nextState = getNextState();
  elements.nextStateButton.dataset.state = nextState.id;
  elements.nextStateButton.textContent = nextState.label;
}

async function refreshAgentStatus() {
  try {
    const response = await fetch("/api/agent/status");
    const status = await response.json();
    agentConnected = Boolean(status.connected);
    const providerLabel = getProviderLabel(status.provider || status.mode);
    elements.agentStatus.textContent = agentConnected
      ? `AI 已连接 · ${providerLabel} · ${status.model || "模型"}`
      : "AI 未连接";
    elements.agentStatus.classList.toggle("is-online", agentConnected);
    elements.agentStatus.classList.toggle("is-offline", !agentConnected);
    if (!agentConnected) renderAgentDisconnected();
  } catch {
    agentConnected = false;
    elements.agentStatus.textContent = "AI 未连接";
    elements.agentStatus.classList.remove("is-online");
    elements.agentStatus.classList.add("is-offline");
    renderAgentDisconnected();
  }
}

function renderAgentDisconnected() {
  lastAgentReplyText = "";
  elements.agentActionList.innerHTML = "";
  elements.agentReply.innerHTML = `
    <article class="agent-answer">
      <div class="agent-answer-head">
        <strong>AI Agent 未连接</strong>
        <span>需要服务器密钥</span>
      </div>
      <p>现在不会使用本地规则假装 AI。请在启动 PeaceLife 服务器前配置 OPENAI_API_KEY，然后重启服务器。</p>
      <ol>
        <li>在 PowerShell 执行：$env:OPENAI_API_KEY="你的 OpenAI API Key"</li>
        <li>进入 E:\\Project\\Ohters\\PeaceLife 后执行：node server.mjs</li>
        <li>刷新页面后看到“AI 已连接”，再向管家提问。</li>
      </ol>
    </article>
  `;
}

function getProviderLabel(provider) {
  if (provider === "deepseek") return "DeepSeek";
  if (provider === "openai") return "OpenAI";
  return "AI";
}

async function handleAgentSubmit(event) {
  event.preventDefault();
  const message = elements.agentInput.value.trim();
  if (!message) return;

  elements.agentSendButton.disabled = true;
  elements.agentReply.innerHTML = `<p class="empty">管家正在结合你的当前生活状态分析。</p>`;
  elements.agentActionList.innerHTML = "";

  try {
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: getAgentContext()
      })
    });

    const data = await response.json();
    if (!response.ok) {
      if (data.error === "AI_NOT_CONFIGURED") {
        renderAgentDisconnected();
        return;
      }
      throw new Error(data.detail || data.message || `服务返回 ${response.status}`);
    }
    renderAgentReply(data);
    elements.agentInput.value = "";
  } catch (error) {
    lastAgentReplyText = "";
    elements.agentReply.innerHTML = `
      <p class="agent-error">AI Agent 暂时没接上：${escapeHtml(error.message)}</p>
      <p class="agent-note">确认服务器已配置 OPENAI_API_KEY，并且网络可以访问 OpenAI API。</p>
    `;
  } finally {
    elements.agentSendButton.disabled = false;
  }
}

function getAgentContext() {
  const state = getCurrentState();
  const moduleItems = getModuleItems(state);
  const today = getTodayOccurrences();
  return {
    now: new Date().toISOString(),
    lifeState: {
      id: state.id,
      label: state.label,
      title: state.title,
      description: state.description
    },
    nextLifeState: {
      id: getNextState().id,
      label: getNextState().label
    },
    currentModuleItems: moduleItems.map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      time: formatTimeRange(item),
      done: Boolean(moduleDone[getModuleItemKey(item.id)])
    })),
    weather: weatherCache && !weatherCache.error ? {
      city: weatherCache.city,
      temperature: weatherCache.temperature,
      apparent: weatherCache.apparent,
      humidity: weatherCache.humidity,
      description: weatherCache.description,
      advice: weatherCache.advice,
      stateAdvice: getStateWeatherAdvice()
    } : null,
    reminders: today.slice(0, 8).map((item) => ({
      title: item.reminder.title,
      time: item.time,
      message: item.reminder.message,
      done: item.done
    })),
    inbox: inboxItems.slice(0, 12).map((item) => ({
      title: item.title,
      done: item.done,
      createdAt: item.createdAt,
      domain: item.domain || inferInboxMeta(item.title).domain,
      urgency: item.urgency || inferInboxMeta(item.title).urgency,
      nextAction: item.nextAction || inferInboxMeta(item.title).nextAction
    })),
    device: deviceState ? {
      entityId: haSettings.entityId,
      state: deviceState.state,
      friendlyName: deviceState.attributes?.friendly_name,
      currentTemperature: deviceState.attributes?.current_temperature,
      targetTemperature: deviceState.attributes?.temperature
    } : null
  };
}

function renderAgentReply(data) {
  const title = data.title || "管家建议";
  const summary = data.summary || "我已经看过当前状态，可以先处理下面这些事项。";
  const steps = Array.isArray(data.steps) ? data.steps.filter(Boolean).slice(0, 6) : [];
  const actions = Array.isArray(data.actions) ? data.actions.filter(Boolean).slice(0, 5) : [];
  const providerLabel = getProviderLabel(data.provider || data.mode);
  const mode = data.model ? `AI Agent · ${providerLabel} · ${data.model}` : `AI Agent · ${providerLabel}`;

  lastAgentReplyText = [title, summary, ...steps].join("。");
  elements.agentReply.innerHTML = `
    <article class="agent-answer">
      <div class="agent-answer-head">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(mode)}</span>
      </div>
      <p>${escapeHtml(summary)}</p>
      ${steps.length ? `<ol>${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}
    </article>
  `;

  elements.agentActionList.innerHTML = actions.length
    ? actions.map((action) => `
      <button class="agent-action" type="button" data-agent-action="${escapeHtml(action)}">
        <span>${escapeHtml(action)}</span>
        <strong>加入临时事项</strong>
      </button>
    `).join("")
    : "";
}

function exportConfigWorkbook() {
  const payload = getConfigPayload();
  const sheets = [
    buildSheet("说明", [
      ["字段", "说明"],
      ["生活状态", "编辑状态 id、显示名、模块标题、说明、顺序。id 不建议随意改。"],
      ["阶段事项", "每行一个事项，stateId 对应生活状态 id；start/end 格式为 HH:mm。"],
      ["定时提醒", "repeat 可填 once/daily/weekdays/weekends/weekly；active/voice/notify 填 TRUE 或 FALSE。"],
      ["临时事项", "done 填 TRUE 或 FALSE；domain/urgency/nextAction 可留空，PeaceLife 会自动分拣。"],
      ["基础设置", "可编辑天气城市、当前状态、Home Assistant 地址和实体；Token、AI Key 不会导出。"]
    ]),
    buildSheet("生活状态", [
      ["id", "label", "title", "description", "order"],
      ...payload.states.map((state) => [state.id, state.label, state.title, state.description, String(state.order)])
    ]),
    buildSheet("阶段事项", [
      ["stateId", "itemId", "icon", "title", "detail", "start", "end", "order"],
      ...payload.moduleItems.map((item) => [
        item.stateId,
        item.itemId,
        item.icon,
        item.title,
        item.detail,
        item.start,
        item.end,
        String(item.order)
      ])
    ]),
    buildSheet("定时提醒", [
      ["id", "title", "time", "repeat", "message", "voice", "notify", "active", "createdAt"],
      ...payload.reminders.map((reminder) => [
        reminder.id,
        reminder.title,
        reminder.time,
        reminder.repeat,
        reminder.message || "",
        boolToExcel(reminder.voice),
        boolToExcel(reminder.notify),
        boolToExcel(reminder.active),
        reminder.createdAt || new Date().toISOString()
      ])
    ]),
    buildSheet("临时事项", [
      ["id", "title", "done", "createdAt", "domain", "urgency", "nextAction"],
      ...payload.inbox.map((item) => [
        item.id,
        item.title,
        boolToExcel(item.done),
        item.createdAt,
        item.domain,
        item.urgency,
        item.nextAction
      ])
    ]),
    buildSheet("基础设置", [
      ["key", "value", "note"],
      ["weatherCity", payload.settings.weatherCity, "天气城市"],
      ["currentStateId", payload.settings.currentStateId, "当前生活状态 id"],
      ["haUrl", payload.settings.haUrl, "Home Assistant 地址"],
      ["haEntityId", payload.settings.haEntityId, "设备实体 id"],
      ["exportedAt", new Date().toISOString(), "导出时间，只读"]
    ])
  ];

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>PeaceLife 配置</Title>
    <Created>${escapeXml(new Date().toISOString())}</Created>
  </DocumentProperties>
  ${sheets.join("\n")}
</Workbook>`;

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `PeaceLife配置-${getDateKey(new Date())}.xls`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function getConfigPayload() {
  return {
    states: states.map((state, index) => ({
      id: state.id,
      label: state.label,
      title: state.title,
      description: state.description,
      order: index + 1
    })),
    moduleItems: states.flatMap((state) => getModuleItems(state).map((item, index) => ({
      stateId: state.id,
      itemId: item.id,
      id: item.id,
      icon: item.icon,
      title: item.title,
      detail: item.detail,
      start: item.start || "",
      end: item.end || "",
      order: index + 1
    }))),
    reminders: reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      time: reminder.time,
      repeat: reminder.repeat,
      message: reminder.message || "",
      voice: Boolean(reminder.voice),
      notify: Boolean(reminder.notify),
      active: Boolean(reminder.active),
      createdAt: reminder.createdAt || new Date().toISOString()
    })),
    inbox: inboxItems.map((item) => ({
      id: item.id,
      title: item.title,
      done: Boolean(item.done),
      createdAt: item.createdAt || new Date().toISOString(),
      domain: item.domain || inferInboxMeta(item.title).domain,
      urgency: item.urgency || inferInboxMeta(item.title).urgency,
      nextAction: item.nextAction || inferInboxMeta(item.title).nextAction
    })),
    settings: {
      weatherCity,
      currentStateId,
      haUrl: haSettings.url || "",
      haEntityId: haSettings.entityId || ""
    }
  };
}

async function importConfigWorkbook(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const sheets = parseWorkbookXml(text);
    const nextStates = parseStatesSheet(sheets);
    const nextReminders = parseRemindersSheet(sheets);
    const nextInboxItems = parseInboxSheet(sheets);
    const nextSettings = parseSettingsSheet(sheets);

    if (!nextStates.length) throw new Error("没有找到有效的“生活状态/阶段事项”配置。");
    if (!confirm("导入会覆盖生活状态、阶段事项、提醒、临时事项和基础设置。确定继续吗？")) return;

    applyConfigData({
      states: nextStates,
      reminders: nextReminders,
      inbox: nextInboxItems,
      settings: nextSettings
    });
    alert("Excel 配置已导入。");
  } catch (error) {
    alert(`导入失败：${error.message}`);
  }
}

async function syncCloudConfig(manual = false) {
  saveCloudConfigFromInputs();
  if (!cloudConfig.url) {
    if (manual) alert("请先填写云文档接口地址。");
    return;
  }

  elements.cloudSyncStatus.textContent = "正在同步云文档配置。";
  elements.syncCloudConfigButton.disabled = true;

  try {
    const response = await fetchCloudConfig(cloudConfig.url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.error || `云文档返回 ${response.status}`);
    applyCloudConfigData(data);
    cloudConfig.lastSyncAt = new Date().toISOString();
    saveJson(CLOUD_CONFIG_KEY, cloudConfig);
    render();
    if (manual) alert("云文档配置已同步。");
  } catch (error) {
    elements.cloudSyncStatus.textContent = `云同步失败：${error.message}`;
    if (manual) alert(`云同步失败：${error.message}`);
  } finally {
    elements.syncCloudConfigButton.disabled = false;
  }
}

async function pushCloudConfig() {
  saveCloudConfigFromInputs();
  if (!cloudConfig.url) {
    alert("请先填写云文档接口地址。");
    return;
  }

  if (!confirm("这会把当前本地配置写入云文档，用于初始化或覆盖云端配置。确定继续吗？")) return;

  elements.cloudSyncStatus.textContent = "正在初始化云文档。";
  elements.pushCloudConfigButton.disabled = true;

  try {
    const response = await pushCloudConfigPayload(cloudConfig.url, getConfigPayload());
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.error || `云文档返回 ${response.status}`);
    cloudConfig.lastSyncAt = new Date().toISOString();
    saveJson(CLOUD_CONFIG_KEY, cloudConfig);
    renderCloudSyncStatus();
    alert("当前本地配置已写入云文档。");
  } catch (error) {
    elements.cloudSyncStatus.textContent = `初始化云文档失败：${error.message}`;
    alert(`初始化云文档失败：${error.message}`);
  } finally {
    elements.pushCloudConfigButton.disabled = false;
  }
}

async function fetchCloudConfig(url) {
  const parsed = validateCloudConfigUrl(url);
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return fetch("/api/cloud-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: parsed.href })
    });
  }

  parsed.searchParams.set("t", String(Date.now()));
  return fetch(parsed.href, {
    headers: {
      Accept: "application/json,text/plain,*/*"
    }
  });
}

async function pushCloudConfigPayload(url, config) {
  const parsed = validateCloudConfigUrl(url);
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return fetch("/api/cloud-config/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: parsed.href,
        config
      })
    });
  }

  return fetch(parsed.href, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      Accept: "application/json,text/plain,*/*"
    },
    body: JSON.stringify({
      action: "replaceConfig",
      config
    })
  });
}

function validateCloudConfigUrl(value) {
  const text = String(value || "").trim();
  if (!text) throw new Error("请先填写云文档接口地址。");
  const parsed = new URL(text);
  if (parsed.hostname === "docs.google.com" && parsed.pathname.includes("/spreadsheets/")) {
    throw new Error("请填写 Apps Script Web App URL，不是 Google Sheet 页面地址。");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("云文档接口只支持 http 或 https 地址。");
  }
  return parsed;
}

function checkCloudAutoSync() {
  if (!cloudConfig.url || !cloudConfig.autoSync || !cloudConfig.intervalMinutes) return;
  const last = cloudConfig.lastSyncAt ? new Date(cloudConfig.lastSyncAt).getTime() : 0;
  const due = Date.now() - last >= cloudConfig.intervalMinutes * 60000;
  if (due) syncCloudConfig(false);
}

function renderCloudSyncStatus() {
  if (!cloudConfig.url) {
    elements.cloudSyncStatus.textContent = "未配置云文档同步。";
    return;
  }

  const interval = cloudConfig.intervalMinutes > 0 ? `每 ${cloudConfig.intervalMinutes} 分钟自动同步` : "自动同步已关闭";
  const last = cloudConfig.lastSyncAt
    ? new Date(cloudConfig.lastSyncAt).toLocaleString("zh-CN", { hour12: false })
    : "尚未同步";
  elements.cloudSyncStatus.textContent = `${interval} · 上次同步：${last}`;
}

function saveCloudConfigFromInputs() {
  cloudConfig = {
    ...cloudConfig,
    url: elements.cloudConfigUrlInput.value.trim(),
    intervalMinutes: Number(elements.cloudSyncIntervalInput.value || 0),
    autoSync: Number(elements.cloudSyncIntervalInput.value || 0) > 0
  };
  saveJson(CLOUD_CONFIG_KEY, cloudConfig);
}

function applyCloudConfigData(data) {
  const nextStates = Array.isArray(data.states) ? normalizeCloudStates(data.states, data.moduleItems || data.items) : [];
  if (!nextStates.length) throw new Error("云文档没有返回有效 states。");
  applyConfigData({
    states: nextStates,
    reminders: Array.isArray(data.reminders) ? data.reminders.map(normalizeCloudReminder).filter(Boolean) : reminders,
    inbox: Array.isArray(data.inbox) ? data.inbox.map(normalizeCloudInboxItem).filter(Boolean) : inboxItems,
    settings: data.settings || {}
  });
}

function applyConfigData(config) {
  states = config.states;
  reminders = config.reminders;
  inboxItems = (config.inbox || []).map(normalizeInboxItem).filter(Boolean);
  localStorage.setItem(CONFIG_STATES_KEY, JSON.stringify(states));
  saveReminders();
  saveJson(INBOX_KEY, inboxItems);

  const nextSettings = config.settings || {};
  if (nextSettings.weatherCity) {
    weatherCity = nextSettings.weatherCity;
    localStorage.setItem(WEATHER_CITY_KEY, weatherCity);
    elements.cityInput.value = weatherCity;
  }
  if (nextSettings.currentStateId && states.some((state) => state.id === nextSettings.currentStateId)) {
    currentStateId = nextSettings.currentStateId;
    localStorage.setItem(STATE_KEY, currentStateId);
  }
  haSettings = {
    ...haSettings,
    url: nextSettings.haUrl || haSettings.url,
    entityId: nextSettings.haEntityId || haSettings.entityId
  };
  saveJson(HA_SETTINGS_KEY, haSettings);
  elements.haUrlInput.value = haSettings.url || "";
  elements.haEntityInput.value = haSettings.entityId || "";
  render();
}

function buildSheet(name, rows) {
  const body = rows
    .map((row) => `<Row>${row.map((cell) => buildCell(cell)).join("")}</Row>`)
    .join("\n");
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${body}</Table></Worksheet>`;
}

function buildCell(value) {
  return `<Cell><Data ss:Type="String">${escapeXml(value ?? "")}</Data></Cell>`;
}

function parseWorkbookXml(text) {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("Excel 文件格式无法解析。请导入从 PeaceLife 导出的 .xls 文件。");
  const result = {};
  for (const worksheet of Array.from(doc.getElementsByTagName("Worksheet"))) {
    const name = worksheet.getAttribute("ss:Name") || worksheet.getAttribute("Name");
    if (!name) continue;
    const rows = Array.from(worksheet.getElementsByTagName("Row")).map((row) =>
      Array.from(row.getElementsByTagName("Cell")).map((cell) => cell.textContent || "")
    );
    result[name] = rows;
  }
  return result;
}

function parseStatesSheet(sheets) {
  const stateRows = tableRows(sheets["生活状态"]);
  const itemRows = tableRows(sheets["阶段事项"]);
  const nextStates = stateRows
    .filter((row) => row.id && row.label)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((row) => ({
      id: row.id.trim(),
      label: row.label.trim(),
      title: row.title || row.label,
      description: row.description || "",
      items: []
    }));
  const byId = new Map(nextStates.map((state) => [state.id, state]));
  for (const row of itemRows.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))) {
    const state = byId.get(row.stateId);
    if (!state || !row.title) continue;
    state.items.push({
      id: row.itemId || createId(),
      icon: row.icon || "•",
      title: row.title,
      detail: row.detail || "",
      start: row.start || "",
      end: row.end || ""
    });
  }
  return nextStates;
}

function parseRemindersSheet(sheets) {
  return tableRows(sheets["定时提醒"])
    .filter((row) => row.title && row.time)
    .map((row) => ({
      id: row.id || createId(),
      title: row.title,
      time: row.time,
      repeat: repeatLabels[row.repeat] ? row.repeat : "daily",
      message: row.message || "",
      voice: parseExcelBool(row.voice, true),
      notify: parseExcelBool(row.notify, true),
      active: parseExcelBool(row.active, true),
      createdAt: row.createdAt || new Date().toISOString()
    }));
}

function parseInboxSheet(sheets) {
  return tableRows(sheets["临时事项"])
    .filter((row) => row.title)
    .map((row) => normalizeInboxItem({
      id: row.id || createId(),
      title: row.title,
      done: parseExcelBool(row.done, false),
      createdAt: row.createdAt || new Date().toISOString(),
      domain: row.domain,
      urgency: row.urgency,
      nextAction: row.nextAction
    }))
    .filter(Boolean);
}

function parseSettingsSheet(sheets) {
  const settings = {};
  for (const row of tableRows(sheets["基础设置"])) {
    if (row.key) settings[row.key] = row.value || "";
  }
  return settings;
}

function normalizeCloudStates(cloudStates, cloudItems = []) {
  const nextStates = cloudStates
    .filter((state) => state.id && state.label)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((state) => ({
      id: String(state.id).trim(),
      label: String(state.label).trim(),
      title: state.title || state.label,
      description: state.description || "",
      items: Array.isArray(state.items) ? state.items.map(normalizeCloudModuleItem).filter(Boolean) : []
    }));

  const byId = new Map(nextStates.map((state) => [state.id, state]));
  for (const item of cloudItems.sort((a, b) => Number(a.order || 0) - Number(b.order || 0))) {
    const state = byId.get(item.stateId);
    const normalized = normalizeCloudModuleItem(item);
    if (state && normalized) state.items.push(normalized);
  }

  return nextStates;
}

function normalizeCloudModuleItem(item) {
  if (!item || !item.title) return null;
  return {
    id: item.id || item.itemId || createId(),
    icon: item.icon || "•",
    title: item.title,
    detail: item.detail || "",
    start: item.start || "",
    end: item.end || ""
  };
}

function normalizeCloudReminder(reminder) {
  if (!reminder || !reminder.title || !reminder.time) return null;
  return {
    id: reminder.id || createId(),
    title: reminder.title,
    time: reminder.time,
    repeat: repeatLabels[reminder.repeat] ? reminder.repeat : "daily",
    message: reminder.message || "",
    voice: typeof reminder.voice === "boolean" ? reminder.voice : parseExcelBool(reminder.voice, true),
    notify: typeof reminder.notify === "boolean" ? reminder.notify : parseExcelBool(reminder.notify, true),
    active: typeof reminder.active === "boolean" ? reminder.active : parseExcelBool(reminder.active, true),
    createdAt: reminder.createdAt || new Date().toISOString()
  };
}

function normalizeCloudInboxItem(item) {
  if (!item || !item.title) return null;
  return normalizeInboxItem({
    id: item.id || createId(),
    title: item.title,
    done: typeof item.done === "boolean" ? item.done : parseExcelBool(item.done, false),
    createdAt: item.createdAt || new Date().toISOString(),
    domain: item.domain,
    urgency: item.urgency,
    nextAction: item.nextAction
  });
}

function tableRows(rows = []) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function parseExcelBool(value, fallback) {
  const text = String(value || "").trim().toLowerCase();
  if (["true", "yes", "y", "1", "是"].includes(text)) return true;
  if (["false", "no", "n", "0", "否"].includes(text)) return false;
  return fallback;
}

function boolToExcel(value) {
  return value ? "TRUE" : "FALSE";
}

function escapeXml(value) {
  return String(value ?? "").replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[char]));
}

function renderButler(today) {
  const cards = getButlerCards(today);
  elements.butlerSummary.innerHTML = cards
    .map((card) => `
      <article class="butler-card">
        <span aria-hidden="true">${card.icon}</span>
        <div>
          <strong>${escapeHtml(card.title)}</strong>
          <p>${escapeHtml(card.detail)}</p>
        </div>
      </article>
    `)
    .join("");
}

function getButlerCards(today = getTodayOccurrences()) {
  const state = getCurrentState();
  const moduleItems = getModuleItems(state);
  const finished = moduleItems.filter((item) => moduleDone[getModuleItemKey(item.id)]).length;
  const nextReminder = today.find((item) => !item.done);
  const pendingInbox = inboxItems.filter((item) => !item.done).length;
  const weatherAdvice = getStateWeatherAdvice();
  const cards = [
    {
      icon: "🧭",
      title: state.title,
      detail: `${state.label}：${finished}/${moduleItems.length} 项已完成。下一步按「${getNextState().label}」。`
    },
    {
      icon: "⏱️",
      title: nextReminder ? `下一提醒 ${nextReminder.time}` : "今日提醒",
      detail: nextReminder ? `${nextReminder.reminder.title}：${nextReminder.reminder.message || "到点处理。"}` : "今天没有更多固定提醒。"
    },
    {
      icon: weatherAdvice.icon,
      title: weatherAdvice.title,
      detail: weatherAdvice.detail
    },
    {
      icon: pendingInbox > 0 ? "📥" : "✅",
      title: pendingInbox > 0 ? "收件箱待处理" : "临时事项清爽",
      detail: pendingInbox > 0 ? `还有 ${pendingInbox} 条临时事项，晚间总结时清一下。` : "没有未处理的临时捕获。"
    }
  ];

  if (haSettings.token && deviceState) {
    cards.push({
      icon: "🌡️",
      title: "设备在线",
      detail: `${deviceState.attributes?.friendly_name || haSettings.entityId}：${formatDeviceState(deviceState.state)}。`
    });
  }

  return cards.slice(0, 5);
}

function getButlerSummaryText() {
  return getButlerCards()
    .map((card) => `${card.title}，${card.detail}`)
    .join("。");
}

function renderProactive(today = getTodayOccurrences()) {
  const suggestions = getProactiveSuggestions(today);

  if (suggestions.length === 0) {
    elements.proactiveList.innerHTML = `<p class="empty">当前没有需要主动提醒的事项。保持这个节奏就很好。</p>`;
    return;
  }

  elements.proactiveList.innerHTML = suggestions
    .map((suggestion) => `
      <article class="proactive-card priority-${suggestion.priority}">
        <span class="proactive-icon" aria-hidden="true">${suggestion.icon}</span>
        <div class="proactive-copy">
          <div>
            <strong>${escapeHtml(suggestion.title)}</strong>
            <em>${escapeHtml(suggestion.badge)}</em>
          </div>
          <p>${escapeHtml(suggestion.detail)}</p>
        </div>
        ${suggestion.action ? `
          <button class="proactive-action" type="button" data-proactive-action="${escapeHtml(suggestion.action)}">
            加入
          </button>
        ` : ""}
      </article>
    `)
    .join("");
}

function getProactiveSuggestions(today = getTodayOccurrences()) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const state = getCurrentState();
  const moduleItems = getModuleItems(state);
  const pendingModuleItems = moduleItems.filter((item) => !moduleDone[getModuleItemKey(item.id)]);
  const currentModuleItem = pendingModuleItems.find((item) => {
    const start = timeToMinutes(item.start);
    const end = timeToMinutes(item.end);
    return Number.isFinite(start) && Number.isFinite(end) && nowMinutes >= start && nowMinutes <= end;
  });
  const overdueModuleItem = pendingModuleItems.find((item) => {
    const end = timeToMinutes(item.end);
    return Number.isFinite(end) && nowMinutes > end;
  });
  const upcomingModuleItem = pendingModuleItems.find((item) => {
    const start = timeToMinutes(item.start);
    return Number.isFinite(start) && start > nowMinutes;
  });
  const nextReminder = today.find((item) => !item.done);
  const pendingInbox = inboxItems.filter((item) => !item.done);
  const suggestions = [];

  if (overdueModuleItem) {
    suggestions.push({
      priority: "high",
      icon: overdueModuleItem.icon || "⚠️",
      badge: "已超时",
      title: `确认 ${overdueModuleItem.title}`,
      detail: `${formatTimeRange(overdueModuleItem)} 的事项还没勾选。先确认是否已经完成，没完成就补上最小一步。`,
      action: `补做或确认：${overdueModuleItem.title}`
    });
  } else if (currentModuleItem) {
    suggestions.push({
      priority: "high",
      icon: currentModuleItem.icon || "▶",
      badge: "正在进行",
      title: currentModuleItem.title,
      detail: `${formatTimeRange(currentModuleItem)} 是当前阶段的重点。${currentModuleItem.detail}`,
      action: currentModuleItem.title
    });
  } else if (upcomingModuleItem) {
    const startsIn = timeToMinutes(upcomingModuleItem.start) - nowMinutes;
    suggestions.push({
      priority: startsIn <= 20 ? "high" : "normal",
      icon: upcomingModuleItem.icon || "⏳",
      badge: startsIn <= 20 ? `${startsIn} 分钟后` : "稍后",
      title: `准备 ${upcomingModuleItem.title}`,
      detail: `${formatTimeRange(upcomingModuleItem)} 开始。现在可以提前把要用的东西放到手边。`,
      action: `提前准备：${upcomingModuleItem.title}`
    });
  }

  if (nextReminder) {
    const dueMinutes = timeToMinutes(nextReminder.time);
    const minutesLeft = dueMinutes - nowMinutes;
    suggestions.push({
      priority: minutesLeft <= 15 ? "high" : "normal",
      icon: "⏱️",
      badge: minutesLeft >= 0 ? `${minutesLeft} 分钟后` : "待确认",
      title: nextReminder.reminder.title,
      detail: nextReminder.reminder.message || "下一条固定提醒即将到来。",
      action: minutesLeft <= 15 ? `准备提醒：${nextReminder.reminder.title}` : ""
    });
  }

  const weatherAdvice = getStateWeatherAdvice();
  if (weatherCache && !weatherCache.error && shouldPromoteWeatherAdvice()) {
    suggestions.push({
      priority: "normal",
      icon: weatherAdvice.icon,
      badge: "天气",
      title: weatherAdvice.title,
      detail: weatherAdvice.detail,
      action: weatherAdvice.detail.replace(/。$/, "")
    });
  }

  if (pendingInbox.length >= 3) {
    suggestions.push({
      priority: "normal",
      icon: "📥",
      badge: `${pendingInbox.length} 条`,
      title: "分拣临时事项",
      detail: "收件箱已经堆起来了。挑 3 条转成提醒、购物或今晚总结项。",
      action: "分拣临时事项"
    });
  } else if (pendingInbox.length > 0 && ["sleep", "home"].includes(currentStateId)) {
    suggestions.push({
      priority: "low",
      icon: "📥",
      badge: "收尾",
      title: "清一下收件箱",
      detail: `还有 ${pendingInbox.length} 条临时事项，适合在当前阶段顺手处理。`,
      action: "清理收件箱临时事项"
    });
  }

  if (haSettings.token && deviceState && currentStateId === "sleep") {
    const hvacMode = deviceState.attributes?.hvac_mode || deviceState.state;
    if (["heat", "cool", "dry", "fan_only", "on"].includes(String(hvacMode))) {
      suggestions.push({
        priority: "low",
        icon: "🌡️",
        badge: "设备",
        title: "睡前检查空调",
        detail: `${deviceState.attributes?.friendly_name || haSettings.entityId} 当前是 ${formatDeviceState(deviceState.state)}，睡前确认温度和模式。`,
        action: "睡前检查空调模式"
      });
    }
  }

  if (pendingModuleItems.length === 0) {
    suggestions.push({
      priority: "low",
      icon: "✅",
      badge: "阶段完成",
      title: `可以切到「${getNextState().label}」`,
      detail: `${state.title} 已经全部完成。如果生活状态已经变化，可以按顶部按钮进入下一阶段。`,
      action: ""
    });
  }

  return uniqueSuggestions(suggestions).slice(0, 5);
}

function shouldPromoteWeatherAdvice() {
  if (!weatherCache || weatherCache.error) return false;
  if (isRainyWeather(weatherCache.code)) return true;
  if (isSunnyWeather(weatherCache.code) && ["awake", "away"].includes(currentStateId)) return true;
  return weatherCache.temperature >= 30 || weatherCache.temperature <= 8;
}

function uniqueSuggestions(suggestions) {
  const seen = new Set();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.title}:${suggestion.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getProactiveSummaryText() {
  const suggestions = getProactiveSuggestions();
  if (suggestions.length === 0) return "当前没有需要主动提醒的事项。";
  return suggestions
    .map((suggestion) => `${suggestion.title}，${suggestion.detail}`)
    .join("。");
}

function renderActiveModule() {
  const state = getCurrentState();
  elements.stateTitle.textContent = state.label;
  elements.stateDescription.textContent = state.description;
  elements.moduleTitle.textContent = state.title;

  const moduleItems = getModuleItems(state);
  const finished = moduleItems.filter((item) => moduleDone[getModuleItemKey(item.id)]).length;
  const list = moduleItems
    .map((item) => {
      const key = getModuleItemKey(item.id);
      const checked = moduleDone[key] ? "checked" : "";
      return `
        <label class="module-check">
          <input type="checkbox" data-module-item="${escapeHtml(item.id)}" ${checked} />
          <span class="module-icon" aria-hidden="true">${item.icon}</span>
          <span class="module-copy">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="module-time">${escapeHtml(formatTimeRange(item))}</span>
            <small>${escapeHtml(item.detail)}</small>
          </span>
        </label>
      `;
    })
    .join("");
  const percent = moduleItems.length > 0 ? (finished / moduleItems.length) * 100 : 0;

  elements.activeModule.innerHTML = `
    <div class="module-meter" aria-label="当前模块完成度">
      <span style="width: ${percent}%"></span>
    </div>
    <p class="module-progress">${finished}/${moduleItems.length} 已完成</p>
    <div class="module-checklist">${list || `<p class="empty">这个阶段还没有配置事项，可以通过 Excel 导入。</p>`}</div>
  `;
}

function renderModuleSummary() {
  elements.moduleList.replaceChildren();
  const fragment = document.createDocumentFragment();

  for (const state of states) {
    const card = document.createElement("article");
    const moduleItems = getModuleItems(state);
    const finished = moduleItems.filter((item) => moduleDone[getModuleItemKey(item.id)]).length;
    card.className = "module-summary";
    card.classList.toggle("is-current", state.id === currentStateId);
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(state.title)}</h3>
        <p>${escapeHtml(state.label)} · ${finished}/${moduleItems.length}</p>
      </div>
    `;
    fragment.append(card);
  }

  elements.moduleList.append(fragment);
}

function renderDomains() {
  const current = currentStateId;
  const pendingInbox = inboxItems.filter((item) => !item.done).length;
  elements.domainList.innerHTML = domains
    .map((domain) => {
      const active = domain.states.includes(current);
      const score = getDomainScore(domain, pendingInbox);
      return `
        <article class="domain-card ${active ? "is-active" : ""}">
          <span aria-hidden="true">${domain.icon}</span>
          <div>
            <strong>${escapeHtml(domain.title)}</strong>
            <p>${escapeHtml(domain.detail)}</p>
          </div>
          <em>${score}</em>
        </article>
      `;
    })
    .join("");
}

function getDomainScore(domain, pendingInbox) {
  if (domain.id === "devices") return deviceState ? "在线" : "待连接";
  const domainPending = inboxItems
    .map((item) => normalizeInboxItem(item))
    .filter((item) => item && !item.done && item.domain === domain.id).length;
  if (domainPending > 0) return `${domainPending} 待办`;
  if (domain.id === "supplies" && pendingInbox > 0) return `${pendingInbox} 待分拣`;
  if (domain.states.includes(currentStateId)) return "当前";
  return "待机";
}

function renderInbox() {
  if (inboxItems.length === 0) {
    elements.inboxList.innerHTML = `<p class="empty">临时想到的事情可以先丢到这里。</p>`;
    return;
  }

  elements.inboxList.innerHTML = inboxItems
    .map((item) => {
      const normalized = normalizeInboxItem(item);
      const domain = getInboxDomain(normalized.domain);
      const urgency = getInboxUrgency(normalized.urgency);
      const time = new Date(item.createdAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit"
      });
      return `
        <label class="inbox-item ${normalized.done ? "is-done" : ""} urgency-${escapeHtml(normalized.urgency)}">
          <input type="checkbox" data-inbox-item="${escapeHtml(normalized.id)}" ${normalized.done ? "checked" : ""} />
          <span class="inbox-main">
            <strong>${escapeHtml(normalized.title)}</strong>
            <small>${escapeHtml(normalized.nextAction)}</small>
          </span>
          <span class="inbox-meta">
            <em>${domain.icon} ${escapeHtml(domain.title)}</em>
            <em>${escapeHtml(urgency.label)}</em>
            <small>${time}</small>
          </span>
        </label>
      `;
    })
    .join("");
}

function addInboxItem(title) {
  const value = String(title || "").trim();
  if (!value) return;
  inboxItems.unshift(normalizeInboxItem({
    id: createId(),
    title: value,
    done: false,
    createdAt: new Date().toISOString()
  }));
  saveJson(INBOX_KEY, inboxItems);
  render();
}

function normalizeInboxItem(item) {
  if (!item || !item.title) return null;
  const meta = inferInboxMeta(item.title);
  return {
    id: item.id || createId(),
    title: String(item.title).trim(),
    done: Boolean(item.done),
    createdAt: item.createdAt || new Date().toISOString(),
    domain: isKnownInboxDomain(item.domain) ? item.domain : meta.domain,
    urgency: isKnownInboxUrgency(item.urgency) ? item.urgency : meta.urgency,
    nextAction: item.nextAction || meta.nextAction
  };
}

function inferInboxMeta(title) {
  const text = String(title || "").trim();
  const lower = text.toLowerCase();
  const domainRule = inboxDomainRules.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword.toLowerCase())));
  const urgencyRule = inboxUrgencyRules.find((rule) => rule.keywords.some((keyword) => lower.includes(keyword.toLowerCase())));
  const domain = domainRule?.id || inboxDomainFallback.id;
  const urgency = urgencyRule?.value || "low";
  return {
    domain,
    urgency,
    nextAction: buildInboxNextAction(text, domain, urgency)
  };
}

function buildInboxNextAction(title, domain, urgency) {
  if (!title) return "补充事项内容";
  if (urgency === "high") return `马上处理或设提醒：${title}`;
  if (domain === "supplies") return `加入采购/补充清单：${title}`;
  if (domain === "cat") return `安排猫咪照顾事项：${title}`;
  if (domain === "devices") return `检查设备状态或控制入口：${title}`;
  if (domain === "home") return `安排家务处理时间：${title}`;
  if (domain === "body") return `放进身体照顾流程：${title}`;
  return `晚间复盘时处理：${title}`;
}

function getInboxDomain(domainId) {
  return domains.find((domain) => domain.id === domainId) || inboxDomainFallback;
}

function getInboxUrgency(urgency) {
  if (urgency === "high") return { value: "high", label: "尽快" };
  if (urgency === "medium") return { value: "medium", label: "近期" };
  return { value: "low", label: "低压" };
}

function isKnownInboxDomain(domainId) {
  return domains.some((domain) => domain.id === domainId) || domainId === inboxDomainFallback.id;
}

function isKnownInboxUrgency(urgency) {
  return ["high", "medium", "low"].includes(urgency);
}

function renderWeather() {
  if (!weatherCache) {
    elements.weatherCard.innerHTML = `<p class="empty">正在准备天气信息。</p>`;
    return;
  }

  if (weatherCache.error) {
    elements.weatherCard.innerHTML = `
      <p class="weather-error">${escapeHtml(weatherCache.error)}</p>
      <p class="weather-note">可以换一个英文城市名，例如 Shanghai、Beijing、New York。</p>
    `;
    return;
  }

  const updatedAt = new Date(weatherCache.updatedAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const stateAdvice = getStateWeatherAdvice();

  elements.weatherCard.innerHTML = `
    <div class="weather-main">
      <div>
        <p class="weather-city">${escapeHtml(weatherCache.city)}</p>
        <strong>${Math.round(weatherCache.temperature)}°</strong>
      </div>
      <div class="weather-meta">
        <span>${escapeHtml(weatherCache.description)}</span>
        <span>体感 ${Math.round(weatherCache.apparent)}°</span>
        <span>湿度 ${weatherCache.humidity}%</span>
      </div>
    </div>
    <div class="weather-advice">
      <span aria-hidden="true">${stateAdvice.icon}</span>
      <div>
        <strong>${escapeHtml(stateAdvice.title)}</strong>
        <p>${escapeHtml(stateAdvice.detail)}</p>
      </div>
    </div>
    <p class="weather-note">更新时间 ${updatedAt} · ${escapeHtml(weatherCache.advice)}</p>
  `;
}

function renderDevice() {
  if (!haSettings.url || !haSettings.token || !haSettings.entityId) {
    elements.deviceCard.innerHTML = `<p class="empty">填写 Home Assistant 地址、Token 和空调实体 ID 后即可控制设备。</p>`;
    return;
  }

  if (deviceError) {
    elements.deviceCard.innerHTML = `
      <p class="device-error">${escapeHtml(deviceError)}</p>
      <p class="device-note">确认 Home Assistant 已启动、Token 有效，并且实体 ID 正确。</p>
    `;
    return;
  }

  if (!deviceState) {
    elements.deviceCard.innerHTML = `<p class="empty">正在连接 ${escapeHtml(haSettings.entityId)}。</p>`;
    return;
  }

  const attrs = deviceState.attributes || {};
  const current = attrs.current_temperature ?? "--";
  const target = attrs.temperature ?? "--";
  const hvacMode = attrs.hvac_mode || deviceState.state || "--";
  const friendly = attrs.friendly_name || haSettings.entityId;
  const modes = Array.isArray(attrs.hvac_modes) ? attrs.hvac_modes : ["cool", "heat", "dry", "fan_only"];

  elements.deviceCard.innerHTML = `
    <div class="device-status">
      <div>
        <p class="device-name">${escapeHtml(friendly)}</p>
        <strong>${escapeHtml(formatDeviceState(deviceState.state))}</strong>
      </div>
      <div class="device-stats">
        <span>当前 ${escapeHtml(current)}°</span>
        <span>目标 ${escapeHtml(target)}°</span>
        <span>模式 ${escapeHtml(formatHvacMode(hvacMode))}</span>
      </div>
    </div>
    <div class="device-actions">
      <button class="primary-button" type="button" data-device-action="turn_on">开机</button>
      <button class="secondary-button" type="button" data-device-action="turn_off">关机</button>
      <button class="ghost-button" type="button" data-device-action="temp_down">-1°</button>
      <button class="ghost-button" type="button" data-device-action="temp_up">+1°</button>
    </div>
    <div class="device-modes">
      ${modes.map((mode) => `<button class="toggle-button" type="button" data-device-action="mode:${escapeHtml(mode)}">${escapeHtml(formatHvacMode(mode))}</button>`).join("")}
    </div>
  `;
}

async function refreshDevice(force) {
  if (!haSettings.url || !haSettings.token || !haSettings.entityId) {
    renderDevice();
    return;
  }

  if (force) {
    deviceState = null;
    deviceError = "";
    renderDevice();
  }

  try {
    deviceState = await haFetch(`/api/states/${encodeURIComponent(haSettings.entityId)}`);
    deviceError = "";
  } catch (error) {
    deviceState = null;
    deviceError = `设备连接失败：${error.message}`;
  }

  renderDevice();
}

async function handleDeviceAction(action) {
  if (!deviceState) {
    await refreshDevice(true);
    return;
  }

  try {
    if (action === "turn_on") {
      await callHaService("climate", "turn_on", { entity_id: haSettings.entityId });
    } else if (action === "turn_off") {
      await callHaService("climate", "turn_off", { entity_id: haSettings.entityId });
    } else if (action === "temp_up" || action === "temp_down") {
      const currentTarget = Number(deviceState.attributes?.temperature || 26);
      const nextTemp = action === "temp_up" ? currentTarget + 1 : currentTarget - 1;
      await callHaService("climate", "set_temperature", {
        entity_id: haSettings.entityId,
        temperature: nextTemp
      });
    } else if (action.startsWith("mode:")) {
      await callHaService("climate", "set_hvac_mode", {
        entity_id: haSettings.entityId,
        hvac_mode: action.slice(5)
      });
    }

    await refreshDevice(true);
  } catch (error) {
    deviceError = `控制失败：${error.message}`;
    renderDevice();
  }
}

async function callHaService(domain, service, body) {
  return haFetch(`/api/services/${domain}/${service}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function haFetch(path, options = {}) {
  const response = await fetch(`${haSettings.url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${haSettings.token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) throw new Error(`Home Assistant 返回 ${response.status}`);
  return response.json();
}

function normalizeHaUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function formatDeviceState(state) {
  if (state === "off") return "关闭";
  if (state === "cool") return "制冷";
  if (state === "heat") return "制热";
  if (state === "dry") return "除湿";
  if (state === "fan_only") return "送风";
  if (state === "heat_cool") return "自动";
  return state || "--";
}

function formatHvacMode(mode) {
  if (mode === "off") return "关闭";
  if (mode === "cool") return "制冷";
  if (mode === "heat") return "制热";
  if (mode === "dry") return "除湿";
  if (mode === "fan_only") return "送风";
  if (mode === "heat_cool") return "自动";
  return mode || "--";
}

async function refreshWeather(force) {
  const freshEnough = weatherCache
    && !weatherCache.error
    && Date.now() - new Date(weatherCache.updatedAt).getTime() < 30 * 60 * 1000;

  if (!force && freshEnough) {
    renderWeather();
    return;
  }

  elements.weatherCard.innerHTML = `<p class="empty">正在获取 ${escapeHtml(weatherCity)} 的天气。</p>`;

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherCity)}&count=1&language=zh&format=json`;
    const geo = await fetchJson(geoUrl);
    const place = geo.results?.[0];
    if (!place) throw new Error("没有找到这个城市。");

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&timezone=auto`;
    const weather = await fetchJson(weatherUrl);
    const current = weather.current;
    if (!current) throw new Error("天气服务暂时没有返回数据。");

    weatherCache = {
      city: `${place.name}${place.admin1 ? ` · ${place.admin1}` : ""}`,
      temperature: current.temperature_2m,
      apparent: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      code: current.weather_code,
      description: getWeatherDescription(current.weather_code),
      advice: getWeatherAdvice(current.weather_code, current.temperature_2m),
      updatedAt: new Date().toISOString()
    };
    saveJson(WEATHER_CACHE_KEY, weatherCache);
  } catch (error) {
    weatherCache = {
      error: `天气获取失败：${error.message}`,
      updatedAt: new Date().toISOString()
    };
  }

  renderWeather();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`服务返回 ${response.status}`);
  return response.json();
}

function getWeatherDescription(code) {
  if (code === 0) return "晴朗";
  if ([1, 2].includes(code)) return "多云";
  if (code === 3) return "阴天";
  if ([45, 48].includes(code)) return "有雾";
  if ([51, 53, 55, 56, 57].includes(code)) return "毛毛雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "下雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "下雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天气变化";
}

function getWeatherAdvice(code, temperature) {
  if (isRainyWeather(code)) return "今日有雨，出门带雨衣或雨伞。";
  if (isSunnyWeather(code) && temperature >= 26) return "晴天日晒明显，带遮阳伞并注意防晒。";
  if (temperature >= 30) return "高温少穿衣，注意防晒和补水。";
  if (temperature <= 8) return "低温多加衣，注意保暖。";
  if ([45, 48].includes(code)) return "能见度可能较差，出门留点余量。";
  return "天气适中，按正常节奏安排就好。";
}

function getStateWeatherAdvice() {
  if (!weatherCache || weatherCache.error || typeof weatherCache.code !== "number") {
    return {
      icon: "🌤️",
      title: "状态天气建议",
      detail: "天气还没有更新，先刷新天气模块再给当前状态建议。"
    };
  }

  const code = weatherCache.code;
  const temperature = weatherCache.temperature;
  const isRain = isRainyWeather(code);
  const isSunny = isSunnyWeather(code);
  const isHot = temperature >= 30;
  const isCold = temperature <= 8;

  if (currentStateId === "awake") {
    const tips = [];
    if (isRain) tips.push("出门带雨伞或雨衣");
    else if (isSunny) tips.push("带遮阳伞或帽子");
    else tips.push("按日常通勤装备准备");
    if (isHot) tips.push("少穿衣，注意防晒和补水");
    if (isCold) tips.push("多加衣，注意保暖");
    return { icon: isRain ? "🌧️" : isSunny ? "☀️" : "🎒", title: "起床后天气建议", detail: tips.join("；") + "。" };
  }

  if (currentStateId === "away") {
    const tips = [];
    if (isRain) tips.push("路上注意防雨，回家前确认是否需要绕路采购");
    else if (isSunny || isHot) tips.push("外出注意防晒，补水别拖太久");
    else if (isCold) tips.push("回程注意保暖");
    else tips.push("天气平稳，按今日计划推进");
    return { icon: "🚶", title: "离家后天气建议", detail: tips.join("；") + "。" };
  }

  if (currentStateId === "home") {
    const tips = [];
    if (isRain) tips.push("外面下雨，回家后优先关窗户");
    else tips.push("可以按空气情况短时间通风");
    if (isCold) tips.push("低温时避免长时间开窗");
    if (isHot) tips.push("高温时优先降温和补水");
    return { icon: isRain ? "🪟" : "🏠", title: "回家后天气建议", detail: tips.join("；") + "。" };
  }

  const tips = [];
  if (isRain) tips.push("睡前确认窗户关好，避免夜里进雨");
  else tips.push("睡前按温度决定是否留一点通风");
  if (isCold) tips.push("低温记得睡袜或保暖物");
  if (isHot) tips.push("高温注意降温，别盖太厚");
  return { icon: "🌙", title: "睡前天气建议", detail: tips.join("；") + "。" };
}

function isRainyWeather(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

function isSunnyWeather(code) {
  return [0, 1].includes(code);
}

function renderTimeline(today) {
  elements.timeline.replaceChildren();
  elements.todayCount.textContent = String(today.length);

  if (today.length === 0) {
    elements.timeline.innerHTML = `<p class="empty">还没有今日提醒。</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const occurrence of today) {
    const node = elements.timelineTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.completeKey = occurrence.completeKey;
    node.classList.toggle("is-done", occurrence.done);
    node.querySelector("time").textContent = occurrence.time;
    node.querySelector("h3").textContent = occurrence.reminder.title;
    node.querySelector("p").textContent = occurrence.reminder.message || repeatLabels[occurrence.reminder.repeat];
    node.querySelector(".complete-button").textContent = occurrence.done ? "已完成" : "完成";
    node.querySelector(".complete-button").disabled = occurrence.done;
    fragment.append(node);
  }
  elements.timeline.append(fragment);
}

function renderReminderList() {
  elements.reminderList.replaceChildren();

  if (reminders.length === 0) {
    elements.reminderList.innerHTML = `<p class="empty">点击“示例”可以先生成一组常用家庭提醒。</p>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const reminder of reminders.slice().sort((a, b) => a.time.localeCompare(b.time))) {
    const node = elements.reminderTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.id = reminder.id;
    node.classList.toggle("is-off", !reminder.active);
    node.querySelector("h3").textContent = reminder.title;
    node.querySelector("p").textContent = `${reminder.time} · ${repeatLabels[reminder.repeat]} · ${reminder.message || "默认播报"}`;
    node.querySelector(".toggle-button").textContent = reminder.active ? "开启" : "暂停";
    fragment.append(node);
  }
  elements.reminderList.append(fragment);
}

function getTodayOccurrences() {
  const now = new Date();
  const todayKey = getDateKey(now);

  return reminders
    .filter((reminder) => reminder.active && shouldShowToday(reminder, now))
    .map((reminder) => {
      const dueAt = makeTodayTime(reminder.time);
      const completeKey = `${todayKey}:${reminder.id}:${reminder.time}`;
      return {
        reminder,
        time: reminder.time,
        dueAt,
        done: Boolean(completed[completeKey]),
        completeKey
      };
    })
    .sort((a, b) => a.dueAt - b.dueAt);
}

function shouldShowToday(reminder, date) {
  const day = date.getDay();
  if (reminder.repeat === "daily") return true;
  if (reminder.repeat === "weekdays") return day >= 1 && day <= 5;
  if (reminder.repeat === "weekends") return day === 0 || day === 6;
  if (reminder.repeat === "weekly") {
    const created = new Date(reminder.createdAt);
    return created.getDay() === day;
  }
  return getDateKey(new Date(reminder.createdAt)) === getDateKey(date);
}

function checkDueReminders() {
  const now = new Date();
  const todayKey = getDateKey(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const occurrence of getTodayOccurrences()) {
    const [hour, minute] = occurrence.time.split(":").map(Number);
    const dueMinutes = hour * 60 + minute;
    const slotKey = `${todayKey}:${occurrence.reminder.id}:${occurrence.time}`;

    if (occurrence.done || notifiedSlots.has(slotKey)) continue;
    if (currentMinutes === dueMinutes) {
      notifiedSlots.add(slotKey);
      triggerReminder(occurrence.reminder);
    }
  }

  checkDueModuleItems(now, todayKey, currentMinutes);
}

function checkDueModuleItems(now, todayKey, currentMinutes) {
  const state = getCurrentState();
  for (const item of getModuleItems(state)) {
    const done = moduleDone[getModuleItemKey(item.id)];
    if (item.start && timeToMinutes(item.start) === currentMinutes) {
      const slotKey = `${todayKey}:module:${state.id}:${item.id}:start`;
      if (!notifiedSlots.has(slotKey) && !done) {
        notifiedSlots.add(slotKey);
        triggerModuleReminder(item, "start");
      }
    }

    if (item.end && timeToMinutes(item.end) === currentMinutes) {
      const slotKey = `${todayKey}:module:${state.id}:${item.id}:end`;
      if (!notifiedSlots.has(slotKey) && !done) {
        notifiedSlots.add(slotKey);
        triggerModuleReminder(item, "end");
      }
    }
  }
}

function triggerReminder(reminder) {
  if (reminder.voice) speakReminder(reminder, "提醒");
  if (reminder.notify) showNotification(reminder);
}

function triggerModuleReminder(item, phase) {
  const title = phase === "start" ? `开始：${item.title}` : `确认完成：${item.title}`;
  const message = phase === "start"
    ? `推荐时间 ${formatTimeRange(item)}。${item.detail}`
    : `推荐结束时间到了。${item.title} 做完了吗？如果完成了，请在面板上勾选。`;
  const reminder = {
    id: `module-${item.id}-${phase}`,
    title,
    message,
    voice: true,
    notify: true
  };
  triggerReminder(reminder);
}

function speakActiveModule() {
  const state = getCurrentState();
  const pending = getModuleItems(state).filter((item) => !moduleDone[getModuleItemKey(item.id)]);
  const text = pending.length > 0
    ? `${state.title}，还剩：${pending.map((item) => `${item.title}，${item.detail}`).join("。")}`
    : `${state.title}已经全部完成。`;
  speakText(text);
}

function speakReminder(reminder, prefix) {
  speakText(`${prefix}，${reminder.message || reminder.title}`);
}

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

async function showNotification(reminder) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await requestNotificationPermission();
  if (Notification.permission !== "granted") return;

  const body = reminder.message || `现在该处理：${reminder.title}`;
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.showNotification(reminder.title, {
        body,
        badge: "icons/icon-192.svg",
        icon: "icons/icon-192.svg",
        tag: reminder.id
      });
      return;
    }
  }
  new Notification(reminder.title, { body });
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("当前浏览器不支持系统通知。");
    return;
  }
  const result = await Notification.requestPermission();
  elements.requestNotify.textContent = result === "granted" ? "通知已开启" : "开启通知";
}

async function refreshApp() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  window.location.href = `${window.location.pathname}?v=${Date.now()}`;
}

function addDemoReminder() {
  const date = new Date(Date.now() + 60000);
  const time = date.toTimeString().slice(0, 5);
  reminders.push({
    id: createId(),
    title: "测试提醒",
    time,
    repeat: "once",
    message: "这是一条来自 PeaceLife 的测试播报。",
    voice: true,
    notify: true,
    active: true,
    createdAt: new Date().toISOString()
  });
  saveReminders();
  render();
}

function seedReminders() {
  if (reminders.length > 0 && !confirm("要导入 SOP 提醒吗？已有提醒会保留，重复标题会跳过。")) return;
  const existing = new Set(reminders.map((reminder) => `${reminder.title}:${reminder.time}`));
  const samples = sopReminders.filter(([title, time]) => !existing.has(`${title}:${time}`));

  if (samples.length === 0) {
    alert("SOP 提醒已经导入过了。");
    return;
  }

  reminders.push(
    ...samples.map(([title, time, repeat, message]) => ({
      id: createId(),
      title,
      time,
      repeat,
      message,
      voice: true,
      notify: true,
      active: true,
      createdAt: new Date().toISOString()
    }))
  );
  saveReminders();
  render();
}

function setDefaultTime() {
  const date = new Date(Date.now() + 30 * 60000);
  elements.timeInput.value = date.toTimeString().slice(0, 5);
}

function makeTodayTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function getCurrentState() {
  return states.find((state) => state.id === currentStateId) || states[0];
}

function getNextState() {
  const currentIndex = states.findIndex((state) => state.id === currentStateId);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % states.length : 1;
  return states[nextIndex];
}

function getModuleItems(state) {
  return state.items.map((item) => normalizeModuleItem(item));
}

function normalizeModuleItem(item) {
  if (typeof item === "string") {
    return { id: item, icon: "•", title: item, detail: "" };
  }

  return item;
}

function formatTimeRange(item) {
  if (item.start && item.end) return `${item.start} - ${item.end}`;
  if (item.start) return `${item.start} 开始`;
  if (item.end) return `${item.end} 截止`;
  return "未设置推荐时间";
}


function getModuleItemKey(itemId) {
  return `${getDateKey(new Date())}:${currentStateId}:${itemId}`;
}

function timeToMinutes(time) {
  if (!time || typeof time !== "string" || !time.includes(":")) return NaN;
  const [hour, minute] = time.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return NaN;
  return hour * 60 + minute;
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function saveReminders() {
  saveJson(STORAGE_KEY, reminders);
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("sw.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}
