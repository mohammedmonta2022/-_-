import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export const AnimatedBackground: React.FC = () => {
  // Generate random animated floating organic orbs and geometric accents
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: (i * 17 + 8) % 95,
      y: (i * 23 + 12) % 90,
      size: (i % 3 + 1) * 60 + 40,
      duration: 14 + (i % 6) * 4,
      delay: (i % 5) * 1.5,
      isNavy: i % 3 === 0,
      isCream: i % 3 === 1,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Dynamic Animated Gradient Mesh Layers */}
      <motion.div
        animate={{
          scale: [1, 1.12, 0.96, 1],
          x: [0, 40, -30, 0],
          y: [0, -35, 25, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-[20%] -right-[15%] w-[650px] h-[650px] rounded-full blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(circle, #E8DAC8 0%, rgba(232,218,200,0) 70%)',
        }}
      />

      <motion.div
        animate={{
          scale: [1, 0.92, 1.08, 1],
          x: [0, -50, 40, 0],
          y: [0, 40, -30, 0],
        }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-[20%] -left-[15%] w-[700px] h-[700px] rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #053B50 0%, rgba(5,59,80,0) 70%)',
        }}
      />

      <motion.div
        animate={{
          scale: [0.95, 1.15, 0.95],
          x: [0, 30, 0],
          y: [0, -40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[35%] left-[25%] w-[480px] h-[480px] rounded-full blur-3xl opacity-15"
        style={{
          background: 'radial-gradient(circle, #E8DAC8 0%, rgba(232,218,200,0) 70%)',
        }}
      />

      {/* Floating Animated Ambient Glowing Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: [0, -40, 0, 40, 0],
            x: [0, 25, -20, 15, 0],
            scale: [1, 1.15, 0.9, 1.05, 1],
            opacity: [0.15, 0.35, 0.2, 0.3, 0.15],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
          className="absolute rounded-full pointer-events-none blur-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.isNavy
              ? '#053B50'
              : p.isCream
              ? '#E8DAC8'
              : '#F7F3EE',
          }}
        />
      ))}

      {/* Modern Wave Lines / Floating Architectural Cadence */}
      <svg
        className="absolute w-full h-full opacity-[0.04] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="azm-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#053B50"
              strokeWidth="1.2"
            />
            <circle cx="24" cy="24" r="1.5" fill="#E8DAC8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#azm-grid)" />
      </svg>
    </div>
  );
};
