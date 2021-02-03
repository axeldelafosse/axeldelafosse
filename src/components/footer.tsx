import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Wrapper = styled.footer`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.color};
`;

const Link = styled.a`
  color: ${(props) => props.color};
  text-decoration: none;
  font-size: 14px;
`;

const Bull = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  cursor: none;
`;

const SubscribeText = styled.div`
  text-align: center;
  padding: 20px;
  font-size: 14px;
`;

function Footer({
  color,
  shouldShowSubscribeEmbed = false
}: {
  color: string;
  shouldShowSubscribeEmbed?: boolean;
}) {
  const [shouldShowIframe, setShouldShowIframe] = useState(false);

  useEffect(() => {
    setShouldShowIframe(true);
  }, []);

  return (
    <div>
      {shouldShowSubscribeEmbed && (
        <>
          <SubscribeText>
            Pssst... Hey you! You can subscribe to my blog.
            <br />
            Don't worry, I don't post often.
          </SubscribeText>
          {shouldShowIframe && (
            <iframe
              id="substack"
              src="https://axeldelafosse.substack.com/embed"
              width="100%"
              height="100"
              frameBorder="0"
              scrolling="no"
            />
          )}
        </>
      )}

      <Wrapper color={color}>
        <Link
          href={`https://github.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          color={color}
        >
          github
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://soundcloud.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          color={color}
        >
          soundcloud
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://www.linkedin.com/in/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          color={color}
        >
          linkedin
        </Link>
        <Bull>•</Bull>
        <Link
          href={`https://twitter.com/${process.env.NEXT_PUBLIC_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          color={color}
        >
          twitter
        </Link>
      </Wrapper>
    </div>
  );
}

export default Footer;
