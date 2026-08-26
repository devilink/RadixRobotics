"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
}

export default function AnimatedText({ text, className = "" }: AnimatedTextProps) {
  const container = useRef<HTMLParagraphElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 0.8", "end 0.2"],
  });

  const words = text.split(" ");

  return (
    <p ref={container} className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
}

const Word = ({ children, progress, range }: { children: string; progress: any; range: [number, number] }) => {
  const characters = children.split("");
  const amount = range[1] - range[0];
  const step = amount / children.length;
  
  return (
    <span className="relative mr-1.5 mt-1.5 lg:mr-2 lg:mt-2">
      {characters.map((char, i) => {
        const start = range[0] + (i * step);
        const end = range[0] + (step * (i + 1));
        
        return (
          <Character key={i} progress={progress} range={[start, end]}>
            {char}
          </Character>
        );
      })}
    </span>
  );
};

const Character = ({ children, progress, range }: { children: string; progress: any; range: [number, number] }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  
  return (
    <span>
      <span className="invisible">{children}</span>
      <motion.span style={{ opacity }} className="absolute left-0 top-0 text-inherit">
        {children}
      </motion.span>
    </span>
  );
};
