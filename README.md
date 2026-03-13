# PDF Capture Tool

一个 Tampermonkey 用户脚本，用于捕获网页中的 PDF 链接，并支持复制和下载。

## 功能

- 自动捕获 PDF 请求
- 悬浮面板查看记录
- 一键复制链接 / 下载文件
- 支持暂停监听与本地保存

## 安装

1. 安装 Tampermonkey。
2. 打开脚本：<https://raw.githubusercontent.com/kevynf/pdf-capture-tool/main/pdf-capture-tool.user.js>
3. 在 Tampermonkey 页面点击安装。

## 使用

1. 打开目标网页。
2. 展开侧边悬浮面板。
3. 在列表中复制或下载 PDF。

## 权限说明

- `@match *://*/*`：在所有网页运行
- `@connect *`：允许跨域请求/下载
- `GM_download`、`GM_setClipboard`、`GM_getValue`、`GM_setValue`

如仅用于固定站点，建议自行缩小 `@match` 与 `@connect` 范围。

# 常见问题

- 捕获到了但下载失败：通常是登录态、签名过期或跨域限制。
- 面板不显示：检查脚本是否启用，以及页面是否命中 `@match`。

# 许可证

MIT，见 [LICENSE](./LICENSE)。
