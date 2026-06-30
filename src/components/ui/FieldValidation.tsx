import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FieldValidationProps {
  message?: string;
}

/**
 * Standardized inline field-level error message. Renders directly beside/under the
 * related input instead of a blocking browser alert(), per the Sprint 3 Hotfix
 * Dialog System requirement: "Validation must appear beside the field whenever possible."
 */
export function FieldValidation({ message }: FieldValidationProps) {
  if (!message) return null;
  return (
    <p className="text-[10px] font-bold text-red-600 flex items-center gap-1 pt-0.5">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
