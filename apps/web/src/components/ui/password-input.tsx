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
          className="absolute inset-y-0 right-2 my-1 px-2 text-xs font-semibold text-muted transition hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-200)]"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
    );
  },
);
