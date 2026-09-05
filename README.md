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

## 本地开发预览

需要 Node.js 18 或更高版本，以及 Tampermonkey。

1. 在项目目录启动开发服务器：

   ```bash
   pnpm dev
   ```

   打开 <http://localhost:5173/> 可以直接查看 UI 演示页；页面会自动加载几条模拟 PDF 记录。

2. 在 Tampermonkey 中新建脚本，将 `pdf-capture-tool.dev.user.js` 的内容粘贴进去并保存。
3. 暂时禁用正式版“PDF 捕获器”，以免两个版本同时运行。
4. 打开需要测试的网页。开发加载器会从 `http://127.0.0.1:5173` 载入源码。

修改并保存 `pdf-capture-tool.user.js` 后，已打开的测试页面会自动刷新并运行最新代码。停止开发服务器后，开发加载器不会执行本地源码。

可通过 `DEV_PORT` 环境变量修改端口；同时需要修改开发加载器中的 `serverUrl`：

```powershell
$env:DEV_PORT = 5174
pnpm dev
```

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
