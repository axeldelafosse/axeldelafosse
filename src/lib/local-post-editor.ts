import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, open, realpath, rename, unlink } from 'node:fs/promises'
import path from 'node:path'
import type { PostMetadata } from './post-data'
import {
  createInlineMarkdownPlugin,
  type InlineMarkdownSpan
} from './inline-markdown'

export const MAX_LOCAL_POST_BYTES = 1024 * 1024

export class LocalPostEditorError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'LocalPostEditorError'
  }
}

type Header = string | string[] | undefined
type LocalRequest = {
  method?: string
  headers: Record<string, Header>
  socket: { remoteAddress?: string; encrypted?: boolean }
}

function loopbackAddress(address: string) {
  if (address === '::1') return true
  const ipv4 = address.replace(/^::ffff:/i, '').split('.')
  return (
    ipv4.length === 4 &&
    ipv4[0] === '127' &&
    ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  )
}

// Do not trust forwarded headers: this endpoint is for a direct local browser,
// not a public preview, reverse proxy, or deployed application.
export function assertLocalEditorRequest(
  request: LocalRequest,
  environment: string | undefined = process.env.NODE_ENV
) {
  if (environment !== 'development') {
    throw new LocalPostEditorError(404, 'Not found')
  }
  const host = request.headers.host
  const scheme = request.socket.encrypted ? 'https:' : 'http:'
  let url: URL
  try {
    if (typeof host !== 'string') throw new Error('Missing host')
    url = new URL(`${scheme}//${host}`)
    const hostname = url.hostname
    if (
      url.host !== host.toLowerCase() ||
      url.username ||
      url.password ||
      !['localhost', '127.0.0.1', '[::1]'].includes(hostname) ||
      !loopbackAddress(request.socket.remoteAddress ?? '')
    ) {
      throw new Error('Not loopback')
    }
  } catch {
    throw new LocalPostEditorError(
      403,
      'The editor is only available on localhost.'
    )
  }

  const origin = request.headers.origin
  const fetchSite = request.headers['sec-fetch-site']
  if (
    (origin !== undefined && origin !== url.origin) ||
    (fetchSite !== undefined &&
      fetchSite !== 'same-origin' &&
      fetchSite !== 'none')
  ) {
    throw new LocalPostEditorError(
      403,
      'Use the editor from the same local page.'
    )
  }
  if (!['GET', 'PUT', 'POST'].includes(request.method ?? '')) {
    throw new LocalPostEditorError(405, 'Method not allowed')
  }
  if (request.method !== 'GET') {
    if (origin !== url.origin || request.headers['x-local-editor'] !== '1') {
      throw new LocalPostEditorError(
        403,
        'Use the editor from the same local page.'
      )
    }
    const contentType = request.headers['content-type']
    if (
      typeof contentType !== 'string' ||
      !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(contentType)
    ) {
      throw new LocalPostEditorError(
        415,
        'The editor requires application/json.'
      )
    }
  }
}

export function assertLocalPostSlug(slug: unknown): asserts slug is string {
  if (
    typeof slug !== 'string' ||
    slug.length > 180 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    throw new LocalPostEditorError(400, 'Invalid post slug.')
  }
}

function assertSource(source: unknown): asserts source is string {
  if (typeof source !== 'string' || source.includes('\0')) {
    throw new LocalPostEditorError(400, 'Provide the Markdown source as text.')
  }
  if (Buffer.byteLength(source, 'utf8') > MAX_LOCAL_POST_BYTES) {
    throw new LocalPostEditorError(413, 'Posts must be smaller than 1 MiB.')
  }
}

export function localPostRevision(source: string) {
  return createHash('sha256').update(source, 'utf8').digest('hex')
}

type EditorOptions = { blogDirectory?: string }

