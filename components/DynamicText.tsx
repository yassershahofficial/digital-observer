'use client';

import { useEffect, useRef } from 'react';

interface DynamicTextProps {
  text: string;
  className?: string;
}

export default function DynamicText({ text, className = '' }: DynamicTextProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current || !text) return;

    // Fade-in animation
    textRef.current.style.opacity = '0';
    textRef.current.style.transform = 'translateY(20px)';
    textRef.current.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

    const timer = setTimeout(() => {
      if (textRef.current) {
        textRef.current.style.opacity = '1';
        textRef.current.style.transform = 'translateY(0)';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [text]);

  if (!text) return null;

  return (
    <div ref={textRef} className={className}>
      {text}
    </div>
  );
}
