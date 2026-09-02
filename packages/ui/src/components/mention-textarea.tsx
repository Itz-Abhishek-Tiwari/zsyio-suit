"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { User } from "@zsyio/types";
import { cn } from "../lib/utils";
import { AtSign, User as UserIcon } from "lucide-react";
import { getImagesFromClipboard } from "../lib/clipboard";

export interface MentionTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  value: string;
  users?: User[];
  onChange: (value: string) => void;
  minHeight?: string;
  onPostShortcut?: () => void;
  onPasteImage?: (file: File) => void;
}

export function MentionTextarea({
  users: propUsers,
  value,
  onChange,
  className,
  placeholder,
  minHeight = "min-h-[60px]",
  onKeyDown,
  onPostShortcut,
  onPasteImage,
  onPaste,
  ...props
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const users = propUsers || [];

  // Mention State
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const activeUsers = users.filter((u) => u.active !== false);


  const filteredUsers = activeUsers.filter((u) => {
    if (!mentionQuery) return true;
    const q = mentionQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  // Check if cursor is right after an '@' trigger
  const checkMentionTrigger = useCallback((text: string, selectionEnd: number) => {
    const textBeforeCursor = text.slice(0, selectionEnd);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Ensure '@' is at start of text or preceded by whitespace/newline
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        // If there's no newline and length <= 30, show popup
        if (!query.includes("\n") && query.length <= 30) {
          setMentionQuery((prevQuery) => {
            if (prevQuery !== query) {
              setMentionIndex(0);
            }
            return query;
          });
          setMentionOpen(true);
          return;
        }
      }
    }
    setMentionOpen(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const end = e.target.selectionEnd || 0;
    setCursorPosition(end);
    onChange(newVal);
    checkMentionTrigger(newVal, end);
  };

  const handleSelectUser = (user: User) => {
    if (!textareaRef.current) return;
    const text = value;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex === -1) return;

    const beforeMention = text.slice(0, lastAtIndex);
    const afterCursor = text.slice(cursorPosition);

    // Insert clean @UserName format
    const mentionTag = `@${user.name} `;
    const updatedText = `${beforeMention}${mentionTag}${afterCursor}`;

    onChange(updatedText);
    setMentionOpen(false);

    // Restore focus and position cursor right after mention tag
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = lastAtIndex + mentionTag.length;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
        setCursorPosition(nextPos);
      }
    }, 10);
  };

  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ⌘+Enter or Ctrl+Enter trigger post shortcut
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (onPostShortcut) {
        e.preventDefault();
        onPostShortcut();
        return;
      }
    }

    if (mentionOpen && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        const selected = filteredUsers[mentionIndex];
        if (selected) {
          handleSelectUser(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setMentionOpen(false);
        return;
      }
    }

    onKeyDown?.(e);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePasteInternal = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const images = getImagesFromClipboard(e);
    if (images.length > 0) {
      if (onPasteImage) {
        e.preventDefault();
        images.forEach((img) => onPasteImage(img));
      }
      return;
    }
    onPaste?.(e);
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDownInternal}
        onPaste={handlePasteInternal}
        onClick={(e) => {
          const end = (e.target as HTMLTextAreaElement).selectionEnd || 0;
          setCursorPosition(end);
          checkMentionTrigger(value, end);
        }}
        onKeyUp={(e) => {
          if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
            const end = (e.target as HTMLTextAreaElement).selectionEnd || 0;
            setCursorPosition(end);
            checkMentionTrigger(value, end);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-border/80 bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-none font-sans",
          minHeight,
          className
        )}
        {...props}
      />

      {mentionOpen && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bottom-full mb-2 left-0 w-72 max-h-60 overflow-y-auto rounded-2xl border border-border/90 bg-card/95 backdrop-blur-md shadow-2xl p-1.5 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2 py-1 border-b border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AtSign className="w-3 h-3 text-primary" />
              <span>Mention Teammate</span>
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/70">↑↓ to navigate, ↵ to choose</span>
          </div>

          <div className="flex flex-col gap-0.5">
            {filteredUsers.map((user, idx) => {
              const isSelected = idx === mentionIndex;
              const initials = user.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join("");

              return (
                <button
                  key={user.id}
                  type="button"
                  onMouseEnter={() => setMentionIndex(idx)}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer text-xs group",
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs ring-1 ring-primary/40"
                      : "hover:bg-surface-subtle text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-1">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border",
                        isSelected
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-primary-light text-primary border-primary/20"
                      )}
                    >
                      {initials || <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-bold leading-tight">
                        {user.name}
                      </span>
                      <span
                        className={cn(
                          "truncate text-[10px] leading-tight font-mono",
                          isSelected ? "text-white/80" : "text-muted-foreground"
                        )}
                      >
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md shrink-0 font-bold",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground border border-border/50"
                    )}
                  >
                    {user.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
