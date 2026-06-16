const mealLabels = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐"
};

const mealTimeline = [
  { meal: "breakfast", end: 10 * 60 },
  { meal: "lunch", end: 14 * 60 },
  { meal: "dinner", end: 20 * 60 }
];

const outerColors = ["#ffe36a", "#fff6c9", "#ffc85a", "#fff0ba", "#ffd276", "#fff8d8", "#ffbd57", "#fff1a8"];
const innerColors = ["#ff7a00", "#ff8615", "#f06a00", "#ff9a2e", "#e95d00", "#ffb156", "#ef6c00", "#fa7f18"];
const blessings = [
  "今天这口，稳稳拿下。",
  "愿你排队少一点，好吃多一点。",
  "吃饱才有灵感，开饭。",
  "这顿有点会选。",
  "祝你遇到刚出锅的那一份。",
  "胃口在线，心情也在线。"
];
const surpriseEmojis = ["🌸", "🌼", "🍚", "🥢", "🍵", "✨", "😋", "🎉"];
const analyticsEndpoint = "https://br-calm-erne-d3a20cf2.supabase.aidap-global.cn-beijing.volces.com/functions/v1/workspace-menu/events";
const analyticsSessionKey = "lunchmenu.analytics.session";
const analyticsQueueKey = "lunchmenu.analytics.queue";
let audioContext = null;
let lastTickAt = 0;
let lastShuffleAt = 0;
const preferenceOptions = {
  breakfast: [
    { id: "warm", label: "♨️ 热乎", rule: /粥|汤|热牛奶|豆浆|馄饨|面|米糊|豆花|河粉/ },
    { id: "staple", label: "🥯 顶饱", rule: /包|饼|烧麦|馒头|饭团|吐司|面包|华夫|河粉|面|米粉/ },
    { id: "eggMilk", label: "🥚 蛋奶", rule: /蛋|牛奶|豆浆|豆花|小贝/ },
    { id: "sweet", label: "🍯 甜口", rule: /甜|红豆|桂圆|蜜豆|蛋糕|甜甜圈|吐司|饼干|华夫|椰丝|葡萄干/ },
    { id: "lightMorning", label: "🌿 轻一点", rule: /白粥|紫薯|玉米|牛奶|豆浆|果汁|青菜|茶叶蛋|水煮蛋/ },
    { id: "morningSpicy", label: "🌶️ 醒神辣", rule: /辣|香辣|胡辣|辣酱/ },
    { id: "drinkMorning", label: "🥛 喝点", rule: /粥|豆浆|牛奶|果汁|米糊|豆花/ },
    { id: "photo", label: "📸 有图", rule: /__has_image__/ }
  ],
  lunch: [
    { id: "spicy", label: "🌶️ 想吃辣", rule: /辣|麻辣|香辣|红油|川|湘|藤椒|胡辣|辣酱/ },
    { id: "mild", label: "🍅 不辣", rule: /不辣|番茄|清炒|蒸|粥|汤|豆腐|烧腊|豉油|白粥|牛奶|豆浆|玉米|紫薯/ },
    { id: "noodle", label: "🍜 面/粉", rule: /面|粉|米线|馄饨|粿条|拌|河粉|烩面/ },
    { id: "rice", label: "🍚 米饭", rule: /饭|米|咖喱|双拼|烧腊|饭团/ },
    { id: "meat", label: "🥩 肉多", rule: /牛|鸡|肉|排|肘|肥牛|猪|鸭|小排|牛肚/ },
    { id: "light", label: "🥗 轻食", rule: /轻食|白粥|豆浆|牛奶|紫薯|玉米|清炒|番茄|茶|汤|蒸|青菜/ },
    { id: "drink", label: "🥤 饮料", rule: /茶|豆浆|牛奶|果汁|可乐|芬达|雪碧|气泡水|怡宝|乌龙|饮料|豆本豆/ },
    { id: "photo", label: "📸 有图", rule: /__has_image__/ },
    { id: "combo", label: "🍱 套餐", rule: /套餐|双拼|拼|配|__box__/ },
    { id: "fish", label: "🐟 鱼虾", rule: /鱼|虾|蟹|鲈|鮰|龙利|花甲/ }
  ],
  dinner: [
    { id: "hotDinner", label: "🔥 热菜", rule: /煲|面|汤|麻辣|烩|炒|蒸|咖喱|牛肉|鸡|豆腐/ },
    { id: "spicyDinner", label: "🌶️ 来点辣", rule: /辣|麻辣|香辣|红油|川|湘|酸菜|藤椒|辣酱/ },
    { id: "mildDinner", label: "🍲 温和", rule: /不辣|番茄|清炒|蒸|汤|豆腐|烧腊|豉油|乌龙|芬达/ },
    { id: "noodleDinner", label: "🍜 面/粉", rule: /面|粉|米线|拌|烩面|牛肉汤/ },
    { id: "riceDinner", label: "🍛 饭类", rule: /饭|咖喱|双拼|烧腊|比萨/ },
    { id: "proteinDinner", label: "🥩 肉蛋", rule: /牛|鸡|肉|排|肘|肥牛|猪|鸭|蛋|小排|牛肚/ },
    { id: "drinkDinner", label: "🍵 饮品", rule: /茶|可乐|芬达|雪碧|气泡水|怡宝|乌龙|饮料|豆本豆/ },
    { id: "photo", label: "📸 有图", rule: /__has_image__/ },
    { id: "combo", label: "🍱 套餐", rule: /套餐|双拼|拼|配|__box__/ },
    { id: "fish", label: "🐟 鱼虾", rule: /鱼|虾|蟹|鲈|鮰|龙利|花甲/ }
  ],
  all: [
    { id: "mild", label: "🍅 不辣", rule: /不辣|番茄|清炒|蒸|粥|汤|豆腐|白粥|牛奶|豆浆|玉米|紫薯/ },
    { id: "spicy", label: "🌶️ 想吃辣", rule: /辣|麻辣|香辣|红油|川|湘|酸菜|藤椒|胡辣|辣酱/ },
    { id: "noodle", label: "🍜 面/粉", rule: /面|粉|米线|馄饨|粿条|拌|汤|河粉|烩面/ },
    { id: "rice", label: "🍚 米饭", rule: /饭|米|烧麦|饭团|咖喱|双拼/ },
    { id: "drink", label: "🥤 喝点", rule: /茶|豆浆|牛奶|果汁|可乐|芬达|雪碧|气泡水|怡宝|乌龙|饮料|豆本豆/ },
    { id: "photo", label: "📸 有图", rule: /__has_image__/ },
    { id: "combo", label: "🍱 套餐", rule: /套餐|双拼|拼|配|__box__/ },
    { id: "warm", label: "♨️ 热乎", rule: /汤|煲|粥|面|粉|馄饨|米线|热|蒸|锅/ },
    { id: "fish", label: "🐟 鱼虾", rule: /鱼|虾|蟹|鲈|鮰|龙利|花甲/ }
  ]
};

const state = {
  data: null,
  meal: defaultMealByTime(),
  workAreas: new Set(),
  prefs: new Set(),
  stationMenus: [],
  menus: [],
  dishes: [],
  floorKeys: new Set(),
  manualVenueFiltersByMeal: new Map(),
  selectedMenu: null,
  phase: "menu",
  outerRotation: 0,
  innerRotation: 0,
  spinning: false,
  winner: null,
  deckShuffle: 0,
  deckStage: "idle",
  revealedCards: new Set(),
  sharedResultShown: false
};

const canvas = document.querySelector("#wheel");
const ctx = canvas.getContext("2d");
const spinButton = document.querySelector("#spinButton");
const pointer = document.querySelector(".pointer");
const prefBar = document.querySelector("#prefBar");
const workAreaChips = document.querySelector("#workAreaChips");
const menuList = document.querySelector("#menuList");
const dishDeck = document.querySelector("#dishDeck");
const resultLabel = document.querySelector("#resultLabel");
const resultDish = document.querySelector("#resultDish");
const sideMealMeta = document.querySelector("#sideMealMeta");

async function loadMenu() {
  state.data = await loadMenuData();
  document.querySelector("#sourceTitle").textContent = formatGeneratedAt(state.data.generatedAt);
  selectAllFilters();
  bindControls();
  syncMealButtons();
  renderPreferences();
  renderWorkAreaChips();
  refresh();
  trackPageView();
  showSharedResultFromUrl();
}

async function loadMenuData() {
  if (location.protocol !== "file:") {
    // 优先精简版（体积小很多），其次完整版，最后兜底页面内嵌数据
    for (const path of ["data/menu.lite.json", "data/menu.json"]) {
      try {
        const response = await fetch(path, { cache: "no-store" });
        if (response.ok) return response.json();
      } catch (error) {
        console.warn(`Failed to load ${path}`, error);
      }
    }
  }
  return JSON.parse(document.querySelector("#embedded-menu").textContent);
}

function resetToMenuPhase() {
  state.winner = null;
  state.selectedMenu = null;
  state.phase = "menu";
  state.deckStage = "idle";
  state.revealedCards = new Set();
}

