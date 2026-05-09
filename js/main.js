/* HypeFi — Main JS */

(function () {

  /* ── Sticky Nav ─────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile Hamburger ───────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
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
      counter.style.color = rem < 30 ? '#e05c5c' : '';
    };
    ta.addEventListener('input', update);
    update();
  });

  /* ── Multi-step Form ────────────────────────────────── */
  const steps = document.querySelectorAll('.form-step');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressLabels = document.querySelectorAll('.progress-label');
  let currentStep = 0;

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    zone.style.borderColor = 'var(--teal)';
    zone.style.background = 'rgba(47,95,91,0.06)';
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
        <div style="text-align:center;padding:60px 20px">
          <div style="font-size:52px;margin-bottom:24px">🎯</div>
          <h2 style="font-family:var(--font-display);font-size:28px;color:var(--charcoal);margin-bottom:12px;font-weight:700">Analysis Submitted</h2>
          <p style="font-size:16px;color:var(--text-secondary);line-height:1.7;max-width:440px;margin:0 auto 36px">
            Your deck is in the queue. We'll send your AI-powered investor match report to your email within <strong>24–48 hours</strong>.
          </p>
          <a href="index.html" style="display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:var(--soft-white);font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none">
            Return Home
          </a>
        </div>`;
    });
  }

  /* ── Scroll Reveal ──────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const style = document.createElement('style');
    style.textContent = `
      .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.55s ease, transform 0.55s ease; }
      .reveal.visible { opacity: 1; transform: none; }
    `;
    document.head.appendChild(style);

    const revealTargets = document.querySelectorAll(
      '.process-step, .segment-card, .service-card, .receive-card, .engagement-card'
    );
    revealTargets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 6) * 70}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach(el => observer.observe(el));
  }

})();
