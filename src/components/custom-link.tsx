import React, { ReactNode } from 'react';
import Link from 'next/link';

import { LinkPreview } from './link-preview';

interface LinkProps {
  href: string;
  children: ReactNode;
}

function CustomLink({ href, children }: LinkProps) {
  if (href.includes('axeldelafosse.com') || href[0] === '/') {
    return (
      <LinkPreview url={href}>
        <Link href={href} passHref={true}>
          {children}
        </Link>
      </LinkPreview>
    );
  }

  return (
    <LinkPreview url={href}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </LinkPreview>
  );
}

export default CustomLink;
