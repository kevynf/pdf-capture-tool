import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const host = '127.0.0.1';
const port = Number.parseInt(process.env.DEV_PORT || '5173', 10);
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.join(projectRoot, 'pdf-capture-tool.user.js');

function send(response, status, contentType, body) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);

    if (url.pathname === '/pdf-capture-tool.user.js') {
      const source = await readFile(scriptPath, 'utf8');
      send(response, 200, 'text/javascript; charset=utf-8', source);
      return;
    }

    if (url.pathname === '/version') {
      const file = await stat(scriptPath);
      send(
        response,
        200,
        'application/json; charset=utf-8',
        JSON.stringify({ version: `${file.mtimeMs}:${file.size}` }),
      );
      return;
    }

    if (url.pathname === '/') {
      send(
        response,
        200,
        'text/html; charset=utf-8',
        `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PDF Capture Tool UI Preview</title>
    <style>
      body { margin: 0; min-height: 100vh; background: #f4f4f5; color: #18181b; font: 14px system-ui, sans-serif; }
      main { max-width: 920px; margin: 0 auto; padding: 56px 24px; }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p { color: #52525b; }
      .preview-note { margin-top: 28px; padding: 16px; border: 1px solid #e4e4e7; border-radius: 10px; background: #fff; }
      .pdf-links { display: grid; gap: 8px; margin-top: 20px; }
      .pdf-links a { color: #2563eb; text-decoration: none; }
      .pdf-links a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <main>
      <h1>PDF Capture Tool</h1>
      <p>这是本地 UI 演示页。右侧悬浮按钮可以展开捕获面板。</p>
      <div class="preview-note">
        <strong>模拟捕获记录</strong>
        <div class="pdf-links">
          <a href="/samples/quarterly-report.pdf">季度报告.pdf</a>
          <a href="/samples/product-guide.pdf?download=1">产品使用指南.pdf</a>
          <a href="/samples/research-paper.pdf">研究论文.pdf</a>
        </div>
      </div>
    </main>
    <script src="/pdf-capture-tool.user.js"></script>
  </body>
</html>`,
      );
      return;
    }

    send(response, 404, 'text/plain; charset=utf-8', 'Not found\n');
  } catch (error) {
    console.error(error);
    send(response, 500, 'text/plain; charset=utf-8', 'Internal server error\n');
  }
});

server.listen(port, host, () => {
  console.log(`PDF Capture Tool development server: http://${host}:${port}`);
  console.log(`Userscript source: http://${host}:${port}/pdf-capture-tool.user.js`);
});
