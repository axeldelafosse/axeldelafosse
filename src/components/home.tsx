import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';

import Footer from './footer';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;

  background: linear-gradient(242deg, #00ffff, #0000c3, #ff47ff);
  background-size: 600% 600%;
  animation: bg 32s ease infinite;

  @keyframes bg {
    0% {
      background-position: 0% 42%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 42%;
    }
  }
`;

const Header = styled.header`
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const MenuItem = styled.a`
  color: white;
  text-decoration: none;
  font-size: 14px;
  margin-right: 25px;
`;

const Logo = styled.img`
  width: 20vh;
  height: 20vh;
  cursor: zoom-in;
`;

function Home() {
  return (
    <Wrapper>
      <Header>
        <Link href="/blog" passHref={true}>
          <MenuItem>blog</MenuItem>
        </Link>
        <MenuItem
          href="https://github.com/axeldelafosse/axeldelafosse"
          target="_blank"
          rel="noopener noreferrer"
        >
          source code
        </MenuItem>
      </Header>
      <Link href="/blog" passHref={true}>
        <Logo src={require('../images/logo-white.svg')} alt="A" />
      </Link>
      <Footer color="#FFF" />
    </Wrapper>
  );
}

export default Home;
