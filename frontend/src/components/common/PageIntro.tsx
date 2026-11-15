interface PageIntroProps {
  eyebrow: string
  title: string
  description: string
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="mb-6">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
    </header>
  )
}