function bindControls() {
  document.querySelectorAll("[data-meal]").forEach((button) => {
    button.addEventListener("click", () => {
      resetInteractionLock();
      state.meal = button.dataset.meal;
      syncMealButtons();
      resetToMenuPhase();
      syncPrefsWithMeal();
      restoreVenueFiltersForMeal();
      renderPreferences();
      refresh();
    });
  });

  prefBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pref]");
    if (!button) return;
    resetInteractionLock();
    if (button.dataset.pref === "surprise") {
      chooseSurprisePreference();
      return;
    }
      const pref = button.dataset.pref;
      if (state.prefs.has(pref)) {
        state.prefs.delete(pref);
      } else {
        state.prefs.add(pref);
      }
      button.setAttribute("aria-pressed", String(state.prefs.has(pref)));
      resetToMenuPhase();
      restoreVenueFiltersForMeal();
      refresh();
  });

  workAreaChips.addEventListener("click", (event) => {
    const floorButton = event.target.closest("[data-floor-key]");
    if (floorButton) {
      resetInteractionLock();
      toggleFloorFilter(floorButton.dataset.floorKey);
      saveVenueFiltersForMeal();
      resetToMenuPhase();
      renderWorkAreaChips();
      refresh();
      return;
    }

    const button = event.target.closest("[data-work-area]");
    if (!button) return;
    resetInteractionLock();
    toggleWorkAreaFilter(button.dataset.workArea);
    saveVenueFiltersForMeal();
    resetToMenuPhase();
    renderWorkAreaChips();
    refresh();
  });

  menuList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-group-key]");
    if (!card) return;
    resetInteractionLock();
    const floorGroup = state.menus.find((group) => group.key === card.dataset.groupKey);
    if (floorGroup) selectMenuGroup(floorGroup);
  });

  menuList.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-group-key]");
    if (!card) return;
    event.preventDefault();
    card.click();
  });

  dishDeck.addEventListener("click", (event) => {
    const card = event.target.closest("[data-card-index]");
    if (!card || state.spinning) return;
    if (!["dealt", "revealed"].includes(state.deckStage)) return;
    const index = Number(card.dataset.cardIndex);
    const entry = state.dishes[index];
    if (!entry) return;
    revealManualCard({ ...entry, index });
  });

  dishDeck.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-card-index]");
    if (!card) return;
    event.preventDefault();
    card.click();
  });

  spinButton.addEventListener("click", spin);
  window.addEventListener("error", (event) => {
    console.error("Lunch menu interaction error", event.error || event.message);
    resetInteractionLock();
    updateIdleResult();
  });
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Lunch menu async error", event.reason);
    resetInteractionLock();
    updateIdleResult();
  });
}

function renderPreferences() {
  const options = preferenceOptions[state.meal] || preferenceOptions.all;
  prefBar.innerHTML = [
    `<button type="button" class="pref-surprise" data-pref="surprise" aria-pressed="false">🥟 口味骰子</button>`,
    ...options.map((option) => (
    `<button type="button" data-pref="${escapeHtml(option.id)}" aria-pressed="${state.prefs.has(option.id)}">${escapeHtml(option.label)}</button>`
    ))
  ].join("");
}

function renderWorkAreaChips() {
  const areas = workAreaOptions();
  const counts = areaMenuCounts();
  const floorGroups = floorOptionsByArea();
  workAreaChips.innerHTML = areas.map((area) => {
    const floors = floorGroups.get(area) || [];
    return `
      <section class="area-group ${state.workAreas.has(area) ? "is-active" : ""}">
        <button type="button" class="area-toggle" data-work-area="${escapeHtml(area)}" aria-pressed="${state.workAreas.has(area)}">
          <b>${escapeHtml(displayWorkAreaName(area))}</b>
          <span>${counts.get(area) || 0}</span>
        </button>
        <div class="floor-filter" aria-label="${escapeHtml(displayWorkAreaName(area))} 楼层筛选">
          ${floors.map((floor) => `
            <button type="button" data-floor-key="${escapeHtml(floor.key)}" aria-pressed="${state.floorKeys.has(floor.key)}">
              <b>${escapeHtml(floor.floor)}</b>
              <span>${floor.count}</span>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }).join("");
  syncAreaGroupWidths();
}

function chooseSurprisePreference() {
  const options = preferenceOptions[state.meal] || preferenceOptions.all;
  const shuffled = [...options].sort(() => Math.random() - 0.5);
  const count = Math.min(2, Math.max(1, Math.floor(Math.random() * 2) + 1));
  state.prefs = new Set(shuffled.slice(0, count).map((option) => option.id));
  resetToMenuPhase();
  restoreVenueFiltersForMeal();
  renderPreferences();
  refresh();
}

function syncPrefsWithMeal() {
  const allowed = new Set((preferenceOptions[state.meal] || preferenceOptions.all).map((option) => option.id));
  state.prefs = new Set([...state.prefs].filter((pref) => allowed.has(pref)));
}

function syncMealButtons() {
  document.querySelectorAll("[data-meal]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.meal === state.meal));
  });
}

function restoreVenueFiltersForMeal() {
  const saved = state.manualVenueFiltersByMeal.get(state.meal);
  if (!saved) {
    selectAllFilters();
    return;
  }
  state.workAreas = new Set(saved.workAreas);
  state.floorKeys = new Set(saved.floorKeys);
}

function saveVenueFiltersForMeal() {
  state.manualVenueFiltersByMeal.set(state.meal, {
    workAreas: [...state.workAreas],
    floorKeys: [...state.floorKeys]
  });
}

function refresh() {
  syncWorkAreas();
  state.stationMenus = filteredMenus();
  state.menus = groupMenusByFloor(state.stationMenus);
  if (state.selectedMenu && !state.menus.some((menu) => menu.key === state.selectedMenu.key)) {
    state.selectedMenu = null;
    state.phase = "menu";
  }
  state.dishes = currentDishes();
  renderWheel();
  renderDishDeck();
  renderMenuList(state.menus);
  renderSideMealMeta();
  updateIdleResult();
  if (!state.spinning) spinButton.disabled = false;
}

function selectMenuGroup(menu) {
  const targetKey = menu.key;
  resetInteractionLock();
  state.phase = "dish";
  state.winner = null;
  state.deckShuffle += 1;
  state.deckStage = "idle";
  state.revealedCards = new Set();
  ensureMenuGroupVisible(menu);
  state.stationMenus = filteredMenus();
  state.menus = groupMenusByFloor(state.stationMenus);
  state.selectedMenu = state.menus.find((group) => group.key === targetKey) || menu;
  state.dishes = currentDishes();
  renderWheel();
  renderDishDeck();
  renderMenuList(state.menus);
  showSelectedMenu(state.selectedMenu);
  updateIdleResult();
  spinButton.disabled = false;
}

function focusWorkArea(area) {
  if (!area) return;
  state.workAreas = new Set([area]);
  state.floorKeys = new Set(floorOptions(area).map((floor) => floor.key));
  renderWorkAreaChips();
}

function focusMenuGroup(menu) {
  const area = workAreaOf(menu);
  if (!area) return;
  state.workAreas = new Set([area]);
  state.floorKeys = new Set([menu.key || floorKey(area, floorLabel(menu.station))]);
  renderWorkAreaChips();
}

function ensureMenuGroupVisible(menu) {
  const area = workAreaOf(menu);
  if (!area) return;
  const key = menu.key || floorKey(area, floorLabel(menu.station));
  state.workAreas.add(area);
  state.floorKeys.add(key);
  renderWorkAreaChips();
}

function resetInteractionLock() {
  state.spinning = false;
  spinButton.disabled = false;
  pointer?.classList.remove("is-spinning");
}

function filteredMenus() {
  return state.data.menus.filter((menu) => {
    const mealOk = menu.meal === state.meal;
    const venueOk = state.workAreas.has(workAreaOf(menu));
    const floorOk = state.floorKeys.has(floorKeyForMenu(menu));
    const items = matchingItems(menu);
    const hasDish = items.length > 0;
    const prefOk = !state.prefs.size || hasDish;
    return mealOk && venueOk && floorOk && hasDish && prefOk;
  });
}

function currentDishes() {
  if (state.selectedMenu) {
    return state.selectedMenu.menus.flatMap((menu) => matchingItems(menu).map((dish) => ({ dish, menu })));
  }
  return state.stationMenus.flatMap((menu) => matchingItems(menu).map((dish) => ({ dish, menu })));
}

