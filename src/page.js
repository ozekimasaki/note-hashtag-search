import {
  buildHashtagSearchUrl,
  isHashtagSearchLocation,
} from "./search-url.js";
import { MESSAGE_CHANNEL } from "./messages.js";

/**
 * Runs in the page's main world so it can cancel note's own submit handler.
 *
 * Selectors checked against the live note.com DOM on 2026-10-23.
 *
 * Desktop header (home and /search):
 *   form[action="/search"][role="search"]
 *   input[type="search"][name="q"]
 *   aria-label / placeholder: キーワードやクリエイターで検索
 *
 * Narrow layout, second form (md:hidden):
 *   form[role="search"]
 *   input[type="text"] with the same aria-label (no name attribute)
 *
 * On /search?q=%23AI those inputs render value="#AI".
 * Fallbacks: header input[type="search"], input[name="q"], the aria-label above.
 */

const TOGGLE_CLASS = "nhs-toggle";

const INPUT_SELECTORS = [
  'form[role="search"] input',
  'form[action="/search"] input',
  'form[action^="/search?"] input',
  "header input[type='search']",
  'input[type="search"][name="q"]',
  'input[aria-label="キーワードやクリエイターで検索"]',
];

/** @type {Map<HTMLInputElement, HTMLLabelElement>} */
const toggles = new Map();

let enabled = isHashtagSearchLocation(location.href);
let loadToken = 0;
let lastHref = location.href;
let navigationLock = 0;
let pointerToggledAt = 0;
let positionQueued = false;
let mountQueued = false;

const resizeObserver = new ResizeObserver(() => {
  queuePosition();
});

const domObserver = new MutationObserver(() => {
  scheduleMount();
});

function postToBridge(type, extra = {}) {
  window.postMessage(
    {
      channel: MESSAGE_CHANNEL,
      type,
      ...extra,
    },
    location.origin,
  );
}

function requestStoredEnabled() {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(value);
    };

    function onMessage(event) {
      if (event.source !== window || event.origin !== location.origin) return;
      const data = event.data;
      if (!data || data.channel !== MESSAGE_CHANNEL || data.type !== "state") return;
      finish(Boolean(data.enabled));
    }

    window.addEventListener("message", onMessage);
    let tries = 0;
    const ask = () => {
      if (settled) return;
      postToBridge("get");
      tries += 1;
      if (tries < 12) {
        setTimeout(ask, 50);
      } else {
        setTimeout(() => finish(undefined), 50);
      }
    };
    ask();
  });
}

function persistEnabled(value) {
  postToBridge("set", { enabled: Boolean(value) });
}

function setEnabled(next, { persist = true } = {}) {
  loadToken += 1;
  enabled = Boolean(next);
  syncToggles();
  if (persist) persistEnabled(enabled);
}

function initState() {
  const token = ++loadToken;
  const fromUrl = isHashtagSearchLocation(location.href);
  if (fromUrl) {
    enabled = true;
    persistEnabled(true);
  }
  syncToggles();

  requestStoredEnabled().then((stored) => {
    if (token !== loadToken) return;
    if (fromUrl) {
      enabled = true;
      if (!stored) persistEnabled(true);
    } else if (typeof stored === "boolean") {
      enabled = stored;
    }
    syncToggles();
  });
}

function syncToggles() {
  for (const toggle of toggles.values()) {
    const box = toggle.querySelector("input");
    if (box instanceof HTMLInputElement) box.checked = enabled;
    toggle.dataset.on = enabled ? "true" : "false";
  }
}

/**
 * @param {Element} element
 * @returns {element is HTMLInputElement}
 */
function isSearchInput(element) {
  if (!(element instanceof HTMLInputElement)) return false;
  const type = (element.getAttribute("type") || "text").toLowerCase();
  if (
    type === "hidden" ||
    type === "checkbox" ||
    type === "radio" ||
    type === "submit" ||
    type === "button" ||
    type === "file"
  ) {
    return false;
  }
  if (type === "search") return true;
  if ((element.getAttribute("name") || "").toLowerCase() === "q") return true;
  const label = `${element.getAttribute("aria-label") || ""} ${element.getAttribute("placeholder") || ""}`;
  return label.includes("検索");
}

