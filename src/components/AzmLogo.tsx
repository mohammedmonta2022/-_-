import React from 'react';

interface AzmLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export const AzmLogo: React.FC<AzmLogoProps> = ({
  className = '',
  size = 90,
  showText = false,
  textColor = '#053B50',
}) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      {/* 
        Official Azm Educational Complex Logo (مجمع عزم التعليمي)
        Faithfully vector-rendered with exact brand colors:
        - Dark Navy Teal: #053B50
        - Cream Beige: #E8DAC8
        - Pure White: #FFFFFF
      */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105 drop-shadow-sm select-none"
        aria-label="شعار مجمع عزم التعليمي"
      >
        {/* Inner Beige/Cream Shape (#E8DAC8) */}
        {/* Dome arch top with curved wave bottom */}
        <path
          d="M 120 28
             C 146 50 188 88 188 136
             C 188 160 178 168 152 168
             C 134 168 116 160 92 156
             C 68 152 46 162 38 170
             C 38 158 38 140 38 136
             C 38 88 80 50 120 28 Z"
          fill="#E8DAC8"
        />

        {/* Outer Dark Navy Teal Architectural Arch (#053B50) */}
        <path
          d="M 120 4
             L 126 9
             C 176 44 228 92 228 162
             C 228 169 222 174 215 174
             L 201 174
             C 194 174 189 169 189 162
             C 189 104 148 64 120 38
             C 92 64 51 104 51 162
             C 51 172 55 178 68 182
             C 94 190 128 176 166 186
             C 192 193 214 204 214 216
             C 214 223 206 226 198 225
             C 162 220 134 200 98 192
             C 62 184 28 198 12 220
             C 10 223 7 223 7 218
             L 7 162
             C 7 92 59 44 114 9
             L 120 4 Z"
          fill="#053B50"
        />

        {/* Floating / Wave Accent at bottom right (#053B50) */}
        <path
          d="M 16 220
             C 36 200 70 186 104 194
             C 138 202 164 218 200 224
             C 210 226 218 220 218 210
             C 218 202 206 194 184 186
             C 144 172 108 188 78 178
             C 60 172 52 158 52 144
             L 52 208
             C 42 214 28 219 16 220 Z"
          fill="#053B50"
        />

        {/* Right side hook finish (#053B50) */}
        <path
          d="M 228 152
             C 228 168 214 176 198 176
             L 192 176
             C 185 176 180 171 180 164
             C 180 157 185 152 192 152
             L 198 152
             C 204 152 208 148 208 142
             C 208 94 166 52 120 26
             C 74 52 32 94 32 142
             C 32 166 36 186 44 204
             C 40 205 28 210 16 218
             C 14 196 12 170 12 142
             C 12 76 66 26 118 2
             L 122 2
             C 174 26 228 76 228 142
             L 228 152 Z"
          fill="#053B50"
        />
      </svg>

      {showText && (
        <div className="mt-3 text-center select-none">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ color: textColor }}
          >
            مجمع عزم التعليمي
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-[#053B50]/75 mt-1 tracking-wider uppercase">
            Azm Educational Complex
          </p>
        </div>
      )}
    </div>
  );
};