function groupMenusByFloor(menus) {
  const groups = new Map();
  menus.forEach((menu) => {
    const workArea = workAreaOf(menu);
    const floor = floorLabel(menu.station);
    const key = `${workArea}::${floor}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        date: menu.date,
        meal: menu.meal,
        workArea,
        floor,
        station: floor,
        venue: `${workArea} · ${floor}`,
        title: `${workArea} · ${floor}`,
        time: menu.time,
        sourceMessage: `floor-${key}`,
        menus: [],
        items: []
      });
    }
    const group = groups.get(key);
    group.menus.push(menu);
    matchingItems(menu).forEach((item) => {
      if (!group.items.some((existing) => dishName(existing) === dishName(item))) group.items.push(item);
    });
  });
  return [...groups.values()].sort(sortMenuGroups);
}

function matchingItems(menu) {
  if (!state.prefs.size) return menu.items;
  const options = preferenceOptions[state.meal] || preferenceOptions.all;
  const rules = [...state.prefs]
    .map((pref) => options.find((option) => option.id === pref)?.rule)
    .filter(Boolean);
  return menu.items.filter((item) => rules.some((rule) => rule.test(dishSearchText(item))));
}

function syncWorkAreas() {
  const areas = workAreaOptions();
  const allowed = new Set(areas);
  state.workAreas = new Set([...state.workAreas].filter((area) => allowed.has(area)));
  if (!state.workAreas.size) state.workAreas = new Set(areas);
  syncFloorKeys();
  renderWorkAreaChips();
}

function updateIdleResult() {
  const menuCount = state.menus.length;
  const dishCount = state.dishes.length;
  resultLabel.textContent = state.selectedMenu ? displayVenue(state.selectedMenu.venue) : String(menuCount);
  resultDish.textContent = dishCount ? String(dishCount) : "暂无";
  spinButton.textContent = state.phase === "dish" ? (["dealt", "revealed"].includes(state.deckStage) ? "随机抽一张" : "抽抽吃什么") : state.phase === "done" ? "再一次" : "去哪吃";
  if (state.winner) {
    resultLabel.textContent = displayVenue(state.winner.menu.venue);
    resultDish.textContent = dishName(state.winner.dish);
  }
}

function renderWheel() {
  const size = canvas.width;
  const center = size / 2;
  const menuWheel = state.phase === "menu";
  const outerRadius = size * 0.43;
  const outerInnerRadius = size * (menuWheel ? 0.34 : 0.36);
  const floorOuterRadius = size * 0.325;
  const floorInnerRadius = size * 0.15;
  const innerRadius = size * (menuWheel ? 0.145 : 0.34);
  const hubRadius = size * (menuWheel ? 0.14 : 0.095);
  document.querySelector(".stage")?.classList.toggle("is-card-mode", state.phase !== "menu");
  document.querySelector(".stage")?.classList.toggle("is-menu-mode", state.phase === "menu");

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  const menuEntries = state.menus.length ? state.menus : [{ venue: "暂无菜单", title: "暂无菜单", workArea: "暂无菜单", floor: "" }];

  if (menuWheel) {
    const areaSegments = wheelAreaSegments(menuEntries);
    drawVariableRing({
      entries: areaSegments,
      rotation: state.outerRotation,
      outerRadius,
      innerRadius: outerInnerRadius,
      colors: ["#f6b755", "#ffd66f", "#f7c45b", "#eaa04b", "#ffe08a"],
      label: (entry) => displayWorkAreaName(entry.workArea),
      fontSize: areaWheelFontSize(areaSegments.length),
      maxWidth: (entry, angle) => {
        const tRadius = (outerRadius + outerInnerRadius) / 2;
        return Math.min(outerRadius * 0.7, angle * tRadius * 0.72);
      },
      maxLines: 1,
      minFontSize: 13,
      separatorWidth: areaSegments.length > 1 ? 4 : 0,
      textMode: "arc",
      textColor: "#2e5d35"
    });
    drawRing({
      entries: menuEntries,
      rotation: state.outerRotation,
      outerRadius: floorOuterRadius,
      innerRadius: floorInnerRadius,
      colors: ["#fff7bd", "#fff0cc", "#fff9df", "#ffe7b5"],
      label: (menu) => menu.floor || floorLabel(menu.station),
      subLabel: () => "",
      fontSize: floorWheelFontSize(menuEntries.length),
      maxWidth: (entryCount) => {
        const tRadius = (floorOuterRadius + floorInnerRadius) / 2;
        const arcLen = (Math.PI * 2 / entryCount) * tRadius * 0.86;
        return Math.min(floorOuterRadius * 0.52, arcLen);
      },
      maxLines: 1,
      textMode: "fit",
      minFontSize: 18,
      separatorWidth: menuEntries.length > 1 ? 3 : 0,
      textColor: "#6e3d21"
    });
  } else {
    drawRing({
      entries: menuEntries,
      rotation: state.outerRotation,
      outerRadius,
      innerRadius: outerInnerRadius,
      colors: outerColors,
      label: (menu) => wheelMenuLabel(menu),
      subLabel: () => "",
      fontSize: outerFontSize(state.menus.length),
      maxWidth: (entryCount) => {
        const tRadius = (outerRadius + outerInnerRadius) / 2;
        const arcLen = (Math.PI * 2 / entryCount) * tRadius * 0.82;
        const preferred = entryCount <= 5 ? outerRadius * 0.64 : outerRadius * 0.54;
        return Math.min(preferred, arcLen);
      },
      maxLines: (entryCount) => entryCount <= 5 ? 2 : 1,
      textMode: state.menus.length <= 5 ? "fit" : "arc",
      minFontSize: 11,
      separatorWidth: state.menus.length > 1 ? 3 : 0
    });
  }

  ctx.beginPath();
  ctx.arc(0, 0, innerRadius - 6, 0, Math.PI * 2);
  ctx.fillStyle = menuWheel ? "rgba(255, 120, 58, 0.92)" : "rgba(255, 247, 237, 0.95)";
  ctx.fill();
  if (menuWheel) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.stroke();
  }
  ctx.lineWidth = 0;

  ctx.beginPath();
  ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
  ctx.fillStyle = menuWheel ? "rgba(255, 244, 211, 0.72)" : "#fff";
  ctx.fill();
  ctx.lineWidth = menuWheel ? 2 : 7;
  ctx.strokeStyle = menuWheel ? "rgba(255, 255, 255, 0.72)" : "rgba(20,35,31,0.1)";
  ctx.stroke();
  ctx.fillStyle = "#14231f";
  ctx.textAlign = "center";
  if (!menuWheel) {
    ctx.font = "900 31px \"PingFang SC\", \"Hiragino Sans GB\", sans-serif";
    ctx.fillText("开饭", 0, 9);
  }
  ctx.restore();
}

function drawRing(options) {
  const { entries, rotation, outerRadius, innerRadius, colors, label, subLabel, fontSize, maxWidth, maxLines = 1, textMode = "fit", minFontSize = 14, separatorWidth = 4, textColor = "#271b13" } = options;
  const angle = (Math.PI * 2) / entries.length;
  entries.forEach((entry, index) => {
    const start = index * angle + rotation;
    const end = start + angle;
    const mid = start + angle / 2;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, start, end);
    ctx.arc(0, 0, innerRadius, end, start, true);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    if (separatorWidth > 0) {
      ctx.strokeStyle = "rgba(255,250,241,0.76)";
      ctx.lineWidth = separatorWidth;
      ctx.stroke();
    }

    ctx.save();
    const textRadius = (outerRadius + innerRadius) / 2;
    const entryMaxWidth = typeof maxWidth === "function" ? maxWidth(entries.length, entry, index) : maxWidth;
    const entryMaxLines = typeof maxLines === "function" ? maxLines(entries.length, entry, index) : maxLines;
    ctx.translate(Math.cos(mid) * textRadius, Math.sin(mid) * textRadius);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.shadowColor = "rgba(255, 255, 255, 0.55)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    if (textMode === "arc") {
      let tangent = normalize(mid + Math.PI / 2);
      if (tangent > Math.PI / 2 && tangent < Math.PI * 1.5) {
        tangent = normalize(tangent + Math.PI);
      }
      ctx.rotate(tangent);
      ctx.font = `900 ${fontSize}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
      drawFittedText(ctx, label(entry), 0, 0, entryMaxWidth, 1, fontSize, minFontSize);
    } else {
      ctx.font = `900 ${fontSize}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
      drawFittedText(ctx, label(entry), 0, secondaryOffset(subLabel(entry), -5), entryMaxWidth, entryMaxLines, fontSize, minFontSize);
    }
    const secondary = subLabel(entry);
    if (secondary) {
      ctx.globalAlpha = 0.82;
      ctx.font = `800 ${Math.max(15, fontSize - 8)}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
      drawWrappedText(ctx, secondary, 0, 16, entryMaxWidth * 0.86, 1, fontSize);
    }
    ctx.restore();
  });
}

