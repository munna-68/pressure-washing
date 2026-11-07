import "@fontsource-variable/geist";
import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const U = (id, w = 1200) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: reduce ? 1 : 0.09, wheelMultiplier: 0.95 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
history.scrollRestoration = "manual";
window.scrollTo(0, 0);

/* ---------- menu ---------- */
const menu = $("[data-menu]");
let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  $$("[data-menu-btn]").forEach((b) => b.setAttribute("aria-expanded", open));
  open ? lenis.stop() : lenis.start();
  gsap.to(menu, {
    clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
    duration: reduce ? 0 : 0.8,
    ease: "expo.inOut",
    onStart: () => open && (menu.style.visibility = "visible"),
    onComplete: () => !open && (menu.style.visibility = "hidden"),
  });
  if (open && !reduce) gsap.from($$("a", menu), { yPercent: 60, opacity: 0, stagger: 0.06, duration: 1, ease: "expo.out", delay: 0.3 });
}
$$("[data-menu-btn]").forEach((b) => b.addEventListener("click", () => setMenu(!menuOpen)));
addEventListener("keydown", (e) => e.key === "Escape" && menuOpen && setMenu(false));

$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    lenis.scrollTo(target, { offset: id === "#top" ? 0 : -16, duration: reduce ? 0 : 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  })
);

/* ---------- compact nav: back on scroll up, once past the hero ---------- */
const fnav = $("[data-fnav]");
const hero = $("[data-hero]");
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    const past = self.scroll() > hero.offsetHeight * 0.8;
    if (!past || self.direction === 1) fnav.classList.remove("is-shown");
    else if (self.direction === -1) fnav.classList.add("is-shown");
  },
});

/* =========================================================
   PRELOADER -> HERO
   ========================================================= */
const heroImg = $("[data-hero-img]");
let introPlayed = false;

function heroIntro(fromPreloader) {
  if (introPlayed) return;
  introPlayed = true;
  const word = $("[data-hero-word]");
  if (reduce) return;
  const split = SplitText.create($(".hero__chars", word), { type: "chars", mask: "chars" });
  gsap.set(word, { visibility: "visible" });
  const tl = gsap.timeline();
  tl.from(split.chars, { yPercent: 105, duration: 1.4, stagger: 0.045, ease: "expo.out" }, 0)
    .from($$("[data-hero-top]"), { y: -16, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" }, 0.25)
    .from($("[data-hero-lede]").children, { y: 26, autoAlpha: 0, duration: 1, stagger: 0.1, ease: "power3.out" }, 0.4)
    .from($("[data-stamp]"), { scale: 0, rotation: -120, duration: 1.1, ease: "back.out(1.6)" }, 0.75);
  if (!fromPreloader) tl.fromTo(heroImg, { scale: 1.18 }, { scale: 1, duration: 2, ease: "expo.out" }, 0);
}

function preloader() {
  const pre = $("[data-pre]");
  if (!pre || root.classList.contains("preloaded")) {
    pre?.remove();
    return false;
  }
  lenis.stop();
  const svg = $("[data-pre-svg]");
  const word = $("[data-pre-word]");
  const outline = $("[data-pre-outline]");
  const zoom = $("[data-pre-zoom]");
  const stops = $$("[data-pre-stop]");
  const count = $("[data-pre-count]");

  const layout = () => {
    const W = innerWidth;
    const H = innerHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    [word, outline].forEach((t) => { t.setAttribute("font-size", 100); t.setAttribute("x", W / 2); });
    const len = outline.getComputedTextLength() || 400;
    const fs = (100 * W * (W < 700 ? 0.86 : 0.7)) / len;
    [word, outline].forEach((t) => { t.setAttribute("font-size", fs); t.setAttribute("y", H / 2 + fs * 0.36); });
    return { W, H, fs };
  };

  const start = () => {
    let geo = layout();
    /* measure one frame after resizing the text: metrics drift otherwise */
    requestAnimationFrame(() => {
      geo = layout();
      const { fs } = geo;
      let cx = geo.W / 2 - fs * 1.2;
      try {
        const b = outline.getExtentOfChar(1); /* the "i" */
        cx = b.x + b.width / 2;
      } catch (e) { /* keep fallback */ }
      const cy = geo.H / 2 + fs * 0.36 - fs * 0.2;
      const dash = fs * 14;
      gsap.set(outline, { strokeDasharray: dash, strokeDashoffset: dash });

      const n = { v: 0, f: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          pre.remove();
          try { sessionStorage.setItem("tm-pre", "1"); } catch (e) { /* private mode */ }
          lenis.start();
          ScrollTrigger.refresh();
        },
      });
      tl.fromTo(heroImg, { scale: 1.35 }, { scale: 1, duration: 3, ease: "power3.inOut" }, 0)
        .to(n, {
          v: 100,
          f: 1,
          duration: 1.9,
          ease: "power2.inOut",
          onUpdate: () => {
            count.textContent = String(Math.round(n.v)).padStart(3, "0");
            stops.forEach((s) => s.setAttribute("offset", n.f));
          },
        }, 0.1)
        .to(outline, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0)
        .to([outline, ...$$(".pre__tl, .pre__tr, .pre__bl, .pre__count", pre)], { autoAlpha: 0, duration: 0.3 }, 2.05)
        .to(zoom, { scale: geo.W < 700 ? 70 : 95, svgOrigin: `${cx} ${cy}`, duration: 0.9, ease: "expo.in" }, 2.1)
        .to($("[data-pre-cover]"), { opacity: 0, duration: 0.4, ease: "power1.in" }, 2.6)
        .add(() => heroIntro(true), 2.4);
      if (import.meta.env.DEV) window.__preTl = tl;
    });
  };

  const fonts = Promise.all([document.fonts.load('650 100px "Geist Variable"'), document.fonts.ready]);
  const img = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.onload = heroImg.onerror = r; });
  Promise.race([Promise.all([fonts, img]), new Promise((r) => setTimeout(r, 2500))]).then(start);
  return true;
}

