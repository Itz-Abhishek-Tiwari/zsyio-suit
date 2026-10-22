"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowRight, Workflow, FileText, Fingerprint, Target, Terminal, KeyRound, ShieldCheck, Users, Plus, ChevronLeft, ChevronRight, Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MarketingHeader, MarketingFooter } from "./marketing-shell";
import type LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/locomotive-scroll.css";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface LandingViewProps {
  appUrls: { pms: string; notes: string; hrms: string; admin: string; sales: string };
}

const APPS = [
  { key: "pms", name: "Flow", verb: "Make progress.", category: "Projects & delivery", icon: Workflow, description: "From the first task to the final release. Give every project a plan, an owner, and a clear next step.", features: ["Kanban boards", "Sprint planning", "Time tracking"], phrase: "An idea becomes a plan." },
  { key: "notes", name: "Canvas", verb: "Keep the context.", category: "Docs & knowledge", icon: FileText, description: "Write the thinking behind the work. Specs, decisions, and shared knowledge belong in the same conversation.", features: ["Rich documents", "Shared folders", "Diagrams & templates"], phrase: "A plan gets its context." },
  { key: "hrms", name: "People", verb: "Put people first.", category: "People & attendance", icon: Fingerprint, description: "A clear place for the everyday details. Attendance, time, and leave, with less admin between people and their work.", features: ["Attendance", "Leave management", "Timesheets"], phrase: "The right people move it forward." },
  { key: "sales", name: "Pulse", verb: "Move things forward.", category: "Sales & relationships", icon: Target, description: "Follow the conversations that become opportunities. Keep your pipeline, next steps, and client relationships in view.", features: ["Sales pipeline", "Activity timelines", "Client relationships"], phrase: "Progress becomes an opportunity." },
  { key: "admin", name: "Console", verb: "Stay in control.", category: "Access & governance", icon: Terminal, description: "One place to manage the workspace. Bring your team together with clear roles, shared accounts, and domain controls.", features: ["User directory", "Custom roles", "Domain controls"], phrase: "Everything has its place." },
] as const;

const CHAPTERS = [
  { title: "Give the idea a direction.", app: "Flow", label: "Turn intent into action", body: "Break work into projects, make the next step clear, and keep delivery moving.", image: "connected-ribbon.webp", alt: "A blue ribbon connecting five angular forms", detail: "Projects · Sprints · Tasks" },
  { title: "Keep the thinking close.", app: "Canvas", label: "Make context part of the work", body: "Specs, decisions, and shared knowledge. A place for everything your team needs to know.", image: "connected-foundation.webp", alt: "Interlocking metal frames with a cobalt glass slab", detail: "Documents · Diagrams · Decisions" },
  { title: "Move forward, together.", app: "The suite", label: "Bring the whole team into view", body: "People, relationships, and access, with a shared identity across every app.", image: "connected-team.webp", alt: "Five blue discs linked in a balanced metal sculpture", detail: "People · Pulse · Console" },
];

const QUESTIONS = [
  ["Do I need five different logins?", "No. One sign-in gives you access to the apps your role allows, with your account and team shared across the suite."],
  ["Can I control who accesses each app?", "Yes. Console lets you manage users, teams, roles, and permissions, including access to individual applications."],
  ["Where do documents and projects fit together?", "Flow organizes project delivery. Canvas keeps specs, decisions, and shared documents alongside the work in the same suite."],
  ["Does the interface support dark mode?", "Yes. The workspace supports light and dark themes, along with keyboard shortcuts for everyday navigation."],
];

