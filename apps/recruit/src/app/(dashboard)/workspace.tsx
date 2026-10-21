"use client";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Users,
  MessageSquare,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  CardGridSkeleton, TableSkeleton, StatusBadge, DatePicker,
  KanbanBoardSkeleton,
  PageHeader,
  Button,
  SearchInput,
  KpiCard,
  EmptyState,
  Modal,
  Input,
  Label,
  Textarea,
  formatDate,
  formatTime,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@zsyio/ui";
import {
  stages,
  rejectionReasons,
  type Job,
  type Application,
  type HiringEvent,
} from "@/lib/schemas";
import { ManageContext } from "./recruit-shell";
import { RecruitKanbanBoard } from "@/components/recruit-kanban-board";
const pmsUrl = (process.env.NEXT_PUBLIC_PMS_URL || "http://localhost:3000").replace(/\/+$/, "");
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok)
    throw new Error(
      payload.error?.message ?? "Couldn’t save changes. Try again.",
    );
  return payload.data ?? payload;
}
export function HiringWorkspace({
  view,
}: {
  view: "jobs" | "candidates" | "interviews";
}) {
  const canManage = useContext(ManageContext);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [modal, setModal] = useState<"job" | "candidate" | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [eventKind, setEventKind] = useState("INTERVIEW");
  const [interviewDate, setInterviewDate] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const load = useCallback(async () => {
    try {
      setError("");
      const [j, a] = await Promise.all([
        api<Job[]>("jobs"),
        api<Application[]>("applications"),
      ]);
      setJobs(j);
      setApplications(a);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Couldn’t load Recruit.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const selected = applications.find(
    (application) => application.id === selectedId,
  );
  const filtered = useMemo(
    () =>
      applications.filter(
        (application) =>
          (!jobFilter || application.jobId === jobFilter) &&
          (!stageFilter || application.stage === stageFilter) &&
          `${application.name} ${application.email} ${application.job.title}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [applications, jobFilter, stageFilter, query],
  );
  const visibleJobs = jobs.filter((job) =>
    `${job.title} ${job.department} ${job.location}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const interviews = filtered
    .flatMap((application) =>
      application.events
        .filter((event) => event.kind === "INTERVIEW")
        .map((event) => ({ event, application })),
    )
    .sort(
      (a, b) =>
        new Date(a.event.scheduledAt!).getTime() -
        new Date(b.event.scheduledAt!).getTime(),
    );
  async function mutate(path: string, method: string, body: unknown) {
    setSaving(true);
    setFormError("");
    try {
      await api(path, method, body);
      await load();
      toast.success("Changes saved.");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t save changes.";
      setFormError(message);
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form);
    const ok = await mutate(
      modal === "job"
        ? `jobs${editingJob ? `/${editingJob.id}` : ""}`
        : "applications",
      editingJob ? "PATCH" : "POST",
      body,
    );
    if (ok) {
      setModal(null);
      setEditingJob(null);
    }
  }
  async function addEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    if (eventKind === "INTERVIEW") {
      const scheduledAt = new Date(`${interviewDate}T${String(body.interviewTime)}`);
      if (!interviewDate || Number.isNaN(scheduledAt.getTime())) {
        setFormError("Choose an interview date and time.");
        return;
      }
      body.scheduledAt = scheduledAt.toISOString();
      delete body.interviewTime;
    }
    if (
      await mutate(`applications/${selected.id}/events`, "POST", {
        ...body,
        kind: eventKind,
      })
    ) {
      form.reset();
      setInterviewDate("");
    }
  }
  // Rejecting needs a reason, so it goes through a dialog instead of moving straight away.
  async function requestStage(id: string, stage: string) {
    if (stage === "REJECTED") {
      setFormError("");
      setRejectionReason("");
      setRejectingId(id);
      return false;
    }
    return mutate(`applications/${id}`, "PATCH", { stage });
  }
  async function confirmRejection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingId || !rejectionReason) return;
    const note = String(new FormData(event.currentTarget).get("note") ?? "");
    if (
      await mutate(`applications/${rejectingId}`, "PATCH", {
        stage: "REJECTED",
        rejectionReason,
        note,
      })
    )
      setRejectingId(null);
  }
  async function saveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    await mutate(
      `applications/${selected.id}`,
      "PATCH",
      Object.fromEntries(new FormData(event.currentTarget)),
    );
  }
  function open(kind: "job" | "candidate", job: Job | null = null) {
    setFormError("");
    setEditingJob(job);
    setModal(kind);
  }
  const action = canManage ? (
    <Button
      className="gap-2"
      onClick={() => open(view === "jobs" ? "job" : "candidate")}
      disabled={view !== "jobs" && !jobs.some((job) => job.status === "OPEN")}
    >
      <Plus className="h-4 w-4" />
      {view === "jobs" ? "Create job" : "Add candidate"}
    </Button>
  ) : undefined;
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        eyebrow="Recruit"
        titleIcon={
          view === "jobs" ? (
            <BriefcaseBusiness className="w-5 h-5" />
          ) : view === "candidates" ? (
            <Users className="w-5 h-5" />
          ) : (
            <CalendarDays className="w-5 h-5" />
          )
        }
        borderBottom
        title={
          view === "jobs"
            ? "Build your next team"
            : view === "candidates"
              ? "Candidate pipeline"
              : "Interviews"
        }
        description={
          view === "jobs"
            ? "Open roles, clear ownership, and a shared view of hiring."
            : view === "candidates"
              ? "Follow each application from first contact to a hiring decision."
              : "Keep interview schedules and feedback close to each application."
        }
        actions={<>
          {view === "jobs" && <Button variant="outline" asChild><a href={`${pmsUrl}/landing/careers`} target="_blank" rel="noopener noreferrer">View careers page<ArrowRight aria-hidden="true" /></a></Button>}
          {action}
        </>}
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Open jobs"
          value={
            loading ? "—" : jobs.filter((job) => job.status === "OPEN").length
          }
          icon={<BriefcaseBusiness className="w-4 h-4" />}
        />
        <KpiCard
          label="Active applications"
          value={
            loading
              ? "—"
              : applications.filter(
                  (a) => !["HIRED", "REJECTED"].includes(a.stage),
                ).length
          }
          icon={<Users className="w-4 h-4" />}
        />
        <KpiCard
          label="Upcoming interviews"
          value={
            loading
              ? "—"
              : applications
                  .flatMap((a) => a.events)
                  .filter(
                    (e) =>
                      e.kind === "INTERVIEW" &&
                      e.scheduledAt &&
                      new Date(e.scheduledAt) > new Date(),
                  ).length
          }
          icon={<CalendarDays className="w-4 h-4" />}
        />
        <KpiCard
          label="Hired"
          value={
            loading
              ? "—"
              : applications.filter((a) => a.stage === "HIRED").length
          }
          icon={<UserCheck className="w-4 h-4" />}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          aria-label="Search recruitment"
          value={query}
          onChange={setQuery}
          placeholder={
            view === "jobs"
              ? "Search roles, teams, or locations…"
              : "Search candidates or jobs…"
          }
          containerClassName="sm:max-w-sm"
        />
        {view !== "jobs" && (
          <>
            <Select value={jobFilter || "all"} onValueChange={(value) => setJobFilter(value === "all" ? "" : value)}>
              <SelectTrigger aria-label="Filter by job" className="sm:max-w-64"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All jobs</SelectItem>{jobs.map((job) => <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={stageFilter || "all"} onValueChange={(value) => setStageFilter(value === "all" ? "" : value)}>
              <SelectTrigger aria-label="Filter by stage" className="sm:max-w-48"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All stages</SelectItem>{stages.map((stage) => <SelectItem key={stage} value={stage}>{label(stage)}</SelectItem>)}</SelectContent>
            </Select>
          </>
        )}
      </div>
      {error ? (
        <EmptyState
          title="Couldn’t load Recruit"
          description={error}
          action={
            <Button
              onClick={() => {
                setLoading(true);
                void load();
              }}
            >
              Try again
            </Button>
          }
        />
      ) : loading ? (
        <div role="status" aria-label="Loading recruitment data">
          {view === "candidates" ? <KanbanBoardSkeleton columnsCount={stages.length} cardsPerColumn={2} /> : view === "interviews" ? <TableSkeleton columns={5} rows={5} /> : <CardGridSkeleton count={6} columns={3} />}
        </div>
      ) : view === "jobs" ? (
        <section
          aria-label="Job openings"
          className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {visibleJobs.map((job) => (
            <Card
              key={job.id}
              className="flex flex-col"
            >
              <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <BriefcaseBusiness className="w-5 h-5 text-primary" />
                <StatusBadge label={label(job.status)} variant={job.status === "OPEN" ? "emerald" : job.status === "PAUSED" ? "amber" : "slate"} dot />
              </div>
              <div>
                <CardTitle>{job.title}</CardTitle>
                <CardDescription>{job.department} · {job.location}</CardDescription>
              </div>
              </CardHeader>
              <CardContent className="flex-1"><p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{job.description}</p></CardContent>
              <CardFooter className="justify-between text-xs text-muted-foreground">
                <span>
                  {job._count.applications} applications ·{" "}
                  {label(job.employment)}
                </span>
                {canManage && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => open("job", job)}
                  >
                    Edit
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
          {!visibleJobs.length && (
            <div className="col-span-full">
              <EmptyState
                title={
                  query ? "No matching jobs" : "Your first hire starts here"
                }
                description={
                  query
                    ? "Try another search."
                    : "Create a job opening, then add candidates to its pipeline."
                }
                action={
                  canManage ? (
                    <Button onClick={() => open("job")}>Create job</Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </section>
      ) : view === "candidates" ? (
        <RecruitKanbanBoard
          applications={filtered}
          canManage={canManage}
          saving={saving}
          onStageChange={requestStage}
          onOpenCandidate={(id) => { setFormError(""); setInterviewDate(""); setSelectedId(id); }}
          onAddCandidate={canManage && jobs.some((job) => job.status === "OPEN") ? () => open("candidate") : undefined}
        />
      ) : interviews.length ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Job</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map(({ application, event }) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {application.name}
                  </TableCell>
                  <TableCell>{event.title}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(event.scheduledAt)} · {formatTime(event.scheduledAt)}
                  </TableCell>
                  <TableCell>{application.job.title}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Open ${application.name}`}
                      onClick={() => {
                        setFormError("");
                        setSelectedId(application.id);
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          title="No interviews in this view"
          description="Open a candidate from the pipeline to schedule an interview."
        />
      )}
      <Modal
        open={modal !== null}
        onOpenChange={(value) => {
          if (!value && !saving) setModal(null);
        }}
        title={
          modal === "job"
            ? editingJob
              ? "Edit job"
              : "Create job"
            : "Add candidate"
        }
        description={
          modal === "job"
            ? "Define the role and where it fits in your team."
            : "Add an applicant to an open job."
        }
        footer={
          <>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" form="recruit-form" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <form
          key={editingJob?.id ?? modal}
          id="recruit-form"
          onSubmit={submit}
          className="space-y-4"
        >
          {modal === "job" ? (
            <>
              {(
                [
                  ["title", "Job title"],
                  ["department", "Department"],
                  ["location", "Location"],
                ] as const
              ).map(([name, title]) => (
                <div key={name}>
                  <Label htmlFor={name}>{title}</Label>
                  <Input
                    id={name}
                    name={name}
                    required
                    maxLength={150}
                    defaultValue={editingJob?.[name]}
                    className="mt-1.5"
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="employment">Employment type</Label>
                <Select name="employment" defaultValue={editingJob?.employment ?? "FULL_TIME"}>
                  <SelectTrigger id="employment" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{["FULL_TIME", "PART_TIME", "CONTRACT"].map((type) => <SelectItem key={type} value={type}>{label(type)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Role description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  maxLength={10000}
                  defaultValue={editingJob?.description}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingJob?.status ?? "OPEN"}>
                  <SelectTrigger id="status" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{["OPEN", "PAUSED", "CLOSED"].map((status) => <SelectItem key={status} value={status}>{label(status)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="jobId">Job opening</Label>
                <Select name="jobId" required>
                  <SelectTrigger id="jobId" className="mt-1.5"><SelectValue placeholder="Choose a job" /></SelectTrigger>
                  <SelectContent>{jobs.filter((job) => job.status === "OPEN").map((job) => <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {(
                [
                  ["name", "Full name"],
                  ["email", "Email"],
                  ["phone", "Phone (optional)"],
                  ["source", "Source"],
                ] as const
              ).map(([name, title]) => (
                <div key={name}>
                  <Label htmlFor={name}>{title}</Label>
                  <Input
                    id={name}
                    name={name}
                    required={name !== "phone"}
                    type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}
                    defaultValue={name === "source" ? "Direct" : undefined}
                    maxLength={name === "phone" ? 40 : 254}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </>
          )}
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
        </form>
      </Modal>
      <Modal
        open={!!selected}
        onOpenChange={(value) => {
          if (!value && !saving) setSelectedId(null);
        }}
        title={selected?.name ?? "Candidate"}
        description={
          selected ? `${selected.job.title} · ${selected.email}` : ""
        }
        size="lg"
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="candidate-stage">Hiring stage</Label>
              <Select disabled={!canManage || saving} value={selected.stage} onValueChange={(stage) => void requestStage(selected.id, stage)}>
                <SelectTrigger id="candidate-stage" className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{stages.map((stage) => <SelectItem key={stage} value={stage}>{label(stage)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selected.stage === "REJECTED" && selected.rejectionReason && (
              <p className="text-sm text-destructive">
                Rejected: {selected.rejectionReason}
              </p>
            )}
            <section>
              <h3 className="font-medium mb-3">Candidate details</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {selected.resumeUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer">Resume<ExternalLink aria-hidden="true" /></a>
                  </Button>
                )}
                {selected.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn<ExternalLink aria-hidden="true" /></a>
                  </Button>
                )}
              </div>
              <form key={selected.id} onSubmit={saveDetails} className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    ["phone", "Phone", "tel", 40],
                    ["currentCompany", "Current company", "text", 150],
                    ["expectedSalary", "Expected salary", "text", 100],
                    ["noticePeriod", "Notice period", "text", 100],
                    ["linkedinUrl", "LinkedIn link", "url", 500],
                    ["resumeUrl", "Resume link", "url", 500],
                  ] as const
                ).map(([name, title, type, max]) => (
                  <div key={name} className="space-y-1.5">
                    <Label htmlFor={`detail-${name}`}>{title}</Label>
                    <Input
                      id={`detail-${name}`}
                      name={name}
                      type={type}
                      maxLength={max}
                      defaultValue={selected[name] ?? ""}
                      disabled={!canManage || saving}
                      placeholder={type === "url" ? "https://" : undefined}
                    />
                  </div>
                ))}
                {canManage && (
                  <div className="sm:col-span-2">
                    <Button type="submit" variant="outline" disabled={saving}>
                      {saving ? "Saving…" : "Save details"}
                    </Button>
                  </div>
                )}
              </form>
            </section>
            <section>
              <h3 className="font-medium mb-3">Activity & feedback</h3>
              {selected.events.length ? (
                selected.events.map((event: HiringEvent) => (
                  <article
                    key={event.id}
                    className="border-l-2 border-border pl-4 py-2 mb-3"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4 className="text-sm font-medium">{event.title}</h4>
                    </div>
                    {event.scheduledAt && (
                      <p className="text-sm text-primary mt-1">
                        {formatDate(event.scheduledAt)} · {formatTime(event.scheduledAt)}
                      </p>
                    )}
                    {event.body && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                        {event.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {event.authorName} ·{" "}
                      {formatDate(event.createdAt)}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity yet. Add an interview or feedback below.
                </p>
              )}
            </section>
            {canManage && (
              <form
                onSubmit={addEvent}
                className="border-t border-border pt-5 space-y-3"
              >
                <Label htmlFor="event-kind">Add activity</Label>
                <Select value={eventKind} onValueChange={setEventKind}>
                  <SelectTrigger id="event-kind"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="INTERVIEW">Schedule interview</SelectItem><SelectItem value="FEEDBACK">Write feedback</SelectItem></SelectContent>
                </Select>
                <Label htmlFor="event-title">Title</Label>
                <Input id="event-title" name="title" required maxLength={150} />
                {eventKind === "INTERVIEW" && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label htmlFor="interview-date">Interview date</Label><DatePicker id="interview-date" value={interviewDate} onChange={setInterviewDate} disabled={saving} /></div>
                      <div className="space-y-1.5"><Label htmlFor="interview-time">Time (your local time)</Label><Input id="interview-time" name="interviewTime" type="time" required disabled={saving} /></div>
                    </div>
                  </>
                )}
                <Label htmlFor="event-body">
                  {eventKind === "FEEDBACK" ? "Feedback" : "Interview notes"}
                </Label>
                <Textarea
                  id="event-body"
                  name="body"
                  required={eventKind === "FEEDBACK"}
                  maxLength={10000}
                />
                <Button disabled={saving} type="submit">
                  {saving ? "Saving…" : "Add activity"}
                </Button>
              </form>
            )}
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>
        )}
      </Modal>
      <Modal
        open={rejectingId !== null}
        onOpenChange={(value) => {
          if (!value && !saving) setRejectingId(null);
        }}
        title="Reject candidate"
        description="Record why, so your team can learn from each decision."
        footer={
          <>
            <Button variant="outline" disabled={saving} onClick={() => setRejectingId(null)}>
              Cancel
            </Button>
            <Button type="submit" form="reject-form" variant="destructive" disabled={saving || !rejectionReason}>
              {saving ? "Saving…" : "Reject"}
            </Button>
          </>
        }
      >
        <form id="reject-form" onSubmit={confirmRejection} className="space-y-4">
          <div>
            <Label htmlFor="rejection-reason">Reason</Label>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger id="rejection-reason" className="mt-1.5"><SelectValue placeholder="Choose a reason" /></SelectTrigger>
              <SelectContent>{rejectionReasons.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rejection-note">Note (optional)</Label>
            <Textarea id="rejection-note" name="note" maxLength={2000} className="mt-1.5" />
          </div>
          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
