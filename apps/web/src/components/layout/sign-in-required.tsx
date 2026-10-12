import { ButtonLink } from '../ui/button-link';
import { HeaderStrip } from './header-strip';

type SignInRequiredProps = {
  title: string;
  description: string;
};

/** Franja que sustituye a una página protegida cuando no hay sesión. */
export function SignInRequired({ title, description }: SignInRequiredProps) {
  return (
    <HeaderStrip
      glyph="✦"
      eyebrow="Acceso requerido"
      title={title}
      description={description}
    >
      <div className="xl:ml-auto">
        <ButtonLink href="/">Iniciar sesión</ButtonLink>
      </div>
    </HeaderStrip>
  );
}
