import dynamic from 'next/dynamic'

const Substack = dynamic(() => import('./substack'))

function Footer({
  color = 'white',
  shouldShowSubscribeEmbed = false
}: {
  color?: string
  shouldShowSubscribeEmbed?: boolean
}) {
  return (
    <div className="z-10">
      {shouldShowSubscribeEmbed && <Substack />}

      <footer
        className={`text-${color} dark:text-white h-16 flex justify-center items-center`}
      >
        <a
          href={`https://github.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white no-underline`}
        >
          github
        </a>
        <span className="mx-2">•</span>
        <a
          href={`https://soundcloud.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white no-underline`}
        >
          soundcloud
        </a>
        <span className="mx-2">•</span>
        <a
          href={`https://twitter.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white no-underline`}
        >
          twitter
        </a>
      </footer>
    </div>
  )
}

export default Footer
