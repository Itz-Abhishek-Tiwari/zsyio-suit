"use client";

import React from "react";
import Link from "next/link";
import {
  Code2,
  GitPullRequest,
  ArrowRight,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Button } from "@zsyio/ui";

interface DeveloperFocusCardProps {
  myOpenTasks: number;
  myDoneTasks: number;
  myInReviewTasks: number;
  myUrgentTasks: number;
  myCompletionRate: number;
}

export function DeveloperFocusCard({
  myOpenTasks,
  myDoneTasks,
  myInReviewTasks,
  myUrgentTasks,
  myCompletionRate,
}: DeveloperFocusCardProps) {
  return (
    <div className="rounded-lg border border-border/80 bg-card p-5 sm:p-6 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-md bg-notion-purple-fg/10 text-notion-purple-fg border border-notion-purple-fg/20 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Sprint Focus & QA</h2>
            <p className="text-xs text-muted-foreground">Personal velocity & code readiness</p>
          </div>
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-xs font-semibold gap-1 text-primary hover:text-primary h-8 px-2 rounded-md"
        >
          <Link href="/tasks">
            <span>My Tasks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href="/tasks"
          className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-notion-blue-fg/40 flex flex-col gap-1 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">In Review</span>
            <GitPullRequest className="w-3.5 h-3.5 text-notion-blue-fg  transition-transform" />
          </div>
          <span className="text-lg font-semibold text-foreground">{myInReviewTasks}</span>
          <span className="text-xs text-muted-foreground">Awaiting PR or test verification</span>
        </Link>

        <Link
          href="/tasks"
          className={`p-3 rounded-md border flex flex-col gap-1 transition-all group ${
            myUrgentTasks > 0
              ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
              : "border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">High Priority</span>
            <AlertTriangle
              className={`w-3.5 h-3.5  transition-transform ${
                myUrgentTasks > 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            />
          </div>
          <span
            className={`text-lg font-semibold ${
              myUrgentTasks > 0 ? "text-destructive" : "text-foreground"
            }`}
          >
            {myUrgentTasks}
          </span>
          <span className="text-xs text-muted-foreground">
            {myUrgentTasks > 0 ? "Immediate focus needed" : "Zero high priority items"}
          </span>
        </Link>
      </div>

      <div className="p-3 rounded-md bg-surface-subtle/40 border border-border/60 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span>Sprint Completion</span>
          </span>
          <span className="font-semibold text-foreground font-mono">{myCompletionRate}%</span>
        </div>
        <div className="w-full h-1.5 rounded-sm bg-muted overflow-hidden">
          <div
            className="h-full bg-success rounded-sm transition-all duration-150"
            style={{ width: `${myCompletionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{myDoneTasks} tasks resolved</span>
          <span>{myOpenTasks} remaining</span>
        </div>
      </div>
    </div>
  );
}
