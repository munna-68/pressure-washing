import gsap from "gsap";

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* nozzle tip in stage units (desktop 2562 wide) */
const TIP = { x: 607, y: 672 };
const SPRAY_ANGLE = (-10 * Math.PI) / 180;

export function initHero({ lenis, reduce, desktop }) {
  const stage = $("[data-stage]");
  const loader = $("[data-loader]");
  const mark = $("[data-loader-mark]");
  const logo = $("[data-hero-logo]");

  if (reduce) {
    gsap.set(stage.children, { autoAlpha: 1 });
    gsap.set($$(".jet"), { visibility: "inherit" });
    gsap.set($$("[data-dirty]"), { clipPath: "inset(0% 0% 0% 100%)" });
    loader.remove();
    lenis.start();
    return Promise.resolve();
  }

  const u = (n) => n * (stage.offsetWidth / (desktop ? 2562 : 390));
  const jet = $(desktop ? '[data-jet="d"]' : '[data-jet="m"]');
  const hn = $$(desktop ? "[data-hn]" : "[data-hn-m]");
  const rules = $$("[data-rule]");

  /* spray droplets around the nozzle (desktop) */
  const spray = gsap.timeline({ paused: true });
  if (desktop) {
    const g = $("[data-drops]");
    for (let i = 0; i < 28; i++) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", TIP.x);
      c.setAttribute("cy", TIP.y);
      c.setAttribute("r", gsap.utils.random(2, 6.5));
      c.setAttribute("fill", "var(--blue)");
      if (i % 4 === 0) c.setAttribute("filter", "url(#drop-blur)");
      g.append(c);
      const a = SPRAY_ANGLE + gsap.utils.random(-0.3, 0.3);
      const d = gsap.utils.random(90, 300);
      spray.fromTo(
        c,
        { x: 0, y: 0, scale: 0.3, opacity: 0 },
        { x: Math.cos(a) * d, y: Math.sin(a) * d + gsap.utils.random(0, 40), scale: 1, opacity: gsap.utils.random(0.2, 0.75), duration: gsap.utils.random(0.8, 1.5), ease: "power2.out", repeat: -1, repeatRefresh: true, delay: gsap.utils.random(0, 1.2) },
        0
      );
    }
  }

  /* the choreography */
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut" } });

  tl.fromTo($('[data-rule="top"]'), { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 1.3 }, 0.1)
    .fromTo(hn, { y: u(-14), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.08, ease: "power2.out" }, 0.25)
    .fromTo($('[data-h="title"]'), { scale: 0, autoAlpha: 1 }, { scale: 1, duration: 1.25, ease: "expo.inOut", transformOrigin: "50% 50%" }, 0.15);

  const pol = (sel, rot, off, at) =>
    tl.fromTo($(sel), { y: u(60), rotation: rot + off, autoAlpha: 0 }, { y: 0, rotation: rot, autoAlpha: 1, duration: 1.1, ease: "power4.out" }, at);
  if (desktop) pol('[data-h="before"]', -4, 8, 0.55);
  pol('[data-h="after"]', 4, -8, 0.75);

  const gun = $('[data-h="gun"]');
  tl.fromTo(gun, { x: u(-720), y: u(180), scale: 0.92, autoAlpha: 0 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.15, ease: "expo.inOut" }, 0.9)
    .to(gun, { x: u(-20), y: u(8), duration: 0.07, ease: "power2.out" }, 2.1)
    .to(gun, { x: 0, y: 0, duration: 0.45, ease: "power3.out" }, 2.17)
    .set(jet, { visibility: "inherit" }, 2.1)
    .fromTo($$("path", jet), { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 1.6, ease: "power2.inOut" }, 2.1);

  if (desktop) tl.set($(".jet--spray"), { visibility: "inherit" }, 2.1).add(() => spray.play(), 2.12);

  tl.fromTo($$("[data-dirty]"), { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 100%)", duration: 1, ease: "power2.inOut" }, 3.0)
    .fromTo($('[data-h="after"] [data-label="before"]'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.4, ease: "none" }, 3.5)
    .fromTo($('[data-h="after"] [data-label="after"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "none" }, 3.5);

  if (desktop) tl.fromTo($('[data-rule="bottom"]'), { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 1.2 }, 2.9);
  tl.fromTo($('[data-h="cta"]'), { y: u(24), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, 3.3)
    .fromTo($('[data-h="review"]'), { y: u(24), autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out" }, 3.45)
    .fromTo($('[data-h="badge"]'), { scale: 0.2, rotate: -60, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 1, ease: "back.out(1.8)" }, 3.55);

  /* after the intro: scroll drift + spinning badge + hover lift */
  const done = new Promise((resolve) => {
    tl.add(() => {
      lenis.start();
      const ring = gsap.to($("[data-badge-ring]"), { rotation: 360, duration: 24, ease: "none", repeat: -1, transformOrigin: "50% 50%" });
      gsap.to($$("[data-drift]"), {
        y: () => stage.offsetHeight * 0.07,
        ease: "none",
        scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true, onUpdate: (s) => ring.timeScale(1 + 2.5 * s.progress) },
      });
      gsap.to($$(".jet"), { y: () => stage.offsetHeight * 0.07, ease: "none", scrollTrigger: { trigger: stage, start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } });
      if (matchMedia("(hover: hover)").matches)
        $$("[data-print]").forEach((p) => {
          const r = p.closest("[data-h='before']") ? -2 : 2;
          p.addEventListener("pointerenter", () => gsap.to(p, { rotation: r, y: -8, duration: 0.6, ease: "power3.out", overwrite: "auto" }));
          p.addEventListener("pointerleave", () => gsap.to(p, { rotation: 0, y: 0, duration: 0.6, ease: "power3.out", overwrite: "auto" }));
        });
      resolve();
    }, ">+0.3");
  });

  /* loader: count, hose swipes through the wordmark, wordmark flies into the nav */
  const count = $("[data-loader-count]");
  const wave = $("[data-loader-wave]");
  const logoWave = $("[data-wave]");
  const n = { v: 0 };
  gsap.set(wave, { drawSVG: "0% 0%" });

  const run = () => {
    const load = gsap.timeline();
    load
      .to(n, { v: 100, duration: 2.1, ease: "power2.inOut", onUpdate: () => (count.textContent = String(Math.round(n.v)).padStart(2, "0")) })
      .to(wave, { drawSVG: "0% 100%", duration: 1, ease: "power2.inOut" }, 1.15)
      .add(() => {
        const a = mark.getBoundingClientRect();
        const b = logo.getBoundingClientRect();
        loader.style.backgroundColor = "transparent";
        gsap.to([$(".loader__tag"), count], { autoAlpha: 0, duration: 0.35 });
        gsap.to(mark, {
          x: b.left - a.left,
          y: b.top - a.top,
          scale: b.width / a.width,
          duration: 1.15,
          ease: "expo.inOut",
          onComplete: () => {
            gsap.set(logo, { autoAlpha: 1 });
            gsap.set(logoWave, { drawSVG: "0% 100%" });
            loader.remove();
          },
        });
        tl.play();
      }, ">+0.2");
  };

  const fontsReady = Promise.all([
    document.fonts.load('500 40px "EB Garamond"'),
    document.fonts.load('400 16px "Hanken Grotesk"'),
    document.fonts.load('400 11px "Geist Mono"'),
    document.fonts.ready,
  ]);
  const imgs = Promise.all(
    $$("img", stage).map((i) => (i.complete ? Promise.resolve() : new Promise((res) => { i.onload = i.onerror = res; })))
  );
  const cap = new Promise((res) => setTimeout(res, 3500));
  Promise.race([Promise.all([fontsReady, imgs]), cap]).then(run);

  return done;
}
