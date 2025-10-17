'use client';

import React from 'react';
import { Button } from '@saasfly/ui/button';
import { useProjectModal } from '@/contexts/ProjectModalContext';

interface ProjectApplicationButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  buttonText?: string;
  disabled?: boolean;
  showCloseButton?: boolean;
}

export function ProjectApplicationButton({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  buttonText = 'Aplicar Proyecto',
  disabled = false,
  showCloseButton = false
}: ProjectApplicationButtonProps) {
  const { open, close } = useProjectModal();

  const handleClick = () => {
    if (showCloseButton) {
      close();
    } else {
      void open();
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      {children ?? buttonText}
    </Button>
  );
}