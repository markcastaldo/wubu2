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
  const texts = typed.map((el) => el.textContent);
  if (!reduce) typed.forEach((el) => (el.textContent = ""));
  function startTyping() {
    let delay = 120;
    typed.forEach((el, k) => {
      const text = texts[k];
      if (reduce) { el.classList.add("typed"); return; }
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
  }

  // ---------- boot screen: types wubu2.exe, plays the logo stinger ----------
  // Runs once per browser session. The <head> script adds .booting before paint.
  const root = document.documentElement;
  if (root.classList.contains("booting")) boot();
  else startTyping();

  function boot() {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const el = document.createElement("div");
    el.id = "boot";
    el.innerHTML =
      '<pre class="boot-term"></pre>' +
      '<video class="boot-video" muted playsinline preload="auto" poster="assets/loader-poster.jpg">' +
      '<source src="assets/loader.mp4" type="video/mp4"></video>' +
      '<button class="boot-skip" type="button">[ skip ]</button>';
    document.body.appendChild(el);
    const term = el.querySelector(".boot-term");
    const video = el.querySelector(".boot-video");
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem("wubu2-booted", "1"); } catch (e) {}
      el.classList.add("out");
      root.classList.remove("booting");
      startTyping();
      setTimeout(() => el.remove(), 700);
    };
    el.querySelector(".boot-skip").addEventListener("click", finish);
    addEventListener("keydown", (e) => { if (e.key === "Escape") finish(); });
    setTimeout(finish, 14000); // never trap anyone on the loader

    const line = (html = "") => { term.innerHTML += html + "\n"; };
    const type = async (prefix, cmd) => {
      term.innerHTML += prefix;
      for (const ch of cmd) {
        if (done) return;
        term.innerHTML += ch;
        await wait(55 + Math.random() * 70);
      }
      term.innerHTML += "\n";
    };

    (async () => {
      line("WUBU2 OS [Version 2.0.26]");
      line("(c) wubu2. all rights reserved.");
      line();
      await wait(350);
      await type("C:\\Users\\guest&gt; ", "wubu2.exe");
      await wait(250);
      const mods = [["bass", "c"], ["compression", "m"], ["synths", "y"]];
      for (const [name, col] of mods) {
        if (done) return;
        line(`loading ${name.padEnd(12, ".")} <b class="ok ${col}">[ OK ]</b>`);
        await wait(220);
      }
      line("launching...");
      await wait(300);
      if (done) return;
      term.classList.add("gone");
      video.classList.add("on");
      video.addEventListener("ended", finish);
      video.addEventListener("error", finish);
      try { await video.play(); } catch (e) { finish(); }
    })();
  }

  // ---------- hero logo: live ASCII render of the chrome logo ----------
  const wrap = document.getElementById("logo");
  if (wrap) {
    const img = wrap.querySelector(".logo-img");
    const cv = wrap.querySelector(".logo-ascii");
    const c2 = cv.getContext("2d");
    const RAMP_L = "@#%&$*+=~-:"; // shadow -> highlight, all visible
    let grid = [], cw = 6, chH = 9;

    const build = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      const d = Math.min(devicePixelRatio || 1, 2);
      cv.width = w * d; cv.height = h * d;
      c2.setTransform(d, 0, 0, d, 0, 0);
      cw = Math.max(5, w / 72); chH = cw * 1.5;
      const cols = Math.floor(w / cw), rows = Math.floor(h / chH);
      if (cols < 2 || rows < 2) return requestAnimationFrame(build);
      const off = document.createElement("canvas");
      off.width = cols; off.height = rows;
      const o = off.getContext("2d");
      o.drawImage(img, 0, 0, cols, rows);
      const px = o.getImageData(0, 0, cols, rows).data;
      grid = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4, a = px[i + 3] / 255;
        if (a < 0.25) continue;
        const lum = (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11) / 255;
        grid.push({ x, y, lum });
      }
      paint();
    };
    const paint = () => {
      c2.clearRect(0, 0, cv.width, cv.height);
      c2.font = `700 ${Math.round(chH * 0.95)}px "JetBrains Mono", monospace`;
      c2.textBaseline = "top";
      const CM = ["#00aeef", "#ec008c", "#d4a800"];
      for (const g of grid) {
        let li = Math.min(RAMP_L.length - 1, (g.lum * RAMP_L.length) | 0);
        if (!reduce && Math.random() < 0.04) li = (Math.random() * (RAMP_L.length - 1)) | 0;
        const r = Math.random();
        c2.fillStyle = r < 0.035 ? CM[(r * 1000 | 0) % 3] : "#000";
        c2.fillText(RAMP_L[li], g.x * cw, g.y * chH);
      }
    };
    const ready = () => { build(); if (!reduce) setInterval(paint, 140); };
    if (img.complete && img.naturalWidth) ready();
    else img.addEventListener("load", ready);
    addEventListener("resize", () => img.naturalWidth && build());

    // hover: a lens that shows the real chrome logo under the cursor
    wrap.addEventListener("pointermove", (e) => {
      const b = wrap.getBoundingClientRect();
      wrap.style.setProperty("--lx", `${e.clientX - b.left}px`);
      wrap.style.setProperty("--ly", `${e.clientY - b.top}px`);
      wrap.classList.add("lens");
    });
    wrap.addEventListener("pointerleave", () => wrap.classList.remove("lens"));
    // touch screens: tap flips between ASCII and chrome
    wrap.addEventListener("click", () => wrap.classList.toggle("chrome"));
  }

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
