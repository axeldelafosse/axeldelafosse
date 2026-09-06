import type { ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'

import { LinkPreview } from './link-preview'

type LinkProps = ComponentPropsWithoutRef<'a'>

function CustomLink({ href, children, ...props }: LinkProps) {
  // Heading and footnote links should jump within the page, not open a preview.
  if (!href || href.startsWith('#')) {
    return (
      <a {...props} href={href}>
        {children}
      </a>
    )
  }

  let url: URL
  try {
    url = new URL(href, 'https://axeldelafosse.com')
  } catch {
    return (
      <a {...props} href={href}>
        {children}
      </a>
    )
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return (
      <a {...props} href={href}>
        {children}
      </a>
    )
  }

  if (
    url.hostname === 'axeldelafosse.com' ||
    url.hostname === 'www.axeldelafosse.com'
  ) {
    return (
      <LinkPreview url={href} asChild>
        <Link {...props} href={href}>
          {children}
        </Link>
      </LinkPreview>
    )
  }

  return (
    <LinkPreview url={href} asChild>
      <a
        {...props}
        href={href}
        target={props.target ?? '_blank'}
        rel={[props.rel, 'noopener noreferrer'].filter(Boolean).join(' ')}
      >
        {children}
      </a>
    </LinkPreview>
  )
}

export default CustomLink
