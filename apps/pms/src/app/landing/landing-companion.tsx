"use client";

import { useEffect, useRef, useId } from "react";

/** A rendered 3D companion with independently tracked, textured irises. */
export function LandingCompanion() {
  const id = useId().replace(/:/g, "");
  const asset = "/illustrations/landing-companion-3d-v2.png";
  const portrait = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = portrait.current;
    if (!svg) return;
    const media = window.matchMedia("(prefers-reduced-motion: no-preference) and (pointer: fine)");
    let frame = 0;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    const render = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      svg.style.setProperty("--look-x", `${x}px`);
      svg.style.setProperty("--look-y", `${y}px`);
      svg.style.setProperty("--portrait-x", `${x * 0.3}px`);
      svg.style.setProperty("--portrait-y", `${y * 0.3}px`);
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.04 ? requestAnimationFrame(render) : 0;
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      x = y = targetX = targetY = 0;
      svg.style.setProperty("--look-x", "0px");
      svg.style.setProperty("--look-y", "0px");
      svg.style.setProperty("--portrait-x", "0px");
      svg.style.setProperty("--portrait-y", "0px");
    };
    const move = (event: PointerEvent) => {
      if (!media.matches || event.pointerType === "touch") return;
      const bounds = svg.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const dx = (event.clientX - bounds.left - bounds.width / 2) / bounds.width;
      const dy = (event.clientY - bounds.top - bounds.height * 0.42) / bounds.height;
      const length = Math.hypot(dx, dy);
      const scale = length > 1 ? 1 / length : 1;
      targetX = dx * scale * 10;
      targetY = dy * scale * 7;
      if (!frame) frame = requestAnimationFrame(render);
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", reset);
    window.addEventListener("blur", reset);
    media.addEventListener("change", reset);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", reset);
      window.removeEventListener("blur", reset);
      media.removeEventListener("change", reset);
    };
  }, []);

  return (
    <div className="landing-companion">
      <span className="companion-note">Good work. Good company.</span>
      <svg ref={portrait} viewBox="0 0 1196 1315" role="img" aria-label="3D pink-haired workspace companion with sparkling green eyes" className="companion-3d">
        <defs>
          <clipPath id={`${id}-left-eye`}>
            <path d="M411 599Q405 557 422 523Q446 486 481 492Q528 493 542 539Q551 567 544 600Q474 619 411 599Z" />
          </clipPath>
          <clipPath id={`${id}-right-eye`}>
            <path d="M700 585Q689 547 706 510Q729 476 762 482Q811 483 834 522Q850 551 834 589Q767 603 700 585Z" />
          </clipPath>
          <clipPath id={`${id}-left-iris`}><ellipse cx="500" cy="553" rx="55" ry="59" /></clipPath>
          <clipPath id={`${id}-right-iris`}><ellipse cx="754" cy="538" rx="56" ry="61" /></clipPath>
          <radialGradient id={`${id}-eye-white`}><stop stopColor="var(--color-base-white)" /><stop offset="1" stopColor="var(--color-gray-100)" /></radialGradient>
        </defs>
        <image href={asset} width="1196" height="1315" />
        {(["left", "right"] as const).map((side) => (
          <g key={side} clipPath={`url(#${id}-${side}-eye)`}>
            <rect width="1196" height="1315" fill={`url(#${id}-eye-white)`} />
            <g className="companion-pupil">
              <image href={asset} width="1196" height="1315" clipPath={`url(#${id}-${side}-iris)`} />
            </g>
          </g>
        ))}
      </svg>
      <span className="companion-status"><span /> Your team’s little cheerleader</span>
    </div>
  );
}
