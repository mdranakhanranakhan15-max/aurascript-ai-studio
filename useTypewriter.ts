import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for smooth typewriter text animation
 * @param targetText Full text to be typed
 * @param baseSpeedMs Interval in milliseconds per chunk
 */
export function useTypewriter(targetText: string, baseSpeedMs: number = 18) {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!targetText) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    const len = targetText.length;
    // Step size adapts to text length so animation remains snappy and comfortable (~1.5s - 2.5s total)
    const step = len > 350 ? 4 : len > 180 ? 2 : 1;
    const speed = Math.max(10, baseSpeedMs);

    const typeNext = () => {
      index = Math.min(index + step, len);
      setDisplayedText(targetText.slice(0, index));

      if (index < len) {
        timeoutRef.current = setTimeout(typeNext, speed);
      } else {
        setIsTyping(false);
      }
    };

    timeoutRef.current = setTimeout(typeNext, speed);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [targetText, baseSpeedMs]);

  return { displayedText, isTyping };
}
