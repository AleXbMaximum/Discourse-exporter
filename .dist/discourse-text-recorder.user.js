// ==UserScript==
// @name         Discourse Text Recorder
// @name:zh-CN   Discourse 论坛文字记录器
// @namespace    https://github.com/local/discourse-text-recorder
// @version      4.0.0
// @description  Liquid-glass recorder for Discourse forums. Captures posts (text + image URLs) as you scroll, exports to Markdown / JSON / ZIP. Tabbed UI, bilingual (zh / en, auto-detect), light / dark / system theme.
// @description:zh-CN  Discourse 论坛文字记录器（液态玻璃 UI · 标签页布局 · 中英双语自动检测 · 浅色 / 深色 / 跟随系统）。滚动浏览时自动记录楼层正文与图片 URL，一键导出 Markdown / JSON / ZIP。
// @author       you
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./Dev/src/bootstrap/config.ts"
/*!*************************************!*\
  !*** ./Dev/src/bootstrap/config.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BUILD_DATE: () => (/* binding */ BUILD_DATE),
/* harmony export */   DEFAULT_SHARD_CAP_LINES: () => (/* binding */ DEFAULT_SHARD_CAP_LINES),
/* harmony export */   MAX_SHARD_CAP_LINES: () => (/* binding */ MAX_SHARD_CAP_LINES),
/* harmony export */   MIN_SHARD_CAP_LINES: () => (/* binding */ MIN_SHARD_CAP_LINES),
/* harmony export */   NS: () => (/* binding */ NS),
/* harmony export */   PAGE_STYLE_ID: () => (/* binding */ PAGE_STYLE_ID),
/* harmony export */   ROOT_ID: () => (/* binding */ ROOT_ID),
/* harmony export */   SCRIPT_CONFIG: () => (/* binding */ SCRIPT_CONFIG),
/* harmony export */   STORAGE_KEYS: () => (/* binding */ STORAGE_KEYS),
/* harmony export */   STYLE_ID: () => (/* binding */ STYLE_ID),
/* harmony export */   TAB_IDS: () => (/* binding */ TAB_IDS),
/* harmony export */   THEME_CLASS: () => (/* binding */ THEME_CLASS),
/* harmony export */   THEME_TRANSITIONING_CLASS: () => (/* binding */ THEME_TRANSITIONING_CLASS),
/* harmony export */   THEME_TRANSITION_MS: () => (/* binding */ THEME_TRANSITION_MS),
/* harmony export */   VERSION: () => (/* binding */ VERSION),
/* harmony export */   Z: () => (/* binding */ Z)
/* harmony export */ });
// Compile-time script configuration. The single source of truth for things
// that other modules used to import piecemeal from core/constants:
//   - namespace (NS) → prefixes all CSS classes, custom properties, storage keys
//   - version + build date → surfaced in the About tab and the userscript header
//   - z-index reservations → ensure overlays beat virtually anything on the host page
//
// Anything purely structural that doesn't change between builds belongs here.
// Anything that varies per user/session belongs in the Store.
const NS = 'dtr';
const VERSION = '4.0.0';
// __BUILD_DATE__ is injected by webpack.DefinePlugin. Falls back to '' in test
// environments where the define isn't applied.
const BUILD_DATE =  true ? "2026-05-17T22:24:50.275Z" : 0;
const ROOT_ID = `${NS}-root`;
const STYLE_ID = `${NS}-styles`;
const PAGE_STYLE_ID = `${NS}-page-dark`;
const THEME_CLASS = `${NS}-theme-dark`;
const THEME_TRANSITIONING_CLASS = `${NS}-theme-transitioning`;
const THEME_TRANSITION_MS = 320;
// Tab identifiers — used by the dock to switch between Capture / Export /
// Settings. Kept as a const tuple so the type is the literal union.
const TAB_IDS = ['capture', 'export', 'settings'];
// Userscript-overlay z-index family. Toast above modal, modal above dock,
// dock above the host page. The numbers are intentionally near the int32 max
// because Discourse themes occasionally push their own large z-indexes.
const Z = {
  dock: 2147483600,
  modal: 2147483640,
  toast: 2147483650
};
// All keys we write to GM_setValue / localStorage. Centralised so a future
// "reset all preferences" UI can iterate Object.values(STORAGE_KEYS).
const STORAGE_KEYS = {
  theme: `${NS}.theme`,
  locale: `${NS}.locale`,
  activeTab: `${NS}.activeTab`,
  dockPos: `${NS}.dock.position`,
  dockMin: `${NS}.dock.minimized`,
  autoStart: `${NS}.autoStart`,
  autoScroll: `${NS}.autoScroll`,
  captureImages: `${NS}.captureImages`,
  downloadImages: `${NS}.downloadImages`,
  exportFormat: `${NS}.exportFormat`,
  captureStrategy: `${NS}.captureStrategy`,
  autoSaveOnComplete: `${NS}.autoSaveOnComplete`,
  filenamePrefix: `${NS}.filenamePrefix`,
  shardCap: `${NS}.shardCap`
};
// Default cap for the sharded export (one shard ≤ this many rendered lines).
// 1800 leaves ~200 lines of headroom below Claude Code's default Read limit
// of 2000 lines, so an AI tool can pull an entire shard in one call.
const DEFAULT_SHARD_CAP_LINES = 1800;
// Hard bounds for the cap input. Below ~400 you get an absurd number of tiny
// shards; above 2000 you defeat the whole point.
const MIN_SHARD_CAP_LINES = 400;
const MAX_SHARD_CAP_LINES = 2000;
const SCRIPT_CONFIG = {
  NS,
  VERSION,
  BUILD_DATE,
  ROOT_ID,
  STYLE_ID,
  PAGE_STYLE_ID,
  THEME_CLASS,
  THEME_TRANSITIONING_CLASS,
  THEME_TRANSITION_MS,
  TAB_IDS,
  Z,
  STORAGE_KEYS
};

/***/ },

/***/ "./Dev/src/bootstrap/domReady.ts"
/*!***************************************!*\
  !*** ./Dev/src/bootstrap/domReady.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   onDomReady: () => (/* binding */ onDomReady)
/* harmony export */ });
// DOM-ready helper. Calls the provided callback once the document body is
// present. Userscripts can run at document-idle, but in single-page-app
// environments (Discourse, Discord, etc.) the body may exist before the SPA
// has hydrated the route we care about — callers that need to wait for the
// route should poll inside their own initializer.
function onDomReady(callback) {
  if (document.body) {
    callback();
    return;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => callback(), {
      once: true
    });
    return;
  }
  // readyState is 'interactive' or 'complete' but body isn't ready (rare
  // edge case under some userscript managers). Tick once and retry.
  setTimeout(() => onDomReady(callback), 16);
}

/***/ },

/***/ "./Dev/src/bootstrap/initializer.ts"
/*!******************************************!*\
  !*** ./Dev/src/bootstrap/initializer.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createInitializer: () => (/* binding */ createInitializer)
/* harmony export */ });
/* harmony import */ var _extractor_discourse__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../extractor/discourse */ "./Dev/src/extractor/discourse.ts");
/* harmony import */ var _recorder_recorder__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../recorder/recorder */ "./Dev/src/recorder/recorder.ts");
// Composition root. Runs the actual boot sequence — order matters:
//   1. Skip iframes — the script runs at top level only.
//   2. Skip non-Discourse pages unless the user opted in via window.__dtrShow.
//   3. The renderEngine injects styles + mounts the dock. Theme.init applies
//      the persisted mode with skipTransition: true so the first paint
//      doesn't flash light→dark.
//   4. Wire keyboard shortcuts and optional auto-start.
//
// SPA awareness: Discourse navigates client-side without a full reload, so
// the initial document.readyState may fire while the topic isn't yet in DOM.
// `bootPoll` retries up to 10 s.
//
// Mirrors AmexOfferMax's initializer: services + renderEngine in via deps,
// warmup promises (here just topic detection) resolved early so the boot
// path can fail fast.


function createInitializer(deps) {
  const {
    config,
    store,
    theme,
    i18n,
    toast,
    renderEngine,
    warmup,
    logBootstrap
  } = deps;
  let bootRetries = 0;
  const MAX_RETRIES = 20;
  let booted = false;
  function attachKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (!(e.altKey && e.shiftKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'r') {
        e.preventDefault();
        if (store.state.recording) _recorder_recorder__WEBPACK_IMPORTED_MODULE_1__.Recorder.stop();else _recorder_recorder__WEBPACK_IMPORTED_MODULE_1__.Recorder.start();
      } else if (k === 't') {
        e.preventDefault();
        const order = ['light', 'dark', 'system'];
        const i = order.indexOf(store.get('theme'));
        const next = order[(i + 1) % order.length] ?? 'system';
        theme.set(next);
        const labelKey = next === 'light' ? 'theme_light' : next === 'dark' ? 'theme_dark' : 'theme_system';
        const type = 'success';
        toast.show(`${i18n.t('toast_theme_changed')}: ${i18n.t(labelKey)}`, type, 1500);
      }
    });
  }
  async function boot() {
    if (booted) return;
    if (window.top !== window.self) return; // skip iframes
    const span = logBootstrap.span('boot', {
      message: 'mount + wire shortcuts'
    });
    const {
      isDiscourse
    } = await warmup.topicReadyPromise;
    if (!isDiscourse && !window.__dtrShow) {
      span.end({
        skipped: true,
        reason: 'non-discourse page'
      }, 'info');
      return;
    }
    theme.init();
    const mounted = renderEngine.mount();
    if (!mounted) {
      span.end({
        skipped: true,
        reason: 'dock already present'
      }, 'info');
      return;
    }
    attachKeyboardShortcuts();
    booted = true;
    logBootstrap.info('mounted', {
      message: 'renderEngine + theme + shortcuts ready',
      locale: i18n.locale(),
      theme: store.get('theme')
    });
    if (store.get('autoStart') && (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_0__.isDiscoursePage)() && /\/t\//.test(location.pathname)) {
      setTimeout(() => _recorder_recorder__WEBPACK_IMPORTED_MODULE_1__.Recorder.start(), 600);
    }
    span.end({
      booted: true
    }, 'info');
  }
  function bootPoll() {
    if (booted) return;
    if ((0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_0__.isDiscoursePage)()) {
      void boot();
      return;
    }
    if (bootRetries++ < MAX_RETRIES) setTimeout(bootPoll, 500);
  }
  // Reference config so the linter doesn't complain about the unused
  // destructure — config is still useful for downstream consumers that
  // pull SCRIPT_CONFIG off the services bag.
  void config;
  return {
    boot,
    bootPoll
  };
}

/***/ },

/***/ "./Dev/src/bootstrap/renderEngine/renderEngine.ts"
/*!********************************************************!*\
  !*** ./Dev/src/bootstrap/renderEngine/renderEngine.ts ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createRenderEngine: () => (/* binding */ createRenderEngine)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _ui_styles_injectStyles__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../ui/styles/injectStyles */ "./Dev/src/ui/styles/injectStyles.ts");
/* harmony import */ var _ui_components_Dock__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../ui/components/Dock */ "./Dev/src/ui/components/Dock.ts");
// Owns the lifecycle of the user-facing UI surface (the dock and its tabs).
// The initializer asks the render engine to attach to a host element; from
// there the engine creates the dock, wires its Bus subscriptions, and
// re-renders on tab/state changes.
//
// AmexOfferMax has multiple full-screen views and a renderEngine that
// caches DOM per view. This script has a single Dock, so the engine is
// thinner — but the seam exists so future surfaces (e.g. a fullscreen
// browser tab) can plug in without touching initializer.



function createRenderEngine(services) {
  const {
    i18n,
    logRender
  } = services;
  let dock = null;
  const renderEngine = {
    mount() {
      if (document.getElementById(_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID)?.querySelector('.dtr-dock')) {
        logRender.debug('mount.skip', {
          message: 'dock already present'
        });
        return false;
      }
      const span = logRender.span('mount', {
        message: 'styles + dock'
      });
      (0,_ui_styles_injectStyles__WEBPACK_IMPORTED_MODULE_1__.injectStyles)();
      dock = (0,_ui_components_Dock__WEBPACK_IMPORTED_MODULE_2__.createDock)({
        i18n
      });
      dock.mount();
      span.end({}, 'info');
      return true;
    },
    isMounted() {
      return dock !== null;
    },
    refresh() {
      dock?.refresh();
    }
  };
  return {
    renderEngine
  };
}

/***/ },

/***/ "./Dev/src/bootstrap/serviceFactory.ts"
/*!*********************************************!*\
  !*** ./Dev/src/bootstrap/serviceFactory.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createApplicationServices: () => (/* binding */ createApplicationServices)
/* harmony export */ });
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../infra/logging/core/LogService */ "./Dev/src/infra/logging/core/LogService.ts");
/* harmony import */ var _infra_logging_notifications_NotificationPolicy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../infra/logging/notifications/NotificationPolicy */ "./Dev/src/infra/logging/notifications/NotificationPolicy.ts");
/* harmony import */ var _infra_i18n_i18n__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../infra/i18n/i18n */ "./Dev/src/infra/i18n/i18n.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _ui_styles_darkMode__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../ui/styles/darkMode */ "./Dev/src/ui/styles/darkMode.ts");
/* harmony import */ var _ui_components_Toast__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../ui/components/Toast */ "./Dev/src/ui/components/Toast.ts");
// Service composition root. Builds every cross-cutting dependency the rest
// of the script needs and returns them as a single object. The initializer
// passes this bag downstream — no module reaches into createX() directly.
//
// Mirrors AmexOfferMax's serviceFactory pattern: takes SCRIPT_CONFIG as
// argument (so tests can inject a stub config), wires logService with the
// notification policy, exposes one log namespace per subsystem, and
// returns the bag fully wired.








function createApplicationServices(scriptConfig) {
  // Hook the notification policy into LogService first so any subsequent
  // log line with `notification: true` can find a route — even before the
  // toast queue exists, the policy can buffer the call until setHandler
  // wires up the UI.
  _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.setNotificationPolicy(_infra_logging_notifications_NotificationPolicy__WEBPACK_IMPORTED_MODULE_2__.notificationPolicy);
  const logMain = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('main');
  const logBootstrap = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('bootstrap');
  const logRecorder = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('recorder');
  const logExporter = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('exporter');
  const logExtractor = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('extractor');
  const logStorage = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('storage');
  const logRender = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('render');
  const logUI = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('ui');
  const logTheme = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('theme');
  const logI18n = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_1__.logService.namespace('i18n');
  logMain.info('bootstrap', {
    message: 'script start',
    version: scriptConfig.VERSION,
    build: scriptConfig.BUILD_DATE
  });
  // Singletons are the production wiring. The serviceFactory exposes
  // them via the bag too so DI consumers (and tests) can pick either
  // path without code paths diverging.
  const bus = _core_eventBus__WEBPACK_IMPORTED_MODULE_4__.Bus;
  const store = _core_store__WEBPACK_IMPORTED_MODULE_5__.Store;
  const theme = _ui_styles_darkMode__WEBPACK_IMPORTED_MODULE_6__.Theme;
  const i18n = (0,_infra_i18n_i18n__WEBPACK_IMPORTED_MODULE_3__.createI18n)({
    storage: _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_0__.storageOP,
    storageKey: scriptConfig.STORAGE_KEYS.locale
  });
  const toast = (0,_ui_components_Toast__WEBPACK_IMPORTED_MODULE_7__.createToastQueue)();
  // Bridge toast through the notification policy so every notification
  // path — direct toast.show(), log.info(..., {notification:true}) — ends
  // at the same queue.
  _infra_logging_notifications_NotificationPolicy__WEBPACK_IMPORTED_MODULE_2__.notificationPolicy.setHandler((message, type, duration) => {
    toast.show(message, type, duration);
  });
  // Mirror locale changes onto the bus so UI components can react.
  i18n.onChange(locale => {
    bus.emit('locale:changed', {
      locale
    });
  });
  return {
    config: scriptConfig,
    storageOP: _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_0__.storageOP,
    bus,
    store,
    theme,
    i18n,
    toast,
    notificationPolicy: _infra_logging_notifications_NotificationPolicy__WEBPACK_IMPORTED_MODULE_2__.notificationPolicy,
    logMain,
    logBootstrap,
    logRecorder,
    logExporter,
    logExtractor,
    logStorage,
    logRender,
    logUI,
    logTheme,
    logI18n
  };
}

/***/ },

/***/ "./Dev/src/core/eventBus.ts"
/*!**********************************!*\
  !*** ./Dev/src/core/eventBus.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bus: () => (/* binding */ Bus),
/* harmony export */   createEventBus: () => (/* binding */ createEventBus)
/* harmony export */ });
// Tiny pub/sub bus. Strongly typed against EventMap so handlers can't be
// registered with a payload shape that doesn't match the channel.
//
// Factory shape — `createEventBus()` — mirrors the rest of the bootstrap so
// tests can spin up an isolated bus. The module-level `Bus` singleton is the
// production default and is what every domain module hits.
function createEventBus() {
  const channels = new Map();
  return {
    on(event, handler) {
      if (!channels.has(event)) channels.set(event, new Set());
      const set = channels.get(event);
      set.add(handler);
      return () => set.delete(handler);
    },
    emit(event, payload) {
      const set = channels.get(event);
      if (!set) return;
      for (const fn of set) {
        try {
          fn(payload);
        } catch (err) {
          // Logger isn't necessarily wired yet during early boot,
          // so fall back to console.error directly.
          console.error('[dtr] handler error', event, err);
        }
      }
    }
  };
}
const Bus = createEventBus();

/***/ },

/***/ "./Dev/src/core/store.ts"
/*!*******************************!*\
  !*** ./Dev/src/core/store.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Store: () => (/* binding */ Store),
/* harmony export */   createStore: () => (/* binding */ createStore)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _eventBus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./eventBus */ "./Dev/src/core/eventBus.ts");
// Single source of truth. All UI components reactively render off this state
// via Bus.on('state:changed', ...). The store does NOT persist settings —
// that's the caller's responsibility (they save via storageOP and patch the
// store). Keeping these concerns separate means the store can be reset for
// tests without touching disk.
//
// Factory shape — `createStore(deps)` — accepts {storageOP, bus} so tests
// can inject stubs. The module-level `Store` is the production singleton.



function loadInitialState(storage) {
  return {
    recording: false,
    paused: false,
    mode: 'idle',
    startedAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    lastCapturedAt: null,
    imageCount: 0,
    posts: new Map(),
    genericChunks: [],
    seenGenericKeys: new Set(),
    topicMeta: null,
    theme: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.theme, 'system'),
    autoStart: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoStart, false),
    autoScroll: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoScroll, true),
    captureImages: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.captureImages, true),
    downloadImages: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.downloadImages, true),
    exportFormat: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.exportFormat, 'zip'),
    dockMinimized: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.dockMin, false),
    activeTab: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.activeTab, 'capture'),
    captureStrategy: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.captureStrategy, 'api'),
    autoSaveOnComplete: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoSaveOnComplete, false),
    filenamePrefix: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.filenamePrefix, true),
    shardCap: storage.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.shardCap, _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SHARD_CAP_LINES),
    sessionSlug: null
  };
}
function createStore(deps) {
  const {
    storageOP: storage,
    bus
  } = deps;
  const state = loadInitialState(storage);
  return {
    state,
    get(key) {
      return state[key];
    },
    // Shallow patch with change detection. Emits exactly once per call —
    // batch related changes together rather than calling patch in a loop.
    patch(partial) {
      let changed = false;
      for (const k of Object.keys(partial)) {
        const next = partial[k];
        if (next === undefined) continue;
        if (state[k] !== next) {
          state[k] = next;
          changed = true;
        }
      }
      if (changed) bus.emit('state:changed', undefined);
    },
    counts() {
      return {
        posts: state.posts.size,
        chunks: state.genericChunks.length,
        images: state.imageCount
      };
    },
    elapsedMs() {
      if (!state.startedAt) return 0;
      const now = state.paused && state.pausedAt ? state.pausedAt.getTime() : Date.now();
      return now - state.startedAt.getTime() - state.totalPausedMs;
    }
  };
}
const Store = createStore({
  storageOP: _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP,
  bus: _eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus
});

/***/ },

/***/ "./Dev/src/core/taskRegistry.ts"
/*!**************************************!*\
  !*** ./Dev/src/core/taskRegistry.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Tasks: () => (/* binding */ Tasks),
/* harmony export */   createTaskRegistry: () => (/* binding */ createTaskRegistry)
/* harmony export */ });
/* harmony import */ var _eventBus__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _utils_throughput__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../utils/throughput */ "./Dev/src/utils/throughput.ts");
// Live task registry — the heart of the real-time progress system.
//
// Producers (exporter, image downloader, API capture) call:
//   const { id, signal } = Tasks.create({...});
//   Tasks.update(id, { done, total, message, addFailure, ... });
//   Tasks.end(id, { status: 'succeeded' });
//
// The registry coalesces `update` calls via requestAnimationFrame so the
// `task:updated` bus event fires at most once per task per frame, even if
// producers tick 50× per second. `create` and `end` emit synchronously so
// the UI can spawn / retire cards without lag.
//
// Cancellation: every task gets its own AbortController. The signal goes
// out to the producer; the controller stays in the registry so the UI's
// cancel button can call `Tasks.cancel(id)` without knowing who owns the
// async work.
//
// Summary cards persist after end. `succeeded` / `cancelled` auto-evict
// after SUMMARY_TTL_MS so the panel doesn't accumulate noise. `failed`
// sticks until the user dismisses (they likely want to inspect failures
// or retry). A FIFO cap (MAX_RETAINED_ENDED) prevents runaway memory if
// a user spawns dozens of failed tasks.


