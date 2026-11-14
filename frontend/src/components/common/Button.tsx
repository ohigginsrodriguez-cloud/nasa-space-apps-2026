import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet'
}

const variants = {
  primary: 'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover',
  secondary: 'border-line bg-surface text-ink hover:border-accent hover:text-accent',
  quiet: 'border-transparent text-muted hover:bg-canvas hover:text-ink',
}

export function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none ${variants[variant]} ${className}`} {...props} />
}
