import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes } from 'react';
import { ButtonSize, ButtonVariant, getButtonClassName } from './button';

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

export function ButtonLink({
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ className, variant, size })}
      {...props}
    />
  );
}
