import { ReactNode } from 'react';
import { Button } from '../../../components/ui/button';
import { Note } from '../../../components/ui/note';
import { WindowPanel } from '../../../components/ui/window-panel';

type EditorPanelProps = {
  title: string;
  subtitle: string;
  badge: ReactNode;
  /** Cambia al cambiar de registro para reiniciar los campos no controlados. */
  formKey: string | number;
  onSubmit: (formData: FormData) => void;
  isSaving: boolean;
  saveLabel: string;
  /** Vuelve al modo "nuevo registro". */
  onReset: () => void;
  /** Si se omite, el registro no admite archivado. */
  onArchive?: () => void;
  canArchive?: boolean;
  note?: string;
  children: ReactNode;
};

/** Panel derecho de un editor: formulario de alta/edición con sus acciones. */
export function EditorPanel({
  title,
  subtitle,
  badge,
  formKey,
  onSubmit,
  isSaving,
  saveLabel,
  onReset,
  onArchive,
  canArchive = false,
  note,
  children,
}: EditorPanelProps) {
  return (
    <WindowPanel title={title} subtitle={subtitle} action={badge}>
      <form
        key={formKey}
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget));
        }}
      >
        {children}

        {note ? <Note>{note}</Note> : null}

        <div className="flex flex-wrap gap-2.5">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : saveLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={(event) => {
              event.currentTarget.form?.reset();
              onReset();
            }}
          >
            Limpiar formulario
          </Button>
          {onArchive ? (
            <Button
              type="button"
              variant="danger"
              onClick={onArchive}
              disabled={!canArchive || isSaving}
            >
              Archivar
            </Button>
          ) : null}
        </div>
      </form>
    </WindowPanel>
  );
}
