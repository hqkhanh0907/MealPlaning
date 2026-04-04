import React, { useId } from 'react';
import type { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: string;
  error?: FieldError;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  htmlFor?: string;
}

export const FormField = React.memo(function FormField({
  label,
  error,
  children,
  className,
  required,
  htmlFor,
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const labelFor = htmlFor ?? fieldId;

  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;

    const extraProps: Record<string, unknown> = {};
    if (!htmlFor) extraProps['id'] = fieldId;
    if (required) extraProps['aria-required'] = true;
    if (error?.message) extraProps['aria-describedby'] = errorId;

    return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, extraProps);
  });

  return (
    <div className={className ?? 'mb-4'}>
      <label htmlFor={labelFor} className="text-foreground-secondary mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>

      {enhancedChildren}

      {error?.message && (
        <p id={errorId} className="mt-1 text-xs text-rose-500 dark:text-rose-400" role="alert">
          {error.message}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';
