import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-charcoal-950 text-white transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading Rentify"
    >
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-900/40 via-charcoal-950/80 to-charcoal-950 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icon Container */}
        <div className="relative mb-6">
          <div className="absolute -inset-3 rounded-3xl bg-brand-500/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-2xl shadow-brand-500/30 ring-1 ring-white/20">
            <Home className="h-10 w-10 animate-bounce [animation-duration:2s]" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Rent<span className="text-brand-400">ify</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-xs uppercase tracking-widest text-charcoal-400 font-semibold">
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
