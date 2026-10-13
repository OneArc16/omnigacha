/** Construye el FormData que produciría un formulario con esos campos. */
export function formDataWith(entries: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value);
  }
  return formData;
}
