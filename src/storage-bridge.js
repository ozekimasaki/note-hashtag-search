import { MESSAGE_CHANNEL, STORAGE_KEY } from "./messages.js";

function post(type, enabled) {
  window.postMessage(
    {
      channel: MESSAGE_CHANNEL,
      type,
      enabled: Boolean(enabled),
    },
    location.origin,
  );
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.origin !== location.origin) return;
  const data = event.data;
  if (!data || data.channel !== MESSAGE_CHANNEL) return;

  if (data.type === "get") {
    chrome.storage.local.get(STORAGE_KEY, (items) => {
      post("state", items?.[STORAGE_KEY]);
    });
    return;
  }

  if (data.type === "set") {
    chrome.storage.local.set({ [STORAGE_KEY]: Boolean(data.enabled) });
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[STORAGE_KEY]) return;
  post("changed", changes[STORAGE_KEY].newValue);
});
