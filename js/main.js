/**
 * The Chandralok Palace
 * Scroll-driven cinematic experience
 * GSAP ScrollTrigger + Lenis
 * Mobile-first with graceful fallbacks
 */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  // Viewport width only for scrubbing (iPad landscape stays desktop-like)
  const isNarrow = () => window.matchMedia("(max-width: 768px)").matches;

  if (isTouch) document.body.classList.add("touch-device");

  const preloader = document.getElementById("preloader");
  const nav = document.getElementById("nav");
  const siNum = document.querySelector("#sectionIndicator .si-num");

  const videoHero = document.getElementById("video-hero");
  const videoArrival = document.getElementById("video-arrival");
  const videoFinale = document.getElementById("video-finale");
  const loopVideos = document.querySelectorAll(".loop-video");

  /* ---------- Custom cursor (desktop only) ---------- */
  const cursor = document.getElementById("cursor");
  const follower = document.getElementById("cursorFollower");
  let mouseX = 0, mouseY = 0, fx = 0, fy = 0;

  if (!isTouch && cursor && follower) {
    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";
    }, { passive: true });

    (function tick() {
      fx += (mouseX - fx) * 0.14;
      fy += (mouseY - fy) * 0.14;
      follower.style.left = fx + "px";
      follower.style.top = fy + "px";
      requestAnimationFrame(tick);
    })();

    document.querySelectorAll("a, button, .magnetic, .suite-card").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("is-hover");
        follower.classList.add("is-hover");
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-hover");
        follower.classList.remove("is-hover");
      });
    });
  }

  /* ---------- Magnetic ---------- */
  function initMagnetic() {
    if (isTouch) return;
    document.querySelectorAll(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ---------- Preloader ---------- */
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("is-done");
    setTimeout(() => preloader.remove(), 850);
  }

  function waitForHero() {
    return new Promise((resolve) => {
      if (!videoHero || videoHero.readyState >= 2) return resolve();
      const done = () => {
        videoHero.removeEventListener("loadeddata", done);
        resolve();
      };
      videoHero.addEventListener("loadeddata", done);
      setTimeout(resolve, 2400);
    });
  }

  /* ---------- Lenis ---------- */
  let lenis = null;

  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === "undefined") return;

    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.35,
    });

    // Single RAF loop only — avoids double-RAF conflict with GSAP ticker
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on("scroll", () => {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
    });
  }

  /* ---------- Video helpers ---------- */
  function setProgress(video, progress) {
    if (!video || !isFinite(video.duration) || video.duration === 0) return;
    const t = Math.max(0, Math.min(1, progress)) * video.duration;
    if (Math.abs(video.currentTime - t) > 0.05) {
      try { video.currentTime = t; } catch (_) {}
    }
  }

  function initLoopVideos() {
    if (!("IntersectionObserver" in window)) {
      loopVideos.forEach((v) => {
        v.muted = true;
        v.playsInline = true;
        v.play().catch(() => {});
      });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting) {
          if (v.readyState < 2) v.load();
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.3 });

    loopVideos.forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      io.observe(v);
    });
  }

  /* ---------- ScrollTrigger ---------- */
  function initScrollTriggers() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // Nav hide/show
    let lastY = 0;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        if (y > lastY && y > 100) nav?.classList.add("is-hidden");
        else nav?.classList.remove("is-hidden");
        lastY = y;
      },
    });

    // Section indicator
    document.querySelectorAll(".chapter[data-chapter]").forEach((ch) => {
      ScrollTrigger.create({
        trigger: ch,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => updateIndicator(ch.dataset.chapter),
        onEnterBack: () => updateIndicator(ch.dataset.chapter),
      });
    });

    function updateIndicator(num) {
      if (!siNum) return;
      gsap.to(siNum, {
        opacity: 0,
        duration: 0.2,
        onComplete: () => {
          siNum.textContent = num;
          gsap.to(siNum, { opacity: 1, duration: 0.3 });
        },
      });
    }

    // Text reveals
    if (prefersReducedMotion) {
      gsap.set(".reveal", { opacity: 1, y: 0 });
    } else {
      gsap.utils.toArray(".reveal").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 24 },
          {
            opacity: 1, y: 0,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          }
        );
      });
    }

    if (prefersReducedMotion) return;

    const canScrub = !isNarrow();

    // Hero scrub
    if (canScrub && videoHero) {
      videoHero.pause();
      videoHero.currentTime = 0;
      ScrollTrigger.create({
        trigger: "#hero",
        start: "top top",
        end: "+=160%",
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => setProgress(videoHero, self.progress),
      });
    } else if (videoHero) {
      videoHero.pause();
      videoHero.currentTime = 0;
    }

    // Arrival scrub
    if (canScrub && videoArrival) {
      videoArrival.pause();
      videoArrival.currentTime = 0;
      ScrollTrigger.create({
        trigger: "#arrival",
        start: "top top",
        end: "+=140%",
        pin: true,
        scrub: 0.5,
        onEnter: () => { if (videoArrival.readyState < 2) videoArrival.load(); },
        onUpdate: (self) => setProgress(videoArrival, self.progress),
      });
    }

    // Finale scrub
    if (canScrub && videoFinale) {
      videoFinale.pause();
      videoFinale.currentTime = 0;
      ScrollTrigger.create({
        trigger: "#finale",
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: 0.5,
        onEnter: () => { if (videoFinale.readyState < 2) videoFinale.load(); },
        onUpdate: (self) => setProgress(videoFinale, self.progress),
      });
    }

    // Soft parallax on non-pinned sections
    gsap.utils.toArray(".chapter-durbar .chapter-content, .chapter-gardens .chapter-content, .chapter-suite .chapter-content").forEach((el) => {
      gsap.to(el, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".chapter"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  }

  /* ---------- Boot ---------- */
  async function boot() {
    await waitForHero();
    hidePreloader();

    setTimeout(() => {
      initLenis();
      initMagnetic();
      initLoopVideos();
      initScrollTriggers();
      setTimeout(() => {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      }, 400);
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 200);
  }, { passive: true });
})();
