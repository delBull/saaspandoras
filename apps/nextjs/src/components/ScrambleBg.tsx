
'use client';

import { useEffect, useState, useRef, useMemo } from "react";
import { useInView, animate } from "framer-motion";

const HIDDEN = 0;
const SCRAMBLED = 1;
const REVEALED = 2;

const ScrambleBg = (props) => {
  const {
    text,
    scrambledLetters = 10,
    speed = 75,
    animation = { trigger: "layerInView", replay: true, delay: 0 },
    from = "random",
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:.<>?~",
    scrambledColor = "#333",
    color = "#666",
    font = { fontSize: 14, lineHeight: 1.4 },
    options = { matchCase: true, keepSpaces: false },
    tag: Tag = "div",
  } = props;

  const ref = useRef(null);
  const encryptedText = useRef(randomString(props));
  const [progress, setProgress] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const intervalRef = useRef(null);
  const isInView = useInView(ref, { once: !animation.replay, amount: "some" });

  const characterDelay = mapRange(speed, 1, 100, 0.2, 0.002); // seconds per character

  const shuffledIndices = useMemo(() => {
    if (from === "random") {
      const indices = Array.from({ length: text.length }, (_, i) => i);
      return indices.sort(() => Math.random() - 0.5);
    }
    return [];
  }, [text, from]);

  const runAnimation = () => {
    if (currentAnimation) {
      currentAnimation.stop();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Add timeout for delay
    setTimeout(() => {
      intervalRef.current = setInterval(() => {
        encryptedText.current = randomString(props);
      }, characterDelay * 1000);
      setCurrentAnimation(
        animate(0, 1, {
          type: "ease",
          ease: "linear",
          duration: characterDelay * (text.length + scrambledLetters),
          onUpdate: setProgress,
          onComplete: () => {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          },
        })
      );
    }, animation.delay * 1000);
  };

  useEffect(() => {
    if (animation.trigger === "appear") {
      runAnimation();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (animation.trigger === "layerInView") {
      if (isInView) {
        runAnimation();
      } else {
        if (currentAnimation) {
          currentAnimation.stop();
          setProgress(0);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }
    }
  }, [isInView]);

  let segments = [];
  switch (from) {
    case "left": {
      const leftCutoff = mapRange(progress, 0, 1, -scrambledLetters, text.length);
      const rightCutoff = mapRange(progress, 0, 1, 0, text.length + scrambledLetters);
      segments.push(
        [text.substring(0, clamp(leftCutoff, 0, text.length)), REVEALED],
        [encryptedText.current.substring(clamp(leftCutoff, 0, text.length), clamp(rightCutoff, 0, text.length)), SCRAMBLED],
        [text.substring(clamp(rightCutoff, 0, text.length)), HIDDEN]
      );
      break;
    }
    case "center": {
      const center = Math.ceil(text.length / 2);
      const letters = Math.max(Math.floor(scrambledLetters / 2), 1);
      const leftCutoff = mapRange(progress, 0, 1, center, -letters);
      const rightCutoff = mapRange(progress, 0, 1, center + letters, 0);
      segments.push(
        [text.substring(0, clamp(leftCutoff, 0, text.length)), HIDDEN],
        [encryptedText.current.substring(clamp(leftCutoff, 0, center), clamp(rightCutoff, 0, center)), SCRAMBLED],
        [text.substring(clamp(rightCutoff, 0, center), clamp(text.length - rightCutoff, center, text.length)), REVEALED],
        [encryptedText.current.substring(clamp(text.length - leftCutoff, center, text.length), clamp(text.length - rightCutoff, center, text.length)), SCRAMBLED],
        [text.substring(clamp(text.length - leftCutoff, 0, text.length), text.length), HIDDEN]
      );
      break;
    }
    case "right": {
      const leftCutoff = mapRange(progress, 0, 1, text.length, -scrambledLetters);
      const rightCutoff = mapRange(progress, 0, 1, text.length + scrambledLetters, 0);
      segments.push(
        [text.substring(0, clamp(leftCutoff, 0, text.length)), HIDDEN],
        [encryptedText.current.substring(clamp(leftCutoff, 0, text.length), clamp(rightCutoff, 0, text.length)), SCRAMBLED],
        [text.substring(clamp(rightCutoff, 0, text.length), text.length), REVEALED]
      );
      break;
    }
    case "random": {
      if (progress === 0) {
        segments.push([text, HIDDEN]);
      } else if (progress >= 1) {
        segments.push([text, REVEALED]);
      } else {
        for (let i = 0; i < text.length; i++) {
          const indexInSequence = shuffledIndices.indexOf(i);
          const scrambleWindow = scrambledLetters / text.length;
          const startScrambleAt = (indexInSequence / text.length) * (1 - scrambleWindow);
          const startRevealAt = startScrambleAt + scrambleWindow;
          if (progress >= startRevealAt) {
            segments.push([text[i], REVEALED]);
          } else if (progress >= startScrambleAt) {
            segments.push([encryptedText.current[i], SCRAMBLED]);
          } else {
            segments.push([text[i], HIDDEN]);
          }
        }
      }
      break;
    }
  }

  return (
    <Tag
      ref={ref}
      style={{
        color: color,
        userSelect: "none",
        pointerEvents: "none",
        margin: 0,
        whiteSpace: "nowrap",
        ...font,
        ...props.style,
      }}
    >
      {consolidateSegments(segments).map(([text, state], index) => {
        switch (state) {
          case HIDDEN:
            return <span key={index} style={{ opacity: 0 }}>{text}</span>;
          case SCRAMBLED:
            return scrambledColor ? <span key={index} style={{ color: scrambledColor }}>{text}</span> : text;
          case REVEALED:
            return text;
        }
      })}
    </Tag>
  );
};

export default ScrambleBg;

const randomString = (props) => {
  const {
    text,
    characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:.<>?~",
    options = { matchCase: true, keepSpaces: false },
  } = props;
  const length = text.length;
  const originalText = text;
  const matchCase = options.matchCase;
  const keepSpaces = options.keepSpaces;

  if (length <= 0) {
    return "";
  }
  let result = "";
  let lastChar = "";
  for (let i = 0; i < length; i++) {
    const originalChar = originalText[i];
    if (keepSpaces && (originalChar === " " || originalChar === "	")) {
      result += originalChar;
      continue;
    }
    let newChar;
    do {
      newChar = characters[Math.floor(Math.random() * characters.length)];
      if (matchCase && originalChar) {
        newChar = originalChar === originalChar.toUpperCase() ? newChar.toUpperCase() : newChar.toLowerCase();
      }
    } while (newChar === lastChar && characters.length >= 8);
    result += newChar;
    lastChar = newChar;
  }
  return result;
};

function mapRange(value, fromLow, fromHigh, toLow, toHigh) {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toHigh);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function consolidateSegments(segments) {
  return segments
    .filter(([text]) => text.length > 0)
    .reduce((acc, curr) => {
      if (acc.length === 0 || acc[acc.length - 1][1] !== curr[1]) {
        acc.push(curr);
      } else {
        acc[acc.length - 1][0] += curr[0];
      }
      return acc;
    }, []);
}
