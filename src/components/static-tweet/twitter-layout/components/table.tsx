import type { ComponentProps } from 'react'

export const Table = (p: ComponentProps<'table'>) => (
  <div className="table-container">
    <table {...p} />
  </div>
)

export const Th = (p: ComponentProps<'th'>) => <th {...p} />

export const Td = (p: ComponentProps<'td'>) => <td {...p} />