const hadPreloader = preloader();
if (!hadPreloader) document.fonts.ready.then(() => heroIntro(false));

/* =========================================================
   SCROLL SCENES (motion allowed only)
   ========================================================= */
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  /* hero: photo pushes in, word lifts, lede fades */
  const heroScroll = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  gsap.to(".hero__media", { scale: 1.14, ease: "none", scrollTrigger: heroScroll });
  gsap.to("[data-hero-word]", { yPercent: -30, ease: "none", scrollTrigger: heroScroll });
  gsap.to("[data-hero-lede]", { autoAlpha: 0, y: -40, ease: "none", scrollTrigger: { ...heroScroll, end: "50% top" } });

  /* rotating stamps: slow spin, faster with scroll */
  const ring = gsap.to("[data-stamp-ring]", { rotation: 360, duration: 22, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
  ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", onUpdate: (s) => ring.timeScale(1 + s.getVelocity() / 400) });

  /* inline photo pills pop */
  $$(".hpill").forEach((p) =>
    gsap.from(p, { scale: 0, rotation: -12, duration: 0.9, ease: "back.out(2)", scrollTrigger: { trigger: p, start: "top 88%" } })
  );

  /* photo windows open */
  $$("[data-window]").forEach((w) => {
    const st = { trigger: w, start: "top 95%", end: "top 35%", scrub: true };
    gsap.fromTo(w, { clipPath: "inset(14% 10% 14% 10% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: st });
    gsap.fromTo($("img", w), { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: st });
  });

  /* services: rows rise in */
  gsap.from($$("[data-svc] > li"), { y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: "expo.out", scrollTrigger: { trigger: "[data-svc]", start: "top 82%" } });

  /* compare frame opens */
  gsap.fromTo("[data-compare]", { clipPath: "inset(8% 8% 8% 8% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 28px)", ease: "none", scrollTrigger: { trigger: "[data-compare]", start: "top 95%", end: "top 40%", scrub: true } });
  gsap.from("[data-job-card]", { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: "[data-compare]", start: "top 60%" } });

  /* footer wordmark rises */
  gsap.fromTo("[data-giant]", { yPercent: 60 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".foot__giant", start: "top bottom", end: "bottom bottom", scrub: true } });
  gsap.to("[data-foot-stamp] svg", { rotation: 360, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });
});

/* headings: masked line reveal (after fonts) */
document.fonts.ready.then(() => {
  if (!reduce)
    $$("[data-heading]").forEach((el) =>
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }),
      })
    );
  ScrollTrigger.refresh();
});

