/* ==========================================================================
   IRON EDGE FITNESS — main.js
   Global behaviour shared by every page: component includes, navbar state,
   theme + language, loader, reveal-on-scroll, counters, search / notif /
   chat UI shells, and third-party widget init (AOS, Chart.js, Swiper).

   NOTE: Loading components/*.html via fetch() requires the site to be
   served over http(s) (e.g. VS Code "Live Server", `npx serve`, Firebase
   Hosting). Opening index.html directly with file:// will block fetch()
   due to browser CORS rules — see README.md.
   ========================================================================== */

(() => {
  'use strict';

  /* ------------------------------------------------------------ helpers */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const IE = {
    config: {
      theme: 'ie-theme',
      lang: 'ie-lang',
    },
  };
  window.IE = IE;

  /* ------------------------------------------------------ component load */
  async function loadComponent(slotSelector, url) {
    const slot = $(slotSelector);
    if (!slot) return null;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      slot.innerHTML = await res.text();
      return slot;
    } catch (err) {
      console.warn('[IronEdge] component load failed:', url, err);
      return null;
    }
  }

  async function includeComponents() {
    const base = document.body.dataset.componentsBase || 'components/';
    await Promise.all([
      loadComponent('#ie-loader-slot', base + 'loader.html'),
      loadComponent('#ie-navbar-slot', base + 'navbar.html'),
      loadComponent('#ie-footer-slot', base + 'footer.html'),
      loadComponent('#ie-chat-slot', base + 'chatbox.html'),
    ]);
    document.dispatchEvent(new CustomEvent('ie:components-ready'));
  }

  /* -------------------------------------------------------------- loader */
  function hideLoader() {
    const loader = $('#ie-loader');
    if (!loader) return;
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 700);
  }

  /* ------------------------------------------------------------- navbar */
  function initNavbar() {
    const nav = $('#ie-navbar');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // active link highlight
    const current = (document.body.dataset.page || '').toLowerCase();
    $$('.ie-nav-links a, .ie-mobile-menu a').forEach((a) => {
      if (a.dataset.page === current) a.classList.add('is-active');
    });

    // mobile menu
    const burger = $('#ie-nav-burger');
    const menu = $('#ie-mobile-menu');
    if (burger && menu) {
      burger.addEventListener('click', () => {
        const open = menu.classList.toggle('is-open');
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.documentElement.style.overflow = open ? 'hidden' : '';
      });
      $$('.ie-mobile-menu a').forEach((a) =>
        a.addEventListener('click', () => {
          menu.classList.remove('is-open');
          burger.classList.remove('is-open');
          document.documentElement.style.overflow = '';
        })
      );
    }

    // notification panel
    const notifBtn = $('#ie-notif-btn');
    const notifPanel = $('#ie-notif-panel');
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('is-open');
      });
      document.addEventListener('click', (e) => {
        if (!notifPanel.contains(e.target)) notifPanel.classList.remove('is-open');
      });
    }

    // search modal
    const searchBtn = $('#ie-search-btn');
    const searchModal = $('#ie-search-modal');
    const searchClose = $('#ie-search-close');
    const searchInput = $('#ie-search-input');
    if (searchBtn && searchModal) {
      const open = () => {
        searchModal.classList.add('is-open');
        setTimeout(() => searchInput && searchInput.focus(), 100);
      };
      const close = () => searchModal.classList.remove('is-open');
      searchBtn.addEventListener('click', open);
      searchClose && searchClose.addEventListener('click', close);
      searchModal.addEventListener('click', (e) => { if (e.target === searchModal) close(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); open(); }
        if (e.key === 'Escape') close();
      });
    }

    // language switcher (persists choice; full i18n wiring is a follow-up module)
    const langSelect = $('#ie-lang-select');
    if (langSelect) {
      langSelect.value = localStorage.getItem(IE.config.lang) || 'en';
      langSelect.addEventListener('change', () => {
        localStorage.setItem(IE.config.lang, langSelect.value);
        document.documentElement.lang = langSelect.value;
      });
    }
  }

  /* --------------------------------------------------------------- theme */
  function initTheme() {
    const stored = localStorage.getItem(IE.config.theme);
    const initial = stored || 'dark';
    document.documentElement.setAttribute('data-theme', initial);

    const toggle = $('#ie-theme-toggle');
    if (!toggle) return;
    const icon = () => toggle.querySelector('i');
    const paint = (theme) => {
      const el = icon();
      if (el) el.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    };
    paint(initial);

    toggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(IE.config.theme, next);
      paint(next);
    });
  }

  /* -------------------------------------------------------- reveal on scroll */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    els.forEach((el, i) => {
      el.style.setProperty('--d', `${(i % 6) * 90}ms`);
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------- counters */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* --------------------------------------------------------- plate dividers */
  function initPlateDividers() {
    const els = $$('.ie-plate-divider');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* -------------------------------------------------------------- back-to-top */
  function initBackToTop() {
    const btn = $('#ie-back-to-top');
    if (!btn) return;
    window.addEventListener(
      'scroll',
      () => btn.classList.toggle('is-visible', window.scrollY > 600),
      { passive: true }
    );
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------------------------------------------------------------- chat shell */
  function initChatShell() {
    const launcher = $('#ie-chat-launcher');
    const panel = $('#ie-chat-panel');
    const closeBtn = $('#ie-chat-close');
    if (!launcher || !panel) return;
    const open = () => { panel.style.display = 'flex'; launcher.style.display = 'none'; };
    const close = () => { panel.style.display = 'none'; launcher.style.display = 'grid'; };
    launcher.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);

    const form = $('#ie-chat-form');
    const input = $('#ie-chat-input');
    const messages = $('#ie-chat-messages');
    if (form && input && messages) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const bubble = document.createElement('div');
        bubble.style.cssText =
          'align-self:flex-end;background:var(--ie-gradient-brand);color:#150c04;padding:10px 14px;border-radius:14px 14px 2px 14px;max-width:80%;font-weight:600;';
        bubble.textContent = text;
        messages.appendChild(bubble);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;
        setTimeout(() => {
          const reply = document.createElement('div');
          reply.style.cssText =
            'align-self:flex-start;background:rgba(255,255,255,0.06);padding:10px 14px;border-radius:14px 14px 14px 2px;max-width:80%;';
          reply.textContent = "Logged. Full AI coaching runs from js/chat.js — this is the UI shell.";
          messages.appendChild(reply);
          messages.scrollTop = messages.scrollHeight;
        }, 500);
      });
    }
  }

  /* --------------------------------------------------------------- footer year */
  function initFooterYear() {
    const y = $('#ie-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------- 3rd party init */
  function initAOS() {
    if (window.AOS) window.AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  function initSwiper() {
    const el = $('.ie-trainers-swiper');
    if (!el || !window.Swiper) return;
    // eslint-disable-next-line no-new
    new window.Swiper(el, {
      slidesPerView: 1.15,
      spaceBetween: 20,
      centeredSlides: false,
      grabCursor: true,
      breakpoints: {
        640: { slidesPerView: 2.1 },
        1024: { slidesPerView: 3.2 },
      },
      pagination: { el: '.ie-trainers-pagination', clickable: true },
    });
  }

  function ringGradient(ctx, colorA, colorB) {
    const g = ctx.createLinearGradient(0, 0, 0, 84);
    g.addColorStop(0, colorA);
    g.addColorStop(1, colorB);
    return g;
  }

  function initGoalRings() {
    if (!window.Chart) return;
    const rings = [
      { id: 'ie-ring-workout', value: 72, colorA: '#ff8f3f', colorB: '#c94e00' },
      { id: 'ie-ring-calories', value: 58, colorA: '#ffb347', colorB: '#ff6a00' },
      { id: 'ie-ring-water', value: 84, colorA: '#4ecbff', colorB: '#1c7fb0' },
    ];
    rings.forEach(({ id, value, colorA, colorB }) => {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          datasets: [
            {
              data: [value, 100 - value],
              backgroundColor: [ringGradient(ctx, colorA, colorB), 'rgba(255,255,255,0.06)'],
              borderWidth: 0,
              cutout: '76%',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          animation: { animateRotate: true, duration: 1200 },
        },
      });
    });
  }

  function initWeeklyChart() {
    if (!window.Chart) return;
    const canvas = document.getElementById('ie-weekly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, 'rgba(255,106,0,0.55)');
    grad.addColorStop(1, 'rgba(255,106,0,0)');
    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            data: [62, 74, 58, 88, 70, 95, 80],
            borderColor: '#ff8f3f',
            backgroundColor: grad,
            fill: true,
            tension: 0.42,
            pointRadius: 0,
            borderWidth: 2.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#8f887f', font: { size: 10 } } },
          y: { display: false },
        },
      },
    });
  }

  /* --------------------------------------------------------------------- boot */
  document.addEventListener('DOMContentLoaded', async () => {
    await includeComponents();
    initTheme();
    initNavbar();
    initReveal();
    initCounters();
    initPlateDividers();
    initBackToTop();
    initChatShell();
    initFooterYear();
    initAOS();
    initSwiper();
    initGoalRings();
    initWeeklyChart();
  });

  window.addEventListener('load', () => setTimeout(hideLoader, 350));
})();
