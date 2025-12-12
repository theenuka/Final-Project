import { useId } from "react";
import { cn } from "../lib/utils";

type BrandLogoProps = {
  onClick?: () => void;
  className?: string;
  showWordmark?: boolean;
  interactive?: boolean;
};

const BrandLogo = ({
  onClick,
  className = "",
  showWordmark = true,
  interactive = true,
}: BrandLogoProps) => {
  const frameGradientId = useId();
  const accentGradientId = useId();
  const glowGradientId = useId();

  const logoMark = (
    <>
      <div className="relative">
        <div className="size-12 sm:size-14 rounded-[18px] border border-white/12 bg-[#0c1224] shadow-[0_18px_40px_rgba(3,5,15,0.7)] flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="w-10 h-10"
            role="presentation"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={frameGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#141a32" />
                <stop offset="100%" stopColor="#0b1121" />
              </linearGradient>
              <linearGradient id={accentGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5d8b0" />
                <stop offset="100%" stopColor="#f0c298" />
              </linearGradient>
              <radialGradient id={glowGradientId} cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#f9eddc" stopOpacity="0.7" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect
              x="6"
              y="6"
              width="52"
              height="52"
              rx="15"
              fill={`url(#${frameGradientId})`}
              stroke="#2b3250"
              strokeWidth="1.5"
            />
            <path
              d="M22 46V27.5c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6V46"
              stroke={`url(#${accentGradientId})`}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M24 34h16M24 40h16M32 30v16"
              stroke="#f8f5ee"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            <path
              d="M28 46v-6a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v6"
              stroke="#c7d2ff"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx="32" cy="18" r="5" fill={`url(#${glowGradientId})`} />
            <circle cx="32" cy="18" r="2.6" fill="#f8f4ec" />
            <path
              d="M20 48h24"
              stroke="#2f3a5a"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-[18px] bg-[#f5d8b0]/15 blur-2xl opacity-0 group-hover:opacity-100 transition" />
      </div>
      {showWordmark && (
        <div className="text-left">
          <span className="text-[10px] uppercase tracking-[0.55em] text-white block">
            Phoenix
          </span>
          <span className="block text-2xl leading-none text-white font-display">
            Booking
          </span>
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    "flex items-center gap-3 group",
    interactive
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
      : "cursor-default",
    className
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Phoenix Booking home"
        className={baseClasses}
      >
        {logoMark}
      </button>
    );
  }

  return <div className={baseClasses}>{logoMark}</div>;
};

export default BrandLogo;