/* ---------- counter ---------- */
$$("[data-count]").forEach((el) => {
  if (reduce) return;
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: el,
    start: "top 90%",
    once: true,
    onEnter: () => gsap.to(o, { v: +el.dataset.count, duration: 2, ease: "power3.out", onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en") + "+") }),
  });
});

/* ---------- accordions ---------- */
$$("[data-acc]").forEach((list) => {
  const items = $$(":scope > li", list);
  items.forEach((li) => {
    const btn = $("button", li);
    const body = $("div", li);
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      items.forEach((o) => {
        const b = $("button", o);
        if (o !== li && b.getAttribute("aria-expanded") === "true") {
          b.setAttribute("aria-expanded", "false");
          o.classList.remove("is-open");
          gsap.fromTo($("div", o), { height: $("div", o).offsetHeight }, { height: 0, duration: reduce ? 0 : 0.6, ease: "expo.inOut" });
        }
      });
      btn.setAttribute("aria-expanded", String(!open));
      li.classList.toggle("is-open", !open);
      gsap.fromTo(body, { height: body.offsetHeight }, { height: open ? 0 : "auto", duration: reduce ? 0 : 0.7, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
    });
  });
});

/* ---------- process steps ---------- */
const STEPS = [
  { tag: "Free, about 30 minutes", title: "The survey", text: "We walk the job with you, identify the stone and check anything nearby that water could hurt.", img: "/img/s6.jpg", alt: "Sketching a site plan during a survey", label: "Step one", cap: "Walk round<br>and quote" },
  { tag: "Usually the same visit", title: "The test patch", text: "A small hidden corner first, at low pressure. We see how the surface reacts and get your sign-off.", img: U("1605658781469-50bcc2522522", 900), alt: "Testing low pressure on paving", label: "Step two", cap: "Low pressure<br>first" },
  { tag: "Same day", title: "The clean", text: "Rotary cleaner for flat stone, soft wash for render and roofs. Pressure set to the material.", img: U("1777126958347-ed3cabf2667b", 900), alt: "Jet washing a white railing", label: "Step three", cap: "Rotary and<br>soft wash" },
  { tag: "12-month check-in", title: "The seal", text: "Joints re-sanded, sealed if the surface needs it, and we come back after a year to check it.", img: U("1762810981576-1b07f76af9d2", 900), alt: "Freshly cleaned block paving driveway", label: "Step four", cap: "Sanded, sealed,<br>checked" },
];
STEPS.slice(1).forEach((s) => { const i = new Image(); i.src = s.img; });
let step = 0;
let stepBusy = false;
function goStep(dir) {
  if (stepBusy) return;
  stepBusy = true;
  step = (step + dir + STEPS.length) % STEPS.length;
  const s = STEPS[step];
  const text = $("[data-step-text]");
  const photo = $("[data-step-photo]");
  const num = $("[data-step-num]");
  const swap = () => {
    $("h3", text).textContent = s.title;
    $("p", text).textContent = s.text;
    $("[data-step-tag]").textContent = s.tag;
    $("[data-step-label]").textContent = s.label;
    $("[data-step-cap]").innerHTML = s.cap;
    num.textContent = String(step + 1).padStart(2, "0");
  };
  if (reduce) {
    swap();
    const img = $("[data-step-img]");
    img.src = s.img; img.alt = s.alt;
    stepBusy = false;
    return;
  }
  const next = document.createElement("img");
  next.src = s.img; next.alt = s.alt; next.setAttribute("data-step-img", "");
  const old = $("[data-step-img]");
  old.after(next);
  const tl = gsap.timeline({ onComplete: () => { old.remove(); stepBusy = false; } });
  tl.to([text, num, "[data-step-cap]"], { y: -18 * dir, autoAlpha: 0, duration: 0.3, ease: "power2.in" }, 0)
    .add(swap, 0.3)
    .fromTo([text, num, "[data-step-cap]"], { y: 18 * dir }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "expo.out", stagger: 0.04 }, 0.32)
    .fromTo(next, { clipPath: dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", scale: 1.15 }, { clipPath: "inset(0 0 0 0%)", scale: 1, duration: 0.9, ease: "expo.inOut" }, 0)
    .to(old, { scale: 1.08, duration: 0.9, ease: "expo.inOut" }, 0);
}
$("[data-step-next]").addEventListener("click", () => goStep(1));
$("[data-step-prev]").addEventListener("click", () => goStep(-1));

/* ---------- before / after ---------- */
const cmp = $("[data-compare]");
const handle = $("[data-handle]");
let pos = 50;
let dragging = false;
const proxy = { p: 50 };
const setPos = (p) => {
  pos = Math.max(0, Math.min(100, p));
  cmp.style.setProperty("--pos", pos + "%");
  handle.setAttribute("aria-valuenow", Math.round(pos));
};
const fromEvent = (e) => setPos(((e.clientX - cmp.getBoundingClientRect().left) / cmp.offsetWidth) * 100);
cmp.addEventListener("pointerdown", (e) => {
  if (e.target.closest("[data-job-card]")) return;
  dragging = true;
  cmp.setPointerCapture(e.pointerId);
  gsap.killTweensOf(proxy);
  fromEvent(e);
});
cmp.addEventListener("pointermove", (e) => dragging && fromEvent(e));
cmp.addEventListener("pointerup", () => (dragging = false));
handle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") setPos(pos - 4);
  if (e.key === "ArrowRight") setPos(pos + 4);
});
if (!reduce)
  ScrollTrigger.create({
    trigger: cmp,
    start: "top 60%",
    once: true,
    onEnter: () => {
      proxy.p = 4;
      setPos(4);
      gsap.to(proxy, { p: 50, duration: 2.4, ease: "power3.inOut", onUpdate: () => !dragging && setPos(proxy.p) });
    },
  });

