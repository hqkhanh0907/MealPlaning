import React from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export const FormField = React.memo(function FormField({
  label,
  error,
  children,
  className,
  required,
}: FormFieldProps) {
  return (
    <div className={className ?? 'mb-4'}>
      <label className="text-foreground-secondary mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>

      {children}

      {error?.message && (
        <p className="mt-1 text-xs text-rose-500 dark:text-rose-400" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
