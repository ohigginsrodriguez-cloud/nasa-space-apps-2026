import type { ReactNode } from 'react'

interface SectionTitleProps {
  id: string
  title: string
  description: string
  children?: ReactNode
}

export function SectionTitle({ id, title, description, children }: SectionTitleProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
      <div className="flex items-start gap-3">
        <div>
          <h2 id={id} className="text-base font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