const JOBS = [
  { name: "Patio", img: "/img/s5.jpg", area: 64, surface: "porcelain terrace", time: "4h 20m", water: "410 L", finish: "Sealed", delta: "-92% grime", line: "M0 58 C 30 56 50 30 80 34 S 120 60 150 46 S 200 12 230 22 S 270 40 300 14" },
  { name: "Driveway", img: U("1605146768851-eda79da39897", 1600), area: 88, surface: "block paving drive", time: "5h 45m", water: "620 L", finish: "Re-sanded", delta: "-88% grime", line: "M0 50 C 40 62 60 20 100 28 S 150 54 180 40 S 230 30 250 18 S 280 26 300 8" },
  { name: "Render", img: "/img/s4.jpg", area: 112, surface: "white K Rend", time: "6h 10m", water: "280 L", finish: "Biocide", delta: "-95% algae", line: "M0 60 C 20 40 50 52 80 44 S 130 24 160 30 S 210 50 240 26 S 280 10 300 12" },
];
JOBS.forEach((j) => { const i = new Image(); i.src = j.img; });
const jobBtns = $$("[data-job]");
const line = $("[data-job-line]");
function drawLine() {
  if (reduce) return;
  const L = line.getTotalLength();
  gsap.fromTo(line, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" });
}
ScrollTrigger.create({ trigger: cmp, start: "top 55%", once: true, onEnter: drawLine });
jobBtns.forEach((b) =>
  b.addEventListener("click", () => {
    const j = JOBS[+b.dataset.job];
    jobBtns.forEach((o) => { o.classList.toggle("is-on", o === b); o.setAttribute("aria-selected", String(o === b)); });
    const imgs = $$("[data-job-img]");
    const apply = () => {
      imgs.forEach((i) => (i.src = j.img));
      $("[data-job-name]").textContent = j.name;
      $("[data-job-surface]").textContent = j.surface;
      $("[data-job-time]").textContent = j.time;
      $("[data-job-water]").textContent = j.water;
      $("[data-job-finish]").textContent = j.finish;
      $("[data-job-delta]").textContent = j.delta;
      line.setAttribute("d", j.line);
    };
    if (reduce) { apply(); $("[data-job-area]").textContent = j.area; return; }
    gsap.timeline()
      .to(imgs, { opacity: 0, duration: 0.3, ease: "power1.in" })
      .add(apply)
      .to(imgs, { opacity: 1, duration: 0.6, ease: "power2.out" })
      .add(drawLine, 0.3);
    const area = $("[data-job-area]");
    const o = { v: +area.textContent };
    gsap.to(o, { v: j.area, duration: 1, ease: "power3.out", onUpdate: () => (area.textContent = Math.round(o.v)) });
    proxy.p = pos;
    gsap.fromTo(proxy, { p: 12 }, { p: 50, duration: 1.6, ease: "power3.inOut", onUpdate: () => !dragging && setPos(proxy.p) });
  })
);

/* ---------- services list + floating photo ---------- */
const svcSection = $("#services");
const rows = $$("[data-svc] > li");
const float = $("[data-svc-float]");
const floatImg = $("[data-svc-img]");
let active = rows.findIndex((r) => r.classList.contains("is-on"));
function placeFloat(instant) {
  if (getComputedStyle(float).display === "none") return;
  const row = rows[active];
  const sr = svcSection.getBoundingClientRect();
  const rr = row.getBoundingClientRect();
  const x = sr.width * 0.6 - float.offsetWidth / 2;
  const y = rr.top - sr.top + rr.height / 2 - float.offsetHeight / 2;
  gsap.to(float, { x, y, rotation: active % 2 ? 4 : -4, duration: instant || reduce ? 0 : 0.9, ease: "expo.out" });
}
function setSvc(i) {
  if (i === active) return;
  rows[active].classList.remove("is-on");
  $("button", rows[active]).setAttribute("aria-expanded", "false");
  active = i;
  rows[i].classList.add("is-on");
  $("button", rows[i]).setAttribute("aria-expanded", "true");
  floatImg.src = rows[i].dataset.img;
  if (!reduce) gsap.fromTo(floatImg, { scale: 1.25 }, { scale: 1, duration: 0.9, ease: "expo.out" });
  requestAnimationFrame(() => placeFloat());
}
rows.forEach((r, i) => {
  const b = $("button", r);
  b.addEventListener("click", () => setSvc(i));
  b.addEventListener("focus", () => setSvc(i));
  if (matchMedia("(hover: hover)").matches) r.addEventListener("pointerenter", () => setSvc(i));
  const pre = new Image(); pre.src = r.dataset.img;
});
ScrollTrigger.create({
  trigger: svcSection,
  start: "top 70%",
  once: true,
  onEnter: () => {
    placeFloat(true);
    gsap.fromTo(float, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: reduce ? 0 : 1, ease: "back.out(1.6)", delay: reduce ? 0 : 0.5 });
  },
});
addEventListener("resize", () => placeFloat(true));
ScrollTrigger.addEventListener("refresh", () => placeFloat(true));

