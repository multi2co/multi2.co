"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Props = {
  color: string;
  className?: string;
  onAdd: (text: string, fontSize: number) => void;
};

export default function TextTool({ color, className, onAdd }: Props) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(72);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed, fontSize);
    setText("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-3", className)}
    >
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="type something"
        className="w-56 lowercase bg-white"
        style={{ color }}
      />
      <label className="flex items-center gap-x-3 text-sm  font-visual lowercase text-primary">
        size
        <Slider
          className="w-24"
          min={16}
          max={200}
          step={2}
          value={[fontSize]}
          onValueChange={([v]) => setFontSize(v)}
        />
      </label>
      <Button
        variant="default"
        size="sm"
        onClick={submit}
        disabled={!text.trim()}
      >
        add to artboard
      </Button>
    </div>
  );
}
