import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import Link from 'next/link';

import Footer from './footer';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-x: hidden;
  word-break: break-word;

  height: 100%;
  min-height: 100vh;
  max-width: 600px;
  margin: auto;

  padding-left: 18px;
  padding-right: 18px;

  border-left: 1px solid #f5f5f9;
  border-right: 1px solid #f5f5f9;

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

const Logo = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
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
            <BackButton>
              <PointingIndex>☜</PointingIndex> {linkText}
            </BackButton>
          </Link>
          <Link href={'/'} passHref={true}>
            <Logo
              src={require('../images/logo.svg')}
              alt={process.env.NEXT_PUBLIC_FULL_NAME}
            />
          </Link>
          {isBlogPost ? (
            <GithubLink
              href={getGithubUrl(router.pathname)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <RightButton>
                edit <WritingHand>✍︎</WritingHand>
              </RightButton>
            </GithubLink>
          ) : (
            <RightButton />
          )}
        </Header>
        {children}
      </Box>
      <Footer color="#000" shouldShowSubscribeEmbed={isBlogPost} />
    </Wrapper>
  );
}

export default BlogLayout;
