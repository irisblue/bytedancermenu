#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeLiteOutputs } from "./lib-lite.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataDir = resolve(root, "data");
const outputPath = resolve(dataDir, "menu.json");
const rawOutputPath = resolve(dataDir, "bytecanteen-menu-raw.json");
const buildingConfigPath = resolve(dataDir, "bytecanteen-buildings.json");
const sessionPath = resolve(root, ".session.json");
const tokenPath = resolve(dataDir, ".bytecanteen-token.json");
const indexPath = resolve(root, "index.html");

const APPID = "cli_9f847db13cead00d";
const MAX_API_ATTEMPTS = 3;
const API_RETRY_BASE_MS = 800;
const meals = ["breakfast", "lunch", "dinner"];
const mealLabels = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const targetBuildings = [
  { key: "SP5", name: "尚浦商务中心5幢", search: "尚浦商务中心5幢" },
  { key: "T2a", name: "上海新江湾广场T2a", search: "上海新江湾广场T2a" },
  { key: "T4b", name: "上海新江湾广场T4b", search: "上海新江湾广场T4b" },
  { key: "T1", name: "上海新江湾广场T1", search: "上海新江湾广场T1" },
  { key: "YJ", name: "云际尚浦A塔", search: "云际尚浦A塔" }
];

const args = process.argv.slice(2);
const noEmbed = args.includes("--no-embed");
const skipIfFresh = args.includes("--skip-if-fresh");
const dateArg = args.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
const mealArg = args.find((arg) => meals.includes(arg));
const targetDate = dateArg || new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
const targetMeals = mealArg ? [mealArg] : meals;

mkdirSync(dataDir, { recursive: true });

