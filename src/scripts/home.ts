import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import Swiper from "swiper";
import { EffectCoverflow, Mousewheel, Navigation } from "swiper/modules";

gsap.registerPlugin(
  ScrollTrigger,
  ScrambleTextPlugin,
  SplitText,
  CustomEase,
);
CustomEase.create("main", "0.5, 0.05, 0.05, 0.99");

const SYMBOLS = "$€£¢¥%→↑↓←↙↖↗↘";

type FrameSequence = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  embed: HTMLElement;
  images: HTMLImageElement[];
  frameCount: number;
  resize: () => void;
  draw: (frame: number) => void;
};

let lenis: Lenis | null = null;

function prepareBrandingAndAnchors() {
  const heroImage = document.querySelector<HTMLImageElement>("#hero-img");

  if (heroImage && !heroImage.closest(".home-hero__media")) {
    const wrapper = document.createElement("div");
    wrapper.className = `${heroImage.className} home-hero__media`;
    heroImage.className = "home-hero__img-source";
    heroImage.replaceWith(wrapper);
    wrapper.append(heroImage);

    const mask = document.createElement("span");
    mask.className = "home-hero__brand-mask";
    mask.setAttribute("aria-hidden", "true");

    const mark = document.createElement("span");
    mark.className = "home-hero__brand-mark";
    mark.textContent = "tradel";
    mark.setAttribute("aria-hidden", "true");
    wrapper.append(mask, mark);
  }

  const intro = document.querySelector<HTMLElement>(".section.is--intro");
  const lighthouse = document.querySelector<HTMLElement>(
    ".section.is--lighthouse",
  );
  const process = document
    .querySelector<HTMLElement>(".process-section")
    ?.closest<HTMLElement>(".section");
  const community = document
    .querySelector<HTMLElement>(".swiper.coverflow")
    ?.closest<HTMLElement>("section");
  const education = document
    .querySelector<HTMLElement>(".blog-toggle__link")
    ?.closest<HTMLElement>("section");
  const support = document
    .querySelector<HTMLElement>("[data-autoplay-section]")
    ?.closest<HTMLElement>("section");
  const download = document
    .querySelector<HTMLElement>("[data-download-w]")
    ?.closest<HTMLElement>("section");

  intro?.setAttribute("id", "ai");
  lighthouse?.setAttribute("id", "agent");
  process?.setAttribute("id", "process");
  community?.setAttribute("id", "community");
  education?.setAttribute("id", "education");
  support?.setAttribute("id", "support");
  download?.setAttribute("id", "download");

  document
    .querySelector<HTMLElement>(".process-text.hide")
    ?.classList.remove("hide");

  const navTargets: Record<string, string> = {
    ai: "#ai",
    blog: "#education",
    academy: "#education",
    earn: "#community",
  };

  document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
    const label = link.textContent?.trim().toLowerCase() ?? "";
    link.href = navTargets[label] ?? "#top";
  });

  document.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    const label = link.textContent?.trim().toLowerCase() ?? "";

    if (label.includes("meet your agent") || label.includes("meet me today")) {
      link.href = "#process";
    } else if (label.includes("trade now")) {
      link.href = "#process";
    } else if (label.includes("all articles")) {
      link.href = "#education";
    } else if (label.includes("join us")) {
      link.href = "#community";
    } else if (label.includes("write to us")) {
      link.href = "#support";
    }
  });
}

function setupSmoothScroll() {
  lenis = new Lenis({
    duration: 1.1,
    easing: (time: number) =>
      time === 1 ? 1 : 1 - Math.pow(2, -13 * time),
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href === "#") {
      event.preventDefault();
      return;
    }

    const destination = document.querySelector<HTMLElement>(href);
    if (!destination) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    lenis?.scrollTo(destination, {
      duration: 1.1,
      offset: 0,
    });
  });
}

