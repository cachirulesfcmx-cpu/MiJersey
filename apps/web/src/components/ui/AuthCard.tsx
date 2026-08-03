import { INPUT_OVERRIDE_CLASS, PRIMARY_BUTTON_OVERRIDE_CLASS } from './form-styles';
import { Reveal } from './Reveal';

/** Envoltura compartida por login/registro/recuperación/reset/verificación — mismo fondo, misma tarjeta flotante, mismo estilo de encabezado. */
export function AuthCard({
  title,
  children,
  maxWidthClassName = 'max-w-sm',
}: {
  title: string;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <main className="bg-stardust bg-arena-950 flex min-h-screen items-center justify-center p-6">
      <Reveal className={`w-full ${maxWidthClassName}`}>
        <div className="shadow-arena-950/20 rounded-3xl border border-neutral-100 bg-white p-8 shadow-xl">
          <h1 className="section-heading mb-6">{title}</h1>
          {children}
        </div>
      </Reveal>
    </main>
  );
}

export const AUTH_INPUT_CLASS = INPUT_OVERRIDE_CLASS;

export const AUTH_BUTTON_CLASS = `!mt-2 !w-full ${PRIMARY_BUTTON_OVERRIDE_CLASS}`;