try {
  if (skipIfFresh && isFresh(targetDate, targetMeals)) {
    console.log(`Menu for ${targetDate} already complete; skipping fetch.`);
    process.exit(0);
  }
  const data = await fetchAllMenus(targetDate, targetMeals);
  const validationErrors = validateCoverage(data, targetMeals);
  if (validationErrors.length) {
    const failureText = data.source.failures
      .map((item) => `${item.building}/${mealLabels[item.meal] || item.meal}: ${item.error}`)
      .join("; ");
    throw new Error(`本次菜单覆盖不完整，已保留现有 data/menu.json。${validationErrors.join("；")}。失败项：${failureText || "无明细"}`);
  }
  writeFileSync(outputPath, `${JSON.stringify(data, null, 2)}\n`);
  const { litePath } = writeLiteOutputs(data, { dataDir, indexPath, embed: !noEmbed });
  console.log(`Wrote ${data.menus.length} ByteCanteen menus to ${outputPath} (+ ${litePath})`);
} catch (error) {
  const output = {
    error: error.message,
    hint: "ByteCanteen API 需要飞书网页 Cookie 的 session。请在项目根目录创建 .session.json，格式为 {\"session\":\"...\"}。"
  };
  if (process.env.DEBUG_BYTECANTEEN) output.stack = error.stack;
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

async function fetchAllMenus(menuDate, mealList) {
  const buildings = await resolveBuildings();
  const restaurants = {};
  const menus = [];
  const structures = [];
  const failures = [];

  for (const meal of mealList) {
    restaurants[meal] = {};
    for (const building of buildings) {
      try {
        const raw = await getMenu(building.mdmCode, menuDate, meal);
        restaurants[meal][building.key] = raw;
        const parsed = convertRestaurant(raw, building, meal, menuDate);
        structures.push({
          building: building.name,
          meal,
          stations: parsed.stations,
          allStations: parsed.allStations,
          emptyStations: parsed.emptyStations,
          skippedEmptyStations: parsed.skippedEmptyStations
        });
        menus.push(...parsed.menus);
      } catch (error) {
        failures.push({ building: building.name, meal, error: error.message });
      }
    }
  }

  const generatedAt = new Date().toISOString();
  const source = {
    tool: "bytecanteen-api",
    note: failures.length
      ? `当前使用 ByteCanteen API；${failures.length} 个工区/餐段获取失败，可能是菜单未发布或 LARK_SESSION 过期。`
      : "当前使用 ByteCanteen API 结构化菜单数据；每日 9:30 自动刷新。",
    workAreas: targetBuildings.map((item) => item.name),
    canteenStructures: structures,
    failures
  };

  const payload = {
    generatedAt,
    source,
    menus: menus.sort(sortMenus)
  };

  writeFileSync(rawOutputPath, `${JSON.stringify({ generatedAt, date: menuDate, meals: mealList, restaurants }, null, 2)}\n`);
  return payload;
}

function validateCoverage(data, mealList) {
  const errors = [];
  const menus = data.menus || [];
  if (!menus.length) {
    errors.push("没有获取到任何菜单");
    return errors;
  }

  for (const meal of mealList) {
    const mealMenus = menus.filter((menu) => menu.meal === meal);
    if (!mealMenus.length) {
      errors.push(`${mealLabels[meal] || meal}没有获取到菜单`);
      continue;
    }
    const coveredAreas = new Set(mealMenus.map((menu) => menu.workArea));
    const missingAreas = targetBuildings
      .map((building) => building.name)
      .filter((name) => !coveredAreas.has(name));
    if (missingAreas.length) {
      errors.push(`${mealLabels[meal] || meal}缺少 ${missingAreas.join("、")}`);
    }
  }

  for (const item of data.source?.canteenStructures || []) {
    if (!item.allStations?.length) {
      errors.push(`${mealLabels[item.meal] || item.meal} ${item.building} 没有读取到楼层/档口结构`);
      continue;
    }
    const blockingEmptyStations = item.emptyStations || [];
    if (blockingEmptyStations.length) {
      errors.push(`${mealLabels[item.meal] || item.meal} ${item.building} 以下楼层/档口没有菜品：${item.emptyStations.join("、")}`);
    }
  }

  return errors;
}

async function resolveBuildings() {
  const existing = readJson(buildingConfigPath, { buildings: [] });
  const byName = new Map((existing.buildings || []).map((item) => [item.name, item]));
  const buildings = [];
  let changed = false;

  for (const target of targetBuildings) {
    const cached = byName.get(target.name);
    if (cached?.mdmCode) {
      buildings.push({ ...target, ...cached });
      continue;
    }

    const found = await findBuilding(target);
    buildings.push(found);
    changed = true;
  }

  if (changed) {
    writeFileSync(buildingConfigPath, `${JSON.stringify({ updatedAt: new Date().toISOString(), buildings }, null, 2)}\n`);
  }
  return buildings;
}

async function findBuilding(target) {
  const results = await searchBuilding(target.search);
  const exact = results.find((item) => buildingName(item) === target.name);
  const loose = results.find((item) => buildingName(item).includes(target.name) || target.name.includes(buildingName(item)));
  const picked = exact || loose || results[0];
  const mdmCode = picked?.mdmCode || picked?.buildingCode;
  if (!mdmCode) throw new Error(`未找到工区编码：${target.name}`);
  return {
    ...target,
    mdmCode,
    city: picked.cityName || picked.city || "",
    campus: picked.campusName || picked.campus || ""
  };
}

async function searchBuilding(keyword) {
  const url = new URL("https://aplus.bytedance.com/smartcanteen/app/mini-program/building/search");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("page", "1");
  url.searchParams.set("size", "20");
  const json = await apiFetch(url, { method: "GET" });
  return json.data || [];
}

async function getMenu(buildingCode, menuDate, timeCode) {
  const json = await apiFetch("https://aplus.bytedance.com/smartcanteen/app/mini-program/menu/detail/v3", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ buildingCode, menuDate, timeCode })
  });
  if (!json.data) throw new Error(json.message || "菜单走丢了");
  return json.data;
}

