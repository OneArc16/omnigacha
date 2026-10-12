import { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const BASE_CLASSNAME =
  'inline-flex items-center justify-center bevel-8 font-semibold tracking-[0.02em] outline-1 -outline-offset-1 transition duration-200 hover:brightness-110 active:brightness-95 focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100';

const SIZE_CLASSNAME: Record<ButtonSize, string> = {
  md: 'px-5 py-[11px] text-[13px]',
  sm: 'px-3.5 py-[9px] text-xs',
};

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary:
    'surface-gold text-[#1a1424] shadow-[inset_0_1px_0_rgba(255,255,255,.5)] outline-transparent focus-visible:outline-[#1a1424]',
  ghost:
    'bg-[rgba(233,236,248,.06)] text-ink outline-[rgba(233,236,248,.14)] hover:bg-[rgba(233,236,248,.1)] focus-visible:outline-gold',
  danger:
    'bg-danger/10 text-danger outline-danger/40 hover:bg-danger/15 focus-visible:outline-danger',
};

export function getButtonClassName({
  className = '',
  variant = 'primary',
  size = 'md',
}: {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return `${BASE_CLASSNAME} ${SIZE_CLASSNAME[size]} ${VARIANT_CLASSNAME[variant]} ${className}`.trim();
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName({ className, variant, size })}
      {...props}
    />
  );
}
