"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import CheckButton, {
  SIZE_BOX,
  SIZE_TEXT,
  SIZE_GAP,
  SIZE_CHECK,
  MARK_ACTIVE,
  type CheckButtonSize,
} from "./CheckButton";

type Props = {
  /** Closed shows the plain "search" CheckButton; open swaps the label for
   *  a text input in the same box. */
  open: boolean;
  onToggle: () => void;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  size?: CheckButtonSize;
  placeholder?: string;
};

/**
 * The projects search control. Closed, it's an ordinary CheckButton labelled
 * "search"; open, it keeps the same box + row geometry but the label becomes a
 * text input. Split from CheckButton rather than adding a variant because an
 * <input> can't live inside CheckButton's <button>. Geometry classes are
 * imported from CheckButton so the two stay in lockstep.
 */
export default function SearchCheck({
  open,
  onToggle,
  value,
  onChange,
  className,
  size = "label",
  placeholder = "search projects",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <CheckButton
        label={placeholder}
        size={size}
        active={false}
        color="text-secondary"
        onClick={onToggle}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "group flex justify-start font-visual font-normal text-primary",
        SIZE_TEXT[size],
        className,
        SIZE_BOX[size],
      )}
    >
      <div
        className={cn(
          "flex items-baseline justify-start w-full",
          SIZE_GAP[size],
        )}
      >
        <button
          type="button"
          aria-label="close search"
          onClick={onToggle}
          className={cn(
            "shrink-0 select-none font-visual font-normal leading-none text-primary cursor-pointer",
            SIZE_CHECK[size],
          )}
        >
          {MARK_ACTIVE}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none placeholder:text-primary/60 lowercase"
        />
      </div>
    </div>
  );
}
