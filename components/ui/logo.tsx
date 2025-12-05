'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = 'full', className = '', width, height }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use light theme logo as default until mounted
  const isDark = mounted && resolvedTheme === 'dark';

  // Logo file naming: logo-light.svg is FOR light backgrounds (dark colored)
  //                   logo-dark.svg is FOR dark backgrounds (light colored)
  const logoSrc =
    variant === 'icon'
      ? isDark
        ? '/logos/icon-dark.svg'
        : '/logos/icon-light.svg'
      : isDark
        ? '/logos/logo-dark.svg'
        : '/logos/logo-light.svg';

  const defaultWidth = variant === 'icon' ? 40 : 180;
  const defaultHeight = variant === 'icon' ? 40 : 40;

  return (
    <img
      src={logoSrc}
      alt="Dominion Desk"
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={className}
      style={{ display: 'block' }}
    />
  );
}
