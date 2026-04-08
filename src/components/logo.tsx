import Link from 'next/link';

interface LogoProps {
  height?: number;
  className?: string;
}

export function LogoFull({ height = 28, className }: LogoProps) {
  return (
    <Link href="/" className={className} aria-label="Boldfy - Home">
      <svg height={height} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text
          x="0"
          y="26"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="28"
          fontWeight="800"
          letterSpacing="-0.02em"
        >
          <tspan fill="hsl(279 33% 28%)">bold</tspan>
          <tspan fill="hsl(279 71% 63%)">fy</tspan>
        </text>
      </svg>
    </Link>
  );
}

export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Link href="/" className={className} aria-label="Boldfy - Home">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="hsl(279 71% 63%)" />
        <text x="4" y="24" fontFamily="Inter, system-ui, sans-serif" fontSize="22" fontWeight="800" fill="white">bf</text>
      </svg>
    </Link>
  );
}
