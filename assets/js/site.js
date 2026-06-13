/* ==========================================================
   AI × 经济日报 · 站点主页交互逻辑
   - 实时日期印章
   - 报告生成状态提示（基于时段推断）
   ========================================================== */

(function () {
  'use strict';

  /* ---------- 1. 日期印章 + Footer 时间 ---------- */
  function updateDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const wk = weekdays[now.getDay()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const stamp = document.getElementById('dateStamp');
    if (stamp) stamp.textContent = '📅 ' + y + '-' + m + '-' + d + ' · 星期' + wk;

    const ft = document.getElementById('footerTime');
    if (ft) ft.textContent = '最近更新：' + y + '-' + m + '-' + d + ' ' + hh + ':' + mm;
  }

  /* ---------- 2. 报告生成状态（基于时段推断，UTC+8 校正 P3-2） ---------- */
  function updateReportStatus() {
    /* Date.getHours() 取的是本地时区；部署在 GitHub Pages 走的是 UTC。
       为保证所有时区用户看到的"早 8 / 午 12 / 晚 20"统一是北京时间，
       显式按 UTC+8 偏移计算小时。 */
    const now = new Date();
    const beijingMs = now.getTime() + (now.getTimezoneOffset() + 8 * 60) * 60 * 1000;
    const beijing = new Date(beijingMs);
    const hour = beijing.getUTCHours();

    const metas = {
      morning: { readyAfter: 8,  label: '晨报 · 08:00' },
      noon:    { readyAfter: 12, label: '午报 · 12:00' },
      evening: { readyAfter: 20, label: '晚报 · 20:00' }
    };
    const cards = document.querySelectorAll('[data-report]');
    cards.forEach(function (el) {
      const key = el.getAttribute('data-report');
      const meta = metas[key];
      if (!meta) return;
      if (hour >= meta.readyAfter) {
        el.textContent = '✓ ' + meta.label + ' · 已发布';
        el.style.color = '#1a8f3c';
        el.style.fontWeight = '600';
      } else {
        el.textContent = '◷ ' + meta.label + ' · 等待中';
        el.style.color = '#9a8a73';
        el.style.fontWeight = '500';
      }
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    updateDate();
    updateReportStatus();
    setInterval(updateDate, 60 * 1000);
    initGlitch();
    initScrollReveal();
    initSilhouetteTracker(); /* 初始化版块剪影（A: 版块接力 + D: 字重呼吸） */
    initBackToTop();         /* P4-3 返回顶部 */
    initKeyboardShortcuts(); /* P4-5 键盘快捷键 */
  }

  /* ---------- 6. Service Worker 注册（P4-1 离线缓存） ---------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/ai-daily-report/sw.js').catch(function (err) {
        console.debug('[SW] skip:', err && err.message);
      });
    });
  }

  /* ---------- 7. 返回顶部按钮（P4-3） ---------- */
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var hero = document.getElementById('heroTitle');
      if (hero) hero.setAttribute('tabindex', '-1');
      setTimeout(function () { if (hero) hero.focus({ preventScroll: true }); }, reduce ? 0 : 400);
    });
  }

  /* ---------- 8. 键盘快捷键（P4-5） ---------- */
  function initKeyboardShortcuts() {
    if (!document.getElementById('hero')) return;
    var helpVisible = false;
    var helpEl = null;
    function showHelp() {
      if (helpEl) return;
      helpEl = document.createElement('div');
      helpEl.className = 'kbd-help';
      helpEl.setAttribute('role', 'dialog');
      helpEl.setAttribute('aria-label', '键盘快捷键帮助');
      helpEl.innerHTML =
        '<div class="kbd-help-inner">' +
        '<h3>⌨️ 键盘快捷键</h3>' +
        '<dl><dt><kbd>J</kbd> / <kbd>↓</kbd></dt><dd>向下滚动一段</dd>' +
        '<dt><kbd>K</kbd> / <kbd>↑</kbd></dt><dd>向上滚动一段</dd>' +
        '<dt><kbd>G</kbd> / <kbd>Home</kbd></dt><dd>跳到页面顶部</dd>' +
        '<dt><kbd>H</kbd> / <kbd>End</kbd></dt><dd>跳到页面底部</dd>' +
        '<dt><kbd>?</kbd></dt><dd>显示 / 隐藏此帮助</dd>' +
        '<dt><kbd>Esc</kbd></dt><dd>关闭弹层</dd></dl>' +
        '<p class="kbd-hint">在输入框内自动失效</p></div>';
      document.body.appendChild(helpEl);
      requestAnimationFrame(function () { helpEl.classList.add('visible'); });
      helpVisible = true;
    }
    function hideHelp() {
      if (!helpEl) return;
      helpEl.classList.remove('visible');
      setTimeout(function () {
        if (helpEl && helpEl.parentNode) helpEl.parentNode.removeChild(helpEl);
        helpEl = null;
      }, 250);
      helpVisible = false;
    }
    document.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var step = window.innerHeight * 0.85;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var smooth = !reduce;
      switch (e.key) {
        case 'j': case 'J': case 'ArrowDown':
          e.preventDefault(); window.scrollBy({ top: step, behavior: smooth ? 'smooth' : 'auto' }); break;
        case 'k': case 'K': case 'ArrowUp':
          e.preventDefault(); window.scrollBy({ top: -step, behavior: smooth ? 'smooth' : 'auto' }); break;
        case 'g': case 'G': case 'Home':
          e.preventDefault(); window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' }); break;
        case 'h': case 'H': case 'End':
          e.preventDefault(); window.scrollTo({ top: document.body.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); break;
        case '?': e.preventDefault(); helpVisible ? hideHelp() : showHelp(); break;
        case 'Escape': if (helpVisible) { e.preventDefault(); hideHelp(); } break;
      }
    });
  }

  /* ---------- 3. Hero 标题故障动画（hover 触发） ---------- */
  function initGlitch() {
    const heroTitle = document.getElementById('heroTitle');
    if (!heroTitle) return;
    let timer = null;
    function trigger() {
      heroTitle.classList.remove('glitch-active');
      void heroTitle.offsetWidth; /* 强制重排，让动画重新触发 */
      heroTitle.classList.add('glitch-active');
    }
    heroTitle.addEventListener('mouseenter', trigger);
    /* 移动端 tap 触发（仅触屏设备） */
    heroTitle.addEventListener('touchstart', function () {
      trigger();
      if (timer) clearTimeout(timer);
      timer = setTimeout(trigger, 450);
    }, { passive: true });
    heroTitle.addEventListener('animationend', function () {
      heroTitle.classList.remove('glitch-active');
    });
  }

  /* ========== 4. 滚动淡入动画（Intersection Observer）========== */
  function initScrollReveal() {
    const targets = document.querySelectorAll(
      '.section-head, .report-card, .about-item, .paper-footer .footer-line'
    );

    if (!targets.length) return;

    /* 无障碍：reduced-motion 时直接全部显示，不走 IntersectionObserver */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // 只触发一次
        }
      });
    }, {
      threshold: 0.1, /* 10% 可见时触发 */
      rootMargin: '0px 0px -50px 0px' /* 提前 50px 触发 */
    });

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ========== 5. 全局版块剪影（A: 版块接力 + D: 字重呼吸）========== */
  function initSilhouetteTracker() {
    var silhouette = document.getElementById('globalSilhouette');
    var textEl = document.getElementById('silhouetteText');
    if (!silhouette || !textEl) { return; }

    /* 无障碍检测 */
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* 版块定义（按页面顺序） */
    var sections = [
      { el: document.querySelector('.hero'),    text: 'AI × 经济日报' },
      { el: document.querySelector('.reports'), text: '每日三报'       },
      { el: document.querySelector('.about'),   text: 'AI × ECONOMY'  }
    ].filter(function (s) { return s.el; });

    if (!sections.length) { return; }

    var currentSection = sections[0];
    var currentText     = sections[0].text;
    var breatheRAF      = null;
    var transitionTimer = null;
    var sectionRatios   = new Map(); /* IntersectionObserver 记录各 section 可见率 */

    /* ---------- 文字淡入淡出切换 ---------- */
    function setText(newText) {
      if (newText === currentText) { return; }
      currentText = newText;

      if (transitionTimer) { clearTimeout(transitionTimer); }

      var duration = prefersReduced ? 0 : 180;
      textEl.style.transition = prefersReduced ? 'none' : 'opacity 0.35s ease';
      textEl.style.opacity = '0';

      transitionTimer = setTimeout(function () {
        textEl.textContent = newText;
        textEl.style.opacity = '1';
        transitionTimer = null;
      }, duration);
    }

    /* ---------- 字重呼吸：scale 正弦微振 ---------- */
    function getScrollRatio(sectionEl) {
      var rect   = sectionEl.getBoundingClientRect();
      var viewH  = window.innerHeight;
      if (rect.height <= 0) { return 0.5; }
      /* 版块中心相对于视口中心的偏离度 → 0..1 */
      var center = rect.top + rect.height / 2;
      var ratio  = 1 - (center / viewH);
      return Math.max(0, Math.min(1, ratio));
    }

    function breathe() {
      if (!currentSection || prefersReduced) {
        breatheRAF = null;
        return;
      }
      var r  = getScrollRatio(currentSection.el);
      /* scale 在 0.985 ↔ 1.015 之间正弦呼吸 */
      var bs = 1 + Math.sin(r * Math.PI) * 0.015;
      silhouette.style.transform = 'scale(' + bs.toFixed(4) + ')';
      breatheRAF = requestAnimationFrame(breathe);
    }

    /* ---------- IntersectionObserver：检测最可见版块 ---------- */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sectionRatios.set(entry.target, entry.intersectionRatio);
      });

      /* 找出可见率最高的 section */
      var bestTarget = null;
      var bestRatio  = 0;
      sectionRatios.forEach(function (ratio, target) {
        if (ratio > bestRatio) { bestRatio = ratio; bestTarget = target; }
      });

      /* 阈值 0.15：section 可见度 >15% 才切换 */
      if (bestTarget && bestRatio > 0.15) {
        var match = null;
        for (var i = 0; i < sections.length; i++) {
          if (sections[i].el === bestTarget) { match = sections[i]; break; }
        }
        if (match) {
          currentSection = match;
          setText(match.text);
          silhouette.style.opacity = '0.04';

          if (!breatheRAF && !prefersReduced) {
            breatheRAF = requestAnimationFrame(breathe);
          }
        }
      } else {
        /* 无版块明显可见 → 渐隐 */
        silhouette.style.opacity = '0';
        if (breatheRAF) {
          cancelAnimationFrame(breatheRAF);
          breatheRAF = null;
        }
      }
    }, {
      threshold: [0, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    });

    /* 观察所有版块 */
    sections.forEach(function (s) { observer.observe(s.el); });

    /* 初始状态 */
    silhouette.style.opacity = '0.04';
    silhouette.style.transform = 'scale(1)';
    textEl.textContent = currentText;
    textEl.style.opacity = '1';

    if (!prefersReduced) {
      breatheRAF = requestAnimationFrame(breathe);
    }

    /* 后台标签页暂停呼吸，切回时恢复 */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (breatheRAF) { cancelAnimationFrame(breatheRAF); breatheRAF = null; }
      } else {
        if (!breatheRAF && !prefersReduced && currentSection) {
          breatheRAF = requestAnimationFrame(breathe);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