function setupNavigation() {
  const logo = document.querySelector<HTMLElement>("[data-nav-logo]");
  if (logo) {
    gsap.set(logo, { autoAlpha: 0, yPercent: 20 });
    ScrollTrigger.create({
      start: () => window.innerHeight * 0.5,
      onEnter: () =>
        gsap.to(logo, {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power3.out",
          yPercent: 0,
        }),
      onLeaveBack: () =>
        gsap.to(logo, {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power3.in",
          yPercent: 20,
        }),
    });
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-item]"),
    );

    items.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        items.forEach((candidate) => {
          candidate.setAttribute(
            "data-nav-item",
            candidate === item ? "" : "faded",
          );
        });
      });
      item.addEventListener("mouseleave", () => {
        items.forEach((candidate) =>
          candidate.setAttribute("data-nav-item", ""),
        );
      });
    });
  }

  const localeButton = document.querySelector<HTMLElement>("[data-locals]");
  const localeLists = Array.from(
    document.querySelectorAll<HTMLElement>("[data-locals-list]"),
  );
  localeLists.forEach((list) => {
    list.style.display = "none";
  });

  localeButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = localeLists[0]?.style.display !== "flex";
    localeLists.forEach((list) => {
      list.style.display = shouldOpen ? "flex" : "none";
    });
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (
      target instanceof Element &&
      !target.closest("[data-locals]") &&
      !target.closest("[data-locals-list]")
    ) {
      localeLists.forEach((list) => {
        list.style.display = "none";
      });
    }
  });

  setupMobileMenu();
}

function setupMobileMenu() {
  const button = document.querySelector<HTMLElement>(".menu-btn");
  const menu = document.querySelector<HTMLElement>(".menu-w");
  if (!button || !menu) return;

  const lines = Array.from(
    button.querySelectorAll<HTMLElement>(".menu-btn__line"),
  );
  const [topLine, middleLine, bottomLine] = lines;
  const menuLabels = menu.querySelectorAll<HTMLElement>(".menu-link__text");
  const menuButtons = menu.querySelectorAll<HTMLElement>(".menu-button");
  let isOpen = false;
  let isAnimating = false;

  menu.setAttribute("aria-hidden", "true");
  gsap.set(menu, { display: "none", height: "0dvh" });

  const open = () => {
    if (isOpen || isAnimating) return;
    isAnimating = true;
    isOpen = true;
    lenis?.stop();

    const timeline = gsap.timeline({
      defaults: { ease: "main" },
      onComplete: () => {
        isAnimating = false;
        menu.setAttribute("aria-hidden", "false");
      },
    });

    timeline
      .set(menu, { display: "block", visibility: "visible" })
      .to(menu, { duration: 0.8, height: "100dvh" }, 0)
      .to(middleLine, { duration: 0.3, opacity: 0, scaleX: 0 }, 0)
      .to(topLine, { duration: 0.3, opacity: 0, x: -20 }, 0)
      .to(bottomLine, { duration: 0.3, opacity: 0, x: 20 }, 0)
      .set(topLine, { rotate: -135, scaleX: 0.9, y: -20 })
      .set(bottomLine, { rotate: 135, scaleX: 0.9, y: -24 })
      .to(topLine, { duration: 0.3, opacity: 1, x: 0, y: 8 })
      .to(
        bottomLine,
        { duration: 0.3, opacity: 1, x: 0, y: -4 },
        "<+=0.1",
      )
      .from(
        menuLabels,
        {
          duration: 0.8,
          scrambleText: {
            chars: "uppercase",
            delimiter: "",
            speed: 1,
            text: "{original}",
          },
          stagger: 0.1,
        },
        0.22,
      )
      .fromTo(
        menuButtons,
        { autoAlpha: 0, y: 100 },
        {
          autoAlpha: 1,
          duration: 0.6,
          stagger: 0.1,
          y: 0,
        },
        0.32,
      );
  };

  const close = () => {
    if (!isOpen || isAnimating) return;
    isAnimating = true;

    gsap
      .timeline({
        defaults: { duration: 0.5, ease: "main" },
        onComplete: () => {
          isOpen = false;
          isAnimating = false;
          menu.style.display = "none";
          menu.setAttribute("aria-hidden", "true");
          lenis?.start();
        },
      })
      .to(lines, {
        opacity: 1,
        overwrite: "auto",
        rotate: 0,
        scaleX: 1,
        x: 0,
        y: 0,
      })
      .to(menu, { height: "0dvh" }, "<");
  };

  button.addEventListener("click", () => {
    if (isOpen) close();
    else open();
  });

  menu.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (isOpen) close();
    });
  });

  const languagePanel = document.querySelector<HTMLElement>("#language-mobile");
  const languageOpen = document.querySelector<HTMLElement>(
    "[data-locale-open]",
  );
  const languageClose = document.querySelector<HTMLElement>(
    "[data-locale-close]",
  );

  if (languagePanel) {
    gsap.set(languagePanel, { display: "none", y: "100%" });
    languageOpen?.addEventListener("click", () => {
      gsap.to(languagePanel, {
        display: "flex",
        duration: 0.5,
        ease: "power3.out",
        opacity: 1,
        y: "0%",
      });
    });
    languageClose?.addEventListener("click", () => {
      gsap.to(languagePanel, {
        duration: 0.5,
        ease: "power3.in",
        opacity: 0,
        y: "100%",
        onComplete: () => {
          languagePanel.style.display = "none";
        },
      });
    });
  }
}

