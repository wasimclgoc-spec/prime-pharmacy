'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
  const dotVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '100%',
    },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  };

  return (
    <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-slate-800/80 px-4 py-3.5 rounded-2xl rounded-tl-none border border-emerald-100/50 dark:border-emerald-950/20 max-w-[80px] justify-center shadow-sm">
      <motion.span
        className="block w-2 h-2 bg-emerald-500 rounded-full"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...dotTransition,
          delay: 0,
        }}
      />
      <motion.span
        className="block w-2 h-2 bg-emerald-500 rounded-full"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...dotTransition,
          delay: 0.15,
        }}
      />
      <motion.span
        className="block w-2 h-2 bg-emerald-500 rounded-full"
        variants={dotVariants}
        initial="start"
        animate="end"
        transition={{
          ...dotTransition,
          delay: 0.3,
        }}
      />
    </div>
  );
}
