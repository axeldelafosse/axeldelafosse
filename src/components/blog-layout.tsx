import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { MDXProvider } from '@mdx-js/react';
// import { Tweet } from 'react-static-tweets';

import PostHead from './post-head';
import CustomLink from './custom-link';
import CodeBlock from './code-block';
import Footer from './footer';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-x: hidden;
  word-break: break-word;

  height: 100%;
  min-height: 100vh;
  margin: auto;

  @media (min-width: 1024px) {
    width: 600px;
    max-width: 600px;

    border-left: 1px solid #f5f5f9;
    border-right: 1px solid #f5f5f9;
  }

  padding-left: 18px;
  padding-right: 18px;

  h2,
  h3,
  p {
    text-align: justify;
  }
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BackButton = styled.div`
  width: 60px;
  display: flex;
  align-items: center;
  font-size: 14px;
  cursor: w-resize;
`;

const PointingIndex = styled.span`
  font-size: 20px;
  padding-right: 5px;
`;

const GithubLink = styled.a`
  color: black;
  text-decoration: none;
`;

const RightButton = styled.div`
  width: 60px;
  display: flex;
  align-items: center;
  font-size: 14px;
  cursor: alias;
`;

const WritingHand = styled.span`
  font-size: 20px;
  padding-left: 5px;
`;

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
      height="auto"
      layout="responsive"
      objectFit="contain"
    />
  )
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
    <Wrapper>
      <Box>
        <Header>
          <Link href={linkUrl} passHref={true}>
            <BackButton className="text-black dark:text-white">
              <PointingIndex>☜</PointingIndex> {linkText}
            </BackButton>
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
            <GithubLink
              href={getGithubUrl(router.pathname)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <RightButton className="text-black dark:text-white">
                edit <WritingHand>✍︎</WritingHand>
              </RightButton>
            </GithubLink>
          ) : (
            <RightButton />
          )}
        </Header>
        {isBlogPost ? (
          <MDXProvider components={components}>
            <article>{children}</article>
          </MDXProvider>
        ) : (
          <>{children}</>
        )}
      </Box>
      <Footer shouldShowSubscribeEmbed={isBlogPost} />
    </Wrapper>
  );
}

export default BlogLayout;
