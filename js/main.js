/* HypeFi — Main JS */

(function () {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Sticky Nav ─────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile Menu ────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    const setMenu = (open) => {
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mobileNav.classList.toggle('open', open);
      mobileNav.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    hamburger.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ══════════════════════════════
     HERO — tessellated mesh
     A triangular lattice whose vertices drift around their home
     positions; tiles shimmer on a slow wave and "order-flow" pulses
     travel along the edges.
  ══════════════════════════════ */
  const canvas = document.getElementById('mesh-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, pts = [], tris = [], edges = [], pulses = [];
    let running = false, rafId = 0, inView = true;

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = W < 720 ? 72 : 96;               // lattice spacing
      const h = s * Math.sqrt(3) / 2;
      cols = Math.ceil(W / s) + 3;
      rows = Math.ceil(H / h) + 3;
      pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const hx = (i - 1) * s + (j % 2 ? s / 2 : 0);
          const hy = (j - 1) * h;
          pts.push({
            hx, hy, x: hx, y: hy,
            ax: 4 + Math.random() * 10, ay: 4 + Math.random() * 10,
            ph: Math.random() * Math.PI * 2, sp: 0.00025 + Math.random() * 0.0003,
            glow: Math.random() < 0.05
          });
        }
      }
      const P = (i, j) => j * cols + i;
      tris = []; const edgeSet = new Set(); edges = [];
      const addEdge = (a, b) => {
        const k = a < b ? a + ':' + b : b + ':' + a;
        if (!edgeSet.has(k)) { edgeSet.add(k); edges.push([a, b]); }
      };
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          let t1, t2;
          if (j % 2 === 0) {
            t1 = [P(i, j), P(i + 1, j), P(i, j + 1)];
            t2 = [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
          } else {
            t1 = [P(i, j), P(i + 1, j), P(i + 1, j + 1)];
            t2 = [P(i, j), P(i + 1, j + 1), P(i, j + 1)];
          }
          [t1, t2].forEach(t => {
            tris.push({ v: t, seed: Math.random() * 1000, hot: Math.random() < 0.06 });
            addEdge(t[0], t[1]); addEdge(t[1], t[2]); addEdge(t[2], t[0]);
          });
        }
      }
      // adjacency for pulse routing
      pts.forEach(p => { p.nb = []; });
      edges.forEach(([a, b]) => { pts[a].nb.push(b); pts[b].nb.push(a); });
      pulses = [];
      const n = W < 720 ? 4 : 8;
      for (let k = 0; k < n; k++) pulses.push(newPulse());
    };

    const newPulse = () => {
      const a = Math.floor(Math.random() * pts.length);
      const nb = pts[a].nb;
      return { a, b: nb[Math.floor(Math.random() * nb.length)], t: Math.random(), speed: 0.006 + Math.random() * 0.008, hops: 4 + Math.floor(Math.random() * 8) };
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        p.x = p.hx + Math.cos(time * p.sp + p.ph) * p.ax;
        p.y = p.hy + Math.sin(time * p.sp * 1.3 + p.ph) * p.ay;
      }

      // tiles
      for (const t of tris) {
        const a = pts[t.v[0]], b = pts[t.v[1]], c = pts[t.v[2]];
        const cx = (a.x + b.x + c.x) / 3, cy = (a.y + b.y + c.y) / 3;
        const wave = Math.sin(time * 0.00035 + cx * 0.0045 - cy * 0.003 + t.seed * 0.002);
        let alpha = Math.max(0, wave) * 0.045;
        if (t.hot) alpha += (Math.sin(time * 0.0012 + t.seed) * 0.5 + 0.5) * 0.07;
        if (alpha < 0.004) continue;
        ctx.fillStyle = t.hot ? `rgba(166,194,222,${alpha})` : `rgba(122,163,207,${alpha})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath(); ctx.fill();
      }

      // edges
      ctx.strokeStyle = 'rgba(159,176,199,0.075)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [ai, bi] of edges) { const a = pts[ai], b = pts[bi]; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
      ctx.stroke();

      // vertices
      for (const p of pts) {
        if (p.glow) {
          const g = Math.sin(time * 0.0015 + p.ph) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(139,176,214,${0.35 + g * 0.55})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(139,176,214,${0.06 + g * 0.08})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(159,176,199,0.22)';
          ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
        }
      }

      // order-flow pulses
      for (let k = 0; k < pulses.length; k++) {
        const pl = pulses[k];
        const a = pts[pl.a], b = pts[pl.b];
        const x = a.x + (b.x - a.x) * pl.t, y = a.y + (b.y - a.y) * pl.t;
        const tx = a.x + (b.x - a.x) * Math.max(0, pl.t - 0.35), ty = a.y + (b.y - a.y) * Math.max(0, pl.t - 0.35);
        const grad = ctx.createLinearGradient(tx, ty, x, y);
        grad.addColorStop(0, 'rgba(122,163,207,0)');
        grad.addColorStop(1, 'rgba(181,205,230,0.75)');
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = 'rgba(220,230,240,0.9)';
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();

        if (!reduceMotion) pl.t += pl.speed;
        if (pl.t >= 1) {
          pl.hops--;
          if (pl.hops <= 0) { pulses[k] = newPulse(); pulses[k].t = 0; continue; }
          const nb = pts[pl.b].nb.filter(n => n !== pl.a);
          pl.a = pl.b; pl.b = nb[Math.floor(Math.random() * nb.length)]; pl.t = 0;
        }
      }
    };

    const loop = (time) => {
      draw(time);
      if (running) rafId = requestAnimationFrame(loop);
    };
    const start = () => { if (!running && !reduceMotion) { running = true; rafId = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };

    build();
    draw(0);
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden || !inView ? stop() : start()));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { const w = canvas.clientWidth; if (Math.abs(w - W) > 1 || Math.abs(canvas.clientHeight - H) > 120) { build(); draw(performance.now()); } }, 150);
    });
  }

  /* ── Multi-select Checkboxes (form page) ────────────── */
  document.querySelectorAll('.check-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('selected');
      const box = opt.querySelector('.check-box');
      if (box) box.textContent = opt.classList.contains('selected') ? '✓' : '';
    });
  });

  /* ── Textarea character count ───────────────────────── */
  document.querySelectorAll('textarea[data-max]').forEach(ta => {
    const max = parseInt(ta.dataset.max);
    const counter = ta.closest('.form-group')?.querySelector('.char-count');
    if (!counter) return;
    const update = () => {
      const rem = max - ta.value.length;
      counter.textContent = `${ta.value.length} / ${max} characters`;
      counter.style.color = rem < 30 ? '#C88A8A' : '';
    };
    ta.addEventListener('input', update);
    update();
  });

  /* ── Multi-step Form ────────────────────────────────── */
  const steps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressLabels = document.querySelectorAll('.progress-label');
  let currentStep = 0;
  let initialised = false;

  function showStep(idx) {
    steps.forEach((s, i) => {
      s.style.display = i === idx ? 'block' : 'none';
    });
    progressSteps.forEach((p, i) => {
      p.classList.toggle('active', i === idx);
      p.classList.toggle('done', i < idx);
    });
    progressLabels.forEach((l, i) => {
      l.classList.toggle('active', i === idx);
    });
    currentStep = idx;
    if (initialised) document.querySelector('.form-wrapper')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep < steps.length - 1) showStep(currentStep + 1);
    });
  });
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentStep > 0) showStep(currentStep - 1);
    });
  });

  if (steps.length) showStep(0);
  initialised = true;

  /* ── Upload Zone Drag & Drop ────────────────────────── */
  document.querySelectorAll('.upload-zone').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length) handleFileUpload(zone, files[0]);
    });
    const input = zone.querySelector('input[type="file"]');
    if (input) {
      input.addEventListener('change', () => {
        if (input.files.length) handleFileUpload(zone, input.files[0]);
      });
    }
  });

  function handleFileUpload(zone, file) {
    const title = zone.querySelector('.upload-title');
    const sub = zone.querySelector('.upload-sub');
    if (title) title.textContent = file.name;
    if (sub) sub.innerHTML = `<span>${formatBytes(file.size)}</span> — ready to upload`;
    zone.classList.add('has-file');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /* ── Form Submission (placeholder) ─────────────────── */
  const submitForm = document.getElementById('submitForm');
  if (submitForm) {
    submitForm.addEventListener('click', (e) => {
      e.preventDefault();
      const formCard = document.querySelector('.form-card');
      if (!formCard) return;
      formCard.innerHTML = `
        <div class="form-success">
          <div class="form-success-mark" aria-hidden="true">✓</div>
          <h2>Analysis Submitted</h2>
          <p>Your deck is in the queue. We'll send your AI-powered investor match report to your email within <strong>24–48 hours</strong>.</p>
          <a href="index.html" class="btn-next">Return Home</a>
        </div>`;
    });
  }

  /* ── Scroll Reveal ──────────────────────────────────── */
  const revealTargets = document.querySelectorAll(
    '.process-step, .work-col, .segment-card, .service-card, .receive-card, .engagement-card, .stat-card, .pillar, .process-insight'
  );
  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(el => {
      el.classList.add('reveal');
      const siblings = Array.from(el.parentElement.children).filter(c => c.matches(el.tagName));
      el.style.transitionDelay = `${Math.max(0, siblings.indexOf(el)) % 6 * 80}ms`;
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.add('visible');
          observer.unobserve(el);
          // hand the element back to its own hover transitions once revealed
          setTimeout(() => {
            el.classList.remove('reveal', 'visible');
            el.style.transitionDelay = '';
          }, 900 + (parseFloat(el.style.transitionDelay) || 0));
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  }

})();
