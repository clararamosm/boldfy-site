import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  height?: number;
  className?: string;
}

export function LogoFull({ height = 28, className }: LogoProps) {
  // Aspect ratio do SVG original: 394.52 x 152.57 ≈ 2.586:1
  const width = Math.round(height * 2.586);

  return (
    <Link href="/" className={className} aria-label="Boldfy - Home">
      <Image
        src="/images/boldfy-logo.svg"
        alt="Boldfy — plataforma de Employee Advocacy e Content Intelligence"
        width={width}
        height={height}
        priority
      />
    </Link>
  );
}

export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Link href="/" className={className} aria-label="Boldfy - Home">
      <Image
        src="/images/boldfy-icon.svg"
        alt="Boldfy — ícone da plataforma de Employee Advocacy"
        width={size}
        height={size}
        priority
      />
    </Link>
  );
}
