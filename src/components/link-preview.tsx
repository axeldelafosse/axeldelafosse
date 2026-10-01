// Slightly modified version of https://github.com/delbaoliveira/website/blob/main/ui/LinkPreview.tsx

import type { ReactNode } from 'react'
import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import Image from 'next/image'
import { encode } from 'qss'

import { weservLoader } from '@/lib/weserv-loader'
import styles from '../styles/link-preview.module.css'

function PreviewCard({ url }: { url: string }) {
  const width = 200
  const height = 125

  // Simplifies things by encoding our microlink params into a query string.
  const params = encode({
    url: url[0] === '/' ? `https://axeldelafosse.com${url}` : url,
    screenshot: true,
    meta: false,
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': true,

    // To capture useful content, the screenshot viewport needs to be bigger
    // than our images but maintain the same ratio
    'viewport.width': width * 3,
    'viewport.height': height * 3
  })

  const src = `https://api.microlink.io/?${params}`

  return (
    <div className={`${styles.card} shadow-xl rounded-xl`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-1 bg-white border border-transparent shadow rounded-xl hover:border-purple-500"
        style={{ fontSize: 0 }}
      >
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          loading="eager"
          className="rounded-lg"
          loader={weservLoader}
        />
      </a>
    </div>
  )
}

export const LinkPreview = ({
  children,
  url,
  asChild = false
}: {
  children: ReactNode
  url: string
  asChild?: boolean
}) => {
  return (
    <HoverCardPrimitive.Root openDelay={50}>
      <HoverCardPrimitive.Trigger href={url} asChild={asChild}>
        {children}
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Content side="top" align="center" sideOffset={10}>
        {/* Radix mounts the card only after hover or keyboard focus. */}
        <PreviewCard url={url} />
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  )
}
