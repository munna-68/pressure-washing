import "@fontsource/eb-garamond/500.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/hanken-grotesk/300.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import "./style.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { initHero } from "./hero.js";

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const desktop = matchMedia("(min-width: 1024px)").matches;

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: reduce ? 1 : 0.085, wheelMultiplier: 0.9 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();
window.scrollTo(0, 0);
history.scrollRestoration = "manual";

/* ---------- menu ---------- */
const menu = $("[data-menu]");
let menuOpen = false;
function setMenu(open) {
  menuOpen = open;
  $$("[data-menu-btn]").forEach((b) => b.setAttribute("aria-expanded", open));
  open ? lenis.stop() : lenis.start();
  gsap.to(menu, {
    clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
    duration: 0.8,
    ease: "expo.inOut",
    onStart: () => open && (menu.style.visibility = "visible"),
    onComplete: () => !open && (menu.style.visibility = "hidden"),
  });
  if (open) gsap.from($$("a", menu), { yPercent: 60, opacity: 0, stagger: 0.07, duration: 1, ease: "expo.out", delay: 0.3 });
}
$$("[data-menu-btn]").forEach((b) => b.addEventListener("click", () => setMenu(!menuOpen)));

$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    lenis.scrollTo(target, { offset: id === "#top" ? 0 : -20, duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  })
);

/* ---------- fixed header: shows once the hero is behind you ---------- */
const fnav = $("[data-fnav]");
const hero = $("[data-hero]");
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    const past = self.scroll() > hero.offsetHeight * 0.7;
    fnav.classList.toggle("is-shown", past && self.direction === -1);
    if (self.direction === 1) fnav.classList.remove("is-shown");
  },
});

/* ---------- hero (loader + intro) ---------- */
const heroReady = initHero({ lenis, reduce, desktop });

/* ---------- everything below the fold ---------- */
document.fonts.ready.then(() => {
  setupText();
  ScrollTrigger.refresh();
});

function setupText() {
  /* masked line reveals on headings */
  $$("[data-split-lines]").forEach((el) => {
    if (reduce) return;
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 115,
          rotate: 3,
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 86%" },
        }),
    });
  });

  /* giant footer wordmark */
  const giant = $("[data-giant]");
  const split = SplitText.create(giant, { type: "chars", charsClass: "ch" });
  if (!reduce)
    gsap.from(split.chars, {
      yPercent: 110,
      duration: 1.4,
      ease: "expo.out",
      stagger: 0.06,
      scrollTrigger: { trigger: giant, start: "top 92%" },
    });
}

$$("[data-fade]").forEach((el) => {
  if (reduce) return;
  gsap.from(el, { y: 26, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } });
});

/* about: scrubbed word reveal */
const aboutText = $("[data-reveal-words]");
(function splitWords(root) {
  const walk = (node) =>
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p.trim()) return frag.append(p);
          const s = document.createElement("span");
          s.className = "w";
          s.textContent = p;
          frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.matches(".pill")) walk(n);
    });
  walk(root);
})(aboutText);

const reveals = [...$$(".w, .pill", aboutText)];
gsap.set($$(".pill", aboutText), { opacity: 0.2, scale: 0.85 });
gsap.to(reveals, {
  opacity: 1,
  scale: 1,
  stagger: 0.5,
  ease: "none",
  scrollTrigger: { trigger: aboutText, start: "top 78%", end: "bottom 55%", scrub: 0.6 },
});

const counter = $("[data-count]");
const cs = { v: 0 };
ScrollTrigger.create({
  trigger: counter,
  start: "top 85%",
  once: true,
  onEnter: () => gsap.to(cs, { v: +counter.dataset.count, duration: 2.2, ease: "power3.out", onUpdate: () => (counter.textContent = Math.round(cs.v).toLocaleString("en") + "+") }),
});

/* services: sticky stack, with content that wakes up as each bar arrives */
$$(".svc").forEach((svc, i, all) => {
  const imgBox = $(".svc__img", svc);
  const img = $("img", imgBox);
  const kids = [...$(".svc__body", svc).children];
  if (!reduce) {
    gsap.from(imgBox, { clipPath: "inset(0 0 100% 0)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: svc, start: "top 75%" } });
    gsap.from(kids, { y: 34, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: svc, start: "top 70%" } });
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: svc, start: "top bottom", end: "bottom top", scrub: true } });
    const next = all[i + 1];
    if (next)
      gsap.to($(".svc__panel", svc), {
        opacity: 0.25,
        scale: 0.97,
        transformOrigin: "50% 0%",
        ease: "none",
        scrollTrigger: { trigger: next, start: "top 75%", end: "top 20%", scrub: true },
      });
  }
});

