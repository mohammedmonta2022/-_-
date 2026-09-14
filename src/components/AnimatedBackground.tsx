import React from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#F7F3EE]">
      {/* Subtle luxury geometric grid texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(5, 59, 80, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(5, 59, 80, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating subtle ambient luxury orbs with slow organic motion */}
      <motion.div
        animate={{
          x: [0, 45, 0, -35, 0],
          y: [0, -30, 20, -15, 0],
          scale: [1, 1.08, 0.96, 1.04, 1],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-gradient-to-br from-[#E8DAC8]/45 via-[#E8DAC8]/25 to-transparent blur-3xl will-change-transform"
      />

      <motion.div
        animate={{
          x: [0, -40, 25, -20, 0],
          y: [0, 35, -25, 20, 0],
          scale: [1, 0.95, 1.07, 0.98, 1],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className="absolute -bottom-28 -left-28 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-[#053B50]/12 via-[#053B50]/5 to-transparent blur-3xl will-change-transform"
      />

      <motion.div
        animate={{
          scale: [1, 1.15, 0.95, 1.08, 1],
          opacity: [0.18, 0.28, 0.16, 0.25, 0.18],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#E8DAC8]/30 blur-[110px] will-change-transform"
      />

      {/* Fine golden-azure light refraction accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#E8DAC8]/80 to-transparent" />
    </div>
  );
};
