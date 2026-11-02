import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- smooth scroll ---------- */
const lenis = new Lenis({ lerp: reduce ? 1 : 0.085, wheelMultiplier: 0.9 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

$$('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = id === "#top" ? 0 : $(id);
    if (el === null) return;
    e.preventDefault();
    closeMenu();
    lenis.scrollTo(el, { offset: id === "#top" ? 0 : -40, duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  })
);

/* ---------- nav ---------- */
const nav = $("[data-nav]");
let menuOpen = false;
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    nav.classList.toggle("is-solid", self.scroll() > 40);
    nav.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 400 && !menuOpen);
  },
});

const burger = $("[data-burger]");
const menu = $("[data-menu]");
function setMenu(open) {
  menuOpen = open;
  burger.setAttribute("aria-expanded", open);
  open ? lenis.stop() : lenis.start();
  gsap.to(menu, {
    clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
    duration: 0.7,
    ease: "expo.inOut",
    onStart: () => open && (menu.style.visibility = "visible"),
    onComplete: () => !open && (menu.style.visibility = "hidden"),
  });
  if (open) gsap.from($$("a", menu), { yPercent: 40, opacity: 0, stagger: 0.06, duration: 0.8, ease: "expo.out", delay: 0.25 });
}
function closeMenu() { if (menuOpen) setMenu(false); }
burger.addEventListener("click", () => setMenu(!menuOpen));

/* ---------- text helpers ---------- */
$$("[data-lines]").forEach((el) => {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/)
    .map((l) => `<span class="line"><span class="line__in">${l}</span></span>`)
    .join("");
  if (reduce) return;
  gsap.from($$(".line__in", el), {
    yPercent: 110,
    duration: 1.2,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: el, start: "top 85%" },
  });
});

$$("[data-fade]").forEach((el) => {
  if (reduce) return;
  gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%" } });
});

/* ---------- loader + hero intro ---------- */
const loaderNum = $("[data-loader-num]");
const state = { n: 0 };
const intro = gsap.timeline({ paused: true });

const hose = $("[data-hose]");
const hoseLen = hose.getTotalLength();
gsap.set(hose, { strokeDasharray: hoseLen, strokeDashoffset: hoseLen });

