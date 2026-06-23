// Background service worker - 处理插件图标点击事件
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
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