function setupSplitText() {
  const processLineTargets = Array.from(
    document.querySelectorAll<HTMLElement>(
      ".process-text [data-split-lines]",
    ),
  );
  const responsiveLineTargets = Array.from(
    document.querySelectorAll<HTMLElement>("[data-split-lines]"),
  ).filter((target) => !target.closest(".process-text"));

  if (responsiveLineTargets.length) {
    SplitText.create(responsiveLineTargets, {
      autoSplit: true,
      linesClass: "line",
      type: "lines",
    });
  }

  if (processLineTargets.length) {
    SplitText.create(processLineTargets, {
      autoSplit: false,
      linesClass: "line",
      type: "lines",
    });
  }
}

function setupPixelScanners() {
  document.querySelectorAll<HTMLElement>(".bg").forEach((background) => {
    const columns = background.querySelectorAll<HTMLElement>(".cell-col");
    columns.forEach((column, columnIndex) => {
      const cells = Array.from(
        column.querySelectorAll<HTMLElement>(".cell"),
      ).reverse();

      const timeline = gsap.timeline({
        delay: columnIndex * 1.25,
        scrollTrigger: {
          end: "bottom top-=150%",
          start: "top-=500 bottom",
          toggleActions: "play pause resume pause",
          trigger: background.parentElement,
        },
      });

      cells.forEach((cell, cellIndex) => {
        timeline.to(
          cell,
          {
            keyframes: [
              { duration: 0, opacity: 0 },
              { duration: 0.25, opacity: 0.1 },
              { duration: 0.25, opacity: 0.2 },
              { duration: 0.25, opacity: 0.5 },
              { duration: 0.25, opacity: 1 },
              { duration: 0.25, opacity: 0.5 },
              { duration: 0.25, opacity: 0.2 },
              { duration: 0.25, opacity: 0.1 },
              { duration: 0.25, opacity: 0 },
            ],
            repeat: -1,
            repeatDelay: 2,
          },
          cellIndex * 0.25,
        );
      });
    });
  });
}

function setupStaggeredTitles() {
  document
    .querySelectorAll<HTMLElement>("[data-stagger-title]")
    .forEach((title) => {
      const cells = title.querySelectorAll("rect");
      gsap.fromTo(
        cells,
        { opacity: 0 },
        {
          duration: 0.001,
          opacity: 1,
          scrollTrigger: {
            end: "top center",
            scrub: true,
            start: "top bottom",
            trigger: title,
          },
          stagger: {
            amount: 1,
            from: "random",
          },
        },
      );
    });
}

