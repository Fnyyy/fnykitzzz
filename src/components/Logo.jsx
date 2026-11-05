import React from 'react';

export default function Logo({ size = 36, showText = false, textStyle = {}, className = '' }) {
  return (
    <div className={`fny-logo-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: size > 40 ? '12px' : '9px', userSelect: 'none' }}>
      {/* Vector Icon */}
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {/* Ambient Backlight Glow */}
        <div style={{
          position: 'absolute',
          inset: size > 40 ? '-4px' : '-2px',
          borderRadius: `${Math.round(size * 0.32)}px`,
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(6, 182, 212, 0.4))',
          filter: 'blur(6px)',
          opacity: 0.8,
          zIndex: 0
        }} />

        {/* SVG Emblem */}
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.3))'
          }}
        >
          <defs>
            <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="logoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          {/* Squircle Background Base */}
          <rect x="4" y="4" width="92" height="92" rx="26" fill="url(#logoBgGrad)" />
          
          {/* Subtle Inner Highlight Border */}
          <rect x="4" y="4" width="92" height="92" rx="26" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" fill="none" />
          
          {/* Stylized Stem of 'F' */}
          <rect x="23" y="24" width="12" height="52" rx="6" fill="#ffffff" />
          
          {/* Top Bar of 'F' */}
          <path d="M29 24 L56 24 C59.5 24 62 26.5 62 30 C62 33.5 59.5 36 56 36 L29 36 Z" fill="#ffffff" />
          
          {/* Middle Bar of 'F' (Vibrant Cyan) */}
          <path d="M29 44 L48 44 C51 44 53 46 53 49 C53 52 51 54 48 54 L29 54 Z" fill="url(#logoAccentGrad)" />
          
          {/* Dynamic 'K' diagonal arms */}
          <path d="M47 43 L68 25 C70.5 22.8 74.5 24.5 74.5 28 C74.5 29.8 73.5 31.5 72 32.8 L57 46.5 L73.5 67 C75.5 69.5 74.5 73.5 71.5 74.5 C69.5 75 67.5 74 66 72 L47 51 Z" fill="#ffffff" />
          
          {/* Creative Sparkle Star */}
          <path d="M78 13 C78 17 80 19 84 19 C80 19 78 21 78 25 C78 21 76 19 72 19 C76 19 78 17 78 13 Z" fill="#00f5ff" />
        </svg>
      </div>

      {/* Brand Text (Optional) */}
      {showText && (
        <span style={{
          fontWeight: 900,
          fontSize: size > 40 ? '1.8rem' : '1.18rem',
          letterSpacing: '-0.6px',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: '2px',
          ...textStyle
        }}>
          fnykids
          <span style={{
            display: 'inline-block',
            width: size > 40 ? '8px' : '5px',
            height: size > 40 ? '8px' : '5px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06b6d4, #38bdf8)',
            marginLeft: '1px'
          }} />
        </span>
      )}
    </div>
  );
}

