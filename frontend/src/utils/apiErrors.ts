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
        return 'The server rejected the number of variables. Restart the updated backend, which supports all seven variables.'
      }
      return `${field}: ${issue.msg ?? 'Invalid value.'}`
    }).join(' ') || fallback
  }
  if (detail && typeof detail === 'object' && 'message' in detail && typeof detail.message === 'string') {
    return detail.message
  }
  return fallback
}
