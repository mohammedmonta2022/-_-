import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#F7F3EE]">
      {/* Static subtle textured ambient background without jarring motion */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `radial-gradient(#053B50 0.75px, transparent 0.75px), radial-gradient(#E8DAC8 0.75px, #F7F3EE 0.75px)`,
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px'
        }}
      />
      
      {/* Calm, fixed ambient soft gradients */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#E8DAC8]/35 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#053B50]/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#E8DAC8]/20 blur-[100px]" />
    </div>
  );
};