// Cap retained per-task failure records. Beyond this, the registry drops
// the oldest and bumps `failuresTruncated` so the UI can render "+N more".
const MAX_RETAINED_FAILURES = 50;
// Auto-dismiss successful/cancelled summary cards this long after they end.
const SUMMARY_TTL_MS = 30_000;
// Hard cap on retained ended tasks — oldest evict first regardless of TTL.
const MAX_RETAINED_ENDED = 5;
// Sampling rate floor — don't push a sample more often than this (keeps the
// ring buffer's elapsed window meaningful).
const MIN_SAMPLE_INTERVAL_MS = 100;
let idCounter = 0;
function generateId(kind) {
  idCounter = idCounter + 1 >>> 0;
  return `${kind}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}
function freezeSnapshot(s) {
  // Defensive copy so consumers can stash payloads without seeing later
  // mutations. Inner arrays/objects are also recreated.
  return {
    ...s,
    failures: s.failures.slice(),
    stages: s.stages.map(stage => ({
      ...stage
    })),
    childIds: s.childIds.slice(),
    titleParams: s.titleParams ? {
      ...s.titleParams
    } : undefined
  };
}
function createTaskRegistry(deps) {
  const {
    bus
  } = deps;
  const records = new Map();
  // Insertion order of ENDED tasks, used to apply MAX_RETAINED_ENDED FIFO.
  const endedOrder = [];
  // rAF batching — update() schedules; flush emits one task:updated per id.
  const dirty = new Set();
  let rafHandle = 0;
  function scheduleFlush(id) {
    dirty.add(id);
    if (rafHandle !== 0) return;
    rafHandle = requestAnimationFrame(flush);
  }
  function flush() {
    rafHandle = 0;
    const ids = Array.from(dirty);
    dirty.clear();
    for (const id of ids) {
      const rec = records.get(id);
      if (!rec) continue;
      recomputeMetrics(rec);
      bus.emit('task:updated', freezeSnapshot(rec.snapshot));
    }
  }
  function recomputeMetrics(rec) {
    const result = (0,_utils_throughput__WEBPACK_IMPORTED_MODULE_1__.estimate)(rec.samples, rec.snapshot.total);
    rec.snapshot.throughputPerSec = result.throughputPerSec;
    rec.snapshot.etaMs = result.etaMs;
  }
  function sampleNow(rec) {
    const now = Date.now();
    if (now - rec.lastSampleAt < MIN_SAMPLE_INTERVAL_MS) return;
    rec.lastSampleAt = now;
    rec.samples.push({
      t: now,
      done: rec.snapshot.done
    });
  }
  function evictOldestEnded() {
    while (endedOrder.length > MAX_RETAINED_ENDED) {
      const oldest = endedOrder.shift();
      if (oldest == null) break;
      const rec = records.get(oldest);
      if (!rec) continue;
      if (rec.autoDismissTimer != null) clearTimeout(rec.autoDismissTimer);
      records.delete(oldest);
      bus.emit('task:dismissed', {
        id: oldest
      });
    }
  }
  function applyStagePatch(stages, patch) {
    return stages.map(s => {
      if (s.id !== patch.id) return s;
      return {
        ...s,
        status: patch.status ?? s.status,
        done: patch.done ?? s.done,
        total: patch.total ?? s.total
      };
    });
  }
  function pushFailure(rec, failure) {
    const next = rec.snapshot.failures.slice();
    next.push({
      ...failure,
      at: Date.now()
    });
    let truncated = rec.snapshot.failuresTruncated;
    while (next.length > MAX_RETAINED_FAILURES) {
      next.shift();
      truncated++;
    }
    rec.snapshot.failures = next;
    rec.snapshot.failuresTruncated = truncated;
    rec.snapshot.failedCount++;
  }
  function removeFailure(rec, failureId) {
    const next = rec.snapshot.failures.filter(f => f.id !== failureId);
    if (next.length === rec.snapshot.failures.length) return;
    rec.snapshot.failures = next;
    // failedCount is the lifetime count — don't decrement on retry success;
    // the UI uses failures.length for the "Retry N" button copy.
  }
  return {
    list() {
      const out = [];
      for (const rec of records.values()) {
        out.push(freezeSnapshot(rec.snapshot));
      }
      return out;
    },
    get(id) {
      const rec = records.get(id);
      return rec ? freezeSnapshot(rec.snapshot) : null;
    },
    create(input) {
      const id = generateId(input.kind);
      const controller = new AbortController();
      const snapshot = {
        id,
        kind: input.kind,
        status: 'running',
        titleKey: input.titleKey,
        titleParams: input.titleParams ? {
          ...input.titleParams
        } : undefined,
        unit: input.unit,
        done: 0,
        total: Math.max(0, input.total),
        failedCount: 0,
        failures: [],
        failuresTruncated: 0,
        stages: input.stages ? input.stages.map(s => ({
          ...s
        })) : [],
        activeStageId: null,
        message: null,
        startedAt: Date.now(),
        endedAt: null,
        parentId: input.parentId ?? null,
        childIds: [],
        cancellable: input.cancellable ?? true,
        retryable: input.retryable ?? false,
        throughputPerSec: 0,
        etaMs: null
      };
      const rec = {
        snapshot,
        controller,
        samples: (0,_utils_throughput__WEBPACK_IMPORTED_MODULE_1__.createRingBuffer)(),
        lastSampleAt: 0,
        autoDismissTimer: null
      };
      // Initial sample so the first update has something to slope against.
      rec.samples.push({
        t: snapshot.startedAt,
        done: 0
      });
      rec.lastSampleAt = snapshot.startedAt;
      records.set(id, rec);
      bus.emit('task:registered', freezeSnapshot(snapshot));
      return {
        id,
        signal: controller.signal
      };
    },
    update(id, patch) {
      const rec = records.get(id);
      if (!rec) return;
      // Once a task has ended, ignore late updates from in-flight producers.
      if (rec.snapshot.status !== 'running' && rec.snapshot.status !== 'pending') {
        return;
      }
      const s = rec.snapshot;
      if (patch.done != null) s.done = patch.done;
      if (patch.total != null) s.total = Math.max(0, patch.total);
      if (patch.message !== undefined) s.message = patch.message;
      if (patch.activeStageId !== undefined) s.activeStageId = patch.activeStageId;
      if (patch.stagePatch) s.stages = applyStagePatch(s.stages.slice(), patch.stagePatch);
      if (patch.addFailure) pushFailure(rec, patch.addFailure);
      if (patch.removeFailure) removeFailure(rec, patch.removeFailure);
      if (patch.done != null) sampleNow(rec);
      scheduleFlush(id);
    },
    end(id, input) {
      const rec = records.get(id);
      if (!rec) return;
      if (rec.snapshot.status !== 'running' && rec.snapshot.status !== 'pending') {
        return;
      }
      const s = rec.snapshot;
      s.status = input.status;
      s.endedAt = Date.now();
      if (input.message !== undefined) s.message = input.message;
      // Mark any active stage as done if the task succeeded; otherwise
      // leave stages as-is so the UI shows which stage we were on at
      // failure/cancellation.
      if (input.status === 'succeeded' && s.activeStageId) {
        s.stages = s.stages.map(stage => stage.id === s.activeStageId ? {
          ...stage,
          status: 'done'
        } : stage);
        s.activeStageId = null;
      }
      // Final metrics refresh — picks up the last sample so the summary
      // card shows the achieved throughput, not whatever the last frame had.
      recomputeMetrics(rec);
      // Schedule TTL eviction for transient states; failures stick.
      if (input.status === 'succeeded' || input.status === 'cancelled') {
        rec.autoDismissTimer = setTimeout(() => {
          if (records.get(id) === rec) {
            records.delete(id);
            const i = endedOrder.indexOf(id);
            if (i >= 0) endedOrder.splice(i, 1);
            bus.emit('task:dismissed', {
              id
            });
          }
        }, SUMMARY_TTL_MS);
      }
      endedOrder.push(id);
      evictOldestEnded();
      // Drop any pending rAF emit for this task — we're emitting :ended
      // with the final snapshot synchronously, so an :updated chaser
      // would be redundant (and confuse a UI that already retired the card).
      dirty.delete(id);
      bus.emit('task:ended', freezeSnapshot(s));
    },
    dismiss(id) {
      const rec = records.get(id);
      if (!rec) return;
      if (rec.autoDismissTimer != null) clearTimeout(rec.autoDismissTimer);
      records.delete(id);
      const i = endedOrder.indexOf(id);
      if (i >= 0) endedOrder.splice(i, 1);
      bus.emit('task:dismissed', {
        id
      });
    },
    dismissAllEnded() {
      const ids = endedOrder.slice();
      for (const id of ids) {
        const rec = records.get(id);
        if (!rec) continue;
        if (rec.autoDismissTimer != null) clearTimeout(rec.autoDismissTimer);
        records.delete(id);
        bus.emit('task:dismissed', {
          id
        });
      }
      endedOrder.length = 0;
    },
    cancel(id) {
      const rec = records.get(id);
      if (!rec) return;
      if (!rec.snapshot.cancellable) return;
      if (rec.snapshot.status !== 'running' && rec.snapshot.status !== 'pending') {
        return;
      }
      // Triggering the signal is enough — the producer is responsible
      // for unwinding and calling Tasks.end(id, {status: 'cancelled'}).
      // We do NOT call end() here, because the producer may need to
      // finalise things (close handles, emit lifecycle events) first.
      rec.controller.abort();
    },
    linkChild(parentId, childId) {
      const parent = records.get(parentId);
      if (!parent) return;
      if (parent.snapshot.childIds.includes(childId)) return;
      parent.snapshot.childIds = parent.snapshot.childIds.concat(childId);
      scheduleFlush(parentId);
    }
  };
}
const Tasks = createTaskRegistry({
  bus: _eventBus__WEBPACK_IMPORTED_MODULE_0__.Bus
});

/***/ },

/***/ "./Dev/src/exporter/exporter.ts"
/*!**************************************!*\
  !*** ./Dev/src/exporter/exporter.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildJSON: () => (/* binding */ buildJSON),
/* harmony export */   buildMarkdown: () => (/* binding */ buildMarkdown),
/* harmony export */   buildPageHtml: () => (/* binding */ buildPageHtml),
/* harmony export */   buildSessionSlug: () => (/* binding */ buildSessionSlug),
/* harmony export */   copyMarkdown: () => (/* binding */ copyMarkdown),
/* harmony export */   exportBaseName: () => (/* binding */ exportBaseName),
/* harmony export */   exportBoth: () => (/* binding */ exportBoth),
/* harmony export */   exportJSON: () => (/* binding */ exportJSON),
/* harmony export */   exportMarkdown: () => (/* binding */ exportMarkdown),
/* harmony export */   exportPageHtml: () => (/* binding */ exportPageHtml),
/* harmony export */   exportPreferred: () => (/* binding */ exportPreferred),
/* harmony export */   exportSharded: () => (/* binding */ exportSharded),
/* harmony export */   exportZip: () => (/* binding */ exportZip),
/* harmony export */   formatHMS: () => (/* binding */ formatHMS),
/* harmony export */   planShards: () => (/* binding */ planShards),
/* harmony export */   previewShardPlan: () => (/* binding */ previewShardPlan)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/taskRegistry */ "./Dev/src/core/taskRegistry.ts");
/* harmony import */ var _extractor_discourse__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../extractor/discourse */ "./Dev/src/extractor/discourse.ts");
/* harmony import */ var _imageDownload__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./imageDownload */ "./Dev/src/exporter/imageDownload.ts");
/* harmony import */ var _zip__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./zip */ "./Dev/src/exporter/zip.ts");
// Output builders + downloaders. Two flavours of markdown export:
//   - "flat"     — one big topic.md (human-readable transcript)
//   - "sharded"  — split into posts/p####-####.md shards, plus index.md /
//                  by-user.md / posts.jsonl / README.md (AI-friendly: every
//                  shard fits under Claude Code's per-Read line limit, and
//                  the index files contain ONLY structural metadata —
//                  never truncated content excerpts, so an AI can't mistake
//                  the index for the source).
//
// JSON export preserves the same data as a machine-readable structured
// record for downstream processing. JSONL export (used inside the sharded
// ZIP) is one Post per line — directly addressable with `Read offset=N`.






// 60 chars (down from 120) leaves headroom for: 11-char date prefix, the
// ~25-char Downloads root, the inside-zip `posts/p####-####.md` suffix (~22
// chars), and the user's eventual destination path — without bumping into
// Windows MAX_PATH=260 when the file gets moved around. CJK titles still fit
// comfortably (60 codepoints ≈ a meaningful sentence).
const MAX_TITLE_SLICE = 60;
function safeFilename(name) {
  return (name || 'recording').replace(/[\\/:*?"<>|\r\n\t]+/g, '_').slice(0, MAX_TITLE_SLICE).trim() || 'recording';
}
// YYYY-MM-DD in local time. Used as the session-prefix date component so the
// folder grouping in Downloads matches the user's mental model of "today",
// not UTC (which can disagree near midnight).
function localDate(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// Build a session slug: "{YYYY-MM-DD}_{safeTitle}". Captured once at recording
// start so re-exports during the same session stay consistent even if the
// page's title changes mid-thread.
function buildSessionSlug(title, startedAt) {
  const date = localDate(startedAt ?? new Date());
  return `${date}_${safeFilename(title)}`;
}
// Resolve the base filename for an export. If the user enabled the filename
// prefix and the recorder set a sessionSlug, that slug becomes the base —
// otherwise fall back to the topic title alone (legacy behaviour).
function exportBaseName() {
  const meta = currentMeta();
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('filenamePrefix') && _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.sessionSlug) {
    return _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.sessionSlug;
  }
  return safeFilename(meta.title);
}
function formatHMS(ms) {
  if (!ms || ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m ${sec}s` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}
function currentMeta() {
  return _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.topicMeta ?? (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_3__.getTopicMeta)();
}
function sortedPosts() {
  return Array.from(_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.values()).sort((a, b) => a.postNumber - b.postNumber);
}
// Render ONE post to markdown. Always ends with a single trailing "\n" so
// concatenations stay well-formed.
function renderPostMd(p, opts) {
  const renderImage = u => {
    const local = opts.localImagePaths?.get(u);
    return local ? `![](${local})` : `![](${u})`;
  };
  const lines = [];
  lines.push(`## #${p.postNumber} · @${p.username || '(未知)'}${p.fullName ? ` (${p.fullName})` : ''}`);
  const subParts = [];
  if (p.postedAt) subParts.push(`*${p.postedAt}*`);
  if (p.permalink) subParts.push(`[永久链接](${p.permalink})`);
  if (subParts.length) lines.push(subParts.join(' — '));
  lines.push('');
  lines.push(p.text || '*(空内容)*');
  if (p.images.length > 0) {
    lines.push('');
    if (opts.localImagePaths) {
      lines.push('**附图:**');
      lines.push('');
      for (const u of p.images) lines.push(renderImage(u));
    } else {
      lines.push('**附图链接:**');
      for (const u of p.images) lines.push(`- ${u}`);
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}
// Number of lines a rendered string would occupy when concatenated into a
// file. Matches `cat -n` line counts: empty → 0, trailing "\n" doesn't add
// a phantom line.
function countLines(s) {
  if (s.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  if (s.charCodeAt(s.length - 1) !== 10) n++;
  return n;
}
function renderAllPosts(posts, localImagePaths) {
  return posts.map(p => {
    const md = renderPostMd(p, {
      localImagePaths
    });
    return {
      post: p,
      md,
      lineCount: countLines(md)
    };
  });
}
// ──────────────────────────────────────────────────────────────────────────
// Flat MD + JSON export (legacy behaviour)
// ──────────────────────────────────────────────────────────────────────────
function buildMarkdown(localImagePaths) {
  const meta = currentMeta();
  const lines = [];
  lines.push(`# ${meta.title || document.title}`);
  lines.push('');
  if (meta.url) lines.push(`- 链接: ${meta.url}`);
  if (meta.category) lines.push(`- 分类: ${meta.category}`);
  if (meta.tags.length) lines.push(`- 标签: ${meta.tags.join(', ')}`);
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.startedAt) {
    lines.push(`- 记录开始: ${_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.startedAt.toISOString()}`);
  }
  lines.push(`- 导出时间: ${new Date().toISOString()}`);
  lines.push(`- 时长: ${fmtElapsed(_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.elapsedMs())}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.mode === 'discourse' || _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.size > 0) {
    const ordered = sortedPosts();
    for (const p of ordered) {
      lines.push(renderPostMd(p, {
        localImagePaths
      }));
    }
  } else {
    const renderImage = u => {
      const local = localImagePaths?.get(u);
      return local ? `![](${local})` : `![](${u})`;
    };
    for (const c of _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks) {
      lines.push(`> [${c.tag}] ${c.ts}`);
      lines.push('');
      lines.push(c.text);
      for (const u of c.images) lines.push(renderImage(u));
      lines.push('');
    }
  }
  return lines.join('\n');
}
function buildJSON() {
  const meta = currentMeta();
  const payload = {
    kind: _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.mode,
    recorder: `discourse-text-recorder@${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.VERSION}`,
    startedAt: _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.startedAt?.toISOString() ?? null,
    exportedAt: new Date().toISOString(),
    elapsedMs: _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.elapsedMs(),
    page: {
      title: meta.title || document.title,
      url: meta.url || location.href,
      category: meta.category,
      tags: meta.tags
    }
  };
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.mode === 'discourse' || _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.size > 0) {
    payload.posts = sortedPosts();
  } else {
    payload.chunks = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks.slice();
  }
  return JSON.stringify(payload, null, 2);
}
// ──────────────────────────────────────────────────────────────────────────
// Raw DOM snapshot — the page as it currently is, minus our injected UI.
// Useful as a forensic backup when the structured parser missed something.
// ──────────────────────────────────────────────────────────────────────────
// Returns `<!DOCTYPE html>\n<html …>…</html>`. Clones the live tree first so
// we can strip the recorder's own UI (#dtr-root) and style tags without
// touching what the user sees. The clone is shallow on attributes but deep
// on children — sufficient because we only delete nodes, never reorder.
function buildPageHtml() {
  const clone = document.documentElement.cloneNode(true);
  for (const id of [_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID, _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STYLE_ID, _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.PAGE_STYLE_ID]) {
    clone.querySelector(`#${id}`)?.remove();
  }
  return `<!DOCTYPE html>\n${clone.outerHTML}`;
}
// ──────────────────────────────────────────────────────────────────────────
// Sharded export — index, by-user, posts.jsonl, per-range MD shards.
// ──────────────────────────────────────────────────────────────────────────
// Lines the shard's own "# Posts #X – #Y\n\n" header takes. Used both when
// planning (so the cap accounts for the header) and when materialising
// (so postLocations point at the right line).
const SHARD_HEADER_LINES = 2;
function clampCap(n) {
  if (!Number.isFinite(n) || n <= 0) return _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SHARD_CAP_LINES;
  return Math.max(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MIN_SHARD_CAP_LINES, Math.min(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MAX_SHARD_CAP_LINES, Math.floor(n)));
}
function pad4(n) {
  return String(n).padStart(4, '0');
}
function shardName(firstPost, lastPost) {
  return firstPost === lastPost ? `p${pad4(firstPost)}` : `p${pad4(firstPost)}-${pad4(lastPost)}`;
}
// Greedy bin-pack. Posts are atomic — a single post that exceeds capLines
// gets its own shard (marked oversize). Posts arrive in ascending postNumber
// order so shards are always contiguous ranges.
function planShards(rendered, capLines) {
  const shards = [];
  const postLocations = new Map();
  let cur = null;
  const flush = () => {
    if (!cur || cur.posts.length === 0) return;
    const name = shardName(cur.firstPost, cur.lastPost);
    const path = `posts/${name}.md`;
    const oversize = cur.posts.length === 1 && cur.lines > capLines;
    let lineCursor = SHARD_HEADER_LINES + 1;
    for (const rp of cur.posts) {
      postLocations.set(rp.post.postNumber, {
        shardName: name,
        shardPath: path,
        line: lineCursor
      });
      lineCursor += rp.lineCount;
    }
    shards.push({
      name,
      path,
      firstPost: cur.firstPost,
      lastPost: cur.lastPost,
      postCount: cur.posts.length,
      lineCount: cur.lines,
      userCount: cur.users.size,
      imageCount: cur.images,
      oversize
    });
    cur = null;
  };
  for (const rp of rendered) {
    const u = rp.post.username || '(unknown)';
    const imgs = rp.post.images?.length ?? 0;
    if (!cur) {
      cur = {
        posts: [rp],
        lines: SHARD_HEADER_LINES + rp.lineCount,
        users: new Set([u]),
        images: imgs,
        firstPost: rp.post.postNumber,
        lastPost: rp.post.postNumber
      };
      continue;
    }
    if (cur.lines + rp.lineCount <= capLines) {
      cur.posts.push(rp);
      cur.lines += rp.lineCount;
      cur.users.add(u);
      cur.images += imgs;
      cur.lastPost = rp.post.postNumber;
    } else {
      flush();
      cur = {
        posts: [rp],
        lines: SHARD_HEADER_LINES + rp.lineCount,
        users: new Set([u]),
        images: imgs,
        firstPost: rp.post.postNumber,
        lastPost: rp.post.postNumber
      };
    }
  }
  flush();
  const allUsers = new Set();
  let totalChars = 0;
  let totalImages = 0;
  let totalLines = 0;
  let oversizeShards = 0;
  for (const s of shards) {
    totalLines += s.lineCount;
    if (s.oversize) oversizeShards++;
  }
  for (const rp of rendered) {
    allUsers.add(rp.post.username || '(unknown)');
    totalChars += rp.post.text?.length ?? 0;
    totalImages += rp.post.images?.length ?? 0;
  }
  return {
    capLines,
    shards,
    postLocations,
    totals: {
      posts: rendered.length,
      users: allUsers.size,
      images: totalImages,
      chars: totalChars,
      lines: totalLines,
      shards: shards.length,
      oversizeShards
    }
  };
}
function buildShardMd(shard, rendered) {
  const title = shard.firstPost === shard.lastPost ? `# Post #${shard.firstPost}` : `# Posts #${shard.firstPost} – #${shard.lastPost}`;
  let out = `${title}\n\n`;
  for (const rp of rendered) {
    if (rp.post.postNumber >= shard.firstPost && rp.post.postNumber <= shard.lastPost) {
      out += rp.md;
    }
  }
  return out;
}
function escapeMdCell(s) {
  return s.replace(/\|/g, '\\|');
}
function buildIndexMd(plan, posts, rendered) {
  const t = plan.totals;
  const lines = [];
  lines.push(`# Index — ${t.posts} 楼 · ${t.users} 用户 · ${t.images} 图`);
  lines.push('');
  lines.push('> 楼号→位置 元数据索引（按楼号升序）。**不含内容片段** —— 取内容请按"位置"列 `Read <shard> offset=<line>`。');
  lines.push('');
  lines.push('| 楼 | 用户 | 位置 | 字符 | 行 | 图 | 赞 |');
  lines.push('|---|---|---|---|---|---|---|');
  const byNum = new Map();
  for (const rp of rendered) byNum.set(rp.post.postNumber, rp);
  for (const p of posts) {
    const loc = plan.postLocations.get(p.postNumber);
    if (!loc) continue;
    const rp = byNum.get(p.postNumber);
    const lc = rp ? rp.lineCount : 0;
    const chars = p.text?.length ?? 0;
    const imgs = p.images?.length ?? 0;
    const likes = p.likes ?? 0;
    const user = p.username || '(unknown)';
    lines.push(`| #${p.postNumber} | @${escapeMdCell(user)} | ${loc.shardPath}:${loc.line} | ${chars} | ${lc} | ${imgs} | ${likes} |`);
  }
  lines.push('');
  return lines.join('\n');
}
function buildByUserMd(plan, posts) {
  const byUser = new Map();
  for (const p of posts) {
    const u = p.username || '(unknown)';
    let bucket = byUser.get(u);
    if (!bucket) {
      bucket = [];
      byUser.set(u, bucket);
    }
    bucket.push(p);
  }
  const sortedUsers = Array.from(byUser.entries()).sort((a, b) => b[1].length - a[1].length);
  const lines = [];
  lines.push(`# By User — ${sortedUsers.length} 用户`);
  lines.push('');
  lines.push('> 用户→楼号:行号 倒排（按楼数倒序）。**不含内容片段** —— 取内容请用对应分片 + 行号 `Read`。');
  lines.push('');
  for (const [user, userPosts] of sortedUsers) {
    lines.push(`## @${user} (${userPosts.length} 楼)`);
    const byShard = new Map();
    for (const p of userPosts) {
      const loc = plan.postLocations.get(p.postNumber);
      if (!loc) continue;
      let arr = byShard.get(loc.shardPath);
      if (!arr) {
        arr = [];
        byShard.set(loc.shardPath, arr);
      }
      arr.push({
        n: p.postNumber,
        line: loc.line
      });
    }
    for (const [shardPath, entries] of byShard) {
      const refs = entries.map(e => `#${e.n}:${e.line}`).join(', ');
      lines.push(`- ${shardPath}: ${refs}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
function buildJsonl(posts) {
  if (posts.length === 0) return '';
  return posts.map(p => JSON.stringify(p)).join('\n') + '\n';
}
function formatThousand(n) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}
function buildReadmeMd(meta, plan, downloaded, urls, startedAt, elapsedMs) {
  const t = plan.totals;
  const lines = [];
  lines.push(`# ${meta.title || '(untitled)'}`);
  lines.push('');
  if (meta.url) lines.push(`- 链接: ${meta.url}`);
  if (meta.category) lines.push(`- 分类: ${meta.category}`);
  if (meta.tags?.length) lines.push(`- 标签: ${meta.tags.join(', ')}`);
  if (startedAt) lines.push(`- 记录开始: ${startedAt.toISOString()}`);
  lines.push(`- 导出时间: ${new Date().toISOString()}`);
  lines.push(`- 时长: ${fmtElapsed(elapsedMs)}`);
  lines.push(`- 导出工具: discourse-text-recorder v${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.VERSION}`);
  lines.push('');
  lines.push('## 统计');
  lines.push('');
  lines.push(`- 楼数: ${t.posts}`);
  lines.push(`- 用户: ${t.users}`);
  if (urls.length > 0) {
    const failed = urls.length - downloaded.length;
    lines.push(`- 图片: ${t.images}（下载成功 ${downloaded.length} / 失败 ${failed}）`);
  } else {
    lines.push(`- 图片: ${t.images}（仅链接，未下载）`);
  }
  lines.push(`- 字符: ~${formatThousand(t.chars)}`);
  lines.push(`- 行数: ~${formatThousand(t.lines)}`);
  lines.push('');
  lines.push(`## 分片（上限 ${plan.capLines} 行/片）`);
  lines.push('');
  lines.push('| shard | posts | lines | users | imgs | flag |');
  lines.push('|---|---|---|---|---|---|');
  for (const s of plan.shards) {
    const flag = s.oversize ? '⚠ oversize' : '';
    lines.push(`| ${s.path} | ${s.postCount} | ${s.lineCount} | ${s.userCount} | ${s.imageCount} | ${flag} |`);
  }
  lines.push('');
  if (t.oversizeShards > 0) {
    lines.push(`⚠ ${t.oversizeShards} 片为单楼超长（>${plan.capLines} 行）独占，AI Read 时需要分页。`);
    lines.push('');
  }
  // Gap detection — Discourse threads can have deleted posts that leave
  // holes in the postNumber range, so line N of posts.jsonl is NOT always
  // post #N. Telling the AI this explicitly prevents off-by-one mistakes.
  const firstPost = plan.shards[0]?.firstPost ?? 0;
  const lastPost = plan.shards[plan.shards.length - 1]?.lastPost ?? 0;
  const numberRange = lastPost - firstPost + 1;
  const gapCount = Math.max(0, numberRange - t.posts);
  const hasGaps = gapCount > 0;
  lines.push('## 文件清单');
  lines.push('');
  lines.push('- [index.md](index.md) — 楼号 → `<shard>:<line>` 主索引，按楼号升序');
  lines.push('- [by-user.md](by-user.md) — 用户 → 楼号:行号 倒排，按楼数倒序');
  lines.push('- [posts.jsonl](posts.jsonl) — 一楼一行 JSON（按楼号升序），适合 `Grep` 字段筛选');
  lines.push(`- posts/ — ${plan.shards.length} 个分片 Markdown，每片 ≤ ${plan.capLines} 行`);
  lines.push('- page.html — 页面 DOM 快照（已剔除记录器自身 UI），可离线打开作为原始页面备份');
  if (downloaded.length > 0) {
    lines.push(`- images/ — ${downloaded.length} 张已下载图片`);
  }
  lines.push('');
  lines.push('## 给 AI 的导航建议');
  lines.push('');
  lines.push('**寻址路径（按需选用）：**');
  lines.push('');
  lines.push('1. **按楼号精确定位** → 查 [index.md](index.md) 的"位置"列拿到 `<shard>:<line>` → `Read <shard> offset=<line> limit=<行数>`（行数列直接给）');
  lines.push('2. **找某用户全部发言** → 直接读 [by-user.md](by-user.md)；或 `Grep \'"username":"X"\' posts.jsonl`（结构化命中，含全部字段）');
  lines.push('3. **按楼号查 JSON** → `Grep \'"postNumber":N\' posts.jsonl`（一行一楼，N 是楼号）');
  lines.push('4. **全文/关键词搜索** → `Grep <keyword> posts/`（限定到分片目录避开 index/jsonl 噪音）');
  lines.push('');
  lines.push('**重要约束：**');
  lines.push('');
  if (hasGaps) {
    lines.push(`- ⚠ 楼号不连续：本帖 ${t.posts} 楼，楼号范围 #${firstPost}–#${lastPost}（${gapCount} 个空洞，论坛删帖造成）`);
  } else {
    lines.push(`- 楼号连续：本帖 ${t.posts} 楼，楼号范围 #${firstPost}–#${lastPost}（无空洞）`);
  }
  lines.push('- **不要假设 `posts.jsonl 第 N 行 = 楼号 N`** —— 楼号查询永远走 index.md 或 grep `"postNumber":N`');
  lines.push('- **不要把 index.md / by-user.md 当成内容来源** —— 里面没有内容片段，只有定位元数据；要内容必须打开对应分片或 jsonl 行');
  lines.push('');
  return lines.join('\n');
}
// Live preview of the shard plan, used by the dock to show "📦 N shards"
// during recording. Cached by (lastCapturedAt, capLines) so rapid UI
// refreshes don't re-render 2000+ posts each tick.
let _previewCache = null;
function previewShardPlan() {
  const postsSize = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.size;
  if (postsSize === 0) return null;
  const capLines = clampCap(_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('shardCap'));
  const lastCapturedAt = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.lastCapturedAt?.getTime() ?? null;
  if (_previewCache && _previewCache.lastCapturedAt === lastCapturedAt && _previewCache.capLines === capLines && _previewCache.postsSize === postsSize) {
    return _previewCache.plan;
  }
  const posts = sortedPosts();
  const rendered = renderAllPosts(posts);
  const plan = planShards(rendered, capLines);
  _previewCache = {
    lastCapturedAt,
    capLines,
    postsSize,
    plan
  };
  return plan;
}
// ──────────────────────────────────────────────────────────────────────────
// Download plumbing
// ──────────────────────────────────────────────────────────────────────────
function download(content, filename, mime) {
  const blob = new Blob([content], {
    type: `${mime};charset=utf-8`
  });
  downloadBlob(blob, filename);
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
function collectAllImageUrls() {
  const urls = new Set();
  for (const p of _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.values()) {
    for (const u of p.images) if (u) urls.add(u);
  }
  for (const c of _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks) {
    for (const u of c.images) if (u) urls.add(u);
  }
  return Array.from(urls);
}
function exportMarkdown() {
  download(buildMarkdown(), `${exportBaseName()}.md`, 'text/markdown');
}
function exportJSON() {
  download(buildJSON(), `${exportBaseName()}.json`, 'application/json');
}
function exportPageHtml() {
  download(buildPageHtml(), `${exportBaseName()}.html`, 'text/html');
}
function exportBoth() {
  exportMarkdown();
  setTimeout(exportJSON, 250);
}
function copyMarkdown() {
  const md = buildMarkdown();
  if (typeof GM_setClipboard === 'function') {
    GM_setClipboard(md, {
      type: 'text',
      mimetype: 'text/plain'
    });
  } else if (navigator.clipboard) {
    void navigator.clipboard.writeText(md);
  }
}
function exportPreferred() {
  const fmt = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('exportFormat');
  if (fmt === 'md') {
    exportMarkdown();
    return Promise.resolve();
  }
  if (fmt === 'json') {
    exportJSON();
    return Promise.resolve();
  }
  if (fmt === 'zip') return exportZip();
  if (fmt === 'sharded') return exportSharded();
  exportBoth();
  return Promise.resolve();
}
// Bundle MD + JSON + downloaded images into a single ZIP. The markdown inside
// the zip uses local image paths (images/0001-foo.jpg) so the archive is
// self-contained when extracted.
async function exportZip() {
  const meta = currentMeta();
  const baseName = exportBaseName();
  const entries = [];
  let downloaded = [];
  const urls = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('downloadImages') ? collectAllImageUrls() : [];
  const stages = [{
    id: 'download',
    labelKey: 'task_stage_download',
    status: 'pending'
  }, {
    id: 'pack',
    labelKey: 'task_stage_pack',
    status: 'pending'
  }];
  const {
    id: taskId,
    signal
  } = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.create({
    kind: 'export.zip',
    titleKey: 'task_title_export_zip',
    unit: 'images',
    total: urls.length,
    stages,
    cancellable: true,
    retryable: true
  });
  try {
    if (urls.length > 0) {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        activeStageId: 'download',
        stagePatch: {
          id: 'download',
          status: 'active',
          total: urls.length
        }
      });
      downloaded = await (0,_imageDownload__WEBPACK_IMPORTED_MODULE_4__.downloadAll)(urls, {
        signal,
        onProgress: p => {
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
            done: p.done,
            total: p.total,
            stagePatch: {
              id: 'download',
              done: p.done,
              total: p.total
            }
          });
        },
        onItemDone: item => {
          if (!item.ok) {
            _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
              addFailure: {
                id: item.url,
                label: item.url,
                error: item.error ?? 'unknown'
              }
            });
          }
        }
      });
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        stagePatch: {
          id: 'download',
          status: 'done'
        }
      });
    } else {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        stagePatch: {
          id: 'download',
          status: 'skipped'
        }
      });
    }
    if (signal.aborted) {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
        status: 'cancelled'
      });
      return;
    }
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      activeStageId: 'pack',
      stagePatch: {
        id: 'pack',
        status: 'active'
      }
    });
    const localPaths = new Map();
    for (const img of downloaded) {
      localPaths.set(img.url, img.filename);
      entries.push({
        path: `${baseName}/${img.filename}`,
        data: img.bytes
      });
    }
    const md = buildMarkdown(downloaded.length > 0 ? localPaths : undefined);
    const json = buildJSON();
    entries.push({
      path: `${baseName}/${baseName}.md`,
      data: utf8Encode(md)
    });
    entries.push({
      path: `${baseName}/${baseName}.json`,
      data: utf8Encode(json)
    });
    entries.push({
      path: `${baseName}/page.html`,
      data: utf8Encode(buildPageHtml())
    });
    // README so the zip recipient sees context (download stats, source URL)
    // without opening the markdown or JSON.
    const readme = `# ${meta.title || '(untitled)'}\n\n` + `Source: ${meta.url || location.href}\n\n` + `Exported by Discourse Text Recorder v${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.VERSION} at ${new Date().toISOString()}.\n\n` + `- ${_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.size} 个楼层 / ${_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks.length} 个文本段\n` + `- 图片总数 ${urls.length}, 成功下载 ${downloaded.length}, 失败 ${urls.length - downloaded.length}\n` + `- page.html: 页面 DOM 快照（已剔除记录器自身 UI）\n`;
    entries.push({
      path: `${baseName}/README.txt`,
      data: utf8Encode(readme)
    });
    const blob = (0,_zip__WEBPACK_IMPORTED_MODULE_5__.buildZip)(entries);
    downloadBlob(blob, `${baseName}.zip`);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      stagePatch: {
        id: 'pack',
        status: 'done'
      }
    });
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'succeeded'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'failed',
      message: msg
    });
    throw err;
  }
}
// Sharded ZIP — README.md / index.md / by-user.md / posts.jsonl /
// posts/p####-####.md / images/. Designed so an AI agent with a per-Read
// line cap can navigate a thousand-post thread without loading everything.
async function exportSharded() {
  const meta = currentMeta();
  const baseName = exportBaseName();
  const capLines = clampCap(_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('shardCap'));
  const entries = [];
  let downloaded = [];
  const urls = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('downloadImages') ? collectAllImageUrls() : [];
  const stages = [{
    id: 'download',
    labelKey: 'task_stage_download',
    status: 'pending'
  }, {
    id: 'render',
    labelKey: 'task_stage_render',
    status: 'pending'
  }, {
    id: 'pack',
    labelKey: 'task_stage_pack',
    status: 'pending'
  }];
  const {
    id: taskId,
    signal
  } = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.create({
    kind: 'export.sharded',
    titleKey: 'task_title_export_sharded',
    unit: 'images',
    total: urls.length,
    stages,
    cancellable: true,
    retryable: true
  });
  try {
    if (urls.length > 0) {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        activeStageId: 'download',
        stagePatch: {
          id: 'download',
          status: 'active',
          total: urls.length
        }
      });
      downloaded = await (0,_imageDownload__WEBPACK_IMPORTED_MODULE_4__.downloadAll)(urls, {
        signal,
        onProgress: p => {
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
            done: p.done,
            total: p.total,
            stagePatch: {
              id: 'download',
              done: p.done,
              total: p.total
            }
          });
        },
        onItemDone: item => {
          if (!item.ok) {
            _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
              addFailure: {
                id: item.url,
                label: item.url,
                error: item.error ?? 'unknown'
              }
            });
          }
        }
      });
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        stagePatch: {
          id: 'download',
          status: 'done'
        }
      });
    } else {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
        stagePatch: {
          id: 'download',
          status: 'skipped'
        }
      });
    }
    if (signal.aborted) {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
        status: 'cancelled'
      });
      return;
    }
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      activeStageId: 'render',
      stagePatch: {
        id: 'render',
        status: 'active'
      }
    });
    const localPaths = new Map();
    for (const img of downloaded) {
      localPaths.set(img.url, img.filename);
      entries.push({
        path: `${baseName}/${img.filename}`,
        data: img.bytes
      });
    }
    const posts = sortedPosts();
    const rendered = renderAllPosts(posts, downloaded.length > 0 ? localPaths : undefined);
    const plan = planShards(rendered, capLines);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      stagePatch: {
        id: 'render',
        status: 'done'
      }
    });
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      activeStageId: 'pack',
      stagePatch: {
        id: 'pack',
        status: 'active'
      }
    });
    for (const shard of plan.shards) {
      entries.push({
        path: `${baseName}/${shard.path}`,
        data: utf8Encode(buildShardMd(shard, rendered))
      });
    }
    entries.push({
      path: `${baseName}/index.md`,
      data: utf8Encode(buildIndexMd(plan, posts, rendered))
    });
    entries.push({
      path: `${baseName}/by-user.md`,
      data: utf8Encode(buildByUserMd(plan, posts))
    });
    entries.push({
      path: `${baseName}/posts.jsonl`,
      data: utf8Encode(buildJsonl(posts))
    });
    entries.push({
      path: `${baseName}/page.html`,
      data: utf8Encode(buildPageHtml())
    });
    entries.push({
      path: `${baseName}/README.md`,
      data: utf8Encode(buildReadmeMd(meta, plan, downloaded, urls, _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.startedAt, _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.elapsedMs()))
    });
    const blob = (0,_zip__WEBPACK_IMPORTED_MODULE_5__.buildZip)(entries);
    downloadBlob(blob, `${baseName}.zip`);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      stagePatch: {
        id: 'pack',
        status: 'done'
      }
    });
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'succeeded'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'failed',
      message: msg
    });
    throw err;
  }
}
const _enc = new TextEncoder();
function utf8Encode(s) {
  return _enc.encode(s);
}

/***/ },

/***/ "./Dev/src/exporter/imageDownload.ts"
/*!*******************************************!*\
  !*** ./Dev/src/exporter/imageDownload.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   downloadAll: () => (/* binding */ downloadAll)
/* harmony export */ });
// Cross-origin image fetcher. Discourse CDNs (e.g. uscardforum's S3) generally
// don't send Access-Control-Allow-Origin, so plain fetch() fails. We prefer
// GM_xmlhttpRequest (which Tampermonkey exempts from CORS) and fall back to
// fetch only if the userscript manager doesn't expose it.
//
// Concurrency is capped to a small number of in-flight requests so we don't
// hammer the CDN — long threads can easily have hundreds of images.
//
// Cancellation: pass `signal` in DownloadAllOptions. Already-in-flight
// requests are aborted via GMXHRHandle.abort() / fetch's AbortSignal; the
// worker loop bails before pulling the next URL when the signal fires.
const MAX_CONCURRENT = 4;
const TIMEOUT_MS = 30_000;
// Heuristic extension picker — prefer the URL path's extension, fall back to
// the Content-Type, then default to .bin so the file is still usable.
function pickExtension(url, mime) {
  try {
    const pathname = new URL(url).pathname;
    const m = pathname.match(/\.([a-z0-9]{2,5})(?:$|\?)/i);
    if (m && m[1]) {
      const ext = m[1].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif'].includes(ext)) {
        return ext === 'jpeg' ? 'jpg' : ext;
      }
    }
  } catch {
    /* fall through */
  }
  const lower = (mime || '').toLowerCase();
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'jpg';
  if (lower.includes('png')) return 'png';
  if (lower.includes('gif')) return 'gif';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('svg')) return 'svg';
  if (lower.includes('avif')) return 'avif';
  return 'bin';
}
function sanitizeBasename(url) {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').filter(Boolean).pop() ?? '';
    return last.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 40) || 'image';
  } catch {
    return 'image';
  }
}
function parseMimeFromHeaders(headers) {
  const m = headers.match(/^content-type:\s*([^\r\n;]+)/im);
  return m && m[1] ? m[1].trim() : '';
}
function fetchViaGM(url, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'));
      return;
    }
    let handle = null;
    let settled = false;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      handle?.abort();
      reject(new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, {
      once: true
    });
    const cleanup = () => {
      settled = true;
      signal?.removeEventListener('abort', onAbort);
    };
    try {
      handle = GM_xmlhttpRequest({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: TIMEOUT_MS,
        onload: r => {
          if (settled) return;
          cleanup();
          if (r.status >= 200 && r.status < 300 && r.response) {
            const buf = r.response;
            resolve({
              bytes: new Uint8Array(buf),
              mime: parseMimeFromHeaders(r.responseHeaders || '')
            });
          } else {
            reject(new Error(`HTTP ${r.status} ${r.statusText}`));
          }
        },
        onerror: () => {
          if (settled) return;
          cleanup();
          reject(new Error('network error'));
        },
        ontimeout: () => {
          if (settled) return;
          cleanup();
          reject(new Error('timeout'));
        },
        onabort: () => {
          if (settled) return;
          cleanup();
          reject(new Error('aborted'));
        }
      });
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}
async function fetchViaFetch(url, signal) {
  const res = await fetch(url, {
    mode: 'cors',
    credentials: 'omit',
    signal
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return {
    bytes: new Uint8Array(buf),
    mime: res.headers.get('content-type') ?? ''
  };
}
async function downloadOne(url, index, signal) {
  let result;
  try {
    result = typeof GM_xmlhttpRequest === 'function' ? await fetchViaGM(url, signal) : await fetchViaFetch(url, signal);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
  const ext = pickExtension(url, result.mime);
  const base = sanitizeBasename(url);
  const seq = String(index + 1).padStart(4, '0');
  return {
    ok: true,
    image: {
      url,
      filename: `images/${seq}-${base}.${ext}`,
      bytes: result.bytes,
      mimeType: result.mime || `image/${ext}`
    }
  };
}
function normalizeOptions(optsOrFn) {
  if (!optsOrFn) return {};
  if (typeof optsOrFn === 'function') return {
    onProgress: optsOrFn
  };
  return optsOrFn;
}
async function downloadAll(urls, optsOrFn) {
  const opts = normalizeOptions(optsOrFn);
  const {
    onProgress,
    onItemDone,
    signal
  } = opts;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  const total = unique.length;
  if (total === 0) return [];
  const results = [];
  let cursor = 0;
  let done = 0;
  let failed = 0;
  async function worker() {
    while (cursor < total) {
      if (signal?.aborted) return;
      const idx = cursor++;
      const url = unique[idx];
      onProgress?.({
        done,
        total,
        failed,
        currentUrl: url
      });
      const item = await downloadOne(url, idx, signal);
      if (item.ok) {
        results.push(item.image);
        onItemDone?.({
          url,
          ok: true
        });
      } else {
        failed++;
        onItemDone?.({
          url,
          ok: false,
          error: item.error
        });
      }
      done++;
      onProgress?.({
        done,
        total,
        failed
      });
    }
  }
  const workers = [];
  const n = Math.min(MAX_CONCURRENT, total);
  for (let i = 0; i < n; i++) workers.push(worker());
  await Promise.all(workers);
  // Preserve original ordering — workers complete out of order, but the
  // zip layout looks neater if images line up with their URL index.
  results.sort((a, b) => a.filename.localeCompare(b.filename));
  return results;
}

/***/ },

/***/ "./Dev/src/exporter/imageRetry.ts"
/*!****************************************!*\
  !*** ./Dev/src/exporter/imageRetry.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   retryImageFailures: () => (/* binding */ retryImageFailures)
/* harmony export */ });
/* harmony import */ var _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/taskRegistry */ "./Dev/src/core/taskRegistry.ts");
/* harmony import */ var _imageDownload__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./imageDownload */ "./Dev/src/exporter/imageDownload.ts");
// One-click retry for image download failures recorded on an export task.
// Creates a sub-task linked to the original; re-downloads only the failed
// URLs. Successes are removed from BOTH the sub-task's and the parent's
// failure lists so the parent's "Retry N" button copy decrements live.
//
// Intentional limitation (v4.0): retry does NOT repack the ZIP. The freshly
// downloaded bytes are not folded back into the original archive — the user
// must re-trigger the export (with the now-cached images succeeding) if
// they want a complete ZIP. The retry path is for "I want to know if the
// failures were transient" rather than "I want a fixed ZIP without rebuilding".


async function retryImageFailures(originalId) {
  const original = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.get(originalId);
  if (!original || original.failures.length === 0) return;
  const failedUrls = original.failures.map(f => f.id);
  const {
    id,
    signal
  } = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.create({
    kind: 'image.retry',
    titleKey: 'task_title_image_retry',
    titleParams: {
      n: failedUrls.length
    },
    unit: 'images',
    total: failedUrls.length,
    parentId: originalId,
    cancellable: true,
    retryable: true
  });
  _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.linkChild(originalId, id);
  try {
    const ok = await (0,_imageDownload__WEBPACK_IMPORTED_MODULE_1__.downloadAll)(failedUrls, {
      signal,
      onProgress: p => {
        _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.update(id, {
          done: p.done,
          total: p.total
        });
      },
      onItemDone: item => {
        if (item.ok) {
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.update(id, {
            removeFailure: item.url
          });
          // Decrement the parent's outstanding failure list so its
          // "Retry N" copy updates and the button vanishes once
          // failures.length hits 0.
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.update(originalId, {
            removeFailure: item.url
          });
        } else {
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.update(id, {
            addFailure: {
              id: item.url,
              label: item.url,
              error: item.error ?? 'unknown'
            }
          });
        }
      }
    });
    if (signal.aborted) {
      _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.end(id, {
        status: 'cancelled'
      });
      return;
    }
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.end(id, {
      status: ok.length === failedUrls.length ? 'succeeded' : 'failed'
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_0__.Tasks.end(id, {
      status: 'failed',
      message: msg
    });
    throw err;
  }
}

/***/ },

/***/ "./Dev/src/exporter/zip.ts"
/*!*********************************!*\
  !*** ./Dev/src/exporter/zip.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildZip: () => (/* binding */ buildZip)
