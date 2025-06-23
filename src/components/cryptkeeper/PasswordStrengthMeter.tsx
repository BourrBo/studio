// src/components/cryptkeeper/PasswordStrengthMeter.tsx
"use client";

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password?: string;
}

type StrengthLevel = {
  label: string;
  value: number;
  colorClass: string;
  textColorClass: string;
};

const STRENGTH_LEVELS: StrengthLevel[] = [
  { label: "Very Weak", value: 0, colorClass: "bg-destructive", textColorClass: "text-destructive" },
  { label: "Weak", value: 25, colorClass: "bg-destructive/70", textColorClass: "text-destructive/90" },
  { label: "Medium", value: 50, colorClass: "bg-primary/50", textColorClass: "text-primary/90" },
  { label: "Strong", value: 75, colorClass: "bg-primary", textColorClass: "text-primary" },
  { label: "Very Strong", value: 100, colorClass: "bg-accent", textColorClass: "text-accent" },
];

const calculatePasswordStrength = (password: string): StrengthLevel => {
  let score = 0;
  if (!password || password.length === 0) return STRENGTH_LEVELS[0];

  // Length
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;

  // Character types
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;

  score = Math.min(score, 100);

  if (score < 25) return STRENGTH_LEVELS[0];
  if (score < 50) return STRENGTH_LEVELS[1];
  if (score < 75) return STRENGTH_LEVELS[2];
  if (score < 100) return STRENGTH_LEVELS[3];
  return STRENGTH_LEVELS[4];
};

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = "" }) => {
  const [strength, setStrength] = React.useState<StrengthLevel>(STRENGTH_LEVELS[0]);

  React.useEffect(() => {
    setStrength(calculatePasswordStrength(password));
  }, [password]);
  
  if (!password) {
    return null;
  }

  return (
    <div className="space-y-1 w-full pt-2">
      <Progress value={strength.value} className="h-2" indicatorClassName={cn("transition-all duration-300", strength.colorClass)} />
      <p className={cn("text-xs font-medium text-right transition-colors duration-300", strength.textColorClass)}>
        {strength.label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
