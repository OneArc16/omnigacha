import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes } from 'react';
import { ButtonVariant, getButtonClassName } from './button';

type ButtonLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    variant?: ButtonVariant;
  };

export function ButtonLink({
  className = '',
  variant = 'primary',
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={getButtonClassName({ className, variant })}
      {...props}
    />
  );
}
