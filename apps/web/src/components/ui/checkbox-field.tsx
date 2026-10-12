import { ReactNode } from "react";

type CheckboxFieldProps = {
  label: string;
  hint?: ReactNode;
  /** Uso controlado: `checked` + `onChange`. */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Uso dentro de un formulario nativo: `name` + `defaultChecked`. */
  name?: string;
  defaultChecked?: boolean;
};

export function CheckboxField({
  label,
  hint,
  checked,
  onChange,
  name,
  defaultChecked,
}: CheckboxFieldProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-[var(--ink-800)]">
        <input
          type="checkbox"
          className="size-4 accent-[var(--gold)]"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange ? (event) => onChange(event.target.checked) : undefined}
        />
        {label}
      </label>
      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}
