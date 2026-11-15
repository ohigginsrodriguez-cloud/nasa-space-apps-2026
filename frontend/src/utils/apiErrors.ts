/** Normalize FastAPI validation arrays and application/provider errors for the UI. */
export function formatApiError(body: unknown, status: number): string {
  const fallback = `No se pudo completar la solicitud (HTTP ${status}).`
  if (!body || typeof body !== 'object' || !('detail' in body)) return fallback
  const detail = body.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((issue: { loc?: unknown[]; msg?: string; type?: string }) => {
      const field = issue.loc?.filter((part) => part !== 'body').join('.') ?? 'solicitud'
      if (field === 'variable_ids' && issue.type === 'too_long') {
        return 'El servidor rechazó la cantidad de variables. Reinicia el backend actualizado, que admite las siete variables.'
      }
      return `${field}: ${issue.msg ?? 'Valor no válido.'}`
    }).join(' ') || fallback
  }
  if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
    return detail.message
  }
  return fallback
}
