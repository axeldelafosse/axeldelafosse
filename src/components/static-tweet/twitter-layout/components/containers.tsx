import type { ComponentProps } from 'react'

export const Div = (p: ComponentProps<'div'>) => (
  <div className={p.className}>{p.children}</div>
)
