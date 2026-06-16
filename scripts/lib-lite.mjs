import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

// 把完整 menu.json 压成前端真正需要的精简版：
// - 丢弃 nutrition / sku / spiciness / canteenStructures 等前端用不到的字段
// - 把所有可搜索字段（描述、口味、食材、标签…）预先拼成一个字符串 s，连同
//   __has_image__ / __box__ 标记一起烘焙好，前端不用再在运行时拼接
// - 每道菜只保留第一张图片 URL（前端只用第 0 张）
export function buildLiteMenu(data) {
  return {
    generatedAt: data.generatedAt,
    source: {
      note: "当前使用精简版 ByteCanteen 菜单（menu.lite.json）；完整数据见 data/menu.json。",
      workAreas: data.source?.workAreas || [],
      failures: data.source?.failures || []
    },
    menus: (data.menus || []).map((menu) => ({
      date: menu.date,
      meal: menu.meal,
      workArea: menu.workArea,
      station: menu.station,
      venue: menu.venue,
      time: menu.time,
      sourceMessage: menu.sourceMessage,
      items: (menu.items || []).map(liteDish)
    }))
  };
}

function liteDish(item) {
  if (typeof item === "string") return { name: item, s: item };
  const images = Array.isArray(item.imageURLs) ? item.imageURLs.filter(Boolean) : [];
  const dish = { name: item.name, s: buildSearchText(item, images) };
  if (images.length) dish.imageURLs = [images[0]];
  return dish;
}

export function buildSearchText(item, images = Array.isArray(item.imageURLs) ? item.imageURLs.filter(Boolean) : []) {
  const parts = [
    item.name,
    item.description,
    item.typeName,
    item.kindName,
    item.dishType,
    item.cuisine,
    Array.isArray(item.proteinType) ? item.proteinType.join(" ") : item.proteinType,
    item.servingTemperature,
    ...(item.flavours || []),
    ...(item.ingredients || []),
    ...(images.length ? ["__has_image__"] : []),
    ...(String(item.kindCode || "").includes("BOX") ? ["__box__"] : []),
    ...Object.values(item.tags || {}).flat()
  ]
    .filter(Boolean)
    .map(String);
  return [...new Set(parts)].join(" ");
}

export function writeLiteOutputs(data, { dataDir, indexPath, embed = true }) {
  const lite = buildLiteMenu(data);
  const litePath = resolve(dataDir, "menu.lite.json");
  writeFileSync(litePath, `${JSON.stringify(lite)}\n`);
  if (embed) embedLite(lite, indexPath);
  return { lite, litePath };
}

export function embedLite(lite, indexPath) {
  const html = readFileSync(indexPath, "utf8");
  const json = JSON.stringify(lite);
  const assetVersion = buildAssetVersion(lite.generatedAt);
  const startTag = '<script id="embedded-menu" type="application/json">';
  const start = html.indexOf(startTag);
  if (start === -1) throw new Error("Could not find embedded menu script in index.html");
  const contentStart = start + startTag.length;
  const end = html.indexOf("</script>", contentStart);
  if (end === -1) throw new Error("Could not find embedded menu script closing tag in index.html");
  const next = `${html.slice(0, contentStart)}${json}${html.slice(end)}`
    .replace(/styles\.css\?v=[^"]+/g, `styles.css?v=${assetVersion}`)
    .replace(/app\.js\?v=[^"]+/g, `app.js?v=${assetVersion}`);
  writeFileSync(indexPath, next);
}

function buildAssetVersion(generatedAt) {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return String(Date.now());
  const shanghai = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })
    .format(date)
    .replace(" ", "-")
    .replace(/:/g, "")
    .replace(/-/g, "");
  return shanghai;
}
