'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

export function RippleButton({ children, className, ...props }: React.ComponentProps<typeof Button>) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      left: ${x - 10}px;
      top: ${y - 10}px;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);

    props.onClick?.(e);
  };

  return (
    <Button ref={buttonRef} className={className} {...props} onClick={handleClick}>
      {children}
    </Button>
  );
}