export function LandingView({ appUrls }: LandingViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const locomotive = useRef<LocomotiveScroll | null>(null);
  const [activeApp, setActiveApp] = useState(0);
  const selectedApp = APPS[activeApp];
  const primaryHref = `${appUrls.pms}/login`;
  const primaryLabel = "Enter workspace";

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".landing-nav", { y: -12, opacity: 0, duration: 0.55 })
        .from(".hero-line > span", { yPercent: 108, rotate: 2, duration: 1.1, stagger: 0.12 }, 0.12)
        .from(".hero-support", { y: 18, opacity: 0, duration: 0.7 }, 0.5)
        .from(".hero-art", { y: 30, opacity: 0, duration: 1 }, 0.4);
      gsap.utils.toArray<HTMLElement>(".landing-reveal").forEach((element) => {
        gsap.from(element, { y: 32, opacity: 0, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
      });
      return undefined;
    });
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      let disposed = false;
      // Locomotive v5 uses native document scroll, so ScrollTrigger needs no scroller proxy.
      void import("locomotive-scroll").then(({ default: Locomotive }) => {
        if (disposed) return;
        locomotive.current = new Locomotive({ lenisOptions: { lerp: 0.085, smoothWheel: true, anchors: { offset: -80 } }, scrollCallback: () => ScrollTrigger.update() });
        ScrollTrigger.refresh();
      });
      gsap.to(".hero-art img", { yPercent: 8, scale: 1.06, ease: "none", scrollTrigger: { trigger: ".hero-art", start: "top bottom", end: "bottom top", scrub: true } });
      const panels = gsap.utils.toArray<HTMLElement>(".journey-panel");
      const track = root.current?.querySelector<HTMLElement>(".journey-track");
      const journey = root.current?.querySelector<HTMLElement>(".journey");
      if (track && journey) {
        journey.classList.add("is-pinned");
        const pan = gsap.to(track, {
          x: () => -(track.scrollWidth - journey.clientWidth), ease: "none",
          scrollTrigger: { trigger: journey, start: "top top", end: () => `+=${journey.clientWidth * (panels.length - 1) * 0.75}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
        });
        panels.forEach((panel) => {
          const image = panel.querySelector("img");
          if (image) gsap.fromTo(image, { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: pan, start: "left right", end: "right left", scrub: true } });
        });
      }
      gsap.to(".manifesto-emphasis", { backgroundSize: "100% 100%", ease: "none", scrollTrigger: { trigger: ".manifesto", start: "top 70%", end: "bottom 70%", scrub: true } });
      return () => { disposed = true; locomotive.current?.destroy(); locomotive.current = null; journey?.classList.remove("is-pinned"); };
    });
    return () => mm.revert();
  }, { scope: root });

  useGSAP(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(".explorer-panel", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
    }
  }, { scope: root, dependencies: [activeApp], revertOnUpdate: true });

  function handleAppKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % APPS.length;
    else if (event.key === "ArrowLeft") next = (index + APPS.length - 1) % APPS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = APPS.length - 1;
    else return;
    event.preventDefault();
    setActiveApp(next);
    root.current?.querySelector<HTMLButtonElement>(`#explorer-tab-${APPS[next].key}`)?.focus();
  }

  return (
    <div ref={root} className="landing-page">
      <a href="#main-content" className="landing-skip">Skip to content</a>
      <MarketingHeader />
      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-composition">
            <div className="hero-copy">
              <p className="hero-eyebrow">The space between idea and done.</p>
              <h1><span className="hero-line"><span>Work,</span></span><span className="hero-line"><span>connected<span className="hero-period">.</span></span></span></h1>
              <div className="hero-support">
                <p>Bring your projects, knowledge, and people into one shared workspace.</p>
                <div className="hero-links"><a className="landing-button" href={primaryHref}>{primaryLabel}<ArrowUpRight aria-hidden="true" size={19} /></a><a href="#apps" className="hero-secondary">Discover the suite<ArrowRight size={16} aria-hidden="true" /></a></div>
              </div>
            </div>
            <figure className="hero-art">
              <Image src="/images/landing/connected-ribbon.webp" alt="A continuous blue metal ribbon folding into five connected forms" width={1536} height={1024} priority sizes="(max-width: 768px) 100vw, 55vw" />
            </figure>
          </div>
          <div className="suite-signature" aria-label="Five apps in the suite">
            {APPS.map(({ key, name, category, icon: Icon }) => <a key={key} href={appUrls[key]}><Icon size={20} strokeWidth={1.5} aria-hidden="true" /><span>{name}<small>{category}</small></span><ArrowUpRight size={14} aria-hidden="true" /></a>)}
          </div>
        </section>

        <section id="platform" className="manifesto section-shell">
          <p className="section-label landing-reveal">Less switching. More perspective.</p>
          <h2 className="landing-reveal">Great work happens<br />when <span className="manifesto-emphasis">it all connects.</span></h2>
          <div className="manifesto-bottom landing-reveal"><p>Separate tools shouldn’t mean separate worlds. Keep your team, your roles, and the thinking behind the work in the same place.</p><div className="workspace-facts"><div><strong>5</strong><span>Focused apps</span></div><div><strong>1</strong><span>Shared identity</span></div></div></div>
        </section>

        <section className="journey" aria-label="How the suite connects your work">
          <div className="journey-track">
            {CHAPTERS.map((chapter, index) => <article className={`journey-panel journey-panel-${index}`} key={chapter.title}>
              <div className="chapter-copy">
                <div className="journey-top"><span>{chapter.app}</span><span>{chapter.label}</span></div>
                <div className="journey-main"><h2>{chapter.title}</h2><p>{chapter.body}</p></div>
                <div className="journey-bottom"><span>{chapter.detail}</span><div className="journey-position" aria-label={`Chapter ${index + 1} of 3`}>{CHAPTERS.map((item, i) => <span className={i === index ? "selected" : ""} key={item.title} />)}</div></div>
              </div>
              <figure className="chapter-art"><Image src={`/images/landing/${chapter.image}`} alt={chapter.alt} width={1536} height={1024} sizes="(max-width: 768px) 100vw, 55vw" /></figure>
            </article>)}
          </div>
        </section>

        <section id="apps" className="app-directory section-shell">
          <div className="directory-heading landing-reveal"><h2>One suite.<br />Your kind of work.</h2><p>Choose the tool for the moment.<br />Keep everything else in reach.</p></div>
          <div className="app-explorer landing-reveal">
            <div className="explorer-tabs" role="tablist" aria-label="Explore Zsyio apps">
              {APPS.map((app, index) => <button key={app.key} id={`explorer-tab-${app.key}`} type="button" role="tab" aria-selected={activeApp === index} aria-controls="explorer-panel" tabIndex={activeApp === index ? 0 : -1} onClick={() => setActiveApp(index)} onKeyDown={(event) => handleAppKey(event, index)}><app.icon size={18} strokeWidth={1.5} aria-hidden="true" />{app.name}</button>)}
            </div>
            <div className="explorer-panel" id="explorer-panel" role="tabpanel" aria-labelledby={`explorer-tab-${selectedApp.key}`} tabIndex={0}>
              <div className="explorer-copy"><span className="explorer-category">{selectedApp.category}</span><h3>{selectedApp.verb}</h3><p>{selectedApp.description}</p><a href={appUrls[selectedApp.key]} className="landing-button">Open {selectedApp.name}<ArrowUpRight size={18} aria-hidden="true" /></a></div>
              <div className="explorer-capabilities"><div className="explorer-app-title"><selectedApp.icon size={30} strokeWidth={1.3} aria-hidden="true" /><span>{selectedApp.name}</span></div><ul>{selectedApp.features.map((feature) => <li key={feature}><Check size={18} strokeWidth={1.5} aria-hidden="true" />{feature}</li>)}</ul><p>Part of one connected workspace.</p></div>
            </div>
            <div className="explorer-controls"><p><span>{selectedApp.name}</span> / Zsyio suite</p><div><button type="button" aria-label="Previous app" onClick={() => setActiveApp((activeApp + APPS.length - 1) % APPS.length)}><ChevronLeft size={18} /></button><button type="button" aria-label="Next app" onClick={() => setActiveApp((activeApp + 1) % APPS.length)}><ChevronRight size={18} /></button></div></div>
          </div>
        </section>

        <section className="foundation section-shell">
          <figure className="foundation-art landing-reveal"><Image src="/images/landing/connected-foundation.webp" alt="Interlocking aluminum frames and a blue glass slab forming a single architectural structure" width={1536} height={1024} sizes="(max-width: 768px) 100vw, 48vw" /></figure>
          <div className="foundation-copy landing-reveal"><h2>A shared place.<br />A solid foundation.</h2><p>Thoughtful on the surface.<br />Connected underneath.</p>
            <div className="foundation-feature"><KeyRound size={20} strokeWidth={1.5} /><div><h3>One identity</h3><p>Sign in once. Move between the apps your role allows.</p></div></div>
            <div className="foundation-feature"><ShieldCheck size={20} strokeWidth={1.5} /><div><h3>Clear permissions</h3><p>Manage access by role, capability, and domain.</p></div></div>
            <div className="foundation-feature"><Users size={20} strokeWidth={1.5} /><div><h3>A shared team</h3><p>The same people and accounts across your workspace.</p></div></div>
          </div>
        </section>

        <section id="questions" className="questions section-shell">
          <h2 className="landing-reveal">A few things<br />you might be wondering.</h2>
          <div className="question-list landing-reveal">{QUESTIONS.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={20} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div>
        </section>

        <section className="closing section-shell">
          <div className="closing-copy landing-reveal"><p>Your next chapter, together.</p><h2>Make room<br />for better work<span>.</span></h2></div><a href={primaryHref} className="closing-action landing-reveal"><ArrowUpRight size={56} strokeWidth={1.2} aria-hidden="true" /><span>{primaryLabel}</span></a>
        </section>
      </main>
      <div className="closing-wordmark section-shell" aria-hidden="true">zsyio<span>.</span></div>
      <MarketingFooter />
    </div>
  );
}