function drawVariableRing(options) {
  const { entries, rotation, outerRadius, innerRadius, colors, label, fontSize, maxWidth, maxLines = 1, textMode = "fit", minFontSize = 14, separatorWidth = 4, textColor = "#271b13" } = options;
  const total = entries.reduce((sum, entry) => sum + Math.max(1, entry.span || 1), 0);
  const unitAngle = (Math.PI * 2) / total;
  let cursor = rotation;
  entries.forEach((entry, index) => {
    const angle = unitAngle * Math.max(1, entry.span || 1);
    const start = cursor;
    const end = cursor + angle;
    const mid = start + angle / 2;
    cursor = end;

    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, start, end);
    ctx.arc(0, 0, innerRadius, end, start, true);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    if (separatorWidth > 0) {
      ctx.strokeStyle = "rgba(255,250,241,0.78)";
      ctx.lineWidth = separatorWidth;
      ctx.stroke();
    }

    ctx.save();
    const textRadius = (outerRadius + innerRadius) / 2;
    const entryMaxWidth = typeof maxWidth === "function" ? maxWidth(entry, angle, index) : maxWidth;
    ctx.translate(Math.cos(mid) * textRadius, Math.sin(mid) * textRadius);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor;
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    let tangent = normalize(mid + Math.PI / 2);
    if (textMode === "arc") {
      if (tangent > Math.PI / 2 && tangent < Math.PI * 1.5) {
        tangent = normalize(tangent + Math.PI);
      }
      ctx.rotate(tangent);
    }
    ctx.font = `900 ${fontSize}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
    drawFittedText(ctx, label(entry), 0, 0, entryMaxWidth, maxLines, fontSize, minFontSize);
    ctx.restore();
  });
}

function wheelAreaSegments(menus) {
  const segments = [];
  menus.forEach((menu) => {
    const workArea = workAreaOf(menu);
    const last = segments[segments.length - 1];
    if (last && last.workArea === workArea) {
      last.span += 1;
    } else {
      segments.push({ workArea, span: 1 });
    }
  });
  return segments.length ? segments : [{ workArea: "暂无菜单", span: 1 }];
}

function wheelMenuLabel(menu) {
  if (!menu || !menu.venue) return "暂无菜单";
  if (menu.floor) return `${displayWorkAreaName(workAreaOf(menu))}-${menu.floor}`.trim();
  return `${displayWorkAreaName(workAreaOf(menu))}-${floorLabel(menu.station)}`.trim();
}

function floorLabel(station) {
  const value = String(station || "");
  const match = value.match(/(\d+)\s*(?:F|f|层|楼)/);
  return match ? `${match[1]}F` : "餐厅";
}

function outerFontSize(count) {
  if (count <= 3) return 38;
  if (count <= 5) return 34;
  if (count <= 8) return 30;
  return 26;
}

function menuWheelFontSize(count) {
  if (count <= 5) return 31;
  if (count <= 8) return 28;
  if (count <= 12) return 25;
  return 22;
}

function areaWheelFontSize(count) {
  if (count <= 3) return 30;
  if (count <= 5) return 27;
  return 24;
}

function floorWheelFontSize(count) {
  if (count <= 6) return 40;
  if (count <= 10) return 36;
  if (count <= 14) return 32;
  return 29;
}

function sortMenuGroups(a, b) {
  const areaOrder = workAreaOptions();
  const areaA = areaOrder.indexOf(a.workArea);
  const areaB = areaOrder.indexOf(b.workArea);
  if (areaA !== areaB) return (areaA === -1 ? 999 : areaA) - (areaB === -1 ? 999 : areaB);
  const floorA = floorNumber(a.floor);
  const floorB = floorNumber(b.floor);
  if (floorA !== floorB) return floorA - floorB;
  return String(a.floor || "").localeCompare(String(b.floor || ""), "zh-Hans-CN");
}

function floorNumber(floor) {
  const match = String(floor || "").match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function secondaryOffset(secondary, fallback) {
  return secondary ? fallback : 0;
}

function computeWrappedLines(context, text, maxWidth, maxLines) {
  const chars = [...String(text || "")];
  const lines = [];
  let current = "";
  for (let i = 0; i < chars.length; i++) {
    const next = current + chars[i];
    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = chars[i];
      if (lines.length === maxLines - 1) {
        current += chars.slice(i + 1).join("");
        break;
      }
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length ? lines : [String(text || "")];
}

function drawFittedText(context, text, x, y, maxWidth, maxLines, startFontSize, minFontSize) {
  let size = startFontSize;
  let lines = [];
  while (size >= minFontSize) {
    context.font = `900 ${size}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
    lines = wrapText(context, text, maxWidth, maxLines);
    const fits = lines.join("").length >= String(text || "").length && lines.every((line) => context.measureText(line).width <= maxWidth);
    if (fits) break;
    size -= 1;
  }

  context.font = `900 ${Math.max(size, minFontSize)}px "PingFang SC", "Hiragino Sans GB", sans-serif`;
  if (lines.join("").length < String(text || "").length) {
    lines = wrapText(context, text, maxWidth, maxLines).map((line, index, all) => {
      if (index !== all.length - 1) return line;
      let value = line;
      while (context.measureText(`${value}...`).width > maxWidth && value.length > 1) {
        value = value.slice(0, -1);
      }
      return `${value}...`;
    });
  }
  const lineHeight = Math.max(minFontSize + 2, Math.round(size * 1.12));
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));
}

function wrapText(context, text, maxWidth, maxLines) {
  return computeWrappedLines(context, text, maxWidth, maxLines);
}

function drawWrappedText(context, text, x, y, maxWidth, maxLines, lineHeight) {
  const lines = computeWrappedLines(context, text, maxWidth, maxLines);
  const lastLine = lines[lines.length - 1] || "";
  if (context.measureText(lastLine).width > maxWidth) {
    let trimmed = lastLine;
    while (context.measureText(`${trimmed}...`).width > maxWidth && trimmed.length > 1) {
      trimmed = trimmed.slice(0, -1);
    }
    lines[lines.length - 1] = `${trimmed}...`;
  }
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, x, startY + index * lineHeight));
}

function renderMenuList(groups) {
  if (!groups.length) {
    menuList.innerHTML = `<div class="empty">暂无菜单</div>`;
    menuList.scrollTop = 0;
    return;
  }
  menuList.innerHTML = groups.map((group) => {
    return `
    <article class="menu-card ${state.selectedMenu?.key === group.key ? "is-selected" : ""}" data-group-key="${escapeHtml(group.key)}" tabindex="0">
      <div class="card-header">
        <h3>${escapeHtml(groupCardTitle(group))}</h3>
      </div>
      <div class="items">${group.items.map((item) => {
        const badge = dishBadge(item);
        return `<span class="item" data-item="${escapeHtml(dishName(item))}">
          <i class="item-photo ${badge.isEmoji ? "is-emoji" : ""}" style="--tile-hue:${tileHue(dishName(item))}">${escapeHtml(badge.text)}</i>
          ${escapeHtml(dishName(item))}
        </span>`;
      }).join("")}</div>
    </article>
  `;
  }).join("");
  menuList.scrollTop = 0;
}

