import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'quiet'
}

const variants = {
  primary: 'border-accent bg-accent text-white shadow-sm hover:border-accent-hover hover:bg-accent-hover hover:shadow-md',
  secondary: 'border-line bg-surface text-ink shadow-sm hover:border-accent hover:text-accent hover:shadow-md',
  quiet: 'border-transparent text-muted hover:bg-accent-soft hover:text-accent',
}

export function Button({ variant = 'secondary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none ${variants[variant]} ${className}`} {...props} />
}