/**
 * @param {EventTarget | null} target
 * @returns {target is HTMLFormElement}
 */
function isSearchForm(target) {
  if (!(target instanceof HTMLFormElement)) return false;
  if (target.getAttribute("role") === "search") return true;
  const action = target.getAttribute("action") || "";
  if (
    action === "/search" ||
    action.startsWith("/search?") ||
    action.includes("note.com/search")
  ) {
    return true;
  }
  return Boolean(target.querySelector('input[type="search"], input[name="q"]'));
}

/**
 * @param {ParentNode} [root]
 * @returns {HTMLInputElement[]}
 */
function findSearchInputs(root = document) {
  /** @type {Set<HTMLInputElement>} */
  const found = new Set();
  for (const selector of INPUT_SELECTORS) {
    for (const element of root.querySelectorAll(selector)) {
      if (isSearchInput(element)) found.add(element);
    }
  }
  return [...found];
}

/**
 * @param {HTMLFormElement} form
 * @returns {HTMLInputElement | null}
 */
function findQueryInput(form) {
  for (const element of form.querySelectorAll("input")) {
    if (isSearchInput(element)) return element;
  }
  return null;
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return false;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false;
  if (rect.right < 0 || rect.left > window.innerWidth) return false;

  for (let node = element; node instanceof Element; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    if (Number.parseFloat(style.opacity) === 0) return false;
    if (node === document.body) break;
  }
  return true;
}

function createToggle() {
  const label = document.createElement("label");
  label.className = TOGGLE_CLASS;
  label.title = "オンにすると、先頭の # を外してハッシュタグ検索（新しい順）を開きます";

  const box = document.createElement("input");
  box.className = "nhs-toggle__input";
  box.type = "checkbox";
  box.checked = enabled;

  const track = document.createElement("span");
  track.className = "nhs-toggle__track";
  track.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("span");
  thumb.className = "nhs-toggle__thumb";
  track.append(thumb);

  const text = document.createElement("span");
  text.className = "nhs-toggle__text";
  text.textContent = "#検索";

  label.append(box, track, text);
  label.dataset.on = enabled ? "true" : "false";

  box.addEventListener("change", () => {
    if (Date.now() - pointerToggledAt < 400) {
      box.checked = enabled;
      return;
    }
    setEnabled(box.checked);
  });

  return label;
}

function queuePosition() {
  if (positionQueued) return;
  positionQueued = true;
  requestAnimationFrame(() => {
    positionQueued = false;
    positionAll();
  });
}

function positionAll() {
  for (const [input, toggle] of toggles) {
    if (!input.isConnected) continue;
    if (!isVisible(input)) {
      toggle.hidden = true;
      continue;
    }
    const rect = input.getBoundingClientRect();
    toggle.hidden = false;
    toggle.style.top = `${rect.top + rect.height / 2}px`;
    toggle.style.left = `${rect.right - 6}px`;
  }
}

function mountAll() {
  if (!document.body) return;

  const inputs = findSearchInputs();
  const live = new Set(inputs);

  for (const input of inputs) {
    let toggle = toggles.get(input);
    if (!toggle || !toggle.isConnected) {
      toggle = createToggle();
      document.body.append(toggle);
      toggles.set(input, toggle);
      resizeObserver.observe(input);
    }
  }

  for (const [input, toggle] of toggles) {
    if (live.has(input) && input.isConnected) continue;
    resizeObserver.unobserve(input);
    toggle.remove();
    toggles.delete(input);
  }

  syncToggles();
  queuePosition();
}

function scheduleMount() {
  if (mountQueued) return;
  mountQueued = true;
  requestAnimationFrame(() => {
    mountQueued = false;
    mountAll();
  });
}

