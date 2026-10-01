import type { PostMetadata } from './post-data'

function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}(?:T00:00:00\.000Z)?$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value.slice(0, 10)
  )
}

export function validatePostMetadata(posts: PostMetadata[]): string[] {
  const errors: string[] = []
  const slugs = new Set<string>()
  const uids = new Set<string>()
  for (const post of posts) {
    for (const field of ['uid', 'slug', 'title', 'description'] as const) {
      if (typeof post[field] !== 'string' || !post[field].trim())
        errors.push(`${post.slug}: missing ${field}`)
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug))
      errors.push(`${post.slug}: invalid slug`)
    if (slugs.has(post.slug)) errors.push(`${post.slug}: duplicate slug`)
    if (uids.has(post.uid)) errors.push(`${post.slug}: duplicate uid`)
    slugs.add(post.slug)
    uids.add(post.uid)
    for (const field of ['date', 'dateLastModified'] as const) {
      if (!validDate(post[field])) errors.push(`${post.slug}: invalid ${field}`)
    }
    if (Date.parse(post.dateLastModified) < Date.parse(post.date))
      errors.push(`${post.slug}: update predates publication`)
  }
  return errors
}
