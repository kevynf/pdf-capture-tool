// ==UserScript==
// @name         PDF 捕获器
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  捕获页面 PDF，极简 UI
// @author       Kevynf
// @license      MIT
// @homepageURL  https://github.com/kevynf/pdf-capture-tool
// @supportURL   https://github.com/kevynf/pdf-capture-tool/issues
// @downloadURL  https://raw.githubusercontent.com/kevynf/pdf-capture-tool/main/pdf-capture-tool.user.js
// @updateURL    https://raw.githubusercontent.com/kevynf/pdf-capture-tool/main/pdf-capture-tool.user.js
// @match        *://*/*
// @run-at       document-start
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      *
// ==/UserScript==

(function () {
  'use strict';

  if (window.__PDF_CATCHER_SINGLETON__) return;
  window.__PDF_CATCHER_SINGLETON__ = true;

  const isTopWindow = window === window.top;

  const CONFIG = {
    panelWidth: 320,
    panelMaxHeight: 460,
    debug: false,
    tryReadFetchBodyForPdf: true,
    defaultTop: 120,
    miniSize: 42,
    edgeSnapThreshold: 30,
    peekSize: 14,
    dockOpacity: 0.5,
    newItemDurationMs: 3 * 60 * 1000,
    storageKeyUI: '__pdf_catcher_pro_ui_v3_4__',
    storageKeyItems: '__pdf_catcher_pro_items_v3_4__',
    maxPersistedItems: 100,
  };

  // --- SVG Icons ---
  const ICONS = {
    pdf: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    scan: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/></svg>`,
    filter: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    pause: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    help: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  };

  const state = {
    items: new Map(),
    seq: 1,
    uiReady: false,
    isMini: true,
    dockSide: 'right',
    lastY: CONFIG.defaultTop,
    showOnlyNew: false,
    hovering: false,
    isPaused: false,
    showGuide: false,
  };

  // --- Storage & Utils ---
  function gmGet(key, fallback) { try { if (typeof GM_getValue === 'function') return GM_getValue(key, fallback); } catch {} try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
  function gmSet(key, value) { try { if (typeof GM_setValue === 'function') return GM_setValue(key, value); } catch {} try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function normalizeUrl(url) { if (!url) return ''; try { const u = new URL(url, location.href); u.hash = ''; return u.href; } catch { return url; } }
  function sanitizeFilename(name) { return String(name).replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim() || 'download.pdf'; }
  function getFileNameFromUrl(url) { try { const u = new URL(url, location.href); const path = u.pathname.split('/').filter(Boolean); let name = decodeURIComponent(path[path.length - 1] || 'download.pdf'); if (!/\.pdf$/i.test(name)) name += '.pdf'; return sanitizeFilename(name); } catch { return 'download.pdf'; } }
  function parseFilenameFromContentDisposition(cd) { if (!cd) return ''; let m = cd.match(/filename\*=UTF-8''([^;]+)/i); if (m && m[1]) { try { return sanitizeFilename(decodeURIComponent(m[1].replace(/["']/g, ''))); } catch {} } m = cd.match(/filename="?([^"]+)"?/i); if (m && m[1]) return sanitizeFilename(m[1]); return ''; }
  function isLikelyPdfUrl(url) { if (!url) return false; return (/\.pdf(?:$|[?#])/i.test(url) || /[?&](file|filename|download|attachment)=[^&#]*\.pdf(?:$|[&#])/i.test(url) || /^blob:/i.test(url) || /^data:application\/pdf/i.test(url)); }
  function isPdfContentType(contentType) { return /application\/pdf|application\/x-pdf|text\/pdf/i.test(contentType || ''); }
  function arrayBufferStartsWithPdfMagic(buffer) { if (!buffer || buffer.byteLength < 5) return false; const bytes = new Uint8Array(buffer.slice(0, 5)); return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D; }
  function escapeHtml(str) { return String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s])); }
  function formatRelativeTime(ts) { const diff = Date.now() - new Date(ts).getTime(); if (diff < 60000) return '刚刚'; if (diff < 3600000) return `${Math.floor(diff / 60000)}m`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; return `${Math.floor(diff / 86400000)}d`; }
  function makeKey(url, source, extra = '') { return `${normalizeUrl(url)}__${source}__${extra}`; }
  function isNewItem(item) { return Date.now() - new Date(item.detectedAt).getTime() <= CONFIG.newItemDurationMs; }

  // --- Persistence ---
  function persistUI() { gmSet(CONFIG.storageKeyUI, { isMini: state.isMini, dockSide: state.dockSide, lastY: state.lastY, showOnlyNew: state.showOnlyNew, isPaused: state.isPaused }); }
  function loadUI() { const saved = gmGet(CONFIG.storageKeyUI, null); if (!saved) return; state.isMini = saved.isMini !== false; state.dockSide = saved.dockSide || 'right'; state.lastY = saved.lastY || CONFIG.defaultTop; state.showOnlyNew = !!saved.showOnlyNew; state.isPaused = !!saved.isPaused; }
  function persistItems() { const items = Array.from(state.items.values()).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)).slice(0, CONFIG.maxPersistedItems); gmSet(CONFIG.storageKeyItems, items); }
  function loadItems() { const arr = gmGet(CONFIG.storageKeyItems,[]); if (!Array.isArray(arr)) return; state.items.clear(); let maxId = 0; for (const item of arr) { if (!item || !item.url) continue; const key = makeKey(item.url, item.source, item.method); state.items.set(key, item); if (item.id > maxId) maxId = item.id; } state.seq = maxId + 1; }

  // --- Logic ---
  function addPdfItem(item) {
    if (!isTopWindow) return;
    if (state.isPaused) return;

    if (!item || !item.url) return;
    const normalized = normalizeUrl(item.url);
    const key = makeKey(normalized, item.source || 'unknown', item.method || '');

    if (state.items.has(key)) {
      const old = state.items.get(key);
      old.fileName = old.fileName || item.fileName;
      old.detectedAt = new Date().toISOString();
      persistItems();
      if (!state.isMini) renderList();
      return;
    }

    const record = {
      id: state.seq++,
      url: normalized,
      source: item.source || 'N/A',
      fileName: sanitizeFilename(item.fileName || getFileNameFromUrl(normalized)),
      detectedAt: item.detectedAt || new Date().toISOString(),
    };

    state.items.set(key, record);
    persistItems();
    showToast(`捕获: ${record.fileName}`);
    updateDockAppearance();
    if (!state.isMini) renderList();
  }

  function getAllItems() { return Array.from(state.items.values()).sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt) || b.id - a.id); }
  function getVisibleItems() { const all = getAllItems(); return state.showOnlyNew ? all.filter(isNewItem) : all; }
  function findItemById(id) { return getAllItems().find(x => x.id === id); }

  // --- UI Rendering ---
  function showToast(msg, type = 'info') {
      if (!isTopWindow) return;
      const container = document.getElementById('pdf-catcher-toasts');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = `pdf-toast pdf-toast-${type}`;
      toast.innerHTML = `<div class="pdf-toast-text">${escapeHtml(msg)}</div>`;
      container.appendChild(toast);

      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
      }, 2500);
  }

  function renderToolbar() {
      if (!isTopWindow) return;
      const pauseBtn = document.getElementById('pdf-catcher-pause');
      if (pauseBtn) {
          if (state.isPaused) {
              pauseBtn.innerHTML = `${ICONS.play} 已暂停`;
              pauseBtn.className = 'pdf-tool-btn pdf-btn-warning';
          } else {
              pauseBtn.innerHTML = `${ICONS.pause} 监听中`;
              pauseBtn.className = 'pdf-tool-btn';
          }
      }
  }

  function updateDockAppearance() {
    if (!isTopWindow) return;
    const panel = document.getElementById('pdf-catcher-panel');
    if (!panel) return;

    panel.className = '';
    let top = Math.max(0, Math.min(window.innerHeight - CONFIG.miniSize, state.lastY));
    panel.style.top = `${top}px`;

    const newCount = getAllItems().filter(isNewItem).length;
    const badge = document.getElementById('pdf-catcher-badge');
    if (badge) {
        badge.textContent = newCount > 99 ? '99+' : newCount;
        badge.style.display = newCount > 0 ? 'flex' : 'none';
    }

    if (state.isMini) {
      panel.classList.add('mini');
      const offset = state.hovering ? 8 : -(CONFIG.miniSize - CONFIG.peekSize);

      if (state.dockSide === 'left') {
        panel.classList.add('dock-left');
        panel.style.left = `${offset}px`;
        panel.style.right = 'auto';
      } else {
        panel.classList.add('dock-right');
        panel.style.right = `${offset}px`;
        panel.style.left = 'auto';
      }
      if (!state.hovering) panel.classList.add('peek');

    } else {
      panel.classList.add('expanded');
      let left = state.dockSide === 'left' ? 12 : window.innerWidth - CONFIG.panelWidth - 12;
      left = Math.max(0, Math.min(window.innerWidth - CONFIG.panelWidth, left));

      const rectHeight = Math.min(window.innerHeight - 24, CONFIG.panelMaxHeight + 80);
      top = Math.max(12, Math.min(window.innerHeight - rectHeight, top));

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = 'auto';
    }
  }

  function togglePanel() {
    state.isMini = !state.isMini;
    persistUI();
    updateDockAppearance();
    if (!state.isMini) {
        renderList();
        renderToolbar();
    }
  }

  function renderList() {
    if (!isTopWindow) return;
    const list = document.getElementById('pdf-catcher-list');
    const headerCount = document.getElementById('pdf-catcher-count');
    if (!list || state.isMini || state.showGuide) return;

    const all = getAllItems();
    const items = getVisibleItems();
    headerCount.textContent = `${all.length}`;

    if (!items.length) {
      list.innerHTML = `
        <div class="pdf-catcher-empty">
          <div class="pdf-empty-icon">${ICONS.pdf}</div>
          <div class="pdf-empty-text">${state.showOnlyNew ? '无新记录' : '空空如也'}</div>
        </div>`;
      return;
    }

    list.innerHTML = items.map(item => `
      <div class="pdf-item">
        <div class="pdf-item-main">
           <div class="pdf-item-title" title="${escapeHtml(item.fileName)}">${escapeHtml(item.fileName)}</div>
           <div class="pdf-item-meta">
             ${isNewItem(item) ? `<span class="pdf-badge pdf-badge-new">NEW</span>` : ''}
             <span class="pdf-badge">${escapeHtml(item.source.split(':')[0])}</span>
             <span class="pdf-time">${escapeHtml(formatRelativeTime(item.detectedAt))}</span>
           </div>
        </div>
        <div class="pdf-item-actions">
          <button class="pdf-action-btn" data-role="copy" data-id="${item.id}" title="复制">${ICONS.copy}</button>
          <button class="pdf-action-btn pdf-btn-primary" data-role="download" data-id="${item.id}" title="下载">${ICONS.download}</button>
          <button class="pdf-action-btn pdf-btn-danger" data-role="del" data-id="${item.id}" title="删除">${ICONS.trash}</button>
        </div>
      </div>
    `).join('');

    list.onclick = (e) => {
        const btn = e.target.closest('.pdf-action-btn');
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const item = findItemById(id);
        const role = btn.dataset.role;

        if (role === 'copy' && item) {
            GM_setClipboard(item.url, 'text');
            const originalIcon = btn.innerHTML;
            btn.innerHTML = ICONS.check;
            btn.classList.add('pdf-text-success');
            showToast('已复制链接', 'success');
            setTimeout(() => {
                if(btn.closest('body')) {
                    btn.innerHTML = originalIcon;
                    btn.classList.remove('pdf-text-success');
                }
            }, 1500);
        } else if (role === 'download' && item) {
            downloadOne(item);
        } else if (role === 'del') {
            for (const[k, v] of state.items.entries()) {
                if (v.id === id) { state.items.delete(k); break; }
            }
            persistItems();
            renderList();
        }
    };
  }

  async function downloadOne(item) {
    showToast(`下载中...`, 'info');
    try {
        if (typeof GM_download === 'function') {
            GM_download({
                url: item.url,
                name: item.fileName,
                saveAs: true,
                onload: () => showToast(`下载完成`, 'success'),
                onerror: (e) => showToast(`下载失败`, 'error'),
            });
        } else {
            const a = document.createElement('a');
            a.href = item.url;
            a.download = item.fileName;
            a.click();
        }
    } catch (e) {
        showToast(`错误`, 'error');
    }
  }

  // --- Capture Logic (Hooks) ---
  function captureFromUrl(url, source, extra = {}) {
    if (state.isPaused) return;
    const abs = normalizeUrl(url);
    if (!isLikelyPdfUrl(abs)) return;
    const itemData = { url: abs, source, method: extra.method, fileName: extra.fileName, detectedAt: new Date().toISOString() };

    if (isTopWindow) {
        addPdfItem(itemData);
    } else {
        try {
            window.top.postMessage({ source: 'PDF_CATCHER', action: 'ADD_ITEM', payload: itemData }, '*');
        } catch (e) {}
    }
  }

  const originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = async function (...args) {
      if (!state.isPaused) {
          const url = args[0] instanceof Request ? args[0].url : args[0];
          const method = args[1]?.method || 'GET';
          captureFromUrl(url, 'fetch', { method });
      }

      const resp = await originalFetch.apply(this, args);

      if (!state.isPaused) {
          const clone = resp.clone();
          const ct = clone.headers.get('content-type');
          const cd = clone.headers.get('content-disposition');

          if (isPdfContentType(ct) || /\.pdf/i.test(cd) || /\.pdf$/i.test(resp.url)) {
            addPdfItem({ url: resp.url, source: 'fetch:resp', fileName: parseFilenameFromContentDisposition(cd) || getFileNameFromUrl(resp.url) });
          } else if (CONFIG.tryReadFetchBodyForPdf && resp.ok) {
            try {
                const reader = clone.body?.getReader();
                if(reader) {
                    const {value} = await reader.read();
                    if(value && arrayBufferStartsWithPdfMagic(value.buffer)) {
                         captureFromUrl(resp.url, 'fetch:magic', { fileName: getFileNameFromUrl(resp.url) });
                    }
                    reader.cancel();
                }
            } catch(e) {}
          }
      }
      return resp;
    };
  }

  (function hookXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      if (!state.isPaused) captureFromUrl(url, 'xhr', { method });
      return originalOpen.apply(this, arguments);
    };
  })();

  function scanDOM() {
      if (state.isPaused) return;
      document.querySelectorAll('a[href], iframe[src], embed[src]').forEach(el => {
          const url = el.href || el.src;
          if (isLikelyPdfUrl(url)) captureFromUrl(url, 'dom');
      });
  }

  // --- UI Construction ---
  function enableDrag(panel, handle, isMiniHandle = false) {
    let isDragging = false;
    let startX, startY, startLeft, startTop, isClick = false;

    handle.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      isDragging = true;
      isClick = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      panel.style.transition = 'none';
      document.body.style.userSelect = 'none';

      if (state.isMini) panel.classList.remove('peek', 'dock-left', 'dock-right');

      const onMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) isClick = false;

        panel.style.left = `${startLeft + dx}px`;
        panel.style.top = `${startTop + dy}px`;
        panel.style.right = 'auto';
      };

      const onUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.userSelect = '';
        panel.style.transition = '';

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);

        if (isClick && isMiniHandle && state.isMini) {
            togglePanel();
            return;
        }

        const rect = panel.getBoundingClientRect();
        state.lastY = rect.top;
        const distLeft = rect.left;
        const distRight = window.innerWidth - rect.right;

        state.dockSide = distLeft < distRight ? 'left' : 'right';

        persistUI();
        updateDockAppearance();
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function ensureUI() {
    if (!isTopWindow || state.uiReady) return;

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --pdf-bg: #18181b;
        --pdf-surface: #27272a;
        --pdf-surface-hover: #3f3f46;
        --pdf-border: rgba(255, 255, 255, 0.08);
        --pdf-border-light: rgba(255, 255, 255, 0.04);
        --pdf-text-main: #f4f4f5;
        --pdf-text-mut: #a1a1aa;
        --pdf-accent: #3b82f6;
        --pdf-danger: #ef4444;
        --pdf-success: #10b981;
        --pdf-radius-sm: 4px;
        --pdf-radius-md: 6px;
        --pdf-radius-lg: 10px;
        --pdf-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
      }

      #pdf-catcher-panel {
        all: initial;
        position: fixed;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--pdf-text-main);
        transition: top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                    left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                    right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                    opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                    background-color 0.3s,
                    border-radius 0.3s;
        box-sizing: border-box;
      }
      #pdf-catcher-panel * { box-sizing: border-box; line-height: 1.2; }

      #pdf-catcher-panel.mini {
        width: ${CONFIG.miniSize}px;
        height: ${CONFIG.miniSize}px;
        border-radius: 50%;
        background: var(--pdf-surface);
        border: 1px solid var(--pdf-border);
        box-shadow: var(--pdf-shadow);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #pdf-catcher-panel.mini::after {
        content: '';
        position: absolute;
        top: -15px; left: -20px; right: -20px; bottom: -15px;
        z-index: -1;
      }

      #pdf-catcher-panel.mini:hover { background: var(--pdf-surface-hover); }
      #pdf-catcher-panel.mini.peek { opacity: ${CONFIG.dockOpacity}; }
      #pdf-catcher-panel.mini.peek:hover { opacity: 1; }

      .pdf-catcher-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: var(--pdf-danger);
        color: #fff;
        font-size: 9px;
        font-weight: 700;
        height: 16px;
        min-width: 16px;
        padding: 0 4px;
        border-radius: 8px;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--pdf-bg);
      }

      #pdf-catcher-panel.expanded {
        width: ${CONFIG.panelWidth}px;
        background: var(--pdf-bg);
        border: 1px solid var(--pdf-border);
        border-radius: var(--pdf-radius-lg);
        box-shadow: var(--pdf-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .pdf-catcher-mini-content { display: none; position: relative; width: 100%; height: 100%; align-items: center; justify-content: center; }
      #pdf-catcher-panel.mini .pdf-catcher-mini-content { display: flex; }
      .pdf-catcher-full-content { display: none; flex-direction: column; max-height: ${CONFIG.panelMaxHeight}px; }
      #pdf-catcher-panel.expanded .pdf-catcher-full-content { display: flex; }

      /* 头部样式 */
      .pdf-catcher-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: var(--pdf-bg);
        border-bottom: 1px solid var(--pdf-border);
        cursor: grab;
      }
      .pdf-catcher-header:active { cursor: grabbing; }
      .pdf-catcher-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
      .pdf-header-count { background: var(--pdf-surface); padding: 2px 6px; border-radius: 10px; font-size: 10px; color: var(--pdf-text-mut); }

      /* 头部纯图标按钮（? / X） */
      .pdf-btn-icon-header {
        background: none; border: none; padding: 4px; border-radius: var(--pdf-radius-sm);
        color: var(--pdf-text-mut); cursor: pointer; display: flex; align-items: center;
        transition: background-color 0.15s, color 0.15s;
      }
      .pdf-btn-icon-header:hover, .pdf-btn-icon-header.active { background: var(--pdf-surface-hover); color: var(--pdf-text-main); }
      .pdf-btn-icon-header svg { pointer-events: none; width: 16px; height: 16px; }

      .pdf-catcher-toolbar {
        display: flex;
        gap: 4px;
        padding: 6px 12px;
        background: var(--pdf-surface);
        border-bottom: 1px solid var(--pdf-border);
      }
      .pdf-tool-btn {
        background: transparent; border: 1px solid transparent;
        color: var(--pdf-text-mut); font-size: 11px; padding: 4px 8px;
        border-radius: var(--pdf-radius-sm); cursor: pointer;
        display: flex; align-items: center; gap: 4px;
        transition: background-color 0.15s, color 0.15s, border-color 0.15s;
      }
      .pdf-tool-btn:hover { background: var(--pdf-surface-hover); color: var(--pdf-text-main); }
      .pdf-tool-btn.active { background: rgba(59, 130, 246, 0.15); color: var(--pdf-accent); border-color: rgba(59, 130, 246, 0.3); }

      .pdf-btn-warning { color: #f59e0b !important; background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.2); }
      .pdf-btn-warning:hover { background: rgba(245, 158, 11, 0.2); }
      .pdf-tool-btn svg { pointer-events: none; }

      .pdf-catcher-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px 12px;
      }
      .pdf-catcher-body::-webkit-scrollbar { width: 4px; }
      .pdf-catcher-body::-webkit-scrollbar-thumb { background: var(--pdf-surface-hover); border-radius: 2px; }

      .pdf-catcher-empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px 0; color: var(--pdf-text-mut);
      }
      .pdf-empty-icon svg { width: 32px; height: 32px; stroke-width: 1.2; opacity: 0.4; margin-bottom: 12px; }
      .pdf-empty-text { font-size: 12px; }

      .pdf-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px;
        background: transparent;
        border-bottom: 1px solid var(--pdf-border-light);
        gap: 8px;
      }
      .pdf-item:last-child { border-bottom: none; }
      .pdf-item:hover { background: var(--pdf-surface); border-radius: var(--pdf-radius-md); }

      .pdf-item-main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .pdf-item-title {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--pdf-text-main);
      }
      .pdf-item-meta {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .pdf-badge {
        font-size: 9px;
        padding: 2px 4px;
        background: var(--pdf-surface-hover);
        color: var(--pdf-text-mut);
        border-radius: var(--pdf-radius-sm);
        white-space: nowrap;
      }
      .pdf-badge-new { background: rgba(239, 68, 68, 0.15); color: var(--pdf-danger); }
      .pdf-time { font-size: 10px; color: var(--pdf-text-mut); white-space: nowrap; }

      .pdf-item-actions {
        display: flex;
        gap: 2px;
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .pdf-item:hover .pdf-item-actions { opacity: 1; }

      .pdf-action-btn {
        width: 24px; height: 24px;
        padding: 0; margin: 0; border: none; background: transparent;
        display: inline-flex; align-items: center; justify-content: center;
        border-radius: var(--pdf-radius-sm); color: var(--pdf-text-mut);
        cursor: pointer; transition: background-color 0.15s, color 0.15s;
      }
      .pdf-action-btn:hover { background: var(--pdf-surface-hover); color: var(--pdf-text-main); }
      .pdf-btn-primary:hover { background: var(--pdf-accent); color: #fff; }
      .pdf-btn-danger:hover { background: var(--pdf-danger); color: #fff; }
      .pdf-text-success { color: var(--pdf-success) !important; }
      .pdf-action-btn svg { pointer-events: none; }

      /* 使用指南内嵌视图 */
      .pdf-guide-view { display: none; flex-direction: column; gap: 8px; padding: 4px 0; }
      .pdf-guide-view.show { display: flex; }
      .pdf-guide-item { display: flex; gap: 10px; background: var(--pdf-surface); padding: 10px; border-radius: var(--pdf-radius-md); border: 1px solid var(--pdf-border-light); align-items: flex-start; }
      .pdf-guide-icon { flex-shrink: 0; color: var(--pdf-accent); display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; font-size: 12px; margin-top: 1px;}
      .pdf-guide-text { font-size: 11.5px; color: var(--pdf-text-mut); line-height: 1.5; }
      .pdf-guide-text strong { color: var(--pdf-text-main); font-weight: 500; }

      #pdf-catcher-toasts {
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        z-index: 2147483647; display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      }
      .pdf-toast {
        background: var(--pdf-surface); border: 1px solid var(--pdf-border);
        box-shadow: var(--pdf-shadow); border-radius: var(--pdf-radius-md);
        padding: 6px 12px; display: flex; align-items: center;
        opacity: 0; transform: translateY(-10px); transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      .pdf-toast.show { opacity: 1; transform: translateY(0); }
      .pdf-toast-text { font-size: 12px; font-weight: 500; color: var(--pdf-text-main); }
      .pdf-toast-success { border-left: 3px solid var(--pdf-success); }
      .pdf-toast-error { border-left: 3px solid var(--pdf-danger); }
      .pdf-toast-info { border-left: 3px solid var(--pdf-accent); }
    `;
    document.head.appendChild(style);

    const toasts = document.createElement('div');
    toasts.id = 'pdf-catcher-toasts';
    document.body.appendChild(toasts);

    const panel = document.createElement('div');
    panel.id = 'pdf-catcher-panel';
    panel.innerHTML = `
      <div class="pdf-catcher-mini-content" id="pdf-catcher-mini-area">
        ${ICONS.pdf}
        <div class="pdf-catcher-badge" id="pdf-catcher-badge">0</div>
      </div>

      <div class="pdf-catcher-full-content">
        <div class="pdf-catcher-header" id="pdf-catcher-header">
          <div class="pdf-catcher-title">
             ${ICONS.pdf} <span id="pdf-catcher-title-text">PDF 捕获器</span>
             <span class="pdf-header-count" id="pdf-catcher-count">0</span>
          </div>
          <div style="display: flex; gap: 4px; align-items: center;">
             <!-- 新的 ? 按钮，放在标题同行的右上角 -->
             <button class="pdf-btn-icon-header" id="pdf-catcher-help" title="使用指南">${ICONS.help}</button>
             <button class="pdf-btn-icon-header" id="pdf-catcher-close" title="收起">${ICONS.close}</button>
          </div>
        </div>

        <div class="pdf-catcher-toolbar">
            <button class="pdf-tool-btn" id="pdf-catcher-scan" title="重新扫描并恢复">${ICONS.scan} 扫描</button>
            <button class="pdf-tool-btn" id="pdf-catcher-filter" title="仅查看新捕获项目">${ICONS.filter} 新项</button>
            <button class="pdf-tool-btn" id="pdf-catcher-pause" title="暂停/恢复捕获"></button>
            <div style="flex: 1;"></div>
            <button class="pdf-tool-btn" id="pdf-catcher-clear" title="清空并暂停">${ICONS.trash} 清空</button>
        </div>

        <div class="pdf-catcher-body">
            <!-- 常规列表 -->
            <div id="pdf-catcher-list"></div>

            <!-- 使用指南视图 (去掉了冗余内部标题) -->
            <div id="pdf-catcher-guide-view" class="pdf-guide-view">
                <div class="pdf-guide-item">
                    <span class="pdf-guide-icon">${ICONS.scan}</span>
                    <div class="pdf-guide-text"><strong>无感嗅探：</strong>跨域 iframe、Fetch、XHR 底层深度拦截，静默捕获当前网页潜藏的 PDF 文档。</div>
                </div>
                <div class="pdf-guide-item">
                    <span class="pdf-guide-icon">🧲</span>
                    <div class="pdf-guide-text"><strong>防抖贴边：</strong>随意拖拽悬浮球至屏幕两侧，松手即自动贴边隐藏。</div>
                </div>
                <div class="pdf-guide-item">
                    <span class="pdf-guide-icon">${ICONS.check}</span>
                    <div class="pdf-guide-text"><strong>快捷下载：</strong>鼠标轻触列表记录即可呼出悬浮菜单，一键拷贝源链接或直接本地下载。</div>
                </div>
            </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    const miniArea = document.getElementById('pdf-catcher-mini-area');
    const headerArea = document.getElementById('pdf-catcher-header');

    document.getElementById('pdf-catcher-close').addEventListener('click', togglePanel);

    document.getElementById('pdf-catcher-clear').addEventListener('click', () => {
        state.items.clear();
        state.isPaused = true;
        persistItems();
        persistUI();
        renderList();
        renderToolbar();
        updateDockAppearance();
        showToast('已清空并暂停捕获');
    });

    document.getElementById('pdf-catcher-scan').addEventListener('click', () => {
        state.isPaused = false;
        // 如果正在查看指南，主动切回列表
        if(state.showGuide) document.getElementById('pdf-catcher-help').click();
        persistUI();
        renderToolbar();
        scanDOM();
        showToast('已恢复监听并扫描');
    });

    document.getElementById('pdf-catcher-pause').addEventListener('click', () => {
        state.isPaused = !state.isPaused;
        persistUI();
        renderToolbar();
        if(!state.isPaused) {
            scanDOM();
            showToast('已恢复捕获');
        } else {
            showToast('已暂停捕获');
        }
    });

    const filterBtn = document.getElementById('pdf-catcher-filter');
    if(state.showOnlyNew) filterBtn.classList.add('active');
    filterBtn.addEventListener('click', () => {
        state.showOnlyNew = !state.showOnlyNew;
        persistUI();
        filterBtn.classList.toggle('active', state.showOnlyNew);
        renderList();
    });

    // 【新增】纯问号的指南切换逻辑
    const helpBtn = document.getElementById('pdf-catcher-help');
    helpBtn.addEventListener('click', () => {
        state.showGuide = !state.showGuide;
        helpBtn.classList.toggle('active', state.showGuide);
        document.getElementById('pdf-catcher-guide-view').classList.toggle('show', state.showGuide);

        // 隐藏列表和数量角标
        document.getElementById('pdf-catcher-list').style.display = state.showGuide ? 'none' : 'block';
        document.getElementById('pdf-catcher-count').style.display = state.showGuide ? 'none' : 'inline-block';

        // 让“使用指南”无缝取代原标题，直接呈现给用户
        const titleText = document.getElementById('pdf-catcher-title-text');
        if (titleText) {
            titleText.textContent = state.showGuide ? '使用指南' : 'PDF 捕获器';
        }

        if(!state.showGuide) renderList();
    });

    panel.addEventListener('mouseenter', () => { state.hovering = true; if (state.isMini) updateDockAppearance(); });
    panel.addEventListener('mouseleave', () => { state.hovering = false; if (state.isMini) updateDockAppearance(); });

    enableDrag(panel, miniArea, true);
    enableDrag(panel, headerArea, false);

    state.uiReady = true;
    updateDockAppearance();
    renderToolbar();
  }

  function init() {
    if (isTopWindow) {
        loadUI();
        loadItems();
        window.addEventListener('message', e => {
            if (e.data && e.data.source === 'PDF_CATCHER' && e.data.action === 'ADD_ITEM') {
                addPdfItem(e.data.payload);
            }
        });
    }

    const run = () => {
        if (isTopWindow) ensureUI();
        scanDOM();
        setInterval(scanDOM, 3000);
    };

    if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', run);
    else run();
  }

  init();
})();