function setupLighthouseStory() {
  const section = document.querySelector<HTMLElement>(
    ".section.is--lighthouse",
  );
  if (!section) return;

  const wrapper = section.querySelector<HTMLElement>(".lh-top__wrap");
  const phoneWrapper = section.querySelector<HTMLElement>(".lh-phone__wrap");
  const phone = section.querySelector<HTMLElement>(".lh-phone");
  const introVideo = section.querySelector<HTMLElement>(".lh-intro__vid");
  const gridCells = section.querySelectorAll<HTMLElement>(".grid-child");
  const lines = section.querySelectorAll<HTMLElement>(
    ".lh-top__inner .line",
  );
  const accents = section.querySelectorAll<HTMLElement>("[data-lh-anim]");

  const video = introVideo?.querySelector<HTMLVideoElement>("video");
  if (video) {
    video.muted = true;
    video.loop = true;
    void video.play().catch(() => undefined);
  }

  if (!wrapper || !phoneWrapper || !phone) return;

  const shortLandscape =
    window.innerWidth < 768 && window.innerHeight < 500;
  gsap.set(phoneWrapper, { y: shortLandscape ? "140vh" : "90vh" });

  const targetScale =
    Math.ceil((window.innerWidth / Math.max(phone.offsetWidth, 1)) * 11) / 10;

  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        end: "bottom bottom",
        scrub: true,
        start: "top 40%",
        trigger: wrapper,
      },
    })
    .to(phoneWrapper, { duration: 0.4, y: "0vh" })
    .to(introVideo, { duration: 0.05, opacity: 0 }, 0)
    .to(
      gridCells,
      {
        duration: 0.01,
        opacity: 1,
        stagger: { amount: 0.6, from: "random" },
      },
      0.2,
    )
    .to(
      phone,
      {
        duration: 0.6,
        ease: "expoScale(1, 5)",
        rotate: 0.001,
        scale: targetScale,
      },
      0.35,
    )
    .from(
      lines,
      {
        autoAlpha: 0,
        duration: 0.2,
        stagger: { amount: 0.4 },
        yPercent: 50,
      },
      0.6,
    )
    .from(accents, { autoAlpha: 0, duration: 0.2 }, 0.8);

  const processSection = document.querySelector<HTMLElement>(
    ".process-section",
  );
  const processWrapper =
    processSection?.querySelector<HTMLElement>(".process-w");
  const firstProcessText =
    processSection?.querySelector<HTMLElement>(".process-text");

  if (processSection && processWrapper && firstProcessText) {
    const firstLines =
      firstProcessText.querySelectorAll<HTMLElement>(".line");
    const firstAccent =
      firstProcessText.querySelector<HTMLElement>(".line .is--alt") ??
      firstProcessText.querySelector<HTMLElement>(".is--alt");
    const processIntro = gsap
      .timeline({ defaults: { ease: "none" } })
      .from(processWrapper, { duration: 1, opacity: 0 })
      .from(
        firstLines,
        {
          autoAlpha: 0,
          clearProps: "all",
          duration: 0.5,
          stagger: 0.03,
          y: "1em",
        },
        0.6,
      );

    if (firstAccent) {
      processIntro.from(
        firstAccent,
        {
          duration: 0.5,
          scrambleText: {
            chars: SYMBOLS,
            revealDelay: 0.5,
            speed: 1,
            text: "{original}",
            tweenLength: false,
          },
        },
        0.6,
      );
    }

    gsap.set(processSection, { autoAlpha: 0 });
    ScrollTrigger.create({
      animation: processIntro,
      end: "bottom top",
      endTrigger: section,
      onEnter: () => gsap.set(processSection, { autoAlpha: 1 }),
      onLeaveBack: () => gsap.set(processSection, { autoAlpha: 0 }),
      scrub: true,
      start: "top top",
      trigger: processSection,
    });
  }

  const outro = document.querySelector<HTMLElement>(".lh-bottom");
  const outroImage = outro?.querySelector<HTMLElement>(".lh-bottom__img");
  if (outro && outroImage) {
    gsap.fromTo(
      outroImage,
      {
        rotate: 0.001,
        xPercent: -5,
        yPercent: 10,
        z: -100,
      },
      {
        rotate: -6,
        scrollTrigger: {
          end: "bottom top",
          scrub: true,
          start: "top bottom",
          trigger: outro,
        },
        xPercent: 5,
        yPercent: -5,
        z: 0,
      },
    );
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
) {
  const canvas = context.canvas;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight || !canvas.width || !canvas.height) return;

  const scale = Math.max(
    canvas.width / imageWidth,
    canvas.height / imageHeight,
  );
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const x = (canvas.width - width) * 0.5;
  const y = (canvas.height - height) * 0.5;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, x, y, width, height);
}

