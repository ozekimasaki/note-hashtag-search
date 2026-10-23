// Manifest の content_scripts は ES モジュールとして読み込めないため、
// ここ（通常のスクリプト）からモジュールを読み込む。
(() => {
  const page = document.createElement("script");
  page.type = "module";
  page.src = chrome.runtime.getURL("src/page.js");
  (document.head || document.documentElement).append(page);
  page.addEventListener("load", () => page.remove());

  import(chrome.runtime.getURL("src/storage-bridge.js"));
})();
