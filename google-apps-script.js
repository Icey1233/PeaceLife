const SHEETS = {
  states: "生活状态",
  moduleItems: "阶段事项",
  reminders: "定时提醒",
  inbox: "临时事项",
  settings: "基础设置"
};

function doGet() {
  return jsonResponse(readConfig());
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || "{}");
  if (body.action === "replaceConfig" && body.config) {
    writeConfig(body.config);
    return jsonResponse({ ok: true, updatedAt: new Date().toISOString() });
  }
  return jsonResponse({ ok: false, error: "Unsupported action" });
}

function readConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    states: rowsToObjects(ss.getSheetByName(SHEETS.states)),
    moduleItems: rowsToObjects(ss.getSheetByName(SHEETS.moduleItems)),
    reminders: rowsToObjects(ss.getSheetByName(SHEETS.reminders)),
    inbox: rowsToObjects(ss.getSheetByName(SHEETS.inbox)),
    settings: Object.fromEntries(rowsToObjects(ss.getSheetByName(SHEETS.settings)).map((row) => [row.key, row.value]))
  };
}

function writeConfig(config) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  writeObjects(ss, SHEETS.states, ["id", "label", "title", "description", "order"], config.states || []);
  writeObjects(ss, SHEETS.moduleItems, ["stateId", "itemId", "id", "icon", "title", "detail", "start", "end", "order"], config.moduleItems || []);
  writeObjects(ss, SHEETS.reminders, ["id", "title", "time", "repeat", "message", "voice", "notify", "active", "createdAt"], config.reminders || []);
  writeObjects(ss, SHEETS.inbox, ["id", "title", "done", "createdAt", "domain", "urgency", "nextAction"], config.inbox || []);
  writeObjects(ss, SHEETS.settings, ["key", "value"], Object.entries(config.settings || {}).map(([key, value]) => ({ key, value })));
}

function writeObjects(ss, name, headers, rows) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(
      rows.map((row) => headers.map((header) => row[header] ?? ""))
    );
  }
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function rowsToObjects(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header).trim());
  return values.slice(1)
    .filter((row) => row.some((cell) => cell !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
