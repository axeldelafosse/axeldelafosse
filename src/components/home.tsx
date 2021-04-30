import React, { useEffect } from 'react';
import Link from 'next/link';
import styled from 'styled-components';

import { Post } from '@/utils/post-list';
import Gradient from '@/components/gradient';
import Logo from '@/components/logo';
import Footer from './footer';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
`;

const Header = styled.header`
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  z-index: 10;
`;

const MenuItem = styled.a`
  color: white;
  text-decoration: none;
  font-size: 14px;
  margin-right: 25px;
`;

const LogoContainer = styled.div`
  width: 20vh;
  height: 20vh;
  cursor: zoom-in;

  @keyframes growing {
    0%,
    to {
      transform: scale(1);
    }
    25% {
      transform: scale(1.2);
    }
    50% {
      transform: scale(0.95);
    }
  }

  animation: growing 5000ms infinite;
`;

function Home({ posts }: { posts: Post[] }) {
  useEffect(() => {
    const gradient = new Gradient();
    // @ts-ignore
    gradient.initGradient('#gradient-canvas');
  }, []);

  return (
    <>
      <div className="absolute h-screen w-screen">
        <canvas id="gradient-canvas" data-transition-in />
      </div>
      <Wrapper>
        <Header>
          <Link href="/blog" passHref={true}>
            <MenuItem>blog</MenuItem>
          </Link>
          <MenuItem
            href="https://poolmessenger.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            pool
          </MenuItem>
          <MenuItem
            href={`https://github.com/${process.env.NEXT_PUBLIC_ID}/${process.env.NEXT_PUBLIC_ID}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            source
          </MenuItem>
        </Header>
        <div className="h-auto z-10 flex flex-col justify-center items-center">
          <Link href="/blog" passHref={true}>
            <LogoContainer>
              <Logo color="#FFF" />
              {/* <img alt="think outside the box" /> */}
            </LogoContainer>
          </Link>
          <Link href={posts[0].urlPath} passHref={true}>
            <div className="text-white text-lg pt-12 flex justify-center cursor-pointer">
              <strong className="pr-2">New: </strong>
              {posts[0].title}
            </div>
          </Link>
        </div>
        <Footer color="white" />
      </Wrapper>
    </>
  );
}

export default Home;
