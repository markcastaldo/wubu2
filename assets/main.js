// terminalcore // ASCII field + mouse parallax
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- ASCII background field ----------
  const canvas = document.getElementById("field");
  const ctx = canvas.getContext("2d");
  const RAMP = " .,:;-=+*#%@";
  const CMYK = ["#00aeef", "#ec008c", "#f5c400"];
  const CELL = 14;
  let cols, rows, dpr;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `12px "JetBrains Mono", monospace`;
    ctx.textBaseline = "top";
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
  }

  // cheap layered sine "noise"
  const n = (x, y, t) =>
    Math.sin(x * 0.11 + t * 0.6) * Math.cos(y * 0.13 - t * 0.4) +
    Math.sin((x + y) * 0.05 + t * 0.3) * 0.6 +
    Math.sin(Math.hypot(x - cols / 2, y - rows / 2) * 0.18 - t) * 0.4;

  // mouse in -1..1, smoothed
  let mx = 0, my = 0, tx = 0, ty = 0, px = -9999, py = -9999;
  addEventListener("pointermove", (e) => {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
    px = e.clientX + 40; // canvas is offset by -40px
    py = e.clientY + 40;
    const hx = document.getElementById("hud-xy");
    if (hx) hx.innerHTML = `X<b>${String(e.clientX).padStart(4, "0")}</b> Y<b>${String(e.clientY).padStart(4, "0")}</b>`;
  });
  // gentle tilt on phones
  addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    tx = Math.max(-1, Math.min(1, e.gamma / 30));
    ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  });

  function draw(t) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    const lx = (px - mx * 28) / CELL, ly = (py - my * 28) / CELL;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let v = (n(x, y, t) + 2) / 4; // ~0..1
        const d = Math.hypot(x - lx, y - ly);
        const glow = d < 9 ? 1 - d / 9 : 0;
        v = v * 0.55 + glow * 0.6;
        const i = Math.max(0, Math.min(RAMP.length - 1, (v * RAMP.length) | 0));
        const ch = RAMP[i];
        if (ch === " ") continue;
        // pops of colour: rare cells + near the cursor
        const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        const r = hash - Math.floor(hash);
        if (glow > 0.25 && r > 0.55) ctx.fillStyle = CMYK[(r * 30 | 0) % 3];
        else if (r > 0.996 && v > 0.45) ctx.fillStyle = CMYK[(x + y) % 3];
        else {
          const g = 235 - v * 120 - glow * 150;
          ctx.fillStyle = `rgb(${g},${g},${g})`;
        }
        ctx.fillText(ch, x * CELL, y * CELL);
      }
    }
  }

  // ---------- parallax ----------
  const ui = document.querySelector(".ui");
  const hud = document.querySelector(".hud");
  let last = 0;
  function frame(now) {
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    canvas.style.transform = `translate3d(${-mx * 28}px, ${-my * 28}px, 0)`;
    if (hud) hud.style.transform = `translate3d(${-mx * 10}px, ${-my * 10}px, 0)`;
    if (ui) ui.style.transform = `translate3d(${mx * 10}px, ${my * 10}px, 0)`;
    if (now - last > 66) { // ~15fps for the field keeps CPU low
      draw(now / 1000);
      last = now;
    }
    requestAnimationFrame(frame);
  }

  size();
  addEventListener("resize", size);
  if (reduce) draw(0);
  else requestAnimationFrame(frame);

  // ---------- HUD clock ----------
  const clock = document.getElementById("hud-clock");
  if (clock) {
    const tick = () => (clock.textContent = new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    setInterval(tick, 1000);
  }

  // ---------- boot typing ----------
  const typed = [...document.querySelectorAll("[data-type]")];
  let delay = 120;
  typed.forEach((el) => {
    const text = el.textContent;
    if (reduce) { el.classList.add("typed"); return; }
    el.textContent = "";
    setTimeout(() => {
      el.classList.add("typed");
      let i = 0;
      const step = () => {
        el.textContent = text.slice(0, ++i);
        if (i < text.length) setTimeout(step, 14 + Math.random() * 22);
      };
      step();
    }, delay);
    delay += text.length * 20 + 120;
  });

  // ---------- newsletter (optional) ----------
  const form = document.querySelector(".news form");
  if (form) {
    form.addEventListener("submit", (e) => {
      const status = form.parentElement.querySelector(".status");
      // If no real newsletter service is wired up yet, don't pretend.
      if (!form.getAttribute("action")) {
        e.preventDefault();
        status.textContent = "> newsletter coming soon. grab the packs, no strings.";
      }
    });
  }
})();
