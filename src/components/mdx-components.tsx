import dynamic from 'next/dynamic'
import Image from 'next/image'

import CustomLink from './custom-link'
import MarkdownTable from './markdown-table'
import { LinkPreview } from './link-preview'
import { weservLoader } from '@/lib/weserv-loader'

// These are only loaded for posts that actually render code or an embedded tweet.
// Keep SSR enabled so code remains readable before hydration and without JS.
const CodeBlock = dynamic(() => import('./code-block'))
const Tweet = dynamic(() =>
  import('./static-tweet/tweet').then((module) => module.Tweet)
)

export const components = {
  a: CustomLink,
  pre: CodeBlock,
  table: MarkdownTable,
  img: ({
    src,
    alt = '',
    title
  }: {
    src: string
    alt?: string
    title?: string
  }) => (
    <Image
      src={src}
      alt={alt}
      title={title}
      width={500}
      height={500}
      layout="responsive"
      objectFit="contain"
      loader={weservLoader}
      quality={100}
    />
  ),
  Tweet: ({ id }: { id: string }) => (
    <div className="flex justify-center">
      <Tweet id={id} />
    </div>
  ),
  LinkPreview
}