function createFrameSequence(container: HTMLElement): FrameSequence | null {
  const canvas = container.querySelector<HTMLCanvasElement>("canvas");
  const embed = container.querySelector<HTMLElement>(".embed");
  const context = canvas?.getContext("2d");
  if (!canvas || !embed || !context) return null;

  const frameCount = Number.parseInt(
    container.getAttribute("total-frames") ?? "0",
    10,
  );
  const zeros = Number.parseInt(
    container.getAttribute("floating-zeros") ?? "0",
    10,
  );
  const urlStart = container.getAttribute("url-start") ?? "";
  const urlEnd = container.getAttribute("url-end") ?? "";

  const images = Array.from({ length: frameCount }, (_, index) => {
    const image = new Image();
    image.decoding = "async";
    image.src = `${urlStart}${String(index + 1).padStart(zeros, "0")}${urlEnd}`;
    return image;
  });

  const resize = () => {
    canvas.width = Math.max(1, Math.round(embed.offsetWidth));
    canvas.height = Math.max(1, Math.round(embed.offsetHeight));
  };

  const draw = (frame: number) => {
    const boundedFrame = Math.max(0, Math.min(frameCount - 1, frame));
    const image = images[boundedFrame];
    if (image?.complete && image.naturalWidth) {
      drawCover(context, image);
    }
  };

  resize();
  images[0]?.addEventListener("load", () => draw(0), { once: true });

  const onResize = gsap.utils.pipe(
    () => {
      resize();
      draw(0);
    },
  );
  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(onResize, 100);
  });

  return { canvas, context, embed, frameCount, images, resize, draw };
}

function setupProcessSequence() {
  const container = document.querySelector<HTMLElement>(
    "[data-scrub-section]",
  );
  if (!container) return;

  const sequence = createFrameSequence(container);
  if (!sequence) return;

  const state = { frame: 0 };
  const progressBars = Array.from(
    container.querySelectorAll<HTMLElement>(".progress-bar"),
  );

  gsap.to(state, {
    ease: "none",
    frame: sequence.frameCount - 1,
    onUpdate: () => sequence.draw(Math.round(state.frame)),
    scrollTrigger: {
      end: container.getAttribute("scroll-end") ?? "bottom bottom",
      onUpdate: (trigger) => {
        const current = Math.min(
          progressBars.length - 1,
          Math.floor(trigger.progress * progressBars.length),
        );

        progressBars.forEach((bar, index) => {
          bar.classList.toggle("is--full", index < current);
          bar.classList.toggle("is--tall", index === current);
        });

        if (trigger.progress >= 1) {
          progressBars.at(-1)?.classList.add("is--full");
          progressBars.at(-1)?.classList.remove("is--tall");
        }
      },
      scrub: true,
      start: container.getAttribute("scroll-start") ?? "top top",
      trigger: container,
    },
    snap: "frame",
  });

  setupProcessText(container);
}

function setupProcessText(container: HTMLElement) {
  const texts = Array.from(
    container.querySelectorAll<HTMLElement>(".process-text"),
  );
  const triggers = Array.from(
    container.querySelectorAll<HTMLElement>(".process-trigger"),
  );
  const counter = container.querySelector<HTMLElement>("[data-progress-nr]");
  if (!texts.length) return;

  texts.forEach((text, index) => {
    gsap.set(text, { opacity: index === 0 ? 1 : 0 });
  });

  triggers.forEach((trigger, index) => {
    const current = texts[index];
    const next = texts[index + 1];
    if (!current || !next) return;

    const currentLines = current.querySelectorAll<HTMLElement>(".line");
    const nextLines = next.querySelectorAll<HTMLElement>(".line");
    const currentAccent =
      current.querySelector<HTMLElement>(".line .is--alt") ??
      current.querySelector<HTMLElement>(".is--alt");
    const nextAccent =
      next.querySelector<HTMLElement>(".line .is--alt") ??
      next.querySelector<HTMLElement>(".is--alt");

    gsap
      .timeline({
        scrollTrigger: {
          end: "top 40%",
          onEnter: () => {
            if (counter) counter.textContent = `0${index + 2}`;
          },
          onLeaveBack: () => {
            if (counter) counter.textContent = `0${index + 1}`;
          },
          scrub: true,
          start: "top 80%",
          trigger,
        },
      })
      .set(next, { opacity: 1 }, 0)
      .to(
        currentLines,
        {
          autoAlpha: 0,
          duration: 0.5,
          stagger: 0.03,
          y: "-1em",
        },
        0,
      )
      .to(
        currentAccent,
        {
          duration: 0.5,
          scrambleText: {
            chars: SYMBOLS,
            revealDelay: 0.5,
            speed: 1,
            text: "{original}",
            tweenLength: false,
          },
        },
        0,
      )
      .set(current, { opacity: 0 }, 0.5)
      .from(
        nextLines,
        {
          autoAlpha: 0,
          duration: 0.5,
          immediateRender: true,
          stagger: 0.03,
          y: "1em",
        },
        0.5,
      )
      .from(
        nextAccent,
        {
          duration: 0.5,
          immediateRender: true,
          scrambleText: {
            chars: SYMBOLS,
            revealDelay: 0.5,
            speed: 1,
            text: "{original}",
            tweenLength: false,
          },
        },
        0.5,
      );
  });
}

