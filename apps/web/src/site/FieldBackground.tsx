import { useEffect, useRef, useState } from "react";

type FieldVariant = "field" | "ithaca" | "troy" | "delphi";

/** Decorative media only. The caller owns the device motion preferences. */
export function FieldBackground({ enabled, variant = "field" }: { enabled: boolean; variant?: FieldVariant }) {
  const region = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(() => !document.hidden);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const target = region.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    let firstFrame = 0;
    let secondFrame = 0;
    const nearby = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      nearby.disconnect();
      // Give text and the poster a paint before attaching any video source.
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setReady(true));
      });
    }, { rootMargin: "200px" });
    const onscreen = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    nearby.observe(target);
    onscreen.observe(target);
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      nearby.disconnect();
      onscreen.disconnect();
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const loadVideo = enabled && ready && documentVisible && !failed;
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let current = true;
    if (loadVideo && visible) {
      element.play().then(() => {
        if (current) setHasFrame(true);
      }).catch(() => {
        // Autoplay denial or an interrupted play never blocks the page.
        if (current) setHasFrame(false);
      });
    } else element.pause();
    return () => {
      current = false;
      element.pause();
    };
  }, [loadVideo, visible]);

  return <div className="field-background" ref={region} aria-hidden="true">
    <img src={`/media/field/${variant}-poster.webp`} alt="" width="1920" height="1080" decoding="async" />
    {loadVideo && <video
      ref={video}
      className={hasFrame ? "field-video is-ready" : "field-video"}
      src={`/media/field/${variant}-loop.mp4`}
      muted loop playsInline preload="none" tabIndex={-1}
      onLoadStart={() => setHasFrame(false)}
      onError={() => setFailed(true)}
    />}
  </div>;
}
