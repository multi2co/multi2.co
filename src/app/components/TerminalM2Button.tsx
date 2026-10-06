"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import TypedWord from "./TypedWord";

const TYPE_MS = 22;
const ERASE_MS = 14;
const HOLD_MS = 1000;
const PHRASE_GAP_MS = 150;
const LOOP_GAP_MS = 6000;

type Props = {
  text: string;
  visible: boolean;
  delay: number;
  loading?: boolean;
  loadingText?: string;
  onClick?: () => void;
  className?: string;
  phrases?: string[];
  trigger?: string;
  stopTrigger?: number;
  /** Keep cycling the phrases forever, restarting after LOOP_GAP_MS. */
  loop?: boolean;
};

export default function TerminalM2Button({
  text,
  visible,
  delay,
  loading = false,
  loadingText = "loading",
  onClick,
  className = "",
  phrases = [],
  trigger = "",
  stopTrigger = 0,
  loop = false,
}: Props) {
  const [dots, setDots] = useState("");
  const [activePhrase, setActivePhrase] = useState<string | null>(null);
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [phraseKey, setPhraseKey] = useState(0);
  const [cycleKey, setCycleKey] = useState(0);

  const isFirstRef = useRef(true);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;
  const loopRef = useRef(loop);
  loopRef.current = loop;
  const restartRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRestart = (delay: number) => {
    if (!loopRef.current) return;
    if (restartRef.current) clearTimeout(restartRef.current);
    restartRef.current = setTimeout(() => setCycleKey((k) => k + 1), delay);
  };
  const stopCycleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Only the loading state carries dots — the cycling phrases stand alone.
    if (!loading) {
      setDots(".");
      return;
    }
    const dotsT = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    return () => clearInterval(dotsT);
  }, [loading]);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      if (!loopRef.current) return;
    }
    if (loadingRef.current) {
      queueRestart(LOOP_GAP_MS);
      return;
    }

    const ps = phrasesRef.current;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let currentP: string | null = null;

    function stop() {
      timers.forEach(clearTimeout);
      if (currentP !== null) {
        setPhraseVisible(false);
        timers.push(
          setTimeout(
            () => {
              setActivePhrase(null);
              stopCycleRef.current = null;
            },
            currentP.length * ERASE_MS + 300,
          ),
        );
      } else {
        setActivePhrase(null);
        stopCycleRef.current = null;
      }
    }
    stopCycleRef.current = stop;

    let elapsed = 0;
    ps.forEach((p) => {
      const showAt = elapsed;
      const hideAt = elapsed + p.length * TYPE_MS + HOLD_MS;
      elapsed = hideAt + p.length * ERASE_MS + PHRASE_GAP_MS;

      timers.push(
        setTimeout(() => {
          currentP = p;
          setActivePhrase(p);
          setPhraseKey((k) => k + 1);
          setPhraseVisible(true);
        }, showAt),
      );
      timers.push(
        setTimeout(() => {
          currentP = null;
          setPhraseVisible(false);
        }, hideAt),
      );
    });

    timers.push(
      setTimeout(() => {
        setActivePhrase(null);
        stopCycleRef.current = null;
        queueRestart(LOOP_GAP_MS);
      }, elapsed),
    );

    return () => {
      timers.forEach(clearTimeout);
      stopCycleRef.current = null;
    };
  }, [trigger, cycleKey]);

  useEffect(() => {
    if (!stopCycleRef.current) return;
    stopCycleRef.current();
    queueRestart(LOOP_GAP_MS);
  }, [stopTrigger]);

  useEffect(
    () => () => {
      if (restartRef.current) clearTimeout(restartRef.current);
    },
    [],
  );

  const cls = cn(
    " ",
    activePhrase !== null || loading ? "" : "",
    onClick && "cursor-pointer",
    className,
  );

  let content: React.ReactNode;
  if (loading) {
    content = (
      <>
        <TypedWord text={`${loadingText}`} visible={loading} delay={0} />
        <span className="whitespace-nowrap">{dots}</span>
      </>
    );
  } else if (activePhrase !== null) {
    content = (
      <>
        <TypedWord
          key={phraseKey}
          text={activePhrase}
          visible={phraseVisible}
          delay={0}
        />
      </>
    );
  } else {
    content = <TypedWord text={text} visible={visible} delay={delay} />;
  }

  if (!onClick) return <span className={cls}>{content}</span>;

  return (
    <button onClick={onClick} className={cls}>
      {content}
    </button>
  );
}