/* before / after */
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
cmp.addEventListener("pointerdown", (e) => { dragging = true; cmp.setPointerCapture(e.pointerId); gsap.killTweensOf(proxy); fromEvent(e); });
cmp.addEventListener("pointermove", (e) => dragging && fromEvent(e));
cmp.addEventListener("pointerup", () => (dragging = false));
handle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") setPos(pos - 4);
  if (e.key === "ArrowRight") setPos(pos + 4);
});
if (!reduce) {
  gsap.fromTo(cmp, { clipPath: "inset(10% 10% 10% 10% round 28px)", scale: 0.94 }, { clipPath: "inset(0% 0% 0% 0% round 14px)", scale: 1, ease: "none", scrollTrigger: { trigger: cmp, start: "top 95%", end: "top 30%", scrub: true } });
  ScrollTrigger.create({
    trigger: cmp,
    start: "top 65%",
    once: true,
    onEnter: () => {
      setPos(3);
      proxy.p = 3;
      gsap.to(proxy, { p: 50, duration: 2.6, ease: "power3.inOut", onUpdate: () => !dragging && setPos(proxy.p) });
    },
  });
}

/* process path */
const ink = $("[data-ink]");
const drop = $("[data-drop]");
const sparks = $("[data-sparks]");
const track = $(".process__svg .track");
const len = track.getTotalLength();
const prog = { p: 0 };
let lastSpark = 0;
function placeDrop() {
  const pt = track.getPointAtLength(len * prog.p);
  drop.setAttribute("cx", pt.x);
  drop.setAttribute("cy", pt.y);
  gsap.set(ink, { drawSVG: `0% ${prog.p * 100}%` });
  if (prog.p - lastSpark > 0.008 && prog.p < 0.995) {
    lastSpark = prog.p;
    for (let k = 0; k < 2; k++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", pt.x + gsap.utils.random(-26, 26));
      c.setAttribute("cy", pt.y + gsap.utils.random(-26, 26));
      c.setAttribute("r", gsap.utils.random(2, 6));
      sparks.append(c);
      gsap.to(c, { y: gsap.utils.random(-50, -14), x: gsap.utils.random(-22, 22), opacity: 0, scale: 0.2, duration: gsap.utils.random(0.7, 1.3), ease: "power2.out", onComplete: () => c.remove() });
    }
  } else if (prog.p < lastSpark) lastSpark = prog.p;
}
gsap.set(ink, { drawSVG: "0% 0%" });
placeDrop();
gsap.to(prog, { p: 1, ease: "none", onUpdate: placeDrop, scrollTrigger: { trigger: ".process__stage", start: "top 62%", end: "bottom 72%", scrub: 0.6 } });
$$("[data-step]").forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 74%", onEnter: () => s.classList.add("is-on"), onLeaveBack: () => s.classList.remove("is-on") }));

/* faq */
const faqs = $$("[data-faq] li");
faqs.forEach((li) => {
  const btn = $("button", li);
  const body = $("div", li);
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    faqs.forEach((o) => {
      const b = $("button", o);
      if (b !== btn && b.getAttribute("aria-expanded") === "true") {
        b.setAttribute("aria-expanded", "false");
        gsap.to($("div", o), { height: 0, duration: 0.7, ease: "expo.inOut" });
      }
    });
    btn.setAttribute("aria-expanded", !open);
    gsap.to(body, { height: open ? 0 : "auto", duration: 0.8, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
  });
});

/* marquee: speeds up with scroll velocity */
if (!reduce) {
  const loop = gsap.to($("[data-marquee]"), { xPercent: -50, duration: 30, ease: "none", repeat: -1 });
  lenis.on("scroll", ({ velocity }) => {
    gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(velocity) * 0.6, 7), duration: 0.3, overwrite: true });
    gsap.to(loop, { timeScale: 1, duration: 1.4, delay: 0.3, overwrite: "auto" });
  });
}

/* magnetic buttons */
if (!reduce && matchMedia("(hover: hover)").matches) {
  $$("[data-magnet]").forEach((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * 0.3);
      y((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  });
}

heroReady.then(() => ScrollTrigger.refresh());
