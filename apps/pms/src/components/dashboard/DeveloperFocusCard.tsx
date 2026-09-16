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
          <span className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Code2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">Sprint Focus & QA</h2>
            <p className="text-[11px] text-muted-foreground">Personal velocity & code readiness</p>
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
          className="p-3 rounded-md border border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle hover:border-blue-500/40 flex flex-col gap-1 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">In Review</span>
            <GitPullRequest className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-lg font-extrabold text-foreground">{myInReviewTasks}</span>
          <span className="text-[10px] text-muted-foreground">Awaiting PR or test verification</span>
        </Link>

        <Link
          href="/tasks"
          className={`p-3 rounded-md border flex flex-col gap-1 transition-all group ${
            myUrgentTasks > 0
              ? "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
              : "border-border/70 bg-surface-subtle/50 hover:bg-surface-subtle"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">High Priority</span>
            <AlertTriangle
              className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                myUrgentTasks > 0 ? "text-red-500" : "text-muted-foreground"
              }`}
            />
          </div>
          <span
            className={`text-lg font-extrabold ${
              myUrgentTasks > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
            }`}
          >
            {myUrgentTasks}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {myUrgentTasks > 0 ? "Immediate focus needed" : "Zero high priority items"}
          </span>
        </Link>
      </div>

      <div className="p-3 rounded-md bg-surface-subtle/40 border border-border/60 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Sprint Completion</span>
          </span>
          <span className="font-bold text-foreground font-mono">{myCompletionRate}%</span>
        </div>
        <div className="w-full h-1.5 rounded-sm bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-sm transition-all duration-500"
            style={{ width: `${myCompletionRate}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{myDoneTasks} tasks resolved</span>
          <span>{myOpenTasks} remaining</span>
        </div>
      </div>
    </div>
  );
}
