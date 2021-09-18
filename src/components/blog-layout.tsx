import React, { ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { MDXProvider } from '@mdx-js/react';
import { Tweet } from 'react-static-tweets';

import PostHead from '@/components/post-head';
import CustomLink from '@/components/custom-link';
import CodeBlock from '@/components/code-block';
import Footer from '@/components/footer';
import styles from '@/components/wrapper.module.scss';
import { LinkPreview } from '@/components/link-preview';
import { weservLoader } from '@/lib/weserv-loader';

function getGithubUrl(pathname: string) {
  const postUid = pathname.replace('/blog/', '');
  return `https://github.com/${process.env.NEXT_PUBLIC_ID}/${process.env.NEXT_PUBLIC_ID}/tree/master/src/pages/blog/${postUid}.mdx`;
}

function getBackButtonProps(
  isBlogPost: boolean,
  isStartupNotebookPost: boolean
) {
  let linkUrl = '/';
  let linkText = 'home';

  if (isBlogPost) {
    linkUrl = '/blog';
    linkText = 'blog';
  }

  if (isStartupNotebookPost) {
    linkUrl = '/blog/startup-notebook';
    linkText = 'back';
  }

  return { linkUrl, linkText };
}

const components = {
  a: CustomLink,
  PostHead: PostHead,
  code: CodeBlock,
  img: ({ src }: { src: string }) => (
    <Image
      src={src}
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
};

interface BlogLayoutProps {
  children: ReactNode;
}

function BlogLayout({ children }: BlogLayoutProps) {
  const router = useRouter();
  const isBlogPost = router.pathname.includes('blog/');
  const isStartupNotebookPost = router.pathname.includes('startup-notebook/');
  const { linkUrl, linkText } = getBackButtonProps(
    isBlogPost,
    isStartupNotebookPost
  );

  return (
    <div className={styles.wrapper}>
      <div className="flex flex-col">
        <div className="h-16 w-100 flex justify-between items-center">
          <Link href={linkUrl} passHref={true}>
            <div className="text-black dark:text-white w-16 flex items-center cursor-w-resize">
              <span className="text-2xl pr-2">☜</span> {linkText}
            </div>
          </Link>
          <Link href="/" passHref={true}>
            <svg
              className="fill-current text-black dark:text-white w-5 h-5 cursor-pointer"
              viewBox="0 0 80 80"
            >
              <polygon points="63.33 46.67 40 0 16.67 46.67 63.33 46.67" />
              <polygon points="13.33 53.33 0 80 80 80 66.67 53.33 13.33 53.33" />
            </svg>
          </Link>
          {isBlogPost ? (
            <a
              className="no-underline"
              href={getGithubUrl(router.pathname)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="text-black dark:text-white w-16 flex items-center cursor-alias">
                edit <div className="text-2xl pl-2">✍︎</div>
              </div>
            </a>
          ) : (
            <div className="w-16" />
          )}
        </div>
        {isBlogPost ? (
          <MDXProvider components={components}>
            <article>{children}</article>
          </MDXProvider>
        ) : (
          <>{children}</>
        )}
      </div>
      <Footer shouldShowSubscribeEmbed={isBlogPost} />
    </div>
  );
}

export default BlogLayout;