/* harmony export */ });
// Minimal STORE-mode ZIP writer. Images are already compressed (JPEG/PNG/WebP),
// so DEFLATE would barely shrink them while pulling in a much larger codec
// dependency. We just frame each file with a Local File Header + Central
// Directory Header + EOCD record — enough for any modern unzip tool.
//
// Limitations: no encryption, no compression, no ZIP64 (so per-file and
// archive sizes are capped at ~4 GiB). Plenty for a forum-thread export.
const utf8 = new TextEncoder();
// CRC-32 (IEEE 802.3, poly 0xEDB88320). Lazy-built table so repeated calls
// don't recompute.
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ c >>> 1 : c >>> 1;
    t[i] = c >>> 0;
  }
  crcTable = t;
  return t;
}
function crc32(bytes) {
  const t = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = (t[(c ^ bytes[i]) & 0xff] ^ c >>> 8) >>> 0;
  }
  return (c ^ 0xffffffff) >>> 0;
}
// DOS date/time encoding for ZIP timestamps. Seconds are halved (2-second
// resolution); 1980 is the epoch year.
function dosDateTime(d) {
  const time = (d.getHours() & 0x1f) << 11 | (d.getMinutes() & 0x3f) << 5 | Math.floor(d.getSeconds() / 2) & 0x1f;
  const date = (d.getFullYear() - 1980 & 0x7f) << 9 | (d.getMonth() + 1 & 0x0f) << 5 | d.getDate() & 0x1f;
  return {
    time,
    date
  };
}
function buildZip(entries) {
  const prepared = [];
  let cursor = 0;
  // First pass: build local file headers + data, track offsets for the
  // central directory written at the end.
  const localChunks = [];
  for (const e of entries) {
    const nameBytes = utf8.encode(e.path.replace(/\\/g, '/'));
    const data = e.data;
    const crc = crc32(data);
    const {
      time,
      date
    } = dosDateTime(e.date ?? new Date());
    const header = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(header.buffer);
    dv.setUint32(0, 0x04034b50, true); // local file header signature
    dv.setUint16(4, 20, true); // version needed (2.0)
    dv.setUint16(6, 0x0800, true); // general purpose bit flag — UTF-8 filename
    dv.setUint16(8, 0, true); // method = STORE
    dv.setUint16(10, time, true);
    dv.setUint16(12, date, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, data.length, true); // compressed size
    dv.setUint32(22, data.length, true); // uncompressed size
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true); // extra field length
    header.set(nameBytes, 30);
    prepared.push({
      nameBytes,
      data,
      crc,
      dosTime: time,
      dosDate: date,
      localOffset: cursor
    });
    localChunks.push(header, data);
    cursor += header.length + data.length;
  }
  // Second pass: build central directory entries.
  const centralChunks = [];
  let centralSize = 0;
  const centralStart = cursor;
  for (const p of prepared) {
    const entry = new Uint8Array(46 + p.nameBytes.length);
    const dv = new DataView(entry.buffer);
    dv.setUint32(0, 0x02014b50, true); // central directory header signature
    dv.setUint16(4, 20, true); // version made by
    dv.setUint16(6, 20, true); // version needed
    dv.setUint16(8, 0x0800, true); // general purpose bit flag — UTF-8
    dv.setUint16(10, 0, true); // method
    dv.setUint16(12, p.dosTime, true);
    dv.setUint16(14, p.dosDate, true);
    dv.setUint32(16, p.crc, true);
    dv.setUint32(20, p.data.length, true);
    dv.setUint32(24, p.data.length, true);
    dv.setUint16(28, p.nameBytes.length, true);
    dv.setUint16(30, 0, true); // extra
    dv.setUint16(32, 0, true); // comment
    dv.setUint16(34, 0, true); // disk number start
    dv.setUint16(36, 0, true); // internal attrs
    dv.setUint32(38, 0, true); // external attrs
    dv.setUint32(42, p.localOffset, true);
    entry.set(p.nameBytes, 46);
    centralChunks.push(entry);
    centralSize += entry.length;
  }
  // End of central directory record.
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true); // disk number
  eocdView.setUint16(6, 0, true); // disk where CD starts
  eocdView.setUint16(8, prepared.length, true); // entries on this disk
  eocdView.setUint16(10, prepared.length, true); // total entries
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, centralStart, true);
  eocdView.setUint16(20, 0, true); // comment length
  // BlobPart's strict typing in TS 5.7+ rejects Uint8Array<ArrayBufferLike>,
  // so concatenate into one ArrayBuffer-backed Uint8Array up front.
  const parts = [...localChunks, ...centralChunks, eocd];
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const flat = new Uint8Array(new ArrayBuffer(total));
  let off = 0;
  for (const p of parts) {
    flat.set(p, off);
    off += p.length;
  }
  return new Blob([flat], {
    type: 'application/zip'
  });
}

/***/ },

/***/ "./Dev/src/extractor/discourse.ts"
/*!****************************************!*\
  !*** ./Dev/src/extractor/discourse.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   extractPostData: () => (/* binding */ extractPostData),
/* harmony export */   getTopicMeta: () => (/* binding */ getTopicMeta),
/* harmony export */   isDiscoursePage: () => (/* binding */ isDiscoursePage),
/* harmony export */   seedFromPreloaded: () => (/* binding */ seedFromPreloaded)
/* harmony export */ });
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _htmlToMarkdown__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./htmlToMarkdown */ "./Dev/src/extractor/htmlToMarkdown.ts");
/* harmony import */ var _images__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./images */ "./Dev/src/extractor/images.ts");
// Discourse-specific extraction:
//   - isDiscoursePage()    : sniff via meta/generator/root markup
//   - getTopicMeta()       : title, URL, category, tags
//   - extractPostData(el)  : pull post fields from a rendered <article id="post_N">
//   - seedFromPreloaded()  : parse <div id="data-preloaded"> JSON
//
// Discourse uses virtual scrolling, so posts get unmounted as you scroll.
// The recorder layers three independent capture paths: preloaded JSON
// (initial batch), DOM observer (anything currently mounted), and a scroll
// listener (re-scan after the virtual scroller swaps).



function isDiscoursePage() {
  const gen = document.querySelector('meta[name="generator"]');
  if (gen && /Discourse/i.test(gen.getAttribute('content') ?? '')) return true;
  if (document.querySelector('meta[name="discourse_theme_id"]')) return true;
  if (document.querySelector('#main-outlet, .post-stream, article[id^="post_"]')) return true;
  return false;
}
function getTopicMeta() {
  const titleEl = document.querySelector('.fancy-title, .topic-title, h1 .topic-link, h1 a');
  const title = titleEl?.textContent?.trim() ?? document.title.replace(/\s*-\s*[^-]*$/, '').trim();
  const canonical = document.querySelector('link[rel="canonical"]');
  const url = canonical?.href ?? location.href;
  const categoryEl = document.querySelector('.topic-category .badge-category__name, .badge-category .badge-category__name');
  const category = categoryEl?.textContent?.trim() ?? '';
  const tags = Array.from(document.querySelectorAll('.discourse-tag')).map(t => t.textContent?.trim() ?? '').filter(Boolean);
  return {
    title,
    url,
    category,
    tags: Array.from(new Set(tags))
  };
}
function extractPostData(article) {
  let postNumber = null;
  const id = article.id || '';
  const idMatch = id.match(/^post_(\d+)$/);
  if (idMatch && idMatch[1]) postNumber = parseInt(idMatch[1], 10);
  if (postNumber === null) {
    const numEl = article.querySelector('.post-info.post-number, [itemprop="position"]');
    const m = numEl?.textContent?.match(/\d+/);
    if (m) postNumber = parseInt(m[0], 10);
  }
  if (postNumber === null) {
    const ariaPost = article.getAttribute('data-post-number');
    if (ariaPost) postNumber = parseInt(ariaPost, 10);
  }
  const usernameLink = article.querySelector('.names .first .username a, .names .username a, .creator .username a, a[data-user-card]');
  const username = usernameLink?.getAttribute('data-user-card') ?? usernameLink?.textContent?.trim() ?? '';
  const fullNameEl = article.querySelector('.names .full-name, .names .second.full-name a');
  const fullName = fullNameEl?.textContent?.trim() ?? '';
  const timeEl = article.querySelector('.post-info.post-date a, .post-date a, .relative-date, time');
  let postedAt = '';
  let postedAtIso = '';
  if (timeEl) {
    postedAt = timeEl.getAttribute('title') ?? timeEl.getAttribute('data-time') ?? timeEl.textContent?.trim() ?? '';
    const dt = timeEl.getAttribute('datetime') ?? timeEl.getAttribute('data-time');
    if (dt) {
      const n = Number(dt);
      postedAtIso = Number.isNaN(n) ? dt : new Date(n).toISOString();
    }
  }
  const permaEl = article.querySelector('.post-info.post-date a, .post-date a');
  const permalink = permaEl?.href ?? '';
  const cooked = article.querySelector('.cooked');
  const text = cooked ? (0,_htmlToMarkdown__WEBPACK_IMPORTED_MODULE_1__.htmlToMarkdown)(cooked) : (article.textContent ?? '').trim();
  const images = cooked && _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.get('captureImages') ? (0,_images__WEBPACK_IMPORTED_MODULE_2__.collectImageUrls)(cooked) : [];
  const likeBtn = article.querySelector('.like-count, button.like-count');
  const likeMatch = likeBtn?.textContent?.match(/\d+/);
  const likes = likeMatch ? parseInt(likeMatch[0], 10) : 0;
  return {
    postNumber: postNumber ?? 0,
    username,
    fullName,
    postedAt,
    postedAtIso,
    permalink,
    text,
    images,
    likes,
    capturedAt: new Date().toISOString(),
    source: 'dom'
  };
}
function seedFromPreloaded() {
  const node = document.getElementById('data-preloaded');
  if (!node) return 0;
  let outer;
  try {
    outer = JSON.parse(node.getAttribute('data-preloaded') ?? '{}');
  } catch {
    return 0;
  }
  let added = 0;
  const captureImages = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.get('captureImages');
  for (const key of Object.keys(outer)) {
    if (!key.startsWith('topic_')) continue;
    let topic;
    try {
      topic = JSON.parse(outer[key] ?? '{}');
    } catch {
      continue;
    }
    const posts = topic.post_stream?.posts;
    if (!Array.isArray(posts)) continue;
    const existingMeta = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.topicMeta;
    if (!existingMeta || !existingMeta.title) {
      _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.topicMeta = {
        title: topic.title ?? existingMeta?.title ?? '',
        url: existingMeta?.url ?? location.href,
        category: existingMeta?.category ?? '',
        tags: existingMeta?.tags ?? []
      };
    }
    for (const p of posts) {
      if (typeof p.post_number !== 'number') continue;
      const tmp = document.createElement('div');
      tmp.innerHTML = p.cooked ?? '';
      const text = (0,_htmlToMarkdown__WEBPACK_IMPORTED_MODULE_1__.htmlToMarkdown)(tmp);
      const images = captureImages ? (0,_images__WEBPACK_IMPORTED_MODULE_2__.collectImageUrls)(tmp) : [];
      const existing = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.get(p.post_number);
      if (!existing || text && text.length > (existing.text ?? '').length) {
        _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.set(p.post_number, {
          postNumber: p.post_number,
          username: p.username ?? '',
          fullName: p.name ?? '',
          postedAt: p.created_at ?? '',
          postedAtIso: p.created_at ?? '',
          permalink: location.origin + (topic.slug && topic.id ? `/t/${topic.slug}/${topic.id}/${p.post_number}` : ''),
          text,
          images,
          likes: 0,
          capturedAt: new Date().toISOString(),
          source: 'preloaded'
        });
        added++;
      }
    }
  }
  return added;
}

/***/ },

/***/ "./Dev/src/extractor/discourseApi.ts"
/*!*******************************************!*\
  !*** ./Dev/src/extractor/discourseApi.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DiscourseApi: () => (/* binding */ DiscourseApi),
/* harmony export */   captureAll: () => (/* binding */ captureAll),
/* harmony export */   getTopicId: () => (/* binding */ getTopicId)
/* harmony export */ });
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/taskRegistry */ "./Dev/src/core/taskRegistry.ts");
/* harmony import */ var _htmlToMarkdown__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./htmlToMarkdown */ "./Dev/src/extractor/htmlToMarkdown.ts");
/* harmony import */ var _images__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./images */ "./Dev/src/extractor/images.ts");
// Fast-path capture via Discourse's JSON API. Two endpoints:
//
//   GET /t/<id>.json
//     Returns topic meta + the first ~20 posts + post_stream.stream
//     (the ordered list of EVERY post ID in the topic).
//
//   GET /t/<id>/posts.json?post_ids[]=N&post_ids[]=N&...
//     Batch-fetches up to 20 posts by ID. Subsequent pages walk the stream
//     in chunks.
//
// Compared to scroll-based capture, this is ~50× faster on long threads
// (2000 posts ≈ 100 requests ≈ 30s) and avoids Discourse's virtual scroller
// missing posts. The downside is it's Discourse-specific and depends on the
// site keeping the JSON endpoint accessible to logged-in users.
//
// Cancellation: callers pass `signal` via CaptureAllOptions and get an
// immediate `apicapture:stopped({reason:'manual'})` when they trigger it —
// no need to wait for the in-flight fetch to settle. The task signal owned
// by the Tasks registry is also honoured so the Activity Panel's cancel
// button works end-to-end.





const BATCH_SIZE = 20;
const REQUEST_GAP_MS = 120; // tiny pause between batches so we don't get rate-limited
function getTopicId() {
  // 1) <meta name="discourse-topic-id" content="502565">
  const metaEl = document.querySelector('meta[name="discourse-topic-id"]');
  if (metaEl?.content) {
    const n = parseInt(metaEl.content, 10);
    if (!Number.isNaN(n)) return n;
  }
  // 2) URL: /t/<slug>/<id> or /t/topic/<id>
  const m = location.pathname.match(/\/t\/(?:[^/]+\/)?(\d+)/);
  if (m && m[1]) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) return n;
  }
  // 3) any post article carries data-topic-id
  const art = document.querySelector('article[data-topic-id]');
  if (art?.dataset.topicId) {
    const n = parseInt(art.dataset.topicId, 10);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}
async function fetchJSON(url, signal) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json'
    },
    signal
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (${url})`);
  return await res.json();
}
function apiPostToPostData(p, slug, topicId) {
  const tmp = document.createElement('div');
  tmp.innerHTML = p.cooked ?? '';
  const text = (0,_htmlToMarkdown__WEBPACK_IMPORTED_MODULE_3__.htmlToMarkdown)(tmp);
  const images = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.get('captureImages') ? (0,_images__WEBPACK_IMPORTED_MODULE_4__.collectImageUrls)(tmp) : [];
  // actions_summary[].id === 2 is the "Like" action on stock Discourse.
  let likes = 0;
  if (Array.isArray(p.actions_summary)) {
    const like = p.actions_summary.find(a => a && a.id === 2);
    if (like && typeof like.count === 'number') likes = like.count;
  }
  return {
    postNumber: p.post_number,
    username: p.username ?? '',
    fullName: p.name ?? '',
    postedAt: p.created_at ?? '',
    postedAtIso: p.created_at ?? '',
    permalink: location.origin + (slug ? `/t/${slug}/${topicId}/${p.post_number}` : `/t/${topicId}/${p.post_number}`),
    text,
    images,
    likes,
    capturedAt: new Date().toISOString(),
    source: 'preloaded'
  };
}
function mergePost(p) {
  const existing = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.get(p.postNumber);
  if (!existing || p.text && p.text.length > (existing.text ?? '').length) {
    _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.set(p.postNumber, p);
    return true;
  }
  return false;
}
function recomputeImageCount() {
  let total = 0;
  for (const p of _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.values()) total += p.images.length;
  _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.patch({
    imageCount: total
  });
}
async function captureAll(opts = {}) {
  const {
    signal: callerSignal,
    onProgress
  } = opts;
  // Create the task up front so the panel shows "fetching topic..." stage
  // even before we know the post count. total is updated once stream.length
  // is known.
  const stages = [{
    id: 'fetch-topic',
    labelKey: 'task_stage_fetch_topic',
    status: 'pending'
  }, {
    id: 'fetch-batch',
    labelKey: 'task_stage_fetch_batch',
    status: 'pending'
  }];
  const {
    id: taskId,
    signal: taskSignal
  } = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.create({
    kind: 'apicapture',
    titleKey: 'task_title_apicapture',
    unit: 'posts',
    total: 0,
    stages,
    cancellable: true,
    retryable: false
  });
  // Single-shot stopped emit — fired by the task signal, the caller
  // signal, or normal completion. Dedup so autoSession doesn't get told
  // twice.
  let stoppedEmitted = false;
  const emitStopped = payload => {
    if (stoppedEmitted) return;
    stoppedEmitted = true;
    _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('apicapture:stopped', payload);
  };
  let signalAborted = false;
  const onSignalAbort = () => {
    if (signalAborted) return;
    signalAborted = true;
    // Producer must emit immediately so autoSession's pending capture:complete
    // listener doesn't wait on the in-flight fetch to settle.
    emitStopped({
      reason: 'manual'
    });
  };
  callerSignal?.addEventListener('abort', onSignalAbort, {
    once: true
  });
  taskSignal.addEventListener('abort', onSignalAbort, {
    once: true
  });
  // Pre-aborted callers — fast-bail.
  if (callerSignal?.aborted || taskSignal.aborted) {
    onSignalAbort();
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'cancelled'
    });
    return {
      posts: _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.size,
      total: 0
    };
  }
  const isAborted = () => signalAborted;
  const cleanup = () => {
    callerSignal?.removeEventListener('abort', onSignalAbort);
    taskSignal.removeEventListener('abort', onSignalAbort);
  };
  // We pass the task signal directly to fetch so an abort triggers the
  // network request to reject immediately rather than waiting for the loop
  // to notice. Caller signal still routes through `signalAborted` for the
  // loop check, but fetch only honours one AbortSignal at a time.
  const fetchSignal = taskSignal;
  try {
    const topicId = getTopicId();
    if (topicId == null) {
      throw new Error('无法识别 Discourse topic ID');
    }
    _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('apicapture:started', undefined);
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      activeStageId: 'fetch-topic',
      stagePatch: {
        id: 'fetch-topic',
        status: 'active'
      }
    });
    const topic = await fetchJSON(`/t/${topicId}.json`, fetchSignal);
    const slug = topic.slug;
    const stream = topic.post_stream?.stream ?? [];
    const seedPosts = topic.post_stream?.posts ?? [];
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      stagePatch: {
        id: 'fetch-topic',
        status: 'done'
      },
      total: stream.length
    });
    // Seed posts come back with the same shape as the batched fetch — merge
    // them in first so the dock immediately shows progress.
    let added = 0;
    for (const p of seedPosts) {
      if (mergePost(apiPostToPostData(p, slug, topicId))) added++;
    }
    if (added > 0) {
      _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.lastCapturedAt = new Date();
      recomputeImageCount();
      _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('capture:tick', {
        added
      });
    }
    onProgress?.({
      done: seedPosts.length,
      total: stream.length
    });
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      activeStageId: 'fetch-batch',
      stagePatch: {
        id: 'fetch-batch',
        status: 'active',
        total: stream.length,
        done: seedPosts.length
      },
      done: seedPosts.length
    });
    const seenIds = new Set(seedPosts.map(p => p.id));
    const remaining = stream.filter(id => !seenIds.has(id));
    let done = seedPosts.length;
    for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
      if (isAborted()) {
        emitStopped({
          reason: 'manual'
        });
        _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
          status: 'cancelled'
        });
        return {
          posts: _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.size,
          total: stream.length
        };
      }
      const ids = remaining.slice(i, i + BATCH_SIZE);
      const qs = ids.map(id => `post_ids[]=${id}`).join('&');
      try {
        const batch = await fetchJSON(`/t/${topicId}/posts.json?${qs}`, fetchSignal);
        const posts = batch.post_stream?.posts ?? [];
        let batchAdded = 0;
        for (const p of posts) {
          if (mergePost(apiPostToPostData(p, slug, topicId))) batchAdded++;
        }
        if (batchAdded > 0) {
          _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.lastCapturedAt = new Date();
          recomputeImageCount();
          _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('capture:tick', {
            added: batchAdded
          });
        }
        done += posts.length;
        onProgress?.({
          done,
          total: stream.length
        });
        _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
          done,
          stagePatch: {
            id: 'fetch-batch',
            done,
            total: stream.length
          }
        });
      } catch (err) {
        if (isAborted()) {
          emitStopped({
            reason: 'manual'
          });
          _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
            status: 'cancelled'
          });
          return {
            posts: _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.size,
            total: stream.length
          };
        }
        const msg = err instanceof Error ? err.message : String(err);
        emitStopped({
          reason: 'error',
          error: msg
        });
        _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
          addFailure: {
            id: `batch-${i}`,
            label: `batch #${i / BATCH_SIZE + 1} (ids ${ids[0]}-${ids[ids.length - 1]})`,
            error: msg
          }
        });
        _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
          status: 'failed',
          message: msg
        });
        throw err;
      }
      if (i + BATCH_SIZE < remaining.length) {
        await new Promise(r => setTimeout(r, REQUEST_GAP_MS));
      }
    }
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.update(taskId, {
      stagePatch: {
        id: 'fetch-batch',
        status: 'done'
      }
    });
    emitStopped({
      reason: 'end'
    });
    _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('capture:complete', {
      reason: 'api'
    });
    _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.end(taskId, {
      status: 'succeeded'
    });
    return {
      posts: _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.posts.size,
      total: stream.length
    };
  } finally {
    cleanup();
  }
}
const DiscourseApi = {
  captureAll,
  getTopicId
};

/***/ },

/***/ "./Dev/src/extractor/htmlToMarkdown.ts"
/*!*********************************************!*\
  !*** ./Dev/src/extractor/htmlToMarkdown.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   htmlToMarkdown: () => (/* binding */ htmlToMarkdown)
/* harmony export */ });
// Minimal HTML → Markdown converter, tailored to Discourse's "cooked" post
// HTML. We don't try to handle arbitrary HTML — only the constructs Discourse
// emits: paragraphs, lists, blockquotes, code blocks, headings, quote asides,
// lightbox images, details/summary, inline strong/em/del/code.
function walkInto(ctx, node, buffer) {
  const saved = ctx.out.length;
  walk(ctx, node);
  const collected = ctx.out.splice(saved, ctx.out.length - saved);
  buffer.push(collected.join(''));
}
function walk(ctx, node) {
  if (node.nodeType === Node.TEXT_NODE) {
    ctx.out.push(node.nodeValue ?? '');
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node;
  const tag = el.tagName.toLowerCase();
  if (el.classList.contains('post-action-menu')) return;
  if (el.classList.contains('quote-controls')) return;
  if (tag === 'svg' || tag === 'button' || tag === 'script' || tag === 'style') return;
  if (tag === 'img') {
    const img = el;
    if (img.classList.contains('emoji')) {
      ctx.out.push(img.getAttribute('alt') ?? img.getAttribute('title') ?? '');
      return;
    }
    const lightboxAnchor = img.closest('a.lightbox');
    const href = lightboxAnchor?.getAttribute('href') ?? '';
    const src = href || img.getAttribute('data-src') || img.getAttribute('src') || '';
    const alt = (img.getAttribute('alt') ?? '').replace(/[[\]]/g, '');
    if (src) ctx.out.push(`\n\n![${alt}](${src})\n\n`);
    return;
  }
  if (tag === 'aside' && el.classList.contains('quote')) {
    const user = el.getAttribute('data-username') ?? '';
    const post = el.getAttribute('data-post') ?? '';
    const bq = el.querySelector('blockquote');
    const buf = [];
    if (bq) for (const c of Array.from(bq.childNodes)) walkInto(ctx, c, buf);
    const inner = buf.join('').trim();
    const head = user ? `> [引用 @${user}${post ? ` #${post}` : ''}]` : '> [引用]';
    const quoted = inner.split('\n').map(l => `> ${l}`).join('\n');
    ctx.out.push(`\n\n${head}\n${quoted}\n\n`);
    return;
  }
  if (tag === 'br') {
    ctx.out.push('\n');
    return;
  }
  if (tag === 'hr') {
    ctx.out.push('\n\n---\n\n');
    return;
  }
  if (tag === 'p') {
    ctx.out.push('\n\n');
    descend(ctx, el);
    ctx.out.push('\n\n');
    return;
  }
  if (tag === 'blockquote') {
    const buf = [];
    for (const c of Array.from(el.childNodes)) walkInto(ctx, c, buf);
    const inner = buf.join('').trim();
    const lines = inner.split('\n').map(l => `> ${l}`).join('\n');
    ctx.out.push(`\n\n${lines}\n\n`);
    return;
  }
  if (tag === 'pre') {
    const code = el.querySelector('code');
    const text = (code ?? el).textContent ?? '';
    const lang = code ? (Array.from(code.classList).find(c => c.startsWith('lang-')) ?? '').replace('lang-', '') : '';
    ctx.out.push(`\n\n\`\`\`${lang}\n${text.replace(/\n+$/, '')}\n\`\`\`\n\n`);
    return;
  }
  if (tag === 'code') {
    ctx.out.push('`');
    descend(ctx, el);
    ctx.out.push('`');
    return;
  }
  if (tag === 'strong' || tag === 'b') {
    ctx.out.push('**');
    descend(ctx, el);
    ctx.out.push('**');
    return;
  }
  if (tag === 'em' || tag === 'i') {
    ctx.out.push('*');
    descend(ctx, el);
    ctx.out.push('*');
    return;
  }
  if (tag === 'del' || tag === 's' || tag === 'strike') {
    ctx.out.push('~~');
    descend(ctx, el);
    ctx.out.push('~~');
    return;
  }
  if (tag === 'a') {
    const href = el.getAttribute('href') ?? '';
    if (el.classList.contains('lightbox')) {
      descend(ctx, el);
      return;
    }
    if (!href) {
      descend(ctx, el);
      return;
    }
    ctx.out.push('[');
    descend(ctx, el);
    ctx.out.push(`](${href})`);
    return;
  }
  if (tag === 'ul' || tag === 'ol') {
    ctx.out.push('\n');
    let i = 1;
    for (const li of Array.from(el.children)) {
      if (li.tagName.toLowerCase() !== 'li') continue;
      ctx.out.push(tag === 'ol' ? `${i++}. ` : '- ');
      descend(ctx, li);
      ctx.out.push('\n');
    }
    ctx.out.push('\n');
    return;
  }
  if (/^h[1-6]$/.test(tag)) {
    const level = '#'.repeat(parseInt(tag[1] ?? '1', 10));
    ctx.out.push(`\n\n${level} `);
    descend(ctx, el);
    ctx.out.push('\n\n');
    return;
  }
  if (tag === 'details') {
    const summary = el.querySelector(':scope > summary');
    const sumText = summary ? (summary.textContent ?? '').trim() : '展开';
    ctx.out.push(`\n\n<details>\n<summary>${sumText}</summary>\n\n`);
    for (const c of Array.from(el.childNodes)) {
      if (c !== summary) walk(ctx, c);
    }
    ctx.out.push('\n\n</details>\n\n');
    return;
  }
  descend(ctx, el);
}
function descend(ctx, el) {
  for (const c of Array.from(el.childNodes)) walk(ctx, c);
}
function htmlToMarkdown(root) {
  if (!root) return '';
  const ctx = {
    out: []
  };
  for (const c of Array.from(root.childNodes)) walk(ctx, c);
  let md = ctx.out.join('');
  md = md.replace(/[ \t]+\n/g, '\n');
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

/***/ },

/***/ "./Dev/src/extractor/images.ts"
/*!*************************************!*\
  !*** ./Dev/src/extractor/images.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectImageUrls: () => (/* binding */ collectImageUrls)
/* harmony export */ });
// Image URL harvester for a post body. Prefers the original (lightbox parent
// href) over the served thumbnail, falls back to data-src, then src. Skips
// emoji <img>s, which are tiny inline glyphs rather than user content.
function collectImageUrls(root) {
  if (!root) return [];
  const urls = [];
  const seen = new Set();
  for (const img of Array.from(root.querySelectorAll('img'))) {
    if (img.classList.contains('emoji')) continue;
    const lightbox = img.closest('a.lightbox');
    const url = lightbox?.getAttribute('href') ?? img.getAttribute('data-src') ?? img.getAttribute('src') ?? '';
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

/***/ },

/***/ "./Dev/src/infra/i18n/en.ts"
/*!**********************************!*\
  !*** ./Dev/src/infra/i18n/en.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EN_STRINGS: () => (/* binding */ EN_STRINGS)
/* harmony export */ });
// English strings. Must contain every key from zh.ts — TypeScript enforces
// this via the StringKey type derived from the Chinese catalog.
const EN_STRINGS = {
  // ── Dock chrome ───────────────────────────────────────────────
  dock_title: 'Forum Recorder',
  dock_minimize: 'Minimize',
  dock_expand: 'Expand',
  dock_settings: 'Settings',
  // ── Tabs ──────────────────────────────────────────────────────
  tab_capture: 'Capture',
  tab_export: 'Export',
  tab_settings: 'Settings',
  // ── Status labels ─────────────────────────────────────────────
  status_idle: 'Idle',
  status_recording: 'Recording',
  status_paused: 'Paused',
  status_stopped: 'Stopped',
  status_detecting: 'Detecting',
  // ── Mode badge ────────────────────────────────────────────────
  mode_discourse: 'Discourse',
  mode_generic: 'Generic',
  mode_detecting: 'Detecting',
  // ── Stat cell labels ──────────────────────────────────────────
  stat_posts: 'Posts',
  stat_images: 'Images',
  stat_elapsed: 'Time',
  // ── Action buttons ────────────────────────────────────────────
  btn_start: 'Start',
  btn_recording: 'Recording',
  btn_pause: 'Pause',
  btn_resume: 'Resume',
  btn_stop: 'Stop',
  btn_export: 'Export',
  btn_copy_md: 'Copy MD',
  btn_export_dom: 'Export DOM',
  btn_clear: 'Clear',
  btn_done: 'Done',
  btn_reset_prefs: 'Reset preferences',
  // ── Section titles ────────────────────────────────────────────
  section_theme: 'Appearance',
  section_format: 'Export format',
  section_capture: 'Capture options',
  section_capture_strategy: 'Capture strategy',
  section_export_advanced: 'Export options',
  section_about: 'About',
  // ── Theme picker ──────────────────────────────────────────────
  theme_light: 'Light',
  theme_dark: 'Dark',
  theme_system: 'System',
  // ── Export format picker ──────────────────────────────────────
  fmt_zip: 'ZIP (with images)',
  fmt_both: 'MD + JSON',
  fmt_md: 'MD only',
  fmt_json: 'JSON only',
  fmt_sharded: 'Sharded (AI-friendly)',
  // ── Sharded format options ────────────────────────────────────
  section_shard: 'Sharding',
  label_shard_cap: 'Shard cap (lines)',
  desc_shard_cap: 'Max lines per shard. Posts are atomic — a single oversized post becomes its own shard.',
  // ── Live shard preview (CaptureTab) ───────────────────────────
  shard_preview_label: 'Shards',
  shard_preview_shards: 'shards',
  shard_preview_oversize: 'oversize',
  // ── Capture strategy picker ───────────────────────────────────
  strategy_scroll: 'Scroll capture',
  strategy_scroll_desc: 'Generic mode; records as you scroll. Works on any forum.',
  strategy_api: 'API capture',
  strategy_api_desc: 'Discourse only; hits the JSON endpoint directly. ~50× faster.',
  // ── Toggle labels & descriptions ──────────────────────────────
  toggle_capture_images: 'Record image URLs',
  toggle_capture_images_desc: 'Capture original image links from each post (off = text only).',
  toggle_download_images: 'Download images in ZIP',
  toggle_download_images_desc: 'Pack image files inside the .zip (off = links only).',
  toggle_auto_scroll: 'Auto-scroll',
  toggle_auto_scroll_desc: 'Scroll the page automatically after Start, until no new posts appear.',
  toggle_auto_start: 'Auto-start on topic open',
  toggle_auto_start_desc: 'Begin recording the moment a Discourse topic page loads.',
  toggle_auto_save: 'Auto-export when capture completes',
  toggle_auto_save_desc: 'Save in the current format once the capture pass finishes.',
  toggle_filename_prefix: 'Date-prefix export filenames',
  toggle_filename_prefix_desc: 'Filename: {YYYY-MM-DD}_{title}.{ext}',
  // ── About card ────────────────────────────────────────────────
  about_blurb: 'Liquid-glass recorder for Discourse-style forums. Captures post text and image URLs, exports to Markdown, JSON, or a ZIP bundle.',
  about_privacy: 'Stays local. No data is sent to any server.',
  about_version: 'Version',
  about_build: 'Build',
  about_shortcuts: 'Keyboard shortcuts',
  about_shortcut_record: 'Alt+Shift+R · Start / stop recording',
  about_shortcut_theme: 'Alt+Shift+T · Cycle theme',
  // ── Toast messages ────────────────────────────────────────────
  toast_started_discourse: 'Recording started (Discourse mode)',
  toast_started_generic: 'Recording started (generic mode)',
  toast_paused: 'Paused',
  toast_resumed: 'Resumed',
  toast_stopped: 'Stopped',
  toast_cleared: 'Cleared',
  toast_clear_confirm: 'Clear all recorded content?',
  toast_copied_md: 'Markdown copied to clipboard',
  toast_zip_start: 'Building ZIP',
  toast_zip_with_images: '(with images)',
  toast_zip_without_images: '(metadata only)',
  toast_zip_done: 'ZIP ready',
  toast_zip_failed: 'ZIP failed',
  toast_export_md: 'Downloading Markdown',
  toast_export_json: 'Downloading JSON',
  toast_export_both: 'Downloading MD + JSON',
  toast_export_sharded: 'Building sharded ZIP',
  toast_export_sharded_done: 'Sharded ZIP ready',
  toast_export_dom: 'Downloading page HTML snapshot',
  toast_long_path_warn: 'Long filename. Copying it into a deep destination may trigger "path too long" — keep the destination short, or enable Windows LongPathsEnabled.',
  toast_autoscroll_end: 'Auto-scroll finished: reached the bottom',
  toast_autoscroll_max: 'Auto-scroll: hit the max-iterations cap',
  toast_apicapture_started: 'API capture started',
  toast_apicapture_done: 'API capture finished',
  toast_apicapture_error: 'API capture failed',
  toast_theme_changed: 'Theme',
  toast_locale_changed: 'Language',
  toast_prefs_reset: 'Preferences reset — reload the page to apply',
  // ── Locale picker ─────────────────────────────────────────────
  section_locale: 'Language',
  locale_zh: '中文',
  locale_en: 'English',
  locale_system: 'System',
  // ── Activity panel & tasks ────────────────────────────────────
  activity_panel_label: 'Tasks',
  activity_empty: 'No active tasks',
  activity_dismiss: 'Dismiss',
  activity_dismiss_all: 'Dismiss completed',
  task_status_pending: 'Pending',
  task_status_running: 'Running',
  task_status_succeeded: 'Done',
  task_status_failed: 'Failed',
  task_status_cancelled: 'Cancelled',
  task_title_export_zip: 'Export ZIP',
  task_title_export_sharded: 'Export sharded ZIP',
  task_title_apicapture: 'API capture',
  task_title_image_download: 'Image download',
  task_title_image_retry: 'Retry {n} images',
  task_stage_fetch_topic: 'Load topic',
  task_stage_fetch_batch: 'Fetch batch',
  task_stage_render: 'Render',
  task_stage_download: 'Download images',
  task_stage_pack: 'Pack archive',
  task_eta: 'ETA',
  task_throughput_posts: 'posts/s',
  task_throughput_images: 'imgs/s',
  task_throughput_files: 'files/s',
  task_throughput_items: 'items/s',
  task_failed_count: 'failed {n}',
  task_failures_summary: 'Show {n} failures',
  task_failures_more: '...and {n} more not shown',
  task_failure_unknown_error: 'Unknown error',
  task_retry: 'Retry {n}',
  task_cancel: 'Cancel',
  task_dismiss: 'Close',
  task_unit_posts: 'posts',
  task_unit_images: 'images',
  task_unit_files: 'files',
  task_unit_items: 'items'
};

