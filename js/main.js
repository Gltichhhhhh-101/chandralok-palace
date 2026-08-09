/**
 * The Chandralok Palace — butter-smooth cinematic scroll
 * Per-section: 01 hero scrub | 02 arrival scrub | 03–05 loops | 06 finale scrub
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

  // Journey media
  var videoHero = document.getElementById("video-hero");       // 01 scrub
  var videoArrival = document.getElementById("video-arrival"); // 02 scrub
  var videoDurbar = document.getElementById("video-durbar");   // 03 loop
  var videoSuite = document.getElementById("video-suite");     // 04 loop
  var videoGardens = document.getElementById("video-gardens"); // 05 loop
  var videoFinale = document.getElementById("video-finale");   // 06 scrub

  var scrubVideos = [videoHero, videoArrival, videoFinale].filter(Boolean);
  var loopVideos = [videoDurbar, videoSuite, videoGardens].filter(Boolean);

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
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.preload = "auto";
      video.pause();
      var ready = function () {
        video.removeEventListener("loadeddata", ready);
        try { video.currentTime = 0.001; } catch (_) {}
        video.removeAttribute("poster");
        video.classList.add("is-ready");
        resolve();
      };
      if (video.readyState >= 2) ready();
      else {
        video.addEventListener("loadeddata", ready);
        video.load();
        setTimeout(ready, 2800);
      }
    });
  }

  function prepLoopVideo(video) {
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.loop = true;
    video.removeAttribute("poster");
  }

  // Smooth scrub state (lerp)
  var scrubState = new Map();
  function setScrubTarget(video, progress) {
    if (!video || !isFinite(video.duration) || video.duration === 0) return;
    var t = Math.max(0, Math.min(1, progress)) * Math.max(0, video.duration - 0.04);
    var state = scrubState.get(video);
    if (!state) {
      state = { target: t, current: video.currentTime || 0 };
      scrubState.set(video, state);
    }
    state.target = t;
  }

  var scrubRaf = null;
  function scrubLoop() {
    scrubState.forEach(function (state, video) {
      state.current += (state.target - state.current) * 0.18;
      if (Math.abs(state.target - state.current) > 0.01) {
        try { video.currentTime = state.current; } catch (_) {}
      }
    });
    scrubRaf = requestAnimationFrame(scrubLoop);
  }
  function startScrubLoop() {
    if (!scrubRaf) scrubRaf = requestAnimationFrame(scrubLoop);
  }

  var lenis = null;
  function initLenis() {
    if (prefersReducedMotion || isIframe || typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.35
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    lenis.on("scroll", function () {
      if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
    });
  }

  function playLoop(video) {
    if (!video) return;
    if (video.readyState < 2) video.load();
    video.play().catch(function () {});
  }
  function pauseLoop(video) {
    if (!video) return;
    video.pause();
  }

  function initScrollTriggers() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // Nav hide / show
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

    // Section indicator
    document.querySelectorAll(".chapter[data-chapter]").forEach(function (ch) {
      ScrollTrigger.create({
        trigger: ch, start: "top 55%", end: "bottom 45%",
        onEnter: function () { updateIndicator(ch.dataset.chapter); },
        onEnterBack: function () { updateIndicator(ch.dataset.chapter); }
      });
    });

    function updateIndicator(num) {
      if (!siNum) return;
      gsap.to(siNum, {
        opacity: 0, duration: 0.16,
        onComplete: function () {
          siNum.textContent = num;
          gsap.to(siNum, { opacity: 1, duration: 0.26 });
        }
      });
    }

    // Text reveals
    if (prefersReducedMotion) {
      gsap.set(".reveal", { opacity: 1, y: 0 });
    } else {
      gsap.utils.toArray(".reveal").forEach(function (el) {
        gsap.fromTo(el, { opacity: 0, y: 18 }, {
          opacity: 1, y: 0, duration: 0.85, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 92%", toggleActions: "play none none none" }
        });
      });
    }

    if (prefersReducedMotion) return;

    var canScrub = !isNarrow();
    startScrubLoop();

    var pinBase = {
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.75,
      invalidateOnRefresh: true
    };

    // —— 01 HERO (scrub aerial) ——
    if (canScrub && videoHero) {
      ScrollTrigger.create(Object.assign({}, pinBase, {
        trigger: "#hero",
        start: "top top",
        end: "+=180%",
        onUpdate: function (self) { setScrubTarget(videoHero, self.progress); }
      }));
    } else if (videoHero) {
      videoHero.pause();
      try { videoHero.currentTime = 0; } catch (_) {}
    }

    // —— 02 ARRIVAL (scrub gate) ——
    if (canScrub && videoArrival) {
      ScrollTrigger.create(Object.assign({}, pinBase, {
        trigger: "#arrival",
        start: "top top",
        end: "+=160%",
        onUpdate: function (self) { setScrubTarget(videoArrival, self.progress); }
      }));
    }

    // —— 03 DURBAR (loop on enter) ——
    if (videoDurbar) {
      prepLoopVideo(videoDurbar);
      ScrollTrigger.create({
        trigger: "#durbar",
        start: "top 70%",
        end: "bottom 30%",
        onEnter: function () { playLoop(videoDurbar); },
        onEnterBack: function () { playLoop(videoDurbar); },
        onLeave: function () { pauseLoop(videoDurbar); },
        onLeaveBack: function () { pauseLoop(videoDurbar); }
      });
    }

    // —— 04 SUITE (loop on enter) ——
    if (videoSuite) {
      prepLoopVideo(videoSuite);
      ScrollTrigger.create({
        trigger: "#suite",
        start: "top 70%",
        end: "bottom 30%",
        onEnter: function () { playLoop(videoSuite); },
        onEnterBack: function () { playLoop(videoSuite); },
        onLeave: function () { pauseLoop(videoSuite); },
        onLeaveBack: function () { pauseLoop(videoSuite); }
      });
    }

    // —— 05 GARDENS (loop on enter) ——
    if (videoGardens) {
      prepLoopVideo(videoGardens);
      ScrollTrigger.create({
        trigger: "#gardens",
        start: "top 70%",
        end: "bottom 30%",
        onEnter: function () { playLoop(videoGardens); },
        onEnterBack: function () { playLoop(videoGardens); },
        onLeave: function () { pauseLoop(videoGardens); },
        onLeaveBack: function () { pauseLoop(videoGardens); }
      });
    }

    // —— 06 FINALE (scrub night) ——
    if (canScrub && videoFinale) {
      ScrollTrigger.create(Object.assign({}, pinBase, {
        trigger: "#finale",
        start: "top top",
        end: "+=170%",
        onUpdate: function (self) { setScrubTarget(videoFinale, self.progress); }
      }));
    }

    // Soft content drift on loop chapters only
    gsap.utils.toArray("#durbar .chapter-content, #gardens .chapter-content, #suite .chapter-content").forEach(function (el) {
      gsap.to(el, {
        yPercent: -5,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest(".chapter"),
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }

  async function boot() {
    await Promise.all(scrubVideos.map(armScrubVideo));
    loopVideos.forEach(prepLoopVideo);
    hidePreloader();
    setTimeout(function () {
      initLenis();
      initMagnetic();
      initScrollTriggers();
      setTimeout(function () {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      }, 400);
    }, 60);
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
