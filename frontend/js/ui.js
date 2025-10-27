/* ===========================
   SmartBankPlus • BlueWave Pro
   UI utilities: theme toggle, keyboard shortcuts, reveals,
   counters, and GPU-friendly star/wave background.
   =========================== */

/* Early theme (in HTML head you’ll set it too, but keep a runtime toggle) */
export function toggleTheme(){
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

/* Keyboard shortcuts (T for theme, V for chatbot panel if present) */
export function bindShortcuts(){
  const panel = document.getElementById('sb-bot-panel');
  document.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(k === 't') toggleTheme();
    if(k === 'v' && panel) panel.classList.toggle('hidden');
  });
}

/* Reveal on scroll */
export function revealOnScroll(){
  const els = document.querySelectorAll('.sb-reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold:.18 });
  els.forEach(el=>io.observe(el));
}

/* Counters */
export function bindCounters(){
  const counters = document.querySelectorAll('[data-sb-counter]');
  if (!counters.length) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches){
    counters.forEach(el=>{
      el.textContent = Number(el.dataset.sbCounter).toLocaleString();
    });
    return;
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el = e.target; const target = parseInt(el.dataset.sbCounter, 10);
      const start = performance.now(), dur = 1100;
      function tick(now){
        const p = Math.min(1, (now - start)/dur);
        const v = Math.floor(target * (0.12 + 0.88 * p*p));
        el.textContent = v.toLocaleString();
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold:.4 });
  counters.forEach(el=>io.observe(el));
}

/* GPU-friendly BlueWave star/wave background */
export function blueWaveBackground(){
  const canvas = document.getElementById('sb-bg-layer');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars;

  function resize(){
    const dpr = devicePixelRatio || 1;
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    spawn();
  }
  function spawn(){
    const count = Math.min(240, Math.floor((innerWidth * innerHeight)/11000));
    const dpr = devicePixelRatio || 1;
    stars = Array.from({length: count}).map(()=>({
      x: Math.random()*W, y: Math.random()*H,
      r: (Math.random()*1.8 + .4) * dpr,
      s: Math.random()*0.4 + 0.1
    }));
  }

  let t = 0;
  function loop(){
    t += 0.0025;
    ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    // subtle vertical wave band
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0, 'rgba(0,119,255,0.10)');
    g.addColorStop(0.5, 'rgba(0,119,255,0.06)');
    g.addColorStop(1, 'rgba(0,119,255,0.10)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // stars with soft drift
    ctx.fillStyle = 'rgba(140,180,255,.75)';
    for (const st of stars){
      const y = st.y + Math.sin((st.x*0.0008)+t)*0.6;
      ctx.beginPath();
      ctx.arc(st.x, y, st.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }

  resize(); loop();
  addEventListener('resize', resize, { passive:true });
}

/* Optional FAB panel wire-up */
export function bindFab(){
  const fab = document.getElementById('sb-bot-fab');
  const panel = document.getElementById('sb-bot-panel');
  const close = document.getElementById('sb-bot-close');
  if(!fab || !panel || !close) return;
  fab.addEventListener('click', ()=> panel.classList.toggle('hidden'));
  close.addEventListener('click', ()=> panel.classList.add('hidden'));
}

/* Init all */
export function initBlueWave(){
  bindShortcuts();
  revealOnScroll();
  bindCounters();
  blueWaveBackground();
  bindFab();
}