function renderDishDeck(activeIndex = -1, mode = "ready") {
  if (state.phase === "menu") {
    dishDeck.innerHTML = "";
    dishDeck.dataset.mode = "hidden";
    return;
  }
  dishDeck.dataset.mode = mode;
  const entries = state.dishes;
  if (!entries.length) {
    dishDeck.innerHTML = `<div class="empty">暂无菜品</div>`;
    return;
  }
  dishDeck.innerHTML = entries.map((entry, index) => {
    const badge = dishBadge(entry.dish);
    const isWinner = state.winner && dishName(state.winner.dish) === dishName(entry.dish) && state.winner.menu.sourceMessage === entry.menu.sourceMessage;
    const isRevealed = state.revealedCards.has(dishEntryKey(entry, index));
    const scatter = cardScatter(index, state.deckShuffle);
    return `
      <article class="dish-card ${index === activeIndex ? "is-peeking" : ""} ${isWinner ? "is-winner" : ""} ${isWinner || isRevealed ? "is-front" : ""}" data-card-index="${index}" tabindex="0" role="button" aria-label="翻开 ${escapeHtml(dishName(entry.dish))}" style="--dx:${scatter.x}px; --dy:${scatter.y}px; --rot:${scatter.rotate}deg; --pile-rot:${scatter.pileRotate}deg; --delay:${scatter.delay}ms">
        <div class="dish-card-inner">
          <div class="card-face card-back">
            <i>${escapeHtml(cardBackMark(index))}</i>
            <span>开饭牌</span>
          </div>
          <div class="card-face card-front">
            <div class="dish-card-fallback ${badge.isEmoji ? "is-emoji" : ""}" style="--tile-hue:${tileHue(dishName(entry.dish))}">${escapeHtml(badge.text)}</div>
            <div>
              <b>${escapeHtml(dishName(entry.dish))}</b>
              <span>${escapeHtml(displayVenue(entry.menu.venue))}</span>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function spin() {
  if (state.phase === "done") {
    document.querySelector(".result-modal")?.remove();
    resetToMenuPhase();
    state.manualVenueFiltersByMeal.delete(state.meal);
    selectAllFilters();
    state.deckShuffle += 1;
    document.querySelectorAll(".menu-card, .item").forEach((element) => element.classList.remove("is-winner", "is-selected"));
    refresh();
    return;
  }
  if (state.spinning || !state.menus.length) return;
  if (state.phase === "menu" && !spinEligibleMenus().length) return;
  if (state.phase === "dish" && !state.dishes.length) return;
  state.spinning = true;
  spinButton.disabled = true;
  pointer?.classList.add("is-spinning");
  primeAudio();
  try {
    if (state.phase === "dish" && !["dealt", "revealed"].includes(state.deckStage)) {
      shuffleAndDealDeck();
      return;
    }
    if (state.phase === "dish") {
      playShuffleStartSound();
    } else {
      playStartSound();
    }
    if (state.phase === "menu") {
      spinButton.textContent = "转动中";
      spinMenu();
      return;
    }
    drawDishCard();
  } catch (error) {
    console.error(error);
    resetInteractionLock();
    updateIdleResult();
  }
}

function spinMenu() {
  const eligibleMenus = spinEligibleMenus();
  const winningMenu = eligibleMenus[Math.floor(Math.random() * eligibleMenus.length)];
  const winningIndex = state.menus.indexOf(winningMenu);
  const outerDelta = rotationDelta(state.outerRotation, winningIndex, state.menus.length, 5);
  const startOuter = state.outerRotation;
  const duration = 3400;
  const startedAt = performance.now();

  function frame(now) {
    try {
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedOuter = spinEase(progress);
      state.outerRotation = startOuter + outerDelta * easedOuter;
      maybeTick(state.outerRotation, state.menus.length, progress);
      renderWheel();

      if (progress < 1) {
        requestAnimationFrame(frame);
        return;
      }

      state.outerRotation = startOuter + outerDelta;
      state.innerRotation = 0;
      selectMenuGroup(winningMenu);
      resetInteractionLock();
      updateIdleResult();
      playStepSound();
    } catch (error) {
      console.error(error);
      resetInteractionLock();
      updateIdleResult();
    }
  }

  requestAnimationFrame(frame);
}

function spinEligibleMenus() {
  return state.menus.filter((menu) => menu.items.length > 0);
}

function shuffleAndDealDeck() {
  state.deckShuffle += 1;
  state.winner = null;
  state.deckStage = "shuffling";
  spinButton.textContent = "洗牌中";
  playShuffleStartSound();
  renderDishDeck(-1, "pile");

  let ticks = 0;
  const maxTicks = 7;
  const timer = window.setInterval(() => {
    try {
      ticks += 1;
      maybeShuffleSound(ticks / maxTicks);
      renderDishDeck(Math.floor(Math.random() * state.dishes.length), "pile");
      if (ticks >= maxTicks) {
        window.clearInterval(timer);
        state.deckStage = "dealing";
        renderDishDeck(-1, "dealing");
        playDealSound();
        window.setTimeout(() => {
          state.deckStage = "dealt";
          renderDishDeck(-1, "ready");
          resetInteractionLock();
          updateIdleResult();
        }, 720);
      }
    } catch (error) {
      window.clearInterval(timer);
      console.error(error);
      resetInteractionLock();
      updateIdleResult();
    }
  }, 105);
}

function drawDishCard() {
  const winningIndex = Math.floor(Math.random() * state.dishes.length);
  const winningDishEntry = { ...state.dishes[winningIndex], index: winningIndex };
  const visibleCount = state.dishes.length;
  const visibleWinnerIndex = winningIndex;
  spinButton.textContent = "翻牌中";
  playShuffleStartSound();

  let ticks = 0;
  const maxTicks = 10;
  const timer = window.setInterval(() => {
    try {
      ticks += 1;
      const activeIndex = ticks < maxTicks ? Math.floor(Math.random() * visibleCount) : visibleWinnerIndex;
      maybeShuffleSound(ticks / maxTicks);
      renderDishDeck(activeIndex, "ready");
      if (ticks >= maxTicks) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          state.winner = winningDishEntry;
          state.deckStage = "revealed";
          state.phase = "done";
          state.revealedCards.add(dishEntryKey(winningDishEntry, winningIndex));
          renderWheel();
          renderDishDeck(-1, "revealed");
          scrollDeckCard(winningIndex);
          showDishResult(winningDishEntry, true);
          resetInteractionLock();
          updateIdleResult();
          playFlipSound();
          playWinSound();
        }, 120);
      }
    } catch (error) {
      window.clearInterval(timer);
      console.error(error);
      resetInteractionLock();
      updateIdleResult();
    }
  }, 90);
}

function revealManualCard(entry) {
  const key = dishEntryKey(entry, entry.index);
  if (!state.revealedCards.has(key)) {
    state.revealedCards.add(key);
    playFlipSound();
  }
  state.winner = entry;
  state.deckStage = "revealed";
  renderDishDeck(-1, "revealed");
  showDishResult(entry, false);
}

function scrollDeckCard(index) {
  const card = dishDeck.querySelector(`[data-card-index="${index}"]`);
  card?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
}

function spinEase(progress) {
  if (progress < 0.18) {
    return 0.5 * Math.pow(progress / 0.18, 2) * 0.18;
  }
  const t = (progress - 0.18) / 0.82;
  return 0.09 + 0.91 * (1 - Math.pow(1 - t, 3.4));
}

function primeAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") audioContext.resume();
}

function playTone(frequency, duration, type = "sine", gainValue = 0.08) {
  if (!audioContext) return;
  if (![frequency, duration, gainValue].every(Number.isFinite)) return;
  const safeFrequency = Math.max(20, Math.min(20000, frequency));
  const safeDuration = Math.max(0.01, Math.min(1.5, duration));
  const safeGain = Math.max(0.0001, Math.min(0.2, gainValue));
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = safeFrequency;
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(safeGain, audioContext.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + safeDuration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + safeDuration + 0.02);
}

function maybeTick(rotation, count, progress) {
  if (!audioContext || count <= 1) return;
  if (![rotation, count, progress].every(Number.isFinite)) return;
  const now = performance.now();
  const minGap = 42 + progress * 210;
  if (now - lastTickAt < minGap) return;
  lastTickAt = now;
  const pitch = 380 + Math.sin(rotation * count) * 40;
  playTone(pitch, 0.035, "square", 0.018);
  nudgePointer(progress);
}

function maybeShuffleSound(progress) {
  if (!audioContext) return;
  const now = performance.now();
  const minGap = 72 + progress * 120;
  if (now - lastShuffleAt < minGap) return;
  lastShuffleAt = now;
  const pitch = 160 + Math.random() * 90;
  playTone(pitch, 0.045, "sawtooth", 0.012);
  window.setTimeout(() => playTone(pitch * 1.42, 0.028, "triangle", 0.01), 18);
}

function playStartSound() {
  playTone(220, 0.08, "triangle", 0.045);
  window.setTimeout(() => playTone(330, 0.08, "triangle", 0.04), 70);
}

function playStepSound() {
  playTone(440, 0.08, "triangle", 0.045);
  window.setTimeout(() => playTone(660, 0.1, "triangle", 0.038), 90);
}

function playShuffleStartSound() {
  playTone(164, 0.055, "sawtooth", 0.025);
  window.setTimeout(() => playTone(196, 0.05, "sawtooth", 0.021), 45);
  window.setTimeout(() => playTone(147, 0.06, "triangle", 0.018), 92);
}

function playFlipSound() {
  playTone(310, 0.045, "triangle", 0.035);
  window.setTimeout(() => playTone(620, 0.055, "triangle", 0.03), 42);
}

function playDealSound() {
  [230, 260, 292, 328].forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, 0.045, "triangle", 0.018), index * 72);
  });
}

function playWinSound() {
  [523, 659, 784, 1046].forEach((frequency, index) => {
    window.setTimeout(() => playTone(frequency, 0.16, "triangle", 0.055), index * 95);
  });
}

function nudgePointer(progress) {
  if (!pointer || !pointer.animate) return;
  const tilt = Math.max(4, 13 - progress * 7);
  if (state.phase === "menu") {
    pointer.animate([
      { transform: "translateX(-50%) translateY(0) rotate(0deg)" },
      { transform: `translateX(-50%) translateY(3px) rotate(${tilt}deg)` },
      { transform: "translateX(-50%) translateY(0) rotate(0deg)" }
    ], {
      duration: Math.max(90, 160 - progress * 60),
      easing: "cubic-bezier(0.18, 0.86, 0.28, 1)"
    });
    return;
  }
  pointer.animate([
    { transform: "translateX(-50%) translateY(0) rotate(0deg)" },
    { transform: `translateX(-50%) translateY(-2px) rotate(${-tilt}deg)` },
    { transform: "translateX(-50%) translateY(0) rotate(0deg)" }
  ], {
    duration: Math.max(90, 160 - progress * 60),
    easing: "cubic-bezier(0.18, 0.86, 0.28, 1)"
  });
}

function showSelectedMenu(menu) {
  resultLabel.textContent = displayVenue(menu.venue);
  resultDish.textContent = `${state.dishes.length} 个菜品`;
  document.querySelectorAll(".menu-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.groupKey === menu.key);
    card.classList.remove("is-winner");
  });
  document.querySelector(`.menu-card[data-group-key="${cssEscape(menu.key || "")}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function rotationDelta(currentRotation, winningIndex, total, extraTurns) {
  const slice = (Math.PI * 2) / total;
  const pointerAngle = state.phase === "menu" ? 0 : -Math.PI / 2;
  const targetMiddle = winningIndex * slice + slice / 2;
  const desired = pointerAngle - targetMiddle;
  return normalize(desired - normalize(currentRotation)) + Math.PI * 2 * extraTurns;
}

function showDishResult(entry, withSurprise = false) {
  const blessing = blessings[Math.floor(Math.random() * blessings.length)];
  highlightWinner(entry);
  updateIdleResult();
  showResultModal(entry, blessing);
  if (withSurprise) {
    launchSurprise(blessing);
  }
}

function highlightWinner(entry) {
  const groupKey = floorKeyForMenu(entry.menu);
  document.querySelectorAll(".menu-card").forEach((card) => {
    card.classList.toggle("is-winner", card.dataset.groupKey === groupKey);
  });
  document.querySelectorAll(".item").forEach((item) => {
    const sameMenu = item.closest(".menu-card")?.dataset.groupKey === groupKey;
    item.classList.toggle("is-winner", sameMenu && item.dataset.item === dishName(entry.dish));
  });
  const card = document.querySelector(`.menu-card[data-group-key="${cssEscape(groupKey)}"]`);
  card?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function launchSurprise(message) {
  const burst = document.createElement("div");
  burst.className = "surprise";
  burst.setAttribute("aria-hidden", "true");
  const pieces = Array.from({ length: 22 }, (_, index) => {
    const emoji = surpriseEmojis[index % surpriseEmojis.length];
    const left = 8 + Math.random() * 84;
    const delay = Math.random() * 0.45;
    const drift = -90 + Math.random() * 180;
    return `<span style="left:${left}%; --delay:${delay}s; --drift:${drift}px">${emoji}</span>`;
  }).join("");
  burst.innerHTML = `${pieces}<b>${escapeHtml(message)}</b>`;
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 2600);
}

function showResultModal(entry, blessing) {
  document.querySelector(".result-modal")?.remove();
  const badge = dishBadge(entry.dish);
  const modal = document.createElement("div");
  modal.className = "result-modal";
  modal.innerHTML = `
    <section class="result-dialog" role="dialog" aria-modal="true" aria-label="转盘结果">
      <button class="result-close" type="button" aria-label="关闭结果">×</button>
      <div class="result-orbit" aria-hidden="true">${surpriseEmojis.slice(0, 6).map((emoji) => `<span>${emoji}</span>`).join("")}</div>
      <p class="result-eyebrow">今天就吃</p>
      <div class="result-image-fallback ${badge.isEmoji ? "is-emoji" : ""}" style="--tile-hue:${tileHue(dishName(entry.dish))}">${escapeHtml(badge.text)}</div>
      <h2>${escapeHtml(dishName(entry.dish))}</h2>
      <p class="result-place">${escapeHtml(displayVenue(entry.menu.venue))}</p>
      <p class="result-blessing">${escapeHtml(blessing)}</p>
      <div class="result-actions" aria-label="这次推荐操作">
        <button type="button" class="feedback-up" data-feedback-vote="up" aria-label="赞" aria-pressed="false" title="赞">👍</button>
        <button type="button" class="feedback-down" data-feedback-vote="down" aria-label="踩" aria-pressed="false" title="踩">👎</button>
        <button type="button" class="share-action" data-share-result aria-label="分享" title="分享">↗</button>
      </div>
    </section>
  `;
  const close = () => {
    document.removeEventListener("keydown", escHandler);
    modal.remove();
  };
  const escHandler = (event) => {
    if (event.key === "Escape") close();
  };
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  modal.querySelector(".result-close").addEventListener("click", close);
  modal.querySelector(".result-actions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-feedback-vote]");
    if (!button) return;
    pulseActionButton(button);
    const vote = button.dataset.feedbackVote;
    modal.querySelectorAll("[data-feedback-vote]").forEach((item) => {
      item.disabled = true;
      item.classList.toggle("is-selected", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    trackDishFeedback(entry, vote);
  });
  modal.querySelector("[data-share-result]").addEventListener("click", () => shareDishResult(entry, blessing, modal));
  document.addEventListener("keydown", escHandler);
  document.body.appendChild(modal);
  window.setTimeout(() => {
    modal.classList.add("is-visible");
    modal.querySelector(".result-close").focus();
  }, 20);
}

async function shareDishResult(entry, blessing, modal) {
  const shareUrl = sharedResultUrl(entry, blessing);
  const text = `我的开饭牌翻到了「${dishName(entry.dish)}」，在 ${displayVenue(entry.menu.venue)}。${blessing} 你也来试试手气。`;
  const button = modal.querySelector("[data-share-result]");
  pulseActionButton(button);

  try {
    await copyShareText(`${text}\n${shareUrl}`);
  } catch (error) {
    console.warn("Share failed", error);
  }
  setShareStatus(button, "已复制链接");
  showToast("已复制链接");
}

async function copyShareText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy command failed");
}

function pulseActionButton(button) {
  if (!button) return;
  button.classList.remove("is-tapping");
  void button.offsetWidth;
  button.classList.add("is-tapping");
  window.setTimeout(() => button.classList.remove("is-tapping"), 360);
}

function setShareStatus(button, text) {
  if (!button) return;
  const originalLabel = button.getAttribute("aria-label") || "分享";
  const originalTitle = button.getAttribute("title") || originalLabel;
  button.classList.add("is-selected");
  button.setAttribute("aria-label", text);
  button.setAttribute("title", text);
  window.setTimeout(() => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-label", originalLabel);
    button.setAttribute("title", originalTitle);
  }, 1600);
}

function showToast(message) {
  document.querySelector(".app-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "app-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.classList.add("is-visible"), 20);
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 1800);
}

function sharedResultUrl(entry, blessing) {
  const payload = {
    dish: dishName(entry.dish),
    badge: dishBadge(entry.dish).text,
    badgeEmoji: dishBadge(entry.dish).isEmoji,
    place: displayVenue(entry.menu.venue),
    meal: mealLabels[entry.menu.meal] || "",
    blessing
  };
  const url = new URL(location.href);
  url.searchParams.set("share", encodeSharePayload(payload));
  return url.toString();
}

function encodeSharePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSharePayload(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

function showSharedResultFromUrl() {
  if (state.sharedResultShown) return;
  const payload = decodeSharePayload(new URL(location.href).searchParams.get("share") || "");
  if (!payload?.dish || !payload?.place) return;
  state.sharedResultShown = true;
  document.querySelector(".result-modal")?.remove();

  const modal = document.createElement("div");
  modal.className = "result-modal result-modal-share";
  modal.innerHTML = `
    <section class="result-dialog" role="dialog" aria-modal="true" aria-label="分享的开饭牌">
      <button class="result-close" type="button" aria-label="关闭结果">×</button>
      <div class="result-orbit" aria-hidden="true">${surpriseEmojis.slice(0, 6).map((emoji) => `<span>${emoji}</span>`).join("")}</div>
      <p class="result-eyebrow">有人翻到了这张开饭牌</p>
      <div class="result-image-fallback ${payload.badgeEmoji ? "is-emoji" : ""}" style="--tile-hue:${tileHue(payload.dish)}">${escapeHtml(payload.badge || dishFallbackWord(payload.dish))}</div>
      <h2>${escapeHtml(payload.dish)}</h2>
      <p class="result-place">${escapeHtml(payload.place)}</p>
      <p class="result-blessing">${escapeHtml(payload.blessing || "这口看起来很会选。")}</p>
      <button type="button" class="result-share result-home" data-return-home>我来试试手气</button>
    </section>
  `;

  const close = () => {
    document.removeEventListener("keydown", escHandler);
    modal.remove();
  };
  const escHandler = (event) => {
    if (event.key === "Escape") close();
  };
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  modal.querySelector(".result-close").addEventListener("click", close);
  modal.querySelector("[data-return-home]").addEventListener("click", () => {
    const url = new URL(location.href);
    url.searchParams.delete("share");
    history.replaceState(null, "", url.toString());
    close();
  });
  document.addEventListener("keydown", escHandler);
  document.body.appendChild(modal);
  window.setTimeout(() => {
    modal.classList.add("is-visible");
    modal.querySelector("[data-return-home]").focus();
  }, 20);
}

function trackPageView() {
  trackEvent("page_view", {
    meal: state.meal,
    payload: {
      generatedAt: state.data?.generatedAt,
      menuCount: state.data?.menus?.length || 0,
      currentMenuCount: state.menus.length,
      currentDishCount: state.dishes.length,
      selectedWorkAreas: [...state.workAreas].map(displayWorkAreaName),
      selectedFloors: [...state.floorKeys],
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      path: location.pathname,
      referrer: document.referrer || ""
    }
  });
}

function trackDishFeedback(entry, vote) {
  if (!entry) return;
  const menu = entry.menu || {};
  trackEvent("dish_feedback", {
    meal: menu.meal || state.meal,
    work_area: displayWorkAreaName(workAreaOf(menu)),
    floor: floorLabel(menu.station),
    station: menu.station || "",
    dish_name: dishName(entry.dish),
    vote,
    payload: {
      venue: displayVenue(menu.venue),
      sourceMessage: menu.sourceMessage || "",
      dishSearchText: dishSearchText(entry.dish),
      generatedAt: state.data?.generatedAt
    }
  });
}

function trackEvent(eventType, detail = {}) {
  const row = {
    event_type: eventType,
    event_date: new Date().toISOString().slice(0, 10),
    session_id: analyticsSessionId(),
    meal: detail.meal || state.meal || null,
    work_area: detail.work_area || null,
    floor: detail.floor || null,
    station: detail.station || null,
    dish_name: detail.dish_name || null,
    vote: detail.vote || null,
    payload: detail.payload || {},
    user_agent: navigator.userAgent
  };

  sendAnalytics(row).catch(() => queueAnalytics(row));
}

async function sendAnalytics(row) {
  const response = await fetch(analyticsEndpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(row),
    keepalive: true
  });
  if (!response.ok) throw new Error(`analytics ${response.status}`);
  flushAnalyticsQueue();
}

function queueAnalytics(row) {
  try {
    const queued = JSON.parse(localStorage.getItem(analyticsQueueKey) || "[]");
    queued.push({ ...row, queued_at: new Date().toISOString() });
    localStorage.setItem(analyticsQueueKey, JSON.stringify(queued.slice(-50)));
  } catch (error) {
    console.warn("Failed to queue analytics", error);
  }
}

function flushAnalyticsQueue() {
  let queued = [];
  try {
    queued = JSON.parse(localStorage.getItem(analyticsQueueKey) || "[]");
  } catch {
    queued = [];
  }
  if (!queued.length) return;
  localStorage.removeItem(analyticsQueueKey);
  queued.slice(0, 10).forEach((row) => {
    fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(row),
      keepalive: true
    }).catch(() => queueAnalytics(row));
  });
}

