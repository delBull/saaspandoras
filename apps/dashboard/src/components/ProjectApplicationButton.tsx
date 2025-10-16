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
}

export function ProjectApplicationButton({
  children,
  className = '',
  variant = 'default',
  size = 'default',
  buttonText = 'Aplicar Proyecto',
  disabled = false
}: ProjectApplicationButtonProps) {
  const { open } = useProjectModal();

  return (
    <Button
      onClick={open}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
    >
      {children ?? buttonText}
    </Button>
  );
}