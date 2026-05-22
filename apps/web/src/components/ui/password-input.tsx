'use client';

import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { Input } from './input';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`pr-24 ${className}`.trim()}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-2 my-1 rounded-lg px-2 text-xs font-semibold text-[var(--ink-600)] transition hover:bg-[var(--surface)] hover:text-[var(--ink-900)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-200)]"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    );
  },
);
