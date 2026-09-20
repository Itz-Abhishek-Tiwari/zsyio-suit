"use client";

import React from "react";
import { NoteWorkspace } from "@/components/notes/NoteWorkspace";

export function NotesView() {
  return (
    <div className="w-full h-full overflow-hidden">
      <NoteWorkspace />
    </div>
  );
}
