import { BookOpen, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../context/LanguageContext'

interface GlossaryModalProps {
  isOpen: boolean
  onClose: () => void
}

const terms = [
  {
    term: 'Tendencia (Trend)',
    definition:
      'Dirección consistente en la que evoluciona una variable a lo largo del tiempo (ascendente, descendente o estable), más allá de las fluctuaciones aleatorias o estacionales.',
    relevance: 'Permite identificar si el sistema climático está experimentando un cambio sostenido.',
  },
  {
    term: 'Significancia estadística (α = 0,05)',
    definition:
      'Criterio cuantitativo que indica si el cambio observado es improbable que se deba únicamente al azar. Con α = 0,05, exigimos un 95% de confianza antes de declarar una tendencia.',
    relevance: 'Una tendencia visual en pocos años puede no ser estadísticamente significativa hasta contar con un registro más largo.',
  },
  {
    term: 'Valor p (p-value)',
    definition:
      'Probabilidad de observar una tendencia igual o más extrema que la calculada bajo la hipótesis de que en realidad no hay cambio (hipótesis nula).',
    relevance: 'Si p < 0,05, consideramos que existe evidencia estadística suficiente para rechazar que el cambio sea simple ruido.',
  },
  {
    term: 'Intervalo de Confianza del 95% (IC 95%)',
    definition:
      'Rango estimado que, con un 95% de certeza estadística, contiene la verdadera tasa de cambio de la variable en el sistema Tierra.',
    relevance: 'Muestra la precisión de la estimación. Si el intervalo incluye el cero (ej. [-2, +5]), la tendencia no es concluyente.',
  },
  {
    term: 'Test de Mann-Kendall',
    definition:
      'Prueba no paramétrica recomendada por NASA y la OMM para evaluar si una serie temporal presenta una tendencia monótona creciente o decreciente.',
    relevance: 'No asume que los datos sigan una distribución normal ni que el cambio sea estrictamente una línea recta.',
  },
  {
    term: 'Pendiente de Theil-Sen (Sen’s Slope)',
    definition:
      'Estimador no paramétrico de la tasa de cambio calculado como la mediana de todas las pendientes posibles entre cada par de puntos en el tiempo.',
    relevance: 'Es extremadamente robusto frente a valores atípicos (outliers) como tormentas récord o sequías extremas puntuales.',
  },
  {
    term: 'Anomalía y Desestacionalización',
    definition:
      'Diferencia entre el valor medido en un mes particular y el promedio histórico de ese mismo mes (climatología mensual).',
    relevance: 'Elimina el ciclo natural de verano/invierno para dejar al descubierto la verdadera señal del cambio de largo plazo.',
  },
]

export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { language } = useLanguage()
  const displayTerms = language === 'en'
    ? [
      ['Trend', 'A consistent direction in which a variable changes over time, beyond random or seasonal fluctuations.', 'It helps identify whether an Earth system is undergoing sustained change.'],
      ['Statistical significance (α = 0.05)', 'A quantitative criterion for judging whether an observed change is unlikely to be due only to chance.', 'A visual trend over a short period may not be statistically conclusive.'],
      ['p-value', 'The probability of observing a trend at least as extreme as the calculated one under the null hypothesis of no change.', 'A p-value below 0.05 is evidence against the no-change hypothesis under the selected method.'],
      ['95% confidence interval', 'An estimated range describing the uncertainty around the rate of change under the method assumptions.', 'If it includes zero, the direction of change is not conclusive.'],
      ['Mann-Kendall test', 'A non-parametric test for detecting monotonic trends without assuming a normal distribution.', 'It does not require the change to follow a straight line.'],
      ['Theil-Sen slope', 'A robust rate-of-change estimator based on the median of all pairwise slopes.', 'It is less sensitive to outliers such as record storms or droughts.'],
      ['Anomaly and deseasonalization', 'The difference between a monthly value and the historical average for that same month.', 'It helps reveal long-term signals beyond the natural seasonal cycle.'],
    ]
    : terms.map((item) => [item.term, item.definition, item.relevance])
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
      aria-labelledby="glossary-title"
       className="fixed inset-0 m-auto max-h-[90vh] w-[90vw] max-w-2xl overflow-hidden rounded-2xl bg-surface p-0 shadow-2xl backdrop:bg-ink/45"
      onCancel={onClose}
      onWheel={(event) => event.stopPropagation()}
    >
      <div
        className="max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 id="glossary-title" className="text-base font-bold text-ink">
                 {language === 'en' ? 'Data Detective glossary' : 'Glosario del Detective de Datos'}
              </h2>
               <p className="text-xs text-muted">{language === 'en' ? 'Key Earth science and statistics concepts' : 'Conceptos clave de ciencias de la Tierra y estadística'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
             className="rounded-lg p-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent focus:outline-none"
             aria-label={language === 'en' ? 'Close glossary' : 'Cerrar glosario'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
           {displayTerms.map(([term, definition, relevance]) => (
              <div key={term} className="rounded-xl border border-line bg-canvas/55 p-3.5 text-xs transition-colors hover:border-accent/35">
               <h3 className="font-semibold text-accent text-sm">{term}</h3>
               <p className="mt-1 text-ink leading-relaxed">{definition}</p>
              <p className="mt-2 text-[11px] text-muted italic border-t border-line/50 pt-1.5">
                 💡 <strong>{language === 'en' ? 'Why does it matter?' : '¿Por qué importa?'}</strong> {relevance}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
          >
             {language === 'en' ? 'Got it, return to analysis' : 'Entendido, volver al análisis'}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
