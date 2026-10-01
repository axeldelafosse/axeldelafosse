import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { useMDXComponent } from 'next-contentlayer2/hooks'

import type { PostMetadata, PostPageData } from '@/lib/post-data'
import {
  applyInlineTextEdits,
  type InlineMarkdownSpan
} from '@/lib/inline-markdown'
import { components } from './mdx-components'
import { InlineTextContext, LocalInlineText } from './local-inline-text'
import styles from '../styles/markdown.module.css'

type DocumentState = {
  source: string
  savedSource: string
  revision: string
}

type Preview = {
  code: string
  metadata: PostMetadata
  editableSpans?: InlineMarkdownSpan[]
}
const mdxGlobals = {}
const previewComponents = {
  ...components,
  LocalInlineText,
  // No hover-card popups while editing words inside a link.
  a: (props: React.ComponentProps<'a'>) => <a {...props} />
}
const buttonStyle =
  'rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-40 dark:border-gray-700 dark:hover:bg-gray-900'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const result = await response.json()
  if (!response.ok)
    throw new Error(result.error || 'Could not reach the local editor.')
  return result
}

const PreviewBody = memo(function PreviewBody({
  code,
  onRendered
}: {
  code: string
  onRendered: () => void
}) {
  const Content = useMDXComponent(code, mdxGlobals)
  useEffect(onRendered, [onRendered])
  return <Content components={previewComponents} />
})