function analyticsSessionId() {
  try {
    const existing = localStorage.getItem(analyticsSessionKey);
    if (existing) return existing;
    const value = window.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(analyticsSessionKey, value);
    return value;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function normalize(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function defaultMealByTime(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const nextMeal = mealTimeline.find((item) => minutes <= item.end);
  return nextMeal?.meal || "dinner";
}

function formatGeneratedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function workAreaOptions() {
  const configured = state.data?.source?.workAreas?.filter(Boolean) || [];
  const fallback = state.data?.menus?.map(workAreaOf).filter(Boolean) || [];
  return [...new Set(configured.length ? configured : fallback)].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function selectAllFilters() {
  state.workAreas = new Set(workAreaOptions());
  state.floorKeys = new Set(floorOptions().map((floor) => floor.key));
}

function dishName(item) {
  return cleanDishName(typeof item === "string" ? item : String(item?.name || ""));
}

function dishImages(item) {
  return typeof item === "object" && Array.isArray(item?.imageURLs) ? item.imageURLs : [];
}

function dishSearchText(item) {
  if (typeof item === "string") return item;
  if (typeof item.s === "string") return item.s; // 精简版已预拼好搜索串（含 __has_image__ / __box__）
  return [
    item.name,
    item.description,
    item.typeName,
    item.kindName,
    item.dishType,
    item.cuisine,
    item.proteinType,
    item.servingTemperature,
    ...(item.flavours || []),
    ...(item.ingredients || []),
    ...(dishImages(item).length ? ["__has_image__"] : []),
    ...(String(item.kindCode || "").includes("BOX") ? ["__box__"] : []),
    ...Object.values(item.tags || {}).flat()
  ].filter(Boolean).join(" ");
}

function cleanDishName(value) {
  return String(value || "")
    .replace(/[（(]\s*(?:20\d{2}\.)?\d{1,2}\.\d{1,2}\s*[-~至–—－]\s*\d{1,2}\.\d{1,2}\s*[）)]/g, "")
    .replace(/[（(]\s*\d{1,2}\.\d{1,2}\s*[-~至–—－]\s*\d{1,2}\s*[）)]/g, "")
    .replace(/[（(]\s*\d{1,2}\.\d{1,2}\s*[-~至–—－]\s*\d{1,2}\.\d{1,2}\s*[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function areaMenuCounts() {
  const counts = new Map();
  for (const menu of state.data?.menus || []) {
    if (menu.meal !== state.meal) continue;
    const items = matchingItems(menu);
    if (!items.length) continue;
    const area = workAreaOf(menu);
    counts.set(area, (counts.get(area) || 0) + 1);
  }
  return counts;
}

function areaGroupWidth(area, floors, count) {
  const areaName = displayWorkAreaName(area);
  const horizontalPadding = 12;
  const headerWidth = estimateChipWidth(areaName, count, {
    textUnit: 15,
    countUnit: 10,
    base: 56,
    badge: 24
  });
  const floorWidth = floors.length
    ? floors.reduce((sum, floor) => sum + estimateChipWidth(floor.floor, floor.count, {
      textUnit: 12,
      countUnit: 9,
      base: 28,
      badge: 18
    }), 0) + Math.max(0, floors.length - 1) * 6
    : 0;
  if (floors.length) return floorWidth + horizontalPadding;
  return Math.max(118, headerWidth) + horizontalPadding;
}

function estimateChipWidth(label, count, { textUnit, countUnit, base, badge }) {
  const text = [...String(label || "")].length * textUnit;
  const value = [...String(count || 0)].length * countUnit;
  return Math.ceil(base + text + badge + value);
}

function syncAreaGroupWidths() {
  requestAnimationFrame(() => {
    workAreaChips.querySelectorAll(".area-group").forEach((group) => {
      const areaToggle = group.querySelector(".area-toggle");
      const floorFilter = group.querySelector(".floor-filter");
      if (!areaToggle || !floorFilter) return;
      const title = areaToggle.querySelector("b");
      const countBadge = areaToggle.querySelector("span");
      const titleWidth = Math.ceil(title?.scrollWidth || 0);
      const badgeWidth = Math.ceil(countBadge?.getBoundingClientRect().width || 19);
      const headerWidth = titleWidth + badgeWidth + 6 + 12 + 12;
      const floorButtons = [...floorFilter.querySelectorAll("button")];
      if (!floorButtons.length) {
        group.style.setProperty("--group-width", `${Math.max(118, headerWidth)}px`);
        return;
      }
      const contentWidth = floorButtons.reduce((sum, button) => (
        sum + Math.ceil(button.getBoundingClientRect().width)
      ), 0);
      const gaps = Math.max(0, floorButtons.length - 1) * 6;
      const floorWidth = contentWidth + gaps + 12;
      const width = Math.max(headerWidth, floorWidth);
      group.style.setProperty("--group-width", `${width}px`);
    });
  });
}

function floorOptions(targetArea = "") {
  const groups = new Map();
  for (const menu of state.data?.menus || []) {
    const area = workAreaOf(menu);
    if (targetArea && area !== targetArea) continue;
    if (menu.meal !== state.meal) continue;
    const items = matchingItems(menu);
    if (!items.length) continue;
    const floor = floorLabel(menu.station);
    const key = floorKey(area, floor);
    if (!groups.has(key)) groups.set(key, { key, workArea: area, floor, count: 0 });
    groups.get(key).count += 1;
  }
  return [...groups.values()].sort((a, b) => (
    workAreaOptions().indexOf(a.workArea) - workAreaOptions().indexOf(b.workArea)
    || floorSortValue(a.floor) - floorSortValue(b.floor)
    || a.floor.localeCompare(b.floor, "zh-CN")
  ));
}

function floorOptionsByArea() {
  const groups = new Map();
  for (const floor of floorOptions()) {
    if (!groups.has(floor.workArea)) groups.set(floor.workArea, []);
    groups.get(floor.workArea).push(floor);
  }
  return groups;
}

function toggleWorkAreaFilter(area) {
  const areaFloors = floorOptions(area).map((floor) => floor.key);
  const isActive = state.workAreas.has(area);
  if (isActive) {
    if (state.workAreas.size === 1) {
      state.workAreas = new Set(workAreaOptions().filter((item) => item !== area));
      state.floorKeys = new Set(floorOptions().filter((floor) => floor.workArea !== area).map((floor) => floor.key));
    } else {
      state.workAreas.delete(area);
      areaFloors.forEach((key) => state.floorKeys.delete(key));
    }
  } else {
    state.workAreas.add(area);
    areaFloors.forEach((key) => state.floorKeys.add(key));
  }
  if (!state.workAreas.size || !state.floorKeys.size) selectAllFilters();
}

function toggleFloorFilter(key) {
  const floor = floorOptions().find((item) => item.key === key);
  if (!floor) return;
  if (state.floorKeys.has(key)) {
    if (state.floorKeys.size === 1) {
      state.floorKeys = new Set(floorOptions().filter((item) => item.key !== key).map((item) => item.key));
    } else {
      state.floorKeys.delete(key);
    }
  } else {
    state.floorKeys.add(key);
  }
  state.workAreas = new Set(floorOptions().filter((item) => state.floorKeys.has(item.key)).map((item) => item.workArea));
  if (!state.workAreas.size || !state.floorKeys.size) selectAllFilters();
}

function syncFloorKeys() {
  const floors = floorOptions();
  const validKeys = new Set(floors.map((floor) => floor.key));
  state.floorKeys = new Set([...state.floorKeys].filter((key) => {
    const floor = floors.find((item) => item.key === key);
    return validKeys.has(key) && floor && state.workAreas.has(floor.workArea);
  }));
  if (!state.floorKeys.size) {
    state.floorKeys = new Set(floors.filter((floor) => state.workAreas.has(floor.workArea)).map((floor) => floor.key));
  }
  state.workAreas = new Set(floors.filter((floor) => state.floorKeys.has(floor.key)).map((floor) => floor.workArea));
  if (!state.workAreas.size) selectAllFilters();
}

function isMenuInSelectedGroup(menu) {
  return Boolean(state.selectedMenu?.menus?.some((entry) => entry.sourceMessage === menu.sourceMessage));
}

function groupCardTitle(group) {
  return `${displayWorkAreaName(group.workArea)} ${group.floor}`.trim();
}

function renderSideMealMeta() {
  if (!sideMealMeta) return;
  const times = [...new Set(state.stationMenus.map((menu) => menu.time).filter(Boolean))];
  const timeText = times.length === 1 ? times[0] : times.length > 1 ? `${times[0]} 等` : "时间待定";
  sideMealMeta.textContent = `${mealLabels[state.meal] || "当前"} ${timeText}`;
}

function dishInitial(item) {
  const value = dishName(item).replace(/[^\p{Letter}\p{Number}]/gu, "");
  return [...value][0] || "食";
}

function dishBadge(item) {
  const text = dishSearchText(item) || dishName(item);
  for (const [pattern, icon] of FOOD_ICON_RULES) {
    if (pattern.test(text)) return { text: icon, isEmoji: true };
  }
  return { text: dishFallbackWord(item), isEmoji: false };
}

function dishFallbackWord(item) {
  const name = dishName(item).replace(/[🌶️🔥✨⭐️]/g, "").trim();
  const tokens = name.match(/[\p{Script=Han}]+|[A-Za-z0-9]+/gu) || [];
  const last = tokens[tokens.length - 1] || name || "食";
  if (/^[A-Za-z0-9]+$/.test(last)) return last.slice(-1).toUpperCase();
  return [...last].slice(-1).join("") || "食";
}

function tileHue(value) {
  let hash = 0;
  for (const char of String(value || "")) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return (hash % 300) + 20;
}

function cardScatter(index, seed) {
  const value = Math.sin((index + 1) * 41.7 + seed * 13.3);
  const value2 = Math.cos((index + 1) * 29.3 + seed * 17.1);
  return {
    x: Math.round(value * 4),
    y: Math.round(value2 * 3),
    rotate: Math.round((value - value2) * 1.6),
    pileRotate: Math.round((value - value2) * 8),
    delay: (index % 6) * 24
  };
}

function dishEntryKey(entry, index) {
  return `${entry.menu?.sourceMessage || "menu"}::${dishName(entry.dish)}::${index}`;
}

function cardBackMark(index) {
  return ["食", "味", "抽", "饭", "菜", "香"][index % 6];
}

function workAreaOf(menu) {
  return menu.workArea || String(menu.venue || "").split(" · ")[0];
}

function floorKeyForMenu(menu) {
  return floorKey(workAreaOf(menu), floorLabel(menu.station));
}

function floorKey(workArea, floor) {
  return `${workArea}::${floor}`;
}

function floorSortValue(floor) {
  const match = String(floor || "").match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function displayMenuTitle(menu) {
  return `${displayWorkAreaName(workAreaOf(menu))}${mealLabels[menu.meal] || ""} ${menu.station || ""}`.trim();
}

function displayVenue(venue) {
  const [workArea, station] = String(venue || "").split(" · ");
  return station ? `${displayWorkAreaName(workArea)} · ${station}` : displayWorkAreaName(venue);
}

function displayWorkAreaName(name) {
  const value = String(name || "");
  if (/上海新江湾广场T1/i.test(value)) return "T1";
  if (/上海新江湾广场T2a/i.test(value)) return "T2a";
  if (/上海新江湾广场T4b/i.test(value)) return "T4b";
  if (/云际尚浦A塔/.test(value)) return "云际A塔";
  if (/尚浦商务中心5幢/.test(value)) return "尚浦5幢";
  return value.replace(/^上海新江湾广场/i, "");
}

// 食物图标规则表：按优先级从高到低匹配餐厅名 + 菜品名
// 维护方式：在对应分类下增减正则即可，规则越靠前优先级越高
const FOOD_ICON_RULES = [
  // ── 品牌直匹（最高优先）──────────────────────────────────────
  [/KFC|肯德基/,                    "🍗"],   // 炸鸡桶
  [/棒约翰/,                        "🍕"],   // 披萨
  [/KPRO/,                         "🥗"],   // 沙拉轻食
  [/老北京烤鸭/,                     "🦆"],   // 烤鸭
  [/煲天下/,                        "🥗"],   // 轻食煲，先于砂锅规则

  // ── 龙虾 / 蟹 ────────────────────────────────────────────────
  [/龙虾/,                          "🦞"],   // 龙虾
  [/蟹/,                            "🦀"],   // 螃蟹

  // ── 虾 ───────────────────────────────────────────────────────
  [/虾(?!米)/,                      "🦐"],   // 鲜虾、虾仁（排除虾米）

  // ── 鱿鱼 / 墨鱼 ──────────────────────────────────────────────
  [/鱿鱼|墨鱼|章鱼|八爪/,            "🦑"],   // 头足类

  // ── 天妇罗 / 炸海鲜 ──────────────────────────────────────────
  [/天妇罗|炸虾/,                    "🍤"],   // 裹粉炸物

  // ── 鱼类（河鱼/海鱼/鱼类菜品）────────────────────────────────
  [/酸菜鱼|鱼韵|渝是鱼|鱼(?!丸)/,   "🐟"],   // 各类鱼馆

  // ── 鲜蘸 / 其他海鲜 ──────────────────────────────────────────
  [/海鲜|海产|鲜蘸/,                 "🐠"],   // 其他海鲜小馆

  // ── 寿司 / 刺身 ──────────────────────────────────────────────
  [/寿司|刺身|生鱼片/,               "🍣"],   // 日式生食

  // ── 饺子 / 包点 / 蒸制 ────────────────────────────────────────
  [/饺|馄饨|云饺/,                   "🥟"],   // 饺子馄饨
  [/小笼|生煎/,                      "🥟"],   // 包点
  [/蒸蒸/,                          "🥟"],   // 蒸制

  // ── 串串 / 关东煮 ────────────────────────────────────────────
  [/串串|关东煮|烤串|撸串/,           "🍢"],   // 串类

  // ── 米线 / 粉 ────────────────────────────────────────────────
  [/米线|拌粉|米粉|过桥/,            "🍜"],   // 米类粉面

  // ── 面食（宽匹配放后，避免误伤）────────────────────────────────
  [/面(?!包)|刀削|拌面|手工面|千面|劲道|乌冬/, "🍜"],  // 面条

  // ── 粥品 ─────────────────────────────────────────────────────
  [/粥|麦片|燕麦/,                   "🥣"],   // 粥类

  // ── 咖喱 ─────────────────────────────────────────────────────
  [/咖喱|curry/i,                    "🍛"],   // 咖喱饭

  // ── 轻食 / 沙拉 ──────────────────────────────────────────────
  [/轻食|轻卡|轻能|轻ING|简卡|轻选|沙拉/, "🥗"], // 轻食沙拉

  // ── 麻辣 / 热辣 / 水煮 ────────────────────────────────────────
  [/麻辣烫|热辣|滚烫|水煮江湖|火锅/,  "🌶️"],  // 辣系

  // ── 砂锅 / 炖汤 / 汤锅 ────────────────────────────────────────
  [/砂锅|炖炖|沸腾|锅锅|暖心|猪肚鸡|牛肉汤/, "🍲"], // 砂锅炖汤

  // ── 烤鸭 ─────────────────────────────────────────────────────
  [/烤鸭|北京鸭/,                    "🦆"],   // 烤鸭

  // ── 烧腊 / 卤味 ──────────────────────────────────────────────
  [/烧腊|烧味|粤港烧|粤式烧/,         "🍖"],   // 烧腊卤味

  // ── 铁板 / 板烧 ──────────────────────────────────────────────
  [/铁板|板烧/,                      "🥩"],   // 铁板烧

  // ── 日式（未命中前面细分规则的日料）────────────────────────────
  [/日式|日料|韩食/,                 "🍱"],   // 日韩料理便当

  // ── 韩式 ─────────────────────────────────────────────────────
  [/韩|石锅拌饭|泡菜/,               "🍱"],   // 韩式料理

  // ── 汉堡 / 西式快餐 ──────────────────────────────────────────
  [/汉堡|burger/i,                   "🍔"],   // 汉堡
  [/三明治|sandwich/i,               "🥪"],   // 三明治

  // ── 炸鸡 ─────────────────────────────────────────────────────
  [/炸鸡|鸡腿|鸡排/,                 "🍗"],   // 炸鸡

  // ── 早餐 / 蛋类 ──────────────────────────────────────────────
  [/早餐|暖厨/,                      "🍳"],   // 早点
  [/溏心蛋|煎蛋|卤蛋/,               "🥚"],   // 蛋类

  // ── 豆制品 ───────────────────────────────────────────────────
  [/豆腐|豆浆|豆坊|老磨豆/,           "🫘"],   // 豆制品

  // ── 烙馍 / 大饼 ──────────────────────────────────────────────
  [/饼语|烙馍/,                      "🫓"],   // 大饼/烙馍

  // ── 甜品 ─────────────────────────────────────────────────────
  [/甜品|蛋糕|甜点|糕点/,             "🍰"],   // 甜品糕点

  // ── 草原 / 羊肉 ──────────────────────────────────────────────
  [/草原|牧歌|羊(?!肉卷)/,            "🐑"],   // 草原羊

  // ── 北方风味 / 香灶 ──────────────────────────────────────────
  [/北味|香灶|北方/,                  "🥘"],   // 北方炖菜大锅

  // ── 川湘 / 西南 ──────────────────────────────────────────────
  [/川|湘遇|贵州|疆驭|川湘/,          "🫕"],   // 川湘西南

  // ── 粤菜 / 港式 / 江浙 / 南洋 ────────────────────────────────
  [/粤|港仔|港式|南洋|江浙|金陵|京粤/, "🥢"],  // 粤港江浙

  // ── 牛肉（非汤类）────────────────────────────────────────────
  [/牛肉(?!汤)|牛排/,                 "🥩"],   // 牛肉牛排

  // ── 自选 / 现炒 / 食堂 ────────────────────────────────────────
  [/自选|现炒|盖饭|炒饭|风味|食堂/,   "🍚"],   // 食堂自选
];

function menuFoodIcon(menu) {
  const text = `${menu.station || ""} ${(menu.items || []).map(dishName).join(" ")}`;
  for (const [pattern, icon] of FOOD_ICON_RULES) {
    if (pattern.test(text)) return icon;
  }
  return "🥢";
}

loadMenu().catch((error) => {
  document.querySelector("#sourceTitle").textContent = "菜单加载失败";
  resultDish.textContent = "检查 data/menu.json";
  resultLabel.textContent = error.message;
});
