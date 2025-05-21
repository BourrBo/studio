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
};

const STRENGTH_LEVELS: StrengthLevel[] = [
  { label: "Very Weak", value: 0, colorClass: "bg-red-500" },
  { label: "Weak", value: 25, colorClass: "bg-orange-500" },
  { label: "Medium", value: 50, colorClass: "bg-yellow-500" },
  { label: "Strong", value: 75, colorClass: "bg-lime-500" },
  { label: "Very Strong", value: 100, colorClass: "bg-green-500" },
];

const calculatePasswordStrength = (password: string): StrengthLevel => {
  let score = 0;
  if (!password || password.length === 0) return STRENGTH_LEVELS[0];

  // Length
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15; // Bonus for longer
  if (password.length >= 16) score += 10; // Bonus for very long

  // Character types
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20; // Symbols

  score = Math.min(score, 100); // Cap score at 100

  if (score < 25) return STRENGTH_LEVELS[0]; // Very Weak
  if (score < 50) return STRENGTH_LEVELS[1]; // Weak
  if (score < 75) return STRENGTH_LEVELS[2]; // Medium
  if (score < 100) return STRENGTH_LEVELS[3]; // Strong
  return STRENGTH_LEVELS[4]; // Very Strong
};

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = "" }) => {
  const [strength, setStrength] = React.useState<StrengthLevel>(STRENGTH_LEVELS[0]);

  React.useEffect(() => {
    setStrength(calculatePasswordStrength(password));
  }, [password]);

  return (
    <div className="space-y-1 w-full">
      <Progress value={strength.value} className={cn("h-2", strength.colorClass)} />
      <p className={cn("text-xs font-medium", 
        strength.value === 0 ? "text-red-500" :
        strength.value === 25 ? "text-orange-500" :
        strength.value === 50 ? "text-yellow-500" :
        strength.value === 75 ? "text-lime-500" :
        "text-green-500"
      )}>
        Strength: {strength.label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