export default function LocalPostEditor({
  post,
  onClose,
  onSaved
}: {
  post: PostPageData
  onClose: () => void
  onSaved: (post: PostPageData) => void
}) {
  const endpoint = `/api/local-posts/${encodeURIComponent(post.slug)}`
  const draftKey = `local-post-draft:${post.slug}`
  const [document, setDocument] = useState<DocumentState | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewSource, setPreviewSource] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [previewGeneration, setPreviewGeneration] = useState(0)
  const [renderedSource, setRenderedSource] = useState<string | null>(null)
  const [inlineActive, setInlineActive] = useState(false)
  const [inlineError, setInlineError] = useState('')
  const [saveQueued, setSaveQueued] = useState(false)
  const inlineActiveRef = useRef(false)
  const inlineEdits = useRef<Record<string, string>>({})
  const previewRequest = useRef<AbortController | null>(null)
  const [mobilePane, setMobilePane] = useState<'source' | 'preview'>('source')
  const savingRef = useRef(false)
  const mounted = useRef(true)
  const loadGeneration = useRef(0)
  const dirty =
    document !== null &&
    (document.source !== document.savedSource || !!inlineError)
  const source = document?.source
  const previewPending = source !== undefined && source !== previewSource
  const previewRendered = useCallback(
    () => setRenderedSource(previewSource),
    [previewSource]
  )
  const inlineSpans = useMemo(
    () =>
      new Map((preview?.editableSpans ?? []).map((span) => [span.id, span])),
    [preview]
  )
  const beginInlineEdit = useCallback(() => {
    inlineActiveRef.current = true
    previewRequest.current?.abort()
    setInlineActive(true)
  }, [])
  const finishInlineEdit = useCallback(() => {
    inlineActiveRef.current = false
    setInlineActive(false)
  }, [])
  const changeInlineText = useCallback(
    (id: string, text: string) => {
      if (previewSource === null || !preview?.editableSpans) return
      // Keep invalid attempts too, so editing another fragment cannot silently
      // clear the error and discard the first change.
      const edits = { ...inlineEdits.current, [id]: text }
      inlineEdits.current = edits
      try {
        const nextSource = applyInlineTextEdits(
          previewSource,
          preview.editableSpans,
          edits
        )
        setDocument((current) => current && { ...current, source: nextSource })
        setInlineError('')
        setNotice('')
      } catch (cause) {
        setInlineError(
          cause instanceof Error
            ? cause.message
            : 'Use the Markdown pane to make this change.'
        )
      }
    },
    [preview, previewSource]
  )
  const inlineEditor = useMemo(
    () => ({
      spans: inlineSpans,
      enabled:
        !loading &&
        !previewError &&
        (source === previewSource ||
          Object.keys(inlineEdits.current).length > 0),
      onStart: beginInlineEdit,
      onChange: changeInlineText,
      onFinish: finishInlineEdit
    }),
    [
      inlineSpans,
      loading,
      previewError,
      source,
      previewSource,
      beginInlineEdit,
      changeInlineText,
      finishInlineEdit
    ]
  )

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(
    async (restoreDraft: boolean, signal?: AbortSignal) => {
      const generation = ++loadGeneration.current
      setLoading(true)
      setError('')
      try {
        const saved = await request<{ source: string; revision: string }>(
          endpoint,
          { signal }
        )
        let next: DocumentState = { ...saved, savedSource: saved.source }
        let message = ''
        if (restoreDraft) {
          try {
            const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null')
            if (
              draft &&
              typeof draft.source === 'string' &&
              typeof draft.savedSource === 'string' &&
              typeof draft.revision === 'string' &&
              draft.source !== saved.source
            ) {
              next = draft
              message =
                draft.revision === saved.revision
                  ? 'Recovered your unsaved changes from this tab.'
                  : 'Recovered your draft. The file also changed on disk; copy your changes before reloading the file.'
            }
          } catch {
            /* Draft recovery is optional when browser storage is unavailable. */
          }
        }
        if (
          signal?.aborted ||
          !mounted.current ||
          generation !== loadGeneration.current
        )
          return
        setDocument(next)
        inlineEdits.current = {}
        setInlineError('')
        setNotice(message)
      } catch (cause) {
        if (
          !signal?.aborted &&
          mounted.current &&
          generation === loadGeneration.current
        )
          setError(
            cause instanceof Error ? cause.message : 'Could not load the file.'
          )
      } finally {
        if (
          !signal?.aborted &&
          mounted.current &&
          generation === loadGeneration.current
        )
          setLoading(false)
      }
    },
    [draftKey, endpoint]
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(true, controller.signal)
    return () => controller.abort()
  }, [load])

  // Persist only an unsaved draft, not an autosave to the actual Markdown file.
  // This also protects edits if Next refreshes the page after an external save.
  useEffect(() => {
    if (!document) return
    try {
      if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(document))
      else sessionStorage.removeItem(draftKey)
    } catch {
      /* Editing still works without browser storage. */
    }
  }, [document, dirty, draftKey])

  useEffect(() => {
    if (!dirty && !saving) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, saving])

  useEffect(() => {
    if (source === undefined || inlineActive || inlineError) return
    const controller = new AbortController()
    previewRequest.current = controller
    const timer = setTimeout(async () => {
      try {
        const next = await request<Preview>(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Local-Editor': '1'
          },
          body: JSON.stringify({ source }),
          signal: controller.signal
        })
        if (controller.signal.aborted || inlineActiveRef.current) return
        inlineEdits.current = {}
        setPreview(next)
        setPreviewGeneration((generation) => generation + 1)
        setRenderedSource(null)
        setPreviewError('')
        setPreviewSource(source)
      } catch (cause) {
        if (controller.signal.aborted) return
        setPreviewError(
          cause instanceof Error
            ? cause.message
            : 'Could not preview this Markdown.'
        )
        setPreviewSource(source)
      }
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [source, endpoint, inlineActive, inlineError])

  const save = useCallback(async () => {
    if (
      !document ||
      !dirty ||
      loading ||
      savingRef.current ||
      previewPending ||
      previewError ||
      inlineError ||
      inlineActive ||
      renderedSource !== document.source
    )
      return
    savingRef.current = true
    setSaving(true)
    setError('')
    setNotice('')
    const snapshot = document
    try {
      const result = await request<Preview & { revision: string }>(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Local-Editor': '1' },
        body: JSON.stringify({
          source: snapshot.source,
          revision: snapshot.revision
        })
      })
      if (!mounted.current) return
      setDocument(
        (current) =>
          current && {
            ...current,
            savedSource: snapshot.source,
            revision: result.revision
          }
      )
      onSaved({ ...result.metadata, body: { code: result.code } })
      setNotice('Saved to file. Nothing has been published.')
    } catch (cause) {
      if (!mounted.current) return
      setError(
        cause instanceof Error ? cause.message : 'Could not save the file.'
      )
    } finally {
      savingRef.current = false
      if (mounted.current) setSaving(false)
    }
  }, [
    document,
    dirty,
    loading,
    previewPending,
    previewError,
    inlineError,
    inlineActive,
    renderedSource,
    endpoint,
    onSaved
  ])

  const requestSave = useCallback(() => {
    if (!document || !dirty || loading || savingRef.current) return
    setSaveQueued(true)
    const active = window.document.activeElement
    if (active instanceof HTMLElement && active.hasAttribute('data-local-edit'))
      active.blur()
  }, [document, dirty, loading])

  useEffect(() => {
    if (!saveQueued || inlineActive) return
    if (inlineError || (previewError && !previewPending)) {
      setSaveQueued(false)
      return
    }
    if (previewPending) return
    if (renderedSource !== source) return
    setSaveQueued(false)
    void save()
  }, [
    saveQueued,
    inlineActive,
    previewPending,
    inlineError,
    previewError,
    renderedSource,
    source,
    save
  ])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        requestSave()
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [requestSave])

  function close() {
    if (savingRef.current) return
    if (
      dirty &&
      !window.confirm('Discard unsaved changes and close the editor?')
    )
      return
    try {
      sessionStorage.removeItem(draftKey)
    } catch {
      /* Optional storage. */
    }
    onClose()
  }

  return (
    <Dialog open onClose={close} className="relative z-50">
      <DialogPanel
        data-aurora-occluder="true"
        className="fixed inset-0 flex h-dvh flex-col bg-white text-black dark:bg-black dark:text-white"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3 dark:border-gray-800">
          <div className="min-w-0">
            <DialogTitle className="m-0 text-base font-bold">
              Edit post{' '}
              <span className="font-normal text-gray-500">· local only</span>
            </DialogTitle>
            <p className="m-0 max-w-[60vw] truncate text-xs text-gray-500">
              blog/{post.slug}.mdx
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              role="status"
              className="hidden text-xs text-gray-500 sm:inline"
            >
              {saving
                ? 'Saving…'
                : dirty
                  ? 'Unsaved changes'
                  : document
                    ? 'Saved'
                    : 'Loading…'}
            </span>
            <button
              type="button"
              className={buttonStyle}
              disabled={
                !document ||
                !dirty ||
                loading ||
                saving ||
                !!inlineError ||
                (!!previewError && !previewPending)
              }
              onClick={requestSave}
            >
              Save{' '}
              <span className="hidden text-gray-500 sm:inline">⌘/Ctrl S</span>
            </button>
            <button
              type="button"
              className={buttonStyle}
              disabled={saving}
              onClick={close}
            >
              Close
            </button>
          </div>
        </header>
        {(error || notice) && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-5 py-2 text-sm dark:border-gray-800">
            <p className="m-0" role={error ? 'alert' : 'status'}>
              {error || notice}
            </p>
            {error && (
              <button
                type="button"
                className={buttonStyle}
                disabled={saving || loading}
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm(
                      'Reload from disk and discard your unsaved changes?'
                    )
                  )
                    void load(false)
                }}
              >
                Reload file
              </button>
            )}
          </div>
        )}
        <div className="flex shrink-0 gap-2 border-b border-gray-200 px-5 py-2 md:hidden dark:border-gray-800">
          <button
            className={buttonStyle}
            aria-pressed={mobilePane === 'source'}
            onClick={() => setMobilePane('source')}
          >
            Markdown
          </button>
          <button
            className={buttonStyle}
            aria-pressed={mobilePane === 'preview'}
            onClick={() => setMobilePane('preview')}
          >
            Preview
          </button>
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-2">
          <section
            className={`${mobilePane === 'source' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col md:flex md:border-r md:border-gray-200 dark:md:border-gray-800`}
          >
            <label
              htmlFor="local-markdown-source"
              className="px-5 py-3 text-xs text-gray-500"
            >
              Markdown + frontmatter
            </label>
            <textarea
              id="local-markdown-source"
              aria-label="Markdown source"
              aria-describedby="local-editor-help"
              autoFocus
              spellCheck={false}
              disabled={!document || loading}
              value={source ?? ''}
              onChange={(event) => {
                const value = event.target.value
                inlineEdits.current = {}
                setInlineError('')
                setDocument(
                  (current) => current && { ...current, source: value }
                )
                setNotice('')
              }}
              className="min-h-0 w-full flex-1 resize-none bg-transparent px-5 pb-5 font-mono text-sm leading-7 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-purple-400"
            />
            <p
              id="local-editor-help"
              className="m-0 shrink-0 border-t border-gray-200 px-5 py-2 text-xs text-gray-500 dark:border-gray-800"
            >
              Save writes this file only. Dates change only if you edit them.
            </p>
          </section>
          <section
            aria-label="Post preview"
            className={`${mobilePane === 'preview' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col md:flex`}
          >
            <div className="flex items-center justify-between px-5 py-3 text-xs text-gray-500">
              <span>Preview · click text to edit</span>
              <span role="status">
                {inlineActive
                  ? 'Editing text…'
                  : previewPending
                    ? 'Updating…'
                    : previewError || inlineError
                      ? 'Needs attention'
                      : 'Up to date'}
              </span>
            </div>
            {(previewError || inlineError) && (
              <p
                role="alert"
                className="mx-5 mt-0 whitespace-pre-wrap text-sm text-red-700 dark:text-red-400"
              >
                {inlineError || previewError}
              </p>
            )}
            <div
              className="min-h-0 flex-1 overflow-auto px-5"
              onClickCapture={(event) => {
                // Keep preview links from navigating away from a draft.
                if ((event.target as Element).closest('a'))
                  event.preventDefault()
              }}
            >
              {preview && (
                <ErrorBoundary
                  key={previewGeneration}
                  onError={(cause) =>
                    setPreviewError(
                      cause instanceof Error
                        ? cause.message
                        : 'This preview could not render.'
                    )
                  }
                  fallback={
                    <p role="alert">
                      This preview could not render. Fix the Markdown to try
                      again.
                    </p>
                  }
                >
                  <InlineTextContext.Provider value={inlineEditor}>
                    <article
                      className={`${styles.prose} mx-auto w-full max-w-[580px]`}
                    >
                      <PreviewBody
                        code={preview.code}
                        onRendered={previewRendered}
                      />
                    </article>
                  </InlineTextContext.Provider>
                </ErrorBoundary>
              )}
            </div>
            <p className="m-0 shrink-0 border-t border-gray-200 px-5 py-2 text-xs text-gray-500 dark:border-gray-800">
              Enter for a new line. Escape to finish editing. Use Markdown for
              new blocks, formatting, and embeds.
            </p>
          </section>
        </div>
      </DialogPanel>
    </Dialog>
  )
}
