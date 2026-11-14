import { Scale, Telescope } from 'lucide-react'
import type { SectionId } from '../../types'

export const navigation = [
  { id: 'investigation', path: '/dashboard', label: 'Investigar', description: 'Elige variable, región y periodo.', icon: Telescope },
  { id: 'analysis', path: '/trends', label: 'Tendencias', description: 'Consulta la serie y su significancia estadística.', icon: Scale },
] satisfies { id: SectionId; path: string; label: string; description: string; icon: typeof Telescope }[]