/***/ },

/***/ "./Dev/src/infra/i18n/i18n.ts"
/*!************************************!*\
  !*** ./Dev/src/infra/i18n/i18n.ts ***!
  \************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   I18n: () => (/* binding */ I18n),
/* harmony export */   createI18n: () => (/* binding */ createI18n)
/* harmony export */ });
/* harmony import */ var _zh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./zh */ "./Dev/src/infra/i18n/zh.ts");
/* harmony import */ var _en__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./en */ "./Dev/src/infra/i18n/en.ts");
/* harmony import */ var _storage_storageOperator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Bilingual i18n. Auto-detects the user's locale on first load:
//   - explicit override in storage (set via the settings panel) wins
//   - else any `zh*` navigator.language → Chinese
//   - else → English
//
// Keys live in zh.ts; en.ts mirrors them via a Record<StringKey, string> so
// adding a key to one catalog without the other is a compile error.




const CATALOGS = {
  zh: _zh__WEBPACK_IMPORTED_MODULE_0__.ZH_STRINGS,
  en: _en__WEBPACK_IMPORTED_MODULE_1__.EN_STRINGS
};
function detectSystemLocale() {
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (lang.startsWith('zh')) return 'zh';
  }
  return 'en';
}
function resolveLocale(pref) {
  if (pref === 'system') return detectSystemLocale();
  return pref;
}
function createI18n(deps) {
  const {
    storage,
    storageKey
  } = deps;
  let preference = storage.get(storageKey, 'system');
  let locale = resolveLocale(preference);
  const handlers = new Set();
  // Re-evaluate on OS language change. Browsers don't emit a `languagechange`
  // event reliably, but when they do we want to honor it for users on
  // 'system' preference.
  if (typeof window !== 'undefined') {
    window.addEventListener('languagechange', () => {
      if (preference !== 'system') return;
      const next = detectSystemLocale();
      if (next === locale) return;
      locale = next;
      for (const h of handlers) {
        try {
          h(locale);
        } catch {
          /* handler errors must not break the i18n loop */
        }
      }
    });
  }
  function interpolate(template, vars) {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (_match, name) => name in vars ? String(vars[name]) : `{${name}}`);
  }
  return {
    t(key, vars) {
      const catalog = CATALOGS[locale];
      const value = catalog[key] ?? _zh__WEBPACK_IMPORTED_MODULE_0__.ZH_STRINGS[key] ?? key;
      return interpolate(value, vars);
    },
    locale() {
      return locale;
    },
    preference() {
      return preference;
    },
    setPreference(next) {
      preference = next;
      storage.set(storageKey, next);
      const resolved = resolveLocale(next);
      if (resolved === locale) return;
      locale = resolved;
      for (const h of handlers) {
        try {
          h(locale);
        } catch {
          /* swallow */
        }
      }
    },
    onChange(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    }
  };
}
// Default singleton — wired against the production storageOP. Modules that
// just want to localise a string can import this directly.
const I18n = createI18n({
  storage: _storage_storageOperator__WEBPACK_IMPORTED_MODULE_2__.storageOP,
  storageKey: _bootstrap_config__WEBPACK_IMPORTED_MODULE_3__.STORAGE_KEYS.locale
});

/***/ },

/***/ "./Dev/src/infra/i18n/zh.ts"
/*!**********************************!*\
  !*** ./Dev/src/infra/i18n/zh.ts ***!
  \**********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZH_STRINGS: () => (/* binding */ ZH_STRINGS)
/* harmony export */ });
// Simplified-Chinese strings. Keys mirror the structure of the en.ts catalog;
// add/rename in lockstep so the TypeScript Strings type stays exhaustive.
const ZH_STRINGS = {
  // ── Dock chrome ───────────────────────────────────────────────
  dock_title: '论坛文字记录器',
  dock_minimize: '最小化',
  dock_expand: '展开',
  dock_settings: '设置',
  // ── Tabs ──────────────────────────────────────────────────────
  tab_capture: '记录',
  tab_export: '导出',
  tab_settings: '设置',
  // ── Status labels (shown in the mode row) ─────────────────────
  status_idle: '空闲',
  status_recording: '正在记录',
  status_paused: '已暂停',
  status_stopped: '已停止',
  status_detecting: '检测中',
  // ── Mode badge ────────────────────────────────────────────────
  mode_discourse: 'Discourse',
  mode_generic: '通用',
  mode_detecting: '检测中',
  // ── Stat cell labels ──────────────────────────────────────────
  stat_posts: '楼层',
  stat_images: '图片',
  stat_elapsed: '时长',
  // ── Action buttons ────────────────────────────────────────────
  btn_start: '开始记录',
  btn_recording: '记录中',
  btn_pause: '暂停',
  btn_resume: '继续',
  btn_stop: '停止',
  btn_export: '导出',
  btn_copy_md: '复制 MD',
  btn_export_dom: '导出 DOM',
  btn_clear: '清空',
  btn_done: '完成',
  btn_reset_prefs: '清空所有偏好',
  // ── Section titles ────────────────────────────────────────────
  section_theme: '主题外观',
  section_format: '导出格式',
  section_capture: '记录选项',
  section_capture_strategy: '抓取策略',
  section_export_advanced: '导出选项',
  section_about: '关于',
  // ── Theme picker ──────────────────────────────────────────────
  theme_light: '浅色',
  theme_dark: '深色',
  theme_system: '系统',
  // ── Export format picker ──────────────────────────────────────
  fmt_zip: 'ZIP (含图片)',
  fmt_both: 'MD + JSON',
  fmt_md: '仅 MD',
  fmt_json: '仅 JSON',
  fmt_sharded: '分片 (AI 友好)',
  // ── Sharded format options ────────────────────────────────────
  section_shard: '分片设置',
  label_shard_cap: '分片上限 (行)',
  desc_shard_cap: '每片最多多少行，超过则切到下一片；单楼超过上限会独占一片',
  // ── Live shard preview (CaptureTab) ───────────────────────────
  shard_preview_label: '分片预览',
  shard_preview_shards: '片',
  shard_preview_oversize: '超长',
  // ── Capture strategy picker ───────────────────────────────────
  strategy_scroll: '滚动抓取',
  strategy_scroll_desc: '通用模式;边滚动边记录,适合所有论坛',
  strategy_api: 'API 抓取',
  strategy_api_desc: '仅 Discourse;直接请求 JSON 接口,比滚动快约 50 倍',
  // ── Toggle labels & descriptions ──────────────────────────────
  toggle_capture_images: '记录图片 URL',
  toggle_capture_images_desc: '抓取楼层中图片的原图链接(关闭可只记文字)',
  toggle_download_images: '导出 ZIP 时下载图片',
  toggle_download_images_desc: '把图片文件一起打包进 zip(关闭则只保留链接)',
  toggle_auto_scroll: '自动滚动加载',
  toggle_auto_scroll_desc: '开始记录后自动向下滚动,直到没有新楼层为止',
  toggle_auto_start: '打开论坛时自动开始',
  toggle_auto_start_desc: '在 Discourse 主题页面打开时自动启动记录',
  toggle_auto_save: '抓取完成后自动导出',
  toggle_auto_save_desc: '抓取到底或 API 跑完后自动按当前格式保存一份',
  toggle_filename_prefix: '导出文件加日期前缀',
  toggle_filename_prefix_desc: '文件名格式: {YYYY-MM-DD}_{标题}.{后缀}',
  // ── About card ────────────────────────────────────────────────
  about_blurb: '液态玻璃风格的 Discourse 论坛记录器,记录文字与图片链接,导出 Markdown / JSON / ZIP。',
  about_privacy: '仅在本地保存记录,不向任何服务器上传数据。',
  about_version: '版本',
  about_build: '构建',
  about_shortcuts: '快捷键',
  about_shortcut_record: 'Alt+Shift+R · 开始 / 停止记录',
  about_shortcut_theme: 'Alt+Shift+T · 切换主题',
  // ── Toast messages ────────────────────────────────────────────
  toast_started_discourse: '开始记录 (Discourse 模式)',
  toast_started_generic: '开始记录 (通用模式)',
  toast_paused: '已暂停',
  toast_resumed: '已恢复',
  toast_stopped: '已停止',
  toast_cleared: '已清空',
  toast_clear_confirm: '确定清空所有已记录的内容?',
  toast_copied_md: '已复制 Markdown 到剪贴板',
  toast_zip_start: '开始打包 ZIP',
  toast_zip_with_images: '(含图片)',
  toast_zip_without_images: '(仅元数据)',
  toast_zip_done: 'ZIP 打包完成',
  toast_zip_failed: 'ZIP 失败',
  toast_export_md: '正在下载 Markdown',
  toast_export_json: '正在下载 JSON',
  toast_export_both: '正在下载 MD + JSON',
  toast_export_sharded: '正在打包分片 ZIP',
  toast_export_sharded_done: '分片 ZIP 完成',
  toast_export_dom: '正在下载页面 HTML 快照',
  toast_long_path_warn: '文件名较长。复制到深层路径可能报 "path too long" —— 建议保持目标路径较短，或在 Windows 启用长路径支持（LongPathsEnabled）',
  toast_autoscroll_end: '自动滚动完成: 已到达底部',
  toast_autoscroll_max: '自动滚动: 已达最大轮次',
  toast_apicapture_started: '正在使用 API 抓取',
  toast_apicapture_done: 'API 抓取完成',
  toast_apicapture_error: 'API 抓取失败',
  toast_theme_changed: '主题',
  toast_locale_changed: '语言',
  toast_prefs_reset: '偏好已重置,刷新页面后生效',
  // ── Locale picker ─────────────────────────────────────────────
  section_locale: '语言',
  locale_zh: '中文',
  locale_en: 'English',
  locale_system: '跟随系统',
  // ── Activity panel & tasks ────────────────────────────────────
  activity_panel_label: '任务面板',
  activity_empty: '暂无任务',
  activity_dismiss: '清除',
  activity_dismiss_all: '清除已完成',
  task_status_pending: '准备中',
  task_status_running: '进行中',
  task_status_succeeded: '已完成',
  task_status_failed: '已失败',
  task_status_cancelled: '已取消',
  task_title_export_zip: '导出 ZIP',
  task_title_export_sharded: '导出分片 ZIP',
  task_title_apicapture: 'API 抓取',
  task_title_image_download: '下载图片',
  task_title_image_retry: '重试下载 {n} 张图片',
  task_stage_fetch_topic: '加载主题',
  task_stage_fetch_batch: '抓取批次',
  task_stage_render: '渲染',
  task_stage_download: '下载图片',
  task_stage_pack: '打包',
  task_eta: '预计',
  task_throughput_posts: '楼/秒',
  task_throughput_images: '张/秒',
  task_throughput_files: '文件/秒',
  task_throughput_items: '项/秒',
  task_failed_count: '失败 {n}',
  task_failures_summary: '查看 {n} 个失败项',
  task_failures_more: '...另有 {n} 个未列出',
  task_failure_unknown_error: '未知错误',
  task_retry: '重试 {n} 个',
  task_cancel: '取消',
  task_dismiss: '关闭',
  task_unit_posts: '楼层',
  task_unit_images: '图片',
  task_unit_files: '文件',
  task_unit_items: '项'
};

/***/ },

/***/ "./Dev/src/infra/logging/config/LogConfig.ts"
/*!***************************************************!*\
  !*** ./Dev/src/infra/logging/config/LogConfig.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LOG_CONFIG: () => (/* binding */ LOG_CONFIG)
/* harmony export */ });
// Default logging configuration. Edit NAMESPACE_LEVELS to mute a single
// subsystem ('disabled') or surface its debug stream ('debug'). The
// notifications block governs the user-facing toast bridge — by default
// only the 'main' namespace pages info+ to a toast, so the recorder's
// per-tick logs don't spam the user.
const NAMESPACE_LEVELS = {
  bootstrap: 'info',
  main: 'info',
  recorder: 'info',
  exporter: 'info',
  extractor: 'info',
  storage: 'info',
  render: 'info',
  ui: 'info',
  theme: 'info',
  i18n: 'info'
};
const LOG_CONFIG = {
  namespaceFiltering: {
    console: NAMESPACE_LEVELS,
    notifications: NAMESPACE_LEVELS
  },
  console: {
    enabled: true,
    defaultLevel: 'info',
    useColors: true,
    showTime: true,
    showDelta: true,
    showTotal: false,
    showObject: true,
    alignNamespaces: true,
    namespaceWidth: 10,
    objectMaxLen: 2000,
    redactKeys: []
  },
  notifications: {
    enabled: true,
    defaultLevel: 'error',
    rules: [{
      ns: 'main',
      level: 'info'
    }, {
      level: 'error'
    }],
    behavior: {
      duration: 3000,
      durationByLevel: {
        error: 5000,
        info: 3000,
        debug: 2000
      }
    },
    deduplication: {
      enabled: true,
      windowMs: 3000
    }
  }
};

/***/ },

/***/ "./Dev/src/infra/logging/core/LogClock.ts"
/*!************************************************!*\
  !*** ./Dev/src/infra/logging/core/LogClock.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logClock: () => (/* binding */ logClock)
/* harmony export */ });
// High-resolution clock for log timing. Falls back to Date.now() when
// performance.now is unavailable (older userscript managers, sandboxed
// contexts). Exposes both a continuous timeline (now/total) and a per-call
// delta so the formatter can render +Xms between adjacent log lines.
class LogClock {
  constructor() {
    this.hasPerformance = typeof performance !== 'undefined' && typeof performance.now === 'function';
    this.t0 = this.now();
    this.lastLog = this.t0;
  }
  now() {
    return this.hasPerformance ? performance.now() : Date.now();
  }
  stamp() {
    const current = this.now();
    const delta = current - this.lastLog;
    const total = current - this.t0;
    this.lastLog = current;
    return {
      current,
      delta,
      total
    };
  }
  formatTime() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }
  reset() {
    this.t0 = this.now();
    this.lastLog = this.t0;
  }
}
const logClock = new LogClock();

/***/ },

/***/ "./Dev/src/infra/logging/core/LogFormatter.ts"
/*!****************************************************!*\
  !*** ./Dev/src/infra/logging/core/LogFormatter.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LogFormatter: () => (/* binding */ LogFormatter)
/* harmony export */ });
/* harmony import */ var _LogClock__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogClock */ "./Dev/src/infra/logging/core/LogClock.ts");
/* harmony import */ var _LogLevels__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./LogLevels */ "./Dev/src/infra/logging/core/LogLevels.ts");
// Renders a log event to console.log with optional CSS styles. Styled output
// uses Chrome's %c substitution to colour each segment by namespace and
// level. Plain output is used when useColors is false (e.g. unit tests or
// non-Chromium engines that strip styling).


const Colors = {
  namespace: {
    bootstrap: '#FF6B6B',
    main: '#FF6B6B',
    recorder: '#4ECDC4',
    exporter: '#FFE66D',
    extractor: '#95E1D3',
    storage: '#F38181',
    render: '#AA96DA',
    ui: '#FCBAD3',
    theme: '#FFCCBC',
    i18n: '#B2EBF2'
  },
  level: {
    error: '#FF0000',
    info: '#00BFFF',
    debug: '#90EE90'
  },
  time: '#9B9B9B',
  operation: '#FFFFFF',
  data: '#B0B0B0'
};
class LogFormatter {
  constructor(config) {
    this.config = {
      ...config
    };
  }
  updateConfig(config) {
    this.config = {
      ...config
    };
  }
  output(namespace, operation, level, metadata, timing, options = {}) {
    if (this.config.useColors) {
      this.outputStyled(namespace, operation, level, metadata, timing, options);
    } else {
      this.outputPlain(namespace, operation, level, metadata, timing, options);
    }
  }
  outputStyled(namespace, operation, level, metadata, timing, options) {
    const styles = [];
    const canonicalLevel = (0,_LogLevels__WEBPACK_IMPORTED_MODULE_1__.normalizeLevel)(level) || level;
    const parts = [];
    const nsColor = Colors.namespace[namespace] || '#FFFFFF';
    const paddedNs = this.padNamespace(namespace);
    parts.push('%c[%s]');
    styles.push(`color: ${nsColor}; font-weight: bold;`, paddedNs);
    if (this.config.showTime || this.config.showDelta || this.config.showTotal) {
      const timeParts = [];
      if (this.config.showTime) timeParts.push(_LogClock__WEBPACK_IMPORTED_MODULE_0__.logClock.formatTime());
      if (this.config.showTotal) timeParts.push(`${timing.total.toFixed(1)}ms`);
      if (this.config.showDelta) timeParts.push(`+${timing.delta.toFixed(1)}ms`);
      parts.push('%c[%s]');
      styles.push(`color: ${Colors.time};`, timeParts.join(' | '));
    }
    const notifyFlag = options.notification ? 1 : 0;
    parts.push('%c[Noti: %s]');
    styles.push(`color: ${options.notification ? '#4ECDC4' : '#666'};`, String(notifyFlag));
    const levelColor = Colors.level[canonicalLevel] || '#FFFFFF';
    const isAlertLevel = canonicalLevel === 'error';
    const levelStyle = isAlertLevel ? `background: ${levelColor}; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 3px;` : `color: ${levelColor}; font-weight: bold;`;
    parts.push('%c%s');
    styles.push(levelStyle, String(canonicalLevel || level).toUpperCase());
    if (operation) {
      parts.push('%c%s');
      styles.push(`color: ${Colors.operation}; font-weight: 600;`, operation);
    }
    const dataStr = this.serializeMetadata(metadata);
    if (dataStr) {
      parts.push('%c%s');
      styles.push(`color: ${Colors.data}; font-style: italic;`, dataStr);
    }
    // eslint-disable-next-line no-console
    console.log(parts.join(' '), ...styles);
  }
  outputPlain(namespace, operation, level, metadata, timing, options) {
    const line = this.formatPlain(namespace, operation, level, metadata, timing, options);
    // eslint-disable-next-line no-console
    console.log(line);
  }
  formatPlain(namespace, operation, level, metadata, timing, options) {
    const paddedNs = this.padNamespace(namespace);
    const parts = [`[${paddedNs}]`];
    const canonicalLevel = (0,_LogLevels__WEBPACK_IMPORTED_MODULE_1__.normalizeLevel)(level) || level;
    if (this.config.showTime || this.config.showDelta || this.config.showTotal) {
      const timeParts = [];
      if (this.config.showTime) timeParts.push(_LogClock__WEBPACK_IMPORTED_MODULE_0__.logClock.formatTime());
      if (this.config.showTotal && typeof timing?.total === 'number') {
        timeParts.push(`${timing.total.toFixed(1)}ms`);
      }
      if (this.config.showDelta && typeof timing?.delta === 'number') {
        timeParts.push(`+${timing.delta.toFixed(1)}ms`);
      }
      if (timeParts.length > 0) parts.push(`[${timeParts.join(' | ')}]`);
    }
    const notifyFlag = options.notification ? 1 : 0;
    parts.push(`[Noti: ${notifyFlag}]`);
    parts.push(String(canonicalLevel || level).toUpperCase());
    if (operation) parts.push(operation);
    const dataStr = this.serializeMetadata(metadata);
    return parts.join(' ') + dataStr;
  }
  padNamespace(ns) {
    if (!this.config.alignNamespaces) return ns;
    return ns.padEnd(this.config.namespaceWidth || 10, ' ');
  }
  serializeMetadata(metadata) {
    if (!this.config.showObject || !metadata || Object.keys(metadata).length === 0) {
      return '';
    }
    try {
      const redactKeys = this.config.redactKeys ?? [];
      const redacter = (k, v) => {
        return redactKeys.includes(k) ? '[REDACTED]' : v;
      };
      let s = JSON.stringify(metadata, redacter);
      const maxLen = this.config.objectMaxLen ?? 2000;
      if (s.length > maxLen) s = s.slice(0, maxLen) + '...';
      return ' ' + s;
    } catch {
      return ' [unserializable]';
    }
  }
}

/***/ },

/***/ "./Dev/src/infra/logging/core/LogLevels.ts"
/*!*************************************************!*\
  !*** ./Dev/src/infra/logging/core/LogLevels.ts ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isLevelEnabled: () => (/* binding */ isLevelEnabled),
/* harmony export */   normalizeLevel: () => (/* binding */ normalizeLevel)
/* harmony export */ });
// Log-level vocabulary and gating math. 'debug' is the most verbose, 'error'
// the loudest. A namespace set to 'info' admits info+error but drops debug.
// 'disabled'/'off' mutes the namespace entirely. `warn` is folded into
// `error` so users transitioning from console.warn don't accidentally
// down-rank the alert.
const LOG_LEVELS = ['error', 'info', 'debug'];
const LEVEL_PRIORITY = Object.freeze(LOG_LEVELS.reduce((acc, level, index) => {
  acc[level] = index;
  return acc;
}, Object.create(null)));
const DISABLED_TOKENS = new Set(['disabled', 'off']);
const NORMALIZED_ALIASES = Object.freeze({
  all: 'debug',
  verbose: 'debug',
  trace: 'debug',
  warn: 'error'
});
function normalize(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (DISABLED_TOKENS.has(trimmed)) return 'disabled';
  if (LEVEL_PRIORITY[trimmed] !== undefined) {
    return trimmed;
  }
  if (NORMALIZED_ALIASES[trimmed]) return NORMALIZED_ALIASES[trimmed];
  return null;
}
const normalizeLevel = value => normalize(value);
const isLevelEnabled = (threshold, level) => {
  const normalizedLevel = normalize(level);
  if (!normalizedLevel || normalizedLevel === 'disabled') return false;
  const normalizedThreshold = normalize(threshold);
  if (!normalizedThreshold || normalizedThreshold === 'disabled') return false;
  const thresholdKey = NORMALIZED_ALIASES[normalizedThreshold] ?? normalizedThreshold;
  return LEVEL_PRIORITY[normalizedLevel] <= LEVEL_PRIORITY[thresholdKey];
};

/***/ },

/***/ "./Dev/src/infra/logging/core/LogNamespace.ts"
/*!****************************************************!*\
  !*** ./Dev/src/infra/logging/core/LogNamespace.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createLogNamespace: () => (/* binding */ createLogNamespace)
/* harmony export */ });
// Per-namespace facade returned by LogService.namespace('recorder'). Each
// call site captures the namespace once and uses .info/.warn/.error without
// repeating the namespace string. `span` brackets a synchronous or async
// operation and emits a `.start` debug followed by a `.done` line with the
// elapsed milliseconds — handy for timing capture passes and exports.
function createLogNamespace(name, logService) {
  const log = (level, operation, metadata, options) => logService.log(name, operation, level, metadata, options);
  return {
    error: (operation, metadata = {}, options = {}) => log('error', operation, metadata, options),
    warn: (operation, metadata = {}, options = {}) => log('warn', operation, metadata, options),
    info: (operation, metadata = {}, options = {}) => log('info', operation, metadata, options),
    debug: (operation, metadata = {}, options = {}) => log('debug', operation, metadata, options),
    span(operation, metadata = {}) {
      const startTime = logService.clock.now();
      log('debug', `${operation}.start`, metadata, {});
      return {
        end: (endMetadata = {}, level = 'debug') => {
          const duration = Math.round(logService.clock.now() - startTime);
          log(level, `${operation}.done`, {
            ...endMetadata,
            durationMs: duration
          }, {});
        }
      };
    }
  };
}

/***/ },

/***/ "./Dev/src/infra/logging/core/LogService.ts"
/*!**************************************************!*\
  !*** ./Dev/src/infra/logging/core/LogService.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logService: () => (/* binding */ logService)
/* harmony export */ });
/* harmony import */ var _LogClock__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogClock */ "./Dev/src/infra/logging/core/LogClock.ts");
/* harmony import */ var _LogNamespace__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./LogNamespace */ "./Dev/src/infra/logging/core/LogNamespace.ts");
/* harmony import */ var _outputs_ConsoleOutput__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../outputs/ConsoleOutput */ "./Dev/src/infra/logging/outputs/ConsoleOutput.ts");
/* harmony import */ var _outputs_NotificationOutput__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../outputs/NotificationOutput */ "./Dev/src/infra/logging/outputs/NotificationOutput.ts");
/* harmony import */ var _config_LogConfig__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../config/LogConfig */ "./Dev/src/infra/logging/config/LogConfig.ts");
// Composition root for logging. One LogService instance owns all
// namespaces, a console output, and (optionally) a notification output
// connected via setNotificationPolicy. Modules import the `logService`
// singleton and call `.namespace('recorder')` once at module-load to get
// their dedicated facade.





class LogService {
  constructor(config = _config_LogConfig__WEBPACK_IMPORTED_MODULE_4__.LOG_CONFIG) {
    this.clock = _LogClock__WEBPACK_IMPORTED_MODULE_0__.logClock;
    this.namespaces = new Map();
    this.consoleOutput = new _outputs_ConsoleOutput__WEBPACK_IMPORTED_MODULE_2__.ConsoleOutput({
      ...config.console,
      namespaceLevels: config.namespaceFiltering?.console || {}
    });
    this.notificationConfig = {
      ...config.notifications,
      namespaceLevels: config.namespaceFiltering?.notifications || {}
    };
    this.notificationOutput = null;
  }
  namespace(name) {
    let ns = this.namespaces.get(name);
    if (!ns) {
      ns = (0,_LogNamespace__WEBPACK_IMPORTED_MODULE_1__.createLogNamespace)(name, this);
      this.namespaces.set(name, ns);
    }
    return ns;
  }
  log(namespace, operation, level, metadata = {}, options = {}) {
    const timing = this.clock.stamp();
    const event = {
      namespace,
      operation,
      level,
      metadata,
      options,
      timing
    };
    this.consoleOutput.render(namespace, operation, level, metadata, timing, options);
    if (this.notificationOutput) {
      this.notificationOutput.show(event);
    }
  }
  setNotificationPolicy(policy) {
    if (!policy) return;
    this.notificationOutput = new _outputs_NotificationOutput__WEBPACK_IMPORTED_MODULE_3__.NotificationOutput(this.notificationConfig, policy);
  }
}
const logService = new LogService();

/***/ },

/***/ "./Dev/src/infra/logging/core/outputGate.ts"
/*!**************************************************!*\
  !*** ./Dev/src/infra/logging/core/outputGate.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   resolveLevelGate: () => (/* binding */ resolveLevelGate)
/* harmony export */ });
/* harmony import */ var _LogLevels__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./LogLevels */ "./Dev/src/infra/logging/core/LogLevels.ts");
// Decides whether a (namespace, level) pair should reach a given output.
// The explicit flag wins (so callers can force-show or force-hide a single
// log line); otherwise the per-namespace level table is consulted, falling
// back to the output's default level if no override exists.

function resolveLevelGate(config, namespaceLevels, namespace, level, explicitFlag) {
  const normalizedLevel = (0,_LogLevels__WEBPACK_IMPORTED_MODULE_0__.normalizeLevel)(level);
  if (!normalizedLevel) return false;
  if (explicitFlag === false) return false;
  if (explicitFlag === true) return true;
  if (!config.enabled) return false;
  const nsLevel = namespaceLevels[namespace] ?? config.defaultLevel;
  return (0,_LogLevels__WEBPACK_IMPORTED_MODULE_0__.isLevelEnabled)(nsLevel, normalizedLevel);
}

/***/ },

/***/ "./Dev/src/infra/logging/notifications/NotificationPolicy.ts"
/*!*******************************************************************!*\
  !*** ./Dev/src/infra/logging/notifications/NotificationPolicy.ts ***!
  \*******************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NotificationPolicy: () => (/* binding */ NotificationPolicy),
/* harmony export */   notificationPolicy: () => (/* binding */ notificationPolicy)
/* harmony export */ });
/* harmony import */ var _config_LogConfig__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config/LogConfig */ "./Dev/src/infra/logging/config/LogConfig.ts");
/* harmony import */ var _core_LogLevels__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/LogLevels */ "./Dev/src/infra/logging/core/LogLevels.ts");
// Decides whether a log event should surface as a user-facing toast and how
// it should look (type, duration). The policy is consulted twice:
//   1. NotificationOutput gates by namespace/level first (the cheap pass).
//   2. This class then walks the `rules` list for fine-grained matches and
//      dedupes by a (ns|level|op|message) key within windowMs.
//
// Wiring is done in two steps: serviceFactory calls setHandler(toast.show)
// after the Toast queue is created. Until then, log events with notification
// metadata are dropped silently — by design, so early-boot errors don't try
// to render before the UI exists.


class NotificationPolicy {
  constructor(config = _config_LogConfig__WEBPACK_IMPORTED_MODULE_0__.LOG_CONFIG.notifications) {
    this.config = config;
    this.handler = null;
    this.recentKeys = new Map();
  }
  setHandler(fn) {
    this.handler = typeof fn === 'function' ? fn : null;
  }
  shouldShow(namespace, operation, level, metadata = {}, options = {}) {
    const notifyFlag = options.notification ?? metadata.notification;
    if (notifyFlag === true) return true;
    if (notifyFlag === false) return false;
    if (!this.config.enabled) return false;
    const canonicalLevel = (0,_core_LogLevels__WEBPACK_IMPORTED_MODULE_1__.normalizeLevel)(level);
    if (!canonicalLevel || canonicalLevel === 'disabled') return false;
    const rules = this.config.rules || [];
    if (rules.length === 0) return false;
    return rules.some(rule => {
      if (rule.ns && rule.ns !== namespace) return false;
      if (rule.level) {
        const ruleLevel = (0,_core_LogLevels__WEBPACK_IMPORTED_MODULE_1__.normalizeLevel)(rule.level);
        if (!ruleLevel || ruleLevel !== canonicalLevel) return false;
      }
      if (rule.op) {
        if (typeof rule.op === 'string') {
          return operation?.includes(rule.op);
        }
        if (rule.op instanceof RegExp) {
          return rule.op.test(operation || '');
        }
      }
      return true;
    });
  }
  show(event) {
    const {
      namespace,
      operation,
      level,
      metadata = {},
      options = {}
    } = event;
    const canonicalLevel = (0,_core_LogLevels__WEBPACK_IMPORTED_MODULE_1__.normalizeLevel)(level);
    if (!canonicalLevel || canonicalLevel === 'disabled') return false;
    if (!this.shouldShow(namespace, operation, level, metadata, options)) return false;
    const message = this.resolveMessage(metadata, operation);
    if (!message) return false;
    if (this.config.deduplication?.enabled) {
      const key = `${namespace}|${canonicalLevel}|${operation}|${message}`;
      const now = typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
      const last = this.recentKeys.get(key) || 0;
      const windowMs = this.config.deduplication.windowMs || 0;
      if (now - last < windowMs) return false;
      this.recentKeys.set(key, now);
    }
    const type = this.resolveType(canonicalLevel, metadata, options);
    const duration = this.resolveDuration(canonicalLevel, metadata, options);
    if (!this.handler) return false;
    try {
      this.handler(message, type, duration);
      return true;
    } catch (error) {
      console.error('[NotificationPolicy] Handler error:', error);
      return false;
    }
  }
  resolveMessage(metadata, operation) {
    if (typeof metadata === 'string' && metadata.trim()) {
      return metadata.trim();
    }
    if (metadata && typeof metadata === 'object') {
      const m = metadata;
      if (typeof m.message === 'string' && m.message.trim()) return m.message.trim();
      if (typeof m.text === 'string' && m.text.trim()) return m.text.trim();
    }
    if (typeof operation === 'string' && operation.trim()) return operation.trim();
    return '';
  }
  resolveType(level, metadata, options) {
    const fromOptions = options?.type;
    if (typeof fromOptions === 'string' && fromOptions.trim()) {
      return fromOptions.trim();
    }
    const fromMeta = metadata?.type;
    if (typeof fromMeta === 'string' && fromMeta.trim()) {
      return fromMeta.trim();
    }
    if (level === 'error') return 'error';
    if (level === 'warn') return 'warning';
    return 'info';
  }
  resolveDuration(level, metadata, options) {
    const fromOptions = options?.duration;
    if (typeof fromOptions === 'number' && Number.isFinite(fromOptions)) return fromOptions;
    const fromMeta = metadata?.duration;
    if (typeof fromMeta === 'number' && Number.isFinite(fromMeta)) return fromMeta;
    const behavior = this.config.behavior || {
      duration: 3000,
      durationByLevel: {}
    };
    const byLevel = behavior.durationByLevel?.[level];
    if (typeof byLevel === 'number' && Number.isFinite(byLevel)) return byLevel;
    if (typeof behavior.duration === 'number' && Number.isFinite(behavior.duration)) {
      return behavior.duration;
    }
    return 3000;
  }
}
const notificationPolicy = new NotificationPolicy();

