import Link from 'next/link';

function Header() {
  return (
    <div className="h-16 w-screen flex items-center justify-end z-10">
      <Link href="/blog" passHref={true}>
        <a className="text-white no-underline mr-6">blog</a>
      </Link>
      <a
        className="text-white no-underline mr-6"
        href="https://poolmessenger.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        pool
      </a>
      <a
        className="text-white no-underline mr-6"
        href="https://cal.com/axel"
        target="_blank"
        rel="noopener noreferrer"
      >
        cal
      </a>
      <a
        className="text-white no-underline mr-6"
        href={`https://github.com/${process.env.NEXT_PUBLIC_ID}/${process.env.NEXT_PUBLIC_ID}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        source
      </a>
    </div>
  );
}

export default Header;
