interface PageIntroProps {
  eyebrow: string
  title: string
  description: string
}

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="mb-6">
      <p className="mb-2 font-mono text-[10px] font-medium tracking-[0.18em] text-accent">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>
    </header>
  )
}
