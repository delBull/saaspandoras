'use client';

import React, { useEffect, useRef, useState, useId, useMemo } from "react";
import { useAnimationFrame } from "framer-motion";

// --- INTERFAZ DE PROPS PARA TYPESCRIPT ---
interface TextItem {
  text: string;
  cursorColor: string;
  contentColor: string;
}

interface FontProps {
  fontFamily?: string;
  fontWeight?: number;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: "left" | "right" | "center";
  fontSize?: string;
}

interface DigitalTypewriterProps {
  texts: TextItem[];
  font?: FontProps;
  probability?: number;
  delay?: number;
}


// --- HOOKS INTERNOS DEL COMPONENTE ---

const useTypewriterColors = ({ cursorColor, contentColor }: { cursorColor?: string, contentColor?: string }) => {
  const reactId = useId();
  const safeId = useMemo(() => reactId.replace(/[^a-zA-Z0-9_-]/g, "-"), [reactId]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      [data-typewriter-id="${safeId}"] {
        --cursor: ${cursorColor};
        --content: ${contentColor};
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [cursorColor, contentColor, safeId]);

  return safeId;
};

const random = (min: number, max: number, step = 1) => {
  const delta = max - min;
  const steps = Math.round(delta / step);
  const rand = Math.floor(Math.random() * (steps + 1));
  return min + rand * step;
};

interface UseTypewriterProps {
  texts: TextItem[];
  currentTextIndex: number;
  setCurrentTextIndex: React.Dispatch<React.SetStateAction<number>>;
  delay: number;
  probability: number;
  cursorHighlightName: string;
  contentHighlightName: string;
}

const useTypewriter = ({
  texts,
  currentTextIndex,
  setCurrentTextIndex,
  delay,
  probability,
  cursorHighlightName,
  contentHighlightName,
}: UseTypewriterProps) => {
  const [isPaused, setIsPaused] = useState(true);
  const pRef = useRef<HTMLParagraphElement>(null);
  const indexRef = useRef(0);
  const fpsRef = useRef(12);
  const accRef = useRef(0);
  const nodeRef = useRef<Node | null>(null);
  const cursorRangeRef = useRef<Range | null>(null);
  const contentRangeRef = useRef<Range | null>(null);
  const highlightsInitializedRef = useRef(false);

  const pause = () => setIsPaused(true);
  const unpause = () => setIsPaused(false);

  const moveToNextText = () => {
    setCurrentTextIndex((prevIndex: number) => (prevIndex + 1) % texts.length);
    indexRef.current = 0;
    if (nodeRef.current && contentRangeRef.current && cursorRangeRef.current) {
      contentRangeRef.current.setEnd(nodeRef.current, 0);
      cursorRangeRef.current.setStart(nodeRef.current, 0);
      cursorRangeRef.current.setEnd(nodeRef.current, 1);
    }
    window.setTimeout(() => {
      unpause();
    }, delay * 1000);
  };

  const update = (_: number, delta: number) => {
    if (!highlightsInitializedRef.current || isPaused) return;
    const node = nodeRef.current as Text | null;
    const cursorRange = cursorRangeRef.current;
    const contentRange = contentRangeRef.current;
    if (!node || !cursorRange || !contentRange) return;

    accRef.current += delta;
    if (accRef.current < 1000 / fpsRef.current) return;
    accRef.current = 0;

    const index = indexRef.current;
    if (index > node.textContent!.length - 1) {
      pause();
      window.setTimeout(() => {
        moveToNextText();
      }, 1000);
      return;
    }

    cursorRange.setStart(node, index);
    cursorRange.setEnd(node, index + 1);
    contentRange.setEnd(node, index);
    indexRef.current += 1;

    if (Math.random() > 1 - probability && node.textContent!.charAt(index - 1) === " ") {
      pause();
      fpsRef.current = random(8, 22, 1);
      window.setTimeout(() => {
        fpsRef.current = 12;
        unpause();
      }, random(200, 2000, 100));
    }
  };

  useAnimationFrame(update);

  useEffect(() => {
    if (!pRef.current || typeof window === "undefined" || !window.CSS?.highlights) {
      return;
    }

    highlightsInitializedRef.current = false;
    indexRef.current = 0;
    fpsRef.current = 12;
    accRef.current = 0;

    const p = pRef.current;
    const currentText = texts[currentTextIndex];
    if (!currentText) return;
    p.innerHTML = `${currentText.text.replace(/\s+/g, " ").trim()}&nbsp;`;

    const treeWalker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    const node = treeWalker.nextNode();
    if (!node) return;
    nodeRef.current = node;

    const cursorRange = new Range();
    const contentRange = new Range();
    cursorRange.setStart(node, 0);
    cursorRange.setEnd(node, 1);
    contentRange.setStart(node, 0);
    contentRange.setEnd(node, 0);

    cursorRangeRef.current = cursorRange;
    contentRangeRef.current = contentRange;

    const cursorHighlight = new window.Highlight(cursorRange);
    const contentHighlight = new window.Highlight(contentRange);

    window.CSS.highlights.set(cursorHighlightName, cursorHighlight);
    window.CSS.highlights.set(contentHighlightName, contentHighlight);

    const startTimeout = window.setTimeout(() => {
      highlightsInitializedRef.current = true;
      unpause();
    }, delay * 1000);

    return () => {
      window.clearTimeout(startTimeout);
      window.CSS.highlights.delete(cursorHighlightName);
      window.CSS.highlights.delete(contentHighlightName);
      highlightsInitializedRef.current = false;
    };
  }, [texts, currentTextIndex, delay, probability, cursorHighlightName, contentHighlightName]);

  return { isPaused, pRef };
};


// --- COMPONENTE PRINCIPAL ---
export default function DigitalTypewriter({
  texts,
  font = {
    fontFamily: "monospace",
    fontWeight: 300,
    letterSpacing: "1px",
    lineHeight: "1.5em",
    textAlign: "left",
    fontSize: "32px",
  },
  probability = 0.1,
  delay = 1,
}: DigitalTypewriterProps) {

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const currentText = texts[currentTextIndex];
  const currentCursorColor = currentText?.cursorColor;
  const currentContentColor = currentText?.contentColor;

  const reactId = useId();
  const safeId = useMemo(() => reactId.replace(/[^a-zA-Z0-9_-]/g, "-"), [reactId]);
  const cursorHighlightName = `cursor-${safeId}`;
  const contentHighlightName = `content-${safeId}`;

  const typewriterId = useTypewriterColors({
    cursorColor: currentCursorColor,
    contentColor: currentContentColor,
  });

  const { isPaused, pRef } = useTypewriter({
    texts,
    currentTextIndex,
    setCurrentTextIndex,
    delay,
    probability,
    cursorHighlightName,
    contentHighlightName,
  });

  const baseStyle = `
    @layer demo {
      @property --alpha {
        syntax: "<number>";
        inherits: true;
        initial-value: 1;
      }
      #mainDigitalTypewriter-${safeId} {
        animation: cursor-blink 0.8s infinite steps(1) paused;
        position: relative;
      }
      [data-paused="false"] {
        animation: none;
      }
      [data-paused="false"] [data-type] {
        --alpha: 0;
      }
      #mainDigitalTypewriter-${safeId}[data-paused="true"] {
        animation-play-state: running;
      }
      @keyframes cursor-blink { 50% { --alpha: 0; } }
      ::highlight(__CURSOR__) { color: transparent; }
      [data-type] {
        --cursor-blink: color-mix(in hsl, var(--cursor), #0000 calc(var(--alpha) * 100%));
      }
      ::highlight(__CONTENT__) { color: var(--content); }
      ::highlight(__CURSOR__) { background-color: var(--cursor-blink); }
      [data-type] {
        width: 100%;
        color: transparent;
        white-space: break-spaces;
        font-family: ${font.fontFamily};
        font-weight: ${font.fontWeight};
        margin: 0;
        letter-spacing: ${font.letterSpacing};
        font-size: ${font.fontSize};
        line-height: ${font.lineHeight};
        text-align: ${font.textAlign};
      }
    }
`;

  const style = useMemo(() => {
    return baseStyle
      .replace(/__CURSOR__/g, cursorHighlightName)
      .replace(/__CONTENT__/g, contentHighlightName);
  }, [baseStyle, cursorHighlightName, contentHighlightName]);

  return (
    <>
      <div
        id={`mainDigitalTypewriter-${safeId}`}
        data-paused={isPaused}
        data-typewriter-id={typewriterId}
        style={{ width: "100%", height: "100%" }}
      >
        <style>{style}</style>
        <div
          className="typewriter-container"
          style={{ position: "relative", width: "fit-content", height: "100%", minWidth: "100%" }}
        >
          {texts.map((_, index) => (
            <p
              key={index}
              className={`typewriter-text-${safeId}`}
              data-type={index === currentTextIndex ? "" : null}
              ref={index === currentTextIndex ? pRef : null}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                opacity: index === currentTextIndex ? 1 : 0,
                pointerEvents: "none",
                width: "100%",
                whiteSpace: "inherit",
              }}
            />
          ))}
          <p
            data-type="hidden"
            style={{
              position: "relative",
              opacity: 0,
              pointerEvents: "none",
              width: "100%",
              whiteSpace: "inherit",
            }}
            aria-hidden="true"
          >
            {currentText?.text}
          </p>
        </div>
      </div>
    </>
  );
}
