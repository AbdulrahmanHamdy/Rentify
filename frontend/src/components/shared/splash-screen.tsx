import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayTimeMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  minDisplayTimeMs = 1500,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if splash has already been shown in this tab session
    const hasShown = sessionStorage.getItem('rentify_splash_shown');
    if (hasShown) {
      setIsVisible(false);
      onFinish?.();
      return;
    }

    const timer = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('rentify_splash_shown', 'true');
      const removeTimer = setTimeout(() => {
        setIsVisible(false);
        onFinish?.();
      }, 500); // match transition duration

      return () => clearTimeout(removeTimer);
    }, minDisplayTimeMs);

    return () => clearTimeout(timer);
  }, [minDisplayTimeMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center 
      text-white transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #065f46 70%, #0b0f17 100%)' }}
      role="status"
      aria-live="polite"
      aria-label="Loading Rentify"
    >
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(16,185,129,0.18) 0%, rgba(6,95,70,0.10) 50%, transparent 100%)' }} />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated House SVG */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl blur-2xl animate-pulse" style={{ background: 'rgba(16,185,129,0.25)' }} />
          <div className="relative flex items-center justify-center">
            <svg
              width="120"
              height="110"
              viewBox="0 0 120 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* ── Roof ── */}
              <polygon
                points="10,55 60,5 110,55"
                fill="url(#roofGrad)"
                stroke="#34d399"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Roof ridge highlight */}
              <line x1="60" y1="5" x2="60" y2="20" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

              {/* ── Chimney ── */}
              <rect x="78" y="18" width="10" height="22" rx="1" fill="#047857" />
              {/* Smoke puffs */}
              <circle cx="83" cy="13" r="3" fill="#a7f3d0" opacity="0.5">
                <animate attributeName="cy" values="13;5;13" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="86" cy="9" r="2" fill="#a7f3d0" opacity="0.3">
                <animate attributeName="cy" values="9;1;9" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="r" values="2;4;2" dur="2.4s" repeatCount="indefinite" />
              </circle>

              {/* ── Walls ── */}
              <rect x="18" y="53" width="84" height="52" rx="2" fill="url(#wallGrad)" stroke="#059669" strokeWidth="1.5" />

              {/* ── Left window ── */}
              <rect x="26" y="63" width="18" height="16" rx="2" fill="#022c22" stroke="#34d399" strokeWidth="1" />
              <line x1="35" y1="63" x2="35" y2="79" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
              <line x1="26" y1="71" x2="44" y2="71" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
              {/* window warm glow */}
              <rect x="26" y="63" width="18" height="16" rx="2" fill="#fde68a" opacity="0.13">
                <animate attributeName="opacity" values="0.13;0.25;0.13" dur="3s" repeatCount="indefinite" />
              </rect>

              {/* ── Right window ── */}
              <rect x="76" y="63" width="18" height="16" rx="2" fill="#022c22" stroke="#34d399" strokeWidth="1" />
              <line x1="85" y1="63" x2="85" y2="79" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
              <line x1="76" y1="71" x2="94" y2="71" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
              {/* window warm glow */}
              <rect x="76" y="63" width="18" height="16" rx="2" fill="#fde68a" opacity="0.13">
                <animate attributeName="opacity" values="0.25;0.13;0.25" dur="3s" repeatCount="indefinite" />
              </rect>

              {/* ── Door frame ── */}
              <rect x="47" y="68" width="26" height="37" rx="2" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />

              {/* ── Open door panel (swings open) ── */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0 47 86; -55 47 86; -55 47 86; 0 47 86"
                  keyTimes="0; 0.3; 0.7; 1"
                  dur="3s"
                  repeatCount="indefinite"
                />
                <rect x="47" y="68" width="26" height="37" rx="2" fill="url(#doorGrad)" stroke="#059669" strokeWidth="1" />
                {/* door panel insets */}
                <rect x="51" y="72" width="8" height="10" rx="1" fill="#047857" opacity="0.6" />
                <rect x="61" y="72" width="8" height="10" rx="1" fill="#047857" opacity="0.6" />
                <rect x="51" y="85" width="18" height="14" rx="1" fill="#047857" opacity="0.6" />
                {/* gold door knob */}
                <circle cx="70" cy="88" r="2.2" fill="#fbbf24" />
              </g>

              {/* Interior warm glow — brightens when door is open */}
              <rect x="48" y="69" width="24" height="35" fill="#fde68a" opacity="0.08">
                <animate attributeName="opacity" values="0.08;0.20;0.08" dur="3s" repeatCount="indefinite" />
              </rect>

              {/* ── Front step ── */}
              <rect x="43" y="103" width="34" height="4" rx="1" fill="#047857" />
              <rect x="39" y="107" width="42" height="3" rx="1" fill="#065f46" />

              {/* ── Gradients ── */}
              <defs>
                <linearGradient id="roofGrad" x1="10" y1="55" x2="110" y2="5" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="wallGrad" x1="18" y1="53" x2="102" y2="105" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#065f46" />
                </linearGradient>
                <linearGradient id="doorGrad" x1="47" y1="68" x2="73" y2="105" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Rent<span className="text-brand-400">ify</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-xs uppercase tracking-widest text-brand-300/70 font-semibold">
          Property Rental Management Platform
        </p>

        {/* Animated Loading Bar */}
        <div className="mt-8 w-44 h-1.5 bg-charcoal-800 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
};
