interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Content Forge logo"
    >
      <defs>
        <linearGradient id="logo-flame" x1="16" y1="3" x2="16" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      <g>
        <path
          d="M5 23.5c0-1.1.9-2 2-2h18c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-2Z"
          fill="currentColor"
          fillOpacity="0.95"
        />
        <path
          d="M9 14h14l-1.75 7.5h-10.5L9 14Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        <path
          d="M9 14c-3.25 0-5.25 1.75-5.25 3.5h5.25V14Z"
          fill="currentColor"
          fillOpacity="0.85"
        />
        <path
          d="M16 3c-2.4 4.2-5.5 7-5.5 11 0 3.5 2.5 6 5.5 6s5.5-2.5 5.5-6c0-4-3.1-6.8-5.5-11Z"
          fill="url(#logo-flame)"
        />
        <path
          d="M16 8c-1.2 2.2-2.75 4.5-2.75 6.5 0 2 1.35 3.5 2.75 3.5s2.75-1.5 2.75-3.5c0-2-1.55-4.3-2.75-6.5Z"
          fill="#fff"
          fillOpacity="0.5"
        />
      </g>
    </svg>
  );
}

export function LogoMark({ className, size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Content Forge logo"
    >
      <defs>
        <linearGradient id="mark-flame" x1="16" y1="4" x2="16" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M8 22.5c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v1.5c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2v-1.5Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      <path
        d="M11 14h10l-1.5 6.5h-7L11 14Z"
        fill="#fff"
        fillOpacity="0.85"
      />
      <path
        d="M16 5c-2 4-4.5 6.5-4.5 10 0 2.75 2 4.75 4.5 4.75s4.5-2 4.5-4.75c0-3.5-2.5-6-4.5-10Z"
        fill="url(#mark-flame)"
      />
    </svg>
  );
}