async function apiFetch(url, init = {}, attempt = 1) {
  try {
    const token = await getToken();
    const response = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        "lark-miniapp-token": token
      }
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || isApiError(json)) {
      throw new Error(json.message || json.error || `HTTP ${response.status}`);
    }
    return json;
  } catch (error) {
    if (attempt >= MAX_API_ATTEMPTS) throw error;
    const wait = API_RETRY_BASE_MS * attempt;
    console.error(`[retry ${attempt}/${MAX_API_ATTEMPTS - 1}] ${error.message}; waiting ${wait}ms`);
    await sleep(wait);
    return apiFetch(url, init, attempt + 1);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 判断现有 data/menu.json 是否已经完整覆盖目标日期，用于 --skip-if-fresh：
// 让定时器每隔几分钟跑一次也很廉价，菜单齐了就自动停手，不再打 API。
function isFresh(menuDate, mealList) {
  const existing = readJson(outputPath, null);
  if (!existing?.menus?.length) return false;
  const todayMenus = existing.menus.filter((menu) => menu.date === menuDate);
  if (!todayMenus.length) return false;
  const errors = validateCoverage({ menus: todayMenus, source: existing.source }, mealList);
  return errors.length === 0;
}

function isApiError(json) {
  if (!json) return false;
  if (json.error) return true;
  if (json.code === undefined || json.code === null || json.code === 0 || json.code === "0" || json.code === 200 || json.code === "200") return false;
  return !["success", "ok"].includes(String(json.code).toLowerCase());
}

async function getToken() {
  const cached = readJson(tokenPath, null);
  if (cached?.token && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const session = getLarkSession();
  if (!session) {
    throw new Error("缺少 LARK_SESSION。请在项目根目录创建 .session.json：{\"session\":\"飞书 Cookie session 值\"}");
  }

  const loginResponse = await fetch("https://open.feishu.cn/open-apis/mina/v2/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionid: session, appid: APPID })
  });
  const loginJson = await loginResponse.json();
  const code = loginJson?.data?.code;
  if (!code) throw new Error(`mina login failed: ${JSON.stringify(loginJson)}`);

  const url = new URL("https://aplus.bytedance.com/smartcanteen/app/mini-program/login/v3");
  url.searchParams.set("code", code);
  const tokenResponse = await fetch(url);
  const tokenJson = await tokenResponse.json();
  const token = tokenJson?.data?.token;
  if (!token) throw new Error(`get token failed: ${JSON.stringify(tokenJson)}`);

  const expiresIn = Number(tokenJson?.data?.expiresIn || 86400);
  // `expiresIn` may be returned either as a TTL in seconds or as a Unix timestamp in seconds.
  const expiresAt = expiresIn > 1_000_000_000
    ? expiresIn * 1000
    : Date.now() + 1000 * expiresIn;
  writeFileSync(tokenPath, `${JSON.stringify({ token, expiresAt }, null, 2)}\n`);
  return token;
}

function getLarkSession() {
  const file = readJson(sessionPath, null);
  return file?.session || process.env.LARK_SESSION || "";
}

function convertRestaurant(raw, building, meal, date) {
  if (!raw || raw.hidingReason) return { stations: [], allStations: [], emptyStations: [], skippedEmptyStations: [], menus: [] };
  const time = formatTimeRange(raw.menuStartTime, raw.menuEndTime);
  const stations = [];
  const allStations = [];
  const emptyStations = [];
  const skippedEmptyStations = [];
  const menus = [];

  for (const site of raw.menuSites || []) {
    const station = site.siteLabel;
    if (station) allStations.push(station);
    const items = dishItems(site);
    if (!station) continue;
    if (!items.length) {
      if (isNonMenuEmptyStation(station)) {
        skippedEmptyStations.push(station);
      } else {
        emptyStations.push(station);
      }
      continue;
    }
    stations.push(station);
    menus.push({
      date,
      meal,
      workArea: building.name,
      station,
      venue: `${building.name} · ${station}`,
      title: `${building.name}${mealLabels[meal]} ${station}`,
      time,
      items,
      sourceMessage: `bytecanteen-${date}-${meal}-${building.key}-${slug(station)}`,
      sourceType: "bytecanteen-api",
      createdAt: new Date().toISOString()
    });
  }

  return { stations, allStations, emptyStations, skippedEmptyStations, menus };
}

function isNonMenuEmptyStation(station) {
  return /温馨提示|茶水间|^\d+楼餐厅$/.test(String(station || ""));
}

function dishItems(site) {
  const rows = [
    ...(site.boxMealItems || []),
    ...(site.selfServiceItems || [])
  ];
  const items = [];
  const seen = new Set();
  for (const row of rows) {
    const name = cleanDishName(row.foodName);
    if (!name || isBlockedFood(name)) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    items.push(normalizeDish(row, name));
  }
  return items;
}

function normalizeDish(row, cleanedName) {
  const info = row.additionalInfo || {};
  const tags = row.tags || {};
  const attributes = row.attributes || {};
  return {
    name: cleanedName || cleanDishName(row.foodName),
    imageURLs: Array.isArray(info.imageURL) ? info.imageURL.filter(Boolean) : [],
    description: row.description || "",
    typeName: row.typeName || "",
    kindCode: row.kindCode || "",
    kindName: row.kindName || "",
    sku: row.sku || "",
    dishType: info.dishType?.zh || info.dishType?.en || "",
    cuisine: info.cuisine || "",
    flavours: Array.isArray(info.flavours) ? info.flavours.map((item) => item.zh || item.en || item.code).filter(Boolean) : [],
    ingredients: Array.isArray(info.ingredients) ? info.ingredients.filter(Boolean) : [],
    proteinType: info.proteinType || "",
    servingTemperature: info.servingTemperature || "",
    spiciness: info.spiciness ?? null,
    nutrition: {
      calories: info.calories ?? null,
      protein: info.protein ?? null,
      fat: info.fat ?? null,
      carbohydrates: info.carbohydrates ?? null,
      fiber: info.fiber ?? null,
      sodium: info.sodium ?? null,
      weight: info.weight ?? null
    },
    tags: {
      allergies: tags.allergies || attributes.allergens || [],
      dietaryPreferences: tags.dietaryPreferences || attributes.dietaryPreferences || [],
      religiousTags: tags.religiousTags || attributes.religiousPractices || [],
      dietaryRequirements: attributes.dietaryRequirements || []
    }
  };
}

function cleanDishName(value) {
  return String(value || "")
    .replace(/[（(]\s*(?:20\d{2}\.)?\d{1,2}\.\d{1,2}\s*[-~至]\s*\d{1,2}\.\d{1,2}\s*[）)]/g, "")
    .replace(/[（(]\s*\d{1,2}\.\d{1,2}\s*[-~至]\s*\d{1,2}\s*[）)]/g, "")
    .replace(/[（(]\s*\d{1,2}\.\d{1,2}\s*[-~至]\s*\d{1,2}\.\d{1,2}\s*[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isBlockedFood(name) {
  return /^(米饭|杂粮米饭|白米饭|水|面粉|黄豆|鸡蛋|猪肉|大米|糯米|生菜|油条)$/.test(name);
}

function formatTimeRange(start, end) {
  const left = String(start || "").slice(0, 5);
  const right = String(end || "").slice(0, 5);
  return left && right ? `${left}-${right}` : "";
}

function sortMenus(a, b) {
  const order = { breakfast: 0, lunch: 1, dinner: 2 };
  return (order[a.meal] ?? 9) - (order[b.meal] ?? 9)
    || a.workArea.localeCompare(b.workArea, "zh-CN")
    || a.station.localeCompare(b.station, "zh-CN");
}

function buildingName(item) {
  return item.buildingName || item.name || "";
}

function readJson(pathname, fallback) {
  try {
    return JSON.parse(readFileSync(pathname, "utf8"));
  } catch {
    return fallback;
  }
}

function slug(value) {
  return String(value).replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "");
}