/***/ },

/***/ "./Dev/src/infra/logging/outputs/ConsoleOutput.ts"
/*!********************************************************!*\
  !*** ./Dev/src/infra/logging/outputs/ConsoleOutput.ts ***!
  \********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ConsoleOutput: () => (/* binding */ ConsoleOutput)
/* harmony export */ });
/* harmony import */ var _core_LogFormatter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/LogFormatter */ "./Dev/src/infra/logging/core/LogFormatter.ts");
/* harmony import */ var _core_outputGate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/outputGate */ "./Dev/src/infra/logging/core/outputGate.ts");
// Routes log events to console.log via LogFormatter, gated by the
// per-namespace level table. Each LogService instance owns one
// ConsoleOutput; replacing the config requires re-instantiation.


class ConsoleOutput {
  constructor(config) {
    this.config = {
      ...config
    };
    this.namespaceLevels = {
      ...(config.namespaceLevels || {})
    };
    this.formatter = new _core_LogFormatter__WEBPACK_IMPORTED_MODULE_0__.LogFormatter({
      ...config
    });
  }
  render(namespace, operation, level, metadata, timing, options = {}) {
    if (!(0,_core_outputGate__WEBPACK_IMPORTED_MODULE_1__.resolveLevelGate)(this.config, this.namespaceLevels, namespace, level, options.console)) {
      return;
    }
    this.formatter.output(namespace, operation, level, metadata, timing, options);
  }
}

/***/ },

/***/ "./Dev/src/infra/logging/outputs/NotificationOutput.ts"
/*!*************************************************************!*\
  !*** ./Dev/src/infra/logging/outputs/NotificationOutput.ts ***!
  \*************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NotificationOutput: () => (/* binding */ NotificationOutput)
/* harmony export */ });
/* harmony import */ var _core_outputGate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/outputGate */ "./Dev/src/infra/logging/core/outputGate.ts");
// Bridge between LogService and the NotificationPolicy. Each log event is
// gated by the namespace/level table before being handed to the policy,
// which does its own pattern matching and dedup. The actual UI rendering
// is performed by whatever handler the policy points at (typically the
// Toast queue, wired in serviceFactory).

class NotificationOutput {
  constructor(config, notificationPolicy) {
    this.config = {
      ...config
    };
    this.manager = notificationPolicy;
    this.namespaceLevels = {
      ...(config.namespaceLevels || {})
    };
  }
  show(event) {
    const explicit = event.options?.notification;
    if (!(0,_core_outputGate__WEBPACK_IMPORTED_MODULE_0__.resolveLevelGate)(this.config, this.namespaceLevels, event.namespace, event.level, explicit)) {
      return false;
    }
    return this.manager.show(event);
  }
}

/***/ },

/***/ "./Dev/src/infra/storage/config/storageConfig.ts"
/*!*******************************************************!*\
  !*** ./Dev/src/infra/storage/config/storageConfig.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STORAGE_CONFIG: () => (/* binding */ STORAGE_CONFIG)
/* harmony export */ });
// Storage policy config. Currently just toggles around persistence dedup —
// kept as its own module so future tunables (per-key TTLs, separate
// namespaces) have a home that doesn't bloat the operator.
const STORAGE_CONFIG = {
  // Skip persist when a write produces the same serialized form as the
  // last persisted value. Disable for debugging.
  deduplicate: true,
  // Coalesce writes to the same key within this window into a single
  // GM_setValue call. 0 = synchronous (no coalescing).
  saveDelayMs: 0
};

/***/ },

/***/ "./Dev/src/infra/storage/core/hashing.ts"
/*!***********************************************!*\
  !*** ./Dev/src/infra/storage/core/hashing.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createHashManager: () => (/* binding */ createHashManager)
/* harmony export */ });
// Lightweight content-fingerprint cache. Each storage key maps to the hash
// of its last persisted value; before writing, the operator hashes the new
// serialised form and skips the write if unchanged. This matters when the
// same settings object is patched multiple times in a frame — without it,
// GM_setValue gets called once per patch even when nothing changes.
function simpleHash(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // force 32-bit integer
  }
  return hash;
}
function createHashManager() {
  const hashCache = new Map();
  return {
    computeHash(data) {
      if (typeof data !== 'string') {
        throw new TypeError('Hash input must be a string');
      }
      return simpleHash(data);
    },
    hasChanged(key, data) {
      const currentHash = simpleHash(data);
      const lastHash = hashCache.get(key);
      if (lastHash === undefined) return true;
      return currentHash !== lastHash;
    },
    updateHash(key, hashOrData) {
      const hash = typeof hashOrData === 'number' ? hashOrData : simpleHash(hashOrData);
      hashCache.set(key, hash);
    },
    getHash(key) {
      return hashCache.get(key);
    },
    clearHash(key) {
      return hashCache.delete(key);
    },
    clearAllHashes() {
      hashCache.clear();
    }
  };
}

/***/ },

/***/ "./Dev/src/infra/storage/core/persistence.ts"
/*!***************************************************!*\
  !*** ./Dev/src/infra/storage/core/persistence.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createPersistenceAdapter: () => (/* binding */ createPersistenceAdapter)
/* harmony export */ });
// Persistence adapter. GM_setValue is the canonical store (Tampermonkey
// syncs across devices and survives cross-origin), but it isn't guaranteed
// when @grant is missing or when running under Violentmonkey's pageContext
// injection — so we dual-write to localStorage as a fallback. Reads prefer
// GM first, then fall back to localStorage. hasGM is detected once at
// construction time so we don't pay the typeof cost on every read.
function createPersistenceAdapter(deps = {}) {
  const hasGM = deps.hasGM ?? (typeof GM_getValue === 'function' && typeof GM_setValue === 'function');
  return {
    get(key, fallback) {
      try {
        if (hasGM) {
          const v = GM_getValue(key, undefined);
          if (v !== undefined) return v;
        }
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        if (hasGM) GM_setValue(key, value);
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
      } catch {
        // non-critical: storage is best-effort under hostile @grants
      }
    },
    setSerialized(key, serialized, value) {
      try {
        if (hasGM) GM_setValue(key, value);
        localStorage.setItem(key, serialized);
      } catch {
        // non-critical
      }
    },
    del(key) {
      try {
        if (hasGM && typeof GM_deleteValue === 'function') GM_deleteValue(key);
        localStorage.removeItem(key);
      } catch {
        // non-critical
      }
    }
  };
}

/***/ },

/***/ "./Dev/src/infra/storage/events/eventEmitter.ts"
/*!******************************************************!*\
  !*** ./Dev/src/infra/storage/events/eventEmitter.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createEventEmitter: () => (/* binding */ createEventEmitter)
/* harmony export */ });
/* harmony import */ var _logging_core_LogService__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../logging/core/LogService */ "./Dev/src/infra/logging/core/LogService.ts");
// Per-key change notifier. Modules subscribe to a single key (e.g.
// 'theme') and receive the new value on every write. Cheaper and more
// targeted than going through the global Bus for settings updates — the
// dock's theme button, for instance, only needs to redraw when the theme
// changes, not on every state:changed event.

const log = _logging_core_LogService__WEBPACK_IMPORTED_MODULE_0__.logService.namespace('storage');
function createEventEmitter() {
  const listeners = new Map();
  return {
    subscribe(key, callback) {
      if (!key || typeof callback !== 'function') {
        throw new TypeError('subscribe requires a key and callback function');
      }
      let keyListeners = listeners.get(key);
      if (!keyListeners) {
        keyListeners = new Set();
        listeners.set(key, keyListeners);
      }
      keyListeners.add(callback);
      return () => {
        const set = listeners.get(key);
        if (!set) return;
        set.delete(callback);
        if (set.size === 0) listeners.delete(key);
      };
    },
    emit(key, value) {
      const keyListeners = listeners.get(key);
      if (!keyListeners) return;
      keyListeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          const e = error;
          log.error('eventEmitter.listenerError', {
            key,
            message: e?.message || String(error),
            stack: e?.stack
          });
        }
      });
    }
  };
}

/***/ },

/***/ "./Dev/src/infra/storage/storageOperator.ts"
/*!**************************************************!*\
  !*** ./Dev/src/infra/storage/storageOperator.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createStorageOperator: () => (/* binding */ createStorageOperator),
/* harmony export */   storageOP: () => (/* binding */ storageOP)
/* harmony export */ });
/* harmony import */ var _core_persistence__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/persistence */ "./Dev/src/infra/storage/core/persistence.ts");
/* harmony import */ var _core_hashing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core/hashing */ "./Dev/src/infra/storage/core/hashing.ts");
/* harmony import */ var _events_eventEmitter__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/eventEmitter */ "./Dev/src/infra/storage/events/eventEmitter.ts");
/* harmony import */ var _utils_equality__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/equality */ "./Dev/src/infra/storage/utils/equality.ts");
/* harmony import */ var _config_storageConfig__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./config/storageConfig */ "./Dev/src/infra/storage/config/storageConfig.ts");
/* harmony import */ var _logging_core_LogService__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../logging/core/LogService */ "./Dev/src/infra/logging/core/LogService.ts");
// Top-level storage facade. Mirrors AmexOfferMax's storageOperator shape:
// get/set/del + subscribe + change-detection. The hash + deep-equality
// double-guard means a settings tab that writes the same value on every
// render won't trip GM_setValue (which on Tampermonkey can otherwise
// trigger a sync round-trip).
//
// Singleton export `storageOP` is what every module imports. The factory
// `createStorageOperator()` is preserved for tests that need an isolated
// instance.






function createStorageOperator(deps = {}) {
  const persistence = deps.persistence ?? (0,_core_persistence__WEBPACK_IMPORTED_MODULE_0__.createPersistenceAdapter)();
  const hashManager = deps.hashManager ?? (0,_core_hashing__WEBPACK_IMPORTED_MODULE_1__.createHashManager)();
  const emitter = deps.emitter ?? (0,_events_eventEmitter__WEBPACK_IMPORTED_MODULE_2__.createEventEmitter)();
  const log = _logging_core_LogService__WEBPACK_IMPORTED_MODULE_5__.logService.namespace('storage');
  // Last-known cached values for the dedup check. Populated on first read
  // and updated on every successful set, so consecutive set(k, v) calls
  // with the same v are O(1).
  const cache = new Map();
  const saveTimers = new Map();
  function flushPersist(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (_config_storageConfig__WEBPACK_IMPORTED_MODULE_4__.STORAGE_CONFIG.deduplicate && !hashManager.hasChanged(key, serialized)) {
        return;
      }
      hashManager.updateHash(key, serialized);
      persistence.setSerialized(key, serialized, value);
    } catch (err) {
      const e = err;
      log.warn('persist.failed', {
        key,
        message: e?.message || String(err)
      });
      // Fall back to plain set so we still write something.
      persistence.set(key, value);
    }
  }
  function scheduleSave(key, value) {
    if (_config_storageConfig__WEBPACK_IMPORTED_MODULE_4__.STORAGE_CONFIG.saveDelayMs <= 0) {
      flushPersist(key, value);
      return;
    }
    const existing = saveTimers.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      saveTimers.delete(key);
      flushPersist(key, value);
    }, _config_storageConfig__WEBPACK_IMPORTED_MODULE_4__.STORAGE_CONFIG.saveDelayMs);
    saveTimers.set(key, timer);
  }
  return {
    get(key, fallback) {
      if (cache.has(key)) return cache.get(key);
      const value = persistence.get(key, fallback);
      cache.set(key, value);
      return value;
    },
    set(key, value) {
      const prev = cache.has(key) ? cache.get(key) : persistence.get(key, undefined);
      if (_config_storageConfig__WEBPACK_IMPORTED_MODULE_4__.STORAGE_CONFIG.deduplicate && (0,_utils_equality__WEBPACK_IMPORTED_MODULE_3__.isEqual)(prev, value)) return false;
      cache.set(key, value);
      scheduleSave(key, value);
      emitter.emit(key, value);
      return true;
    },
    del(key) {
      cache.delete(key);
      hashManager.clearHash(key);
      const pending = saveTimers.get(key);
      if (pending) {
        clearTimeout(pending);
        saveTimers.delete(key);
      }
      persistence.del(key);
      emitter.emit(key, undefined);
    },
    subscribe(key, listener) {
      return emitter.subscribe(key, listener);
    },
    has(key) {
      if (cache.has(key)) return cache.get(key) !== undefined;
      return persistence.get(key, undefined) !== undefined;
    }
  };
}
const storageOP = createStorageOperator();

/***/ },

/***/ "./Dev/src/infra/storage/utils/equality.ts"
/*!*************************************************!*\
  !*** ./Dev/src/infra/storage/utils/equality.ts ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isEqual: () => (/* binding */ isEqual)
/* harmony export */ });
// Deep structural equality. Used by the storage operator to skip a persist
// when a write doesn't actually change the stored value (cheap guard in
// front of the hash table). Recursive but bounded by the input shape;
// Maps/Sets and class instances are compared by reference, which matches
// our usage — only plain JSON-ish values pass through Storage.
function isEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => isEqual(val, b[i]));
  }
  const aObj = a;
  const bObj = b;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => keysB.includes(key) && isEqual(aObj[key], bObj[key]));
}

/***/ },

/***/ "./Dev/src/recorder/autoScroll.ts"
/*!****************************************!*\
  !*** ./Dev/src/recorder/autoScroll.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AutoScroll: () => (/* binding */ AutoScroll),
/* harmony export */   isRunning: () => (/* binding */ isRunning),
/* harmony export */   start: () => (/* binding */ start),
/* harmony export */   stop: () => (/* binding */ stop)
/* harmony export */ });
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/eventBus */ "./Dev/src/core/eventBus.ts");
// Auto-scroll loop. Runs alongside the recorder, advancing the viewport in
// chunks so Discourse's virtual scroller hydrates the next batch of posts.
//
// Termination logic, in order of priority:
//   1. Recorder stopped / autoScroll explicitly stopped → exit immediately.
//   2. Reached the document bottom AND post count didn't change for the
//      last two ticks → assume thread fully captured.
//   3. Hit MAX_TICKS (safety cap so a misbehaving page can't loop forever).
//
// Pause behaviour mirrors the recorder: while Store.state.paused we keep the
// loop alive but skip the scroll step, so resuming continues from the same
// position instead of restarting.


const STEP_RATIO = 0.85; // fraction of viewport height to advance per tick
const TICK_MS = 750; // wait between scrolls — gives the SPA time to hydrate
const MAX_TICKS = 2000; // hard cap on iterations (~25 min @ 750ms)
const STALL_LIMIT = 4; // consecutive no-progress ticks before giving up
let running = false;
let timer = null;
function atBottom() {
  const doc = document.documentElement;
  return doc.scrollTop + window.innerHeight >= doc.scrollHeight - 8;
}
function scrollStep() {
  const delta = Math.max(200, Math.floor(window.innerHeight * STEP_RATIO));
  window.scrollBy({
    top: delta,
    behavior: 'auto'
  });
}
function start() {
  if (running) return;
  running = true;
  _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('autoscroll:started', undefined);
  let ticks = 0;
  let stallTicks = 0;
  let lastCount = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.counts().posts + _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.counts().chunks;
  const loop = () => {
    if (!running || !_core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.recording) {
      stop();
      return;
    }
    if (_core_store__WEBPACK_IMPORTED_MODULE_0__.Store.state.paused) {
      timer = setTimeout(loop, TICK_MS);
      return;
    }
    scrollStep();
    ticks++;
    timer = setTimeout(() => {
      const nowCount = _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.counts().posts + _core_store__WEBPACK_IMPORTED_MODULE_0__.Store.counts().chunks;
      if (nowCount > lastCount) {
        stallTicks = 0;
        lastCount = nowCount;
      } else if (atBottom()) {
        stallTicks++;
      }
      if (ticks >= MAX_TICKS) {
        stop('max');
        return;
      }
      if (atBottom() && stallTicks >= STALL_LIMIT) {
        stop('end');
        return;
      }
      loop();
    }, TICK_MS);
  };
  loop();
}
function stop(reason = 'manual') {
  if (!running) return;
  running = false;
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
  _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.emit('autoscroll:stopped', {
    reason
  });
}
function isRunning() {
  return running;
}
const AutoScroll = {
  start,
  stop,
  isRunning
};

/***/ },

/***/ "./Dev/src/recorder/recorder.ts"
/*!**************************************!*\
  !*** ./Dev/src/recorder/recorder.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Recorder: () => (/* binding */ Recorder)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _extractor_discourse__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../extractor/discourse */ "./Dev/src/extractor/discourse.ts");
/* harmony import */ var _extractor_discourseApi__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../extractor/discourseApi */ "./Dev/src/extractor/discourseApi.ts");
/* harmony import */ var _autoScroll__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./autoScroll */ "./Dev/src/recorder/autoScroll.ts");
/* harmony import */ var _exporter_exporter__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../exporter/exporter */ "./Dev/src/exporter/exporter.ts");
/* harmony import */ var _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../infra/logging/core/LogService */ "./Dev/src/infra/logging/core/LogService.ts");
// Recording orchestration. Two capture modes:
//
//   discourse  — seed from preloaded JSON, then watch .post-stream for new
//                posts via MutationObserver, plus a throttled scroll handler
//                because Discourse's virtual scroller can swap posts without
//                emitting a useful mutation we'd otherwise miss.
//
//   generic    — visit every textual block as it enters the viewport (used
//                when isDiscoursePage() is false, or as a fallback). Each
//                block is keyed by tag + leading text + length for cheap
//                dedup.
//
// Both modes write into Store.state and emit 'capture:tick' so the dock
// re-renders. Pause/resume keeps the observers attached but short-circuits
// the capture functions, so re-arming is instant.








const log = _infra_logging_core_LogService__WEBPACK_IMPORTED_MODULE_7__.logService.namespace('recorder');
let scrollHandler = null;
let ioObserver = null;
let mutObserver = null;
let captureScheduled = false;
let scrollScheduled = false;
// Owned by start() while an API capture is in flight; cleared by the
// captureAll .finally. stop() aborts via this so cancellation propagates
// through AbortSignal — the task system uses the same signal to drive
// its cancel button.
let captureController = null;
function recomputeImageCount() {
  let total = 0;
  for (const p of _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.values()) total += p.images.length;
  for (const c of _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks) total += c.images.length;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    imageCount: total
  });
}
function captureDiscourseNow() {
  if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording || _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.paused) return;
  const articles = document.querySelectorAll('article[id^="post_"]');
  let changed = 0;
  for (const article of Array.from(articles)) {
    const data = (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_3__.extractPostData)(article);
    if (!data.postNumber) continue;
    const existing = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.get(data.postNumber);
    if (!existing || data.text && data.text.length > (existing.text ?? '').length) {
      _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.set(data.postNumber, data);
      changed++;
    }
  }
  if (changed > 0) {
    _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.lastCapturedAt = new Date();
    recomputeImageCount();
    _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('capture:tick', {
      added: changed
    });
  }
}
function startDiscourse() {
  const seeded = (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_3__.seedFromPreloaded)();
  captureDiscourseNow();
  if (seeded > 0) {
    _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.lastCapturedAt = new Date();
    recomputeImageCount();
  }
  const target = document.querySelector('.post-stream') ?? document.body;
  mutObserver = new MutationObserver(() => {
    if (captureScheduled) return;
    captureScheduled = true;
    setTimeout(() => {
      captureScheduled = false;
      captureDiscourseNow();
    }, 180);
  });
  mutObserver.observe(target, {
    childList: true,
    subtree: true
  });
  scrollHandler = () => {
    if (scrollScheduled) return;
    scrollScheduled = true;
    setTimeout(() => {
      scrollScheduled = false;
      captureDiscourseNow();
    }, 280);
  };
  window.addEventListener('scroll', scrollHandler, {
    passive: true
  });
}
function startGeneric() {
  const BLOCK_SELECTOR = 'p, li, h1, h2, h3, h4, h5, h6, blockquote, pre, td, dd, figcaption, article, section, .cooked, .post-body';
  const visit = el => {
    if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording || _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.paused) return;
    if (!el || el.closest(`#${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID}`)) return;
    const text = (el.innerText ?? el.textContent ?? '').trim();
    if (!text || text.length < 2) return;
    const key = `${el.tagName}:${text.slice(0, 80)}:${text.length}`;
    if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.seenGenericKeys.has(key)) return;
    _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.seenGenericKeys.add(key);
    const images = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('captureImages') ? Array.from(el.querySelectorAll('img')).map(img => img.getAttribute('data-src') ?? img.getAttribute('src') ?? '').filter(Boolean) : [];
    const chunk = {
      tag: el.tagName.toLowerCase(),
      text,
      images,
      ts: new Date().toISOString()
    };
    _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks.push(chunk);
    _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.lastCapturedAt = new Date();
    recomputeImageCount();
    _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('capture:tick', {
      added: 1
    });
  };
  ioObserver = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) visit(e.target);
  }, {
    threshold: 0.1
  });
  for (const el of Array.from(document.querySelectorAll(BLOCK_SELECTOR))) {
    ioObserver.observe(el);
  }
  mutObserver = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of Array.from(m.addedNodes)) {
        if (n.nodeType !== 1) continue;
        const el = n;
        if (el.matches?.(BLOCK_SELECTOR)) ioObserver?.observe(el);
        el.querySelectorAll?.(BLOCK_SELECTOR).forEach(sub => ioObserver?.observe(sub));
      }
    }
  });
  mutObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}
function teardown() {
  mutObserver?.disconnect();
  mutObserver = null;
  ioObserver?.disconnect();
  ioObserver = null;
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    scrollHandler = null;
  }
}
function start() {
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) return;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.topicMeta = (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_3__.getTopicMeta)();
  const mode = (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_3__.isDiscoursePage)() ? 'discourse' : 'generic';
  const startedAt = new Date();
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    recording: true,
    paused: false,
    mode,
    startedAt,
    pausedAt: null,
    totalPausedMs: 0,
    // Freeze the session prefix at start so every export from this run
    // uses the same {date}_{title} regardless of later title edits.
    sessionSlug: (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_6__.buildSessionSlug)(_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.topicMeta?.title ?? '', startedAt)
  });
  if (mode === 'discourse') startDiscourse();else startGeneric();
  _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('recorder:started', {
    mode
  });
  // Capture strategy:
  //   - 'api'    : skip scroll, hit Discourse JSON endpoints directly.
  //                Only meaningful in Discourse mode; falls back to scroll
  //                on generic pages.
  //   - 'scroll' : keep the existing AutoScroll behaviour, gated by the
  //                user's 'autoScroll' toggle.
  const strategy = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('captureStrategy');
  if (strategy === 'api' && mode === 'discourse') {
    captureController = new AbortController();
    const controller = captureController;
    // Defer one tick so the dock paints the "recording" state before we
    // start hammering the API.
    setTimeout(() => {
      void _extractor_discourseApi__WEBPACK_IMPORTED_MODULE_4__.DiscourseApi.captureAll({
        signal: controller.signal
      }).catch(err => {
        const e = err;
        log.error('api.capture.failed', {
          message: e?.message || String(err)
        });
      }).finally(() => {
        if (captureController === controller) captureController = null;
      });
    }, 200);
  } else if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('autoScroll')) {
    setTimeout(() => _autoScroll__WEBPACK_IMPORTED_MODULE_5__.AutoScroll.start(), 400);
  }
}
function stop() {
  if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) return;
  _autoScroll__WEBPACK_IMPORTED_MODULE_5__.AutoScroll.stop();
  // Cancel the in-flight API capture via its AbortController. captureAll's
  // own signal listener emits apicapture:stopped immediately so autoSession
  // / autoSaveOnComplete don't have to wait for the in-flight fetch to settle.
  captureController?.abort();
  captureController = null;
  teardown();
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    recording: false,
    paused: false
  });
  _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('recorder:stopped', undefined);
}
function pause() {
  if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording || _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.paused) return;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    paused: true,
    pausedAt: new Date()
  });
  _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('recorder:paused', undefined);
}
function resume() {
  if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording || !_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.paused) return;
  const now = Date.now();
  const pausedSince = _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.pausedAt ? _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.pausedAt.getTime() : now;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.totalPausedMs += now - pausedSince;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    paused: false,
    pausedAt: null
  });
  _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('recorder:resumed', undefined);
}
function clear() {
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) stop();
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.posts.clear();
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.genericChunks.length = 0;
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.seenGenericKeys.clear();
  _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.patch({
    topicMeta: null,
    startedAt: null,
    pausedAt: null,
    totalPausedMs: 0,
    lastCapturedAt: null,
    imageCount: 0,
    mode: 'idle',
    sessionSlug: null
  });
  _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('recorder:cleared', undefined);
}
// One-click "Auto Record & Save": starts a fresh session, waits for the
// capture pass to complete (AutoScroll end OR API done), exports, then
// stops. autoSessionPending guards against double-clicks while a session is
// in flight.
let autoSessionPending = false;
async function autoSession() {
  if (autoSessionPending) return;
  if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) stop();
  autoSessionPending = true;
  const complete = new Promise(resolve => {
    const offComplete = _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.on('capture:complete', () => {
      offComplete();
      offStopped();
      resolve();
    });
    // recorder:stopped fires if the user manually stops mid-session;
    // resolve too so the chain unwinds cleanly instead of hanging.
    const offStopped = _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.on('recorder:stopped', () => {
      offComplete();
      offStopped();
      resolve();
    });
  });
  start();
  await complete;
  try {
    await (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_6__.exportPreferred)();
  } catch (err) {
    const e = err;
    log.error('autoSession.export.failed', {
      message: e?.message || String(err)
    });
  } finally {
    if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) stop();
    autoSessionPending = false;
  }
}
// Bridge AutoScroll's terminal 'end' reason to the unified capture:complete
// signal so consumers (autoSession, autoSaveOnComplete) only need to listen
// to one channel.
_core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.on('autoscroll:stopped', p => {
  if (p.reason === 'end') _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.emit('capture:complete', {
    reason: 'autoscroll'
  });
});
// On API capture failure, terminate the recorder. Without this the session
// hangs (no observers fire because the API path skips them), leaving
// autoSession waiting on capture:complete forever and the dock stuck in
// "recording" state. The user-facing "switch to scroll mode" toast is
// emitted by the dock listener, not here.
_core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.on('apicapture:stopped', p => {
  if (p.reason === 'error' && _core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) stop();
});
// Honour the autoSaveOnComplete setting whenever a normal (non-autoSession)
// run completes its capture pass. autoSession runs its own export, so we
// skip this branch while one is in flight. The export's success or failure
// surfaces in the Activity Panel as a task card; we just need to log here so
// debug telemetry isn't blind to the failure.
_core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus.on('capture:complete', () => {
  if (autoSessionPending) return;
  if (!_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.get('autoSaveOnComplete')) return;
  void Promise.resolve((0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_6__.exportPreferred)()).catch(err => {
    const e = err;
    log.error('autoSave.export.failed', {
      message: e?.message || String(err)
    });
  }).finally(() => {
    if (_core_store__WEBPACK_IMPORTED_MODULE_1__.Store.state.recording) stop();
  });
});
const Recorder = {
  start,
  stop,
  pause,
  resume,
  clear,
  autoSession
};

/***/ },

/***/ "./Dev/src/ui/components/Button.ts"
/*!*****************************************!*\
  !*** ./Dev/src/ui/components/Button.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createButton: () => (/* binding */ createButton)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./IconManager */ "./Dev/src/ui/components/IconManager.ts");
// Button factory. Returns the HTMLButtonElement plus a small object of
// imperatives (`setLabel`, `setDisabled`, etc.) so callers can update one
// without re-rendering the whole tree.



