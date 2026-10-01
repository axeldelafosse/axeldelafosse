import type { NextApiRequest, NextApiResponse } from 'next'
import {
  assertLocalEditorRequest,
  assertLocalPostSlug,
  LocalPostEditorError,
  MAX_LOCAL_POST_BYTES
} from '@/lib/local-post-editor'

// Inspect host, socket and origin before reading any body or post source.
export const config = { api: { bodyParser: false } }

async function readBody(request: NextApiRequest) {
  const declaredLength = request.headers['content-length']
  if (
    typeof declaredLength === 'string' &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > MAX_LOCAL_POST_BYTES
  ) {
    throw new LocalPostEditorError(
      413,
      'Editor requests must be smaller than 1 MiB.'
    )
  }
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    length += buffer.length
    if (length > MAX_LOCAL_POST_BYTES) {
      throw new LocalPostEditorError(
        413,
        'Editor requests must be smaller than 1 MiB.'
      )
    }
    chunks.push(buffer)
  }
  try {
    const body: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
    )
    if (!body || typeof body !== 'object' || Array.isArray(body))
      throw new Error('Invalid body')
    return body as Record<string, unknown>
  } catch {
    throw new LocalPostEditorError(
      400,
      'Provide a JSON object with the Markdown source.'
    )
  }
}

export default async function localPostEditor(
  request: NextApiRequest,
  response: NextApiResponse
) {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Vary', 'Origin')
  try {
    assertLocalEditorRequest(request)
    const slug = request.query.slug
    assertLocalPostSlug(slug)
    const { readLocalPost, previewLocalPost, saveLocalPost } =
      await import('@/lib/local-post-editor')
    if (request.method === 'GET') {
      response.status(200).json(await readLocalPost(slug))
      return
    }
    const body = await readBody(request)
    const result =
      request.method === 'PUT'
        ? await saveLocalPost(slug, body.source, body.revision)
        : await previewLocalPost(slug, body.source)
    response.status(200).json(result)
  } catch (error) {
    if (error instanceof LocalPostEditorError) {
      if (error.status === 405) response.setHeader('Allow', 'GET, POST, PUT')
      response.status(error.status).json({ error: error.message })
    } else {
      response.status(500).json({
        error:
          'The local post could not be read or saved. Check the development server and file permissions.'
      })
    }
  }
}
