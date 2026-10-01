import Link from 'next/link'
import { SITE_ID } from '@/lib/site'

function Header() {
  return (
    <div className="h-16 w-screen flex items-center justify-center z-10 text-white">
      <Link href="/blog" className="text-white no-underline">
        blog
      </Link>
      <span className="mx-2">•</span>
      <Link href="/talks" passHref={true} className="text-white no-underline">
        talks
      </Link>
      <span className="mx-2">•</span>
      <a
        className="text-white no-underline"
        href="https://cal.com/axel"
        target="_blank"
        rel="noopener noreferrer"
      >
        cal
      </a>
      <span className="mx-2">•</span>
      <a
        className="text-white no-underline"
        href={`https://github.com/${SITE_ID}/${SITE_ID}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        source
      </a>
    </div>
  )
}

export default Header
