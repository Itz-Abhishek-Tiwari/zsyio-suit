"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, BriefcaseBusiness, ArrowLeft } from "lucide-react";
import { Button, SearchInput, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, EmptyState, Modal, Input, Label, Badge } from "@zsyio/ui";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MarketingHeader, MarketingFooter } from "../marketing-shell";
import "../landing.css";
import "./careers.css";

gsap.registerPlugin(useGSAP);
type PublicJob = { id: string; title: string; department: string; location: string; employment: string; description: string };
const employmentLabel = (value: string) => ({ FULL_TIME: "Full time", PART_TIME: "Part time", CONTRACT: "Contract" }[value] ?? value);

export function CareersView({ jobs, unavailable }: { jobs: PublicJob[]; unavailable: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [selected, setSelected] = useState<PublicJob | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const departments = useMemo(() => [...new Set(jobs.map((job) => job.department))].sort(), [jobs]);
  const filtered = jobs.filter((job) => (department === "all" || department === job.department) && `${job.title} ${job.department} ${job.location}`.toLowerCase().includes(query.toLowerCase()));
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".careers-intro > *, .careers-art", { opacity: 0, y: 20, duration: 0.7, stagger: 0.1, ease: "power3.out" });
    });
    return () => mm.revert();
  }, { scope: root });

  async function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/careers/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(data), jobId: selected.id }) });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 409 && body.error?.code !== "JOB_CLOSED" ? "You have already applied for this role with this email." : body.error?.message ?? "Couldn’t submit your application. Try again.");
      setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t submit your application. Try again."); }
    finally { setPending(false); }
  }

  return <div ref={root} className="landing-page careers-page">
    <a href="#main-content" className="landing-skip">Skip to content</a>
    <MarketingHeader />
    <main id="main-content">
      <section className="careers-hero section-shell">
        <div className="careers-intro">
          <Link href="/" className="careers-back"><ArrowLeft size={15} aria-hidden="true" /> Back to Zsyio</Link>
          <h1>Build what<br />connects us<span>.</span></h1>
          <p>Help shape a workspace that brings people, ideas, and progress together.</p>
          <Button asChild size="xl"><a href="#open-roles">Explore open roles<ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
        <figure className="careers-art"><Image src="/images/landing/connected-team.webp" alt="Blue discs connected by a metal framework" width={1536} height={1024} priority sizes="(max-width: 768px) 100vw, 50vw" /></figure>
      </section>
      <section id="open-roles" className="careers-roles section-shell">
        <h2>Find your next chapter.</h2>
        <p>Explore the roles our team is hiring for.</p>
        <div className="careers-filters">
          <SearchInput aria-label="Search open roles" placeholder="Search roles or locations…" value={query} onChange={setQuery} containerClassName="w-full sm:max-w-sm" />
          <Select value={department} onValueChange={setDepartment}><SelectTrigger aria-label="Filter by department" className="sm:max-w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{departments.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
          <span aria-live="polite">{filtered.length} {filtered.length === 1 ? "open role" : "open roles"}</span>
        </div>
        {unavailable ? <EmptyState title="We couldn’t load the open roles" description="Please try again in a moment." action={<Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>} /> : !filtered.length ? <EmptyState title={jobs.length ? "No matching roles" : "No open roles right now"} description={jobs.length ? "Try a different search or department." : "Check back for new opportunities as our team grows."} action={jobs.length ? <Button variant="outline" onClick={() => { setQuery(""); setDepartment("all"); }}>Clear filters</Button> : undefined} /> : <div className="careers-job-list">{filtered.map((job) => <article key={job.id} className="careers-job">
          <div><Badge variant="secondary">{job.department}</Badge><h3>{job.title}</h3><p><MapPin size={14} aria-hidden="true" />{job.location}<BriefcaseBusiness size={14} aria-hidden="true" />{employmentLabel(job.employment)}</p></div>
          <Button variant="outline" onClick={() => { setSelected(job); setError(""); setSubmitted(false); }}>View role<ArrowUpRight aria-hidden="true" /><span className="sr-only">: {job.title}</span></Button>
        </article>)}</div>}
      </section>
    </main>
    <MarketingFooter />
    <Modal open={Boolean(selected)} onOpenChange={(open) => { if (!open && !pending) setSelected(null); }} title={selected?.title} description={selected ? `${selected.department} · ${selected.location} · ${employmentLabel(selected.employment)}` : undefined} size="lg">
      {selected && (submitted ? <div role="status" className="space-y-5"><h3 className="text-lg font-semibold">Application received.</h3><p className="text-sm text-muted-foreground">Thanks for your interest in {selected.title}. Your application is now with our hiring team.</p><Button onClick={() => setSelected(null)}>Done</Button></div> : <div className="space-y-6">
        <section><h3 className="text-sm font-semibold mb-3">About the role</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">{selected.description}</p></section>
        <form onSubmit={apply} className="space-y-4 border-t border-border pt-5">
          <h3 className="font-semibold">Apply for this role</h3>
          <div><Label htmlFor="applicant-name">Full name</Label><Input className="mt-1.5" id="applicant-name" name="name" autoComplete="name" required minLength={2} maxLength={150} disabled={pending} /></div>
          <div><Label htmlFor="applicant-email">Email address</Label><Input className="mt-1.5" id="applicant-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={pending} /></div>
          <div><Label htmlFor="applicant-phone">Phone number</Label><Input className="mt-1.5" id="applicant-phone" name="phone" type="tel" autoComplete="tel" required minLength={5} maxLength={40} disabled={pending} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label htmlFor="applicant-company">Current company <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1.5" id="applicant-company" name="currentCompany" autoComplete="organization" maxLength={150} disabled={pending} /></div>
            <div><Label htmlFor="applicant-notice">Notice period <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1.5" id="applicant-notice" name="noticePeriod" placeholder="e.g. 30 days" maxLength={100} disabled={pending} /></div>
            <div><Label htmlFor="applicant-salary">Expected salary <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1.5" id="applicant-salary" name="expectedSalary" maxLength={100} disabled={pending} /></div>
            <div><Label htmlFor="applicant-linkedin">LinkedIn profile <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1.5" id="applicant-linkedin" name="linkedinUrl" type="url" placeholder="https://" maxLength={500} disabled={pending} /></div>
            <div className="sm:col-span-2"><Label htmlFor="applicant-resume">Link to your resume <span className="text-muted-foreground font-normal">(optional)</span></Label><Input className="mt-1.5" id="applicant-resume" name="resumeUrl" type="url" placeholder="https://drive.google.com/…" maxLength={500} disabled={pending} /></div>
          </div>
          <div hidden aria-hidden="true"><label htmlFor="applicant-website">Website</label><Input id="applicant-website" name="website" tabIndex={-1} autoComplete="off" /></div>
          <p className="text-xs text-muted-foreground">Submitting sends these details to the Zsyio hiring team for this role.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit application"}</Button>
        </form>
      </div>)}
    </Modal>
  </div>;
}
