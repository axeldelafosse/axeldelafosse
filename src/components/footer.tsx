import { SITE_ID } from '@/lib/site'

function Footer({ color = 'white' }: { color?: string }) {
  return (
    <div className="z-10">
      <footer
        className={`text-${color} dark:text-white h-16 flex justify-center items-center`}
      >
        <a
          href={`https://github.com/${SITE_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white no-underline`}
        >
          github
        </a>
        <span className="mx-2">•</span>
        <a
          href={`https://x.com/${SITE_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white no-underline`}
        >
          x
        </a>
      </footer>
    </div>
  )
}

export default Footer
