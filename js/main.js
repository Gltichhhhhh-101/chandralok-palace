/**
 * The Chandralok Palace — butter-smooth cinematic scroll
 * GSAP ScrollTrigger + Lenis · iframe-safe · no poster flash
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  var isNarrow = function () { return window.matchMedia("(max-width: 768px)").matches; };
  var isIframe = (function () {
    try { return window.self !== window.top; } catch (e) { return true; }
  })();

  if (isTouch) document.body.classList.add("touch-device");
  if (isIframe) {
    document.documentElement.classList.add("is-iframe");
    document.body.classList.add("is-iframe");
  }

  var preloader = document.getElementById("preloader");
  var nav = document.getElementById("nav");
  var siNum = document.querySelector("#sectionIndicator .si-num");
  var videoHero = document.getElementById("video-hero");
  var videoArrival = document.getElementById("video-arrival");
  var videoFinale = document.getElementById("video-finale");
  var loopVideos = document.querySelectorAll(".loop-video");
  var scrubVideos = [videoHero, videoArrival, videoFinale].filter(Boolean);

  var cursor = document.getElementById("cursor");
  var follower = document.getElementById("cursorFollower");
  var mouseX = 0, mouseY = 0, fx = 0, fy = 0;

  if (!isTouch && !isIframe && cursor && follower) {
    window.addEventListener("mousemove", function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.left = mouseX + "px"; cursor.style.top = mouseY + "px";
    }, { passive: true });
    (function tick() {
      fx += (mouseX - fx) * 0.14; fy += (mouseY - fy) * 0.14;
      follower.style.left = fx + "px"; follower.style.top = fy + "px";
      requestAnimationFrame(tick);
    })();
    document.querySelectorAll("a, button, .magnetic, .suite-card").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("is-hover"); follower.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("is-hover"); follower.classList.remove("is-hover"); });
    });
  }

  function initMagnetic() {
    if (isTouch || isIframe) return;
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.2) + "px, " + ((e.clientY - r.top - r.height / 2) * 0.2) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = "translate(0,0)"; });
    });
  }

  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add("is-done");
    setTimeout(function () { preloader.remove(); }, 700);
  }

  function armScrubVideo(video) {
    if (!video) return Promise.resolve();
    return new Promise(function (resolve) {
      video.muted = true; video.playsInline = true;
      video.setAttribute("playsinline", ""); video.preload = "auto";
      var ready = function () {
        video.removeEventListener("loadeddata", ready);
        try { video.currentTime = 0.01; } catch (_) {}
        video.removeAttribute("poster");
        video.classList.add("is-ready");
        resolve();
      };
      if (video.readyState >= 2) ready();
      else {
        video.addEventListener("loadeddata", ready);
        video.load();
        setTimeout(ready, 3000);
      }
    });
  }

  var scrubState = new Map();
  function setScrubTarget(video, progress) {
    if (!video || !isFinite(video.duration) || video.duration === 0) return;
    var t = Math.max(0, Math.min(1, progress)) * (video.duration - 0.05);
    var state = scrubState.get(video);
    if (!state) { state = { target: t, current: video.currentTime || 0 }; scrubState.set(video, state); }
    state.target = t;
  }

  var scrubRaf = null;
  function scrubLoop() {
    scrubState.forEach(function (state, video) {
      state.current += (state.target - state.current) * 0.22;
      if (Math.abs(state.target - state.current) > 0.008) {
        try { video.currentTime = state.current; } catch (_) {}
      }
    });
    scrubRaf = requestAnimationFrame(scrubLoop);
  }
  function startScrubLoop() { if (!scrubRaf) scrubRaf = requestAnimationFrame(scrubLoop); }

  var lenis = null;
  function initLenis() {
    if (prefersReducedMotion || isIframe || typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.2,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true, touchMultiplier: 1.4, infinite: false
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on("scroll", function () { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update(); });
  }

  function initLoopVideos() {
    if (!("IntersectionObserver" in window)) {
      loopVideos.forEach(function (v) { v.muted = true; v.playsInline = true; v.play().catch(function () {}); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) { if (v.readyState < 2) v.load(); v.play().catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.25 });
    loopVideos.forEach(function (v) {
      v.muted = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.removeAttribute("poster"); io.observe(v);
    });
  }

  function initScrollTriggers() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    var lastY = 0;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        var y = self.scroll();
        if (y > lastY && y > 80) nav && nav.classList.add("is-hidden");
        else nav && nav.classList.remove("is-hidden");
        lastY = y;
      }
    });

    document.querySelectorAll(".chapter[data-chapter]").forEach(function (ch) {
      ScrollTrigger.create({
        trigger: ch, start: "top 55%", end: "bottom 45%",
        onEnter: function () { updateIndicator(ch.dataset.chapter); },
        onEnterBack: function () { updateIndicator(ch.dataset.chapter); }
      });
    });

    function updateIndicator(num) {
      if (!siNum) return;
      gsap.to(siNum, { opacity: 0, duration: 0.18, onComplete: function () {
        siNum.textContent = num; gsap.to(siNum, { opacity: 1, duration: 0.28 });
      }});
    }

    if (prefersReducedMotion) gsap.set(".reveal", { opacity: 1, y: 0 });
    else {
      gsap.utils.toArray(".reveal").forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 20 }, {
          opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" }
        });
      });
    }
    if (prefersReducedMotion) return;

    var canScrub = !isNarrow();
    startScrubLoop();
    var scrubOpts = { pin: true, pinSpacing: true, anticipatePin: 1, scrub: 0.8, invalidateOnRefresh: true };

    if (canScrub && videoHero) {
      ScrollTrigger.create(Object.assign({}, scrubOpts, {
        trigger: "#hero", start: "top top", end: "+=170%",
        onUpdate: function (self) { setScrubTarget(videoHero, self.progress); }
      }));
    } else if (videoHero) {
      videoHero.pause(); try { videoHero.currentTime = 0; } catch (_) {}
    }
    if (canScrub && videoArrival) {
      ScrollTrigger.create(Object.assign({}, scrubOpts, {
        trigger: "#arrival", start: "top top", end: "+=150%",
        onUpdate: function (self) { setScrubTarget(videoArrival, self.progress); }
      }));
    }
    if (canScrub && videoFinale) {
      ScrollTrigger.create(Object.assign({}, scrubOpts, {
        trigger: "#finale", start: "top top", end: "+=160%",
        onUpdate: function (self) { setScrubTarget(videoFinale, self.progress); }
      }));
    }

    gsap.utils.toArray(".chapter-durbar .chapter-content, .chapter-gardens .chapter-content, .chapter-suite .chapter-content").forEach(function (el) {
      gsap.to(el, { yPercent: -6, ease: "none", scrollTrigger: {
        trigger: el.closest(".chapter"), start: "top bottom", end: "bottom top", scrub: true
      }});
    });
  }

  async function boot() {
    await Promise.all(scrubVideos.map(armScrubVideo));
    hidePreloader();
    setTimeout(function () {
      initLenis(); initMagnetic(); initLoopVideos(); initScrollTriggers();
      setTimeout(function () { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); }, 350);
    }, 80);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  var resizeT;
  window.addEventListener("resize", function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
    }, 180);
  }, { passive: true });
})();
