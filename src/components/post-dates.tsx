import { formatShortPostDate } from '@/lib/post-date'

export default function PostDates({
  dateLastModified
}: {
  dateLastModified: string
}) {
  return (
    <time
      dateTime={dateLastModified}
      className="text-sm text-gray-600 dark:text-gray-400"
    >
      {formatShortPostDate(dateLastModified)}
    </time>
  )
}
