import React, { ReactNode } from 'react';
import Link from 'next/link';

interface LinkProps {
  href: string;
  children: ReactNode;
}

function CustomLink({ href, children }: LinkProps) {
  if (href.includes('axeldelafosse.com') || href[0] === '/') {
    return (
      <Link href={href} passHref={true}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default CustomLink;
