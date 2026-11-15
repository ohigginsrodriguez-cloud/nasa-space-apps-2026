import { BookOpen, Database, ExternalLink, FlaskConical, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ProjectGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

const steps = [
  ['01', 'Formula una pregunta', 'Elige una variable del sistema Tierra y una región de interés.'],
  ['02', 'Construye la evidencia', 'Selecciona un periodo suficientemente largo y consulta una serie mensual.'],
  ['03', 'Interpreta con cuidado', 'Compara la tasa de cambio, los métodos estadísticos, la incertidumbre y las limitaciones.'],
]

export function ProjectGuideModal({ isOpen, onClose }: ProjectGuideModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.showModal()
    return () => {
      document.body.style.overflow = overflow
      dialog.current?.close()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby="project-guide-title"
      className="fixed inset-0 m-auto max-h-[90vh] w-[92vw] max-w-3xl overflow-hidden rounded-2xl bg-surface p-0 shadow-2xl backdrop:bg-ink/45"
      onCancel={onClose}
    >
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 sm:p-7">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Guía rápida</p>
              <h2 id="project-guide-title" className="mt-1 text-xl font-bold tracking-tight">
                De una pregunta a evidencia
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Esta herramienta ayuda a explorar tendencias ambientales; no reemplaza una revisión científica completa ni demuestra causalidad.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent" aria-label="Cerrar guía">
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {steps.map(([number, title, description]) => (
            <li key={number} className="rounded-xl border border-line bg-canvas/55 p-4">
              <span className="font-mono text-xs font-bold text-signal">{number}</span>
              <h3 className="mt-3 text-sm font-bold">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-accent/20 bg-accent-soft/65 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-accent">
              <Database size={16} aria-hidden="true" />
              Datos y método
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-ink">
              La fuente activa es NASA POWER Monthly API. El análisis usa agregados anuales de series mensuales, OLS, Mann-Kendall, Theil-Sen e intervalos de confianza del 95%.
            </p>
            <a
              href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
            >
              Documentación de NASA POWER <ExternalLink size={12} aria-hidden="true" />
            </a>
          </section>

          <section className="rounded-xl border border-line bg-canvas/55 p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <FlaskConical size={16} className="text-signal" aria-hidden="true" />
              Cómo leer el resultado
            </h3>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
              <li><strong className="text-ink">Cambio por década:</strong> magnitud estimada del cambio.</li>
              <li><strong className="text-ink">p-value e intervalo:</strong> fuerza y precisión de la evidencia bajo el método elegido.</li>
              <li><strong className="text-ink">Advertencias:</strong> datos faltantes, autocorrelación o desacuerdo entre métodos.</li>
            </ul>
          </section>
        </div>

        <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
          NASA no respalda ninguna entidad no gubernamental de Estados Unidos ni es responsable de la información contenida en sitios web no gubernamentales. Este es un proyecto educativo independiente para NASA Space Apps Challenge; deben respetarse las condiciones de uso de cada fuente.
        </p>

        <footer className="mt-5 flex justify-end border-t border-line pt-4">
          <button type="button" onClick={onClose} className="rounded-lg bg-accent px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover">
            Entendido
          </button>
        </footer>
      </div>
    </dialog>,
    document.body,
  )
}