function setupSupportSequence() {
  const container = document.querySelector<HTMLElement>(
    "[data-autoplay-section]",
  );
  if (!container) return;

  const sequence = createFrameSequence(container);
  if (!sequence) return;

  let frame = 0;
  let interval: number | null = null;
  const fps = Number.parseInt(container.getAttribute("fps") ?? "30", 10);

  const start = () => {
    if (interval !== null) return;
    interval = window.setInterval(() => {
      frame = (frame + 1) % sequence.frameCount;
      sequence.draw(frame);
    }, 1000 / fps);
  };

  const stop = () => {
    if (interval === null) return;
    window.clearInterval(interval);
    interval = null;
  };

  ScrollTrigger.create({
    end: "bottom top",
    onEnter: start,
    onEnterBack: start,
    onLeave: stop,
    onLeaveBack: stop,
    start: "top bottom",
    trigger: container,
  });
}

function revealSwiper(container: HTMLElement) {
  container.style.opacity = "0";
  requestAnimationFrame(() => {
    container.style.transition = "opacity 250ms ease";
    container.style.opacity = "1";
  });
}

function setupSwipers() {
  const coverflow = document.querySelector<HTMLElement>(".swiper.coverflow");
  if (coverflow) {
    const instance = new Swiper(coverflow, {
      breakpoints: {
        480: { spaceBetween: 50 },
      },
      centeredSlides: true,
      coverflowEffect: {
        depth: 100,
        modifier: 1,
        rotate: 35,
        slideShadows: false,
        stretch: 0,
      },
      effect: "coverflow",
      grabCursor: true,
      initialSlide: 1,
      modules: [EffectCoverflow, Navigation],
      navigation: {
        nextEl: document.querySelector<HTMLElement>("[data-coverflow-next]"),
        prevEl: document.querySelector<HTMLElement>("[data-coverflow-prev]"),
      },
      slideToClickedSlide: true,
      slidesPerView: "auto",
      spaceBetween: 16,
      speed: 600,
    });
    revealSwiper(coverflow);
    void instance;
  }

  const press = document.querySelector<HTMLElement>(".swiper.press");
  if (press) {
    const instance = new Swiper(press, {
      breakpoints: {
        480: { spaceBetween: 64 },
      },
      centeredSlides: true,
      grabCursor: true,
      modules: [Navigation],
      navigation: {
        nextEl: document.querySelector<HTMLElement>("[data-press-next]"),
        prevEl: document.querySelector<HTMLElement>("[data-press-prev]"),
      },
      slidesPerView: "auto",
      spaceBetween: 16,
      speed: 800,
    });
    revealSwiper(press);
    ScrollTrigger.create({
      once: true,
      onEnter: () => instance.slideTo(1, 800, true),
      start: "center 75%",
      trigger: press,
    });
  }

  const reviews = document.querySelector<HTMLElement>(".swiper.reviews");
  if (reviews) {
    const instance = new Swiper(reviews, {
      breakpoints: {
        480: { slidesPerView: 2.5, spaceBetween: 24 },
        767: { slidesPerView: "auto", spaceBetween: 48 },
      },
      centeredSlides: true,
      grabCursor: true,
      modules: [Mousewheel],
      mousewheel: {
        enabled: true,
        forceToAxis: true,
      },
      slideToClickedSlide: true,
      slidesPerView: 1.2,
      spaceBetween: 16,
      speed: 800,
    });
    revealSwiper(reviews);
    ScrollTrigger.create({
      once: true,
      onEnter: () => instance.slideTo(2, 800, true),
      start: "center 75%",
      trigger: reviews,
    });
  }
}