async function resolvePost(slug: unknown, options: EditorOptions) {
  assertLocalPostSlug(slug)
  const directory = path.resolve(
    options.blogDirectory ?? path.join(process.cwd(), 'blog')
  )
  try {
    const directoryStat = await lstat(directory)
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) {
      throw new LocalPostEditorError(404, 'Post not found.')
    }
    return path.join(await realpath(directory), `${slug}.mdx`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new LocalPostEditorError(404, 'Post not found.')
    }
    throw error
  }
}

async function readPostFile(filename: string) {
  let handle
  try {
    const entry = await lstat(filename)
    if (!entry.isFile() || entry.isSymbolicLink()) {
      throw new LocalPostEditorError(404, 'Post not found.')
    }
    handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW)
    const stat = await handle.stat()
    if (!stat.isFile()) throw new LocalPostEditorError(404, 'Post not found.')
    if (stat.size > MAX_LOCAL_POST_BYTES) {
      throw new LocalPostEditorError(413, 'Posts must be smaller than 1 MiB.')
    }
    // Bound the read even if another process grows the file after stat().
    const buffer = Buffer.alloc(MAX_LOCAL_POST_BYTES + 1)
    let length = 0
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(
        buffer,
        length,
        buffer.length - length,
        length
      )
      if (bytesRead === 0) break
      length += bytesRead
    }
    if (length > MAX_LOCAL_POST_BYTES) {
      throw new LocalPostEditorError(413, 'Posts must be smaller than 1 MiB.')
    }
    let source: string
    try {
      source = new TextDecoder('utf-8', {
        fatal: true,
        ignoreBOM: true
      }).decode(buffer.subarray(0, length))
    } catch {
      throw new LocalPostEditorError(422, 'The post must use UTF-8 text.')
    }
    return { source, revision: localPostRevision(source), stat }
  } catch (error) {
    if (
      ['ENOENT', 'ELOOP', 'ENOTDIR'].includes(
        (error as NodeJS.ErrnoException).code ?? ''
      )
    ) {
      throw new LocalPostEditorError(404, 'Post not found.')
    }
    throw error
  } finally {
    await handle?.close()
  }
}

export async function readLocalPost(
  slug: unknown,
  options: EditorOptions = {}
) {
  const { source, revision } = await readPostFile(
    await resolvePost(slug, options)
  )
  return { source, revision }
}

function invalid(message: string): never {
  throw new LocalPostEditorError(422, message)
}

function dateField(value: unknown, name: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    return invalid(`Frontmatter ${name} must be a valid ISO date (YYYY-MM-DD).`)
  }
  const day = value.slice(0, 10)
  const midnight = new Date(`${day}T00:00:00.000Z`)
  const date = new Date(value)
  if (
    !Number.isFinite(date.getTime()) ||
    !Number.isFinite(midnight.getTime()) ||
    midnight.toISOString().slice(0, 10) !== day
  ) {
    return invalid(`Frontmatter ${name} must be a valid ISO date (YYYY-MM-DD).`)
  }
  return date.toISOString()
}

function jsonValue(value: unknown, depth = 0): boolean {
  if (depth > 32) return false
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value))
    return value.every((child) => jsonValue(child, depth + 1))
  if (typeof value === 'object') {
    return Object.values(value).every((child) => jsonValue(child, depth + 1))
  }
  return false
}

type MarkdownNode = {
  type: string
  name?: string | null
  attributes?: Array<{ type: string; name?: string; value?: unknown }>
  children?: MarkdownNode[]
}

