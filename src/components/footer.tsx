import React from 'react';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

const Substack = dynamic(() => import('./substack'));

const Wrapper = styled.footer`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Link = styled.a`
  text-decoration: none;
  font-size: 14px;
`;

const Bull = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  cursor: none;
`;

function Footer({
  color = 'black',
  shouldShowSubscribeEmbed = false
}: {
  color?: string;
  shouldShowSubscribeEmbed?: boolean;
}) {
  return (
    <div className="z-10">
      {shouldShowSubscribeEmbed && <Substack />}

      <Wrapper className={`text-${color} dark:text-white`}>
        <Link
          href={`https://github.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white`}
        >
          github
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://soundcloud.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white`}
        >
          soundcloud
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://www.linkedin.com/in/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white`}
        >
          linkedin
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://twitter.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-${color} dark:text-white`}
        >
          twitter
        </Link>
      </Wrapper>
    </div>
  );
}

export default Footer;