function setupEducationToggle() {
  const toggles = Array.from(
    document.querySelectorAll<HTMLElement>(".blog-toggle__link"),
  );
  if (!toggles.length) return;

  const newsCards = document.querySelectorAll<HTMLElement>(
    '[data-blog-card="news"]',
  );
  const academyCards = document.querySelectorAll<HTMLElement>(
    '[data-blog-card="academy"]',
  );
  const content = document.querySelector<HTMLElement>(".toggle-content");
  const newsWrapper = document.querySelector<HTMLElement>(
    ".toggle-news__wrap",
  );
  const academyWrapper = document.querySelector<HTMLElement>(
    ".toggle-academy__wrap",
  );
  let showAcademy = true;

  const maxHeight = (elements: NodeListOf<HTMLElement>) =>
    Math.max(...Array.from(elements, (element) => element.offsetHeight), 0);

  const switchCards = (academy: boolean) => {
    if (academy) {
      if (academyWrapper) academyWrapper.style.display = "block";
      if (content) {
        content.style.height = `${maxHeight(
          document.querySelectorAll<HTMLElement>(".toggle-academy__wrap"),
        )}px`;
      }
      gsap.to(newsCards, {
        autoAlpha: 0,
        ease: "main",
        stagger: 0.05,
        xPercent: -50,
      });
      gsap.to(academyCards, {
        autoAlpha: 1,
        delay: 0.1,
        ease: "main",
        onComplete: () => {
          if (newsWrapper) newsWrapper.style.display = "none";
        },
        stagger: 0.05,
        xPercent: -50,
      });
    } else {
      if (newsWrapper) newsWrapper.style.display = "block";
      if (content) {
        content.style.height = `${maxHeight(
          document.querySelectorAll<HTMLElement>(".toggle-news__wrap"),
        )}px`;
      }
      gsap.to(newsCards, {
        autoAlpha: 1,
        delay: 0.1,
        ease: "main",
        stagger: { each: 0.05, from: "start" },
        xPercent: 0,
      });
      gsap.to(academyCards, {
        autoAlpha: 0,
        ease: "main",
        onComplete: () => {
          if (academyWrapper) academyWrapper.style.display = "none";
        },
        stagger: { each: 0.05, from: "start" },
        xPercent: 50,
      });
    }
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggles.forEach((candidate) => candidate.classList.toggle("active"));
      switchCards(showAcademy);
      showAcademy = !showAcademy;
      ScrollTrigger.refresh();
    });
  });
}

function setupMarquees() {
  document
    .querySelectorAll<HTMLElement>("[data-css-marquee]")
    .forEach((marquee) => {
      const originals = Array.from(
        marquee.querySelectorAll<HTMLElement>("[data-css-marquee-list]"),
      );
      if (originals.length === 1) {
        marquee.append(originals[0].cloneNode(true));
      }

      const lists = marquee.querySelectorAll<HTMLElement>(
        "[data-css-marquee-list]",
      );
      lists.forEach((list) => {
        list.style.animationDuration = `${list.offsetWidth / 75}s`;
        list.style.animationPlayState = "paused";
      });

      const observer = new IntersectionObserver(([entry]) => {
        lists.forEach((list) => {
          list.style.animationPlayState = entry?.isIntersecting
            ? "running"
            : "paused";
        });
      });
      observer.observe(marquee);
    });
}

function setupVisibilityObservers() {
  document.querySelectorAll<HTMLElement>("[data-visible]").forEach((element) => {
    ScrollTrigger.create({
      end: "bottom top",
      onEnter: () => element.setAttribute("data-visible", "true"),
      onEnterBack: () => element.setAttribute("data-visible", "true"),
      onLeave: () => element.setAttribute("data-visible", "false"),
      onLeaveBack: () => element.setAttribute("data-visible", "false"),
      start: "top bottom",
      trigger: element,
    });
  });
}