function classFor(variant, fullWidth) {
  const parts = [`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn`];
  if (variant === 'primary') parts.push(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary`);
  if (variant === 'danger') parts.push(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger`);
  if (fullWidth) parts.push(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-full`);
  return parts.join(' ');
}
function renderBody(label, icon) {
  const iconHtml = icon ? _IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible(icon) : '';
  // Wrap label in a span so callers can set textContent on a specific node
  // and skip re-parsing the icon.
  return `${iconHtml}<span class="${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-label">${escapeHtml(label)}</span>`;
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function createButton(config) {
  const variant = config.variant ?? 'default';
  let currentIcon = config.icon ?? null;
  let currentLabel = config.label;
  const button = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
    class: classFor(variant, config.fullWidth),
    type: 'button',
    title: config.title ?? config.label,
    'aria-label': config.ariaLabel ?? config.label,
    html: renderBody(currentLabel, currentIcon),
    disabled: config.disabled ? 'true' : false,
    onclick: config.onClick
  });
  if (config.disabled) button.disabled = true;
  const labelSpan = button.querySelector(`.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-label`);
  return {
    element: button,
    setLabel(label) {
      if (label === currentLabel) return;
      currentLabel = label;
      if (labelSpan) labelSpan.textContent = label;else button.innerHTML = renderBody(label, currentIcon);
    },
    setIcon(icon) {
      if (icon === currentIcon) return;
      currentIcon = icon;
      button.innerHTML = renderBody(currentLabel, currentIcon);
    },
    setDisabled(disabled) {
      button.disabled = disabled;
    }
  };
}

/***/ },

/***/ "./Dev/src/ui/components/Dock.ts"
/*!***************************************!*\
  !*** ./Dev/src/ui/components/Dock.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createDock: () => (/* binding */ createDock)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _core_taskRegistry__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../core/taskRegistry */ "./Dev/src/core/taskRegistry.ts");
/* harmony import */ var _Toast__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Toast */ "./Dev/src/ui/components/Toast.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./IconManager */ "./Dev/src/ui/components/IconManager.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _utils_rimLighting__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/rimLighting */ "./Dev/src/ui/utils/rimLighting.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../events */ "./Dev/src/ui/events.ts");
/* harmony import */ var _Tabs__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./Tabs */ "./Dev/src/ui/components/Tabs.ts");
/* harmony import */ var _tabs_CaptureTab__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./tabs/CaptureTab */ "./Dev/src/ui/components/tabs/CaptureTab.ts");
/* harmony import */ var _tabs_ExportTab__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./tabs/ExportTab */ "./Dev/src/ui/components/tabs/ExportTab.ts");
/* harmony import */ var _tabs_SettingsTab__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./tabs/SettingsTab */ "./Dev/src/ui/components/tabs/SettingsTab.ts");
/* harmony import */ var _activity_ActivityPanel__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./activity/ActivityPanel */ "./Dev/src/ui/components/activity/ActivityPanel.ts");
/* harmony import */ var _exporter_imageRetry__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../../exporter/imageRetry */ "./Dev/src/exporter/imageRetry.ts");
/* harmony import */ var _exporter_exporter__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../../exporter/exporter */ "./Dev/src/exporter/exporter.ts");
// The main floating panel. Hosts a header (drag handle, status, minimize)
// followed by a 3-tab strip (Capture / Export / Settings) and the active tab
// panel underneath. Footer prints the version and elapsed time.
//
// Drag: pointer-driven absolute positioning, persisted under STORAGE_KEYS.dockPos.
// Snap-to-edge: if released within 24px of right/bottom, anchor to that edge.

















function createDock(deps) {
  const {
    i18n
  } = deps;
  let refs = null;
  let captureTab = null;
  let exportTab = null;
  let settingsTab = null;
  let activityPanel = null;
  let tabs = null;
  let elapsedTimer = null;
  let dragOffset = null;
  function ensureRoot() {
    let root = document.getElementById(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID);
    if (!root) {
      root = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
        id: _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID
      });
      document.body.appendChild(root);
    }
    return root;
  }
  function applyPos(pos) {
    if (!refs) return;
    const d = refs.dock;
    if (pos.left != null) {
      d.style.left = `${pos.left}px`;
      d.style.right = 'auto';
    }
    if (pos.right != null) {
      d.style.right = `${pos.right}px`;
      d.style.left = 'auto';
    }
    if (pos.top != null) {
      d.style.top = `${pos.top}px`;
      d.style.bottom = 'auto';
    }
    if (pos.bottom != null) {
      d.style.bottom = `${pos.bottom}px`;
      d.style.top = 'auto';
    }
  }
  function attachDrag(handle) {
    handle.addEventListener('mousedown', e => {
      const target = e.target;
      if (target.closest('button')) return;
      if (!refs) return;
      const rect = refs.dock.getBoundingClientRect();
      dragOffset = {
        dx: e.clientX - rect.left,
        dy: e.clientY - rect.top,
        w: rect.width,
        h: rect.height
      };
      document.body.style.cursor = 'grabbing';
      e.preventDefault();
    });
    window.addEventListener('mousemove', e => {
      if (!dragOffset) return;
      const x = Math.max(0, Math.min(window.innerWidth - dragOffset.w, e.clientX - dragOffset.dx));
      const y = Math.max(0, Math.min(window.innerHeight - dragOffset.h, e.clientY - dragOffset.dy));
      applyPos({
        left: x,
        top: y
      });
    });
    window.addEventListener('mouseup', () => {
      if (!dragOffset || !refs) return;
      dragOffset = null;
      document.body.style.cursor = '';
      const rect = refs.dock.getBoundingClientRect();
      const right = window.innerWidth - rect.right;
      const bottom = window.innerHeight - rect.bottom;
      const pos = right < 24 && right >= 0 ? {
        right: Math.max(8, right),
        top: Math.round(rect.top)
      } : bottom < 24 && bottom >= 0 ? {
        left: Math.round(rect.left),
        bottom: Math.max(8, bottom)
      } : {
        left: Math.round(rect.left),
        top: Math.round(rect.top)
      };
      applyPos(pos);
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.dockPos, pos);
    });
  }
  function toggleMini() {
    if (!refs) return;
    const next = !refs.dock.classList.contains(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini`);
    refs.dock.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini`, next);
    _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
      dockMinimized: next
    });
    _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.dockMin, next);
    refs.miniBtn.innerHTML = _IconManager__WEBPACK_IMPORTED_MODULE_6__.IconManager.flexible(next ? 'expand' : 'minimize');
    const label = next ? i18n.t('dock_expand') : i18n.t('dock_minimize');
    refs.miniBtn.setAttribute('aria-label', label);
    refs.miniBtn.title = label;
  }
  function setActiveTab(id) {
    if (!tabs || !captureTab || !exportTab || !settingsTab) return;
    _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
      activeTab: id
    });
    _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.activeTab, id);
    captureTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, id === 'capture');
    exportTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, id === 'export');
    settingsTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, id === 'settings');
    (0,_events__WEBPACK_IMPORTED_MODULE_9__.emitTabChanged)(id);
  }
  function startElapsedTicker() {
    if (elapsedTimer != null) clearInterval(elapsedTimer);
    elapsedTimer = setInterval(() => {
      if (!refs) return;
      const ms = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.elapsedMs();
      const txt = (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_16__.formatHMS)(ms);
      refs.footerElapsed.textContent = txt;
      // CaptureTab owns the stat cell; refresh just the elapsed value.
      captureTab?.refresh();
    }, 1000);
  }
  function refresh() {
    if (!refs) return;
    const counts = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts();
    const total = counts.posts || counts.chunks;
    const recording = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.recording;
    const paused = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.paused;
    refs.statusDot.classList.remove(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-live`, `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-paused`);
    if (recording && !paused) refs.statusDot.classList.add(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-live`);else if (paused) refs.statusDot.classList.add(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-paused`);
    refs.miniCountNum.textContent = String(total);
    // Activity indicator in mini mode: blue pulse if any task is running.
    const anyRunning = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_4__.Tasks.list().some(t => t.status === 'running' || t.status === 'pending');
    refs.miniTaskDot.hidden = !anyRunning;
    refs.footerElapsed.textContent = (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_16__.formatHMS)(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.elapsedMs());
    captureTab?.refresh();
    exportTab?.refresh();
    settingsTab?.refresh();
  }
  function buildLayout() {
    const root = ensureRoot();
    const statusDot = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-dot`,
      'aria-hidden': 'true'
    });
    const titleText = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-title-text`,
      text: i18n.t('dock_title')
    });
    const miniCountNum = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-count-num`,
      text: '0'
    });
    const miniTaskDot = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-task-dot`,
      'aria-hidden': 'true'
    });
    miniTaskDot.hidden = true;
    const miniCount = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-count`,
      'aria-hidden': 'true'
    }, [miniCountNum, miniTaskDot]);
    const titleBlock = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-title`
    }, [statusDot, titleText, miniCount]);
    const miniBtn = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('button', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-mini`,
      type: 'button',
      'aria-label': i18n.t('dock_minimize'),
      title: i18n.t('dock_minimize'),
      html: _IconManager__WEBPACK_IMPORTED_MODULE_6__.IconManager.flexible('minimize'),
      onclick: toggleMini
    });
    const headerActions = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-header-actions`
    }, [miniBtn]);
    const header = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-header`
    }, [titleBlock, headerActions]);
    // Tab modules
    captureTab = (0,_tabs_CaptureTab__WEBPACK_IMPORTED_MODULE_11__.createCaptureTab)({
      i18n
    });
    exportTab = (0,_tabs_ExportTab__WEBPACK_IMPORTED_MODULE_12__.createExportTab)({
      i18n
    });
    settingsTab = (0,_tabs_SettingsTab__WEBPACK_IMPORTED_MODULE_13__.createSettingsTab)({
      i18n
    });
    activityPanel = (0,_activity_ActivityPanel__WEBPACK_IMPORTED_MODULE_14__.createActivityPanel)({
      i18n,
      onRetry: taskId => {
        void (0,_exporter_imageRetry__WEBPACK_IMPORTED_MODULE_15__.retryImageFailures)(taskId);
      }
    });
    const initialTab = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('activeTab');
    tabs = (0,_Tabs__WEBPACK_IMPORTED_MODULE_10__.createTabs)({
      active: initialTab,
      tabs: [{
        id: 'capture',
        label: i18n.t('tab_capture'),
        icon: 'capture'
      }, {
        id: 'export',
        label: i18n.t('tab_export'),
        icon: 'export'
      }, {
        id: 'settings',
        label: i18n.t('tab_settings'),
        icon: 'settings'
      }],
      onChange: setActiveTab
    });
    captureTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, initialTab === 'capture');
    exportTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, initialTab === 'export');
    settingsTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, initialTab === 'settings');
    const footerElapsed = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-footer-elapsed`,
      text: '--:--'
    });
    const footer = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-footer`
    }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('span', {
      text: `v${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.VERSION}`
    }), footerElapsed]);
    const body = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-body`
    }, [captureTab.element, exportTab.element, settingsTab.element, activityPanel.element, footer]);
    const dock = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_7__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock`,
      role: 'region',
      'aria-label': i18n.t('dock_title')
    }, [header, tabs.element, body]);
    root.appendChild(dock);
    refs = {
      dock,
      header,
      statusDot,
      titleText,
      miniCountNum,
      miniTaskDot,
      miniBtn,
      footerElapsed
    };
    const pos = _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.get(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.dockPos, null);
    if (pos && typeof pos === 'object') applyPos(pos);
    if (_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('dockMinimized')) {
      dock.classList.add(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini`);
      miniBtn.innerHTML = _IconManager__WEBPACK_IMPORTED_MODULE_6__.IconManager.flexible('expand');
      miniBtn.setAttribute('aria-label', i18n.t('dock_expand'));
      miniBtn.title = i18n.t('dock_expand');
    }
    attachDrag(header);
    (0,_utils_rimLighting__WEBPACK_IMPORTED_MODULE_8__.attachRimLighting)(dock);
    startElapsedTicker();
  }
  function relabelEverything() {
    if (!refs || !tabs) return;
    refs.titleText.textContent = i18n.t('dock_title');
    refs.dock.setAttribute('aria-label', i18n.t('dock_title'));
    const miniLabel = refs.dock.classList.contains(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini`) ? i18n.t('dock_expand') : i18n.t('dock_minimize');
    refs.miniBtn.setAttribute('aria-label', miniLabel);
    refs.miniBtn.title = miniLabel;
    tabs.relabel([{
      id: 'capture',
      label: i18n.t('tab_capture'),
      icon: 'capture'
    }, {
      id: 'export',
      label: i18n.t('tab_export'),
      icon: 'export'
    }, {
      id: 'settings',
      label: i18n.t('tab_settings'),
      icon: 'settings'
    }]);
    tabs.setActive(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('activeTab'));
    // Tab panels rebuild themselves on locale change — easier than
    // mutating every inner string in place.
    const oldCapture = captureTab?.element;
    const oldExport = exportTab?.element;
    const oldSettings = settingsTab?.element;
    const oldActivity = activityPanel?.element;
    captureTab = (0,_tabs_CaptureTab__WEBPACK_IMPORTED_MODULE_11__.createCaptureTab)({
      i18n
    });
    exportTab = (0,_tabs_ExportTab__WEBPACK_IMPORTED_MODULE_12__.createExportTab)({
      i18n
    });
    settingsTab = (0,_tabs_SettingsTab__WEBPACK_IMPORTED_MODULE_13__.createSettingsTab)({
      i18n
    });
    // Destroy unhooks the old panel's bus listeners; the freshly-created
    // panel seeds itself from Tasks.list() so any in-flight cards re-appear
    // with the new locale's strings.
    activityPanel?.destroy();
    activityPanel = (0,_activity_ActivityPanel__WEBPACK_IMPORTED_MODULE_14__.createActivityPanel)({
      i18n,
      onRetry: taskId => {
        void (0,_exporter_imageRetry__WEBPACK_IMPORTED_MODULE_15__.retryImageFailures)(taskId);
      }
    });
    oldCapture?.replaceWith(captureTab.element);
    oldExport?.replaceWith(exportTab.element);
    oldSettings?.replaceWith(settingsTab.element);
    oldActivity?.replaceWith(activityPanel.element);
    const active = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('activeTab');
    captureTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, active === 'capture');
    exportTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, active === 'export');
    settingsTab.element.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active`, active === 'settings');
    refresh();
  }
  function mount() {
    if (document.getElementById(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID)?.querySelector(`.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock`)) {
      return;
    }
    buildLayout();
    // Reactive updates
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('state:changed', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('capture:tick', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('recorder:started', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('recorder:stopped', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('recorder:paused', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('recorder:resumed', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('recorder:cleared', () => refresh());
    // Mini-dock task indicator needs to flip when tasks come and go.
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('task:registered', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('task:ended', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('task:dismissed', () => refresh());
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('autoscroll:stopped', p => {
      if (p.reason === 'end') {
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_autoscroll_end'), 'success', 2200);
      } else if (p.reason === 'max') {
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_autoscroll_max'), 'warning', 2500);
      }
    });
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('apicapture:started', () => {
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_apicapture_started'), 'info', 1800);
    });
    _core_eventBus__WEBPACK_IMPORTED_MODULE_3__.Bus.on('apicapture:stopped', p => {
      if (p.reason === 'end') {
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_apicapture_done'), 'success', 2200);
      } else if (p.reason === 'error') {
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(`${i18n.t('toast_apicapture_error')}: ${p.error ?? ''}`, 'error', 3500);
      }
    });
    // Locale change: rebuild tab content so all strings refresh.
    i18n.onChange(() => {
      relabelEverything();
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(`${i18n.t('toast_locale_changed')}: ${i18n.t(i18n.locale() === 'zh' ? 'locale_zh' : 'locale_en')}`, 'success', 1500);
    });
    // Validate the persisted active-tab matches an allowed id.
    const persisted = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('activeTab');
    if (!_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.TAB_IDS.includes(persisted)) {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        activeTab: 'capture'
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.activeTab, 'capture');
    }
    refresh();
  }
  return {
    mount,
    refresh
  };
}

/***/ },

/***/ "./Dev/src/ui/components/IconManager.ts"
/*!**********************************************!*\
  !*** ./Dev/src/ui/components/IconManager.ts ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IconManager: () => (/* binding */ IconManager),
/* harmony export */   Icons: () => (/* binding */ Icons)
/* harmony export */ });
// Icon manager — Singleton SVG registry. Each icon is stored as a path/body
// definition; getIcon() renders the wrapping <svg> with the requested size
// and caches the result so repeated lookups don't re-stringify.
//
// All icons inherit currentColor from their parent, so they automatically
// follow the active theme without any per-icon dark variants.
const ICONS = {
  play: {
    kind: 'fill',
    body: '<path d="M8 5v14l11-7L8 5z"/>'
  },
  stop: {
    kind: 'fill',
    body: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>'
  },
  pause: {
    kind: 'fill',
    body: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'
  },
  download: {
    kind: 'stroke',
    strokeWidth: 2.2,
    body: '<path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"/>'
  },
  copy: {
    kind: 'stroke',
    body: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'
  },
  trash: {
    kind: 'stroke',
    body: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'
  },
  settings: {
    kind: 'stroke',
    body: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  },
  minimize: {
    kind: 'stroke',
    strokeWidth: 2.4,
    body: '<line x1="5" y1="12" x2="19" y2="12"/>'
  },
  expand: {
    kind: 'stroke',
    strokeWidth: 2.4,
    body: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'
  },
  close: {
    kind: 'stroke',
    strokeWidth: 2.4,
    body: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>'
  },
  sun: {
    kind: 'stroke',
    body: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.5" y1="4.5" x2="6.5" y2="6.5"/><line x1="17.5" y1="17.5" x2="19.5" y2="19.5"/><line x1="4.5" y1="19.5" x2="6.5" y2="17.5"/><line x1="17.5" y1="6.5" x2="19.5" y2="4.5"/>'
  },
  moon: {
    kind: 'fill',
    body: '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>'
  },
  system: {
    kind: 'stroke',
    body: '<rect x="3" y="4" width="18" height="13" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'
  },
  check: {
    kind: 'stroke',
    strokeWidth: 3,
    body: '<polyline points="20 6 9 17 4 12"/>'
  },
  warn: {
    kind: 'stroke',
    strokeWidth: 3,
    body: '<line x1="12" y1="5" x2="12" y2="13"/><circle cx="12" cy="18" r="0.6" fill="currentColor"/>'
  },
  x: {
    kind: 'stroke',
    strokeWidth: 3,
    body: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/>'
  },
  info: {
    kind: 'stroke',
    strokeWidth: 3,
    body: '<line x1="12" y1="10" x2="12" y2="16"/><circle cx="12" cy="7" r="0.6" fill="currentColor"/>'
  },
  // Tab icons
  capture: {
    kind: 'stroke',
    body: '<circle cx="12" cy="12" r="3"/><path d="M3 9V7a2 2 0 0 1 2-2h2"/><path d="M21 9V7a2 2 0 0 0-2-2h-2"/><path d="M3 15v2a2 2 0 0 0 2 2h2"/><path d="M21 15v2a2 2 0 0 1-2 2h-2"/>'
  },
  export: {
    kind: 'stroke',
    body: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
  },
  // Language / locale
  locale: {
    kind: 'stroke',
    body: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>'
  }
};
const cache = new Map();
function renderIcon(name, options = {}) {
  const def = ICONS[name];
  if (!def) return '';
  const size = options.size ?? 14;
  const cacheKey = `${name}@${size}@${options.strokeWidth ?? ''}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const viewBox = def.viewBox ?? '0 0 24 24';
  let svg;
  if (def.kind === 'fill') {
    svg = `<svg viewBox="${viewBox}" width="${size}" height="${size}" fill="currentColor">${def.body}</svg>`;
  } else {
    const sw = options.strokeWidth ?? def.strokeWidth ?? 2;
    svg = `<svg viewBox="${viewBox}" width="${size}" height="${size}" fill="none" stroke="currentColor" ` + `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${def.body}</svg>`;
  }
  cache.set(cacheKey, svg);
  return svg;
}
const flexibleCache = new Map();
const IconManager = {
  has(name) {
    return name in ICONS;
  },
  get(name, options) {
    return renderIcon(name, options);
  },
  flexible(name) {
    const cached = flexibleCache.get(name);
    if (cached) return cached;
    // Render without width/height; parent CSS sets the icon size.
    const def = ICONS[name];
    if (!def) return '';
    const viewBox = def.viewBox ?? '0 0 24 24';
    let svg;
    if (def.kind === 'fill') {
      svg = `<svg viewBox="${viewBox}" fill="currentColor">${def.body}</svg>`;
    } else {
      const sw = def.strokeWidth ?? 2;
      svg = `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" ` + `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${def.body}</svg>`;
    }
    flexibleCache.set(name, svg);
    return svg;
  }
};
// Back-compat alias for the old `Icons.foo` lookup pattern.
const Icons = new Proxy({}, {
  get(_target, prop) {
    if (IconManager.has(prop)) return IconManager.flexible(prop);
    return '';
  }
});

/***/ },

/***/ "./Dev/src/ui/components/OptionCard.ts"
/*!*********************************************!*\
  !*** ./Dev/src/ui/components/OptionCard.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createOptionCardList: () => (/* binding */ createOptionCardList)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
// Radio-card list — used by the capture-strategy picker where each option
// needs a longer description than a segmented control comfortably shows.


function createOptionCardList(config) {
  let current = config.value;
  function makeCard(opt) {
    const pressed = opt.value === current;
    const text = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-text`
    }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-name`,
      text: opt.name
    }), opt.description ? (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-desc`,
      text: opt.description
    }) : '']);
    const card = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card`,
      type: 'button',
      role: 'radio',
      'data-value': opt.value,
      'aria-checked': String(pressed),
      'aria-pressed': String(pressed),
      onclick: () => {
        if (current === opt.value) return;
        set(opt.value);
        config.onChange(opt.value);
      }
    }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-radio`
    }), text]);
    return card;
  }
  function applyPressed() {
    const cards = element.querySelectorAll(`.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card`);
    cards.forEach(b => {
      const v = b.dataset.value === current;
      b.setAttribute('aria-pressed', String(v));
      b.setAttribute('aria-checked', String(v));
    });
  }
  function set(value) {
    if (value === current) return;
    current = value;
    applyPressed();
  }
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-list`,
    role: 'radiogroup',
    'aria-label': config.ariaLabel ?? 'options'
  }, config.options.map(makeCard));
  return {
    element,
    set
  };
}

/***/ },

/***/ "./Dev/src/ui/components/Segmented.ts"
/*!********************************************!*\
  !*** ./Dev/src/ui/components/Segmented.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createSegmented: () => (/* binding */ createSegmented)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./IconManager */ "./Dev/src/ui/components/IconManager.ts");
// Segmented control — radio-group rendered as a row of pill buttons sharing
// a single rounded container. One option is "pressed" at any time.



function createSegmented(config) {
  let current = config.value;
  function makeButton(opt) {
    const pressed = opt.value === current;
    const inner = opt.icon ? `${_IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible(opt.icon)}<span>${escapeHtml(opt.label)}</span>` : escapeHtml(opt.label);
    return (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn`,
      type: 'button',
      role: 'radio',
      'data-value': opt.value,
      'aria-checked': String(pressed),
      'aria-pressed': String(pressed),
      'aria-label': opt.ariaLabel ?? opt.label,
      html: inner,
      onclick: () => {
        if (current === opt.value) return;
        set(opt.value);
        config.onChange(opt.value);
      }
    });
  }
  function applyPressed() {
    const buttons = element.querySelectorAll(`.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn`);
    buttons.forEach(b => {
      const v = b.dataset.value === current;
      b.setAttribute('aria-pressed', String(v));
      b.setAttribute('aria-checked', String(v));
    });
  }
  function set(value) {
    if (value === current) return;
    current = value;
    applyPressed();
  }
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-segmented`,
    role: 'radiogroup',
    'aria-label': config.ariaLabel ?? 'group'
  }, config.options.map(makeButton));
  return {
    element,
    set,
    get: () => current
  };
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/***/ },

/***/ "./Dev/src/ui/components/StatCell.ts"
/*!*******************************************!*\
  !*** ./Dev/src/ui/components/StatCell.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createStatCell: () => (/* binding */ createStatCell)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
// One cell of the stat row — big tabular value + small uppercase label.


function createStatCell(config) {
  const value = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat-value`,
    text: config.value
  });
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat`,
    'data-stat': config.key ?? config.label
  }, [value, (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat-label`,
    text: config.label
  })]);
  return {
    element,
    setValue(next) {
      if (value.textContent !== next) value.textContent = next;
    }
  };
}

/***/ },

/***/ "./Dev/src/ui/components/Switch.ts"
/*!*****************************************!*\
  !*** ./Dev/src/ui/components/Switch.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createSwitch: () => (/* binding */ createSwitch),
/* harmony export */   createToggleRow: () => (/* binding */ createToggleRow)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
// Toggle switch — accessible button with role="switch" and aria-checked.
// The visual thumb is rendered via the ::after pseudo-element in controls.ts.


function createSwitch(config) {
  const button = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch`,
    type: 'button',
    role: 'switch',
    'aria-checked': String(config.checked),
    'aria-label': config.ariaLabel ?? 'toggle',
    onclick: () => {
      const next = button.getAttribute('aria-checked') !== 'true';
      button.setAttribute('aria-checked', String(next));
      config.onChange(next);
    }
  });
  return {
    element: button,
    set(checked) {
      button.setAttribute('aria-checked', String(checked));
    },
    get() {
      return button.getAttribute('aria-checked') === 'true';
    }
  };
}
function createToggleRow(config) {
  const handle = createSwitch(config);
  const labelChildren = [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-name`,
    text: config.name
  })];
  if (config.description) {
    labelChildren.push((0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-desc`,
      text: config.description
    }));
  }
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-row`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-label`
  }, labelChildren), handle.element]);
  return {
    element,
    handle
  };
}

/***/ },

/***/ "./Dev/src/ui/components/Tabs.ts"
/*!***************************************!*\
  !*** ./Dev/src/ui/components/Tabs.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createTabs: () => (/* binding */ createTabs)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./IconManager */ "./Dev/src/ui/components/IconManager.ts");
// Tab strip — three buttons (Capture / Export / Settings) with a sliding
// underline indicator. The buttons own only the visual switching; the dock
// owns the actual panel show/hide.



function createTabs(config) {
  let active = config.active;
  let descriptors = config.tabs;
  function buildButton(desc) {
    const selected = desc.id === active;
    const inner = desc.icon ? `${_IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible(desc.icon)}<span>${escapeHtml(desc.label)}</span>` : escapeHtml(desc.label);
    return (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn`,
      type: 'button',
      role: 'tab',
      'data-tab': desc.id,
      'aria-selected': String(selected),
      'aria-controls': `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-${desc.id}`,
      id: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-${desc.id}`,
      'aria-label': desc.ariaLabel ?? desc.label,
      html: inner,
      onclick: () => {
        if (desc.id === active) return;
        setActive(desc.id);
        config.onChange(desc.id);
      }
    });
  }
  function rebuild() {
    element.innerHTML = '';
    for (const d of descriptors) element.appendChild(buildButton(d));
  }
  function setActive(next) {
    if (next === active) return;
    active = next;
    const buttons = element.querySelectorAll(`.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn`);
    buttons.forEach(b => {
      const selected = b.dataset.tab === active;
      b.setAttribute('aria-selected', String(selected));
    });
  }
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabbar`,
    role: 'tablist'
  });
  rebuild();
  return {
    element,
    setActive,
    relabel(tabs) {
      descriptors = tabs;
      rebuild();
    }
  };
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/***/ },

/***/ "./Dev/src/ui/components/Toast.ts"
/*!****************************************!*\
  !*** ./Dev/src/ui/components/Toast.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Toast: () => (/* binding */ Toast),
/* harmony export */   createToastQueue: () => (/* binding */ createToastQueue)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./IconManager */ "./Dev/src/ui/components/IconManager.ts");
// Bottom-center toast stack. New toasts push the older ones up (the
// container is flex-direction: column-reverse). Each toast self-dismisses
// after `duration` ms; the show/hide transition runs via the `dtr-show`
// class so we need a forced layout read before adding it (otherwise the
// initial state coalesces with the visible state and skips the transition).



function iconKey(type) {
  if (type === 'success') return 'check';
  if (type === 'warning') return 'warn';
  if (type === 'error') return 'x';
  return 'info';
}
function createToastQueue() {
  let container = null;
  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    const next = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-container`
    });
    container = next;
    const root = document.getElementById(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.ROOT_ID) ?? document.body;
    root.appendChild(next);
    return next;
  }
  return {
    show(message, type = 'info', durationMs = 2400) {
      const c = ensureContainer();
      const toast = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
        class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-${type}`,
        role: 'status',
        'aria-live': 'polite'
      }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
        class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon`,
        html: _IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible(iconKey(type))
      }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
        class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-text`,
        text: message
      })]);
      c.appendChild(toast);
      // Force layout so the transition runs from the hidden state.
      toast.getBoundingClientRect();
      toast.classList.add(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-show`);
      setTimeout(() => {
        toast.classList.remove(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-show`);
        setTimeout(() => toast.remove(), 250);
      }, durationMs);
      return toast;
    }
  };
}
const Toast = createToastQueue();

/***/ },

/***/ "./Dev/src/ui/components/activity/ActivityPanel.ts"
/*!*********************************************************!*\
  !*** ./Dev/src/ui/components/activity/ActivityPanel.ts ***!
  \*********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createActivityPanel: () => (/* binding */ createActivityPanel)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../core/taskRegistry */ "./Dev/src/core/taskRegistry.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _TaskCard__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./TaskCard */ "./Dev/src/ui/components/activity/TaskCard.ts");
// Activity Panel — pinned at the bottom of the Dock body (above the footer).
// Shows one TaskCard per registered task. Hidden when empty. Rebuilds itself
// when the locale changes (parent Dock destroys + recreates).
//
// Subscribes to task:registered / task:updated / task:ended / task:dismissed.
// rAF-coalesces card creates/updates so a producer ticking 50× / sec only
// triggers one DOM mutation per frame.
//
// Cancel / dismiss are wired to the Tasks registry directly. Retry is wired
// via the deps' onRetry callback so the panel doesn't pull in
// imageRetry.ts directly (keeps the dependency graph one-way).





function createActivityPanel(deps) {
  const cards = new Map();
  const list = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_3__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-activity-list`
  });
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_3__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-activity-panel`,
    role: 'region',
    'aria-label': deps.i18n.t('activity_panel_label')
  }, [list]);
  element.hidden = true;
  const pendingIds = new Set();
  let rafToken = 0;
  function scheduleRender(id) {
    pendingIds.add(id);
    if (rafToken !== 0) return;
    rafToken = requestAnimationFrame(flushRender);
  }
  function ensureCard(snap) {
    let card = cards.get(snap.id);
    if (card) return card;
    card = (0,_TaskCard__WEBPACK_IMPORTED_MODULE_4__.createTaskCard)({
      i18n: deps.i18n,
      snapshot: snap,
      actions: {
        onCancel: id => _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.cancel(id),
        onRetry: id => deps.onRetry(id),
        onDismiss: id => _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.dismiss(id)
      }
    });
    cards.set(snap.id, card);
    list.appendChild(card.element);
    return card;
  }
  function flushRender() {
    rafToken = 0;
    for (const id of pendingIds) {
      const snap = _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.get(id);
      const existing = cards.get(id);
      if (!snap) {
        // Task was dismissed between schedule and flush.
        existing?.destroy();
        cards.delete(id);
        continue;
      }
      const card = ensureCard(snap);
      card.update(snap);
    }
    pendingIds.clear();
    updateVisibility();
  }
  function updateVisibility() {
    const shouldShow = cards.size > 0;
    if (element.hidden === !shouldShow) return;
    element.hidden = !shouldShow;
  }
  function onRegistered(snap) {
    scheduleRender(snap.id);
  }
  function onUpdated(snap) {
    scheduleRender(snap.id);
  }
  function onEnded(snap) {
    scheduleRender(snap.id);
  }
  function onDismissed(payload) {
    const card = cards.get(payload.id);
    card?.destroy();
    cards.delete(payload.id);
    // Drop any pending render for this id — there's no record to read.
    pendingIds.delete(payload.id);
    updateVisibility();
  }
  const offRegistered = _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.on('task:registered', onRegistered);
  const offUpdated = _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.on('task:updated', onUpdated);
  const offEnded = _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.on('task:ended', onEnded);
  const offDismissed = _core_eventBus__WEBPACK_IMPORTED_MODULE_1__.Bus.on('task:dismissed', onDismissed);
  // Seed from any tasks already in flight when the panel mounts — happens
  // on locale rebuild.
  for (const snap of _core_taskRegistry__WEBPACK_IMPORTED_MODULE_2__.Tasks.list()) {
    scheduleRender(snap.id);
  }
  function refresh() {
    for (const id of cards.keys()) scheduleRender(id);
  }
  function destroy() {
    offRegistered();
    offUpdated();
    offEnded();
    offDismissed();
    if (rafToken !== 0) {
      cancelAnimationFrame(rafToken);
      rafToken = 0;
    }
    pendingIds.clear();
    for (const card of cards.values()) card.destroy();
    cards.clear();
    element.remove();
  }
  return {
    element,
    refresh,
    destroy
  };
}

/***/ },

/***/ "./Dev/src/ui/components/activity/TaskCard.ts"
/*!****************************************************!*\
  !*** ./Dev/src/ui/components/activity/TaskCard.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createTaskCard: () => (/* binding */ createTaskCard)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../IconManager */ "./Dev/src/ui/components/IconManager.ts");
/* harmony import */ var _TaskFailureList__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./TaskFailureList */ "./Dev/src/ui/components/activity/TaskFailureList.ts");
/* harmony import */ var _taskFormatters__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./taskFormatters */ "./Dev/src/ui/components/activity/taskFormatters.ts");
// One card per task. DOM is built once on construct; subsequent update(snap)
// calls only touch what changed (textContent, style.width, hidden, attrs).
// Failure list is rebuilt only when failures.length / failuresTruncated change
// (see TaskFailureList).
//
// Single component, kind-agnostic — apicapture/export.zip/export.sharded all
// render through the same card; differences (cancel/retry/dismiss visibility,
// throughput unit, stage labels) are payload-driven.





const KIND_ICON = {
  'export.zip': '📦',
  'export.sharded': '🗂️',
  'apicapture': '📡',
  'image.download': '🖼️',
  'image.retry': '🔁'
};
// Stage chip status → visual style. Defined as data attribute selectors in
// activity.ts CSS so we don't have to toggle classes here.
function shouldShowRetry(snap) {
  if (snap.status === 'running' || snap.status === 'pending') return false;
  if (snap.failures.length === 0) return false;
  if (!snap.retryable) return false;
  return true;
}
function shouldShowCancel(snap) {
  return snap.cancellable && (snap.status === 'running' || snap.status === 'pending');
}
function shouldShowDismiss(snap) {
  return snap.status === 'succeeded' || snap.status === 'failed' || snap.status === 'cancelled';
}
function createTaskCard(deps) {
  const {
    i18n,
    snapshot: initial,
    actions
  } = deps;
  const id = initial.id;
  // ── Header ────────────────────────────────────────────────
  const kindIcon = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-kind-icon`,
    text: KIND_ICON[initial.kind] ?? '⚙️',
    'aria-hidden': 'true'
  });
  const titleEl = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-title`,
    text: (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatTitle)(initial, i18n)
  });
  const statusPill = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill`,
    text: (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatStatus)(initial.status, i18n)
  });
  const cancelBtn = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-cancel`,
    type: 'button',
    title: i18n.t('task_cancel'),
    'aria-label': i18n.t('task_cancel'),
    html: _IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible('x'),
    onclick: () => actions.onCancel(id)
  });
  const dismissBtn = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-dismiss`,
    type: 'button',
    title: i18n.t('task_dismiss'),
    'aria-label': i18n.t('task_dismiss'),
    html: _IconManager__WEBPACK_IMPORTED_MODULE_2__.IconManager.flexible('x'),
    onclick: () => actions.onDismiss(id)
  });
  dismissBtn.hidden = true;
  const header = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-header`
  }, [kindIcon, titleEl, statusPill, cancelBtn, dismissBtn]);
  // ── Progress ──────────────────────────────────────────────
  const barFill = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar-fill`
  });
  const bar = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar`
  }, [barFill]);
  const counter = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-counter`
  });
  const progressRow = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-progress-row`
  }, [bar, counter]);
  // ── Meta ──────────────────────────────────────────────────
  const etaEl = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-eta`
  });
  const throughputEl = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-throughput`
  });
  const failedEl = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failed`
  });
  failedEl.hidden = true;
  const messageEl = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-message`
  });
  messageEl.hidden = true;
  const meta = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-meta`
  }, [etaEl, throughputEl, failedEl, messageEl]);
  // ── Stages ────────────────────────────────────────────────
  const stagesRow = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stages`
  });
  stagesRow.hidden = true;
  const stageEls = new Map();
  // ── Failures + retry slot ─────────────────────────────────
  const failureList = (0,_TaskFailureList__WEBPACK_IMPORTED_MODULE_3__.createTaskFailureList)({
    i18n
  });
  let retryBtn = null;
  function ensureRetryButton(snap) {
    if (retryBtn) return retryBtn;
    retryBtn = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('button', {
      class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-retry`,
      type: 'button',
      onclick: () => actions.onRetry(id)
    });
    retryBtn.textContent = i18n.t('task_retry', {
      n: snap.failures.length
    });
    return retryBtn;
  }
  // ── Card root ─────────────────────────────────────────────
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card`,
    'data-kind': initial.kind,
    'data-status': initial.status,
    'data-task-id': id,
    role: 'group',
    'aria-label': (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatTitle)(initial, i18n)
  }, [header, progressRow, meta, stagesRow, failureList.element]);
  // Build stage chips up front (stages are immutable in count, only their
  // status changes). If no stages, hide the row.
  if (initial.stages.length > 0) {
    for (const stage of initial.stages) {
      const chip = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
        class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage`,
        'data-stage': stage.id,
        'data-stage-status': stage.status
      });
      chip.textContent = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatStageLabel)(stage, i18n);
      stageEls.set(stage.id, chip);
      stagesRow.appendChild(chip);
    }
    stagesRow.hidden = false;
  }
  // Initialise display state from the seed snapshot.
  update(initial);
  function update(snap) {
    // Header
    if (titleEl.textContent !== (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatTitle)(snap, i18n)) {
      titleEl.textContent = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatTitle)(snap, i18n);
    }
    if (element.getAttribute('data-status') !== snap.status) {
      element.setAttribute('data-status', snap.status);
    }
    const statusText = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatStatus)(snap.status, i18n);
    if (statusPill.textContent !== statusText) statusPill.textContent = statusText;
    const showCancel = shouldShowCancel(snap);
    if (cancelBtn.hidden === showCancel) cancelBtn.hidden = !showCancel;
    const showDismiss = shouldShowDismiss(snap);
    if (dismissBtn.hidden === showDismiss) dismissBtn.hidden = !showDismiss;
    // Progress
    const pct = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatPercent)(snap.done, snap.total);
    const widthStr = `${pct.toFixed(1)}%`;
    if (barFill.style.width !== widthStr) barFill.style.width = widthStr;
    const counterStr = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatCounter)(snap.done, snap.total);
    if (counter.textContent !== counterStr) counter.textContent = counterStr;
    // Meta — only show ETA / throughput while running
    if (snap.status === 'running') {
      etaEl.hidden = false;
      throughputEl.hidden = false;
      const etaStr = `${i18n.t('task_eta')} ${(0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatEta)(snap.etaMs)}`;
      if (etaEl.textContent !== etaStr) etaEl.textContent = etaStr;
      const tpStr = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatThroughput)(snap.throughputPerSec, snap.unit, i18n);
      if (throughputEl.textContent !== tpStr) throughputEl.textContent = tpStr;
    } else {
      etaEl.hidden = true;
      throughputEl.hidden = true;
    }
    // Failures pill (lifetime count)
    if (snap.failedCount > 0) {
      const failedStr = i18n.t('task_failed_count', {
        n: snap.failedCount
      });
      if (failedEl.textContent !== failedStr) failedEl.textContent = failedStr;
      failedEl.hidden = false;
    } else {
      failedEl.hidden = true;
    }
    // Optional one-line message (e.g. error reason on a failed task)
    if (snap.message) {
      if (messageEl.textContent !== snap.message) messageEl.textContent = snap.message;
      messageEl.hidden = false;
    } else {
      messageEl.hidden = true;
    }
    // Stage chips
    for (const stage of snap.stages) {
      const chip = stageEls.get(stage.id);
      if (!chip) continue;
      chip.setAttribute('data-stage-status', stage.status);
      chip.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage-active`, stage.id === snap.activeStageId);
      const label = (0,_taskFormatters__WEBPACK_IMPORTED_MODULE_4__.formatStageLabel)(stage, i18n);
      if (chip.textContent !== label) chip.textContent = label;
    }
    // Failure list + retry button
    failureList.update(snap.failures, snap.failuresTruncated);
    if (shouldShowRetry(snap)) {
      const btn = ensureRetryButton(snap);
      const txt = i18n.t('task_retry', {
        n: snap.failures.length
      });
      if (btn.textContent !== txt) btn.textContent = txt;
      failureList.setRetryButton(btn);
    } else {
      failureList.setRetryButton(null);
      retryBtn = null;
    }
  }
  function destroy() {
    element.remove();
  }
  return {
    element,
    update,
    destroy
  };
}

/***/ },

/***/ "./Dev/src/ui/components/activity/TaskFailureList.ts"
/*!***********************************************************!*\
  !*** ./Dev/src/ui/components/activity/TaskFailureList.ts ***!
  \***********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createTaskFailureList: () => (/* binding */ createTaskFailureList)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
// Expandable failure list rendered inside a TaskCard. Renders up to N
// failure rows; if the registry truncated extras (failuresTruncated > 0),
// shows a "...and N more" line at the bottom. The retry button (if the
// card hosts one) lives just below the list.
//
// Rebuild semantics: the list is rebuilt only when failures.length or
// failuresTruncated changes — see TaskCard.update(). That keeps DOM churn
// flat even if `update` runs every frame.


function createTaskFailureList(deps) {
  const {
    i18n
  } = deps;
  const summary = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('summary', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-summary`
  });
  const list = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('ul', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-list`
  });
  const moreLine = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-more`
  });
  moreLine.hidden = true;
  const retrySlot = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-retry-slot`
  });
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('details', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures`
  }, [summary, list, moreLine, retrySlot]);
  element.hidden = true;
  let lastLength = -1;
  let lastTruncated = -1;
  let currentRetryBtn = null;
  function update(failures, truncated) {
    if (failures.length === 0 && truncated === 0) {
      element.hidden = true;
      lastLength = 0;
      lastTruncated = 0;
      return;
    }
    element.hidden = false;
    summary.textContent = i18n.t('task_failures_summary', {
      n: failures.length
    });
    // Only rebuild when content actually changes — most update() calls
    // come from done/total ticks, not new failures.
    if (failures.length !== lastLength || truncated !== lastTruncated) {
      list.replaceChildren();
      for (const f of failures) {
        const item = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('li', {
          class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-item`
        }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
          class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-label`,
          text: f.label
        }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_1__.h)('span', {
          class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-error`,
          text: f.error || i18n.t('task_failure_unknown_error')
        })]);
        list.appendChild(item);
      }
      if (truncated > 0) {
        moreLine.textContent = i18n.t('task_failures_more', {
          n: truncated
        });
        moreLine.hidden = false;
      } else {
        moreLine.hidden = true;
      }
      lastLength = failures.length;
      lastTruncated = truncated;
    }
  }
  function setRetryButton(button) {
    if (currentRetryBtn === button) return;
    retrySlot.replaceChildren();
    if (button) retrySlot.appendChild(button);
    currentRetryBtn = button;
  }
  return {
    element,
    update,
    setRetryButton
  };
}

/***/ },

/***/ "./Dev/src/ui/components/activity/taskFormatters.ts"
/*!**********************************************************!*\
  !*** ./Dev/src/ui/components/activity/taskFormatters.ts ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   formatCounter: () => (/* binding */ formatCounter),
/* harmony export */   formatEta: () => (/* binding */ formatEta),
/* harmony export */   formatPercent: () => (/* binding */ formatPercent),
/* harmony export */   formatStageLabel: () => (/* binding */ formatStageLabel),
/* harmony export */   formatStatus: () => (/* binding */ formatStatus),
/* harmony export */   formatThroughput: () => (/* binding */ formatThroughput),
/* harmony export */   formatTitle: () => (/* binding */ formatTitle)
/* harmony export */ });
// Pure formatters for task UI — kept separate from the components so they
// stay easy to unit-test and reuse if we add a CLI/console adapter later.
function formatEta(ms) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 1) return '<1s';
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return s === 0 ? `${m}m` : `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}
const UNIT_TO_KEY = {
  posts: 'task_throughput_posts',
  images: 'task_throughput_images',
  files: 'task_throughput_files',
  items: 'task_throughput_items'
};
function formatThroughput(rate, unit, i18n) {
  if (!rate || rate <= 0 || !Number.isFinite(rate)) return '—';
  const label = i18n.t(UNIT_TO_KEY[unit]);
  // One decimal under 10/s, integer above.
  const display = rate < 10 ? rate.toFixed(1) : Math.round(rate).toString();
  return `${display} ${label}`;
}
function formatCounter(done, total) {
  if (total <= 0) return `${done}`;
  return `${done}/${total}`;
}
function formatPercent(done, total) {
  if (total <= 0) return 0;
  const pct = done / total * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, pct));
}
const STATUS_KEY = {
  pending: 'task_status_pending',
  running: 'task_status_running',
  succeeded: 'task_status_succeeded',
  failed: 'task_status_failed',
  cancelled: 'task_status_cancelled'
};
function formatStatus(status, i18n) {
  return i18n.t(STATUS_KEY[status]);
}
function formatTitle(snap, i18n) {
  return i18n.t(snap.titleKey, snap.titleParams);
}
function formatStageLabel(stage, i18n) {
  const base = i18n.t(stage.labelKey);
  if (stage.total != null && stage.total > 0 && stage.done != null) {
    return `${base} ${stage.done}/${stage.total}`;
  }
  return base;
}

/***/ },

/***/ "./Dev/src/ui/components/tabs/CaptureTab.ts"
/*!**************************************************!*\
  !*** ./Dev/src/ui/components/tabs/CaptureTab.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createCaptureTab: () => (/* binding */ createCaptureTab)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../recorder/recorder */ "./Dev/src/recorder/recorder.ts");