function staticMarkdownOnly() {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (
        ['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'].includes(
          node.type
        )
      ) {
        invalid(
          'JavaScript expressions, imports, and exports are not supported in the local editor. Use Markdown or static MDX components.'
        )
      }
      if (
        node.type === 'mdxJsxFlowElement' ||
        node.type === 'mdxJsxTextElement'
      ) {
        const name = node.name ?? ''
        if (
          (name &&
            !/^[a-z][a-z0-9-]*$/.test(name) &&
            !['Tweet', 'LinkPreview'].includes(name)) ||
          ['script', 'iframe', 'object', 'embed'].includes(name)
        ) {
          invalid(`The local editor cannot render the ${name} component.`)
        }
        for (const attribute of node.attributes ?? []) {
          if (
            attribute.type !== 'mdxJsxAttribute' ||
            (attribute.value !== null && typeof attribute.value !== 'string') ||
            /^on/i.test(attribute.name ?? '') ||
            ['dangerouslySetInnerHTML', 'style', 'ref'].includes(
              attribute.name ?? ''
            )
          ) {
            invalid(
              'MDX attributes must be static text. JavaScript and event handlers are not supported in the local editor.'
            )
          }
        }
        const attributeValue = (attribute: string) =>
          node.attributes?.find((entry) => entry.name === attribute)?.value
        if (
          name === 'Tweet' &&
          (typeof attributeValue('id') !== 'string' ||
            !/^\d+$/.test(attributeValue('id') as string))
        ) {
          invalid(
            'Tweet components need a numeric id written as static text, for example <Tweet id="123" />.'
          )
        }
        if (
          name === 'LinkPreview' &&
          (typeof attributeValue('url') !== 'string' ||
            !(attributeValue('url') as string).trim())
        ) {
          invalid('LinkPreview components need a non-empty url attribute.')
        }
        if (name === 'LinkPreview' && attributeValue('asChild') !== undefined) {
          const children =
            node.children?.filter((child) => child.type !== 'text') ?? []
          if (
            attributeValue('asChild') !== null ||
            children.length !== 1 ||
            !['mdxJsxFlowElement', 'mdxJsxTextElement'].includes(
              children[0].type
            )
          ) {
            invalid(
              'LinkPreview asChild needs exactly one static child element, such as an <a> link.'
            )
          }
        }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

export type LocalPostPreview = {
  code: string
  metadata: PostMetadata
  editableSpans?: InlineMarkdownSpan[]
}

async function compilePost(
  slug: string,
  source: unknown,
  editable = false
): Promise<LocalPostPreview> {
  assertSource(source)
  const frontmatter = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(
    source
  )
  if (!frontmatter)
    invalid('Start the post with YAML frontmatter between --- lines.')

  // No gray-matter engines, import bundling, or evaluation of authored JS. These
  // tools are loaded only after the request has passed the local-only guard.
  const { parseDocument } = await import('yaml')
  let fields: unknown
  try {
    const document = parseDocument(frontmatter[1], {
      schema: 'core',
      resolveKnownTags: false,
      uniqueKeys: true
    })
    if (document.errors.length || document.warnings.length) {
      invalid(
        'Frontmatter must be valid YAML with unique keys and no custom tags.'
      )
    }
    fields = document.toJS({ maxAliasCount: 0 })
  } catch (error) {
    if (error instanceof LocalPostEditorError) throw error
    invalid('Frontmatter must be valid YAML without aliases or custom tags.')
  }
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    invalid('Frontmatter must contain the post metadata fields.')
  }
  const data = fields as Record<string, unknown>
  const allowed = [
    'uid',
    'title',
    'description',
    'date',
    'dateLastModified',
    'tags'
  ]
  if (Object.keys(data).some((key) => !allowed.includes(key))) {
    invalid(
      'Unknown frontmatter field. Supported fields are uid, title, description, date, dateLastModified, and tags.'
    )
  }
  for (const field of ['uid', 'title', 'description'] as const) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      invalid(`Frontmatter ${field} must be non-empty text.`)
    }
  }
  if (data.uid !== slug)
    invalid(
      'Keep the uid equal to the existing post slug; renaming posts is not supported.'
    )
  if ('tags' in data && !jsonValue(data.tags))
    invalid('Frontmatter tags must be valid JSON-compatible data.')
  const metadata: PostMetadata = {
    uid: data.uid as string,
    slug,
    title: data.title as string,
    description: data.description as string,
    date: dateField(data.date, 'date'),
    dateLastModified: dateField(data.dateLastModified, 'dateLastModified')
  }
  const [
    { compile },
    { default: remarkGfm },
    { default: rehypeSlug },
    { default: rehypeCodeTitles },
    { default: rehypeAutolinkHeadings }
  ] = await Promise.all([
    import('@mdx-js/mdx'),
    import('remark-gfm'),
    import('rehype-slug'),
    import('rehype-code-titles'),
    import('rehype-autolink-headings')
  ])
  try {
    const editableSpans: InlineMarkdownSpan[] = []
    const compiled = await compile(source.slice(frontmatter[0].length), {
      outputFormat: 'function-body',
      development: false,
      remarkPlugins: [
        staticMarkdownOnly,
        remarkGfm,
        ...(editable
          ? [
              createInlineMarkdownPlugin(
                source,
                frontmatter[0].length,
                editableSpans
              )
            ]
          : [])
      ],
      rehypePlugins: [
        rehypeSlug,
        rehypeCodeTitles,
        [
          rehypeAutolinkHeadings,
          { behavior: 'wrap', properties: { className: ['anchor'] } }
        ]
      ]
    })
    // next-contentlayer's hook supplies _jsx_runtime and expects { default }.
    return {
      code: `return (function () {\n${String(compiled)}\n}).call(null, _jsx_runtime);`,
      metadata,
      ...(editable ? { editableSpans } : {})
    }
  } catch (error) {
    if (error instanceof LocalPostEditorError) throw error
    invalid(
      `Invalid Markdown/MDX: ${error instanceof Error ? error.message : 'check the post syntax.'}`
    )
  }
}