/* ---------- reviews ---------- */
const QUOTES = [
  { q: "Our sandstone patio had gone black. Two days later it looks newer than the day it was laid, and they rinsed every plant before they left.", s: "5.0", name: "Marguerite Okafor", where: "Sandstone patio, Roundhay" },
  { q: "They tested a corner of the render first and talked me through it. The green streaks are gone and the finish is untouched.", s: "5.0", name: "Callum Brightwater", where: "K Rend, Wetherby" },
  { q: "The drive had twenty years of oil on it. They re-sanded every joint and sent photos from the roof while clearing the gutters.", s: "4.8", name: "Priya Lindqvist", where: "Block paving and gutters, Harrogate" },
  { q: "Booked on a Monday, done by Thursday. The crew parked the van out of the way and left the decking dry by teatime.", s: "4.9", name: "Tomasz Ellery", where: "Hardwood decking, Headingley" },
];
let qi = 0;
$("[data-q-next]").addEventListener("click", () => {
  qi = (qi + 1) % QUOTES.length;
  const q = QUOTES[qi];
  const body = $("[data-q-body]");
  const who = $("[data-q-who]");
  const apply = () => {
    $("blockquote", body).textContent = `“${q.q}”`;
    $(".stars b", body).textContent = q.s;
    $("b", who).textContent = q.name;
    $("small", who).textContent = q.where;
    $("[data-q-num]").textContent = qi + 1;
  };
  if (reduce) return apply();
  gsap.timeline()
    .to([body, who], { y: -16, autoAlpha: 0, duration: 0.3, ease: "power2.in" })
    .add(apply)
    .fromTo([body, who], { y: 16 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06, ease: "expo.out" });
});

/* magnetic round buttons */
if (!reduce && matchMedia("(hover: hover)").matches)
  $$(".round--xl, .stamp").forEach((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  });
