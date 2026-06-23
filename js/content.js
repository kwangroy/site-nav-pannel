// 网站导航控制盘 - Content Script
(function () {
  "use strict";

  let panelVisible = false;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let editingId = null;
  let deleteTargetId = null;

  // ==================== 创建面板 DOM ====================
  function createPanel() {
    // 主面板
    const panel = document.createElement("div");
    panel.id = "site-nav-panel";
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">&#x1F310; 网站导航</span>
        <div class="panel-actions">
          <button id="site-nav-minimize" title="最小化">&#x2212;</button>
          <button id="site-nav-close" title="关闭">&times;</button>
        </div>
      </div>
      <div class="panel-body" id="site-nav-list"></div>
      <div class="panel-footer">
        <button class="add-site-btn" id="site-nav-add-btn">+ 添加网站</button>
      </div>
    `;
    document.body.appendChild(panel);

    // 添加/编辑模态框
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "site-nav-modal-overlay";
    modalOverlay.innerHTML = `
      <div id="site-nav-modal">
        <div class="modal-title" id="site-nav-modal-title">添加网站</div>
        <div class="form-group">
          <label for="site-nav-input-name">网站名称</label>
          <input type="text" id="site-nav-input-name" placeholder="例如：Google" />
        </div>
        <div class="form-group">
          <label for="site-nav-input-url">网站地址</label>
          <input type="text" id="site-nav-input-url" placeholder="例如：https://www.google.com" />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" id="site-nav-modal-cancel">取消</button>
          <button class="save-btn" id="site-nav-modal-save">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // 删除确认弹窗
    const confirmOverlay = document.createElement("div");
    confirmOverlay.id = "site-nav-confirm-overlay";
    confirmOverlay.innerHTML = `
      <div id="site-nav-confirm">
        <div class="confirm-text">确定要删除这个网站吗？</div>
        <div class="confirm-actions">
          <button class="confirm-cancel-btn" id="site-nav-confirm-cancel">取消</button>
          <button class="confirm-delete-btn" id="site-nav-confirm-delete">删除</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmOverlay);

    bindEvents();
    loadSites();
  }

  // ==================== 事件绑定 ====================
  function bindEvents() {
    const panel = document.getElementById("site-nav-panel");
    const header = panel.querySelector(".panel-header");

    // 拖动功能
    header.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);

    // 关闭/最小化
    document.getElementById("site-nav-close").addEventListener("click", togglePanel);
    document.getElementById("site-nav-minimize").addEventListener("click", togglePanel);

    // 添加按钮
    document.getElementById("site-nav-add-btn").addEventListener("click", openAddModal);

    // 模态框事件
    document.getElementById("site-nav-modal-cancel").addEventListener("click", closeModal);
    document.getElementById("site-nav-modal-save").addEventListener("click", saveSite);
    document.getElementById("site-nav-modal-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeModal();
    });

    // 删除确认事件
    document.getElementById("site-nav-confirm-cancel").addEventListener("click", closeConfirm);
    document.getElementById("site-nav-confirm-delete").addEventListener("click", confirmDelete);
    document.getElementById("site-nav-confirm-overlay").addEventListener("click", function (e) {
      if (e.target === this) closeConfirm();
    });

    // 键盘快捷键 - Enter保存，Escape关闭
    document.getElementById("site-nav-modal-overlay").addEventListener("keydown", function (e) {
      if (e.key === "Enter") saveSite();
      if (e.key === "Escape") closeModal();
    });
  }

  // ==================== 拖动功能 ====================
  function startDrag(e) {
    if (e.target.tagName === "BUTTON") return;
    isDragging = true;
    const panel = document.getElementById("site-nav-panel");
    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    panel.classList.add("dragging");
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;
    const panel = document.getElementById("site-nav-panel");
    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    // 边界限制
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    panel.style.left = newX + "px";
    panel.style.top = newY + "px";
    panel.style.right = "auto";
  }

  function stopDrag() {
    if (isDragging) {
      isDragging = false;
      const panel = document.getElementById("site-nav-panel");
      panel.classList.remove("dragging");
    }
  }

  // ==================== 面板显示/隐藏 ====================
  function togglePanel() {
    const panel = document.getElementById("site-nav-panel");
    panelVisible = !panelVisible;
    if (panelVisible) {
      panel.classList.add("visible");
    } else {
      panel.classList.remove("visible");
    }
  }

  // ==================== 网站列表渲染 ====================
  function loadSites() {
    chrome.storage.sync.get(["sites"], (result) => {
      const sites = result.sites || [];
      renderSites(sites);
    });
  }

  function renderSites(sites) {
    const listEl = document.getElementById("site-nav-list");
    if (!sites || sites.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">&#x1F4D1;</div>
          <div class="empty-text">暂无网站，点击下方按钮添加</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = sites
      .map(
        (site) => `
      <div class="site-item" data-id="${site.id}" data-url="${escapeHtml(site.url)}">
        <div class="site-icon">
          <img src="${getFaviconUrl(site.url)}" alt="" onerror="this.style.display='none';this.parentNode.textContent='${getInitial(site.name)}'" />
        </div>
        <div class="site-info">
          <div class="site-name">${escapeHtml(site.name)}</div>
          <div class="site-url">${escapeHtml(site.url)}</div>
        </div>
        <div class="site-actions">
          <button class="edit-btn" data-id="${site.id}" title="编辑">&#x270E;</button>
          <button class="delete-btn" data-id="${site.id}" title="删除">&#x1F5D1;</button>
        </div>
      </div>
    `
      )
      .join("");

    // 绑定网站项点击事件
    listEl.querySelectorAll(".site-item").forEach((item) => {
      item.addEventListener("click", function (e) {
        if (e.target.closest(".site-actions")) return;
        const url = this.dataset.url;
        if (url) window.open(url, "_blank");
      });
    });

    // 编辑按钮
    listEl.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openEditModal(this.dataset.id);
      });
    });

    // 删除按钮
    listEl.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        openConfirm(this.dataset.id);
      });
    });
  }

  // ==================== 添加/编辑模态框 ====================
  function openAddModal() {
    editingId = null;
    document.getElementById("site-nav-modal-title").textContent = "添加网站";
    document.getElementById("site-nav-input-name").value = "";
    document.getElementById("site-nav-input-url").value = "";
    document.getElementById("site-nav-modal-overlay").classList.add("visible");
    document.getElementById("site-nav-input-name").focus();
  }

  function openEditModal(id) {
    chrome.storage.sync.get(["sites"], (result) => {
      const sites = result.sites || [];
      const site = sites.find((s) => s.id === id);
      if (!site) return;

      editingId = id;
      document.getElementById("site-nav-modal-title").textContent = "编辑网站";
      document.getElementById("site-nav-input-name").value = site.name;
      document.getElementById("site-nav-input-url").value = site.url;
      document.getElementById("site-nav-modal-overlay").classList.add("visible");
      document.getElementById("site-nav-input-name").focus();
    });
  }

  function closeModal() {
    document.getElementById("site-nav-modal-overlay").classList.remove("visible");
    editingId = null;
  }

  function saveSite() {
    const name = document.getElementById("site-nav-input-name").value.trim();
    let url = document.getElementById("site-nav-input-url").value.trim();

    if (!name || !url) {
      alert("请填写网站名称和地址");
      return;
    }

    // 自动补全协议
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    chrome.storage.sync.get(["sites"], (result) => {
      let sites = result.sites || [];

      if (editingId) {
        // 编辑模式
        sites = sites.map((s) => (s.id === editingId ? { ...s, name, url } : s));
      } else {
        // 添加模式
        const newSite = {
          id: Date.now().toString(),
          name,
          url,
          icon: ""
        };
        sites.push(newSite);
      }

      chrome.storage.sync.set({ sites }, () => {
        renderSites(sites);
        closeModal();
      });
    });
  }

  // ==================== 删除确认 ====================
  function openConfirm(id) {
    deleteTargetId = id;
    document.getElementById("site-nav-confirm-overlay").classList.add("visible");
  }

  function closeConfirm() {
    document.getElementById("site-nav-confirm-overlay").classList.remove("visible");
    deleteTargetId = null;
  }

  function confirmDelete() {
    if (!deleteTargetId) return;
    chrome.storage.sync.get(["sites"], (result) => {
      let sites = result.sites || [];
      sites = sites.filter((s) => s.id !== deleteTargetId);
      chrome.storage.sync.set({ sites }, () => {
        renderSites(sites);
        closeConfirm();
      });
    });
  }

  // ==================== 工具函数 ====================
  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return "";
    }
  }

  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : "?";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 消息监听 ====================
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "togglePanel") {
      togglePanel();
    }
  });

  // ==================== 初始化 ====================
  createPanel();
})();
