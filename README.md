# PeaceLife

PeaceLife 是一个给闲置 iPad 使用的家庭提醒 PWA。它可以作为桌面看板、提醒列表和前台语音播报工具。

## 功能

- 今日提醒时间线
- 下一件事大屏展示
- 本地保存提醒规则
- 仅今天、每天、工作日、周末、每周重复
- 浏览器通知
- 前台语音播报
- Safari 添加到 iPad 主屏幕
- 离线缓存基础界面

## 本地运行

在项目目录运行一个静态服务器，例如：

```powershell
node server.mjs
```

然后在 iPad Safari 打开：

```text
http://你的电脑局域网IP:5173
```

在 Safari 分享菜单中选择“添加到主屏幕”。

> 注意：iPadOS 对 PWA、Service Worker 和系统通知通常要求 HTTPS。局域网 `http://` 地址适合先体验界面和前台语音播报；如果要稳定安装到主屏幕并使用通知，建议部署到 HTTPS 地址，例如 GitHub Pages、Cloudflare Pages、自己的 HTTPS 服务器或内网 HTTPS 反向代理。

## 使用建议

让 iPad 保持插电并关闭过短的自动锁定时间。语音播报依赖浏览器前台运行，系统通知在 iPadOS 上需要把网页添加到主屏幕后更稳定。