function setupScrambleLinks() {
  document.querySelectorAll<HTMLElement>("[scramble-link]").forEach((link) => {
    const label = link.querySelector<HTMLElement>("[scramble-text]") ?? link;
    const timeline = gsap.timeline({ paused: true });
    timeline.to(label, {
      duration: 0.8,
      ease: "main",
      scrambleText: {
        chars: "uppercase",
        delimiter: "",
        speed: 1,
        text: "{original}",
      },
    });

    link.addEventListener("mouseenter", () => {
      timeline.timeScale(1).play();
    });
    link.addEventListener("mouseleave", () => {
      timeline.timeScale(100).reverse();
    });
  });
}

function setupSeoShowMore() {
  document.querySelectorAll<HTMLElement>(".seo-show-button").forEach((button) => {
    const section =
      button.closest<HTMLElement>(".jhjhjh") ??
      button.parentElement?.parentElement;
    const wrapper = section?.querySelector<HTMLElement>(".seo-wrapper");
    const fade = section?.querySelector<HTMLElement>(".div-block-10");
    const more = button.querySelector<HTMLElement>(".seo-more");
    const less = button.querySelector<HTMLElement>(".seo-less");
    const icon = button.querySelector<HTMLElement>("[seo-show-icon]");
    const collapsedHeight = 140;
    let expanded = false;
    let animating = false;

    if (wrapper) gsap.set(wrapper, { height: collapsedHeight });
    if (icon) gsap.set(icon, { rotation: 180 });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (animating) return;
      animating = true;
      expanded = !expanded;

      if (expanded) {
        if (wrapper) {
          gsap.set(wrapper, { height: "auto" });
          const height = wrapper.scrollHeight;
          gsap.set(wrapper, { height: collapsedHeight });
          gsap.to(wrapper, {
            duration: 0.5,
            ease: "power2.inOut",
            height,
            onComplete: () => {
              gsap.set(wrapper, { height: "auto" });
              animating = false;
              ScrollTrigger.refresh();
            },
          });
        } else {
          animating = false;
        }
        if (fade) gsap.to(fade, { duration: 0.4, opacity: 0 });
        if (more) {
          gsap.to(more, {
            duration: 0.2,
            opacity: 0,
            onComplete: () => {
              more.style.display = "none";
            },
          });
        }
        if (less) {
          less.style.display = "flex";
          gsap.fromTo(
            less,
            { opacity: 0 },
            { delay: 0.15, duration: 0.2, opacity: 1 },
          );
        }
        if (icon) {
          gsap.to(icon, {
            duration: 0.4,
            ease: "power2.inOut",
            rotation: 0,
          });
        }
      } else {
        if (wrapper) {
          gsap.to(wrapper, {
            duration: 0.5,
            ease: "power2.inOut",
            height: collapsedHeight,
            onComplete: () => {
              animating = false;
              ScrollTrigger.refresh();
            },
          });
        } else {
          animating = false;
        }
        if (fade) gsap.to(fade, { duration: 0.4, opacity: 1 });
        if (less) {
          gsap.to(less, {
            duration: 0.2,
            opacity: 0,
            onComplete: () => {
              less.style.display = "";
            },
          });
        }
        if (more) {
          more.style.display = "";
          gsap.fromTo(
            more,
            { opacity: 0 },
            { delay: 0.15, duration: 0.2, opacity: 1 },
          );
        }
        if (icon) {
          gsap.to(icon, {
            duration: 0.4,
            ease: "power2.inOut",
            rotation: 180,
          });
        }
      }
    });
  });
}

function setupResponsiveState() {
  const setAppHeight = () => {
    document.documentElement.style.setProperty(
      "--app-height",
      `${window.innerHeight}px`,
    );
  };
  setAppHeight();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setAppHeight();
      ScrollTrigger.refresh();
    }, 150);
  });
}

function initialize() {
  if (document.documentElement.classList.contains("tradel-initialized")) return;
  document.documentElement.classList.add("tradel-initialized");

  prepareBrandingAndAnchors();
  setupResponsiveState();
  setupSplitText();
  setupSmoothScroll();
  setupNavigation();
  setupPixelScanners();
  setupStaggeredTitles();
  setupLighthouseStory();
  setupProcessSequence();
  setupSupportSequence();
  setupSwipers();
  setupEducationToggle();
  setupMarquees();
  setupVisibilityObservers();
  setupScrambleLinks();
  setupSeoShowMore();

  document.documentElement.classList.add("js-ready");
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
