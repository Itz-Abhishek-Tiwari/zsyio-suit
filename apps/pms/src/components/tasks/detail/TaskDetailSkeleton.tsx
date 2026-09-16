"use client";

import { Skeleton } from "@zsyio/ui";

export function TaskDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 w-full max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col gap-3 pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <span className="text-muted-foreground/30">•</span>
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-8 w-32 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg hidden sm:block" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>

        {/* Task Title */}
        <div className="pt-1">
          <Skeleton className="h-10 w-3/4 max-w-2xl rounded-xl" />
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Main content) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <Skeleton className="h-7 w-16 rounded-lg" />
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-11/12 rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          </div>

          {/* Attachments Section */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
              </div>
              <Skeleton className="h-7 w-24 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-t border-border/80 pt-6 mt-1 flex flex-col gap-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Skeleton className="h-9 w-32 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-9 w-36 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl hidden sm:block" />
            </div>

            {/* Comments Thread Mock */}
            <div className="flex flex-col gap-4 pt-1">
              {/* Comment Input */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3 shadow-xs">
                <Skeleton className="h-20 w-full rounded-xl" />
                <div className="flex justify-end">
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </div>

              {/* Sample Comment Item */}
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-full" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 pl-9">
                  <Skeleton className="h-3.5 w-full rounded-md" />
                  <Skeleton className="h-3.5 w-3/4 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Metadata) */}
        <div className="flex flex-col gap-4">
          {/* Ticket Configuration Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Skeleton className="w-4 h-4 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>

            <div className="flex flex-col gap-4">
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>

              {/* Priority */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-14 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-10 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>

              {/* Assignees */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>

              {/* Reviewers */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>

              {/* Teams */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-12 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-10 rounded-md" />
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-6 w-16 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          </div>

          {/* Git Workflow Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>

          {/* Client & Product Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-2.5 shadow-xs">
            <Skeleton className="h-3 w-28 rounded-md pb-1 border-b border-border/60" />
            <Skeleton className="h-4 w-36 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>

          {/* Reporter & Timeline Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 flex flex-col gap-3 shadow-xs">
            <Skeleton className="h-3 w-32 rounded-md pb-2 border-b border-border/60" />
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-14 rounded-md" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