/* harmony import */ var _exporter_exporter__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../exporter/exporter */ "./Dev/src/exporter/exporter.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _IconManager__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../IconManager */ "./Dev/src/ui/components/IconManager.ts");
/* harmony import */ var _Toast__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../Toast */ "./Dev/src/ui/components/Toast.ts");
/* harmony import */ var _Button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../Button */ "./Dev/src/ui/components/Button.ts");
/* harmony import */ var _StatCell__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../StatCell */ "./Dev/src/ui/components/StatCell.ts");
/* harmony import */ var _OptionCard__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../OptionCard */ "./Dev/src/ui/components/OptionCard.ts");
// Capture tab — status, stats, mode badge, and the start/pause/stop trio.
// Below them sit the capture-strategy radio cards (scroll vs API) which
// only apply to the *next* recording session.











function createCaptureTab(deps) {
  const {
    i18n
  } = deps;
  // ── stats row ─────────────────────────────────────────────
  const statPosts = (0,_StatCell__WEBPACK_IMPORTED_MODULE_9__.createStatCell)({
    value: '--',
    label: i18n.t('stat_posts'),
    key: 'posts'
  });
  const statImages = (0,_StatCell__WEBPACK_IMPORTED_MODULE_9__.createStatCell)({
    value: '--',
    label: i18n.t('stat_images'),
    key: 'images'
  });
  const statElapsed = (0,_StatCell__WEBPACK_IMPORTED_MODULE_9__.createStatCell)({
    value: '00:00',
    label: i18n.t('stat_elapsed'),
    key: 'elapsed'
  });
  const stats = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stats`
  }, [statPosts.element, statImages.element, statElapsed.element]);
  // Live shard preview — derives from Store.posts every refresh, hidden
  // until any posts have been captured. The user wanted statistics visible
  // *while* recording (not only at export), and this is the cheapest signal:
  // shard count + oversize warnings tell them whether their thread will
  // produce a clean sharded export or hit the oversize edge case.
  const shardPreview = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-desc`,
    style: {
      paddingTop: '4px',
      textAlign: 'center'
    }
  });
  shardPreview.hidden = true;
  // ── mode row ──────────────────────────────────────────────
  const modeText = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('span', {
    text: i18n.t('status_idle')
  });
  const modeBadge = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('span', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mode-badge`,
    text: i18n.t('mode_detecting')
  });
  const modeRow = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mode-row`
  }, [modeText, modeBadge]);
  // ── action buttons ────────────────────────────────────────
  const startBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_8__.createButton)({
    label: i18n.t('btn_start'),
    icon: 'play',
    variant: 'primary',
    fullWidth: true,
    onClick: () => {
      _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.start();
      const m = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.mode;
      _Toast__WEBPACK_IMPORTED_MODULE_7__.Toast.show(m === 'discourse' ? i18n.t('toast_started_discourse') : i18n.t('toast_started_generic'), 'success', 1800);
    }
  });
  const pauseBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_8__.createButton)({
    label: i18n.t('btn_pause'),
    icon: 'pause',
    onClick: () => {
      if (_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.paused) {
        _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.resume();
        _Toast__WEBPACK_IMPORTED_MODULE_7__.Toast.show(i18n.t('toast_resumed'), 'info', 1200);
      } else {
        _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.pause();
        _Toast__WEBPACK_IMPORTED_MODULE_7__.Toast.show(i18n.t('toast_paused'), 'warning', 1200);
      }
    }
  });
  const stopBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_8__.createButton)({
    label: i18n.t('btn_stop'),
    icon: 'stop',
    variant: 'danger',
    onClick: () => {
      _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.stop();
      _Toast__WEBPACK_IMPORTED_MODULE_7__.Toast.show(i18n.t('toast_stopped'), 'info', 1200);
    }
  });
  const clearBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_8__.createButton)({
    label: i18n.t('btn_clear'),
    icon: 'trash',
    onClick: () => {
      const counts = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts();
      if (counts.posts + counts.chunks === 0) {
        _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.clear();
        return;
      }
      if (window.confirm(i18n.t('toast_clear_confirm'))) {
        _recorder_recorder__WEBPACK_IMPORTED_MODULE_3__.Recorder.clear();
        _Toast__WEBPACK_IMPORTED_MODULE_7__.Toast.show(i18n.t('toast_cleared'), 'info', 1200);
      }
    }
  });
  const actionRow = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-row`
  }, [pauseBtn.element, stopBtn.element]);
  // ── capture strategy ──────────────────────────────────────
  const strategyCard = (0,_OptionCard__WEBPACK_IMPORTED_MODULE_10__.createOptionCardList)({
    value: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('captureStrategy'),
    options: [{
      value: 'scroll',
      name: i18n.t('strategy_scroll'),
      description: i18n.t('strategy_scroll_desc')
    }, {
      value: 'api',
      name: i18n.t('strategy_api'),
      description: i18n.t('strategy_api_desc')
    }],
    onChange: next => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        captureStrategy: next
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.captureStrategy, next);
    },
    ariaLabel: i18n.t('section_capture_strategy')
  });
  // API capture progress is rendered by the Activity Panel (in-dock task
  // card with progress bar + ETA + cancel). No inline text needed here.
  // ── assemble ──────────────────────────────────────────────
  const strategyGroup = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_capture_strategy')
  }), strategyCard.element]);
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_5__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel`,
    role: 'tabpanel',
    id: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-capture`,
    'aria-labelledby': `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-capture`
  }, [stats, shardPreview, modeRow, startBtn.element, actionRow, clearBtn.element, strategyGroup]);
  function refresh() {
    const counts = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts();
    const total = counts.posts || counts.chunks;
    const mode = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.mode;
    const recording = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.recording;
    const paused = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.state.paused;
    statPosts.setValue(String(counts.posts || counts.chunks));
    statImages.setValue(String(counts.images));
    statElapsed.setValue((0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_4__.formatHMS)(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.elapsedMs()));
    // Shard preview — only computes when posts are present, and is
    // memoised inside previewShardPlan() so this is cheap to call
    // every state:changed tick.
    const plan = counts.posts > 0 ? (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_4__.previewShardPlan)() : null;
    if (plan) {
      const oversize = plan.totals.oversizeShards;
      const head = `📦 ${plan.shards.length} ${i18n.t('shard_preview_shards')}`;
      const tail = oversize > 0 ? ` · ⚠ ${oversize} ${i18n.t('shard_preview_oversize')}` : '';
      shardPreview.textContent = head + tail;
      shardPreview.hidden = false;
    } else {
      shardPreview.hidden = true;
      shardPreview.textContent = '';
    }
    const modeLabel = mode === 'discourse' ? i18n.t('mode_discourse') : mode === 'generic' ? i18n.t('mode_generic') : i18n.t('mode_detecting');
    const statusLabel = recording ? paused ? i18n.t('status_paused') : i18n.t('status_recording') : total > 0 ? i18n.t('status_stopped') : i18n.t('status_idle');
    modeText.textContent = statusLabel;
    modeBadge.textContent = modeLabel;
    modeBadge.classList.toggle(`${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-generic`, mode !== 'discourse');
    // Buttons
    startBtn.setDisabled(recording);
    startBtn.setLabel(recording ? i18n.t('btn_recording') : i18n.t('btn_start'));
    pauseBtn.setDisabled(!recording);
    pauseBtn.setLabel(paused ? i18n.t('btn_resume') : i18n.t('btn_pause'));
    pauseBtn.setIcon(paused ? 'play' : 'pause');
    stopBtn.setDisabled(!recording);
    clearBtn.setDisabled(total === 0 && !recording);
    strategyCard.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('captureStrategy'));
  }
  refresh();
  // Hint-only: pre-warm the icon cache for the play icon swap on pause.
  _IconManager__WEBPACK_IMPORTED_MODULE_6__.IconManager.flexible('play');
  return {
    element,
    refresh
  };
}

/***/ },

/***/ "./Dev/src/ui/components/tabs/ExportTab.ts"
/*!*************************************************!*\
  !*** ./Dev/src/ui/components/tabs/ExportTab.ts ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createExportTab: () => (/* binding */ createExportTab)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _exporter_exporter__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../exporter/exporter */ "./Dev/src/exporter/exporter.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _Toast__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../Toast */ "./Dev/src/ui/components/Toast.ts");
/* harmony import */ var _Button__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../Button */ "./Dev/src/ui/components/Button.ts");
/* harmony import */ var _Segmented__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../Segmented */ "./Dev/src/ui/components/Segmented.ts");
/* harmony import */ var _Switch__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../Switch */ "./Dev/src/ui/components/Switch.ts");
// Export tab — format picker, the export action button, copy-to-clipboard,
// and the two export-flavour toggles (filename prefix, auto-save).









// Show the Windows long-path advisory at most once per page lifetime so the
// user isn't nagged on every export. Threshold: 50 chars of slug means the
// title alone is ~40+ chars after the date prefix, which is where copy-to-
// deep-destination starts approaching MAX_PATH=260 in practice.
const LONG_PATH_SLUG_THRESHOLD = 50;
let _longPathToastShown = false;
function isWindows() {
  return /windows/i.test(navigator.userAgent);
}
function maybeWarnLongPath(i18n) {
  if (_longPathToastShown) return;
  if (!isWindows()) return;
  const base = (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_3__.exportBaseName)();
  if (base.length <= LONG_PATH_SLUG_THRESHOLD) return;
  _longPathToastShown = true;
  _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_long_path_warn'), 'warning', 6000);
}
function createExportTab(deps) {
  const {
    i18n
  } = deps;
  // ── format picker ────────────────────────────────────────
  const fmtSeg = (0,_Segmented__WEBPACK_IMPORTED_MODULE_7__.createSegmented)({
    value: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('exportFormat'),
    options: [{
      value: 'sharded',
      label: i18n.t('fmt_sharded')
    }, {
      value: 'zip',
      label: i18n.t('fmt_zip')
    }, {
      value: 'both',
      label: i18n.t('fmt_both')
    }, {
      value: 'md',
      label: i18n.t('fmt_md')
    }, {
      value: 'json',
      label: i18n.t('fmt_json')
    }],
    onChange: next => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        exportFormat: next
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.exportFormat, next);
      refresh();
    },
    ariaLabel: i18n.t('section_format')
  });
  // ── shard cap input (only visible when format === 'sharded') ──
  const shardCapInput = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('input', {
    type: 'number',
    min: String(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MIN_SHARD_CAP_LINES),
    max: String(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MAX_SHARD_CAP_LINES),
    step: '50',
    value: String(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('shardCap') || _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SHARD_CAP_LINES),
    'aria-label': i18n.t('label_shard_cap'),
    style: {
      width: '72px',
      padding: '4px 8px',
      font: `500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.2 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font)`,
      color: `var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary)`,
      background: `var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg)`,
      border: `1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border)`,
      borderRadius: `var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md)`,
      textAlign: 'right'
    },
    onchange: () => {
      const raw = Number(shardCapInput.value);
      const clamped = Math.max(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MIN_SHARD_CAP_LINES, Math.min(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.MAX_SHARD_CAP_LINES, Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SHARD_CAP_LINES));
      if (String(clamped) !== shardCapInput.value) {
        shardCapInput.value = String(clamped);
      }
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        shardCap: clamped
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.shardCap, clamped);
    }
  });
  const shardCapRow = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-row`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-label`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-name`,
    text: i18n.t('label_shard_cap')
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-desc`,
    text: i18n.t('desc_shard_cap')
  })]), shardCapInput]);
  // ── action buttons ───────────────────────────────────────
  const exportBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_6__.createButton)({
    label: i18n.t('btn_export'),
    icon: 'download',
    variant: 'primary',
    fullWidth: true,
    onClick: onExport
  });
  const copyBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_6__.createButton)({
    label: i18n.t('btn_copy_md'),
    icon: 'copy',
    fullWidth: true,
    onClick: () => {
      (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_3__.copyMarkdown)();
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_copied_md'), 'success');
    }
  });
  const exportDomBtn = (0,_Button__WEBPACK_IMPORTED_MODULE_6__.createButton)({
    label: i18n.t('btn_export_dom'),
    icon: 'download',
    fullWidth: true,
    onClick: () => {
      (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_3__.exportPageHtml)();
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_export_dom'), 'success');
      maybeWarnLongPath(i18n);
    }
  });
  function onExport() {
    const fmt = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('exportFormat');
    // Both 'zip' and 'sharded' are async ZIP builders (potentially long if
    // images download). Disable the button + show progress for both.
    if (fmt === 'zip' || fmt === 'sharded') {
      exportBtn.setDisabled(true);
      const startMsg = fmt === 'sharded' ? i18n.t('toast_export_sharded') : (() => {
        const dl = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('downloadImages') ? i18n.t('toast_zip_with_images') : i18n.t('toast_zip_without_images');
        return `${i18n.t('toast_zip_start')} ${dl}`;
      })();
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(startMsg, 'info', 2200);
      Promise.resolve((0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_3__.exportPreferred)()).then(() => {
        exportBtn.setDisabled(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts().posts + _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts().chunks === 0);
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(fmt === 'sharded' ? i18n.t('toast_export_sharded_done') : i18n.t('toast_zip_done'), 'success', 2200);
        maybeWarnLongPath(i18n);
      }).catch(err => {
        exportBtn.setDisabled(false);
        const msg = err instanceof Error ? err.message : String(err);
        _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(`${i18n.t('toast_zip_failed')}: ${msg}`, 'error', 3500);
      });
    } else {
      void (0,_exporter_exporter__WEBPACK_IMPORTED_MODULE_3__.exportPreferred)();
      const msg = fmt === 'md' ? i18n.t('toast_export_md') : fmt === 'json' ? i18n.t('toast_export_json') : i18n.t('toast_export_both');
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(msg, 'success');
      maybeWarnLongPath(i18n);
    }
  }
  // ── advanced toggles ─────────────────────────────────────
  const autoSaveRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_8__.createToggleRow)({
    name: i18n.t('toggle_auto_save'),
    description: i18n.t('toggle_auto_save_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoSaveOnComplete'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        autoSaveOnComplete: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoSaveOnComplete, v);
    },
    ariaLabel: i18n.t('toggle_auto_save')
  });
  const filenamePrefixRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_8__.createToggleRow)({
    name: i18n.t('toggle_filename_prefix'),
    description: i18n.t('toggle_filename_prefix_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('filenamePrefix'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        filenamePrefix: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.filenamePrefix, v);
    },
    ariaLabel: i18n.t('toggle_filename_prefix')
  });
  const downloadImagesRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_8__.createToggleRow)({
    name: i18n.t('toggle_download_images'),
    description: i18n.t('toggle_download_images_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('downloadImages'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        downloadImages: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.downloadImages, v);
    },
    ariaLabel: i18n.t('toggle_download_images')
  });
  // Export progress lives in the Activity Panel now — the export button
  // keeps its static label throughout. onExport handles button state
  // (disabled/re-enabled) via the exportPreferred() promise chain.
  // ── assemble ─────────────────────────────────────────────
  const formatGroup = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_format')
  }), fmtSeg.element, shardCapRow]);
  const advancedGroup = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_export_advanced')
  }), downloadImagesRow.element, filenamePrefixRow.element, autoSaveRow.element]);
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel`,
    role: 'tabpanel',
    id: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-export`,
    'aria-labelledby': `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-export`
  }, [formatGroup, exportBtn.element, copyBtn.element, exportDomBtn.element, advancedGroup]);
  function refresh() {
    const counts = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.counts();
    const total = counts.posts || counts.chunks;
    const fmt = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('exportFormat');
    const exportLabel = fmt === 'zip' ? `${i18n.t('btn_export')} (ZIP)` : fmt === 'sharded' ? `${i18n.t('btn_export')} (${i18n.t('fmt_sharded')})` : fmt === 'md' ? `${i18n.t('btn_export')} MD` : fmt === 'json' ? `${i18n.t('btn_export')} JSON` : `${i18n.t('btn_export')} (MD+JSON)`;
    exportBtn.setLabel(exportLabel);
    exportBtn.setIcon('download');
    exportBtn.setDisabled(total === 0);
    copyBtn.setDisabled(total === 0);
    fmtSeg.set(fmt);
    // Shard cap input is only meaningful in 'sharded' mode.
    shardCapRow.hidden = fmt !== 'sharded';
    const cap = _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('shardCap') || _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SHARD_CAP_LINES;
    if (shardCapInput.value !== String(cap)) {
      shardCapInput.value = String(cap);
    }
    autoSaveRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoSaveOnComplete'));
    filenamePrefixRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('filenamePrefix'));
    downloadImagesRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('downloadImages'));
  }
  refresh();
  return {
    element,
    refresh
  };
}

/***/ },

/***/ "./Dev/src/ui/components/tabs/SettingsTab.ts"
/*!***************************************************!*\
  !*** ./Dev/src/ui/components/tabs/SettingsTab.ts ***!
  \***************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createSettingsTab: () => (/* binding */ createSettingsTab)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _styles_darkMode__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../styles/darkMode */ "./Dev/src/ui/styles/darkMode.ts");
/* harmony import */ var _utils_dom__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../utils/dom */ "./Dev/src/utils/dom.ts");
/* harmony import */ var _Toast__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../Toast */ "./Dev/src/ui/components/Toast.ts");
/* harmony import */ var _Segmented__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../Segmented */ "./Dev/src/ui/components/Segmented.ts");
/* harmony import */ var _Switch__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../Switch */ "./Dev/src/ui/components/Switch.ts");
// Settings tab — appearance (theme), language, capture toggles, and the
// About card. Lives inside the dock now (no more separate modal for normal
// settings).








function createSettingsTab(deps) {
  const {
    i18n
  } = deps;
  // ── theme picker ──────────────────────────────────────────
  const themeSeg = (0,_Segmented__WEBPACK_IMPORTED_MODULE_6__.createSegmented)({
    value: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('theme'),
    options: [{
      value: 'light',
      label: i18n.t('theme_light'),
      icon: 'sun'
    }, {
      value: 'dark',
      label: i18n.t('theme_dark'),
      icon: 'moon'
    }, {
      value: 'system',
      label: i18n.t('theme_system'),
      icon: 'system'
    }],
    onChange: next => {
      _styles_darkMode__WEBPACK_IMPORTED_MODULE_3__.Theme.set(next);
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(`${i18n.t('toast_theme_changed')}: ${i18n.t(next === 'light' ? 'theme_light' : next === 'dark' ? 'theme_dark' : 'theme_system')}`, 'success', 1500);
    },
    ariaLabel: i18n.t('section_theme')
  });
  // ── locale picker ─────────────────────────────────────────
  const localeSeg = (0,_Segmented__WEBPACK_IMPORTED_MODULE_6__.createSegmented)({
    value: i18n.preference(),
    options: [{
      value: 'zh',
      label: i18n.t('locale_zh')
    }, {
      value: 'en',
      label: i18n.t('locale_en')
    }, {
      value: 'system',
      label: i18n.t('locale_system'),
      icon: 'system'
    }],
    onChange: next => {
      i18n.setPreference(next);
      // The toast message is shown via the locale:changed handler in
      // the dock, which also triggers a full re-render so the new
      // strings appear immediately.
    },
    ariaLabel: i18n.t('section_locale')
  });
  // ── capture toggles ───────────────────────────────────────
  const captureImagesRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_7__.createToggleRow)({
    name: i18n.t('toggle_capture_images'),
    description: i18n.t('toggle_capture_images_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('captureImages'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        captureImages: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.captureImages, v);
    },
    ariaLabel: i18n.t('toggle_capture_images')
  });
  const autoScrollRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_7__.createToggleRow)({
    name: i18n.t('toggle_auto_scroll'),
    description: i18n.t('toggle_auto_scroll_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoScroll'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        autoScroll: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoScroll, v);
    },
    ariaLabel: i18n.t('toggle_auto_scroll')
  });
  const autoStartRow = (0,_Switch__WEBPACK_IMPORTED_MODULE_7__.createToggleRow)({
    name: i18n.t('toggle_auto_start'),
    description: i18n.t('toggle_auto_start_desc'),
    checked: _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoStart'),
    onChange: v => {
      _core_store__WEBPACK_IMPORTED_MODULE_2__.Store.patch({
        autoStart: v
      });
      _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.autoStart, v);
    },
    ariaLabel: i18n.t('toggle_auto_start')
  });
  // ── about card ────────────────────────────────────────────
  const buildLine = _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.BUILD_DATE ? _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.BUILD_DATE.slice(0, 10) : '';
  const aboutText = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-desc`,
    style: {
      lineHeight: '1.55'
    }
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    text: i18n.t('about_blurb')
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    text: `${i18n.t('about_version')}: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.VERSION}${buildLine ? `  ·  ${i18n.t('about_build')}: ${buildLine}` : ''}`,
    style: {
      marginTop: '6px'
    }
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    text: i18n.t('about_privacy'),
    style: {
      marginTop: '4px'
    }
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    style: {
      marginTop: '6px',
      fontWeight: '600'
    },
    text: `${i18n.t('about_shortcuts')}:`
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    text: `· ${i18n.t('about_shortcut_record')}`
  }), (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    text: `· ${i18n.t('about_shortcut_theme')}`
  })]);
  // ── reset button ──────────────────────────────────────────
  const resetBtn = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('button', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn`,
    type: 'button',
    text: i18n.t('btn_reset_prefs'),
    style: {
      marginTop: '6px'
    },
    onclick: () => {
      for (const k of Object.values(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS)) _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP.del(k);
      _Toast__WEBPACK_IMPORTED_MODULE_5__.Toast.show(i18n.t('toast_prefs_reset'), 'info', 3200);
    }
  });
  // ── assemble ──────────────────────────────────────────────
  const appearance = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_theme')
  }), themeSeg.element]);
  const locale = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_locale')
  }), localeSeg.element]);
  const captureSection = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_capture')
  }), captureImagesRow.element, autoScrollRow.element, autoStartRow.element]);
  const aboutSection = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group`
  }, [(0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title`,
    text: i18n.t('section_about')
  }), aboutText, resetBtn]);
  const element = (0,_utils_dom__WEBPACK_IMPORTED_MODULE_4__.h)('div', {
    class: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel`,
    role: 'tabpanel',
    id: `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-settings`,
    'aria-labelledby': `${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-settings`
  }, [appearance, locale, captureSection, aboutSection]);
  function refresh() {
    themeSeg.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('theme'));
    localeSeg.set(i18n.preference());
    captureImagesRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('captureImages'));
    autoScrollRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoScroll'));
    autoStartRow.handle.set(_core_store__WEBPACK_IMPORTED_MODULE_2__.Store.get('autoStart'));
  }
  return {
    element,
    refresh
  };
}

/***/ },

/***/ "./Dev/src/ui/events.ts"
/*!******************************!*\
  !*** ./Dev/src/ui/events.ts ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   emitLocaleChanged: () => (/* binding */ emitLocaleChanged),
/* harmony export */   emitTabChanged: () => (/* binding */ emitTabChanged),
/* harmony export */   emitThemeApplied: () => (/* binding */ emitThemeApplied)
/* harmony export */ });
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/eventBus */ "./Dev/src/core/eventBus.ts");
// Centralised typed-emit helpers for UI lifecycle events. Components emit
// through these wrappers so the underlying Bus channels and payload shapes
// stay consistent, and so a future test can spy on view changes without
// monkey-patching console.

function emitTabChanged(tab) {
  _core_eventBus__WEBPACK_IMPORTED_MODULE_0__.Bus.emit('tab:changed', {
    tab
  });
}
function emitLocaleChanged(locale) {
  _core_eventBus__WEBPACK_IMPORTED_MODULE_0__.Bus.emit('locale:changed', {
    locale
  });
}
function emitThemeApplied(mode, effective) {
  _core_eventBus__WEBPACK_IMPORTED_MODULE_0__.Bus.emit('theme:applied', {
    mode,
    effective
  });
}

/***/ },

/***/ "./Dev/src/ui/styles/darkMode.ts"
/*!***************************************!*\
  !*** ./Dev/src/ui/styles/darkMode.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Theme: () => (/* binding */ Theme),
/* harmony export */   createTheme: () => (/* binding */ createTheme)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../infra/storage/storageOperator */ "./Dev/src/infra/storage/storageOperator.ts");
/* harmony import */ var _core_eventBus__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../core/eventBus */ "./Dev/src/core/eventBus.ts");
/* harmony import */ var _core_store__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../core/store */ "./Dev/src/core/store.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../events */ "./Dev/src/ui/events.ts");
// Theme controller. Three modes:
//   - 'light' / 'dark'  → explicit user choice
//   - 'system'          → follow prefers-color-scheme, re-applied on OS change
//
// The dark theme is opted into by toggling `html.dtr-theme-dark`, against
// which all dark token overrides cascade (see tokens.ts).
//
// Transitions: when the user toggles a theme, we add a transient
// `html.dtr-theme-transitioning` class for ~320ms that opts every dtr-*
// element into a coordinated color/background fade — without making the
// host page animate. The boot path uses { skipTransition: true } so the
// first paint doesn't flicker.





function createTheme(deps) {
  const {
    storageOP: storage,
    store,
    bus
  } = deps;
  function resolved(mode) {
    if (mode === 'dark' || mode === 'light') return mode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function apply(mode, options = {}) {
    const root = document.documentElement;
    const effective = resolved(mode);
    const isDark = effective === 'dark';
    const willChange = isDark !== root.classList.contains(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_CLASS);
    const animate = willChange && !options.skipTransition;
    if (animate) root.classList.add(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_TRANSITIONING_CLASS);
    root.classList.toggle(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_CLASS, isDark);
    if (animate) {
      window.setTimeout(() => root.classList.remove(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_TRANSITIONING_CLASS), _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_TRANSITION_MS);
    }
    (0,_events__WEBPACK_IMPORTED_MODULE_4__.emitThemeApplied)(mode, effective);
    void bus;
  }
  function set(mode, options = {}) {
    store.patch({
      theme: mode
    });
    storage.set(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STORAGE_KEYS.theme, mode);
    apply(mode, options);
  }
  function init() {
    apply(store.get('theme'), {
      skipTransition: true
    });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (store.get('theme') === 'system') apply('system');
    });
  }
  return {
    apply,
    set,
    init,
    resolved
  };
}
// Default singleton — wired against the production Store/storageOP/Bus.
const Theme = createTheme({
  storageOP: _infra_storage_storageOperator__WEBPACK_IMPORTED_MODULE_1__.storageOP,
  store: _core_store__WEBPACK_IMPORTED_MODULE_3__.Store,
  bus: _core_eventBus__WEBPACK_IMPORTED_MODULE_2__.Bus
});

/***/ },

/***/ "./Dev/src/ui/styles/injectStyles.ts"
/*!*******************************************!*\
  !*** ./Dev/src/ui/styles/injectStyles.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   injectStyles: () => (/* binding */ injectStyles)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _tokens__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tokens */ "./Dev/src/ui/styles/tokens.ts");
/* harmony import */ var _partials__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./partials */ "./Dev/src/ui/styles/partials/index.ts");
// Stylesheet injection. Concatenates tokens + every CSS partial and inserts
// a single <style id="dtr-styles"> into <head>. Idempotent — re-calling is a
// no-op.



function injectStyles() {
  if (document.getElementById(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STYLE_ID)) return;
  const css = [_tokens__WEBPACK_IMPORTED_MODULE_1__.TOKENS_CSS, ..._partials__WEBPACK_IMPORTED_MODULE_2__.PARTIAL_CSS_LIST].join('\n');
  const el = document.createElement('style');
  el.id = _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.STYLE_ID;
  el.textContent = css;
  (document.head ?? document.documentElement).appendChild(el);
}

/***/ },

/***/ "./Dev/src/ui/styles/partials/activity.ts"
/*!************************************************!*\
  !*** ./Dev/src/ui/styles/partials/activity.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_CSS: () => (/* binding */ ACTIVITY_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Activity Panel — pinned at the bottom of the dock body. Hosts a vertical
// stack of TaskCards, each with progress bar, ETA/throughput, stage chips,
// and an expandable failure list.
//
// Visual hierarchy:
//   E2 outer panel surface (matches stats grid)
//     E3 card per task
//       E4 chips for status pill and stage chips
//       bar fill uses the same accent gradient as the primary button
//
// Status colours are driven by a data-status attribute on the card so we
// don't need to thrash class names from JS.

