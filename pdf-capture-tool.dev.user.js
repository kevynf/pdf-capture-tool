// ==UserScript==
// @name         PDF 捕获器（本地开发）
// @namespace    http://tampermonkey.net/
// @version      0.0.1-dev
// @description  从本地开发服务器加载 PDF 捕获器，并在源码变化时刷新页面
// @match        *://*/*
// @run-at       document-start
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// ==/UserScript==

(function () {
  'use strict';

  const serverUrl = 'http://127.0.0.1:5173';
  const pollIntervalMs = 750;
  let loadedVersion = null;

  function request(path) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: `${serverUrl}${path}?t=${Date.now()}`,
        timeout: 2000,
        onload: response => {
          if (response.status >= 200 && response.status < 300) {
            resolve(response.responseText);
          } else {
            reject(new Error(`HTTP ${response.status}`));
          }
        },
        onerror: () => reject(new Error('无法连接本地开发服务器')),
        ontimeout: () => reject(new Error('连接本地开发服务器超时')),
      });
    });
  }

  async function getVersion() {
    return JSON.parse(await request('/version')).version;
  }

  async function loadScript() {
    const source = await request('/pdf-capture-tool.user.js');
    loadedVersion = await getVersion();
    eval(`${source}\n//# sourceURL=pdf-capture-tool.user.js`);
  }

  async function checkForChanges() {
    try {
      const currentVersion = await getVersion();
      if (loadedVersion !== null && currentVersion !== loadedVersion) {
        location.reload();
      }
    } catch {
      // The development server may be restarting; the next poll will retry.
    }
  }

  loadScript()
    .then(() => setInterval(checkForChanges, pollIntervalMs))
    .catch(error => console.error('[PDF Capture Tool dev]', error));
})();