intro
  .to(".loader", { yPercent: -100, duration: 1, ease: "expo.inOut" })
  .from(".hero__title .line__in", { yPercent: 105, duration: 1.4, ease: "expo.out", stagger: 0.12 }, "-=0.35")
  .from("[data-polaroid]", { y: -60, opacity: 0, rotate: (i) => (i ? 14 : -14), duration: 1.2, ease: "back.out(1.4)", stagger: 0.15 }, "-=1.1")
  .to(hose, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut" }, "-=1.2")
  .from(".hero__foot > *", { y: 20, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, "-=1.6")
  .from("[data-badge]", { scale: 0, rotate: -90, duration: 1, ease: "back.out(1.6)" }, "-=1")
  .from(".nav > *", { y: -20, opacity: 0, duration: 0.8, stagger: 0.06 }, "-=1.4")
  .add(() => { lenis.start(); ScrollTrigger.refresh(); });

gsap.to(state, {
  n: 100,
  duration: reduce ? 0.2 : 1.8,
  ease: "power2.inOut",
  onUpdate: () => {
    loaderNum.textContent = String(Math.round(state.n)).padStart(2, "0");
    gsap.set("[data-loader-bar]", { scaleX: state.n / 100 });
  },
  onComplete: () => {
    document.fonts.ready.then(() => intro.play());
  },
});

/* hero scroll parallax */
if (!reduce) {
  gsap.to(".hero__title", { yPercent: -18, scale: 0.94, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".polaroid--before", { yPercent: -60, rotate: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".polaroid--after", { yPercent: -90, rotate: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(hose, { y: -140, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}

/* ---------- about: scrubbed word reveal ---------- */
const aboutText = $("[data-reveal-words]");
(function splitWords(root) {
  const walk = (node) => {
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
  };
  walk(root);
})(aboutText);

const reveals = [...$$(".w", aboutText), ...$$(".pill", aboutText)];
reveals.forEach((el) => !el.classList.contains("w") && (el.style.opacity = 0.22));
gsap.to(reveals, {
  opacity: 1,
  stagger: 0.5,
  ease: "none",
  scrollTrigger: { trigger: aboutText, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
});

const counter = $("[data-count]");
const target = +counter.dataset.count;
const cs = { v: 0 };
ScrollTrigger.create({
  trigger: counter,
  start: "top 85%",
  once: true,
  onEnter: () =>
    gsap.to(cs, { v: target, duration: 2, ease: "power3.out", onUpdate: () => (counter.textContent = Math.round(cs.v).toLocaleString("en") + "+") }),
});

/* ---------- services accordion ---------- */
const items = $$(".acc__item");
function openItem(item, instant) {
  const panel = $(".acc__panel", item);
  const img = $(".acc__img img", item);
  item.classList.add("is-open");
  $(".acc__bar", item).setAttribute("aria-expanded", "true");
  gsap.fromTo(panel, { height: instant ? "auto" : panel.offsetHeight }, { height: "auto", duration: instant ? 0 : 0.9, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
  gsap.fromTo(img, { scale: 1.3 }, { scale: 1.05, duration: 1.4, ease: "expo.out" });
}
function closeItem(item) {
  const panel = $(".acc__panel", item);
  $(".acc__bar", item).setAttribute("aria-expanded", "false");
  gsap.to(panel, { height: 0, duration: 0.8, ease: "expo.inOut", onComplete: () => item.classList.remove("is-open") });
}
items.forEach((item) => {
  if (item.classList.contains("is-open")) gsap.set($(".acc__panel", item), { height: "auto" });
  $(".acc__bar", item).addEventListener("click", () => {
    if (item.classList.contains("is-open")) return;
    items.filter((i) => i !== item && i.classList.contains("is-open")).forEach(closeItem);
    openItem(item);
  });
});

/* ---------- before / after ---------- */
const cmp = $("[data-compare]");
const handle = $("[data-handle]");
let pos = 50;
const setPos = (p) => {
  pos = Math.max(0, Math.min(100, p));
  cmp.style.setProperty("--pos", pos + "%");
  handle.setAttribute("aria-valuenow", Math.round(pos));
};
const fromEvent = (e) => setPos(((e.clientX - cmp.getBoundingClientRect().left) / cmp.offsetWidth) * 100);
let dragging = false;
cmp.addEventListener("pointerdown", (e) => { dragging = true; cmp.setPointerCapture(e.pointerId); gsap.killTweensOf(proxy); fromEvent(e); });
cmp.addEventListener("pointermove", (e) => dragging && fromEvent(e));
cmp.addEventListener("pointerup", () => (dragging = false));
handle.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") setPos(pos - 4);
  if (e.key === "ArrowRight") setPos(pos + 4);
});
const proxy = { p: 50 };
if (!reduce) {
  ScrollTrigger.create({
    trigger: cmp,
    start: "top 70%",
    once: true,
    onEnter: () => {
      proxy.p = 4;
      setPos(4);
      gsap.to(proxy, { p: 50, duration: 2.2, ease: "power3.out", onUpdate: () => !dragging && setPos(proxy.p) });
    },
  });
  gsap.fromTo(cmp, { clipPath: "inset(8% 8% 8% 8% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 14px)", ease: "none", scrollTrigger: { trigger: cmp, start: "top 95%", end: "top 35%", scrub: true } });
}

/* ---------- process path ---------- */
const ink = $("[data-ink]");
const drop = $("[data-drop]");
const len = ink.getTotalLength();
gsap.set(ink, { strokeDasharray: len, strokeDashoffset: len });
const stepEls = $$("[data-step]");
const stage = $(".process__stage");
const prog = { p: 0 };

function placeDrop() {
  const pt = ink.getPointAtLength(len * prog.p);
  drop.setAttribute("cx", pt.x);
  drop.setAttribute("cy", pt.y);
  gsap.set(ink, { strokeDashoffset: len * (1 - prog.p) });
}
placeDrop();
gsap.to(prog, {
  p: 1,
  ease: "none",
  onUpdate: placeDrop,
  scrollTrigger: { trigger: stage, start: "top 60%", end: "bottom 70%", scrub: 0.5 },
});
stepEls.forEach((s) =>
  ScrollTrigger.create({ trigger: s, start: "top 72%", onEnter: () => s.classList.add("is-on"), onLeaveBack: () => s.classList.remove("is-on") })
);

/* ---------- faq ---------- */
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
        gsap.to($("div", o), { height: 0, duration: 0.6, ease: "expo.inOut" });
      }
    });
    btn.setAttribute("aria-expanded", !open);
    gsap.to(body, { height: open ? 0 : "auto", duration: 0.7, ease: "expo.out", onComplete: () => ScrollTrigger.refresh() });
  });
});

/* ---------- marquee reacts to scroll velocity ---------- */
const mq = $("[data-marquee]");
if (!reduce) {
  const loop = gsap.to(mq, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
  lenis.on("scroll", ({ velocity }) => {
    gsap.to(loop, { timeScale: 1 + Math.min(Math.abs(velocity) * 0.5, 6) * Math.sign(velocity || 1), duration: 0.3, overwrite: true });
    gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.3, overwrite: "auto" });
  });
}

/* ---------- magnetic buttons ---------- */
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

/* ---------- image parallax ---------- */
if (!reduce) {
  $$(".acc__img img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } });
  });
}
