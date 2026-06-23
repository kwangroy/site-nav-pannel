// Background service worker - 处理插件图标点击事件
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || tab.id === chrome.tabs.TAB_ID_NONE) return;

  // 跳过不支持注入的页面（chrome://, edge://, about: 等）
  if (!tab.url || !/^https?:\/\//.test(tab.url)) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
  } catch (e) {
    // content script 未注入（如扩展刚安装/更新后已打开的标签页）
    // 手动注入 content script 再发送消息
    try {
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["css/panel.css"]
      });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["js/content.js"]
      });
      // 注入后再次发送消息
      await chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
    } catch (injectErr) {
      // 如果注入也失败（如受保护的页面），静默忽略
    }
  }
});

// 初始化默认网站数据（首次安装时）
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["sites"], (result) => {
    if (!result.sites) {
      const defaultSites = [
        { id: "1", name: "Google", url: "https://www.google.com", icon: "" },
        { id: "2", name: "GitHub", url: "https://github.com", icon: "" },
        { id: "3", name: "YouTube", url: "https://www.youtube.com", icon: "" },
        { id: "4", name: "Stack Overflow", url: "https://stackoverflow.com", icon: "" },
        { id: "5", name: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "" }
      ];
      chrome.storage.sync.set({ sites: defaultSites });
    }
  });
});