function goToHashtagSearch(rawQuery) {
  const url = buildHashtagSearchUrl(rawQuery);
  if (!url) return false;
  const now = Date.now();
  if (now - navigationLock < 800) return true;
  navigationLock = now;
  location.assign(url);
  return true;
}

function blockNoteNavigation(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

/**
 * @param {Event} event
 */
function onSubmit(event) {
  if (!enabled) return;
  if (!isSearchForm(event.target)) return;
  const input = findQueryInput(event.target);
  if (!input || !buildHashtagSearchUrl(input.value)) return;
  blockNoteNavigation(event);
  goToHashtagSearch(input.value);
}

/**
 * @param {MouseEvent} event
 */
function onClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest(`.${TOGGLE_CLASS}`)) {
    // detail 0 is a keyboard activation; leave that to the checkbox.
    if (event.detail !== 0) blockNoteNavigation(event);
    return;
  }
  if (!enabled || !target) return;
  const control = target.closest('button[type="submit"], input[type="submit"]');
  if (!control) return;
  const form = control.closest("form");
  if (!isSearchForm(form)) return;
  const input = findQueryInput(form);
  if (!input || !buildHashtagSearchUrl(input.value)) return;
  blockNoteNavigation(event);
  goToHashtagSearch(input.value);
}

/**
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (!enabled) return;
  if (event.key !== "Enter") return;
  if (event.isComposing || event.keyCode === 229) return;
  if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (!(event.target instanceof HTMLInputElement) || !isSearchInput(event.target)) return;
  const form = event.target.form || event.target.closest("form");
  if (!isSearchForm(form) || !buildHashtagSearchUrl(event.target.value)) return;
  blockNoteNavigation(event);
  goToHashtagSearch(event.target.value);
}

/**
 * @param {PointerEvent} event
 */
function onPointerDown(event) {
  const target = event.target instanceof Element ? event.target : null;
  const toggle = target?.closest(`.${TOGGLE_CLASS}`);
  if (!toggle || event.button !== 0) return;
  blockNoteNavigation(event);
  const box = toggle.querySelector("input");
  const next = !(box instanceof HTMLInputElement ? box.checked : enabled);
  pointerToggledAt = Date.now();
  setEnabled(next);
}

function onLocationChanged() {
  const href = location.href;
  if (href !== lastHref) {
    lastHref = href;
    if (isHashtagSearchLocation(href)) setEnabled(true);
  }
  scheduleMount();
}

function hookHistory() {
  for (const method of ["pushState", "replaceState"]) {
    const original = history[method];
    if (typeof original !== "function" || original.__noteHashSearch) continue;
    const patched = function patchedHistory(...args) {
      const result = original.apply(this, args);
      onLocationChanged();
      return result;
    };
    patched.__noteHashSearch = true;
    try {
      history[method] = patched;
    } catch {
      // The page can freeze history methods. popstate still covers back/forward.
    }
  }
  window.addEventListener("popstate", onLocationChanged);
  window.addEventListener("hashchange", onLocationChanged);
  window.navigation?.addEventListener("navigatesuccess", onLocationChanged);
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    lastHref = location.href;
    if (isHashtagSearchLocation(location.href)) setEnabled(true);
    scheduleMount();
  });
}

function start() {
  hookHistory();
  window.addEventListener("submit", onSubmit, true);
  window.addEventListener("click", onClick, true);
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("scroll", queuePosition, true);
  window.addEventListener("resize", queuePosition);
  window.visualViewport?.addEventListener("resize", queuePosition);
  window.visualViewport?.addEventListener("scroll", queuePosition);

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.channel !== MESSAGE_CHANNEL || data.type !== "changed") return;
    const next = Boolean(data.enabled);
    if (next === enabled) return;
    setEnabled(next, { persist: false });
  });

  initState();

  const observe = () => {
    if (!document.documentElement) return;
    domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    mountAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe, { once: true });
  } else {
    observe();
  }
}

start();