export async function previewLocalPost(
  slug: unknown,
  source: unknown,
  options: EditorOptions = {}
) {
  assertLocalPostSlug(slug)
  await readPostFile(await resolvePost(slug, options))
  return compilePost(slug, source, true)
}

// Serialize overlapping saves (including their revision checks) in this server.
// Re-check disk after compilation as files can also be edited outside the UI.
const saveQueues = new Map<string, Promise<void>>()

export async function saveLocalPost(
  slug: unknown,
  source: unknown,
  revision: unknown,
  options: EditorOptions = {}
) {
  assertLocalPostSlug(slug)
  assertSource(source)
  if (typeof revision !== 'string' || !/^[a-f0-9]{64}$/.test(revision)) {
    throw new LocalPostEditorError(
      400,
      'Provide the revision from the opened post.'
    )
  }
  const filename = await resolvePost(slug, options)
  const previous = saveQueues.get(filename) ?? Promise.resolve()
  const operation = previous.then(async () => {
    const original = await readPostFile(filename)
    if (original.revision !== revision) {
      throw new LocalPostEditorError(
        409,
        'This file changed on disk. Reload it before saving to avoid overwriting those changes.'
      )
    }
    const preview = await compilePost(slug, source)
    const temporary = path.join(
      path.dirname(filename),
      `.local-editor-${slug}-${randomUUID()}.tmp`
    )
    let temporaryCreated = false
    try {
      const handle = await open(temporary, 'wx', original.stat.mode & 0o777)
      temporaryCreated = true
      try {
        // open() applies umask, so restore the existing file's permission bits.
        await handle.chmod(original.stat.mode & 0o777)
        await handle.writeFile(source, 'utf8')
        await handle.sync()
      } finally {
        await handle.close()
      }
      const latest = await readPostFile(filename)
      if (
        latest.revision !== revision ||
        latest.stat.ino !== original.stat.ino ||
        latest.stat.dev !== original.stat.dev
      ) {
        throw new LocalPostEditorError(
          409,
          'This file changed on disk. Reload it before saving to avoid overwriting those changes.'
        )
      }
      await rename(temporary, filename)
      temporaryCreated = false
      return { revision: localPostRevision(source), ...preview }
    } finally {
      if (temporaryCreated) await unlink(temporary).catch(() => {})
    }
  })
  const settled = operation.then(
    () => {},
    () => {}
  )
  saveQueues.set(filename, settled)
  try {
    return await operation
  } finally {
    if (saveQueues.get(filename) === settled) saveQueues.delete(filename)
  }
}
