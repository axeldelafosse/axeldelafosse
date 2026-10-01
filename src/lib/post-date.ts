const postDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  weekday: 'short',
  month: 'short',
  day: '2-digit',
  year: 'numeric'
})

/** Contentlayer represents calendar dates as midnight UTC, not local instants. */
export function formatPostDate(value: string): string {
  const parts = Object.fromEntries(
    postDateFormatter
      .formatToParts(new Date(value))
      .map(({ type, value }) => [type, value])
  )
  // Keep the existing visual format, identical on the server and in the browser.
  return `${parts.weekday} ${parts.month} ${parts.day} ${parts.year}`
}

const shortPostDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
})

export function formatShortPostDate(value: string): string {
  return shortPostDateFormatter.format(new Date(value))
}

export function hasPostUpdate(date: string, modified: string): boolean {
  return formatShortPostDate(date) !== formatShortPostDate(modified)
}
