import React from 'react';

/**
 * High-performance, GPU-accelerated living background
 * Utilizes hardware composited transforms (translate3d) and soft radial gradients
 * to ensure buttery-smooth 60+ FPS performance with zero lag or stutter.
 */
export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Soft Base Tint */}
      <div className="absolute inset-0 bg-[#FFFFFF]" />

      {/* Large Glowing Ambient Cream Orb (Top Right) */}
      <div
        className="anim-orb-1 absolute -top-24 -right-24 w-[480px] h-[480px] sm:w-[620px] sm:h-[620px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232, 218, 200, 0.45) 0%, rgba(232, 218, 200, 0.18) 45%, rgba(232, 218, 200, 0) 70%)',
        }}
      />

      {/* Large Glowing Ambient Navy Teal Orb (Bottom Left) */}
      <div
        className="anim-orb-2 absolute -bottom-28 -left-28 w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(5, 59, 80, 0.16) 0%, rgba(5, 59, 80, 0.06) 50%, rgba(5, 59, 80, 0) 70%)',
        }}
      />

      {/* Center Delicate Accent Glow */}
      <div
        className="anim-orb-3 absolute top-1/3 left-1/4 w-[380px] h-[380px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232, 218, 200, 0.35) 0%, rgba(232, 218, 200, 0.10) 50%, rgba(232, 218, 200, 0) 70%)',
        }}
      />

      {/* Smooth Floating Accent Dots (Zero JS runtime load) */}
      <div
        className="anim-particle absolute top-[18%] left-[12%] w-3.5 h-3.5 rounded-full pointer-events-none"
        style={{
          backgroundColor: '#E8DAC8',
          boxShadow: '0 0 16px 4px rgba(232, 218, 200, 0.6)',
          animationDelay: '0s',
        }}
      />
      <div
        className="anim-particle absolute top-[75%] left-[82%] w-3 h-3 rounded-full pointer-events-none"
        style={{
          backgroundColor: '#053B50',
          boxShadow: '0 0 12px 3px rgba(5, 59, 80, 0.25)',
          animationDelay: '3s',
        }}
      />
      <div
        className="anim-particle absolute top-[30%] right-[18%] w-4 h-4 rounded-full pointer-events-none"
        style={{
          backgroundColor: '#E8DAC8',
          boxShadow: '0 0 18px 5px rgba(232, 218, 200, 0.7)',
          animationDelay: '6s',
        }}
      />
      <div
        className="anim-particle absolute bottom-[22%] left-[28%] w-2.5 h-2.5 rounded-full pointer-events-none"
        style={{
          backgroundColor: '#053B50',
          boxShadow: '0 0 10px 2px rgba(5, 59, 80, 0.2)',
          animationDelay: '9s',
        }}
      />

      {/* Crisp Geometric Pattern Overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="azm-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="#053B50"
              strokeWidth="1.2"
            />
            <circle cx="22" cy="22" r="1.5" fill="#E8DAC8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#azm-grid)" />
      </svg>
    </div>
  );
};
