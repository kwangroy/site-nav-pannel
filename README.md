# 网站导航控制盘 - Chrome 扩展

一个可拖动的浮窗式常用网站导航 Chrome 插件，支持增删改查功能。

## 功能特性

- **浮窗控制盘**：点击插件图标后，页面右上角弹出一个可拖动的小窗口
- **拖动定位**：可以自由拖动窗口到屏幕任意位置
- **网站管理**：支持添加、编辑、删除常用网站（增删改查）
- **快速跳转**：点击网站项即可在新标签页打开对应网站
- **自动图标**：自动获取网站 favicon 作为图标显示
- **数据持久化**：使用 Chrome Storage API 同步存储，数据跨设备同步

## 安装方式

### 开发者模式加载

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启右上角的 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本项目文件夹

## 使用方法

1. 安装后点击浏览器工具栏中的插件图标
2. 页面上会出现一个可拖动的浮窗控制盘
3. 点击 **+ 添加网站** 按钮添加常用网站
4. 点击网站项即可跳转到对应网站
5. 鼠标悬停在网站项上，可以看到编辑和删除按钮
6. 拖动标题栏可以移动窗口位置
7. 点击 × 或 - 按钮可以关闭/最小化面板

## 项目结构

```
site-nav-pannel/
├── manifest.json          # Chrome 扩展配置文件
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── css/
│   └── panel.css          # 浮窗面板样式
├── js/
│   ├── background.js      # Service Worker（处理图标点击）
│   └── content.js         # Content Script（面板逻辑）
└── README.md
```

## 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript
- Chrome Storage Sync API
- CSS3（渐变、阴影、动画）

## 预设网站

首次安装会预设以下网站：
- Google
- GitHub
- YouTube
- Stack Overflow
- MDN Web Docs

你可以随时添加、编辑或删除这些网站。