const ACTIVITY_CSS = `
/* ── Panel container ──────────────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-activity-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-edge);
    max-height: 38vh;
    overflow-y: auto;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-activity-panel[hidden] { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-activity-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

/* Mini-mode dock hides the body, which already takes the panel with it.
   No extra rule needed. */

/* ── Task card ────────────────────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-shadow);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.2s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="failed"] {
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-border);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="cancelled"] {
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-border);
    opacity: 0.85;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="succeeded"] {
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-border);
}

/* ── Header row ───────────────────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-header {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-kind-icon {
    font-size: 13px;
    line-height: 1;
    flex-shrink: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-title {
    flex: 1;
    min-width: 0;
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.2 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill {
    flex-shrink: 0;
    padding: 1px 7px;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1.4 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    letter-spacing: 0.2px;
    text-transform: uppercase;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="succeeded"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="failed"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="cancelled"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="pending"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-status-pill {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange);
}

/* Header buttons (cancel/dismiss) */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn {
    flex-shrink: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-sm);
    width: 20px;
    height: 20px;
    padding: 0;
    cursor: pointer;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn:hover {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn svg { width: 10px; height: 10px; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-btn[hidden] { display: none; }

/* ── Progress row ─────────────────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar {
    flex: 1;
    height: 6px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    overflow: hidden;
    position: relative;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar-fill {
    height: 100%;
    width: 0%;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-accent-gradient);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    transition: width 0.25s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-out);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="succeeded"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar-fill {
    background: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb),0.9), rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb),0.7));
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="failed"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar-fill {
    background: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb),0.9), rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb),0.7));
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="cancelled"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar-fill {
    background: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb),0.7), rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb),0.5));
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-card[data-status="running"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-bar::after {
    /* Subtle moving shimmer to convey "still working" even if % is static */
    content: '';
    position: absolute;
    top: 0; left: -40%;
    width: 30%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    animation: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-taskShimmer 1.6s linear infinite;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-counter {
    flex-shrink: 0;
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    font-variant-numeric: tabular-nums;
    min-width: 48px;
    text-align: right;
}

@keyframes ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-taskShimmer {
    from { transform: translateX(0); }
    to   { transform: translateX(360%); }
}

/* ── Meta row (ETA · throughput · failed) ─────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1.3 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    font-variant-numeric: tabular-nums;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-meta > span[hidden] { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failed {
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red);
    font-weight: 600;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-message {
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    font-style: italic;
}

/* ── Stage chips ──────────────────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stages {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stages[hidden] { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage {
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    padding: 3px 7px;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage[data-stage-status="active"],
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage-active {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
    font-weight: 600;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage[data-stage-status="done"] {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-stage[data-stage-status="skipped"] {
    opacity: 0.55;
    text-decoration: line-through;
}

/* ── Failures (collapsible) ───────────────────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures {
    margin-top: 2px;
    padding: 0;
    background: transparent;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures[hidden] { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-summary {
    cursor: pointer;
    list-style: none;
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1.3 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red);
    padding: 4px 0;
    user-select: none;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-summary::-webkit-details-marker { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-summary::before {
    content: '▸';
    display: inline-block;
    width: 12px;
    transition: transform 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures[open] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-summary::before {
    transform: rotate(90deg);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-list {
    margin: 4px 0 0 12px;
    padding: 0;
    list-style: none;
    max-height: 160px;
    overflow-y: auto;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-item {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 3px 0;
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1.3 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font-mono);
    border-bottom: 1px dashed var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-item:last-child { border-bottom: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-label {
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    word-break: break-all;
    flex: 1;
    min-width: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failure-error {
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red);
    flex-shrink: 0;
    font-weight: 600;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-more {
    margin-top: 4px;
    padding-left: 12px;
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1.3 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    font-style: italic;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-more[hidden] { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-failures-retry-slot {
    margin-top: 6px;
    padding-left: 12px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-retry {
    width: auto;
    height: auto;
    padding: 4px 10px;
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs)/1 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-task-retry:hover {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-on-accent);
}

/* ── Mini-dock "running tasks" indicator ──────────────────── */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-task-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
    box-shadow: 0 0 0 3px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.18);
    animation: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-pulse 1.6s ease-in-out infinite;
    margin-left: 4px;
    vertical-align: middle;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-task-dot[hidden] { display: none; }
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/animations.ts"
/*!**************************************************!*\
  !*** ./Dev/src/ui/styles/partials/animations.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ANIMATIONS_CSS: () => (/* binding */ ANIMATIONS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Keyframes + theme-fade overrides + reduced-motion fallbacks. Kept separate
// from component definitions so future motion tweaks (or a hostile prefers-
// reduced-motion override) doesn't touch component CSS.

const ANIMATIONS_CSS = `
@keyframes ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dockIn {
    from { transform: translateY(16px) scale(0.96); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50%      { transform: scale(1.25); opacity: 0.65; }
}

@keyframes ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabFade {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Theme switch — fade everything inside the dtr root for 300ms when
   .dtr-theme-transitioning is on <html>. Host page is untouched. */
html.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-theme-transitioning #${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root,
html.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-theme-transitioning #${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root *,
html.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-theme-transitioning #${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root *::before,
html.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-theme-transitioning #${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root *::after {
    transition:
        background-color 0.3s ease,
        background 0.3s ease,
        color 0.3s ease,
        border-color 0.3s ease,
        box-shadow 0.3s ease !important;
}

/* Reduced-motion: kill animations that aren't critical for affordance. */
@media (prefers-reduced-motion: reduce) {
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock,
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast,
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal,
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn,
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel,
    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-dot.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-live {
        animation: none !important;
        transition: none !important;
    }
}
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/buttons.ts"
/*!***********************************************!*\
  !*** ./Dev/src/ui/styles/partials/buttons.ts ***!
  \***********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BUTTONS_CSS: () => (/* binding */ BUTTONS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Buttons — base plate, primary (accent), danger (stop). Single-row vs
// half-width layouts via `.dtr-btn-row` and `.dtr-btn-full`.

const BUTTONS_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-border);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.2 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    cursor: pointer;
    transition: transform 0.15s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-bounce), background 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-shadow);
    outline: none; min-width: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn:hover:not(:disabled) {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg-hover);
    transform: translateY(-1px);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn:active:not(:disabled) { transform: translateY(0); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn:focus-visible { box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn svg { width: 14px; height: 14px; flex-shrink: 0; }

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-accent-gradient);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-on-accent);
    border-color: transparent;
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary:hover:not(:disabled) {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-accent-gradient);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow-hover), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge-hover);
}

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stop-gradient);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-on-accent);
    border-color: transparent;
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger:hover:not(:disabled) {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stop-gradient);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow-hover), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge-hover);
}

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-full { width: 100%; }
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/controls.ts"
/*!************************************************!*\
  !*** ./Dev/src/ui/styles/partials/controls.ts ***!
  \************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONTROLS_CSS: () => (/* binding */ CONTROLS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Form controls — segmented picker, toggle switch, and the toggle-row that
// pairs a name+description with a switch on the right.

const CONTROLS_CSS = `
/* SEGMENTED control */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-segmented {
    display: grid; grid-auto-flow: column; grid-auto-columns: 1fr;
    gap: 0; padding: 3px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn {
    padding: 7px 8px;
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.2 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    background: transparent;
    border: 1px solid transparent;
    border-radius: calc(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg) - 3px);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    cursor: pointer;
    transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn[aria-pressed="true"] {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-edge);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn:hover:not([aria-pressed="true"]) { color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn:focus-visible {
    outline: none;
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-seg-btn svg { width: 13px; height: 13px; }

/* Strategy / format option list (radio-card style) */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md);
    cursor: pointer;
    text-align: left;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.3 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    transition: background 0.18s ease, border-color 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card:hover {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg-hover);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card[aria-pressed="true"] {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-text {
    flex: 1;
    min-width: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-name {
    font-weight: 600;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-desc {
    margin-top: 2px;
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-radio {
    margin-top: 3px;
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 1.5px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    flex-shrink: 0;
    position: relative;
    transition: border-color 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card[aria-pressed="true"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-radio {
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card[aria-pressed="true"] .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-option-card-radio::after {
    content: "";
    position: absolute;
    inset: 2px;
    border-radius: 50%;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
}

/* TOGGLE row + switch */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-row {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-row:last-child { border-bottom: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-label { flex: 1; min-width: 0; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-name {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md);
    font-weight: 500;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-desc {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    margin-top: 2px;
    line-height: 1.35;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch {
    position: relative; width: 38px; height: 22px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-track);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    cursor: pointer;
    transition: background 0.22s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy);
    flex-shrink: 0;
    border: none;
    padding: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch::after {
    content: ""; position: absolute;
    top: 2px; left: 2px;
    width: 18px; height: 18px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb);
    border-radius: 50%;
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb-shadow);
    transition: transform 0.22s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch[aria-checked="true"] { background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-track-on); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch[aria-checked="true"]::after { transform: translateX(16px); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch:focus-visible { box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring); outline: none; }
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/dock.ts"
/*!********************************************!*\
  !*** ./Dev/src/ui/styles/partials/dock.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DOCK_CSS: () => (/* binding */ DOCK_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Dock layout — the floating panel that hosts the tabbed UI. Animation
// (slide-in on mount), drag handle (header), minimize/expand states, status
// dot family, header icon buttons, and body padding all live here.

const DOCK_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock {
    position: fixed;
    right: 20px; bottom: 20px;
    width: 312px;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-glass);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-bg);
    -webkit-backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate)) brightness(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-brightness));
    backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate)) brightness(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-brightness));
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-border);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-edge);
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    overflow: hidden;
    will-change: transform;
    animation: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dockIn 0.42s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-out) both;
}

/* Minimised mode — collapse to a pill with just the title chrome. */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini {
    width: auto;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    padding: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-body { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabbar { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-header {
    border-bottom: none;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    padding: 6px 12px;
    gap: 8px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-title-text { display: none; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-count { display: inline-flex; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn:not(.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toggle-mini) { display: none; }

/* HEADER — drag handle */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
    cursor: move; user-select: none;
    position: relative; z-index: 1;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-title {
    display: flex; align-items: center; gap: 8px;
    flex: 1; min-width: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-title-text {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md);
    font-weight: 600; letter-spacing: -0.1px;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mini-count {
    display: none;
    align-items: center; gap: 6px;
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm); font-weight: 600;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    font-variant-numeric: tabular-nums;
}

/* STATUS DOT family */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-dot {
    width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    transition: background 220ms var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy), box-shadow 220ms var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-dot.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-live {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red);
    box-shadow: 0 0 0 3px var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-live-glow);
    animation: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-pulse 1.6s ease-in-out infinite;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-dot.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-paused {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange);
    box-shadow: 0 0 0 3px var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-paused-glow);
}

/* HEADER icon buttons */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-header-actions {
    display: flex; gap: 4px; flex-shrink: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn {
    width: 26px; height: 26px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    cursor: pointer; padding: 0;
    transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn:hover {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg-hover);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn:focus-visible {
    outline: none; box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-icon-btn svg { width: 14px; height: 14px; }

/* BODY */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-body {
    padding: 12px;
    display: flex; flex-direction: column; gap: 10px;
    position: relative; z-index: 1;
}

/* FOOTER */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-footer {
    display: flex; align-items: center; justify-content: space-between;
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    padding-top: 4px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-footer-elapsed { font-variant-numeric: tabular-nums; }

/* STATS row (E2 panel) */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 10px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-edge);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat { text-align: center; padding: 4px 2px; min-width: 0; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat-value {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xl);
    font-weight: 700;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.3px; line-height: 1.1;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stat-label {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    margin-top: 2px;
    text-transform: uppercase; letter-spacing: 0.4px;
}

/* MODE row (E4 chip) */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mode-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 6px 10px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md);
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mode-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft);
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
    font-weight: 600; font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs);
    letter-spacing: 0.2px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-mode-badge.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-generic {
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-soft);
    border-color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-border);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
}
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/glass.ts"
/*!*********************************************!*\
  !*** ./Dev/src/ui/styles/partials/glass.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GLASS_CSS: () => (/* binding */ GLASS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Liquid-glass effect — the mouse-tracked rim lighting that gives the dock
// its "depth on hover" look. Pseudo-elements read --dtr-rim-mx / -my /
// -hover written by attachRimLighting(), plus the rim-color tokens which
// flip light↔dark in tokens.ts.

const GLASS_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock::before,
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock::after {
    content: ""; position: absolute; inset: 0;
    border-radius: inherit; pointer-events: none; padding: 1px;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
            mask-composite: exclude;
    background: linear-gradient(
        calc((135 + var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-mx, 0) * 1.2) * 1deg),
        var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-1) 0%,
        var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-2) 33%,
        var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-3) 66%,
        var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-1) 100%
    );
    transition: opacity 220ms var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy);
    opacity: calc(0.5 + var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-hover, 0) * 0.3);
    mix-blend-mode: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-1);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-dock::after {
    mix-blend-mode: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-2);
    opacity: calc(0.18 + var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-hover, 0) * 0.14);
}
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/index.ts"
/*!*********************************************!*\
  !*** ./Dev/src/ui/styles/partials/index.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PARTIAL_CSS_LIST: () => (/* binding */ PARTIAL_CSS_LIST)
/* harmony export */ });
/* harmony import */ var _root__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./root */ "./Dev/src/ui/styles/partials/root.ts");
/* harmony import */ var _dock__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dock */ "./Dev/src/ui/styles/partials/dock.ts");
/* harmony import */ var _glass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./glass */ "./Dev/src/ui/styles/partials/glass.ts");
/* harmony import */ var _tabs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tabs */ "./Dev/src/ui/styles/partials/tabs.ts");
/* harmony import */ var _buttons__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./buttons */ "./Dev/src/ui/styles/partials/buttons.ts");
/* harmony import */ var _controls__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./controls */ "./Dev/src/ui/styles/partials/controls.ts");
/* harmony import */ var _modal__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./modal */ "./Dev/src/ui/styles/partials/modal.ts");
/* harmony import */ var _toast__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./toast */ "./Dev/src/ui/styles/partials/toast.ts");
/* harmony import */ var _activity__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./activity */ "./Dev/src/ui/styles/partials/activity.ts");
/* harmony import */ var _animations__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./animations */ "./Dev/src/ui/styles/partials/animations.ts");
// Aggregator — order matters slightly (root first so its z-index applies,
// glass after dock so the rim pseudo-elements sit on top of the dock surface,
// animations last so its !important overrides win during theme transitions).










const PARTIAL_CSS_LIST = [_root__WEBPACK_IMPORTED_MODULE_0__.ROOT_CSS, _dock__WEBPACK_IMPORTED_MODULE_1__.DOCK_CSS, _glass__WEBPACK_IMPORTED_MODULE_2__.GLASS_CSS, _tabs__WEBPACK_IMPORTED_MODULE_3__.TABS_CSS, _buttons__WEBPACK_IMPORTED_MODULE_4__.BUTTONS_CSS, _controls__WEBPACK_IMPORTED_MODULE_5__.CONTROLS_CSS, _modal__WEBPACK_IMPORTED_MODULE_6__.MODAL_CSS, _toast__WEBPACK_IMPORTED_MODULE_7__.TOAST_CSS, _activity__WEBPACK_IMPORTED_MODULE_8__.ACTIVITY_CSS, _animations__WEBPACK_IMPORTED_MODULE_9__.ANIMATIONS_CSS];

/***/ },

/***/ "./Dev/src/ui/styles/partials/modal.ts"
/*!*********************************************!*\
  !*** ./Dev/src/ui/styles/partials/modal.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MODAL_CSS: () => (/* binding */ MODAL_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Modal — used for the optional dedicated settings dialog (the dock has an
// embedded settings tab; the modal is reserved for any future heavier flows
// like exports or confirmation dialogs).

const MODAL_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-overlay {
    position: fixed; inset: 0;
    z-index: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.Z.modal};
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim);
    -webkit-backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim-blur));
    backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim-blur));
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    opacity: 0;
    transition: opacity 0.25s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-overlay.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-show { opacity: 1; }

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal {
    width: min(420px, 100%);
    max-height: 90vh;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-bg);
    -webkit-backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate)) brightness(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-brightness));
    backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate)) brightness(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-brightness));
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-border);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-glass);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-edge);
    display: flex; flex-direction: column;
    overflow: hidden;
    transform: translateY(20px) scale(0.96); opacity: 0;
    transition: transform 0.28s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-out), opacity 0.25s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-overlay.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-show .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal {
    transform: translateY(0) scale(1); opacity: 1;
}

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-title {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xl);
    font-weight: 600;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    letter-spacing: -0.2px; margin: 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-body { padding: 14px 16px; overflow-y: auto; max-height: 70vh; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-section { margin-bottom: 16px; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-section:last-child { margin-bottom: 0; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-section-title {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    letter-spacing: 0.6px;
    margin: 0 0 8px 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-modal-footer {
    padding: 12px 16px;
    border-top: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
    display: flex; justify-content: flex-end; gap: 8px;
}
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/root.ts"
/*!********************************************!*\
  !*** ./Dev/src/ui/styles/partials/root.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ROOT_CSS: () => (/* binding */ ROOT_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Root mount node — fixed-position invisible host that provides the
// stacking context for the dock, modal, and toast layers. Children opt back
// into pointer-events; the host itself is fully transparent to clicks.

const ROOT_CSS = `
#${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root {
    position: fixed; inset: 0; pointer-events: none;
    z-index: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.Z.dock};
    font-family: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}
#${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-root > * { pointer-events: auto; }
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/tabs.ts"
/*!********************************************!*\
  !*** ./Dev/src/ui/styles/partials/tabs.ts ***!
  \********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TABS_CSS: () => (/* binding */ TABS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Tab strip — three tabs (Capture / Export / Settings). Sits between the
// header and the body. Uses a sliding underline indicator on the active tab
// to mirror the spring motion of the dock-in animation.

const TABS_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabbar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    padding: 6px 8px 0 8px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg);
    border-bottom: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border);
    position: relative; z-index: 1;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn {
    position: relative;
    padding: 8px 4px;
    background: transparent;
    border: none;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-rest);
    font: 600 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm)/1 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    cursor: pointer;
    letter-spacing: 0.1px;
    transition: color 0.18s ease;
    outline: none;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn svg {
    width: 13px; height: 13px;
    opacity: 0.75;
    transition: opacity 0.18s ease;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn:hover { color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-active); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn:hover svg { opacity: 1; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn[aria-selected="true"] {
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-active);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn[aria-selected="true"] svg { opacity: 1; }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn[aria-selected="true"]::after {
    content: "";
    position: absolute;
    left: 12%; right: 12%; bottom: -1px;
    height: 2px;
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-indicator);
    border-radius: 2px 2px 0 0;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-btn:focus-visible {
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring);
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-sm);
}

.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel {
    display: none;
    flex-direction: column;
    gap: 10px;
    animation: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabFade 0.22s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-out);
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tabpanel-active {
    display: flex;
}

/* Group within a tab panel (e.g. section title + content) */
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-group-title {
    font-size: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted);
    letter-spacing: 0.6px;
    margin: 2px 0;
}
`;

/***/ },

/***/ "./Dev/src/ui/styles/partials/toast.ts"
/*!*********************************************!*\
  !*** ./Dev/src/ui/styles/partials/toast.ts ***!
  \*********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TOAST_CSS: () => (/* binding */ TOAST_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Toast stack — bottom-center column-reverse so new toasts push older ones
// up the stack rather than overlapping.

const TOAST_CSS = `
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-container {
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%);
    z-index: ${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.Z.toast};
    display: flex; flex-direction: column-reverse; gap: 8px;
    pointer-events: none;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 14px 9px 12px;
    border-radius: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill);
    background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-bg);
    -webkit-backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate));
    backdrop-filter: blur(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur)) saturate(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate));
    border: 1px solid var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-border);
    box-shadow: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-shadow), var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-edge);
    color: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    font: 500 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md)/1.2 var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font);
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.22s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy), transform 0.22s var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy);
    pointer-events: auto;
    max-width: 380px;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-show { opacity: 1; transform: translateY(0); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
    color: white;
}
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon { background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon { background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-error   .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon { background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info    .${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon { background: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue); }
.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-toast-icon svg { width: 12px; height: 12px; }
`;

/***/ },

/***/ "./Dev/src/ui/styles/tokens.ts"
/*!*************************************!*\
  !*** ./Dev/src/ui/styles/tokens.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TOKENS_CSS: () => (/* binding */ TOKENS_CSS)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Design tokens — the three-tier system (primitives → semantic → component-
// scoped) mirrors the AmexOfferMax token file. Light values live on :root;
// the `html.dtr-theme-dark` block overrides only what differs in dark mode.
//
// Naming: every custom property is prefixed `--dtr-*` to keep us isolated
// from whatever the host page defines. Surfaces are graded E1 (floating
// glass) → E2 (panel) → E3 (interactive plate) → E4 (chip / input).

const TOKENS_CSS = `
:root {
    /* ── TIER 1: Primitives ───────────────────────────────── */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue: #007AFF;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb: 0, 122, 255;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green: #28a745;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb: 40, 167, 69;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange: #d57c00;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb: 213, 124, 0;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red: #d73126;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb: 215, 49, 38;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray: #8E8E93;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb: 142, 142, 147;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-xs: 4px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-sm: 6px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-md: 8px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-lg: 10px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-xl: 12px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-glass: 14px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-radius-pill: 999px;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xs: 10.5px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-sm: 11.5px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-md: 12.5px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-lg: 13.5px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-fs-xl: 15px;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-shadow-sm: 0 2px 6px rgba(0,0,0,0.06);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-shadow-md: 0 5px 16px rgba(0,0,0,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-shadow-lg: 0 12px 32px rgba(0,0,0,0.14);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-shadow-xl: 0 18px 48px rgba(0,0,0,0.20);

    /* ── TIER 2: Semantic ─────────────────────────────────── */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary: #1c1c1e;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary: #3a3a3c;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted: #8E8E93;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-on-accent: #ffffff;

    /* E1 — floating container (dock / modal) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-bg: linear-gradient(135deg, rgba(252,252,254,0.78), rgba(244,246,251,0.66));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-border: rgba(0,0,0,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-shadow: 0 18px 48px rgba(15,30,60,0.18), 0 4px 12px rgba(15,30,60,0.08);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-edge: inset 0 1px 0 rgba(255,255,255,0.85);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-blur: 18px;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-saturate: 165%;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-brightness: 1.04;

    /* E2 — panel / card inside dock */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-bg: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(248,249,253,0.40));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border: rgba(0,0,0,0.08);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-shadow: 0 2px 6px rgba(15,30,60,0.06);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-edge: inset 0 1px 0 rgba(255,255,255,0.70);

    /* E3 — interactive plate (button rest) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg: rgba(255,255,255,0.72);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg-hover: rgba(255,255,255,0.92);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-border: rgba(0,0,0,0.08);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-shadow: 0 1px 2px rgba(15,30,60,0.05);

    /* E4 — chip / status pill */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg: rgba(0,0,0,0.04);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border: rgba(0,0,0,0.06);

    /* Color intents (background-soft / border-stronger) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.25);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb), 0.12);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb), 0.30);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.12);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.30);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.12);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.30);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb), 0.12);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb), 0.30);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-accent-gradient: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.95), rgba(10,132,255, 0.78));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stop-gradient: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.92), rgba(180,35,28, 0.78));

    /* Component-level — status dots */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-live-glow: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-paused-glow: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.16);

    /* Component-level — switch */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-track: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb), 0.20);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-track-on: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb: #ffffff;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb-shadow: 0 1px 3px rgba(0,0,0,0.2);

    /* Component-level — primary button highlight (top edge sheen) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge: inset 0 1px 0 rgba(255,255,255,0.25);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge-hover: inset 0 1px 0 rgba(255,255,255,0.30);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow: 0 4px 12px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.30);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow-hover: 0 6px 16px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.36);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge: inset 0 1px 0 rgba(255,255,255,0.20);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge-hover: inset 0 1px 0 rgba(255,255,255,0.25);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow: 0 4px 12px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.26);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow-hover: 0 6px 16px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.32);

    /* Component-level — rim lighting (dock outer bevel) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-1: rgba(15,30,60,0);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-2: rgba(15,30,60,0.04);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-3: rgba(15,30,60,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-1: multiply;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-2: overlay;

    /* Tab strip */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-rest: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-active: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-active-bg: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-tab-indicator: var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-focus-ring: 0 0 0 3px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.25);

    /* Scrim (modal overlay backdrop) */
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim: rgba(15,20,30, 0.42);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim-blur: 4px;
}

/* ── DARK theme — overrides only the deltas ─────────────────── */
html.${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.THEME_CLASS} {
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue: #0A84FF;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb: 10, 132, 255;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green: #34C759;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb: 52, 199, 89;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange: #FF9500;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb: 255, 149, 0;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red: #FF453A;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb: 255, 69, 58;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray: #A2A2A7;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb: 162, 162, 167;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-primary: #f3f3f6;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-secondary: #d4d6dc;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-muted: #9a9aa0;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-text-on-accent: #ffffff;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-bg: linear-gradient(135deg, rgba(28,30,38,0.78), rgba(18,20,28,0.66));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-border: rgba(255,255,255,0.12);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-shadow: 0 20px 56px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.40);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E1-edge: inset 0 1px 0 rgba(255,255,255,0.08);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-bg: linear-gradient(180deg, rgba(40,42,52,0.55), rgba(28,30,38,0.40));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-border: rgba(255,255,255,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-shadow: 0 4px 12px rgba(0,0,0,0.45);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E2-edge: inset 0 1px 0 rgba(255,255,255,0.06);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg: rgba(255,255,255,0.06);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-bg-hover: rgba(255,255,255,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-border: rgba(255,255,255,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E3-shadow: 0 1px 2px rgba(0,0,0,0.35);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-bg: rgba(255,255,255,0.06);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-E4-border: rgba(255,255,255,0.08);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-info-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.35);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb), 0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-success-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-green-rgb), 0.35);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-warning-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.35);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.20);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-danger-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.40);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-soft: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb), 0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-neutral-border: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-gray-rgb), 0.30);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-accent-gradient: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.85), rgba(0,98,204, 0.65));
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-stop-gradient: linear-gradient(135deg, rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.82), rgba(180,40,30, 0.65));

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-live-glow: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.22);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-status-paused-glow: rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-orange-rgb), 0.20);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-track: rgba(255,255,255,0.16);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb: #f3f3f6;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-switch-thumb-shadow: 0 1px 3px rgba(0,0,0,0.45);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge: inset 0 1px 0 rgba(255,255,255,0.18);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-edge-hover: inset 0 1px 0 rgba(255,255,255,0.24);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow: 0 4px 14px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.38);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-primary-shadow-hover: 0 6px 18px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-blue-rgb), 0.45);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge: inset 0 1px 0 rgba(255,255,255,0.14);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-edge-hover: inset 0 1px 0 rgba(255,255,255,0.20);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow: 0 4px 14px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.36);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-btn-danger-shadow-hover: 0 6px 18px rgba(var(--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-color-red-rgb), 0.42);

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-1: rgba(255,255,255,0);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-2: rgba(255,255,255,0.05);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-color-3: rgba(255,255,255,0.10);
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-1: screen;
    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-blend-2: overlay;

    --${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-scrim: rgba(0,0,0,0.62);
}
`;

/***/ },

/***/ "./Dev/src/ui/utils/rimLighting.ts"
/*!*****************************************!*\
  !*** ./Dev/src/ui/utils/rimLighting.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attachRimLighting: () => (/* binding */ attachRimLighting)
/* harmony export */ });
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../bootstrap/config */ "./Dev/src/bootstrap/config.ts");
// Mouse-tracked rim lighting. Writes three custom properties on the element
// every mousemove; the corresponding pseudo-element gradients in
// styles/partials/glass.ts read them via var(--dtr-rim-mx / -my / -hover).
//
// Values:
//   --dtr-rim-mx     : -50..50  (horizontal position relative to center, %)
//   --dtr-rim-my     : -50..50
//   --dtr-rim-hover  : 0|1      (binary, gates extra opacity boost)

const MX = `--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-mx`;
const MY = `--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-my`;
const HOVER = `--${_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.NS}-rim-hover`;
function attachRimLighting(el) {
  const set = (mx, my, hover) => {
    el.style.setProperty(MX, String(mx));
    el.style.setProperty(MY, String(my));
    el.style.setProperty(HOVER, String(hover));
  };
  el.addEventListener('mouseenter', () => set(0, 0, 1));
  el.addEventListener('mouseleave', () => set(0, 0, 0));
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const mx = ((e.clientX - r.left) / r.width - 0.5) * 100;
    const my = ((e.clientY - r.top) / r.height - 0.5) * 100;
    set(mx, my, 1);
  });
}

/***/ },

/***/ "./Dev/src/utils/dom.ts"
/*!******************************!*\
  !*** ./Dev/src/utils/dom.ts ***!
  \******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   h: () => (/* binding */ h)
/* harmony export */ });
// Tiny element factory. Not JSX — just a typed wrapper around
// `document.createElement` so component files stay declarative.
//
// `attrs` accepts a mix of:
//   - 'class' / 'text' / 'html' as shorthands
//   - 'style' as a CSSStyleDeclaration partial
//   - 'aria' object for batched aria-* attrs
//   - 'onXxx' for event listeners
//   - any other string key → setAttribute
//
// Children may be strings (auto text nodes) or Elements.
function h(tag, attrs, children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') {
        el.className = String(v);
      } else if (k === 'style' && typeof v === 'object') {
        Object.assign(el.style, v);
      } else if (k === 'text') {
        el.textContent = String(v);
      } else if (k === 'html') {
        el.innerHTML = String(v);
      } else if (k === 'aria' && typeof v === 'object' && v !== null) {
        for (const [ak, av] of Object.entries(v)) {
          el.setAttribute(`aria-${ak}`, String(av));
        }
      } else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }
  if (children !== undefined && children !== null) {
    const list = Array.isArray(children) ? children : [children];
    for (const c of list) {
      if (c == null || c === false) continue;
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));else el.appendChild(c);
    }
  }
  return el;
}

/***/ },

/***/ "./Dev/src/utils/throughput.ts"
/*!*************************************!*\
  !*** ./Dev/src/utils/throughput.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createRingBuffer: () => (/* binding */ createRingBuffer),
/* harmony export */   estimate: () => (/* binding */ estimate)
/* harmony export */ });
// Throughput estimator over a sliding sample buffer. Used by the task
// registry to compute live ETA + per-second rate for any task that reports
// `done` over time. Pure utility — no Bus, no Store.
//
// Why a ring buffer instead of EMA: producers can emit bursty progress
// (10/sec then 0 for 2 sec), and a window of fixed COUNT lets us compute
// the slope across actual elapsed wall time rather than a tick rate.
const DEFAULT_CAPACITY = 16;
const MIN_SAMPLES = 3;
// Below this window the slope is too noisy — wait for more data.
const MIN_WINDOW_MS = 800;
// Samples older than this are stale (task may have paused) — drop the
// estimate entirely rather than emit a wildly wrong ETA.
const MAX_WINDOW_MS = 10_000;
// Clamp absurd ETAs (e.g. throughput trending toward zero) — null tells
// the UI to render "—" instead of "23h 47m".
const ETA_CLAMP_MS = 24 * 3600 * 1000;
function createRingBuffer(capacity = DEFAULT_CAPACITY) {
  const buf = new Array(capacity);
  let head = 0;
  let count = 0;
  return {
    push(sample) {
      buf[head] = sample;
      head = (head + 1) % capacity;
      if (count < capacity) count++;
    },
    first() {
      if (count === 0) return undefined;
      const idx = (head - count + capacity) % capacity;
      return buf[idx];
    },
    last() {
      if (count === 0) return undefined;
      return buf[(head - 1 + capacity) % capacity];
    },
    get size() {
      return count;
    },
    clear() {
      head = 0;
      count = 0;
      for (let i = 0; i < capacity; i++) buf[i] = undefined;
    }
  };
}
function estimate(buf, total) {
  if (buf.size < MIN_SAMPLES) return {
    throughputPerSec: 0,
    etaMs: null
  };
  const first = buf.first();
  const last = buf.last();
  if (!first || !last) return {
    throughputPerSec: 0,
    etaMs: null
  };
  const elapsedMs = last.t - first.t;
  if (elapsedMs < MIN_WINDOW_MS) return {
    throughputPerSec: 0,
    etaMs: null
  };
  // Discard if the most recent sample is itself stale — the task has
  // gone quiet, no reliable ETA from old data.
  if (Date.now() - last.t > MAX_WINDOW_MS) {
    return {
      throughputPerSec: 0,
      etaMs: null
    };
  }
  const deltaDone = last.done - first.done;
  if (deltaDone <= 0) return {
    throughputPerSec: 0,
    etaMs: null
  };
  const throughputPerSec = deltaDone / elapsedMs * 1000;
  const remaining = Math.max(0, total - last.done);
  if (throughputPerSec <= 0) return {
    throughputPerSec: 0,
    etaMs: null
  };
  const etaMs = remaining / throughputPerSec * 1000;
  if (etaMs > ETA_CLAMP_MS) {
    return {
      throughputPerSec,
      etaMs: null
    };
  }
  return {
    throughputPerSec,
    etaMs
  };
}

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*************************!*\
  !*** ./Dev/src/main.ts ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _bootstrap_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bootstrap/config */ "./Dev/src/bootstrap/config.ts");
/* harmony import */ var _bootstrap_serviceFactory__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bootstrap/serviceFactory */ "./Dev/src/bootstrap/serviceFactory.ts");
/* harmony import */ var _bootstrap_renderEngine_renderEngine__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./bootstrap/renderEngine/renderEngine */ "./Dev/src/bootstrap/renderEngine/renderEngine.ts");
/* harmony import */ var _bootstrap_initializer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./bootstrap/initializer */ "./Dev/src/bootstrap/initializer.ts");
/* harmony import */ var _bootstrap_domReady__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./bootstrap/domReady */ "./Dev/src/bootstrap/domReady.ts");
/* harmony import */ var _extractor_discourse__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./extractor/discourse */ "./Dev/src/extractor/discourse.ts");
// Entry point. Webpack BannerPlugin prepends header.txt verbatim so the
// userscript manager sees the @grant / @match metadata before this code.
//
// Builds the service bag once, hands it to the renderEngine + initializer,
// kicks the SPA-aware boot poll. Warmup promises (topic readiness) start
// resolving in parallel with service wiring so the boot path can fail fast.






const services = (0,_bootstrap_serviceFactory__WEBPACK_IMPORTED_MODULE_1__.createApplicationServices)(_bootstrap_config__WEBPACK_IMPORTED_MODULE_0__.SCRIPT_CONFIG);
const warmup = {
  topicReadyPromise: Promise.resolve({
    isDiscourse: typeof document !== 'undefined' ? (0,_extractor_discourse__WEBPACK_IMPORTED_MODULE_5__.isDiscoursePage)() : false
  })
};
services.logMain.info('warmup', {
  message: 'topic detection initiated'
});
const {
  renderEngine
} = (0,_bootstrap_renderEngine_renderEngine__WEBPACK_IMPORTED_MODULE_2__.createRenderEngine)(services);
const initializer = (0,_bootstrap_initializer__WEBPACK_IMPORTED_MODULE_3__.createInitializer)({
  ...services,
  renderEngine,
  warmup
});
(0,_bootstrap_domReady__WEBPACK_IMPORTED_MODULE_4__.onDomReady)(() => {
  void initializer.boot();
  initializer.bootPoll();
});
})();

/******/ })()
;
//# sourceMappingURL=discourse-text-recorder.user.js.map