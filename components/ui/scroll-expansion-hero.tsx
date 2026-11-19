"use client";

// Scroll Expansion Hero. The scroll maths (wheel 0.0009, touch 0.005 / 0.008, sizes, fades and the
// words flying apart) are the original component's. Changes made to fit this website:
//  - plain <img> instead of next/image (this site is Vite, not Next.js)
//  - gold and serif styling instead of the demo's blue
//  - the scroll state is also kept in refs, so menu links and the browser's back button can
//    open the hero first and then scroll to their section (otherwise the hero scrolls them back up)
//  - a page opened on a section address (e.g. /calculator) starts already expanded
//  - keyboard keys expand it too, and the empty content block is not drawn when there are no children
//  - on desktop the picture keeps clear of the fixed navigation
//  - "Scroll to explore" rises and fades as the picture opens, instead of sliding off to the side
//  - the title has a dark outline and shadow so it stays readable over a busy picture
//  - a title written "First|Rest" sets its two lines explicitly

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

interface ScrollExpandMediaProps {
  mediaType?: "video" | "image";
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  /** Start fully open (used when the page is opened on a section address). */
  startExpanded?: boolean;
  /** Alt text for the expanding picture. */
  mediaAlt?: string;
  children?: ReactNode;
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

// How far each key moves the expansion.
const KEY_STEP: Record<string, number> = {
  ArrowDown: 0.1,
  PageDown: 0.4,
  " ": 0.4,
  End: 1,
  ArrowUp: -0.1,
  PageUp: -0.4,
  Home: -1,
};

const GOLD = "#e7cf9b";

const ScrollExpandMedia = ({
  mediaType = "video",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  startExpanded = false,
  mediaAlt,
  children,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(startExpanded ? 1 : 0);
  const [showContent, setShowContent] = useState<boolean>(startExpanded);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(startExpanded);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<number>(startExpanded ? 1 : 0);
  const expandedRef = useRef<boolean>(startExpanded);
  const touchStartYRef = useRef<number>(0);

  useEffect(() => {
    const apply = (next: number) => {
      const p = clamp01(next);
      progressRef.current = p;
      setScrollProgress(p);
      if (p >= 1) {
        expandedRef.current = true;
        setMediaFullyExpanded(true);
        setShowContent(true);
      } else if (p < 0.75) {
        setShowContent(false);
      }
    };
    const collapse = () => {
      expandedRef.current = false;
      setMediaFullyExpanded(false);
    };

    const handleWheel = (e: WheelEvent) => {
      if (expandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        collapse();
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        apply(progressRef.current + e.deltaY * 0.0009);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const startY = touchStartYRef.current;
      if (!startY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = startY - touchY;

      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        collapse();
        e.preventDefault();
      } else if (!expandedRef.current) {
        e.preventDefault();
        // Increase sensitivity for mobile, especially when scrolling back
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005; // Higher sensitivity for scrolling back
        apply(progressRef.current + deltaY * scrollFactor);
        touchStartYRef.current = touchY;
      }
    };

    const handleTouchEnd = (): void => {
      touchStartYRef.current = 0;
    };

    const handleScroll = (): void => {
      if (!expandedRef.current) {
        window.scrollTo(0, 0);
      }
    };

    // Keyboard: the page cannot scroll while the hero is closed, so the keys drive it instead.
    const handleKey = (e: KeyboardEvent) => {
      if (expandedRef.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(t.tagName)) return;
      let step = KEY_STEP[e.key];
      if (step === undefined) return;
      if (e.key === " " && e.shiftKey) step = -step;
      e.preventDefault();
      apply(progressRef.current + step);
    };

    // Menu links and the back button: open the hero first, so the page can scroll to the section.
    const openForLink = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || expandedRef.current) return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && (url.pathname.replace(/\/+$/, "") || "/") !== "/") apply(1);
    };
    const openForPath = () => {
      if (!expandedRef.current && (location.pathname.replace(/\/+$/, "") || "/") !== "/") apply(1);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKey);
    document.addEventListener("click", openForLink, true);
    window.addEventListener("popstate", openForPath);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("click", openForLink, true);
      window.removeEventListener("popstate", openForPath);
    };
  }, []);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  // The title slides off to the sides as the picture opens; "Scroll to explore" rises and fades.
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);
  const textRise = `translateY(-${(scrollProgress * 60).toFixed(2)}vh)`;
  const textFade = clamp01(1 - scrollProgress * 1.6);

  // "First|Rest" sets the two lines of the title explicitly; otherwise the first word is the top line.
  const [firstWord, restOfTitle] = title?.includes("|")
    ? (title.split("|", 2) as [string, string])
    : [title ? title.split(" ")[0] : "", title ? title.split(" ").slice(1).join(" ") : ""];

  const titleClass =
    "font-serif text-[clamp(40px,6.2vw,108px)] font-semibold leading-[1.05] transition-none [paint-order:stroke_fill] [-webkit-text-stroke:0.06em_rgba(5,7,13,0.9)] [text-shadow:0_3px_6px_rgba(0,0,0,0.85),0_0_36px_rgba(0,0,0,0.75)]";

  return (
    <div
      ref={sectionRef}
      className="transition-colors duration-700 ease-in-out overflow-x-hidden"
    >
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">
          <motion.div
            className="absolute inset-0 z-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
              className="w-screen h-screen"
              style={{
                objectFit: "cover",
                // Anchored to the left and near the bottom, so the round logo painted into the
                // bottom-left corner is always whole: wide screens trim the sky, tall ones the right edge.
                objectPosition: "0% 90%",
              }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">
              <div
                className="absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: "95vw",
                  maxHeight: isMobileState ? "85vh" : "min(85vh, calc(100dvh - 180px))",
                  boxShadow: `0 0 0 1px ${GOLD}66, 0px 0px 50px rgba(0, 0, 0, 0.3)`,
                }}
              >
                {mediaType === "video" ? (
                  mediaSrc.includes("youtube.com") ? (
                    <div className="relative w-full h-full pointer-events-none">
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          mediaSrc.includes("embed")
                            ? mediaSrc +
                              (mediaSrc.includes("?") ? "&" : "?") +
                              "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1"
                            : mediaSrc.replace("watch?v=", "embed/") +
                              "?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=" +
                              mediaSrc.split("v=")[1]
                        }
                        className="w-full h-full rounded-xl"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full pointer-events-none">
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover rounded-xl"
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      <div
                        className="absolute inset-0 z-10"
                        style={{ pointerEvents: "none" }}
                      ></div>

                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-xl"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={mediaSrc}
                      alt={mediaAlt || title || "Media content"}
                      width={1280}
                      height={720}
                      decoding="async"
                      className="w-full h-full object-cover rounded-xl"
                    />

                    <motion.div
                      className="absolute inset-0 bg-black/50 rounded-xl"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <div className="flex flex-col items-center text-center relative z-10 mt-4 transition-none">
                  {date && (
                    <p
                      className="text-[clamp(16px,1.6vw,28px)] font-semibold tracking-[0.2em] uppercase [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]"
                      style={{ color: GOLD, transform: textRise, opacity: textFade }}
                    >
                      {date}
                    </p>
                  )}
                  {scrollToExpand && (
                    <p
                      className="font-semibold text-center tracking-[0.2em] uppercase text-sm md:text-base text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]"
                      style={{ transform: textRise, opacity: textFade }}
                    >
                      {scrollToExpand}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex items-center justify-center text-center gap-4 w-full relative z-10 transition-none flex-col ${
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                }`}
              >
                <motion.h2
                  className={titleClass}
                  style={{ color: GOLD, transform: `translateX(-${textTranslateX}vw)` }}
                >
                  {firstWord}
                </motion.h2>
                <motion.h2
                  className={`${titleClass} text-center`}
                  style={{ color: "#ffffff", transform: `translateX(${textTranslateX}vw)` }}
                >
                  {restOfTitle}
                </motion.h2>
              </div>
            </div>

            {children ? (
              <motion.section
                className="flex flex-col w-full px-8 py-10 md:px-16 lg:py-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.7 }}
              >
                {children}
              </motion.section>
            ) : null}
          </div>
        </div>
      </section>
      {/* Read by tests and assistive tech: whether the picture is fully open. */}
      <span className="sr-only" data-hero-open={mediaFullyExpanded ? "true" : "false"} />
    </div>
  );
};

export default ScrollExpandMedia;
