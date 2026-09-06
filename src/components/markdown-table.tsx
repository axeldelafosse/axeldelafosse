import type { ComponentPropsWithoutRef } from 'react'

import styles from '../styles/markdown.module.css'

export default function MarkdownTable(
  props: ComponentPropsWithoutRef<'table'>
) {
  return (
    <div
      className={styles.tableScroll}
      role="region"
      aria-label="Table"
      tabIndex={0}
    >
      <table {...props} />
    </div>
  )
}
