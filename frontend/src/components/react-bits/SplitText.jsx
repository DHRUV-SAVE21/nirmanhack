import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
  text = '',
  className = '',
  delay = 50,
  duration = 0.8,
  ease = 'power3.out',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '0px',
  textAlign = 'center',
  tag = 'span',
  onLetterAnimationComplete,
  ...props
}) => {
  const ref = useRef(null);
  const words = text.split(' ');
  const animationCompletedRef = useRef(false);

  useGSAP(() => {
    if (!ref.current || !text) return;
    if (animationCompletedRef.current) return;

    const letters = ref.current.querySelectorAll('.split-char');
    
    gsap.fromTo(letters, 
      { 
        ...from 
      },
      {
        ...to,
        duration: duration,
        ease: ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: ref.current,
          start: `top bottom-=${threshold * 100}%`,
          toggleActions: 'play none none none',
          once: true,
        },
        onComplete: () => {
          animationCompletedRef.current = true;
          if (onLetterAnimationComplete) onLetterAnimationComplete();
        }
      }
    );
  }, { dependencies: [text], scope: ref });

  const Tag = tag || 'span';

  return (
    <Tag 
      ref={ref} 
      style={{ textAlign, display: 'inline-block', whiteSpace: 'normal', wordBreak: 'break-word', ...ref.current?.style }} 
      className={`split-parent ${className}`}
      {...props}
    >
      {words.map((word, wordIdx) => (
        <span key={wordIdx} className="split-word" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map((char, charIdx) => (
            <span 
              key={charIdx} 
              className="split-char" 
              style={{ display: 'inline-block' }}
            >
              {char}
            </span>
          ))}
          {wordIdx < words.length - 1 && <span className="split-char" style={{ display: 'inline-block' }}>&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
