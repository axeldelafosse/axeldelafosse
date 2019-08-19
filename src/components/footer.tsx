import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.footer`
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color};
`;

const Link = styled.a`
  color: ${props => props.color};
  text-decoration: none;
  font-size: 14px;
`;

const Bull = styled.span`
  margin-left: 5px;
  margin-right: 5px;
  cursor: none;
`;

function Footer({ color }: { color: string }) {
  return (
    <Wrapper color={color}>
      <Link
        href="https://github.com/axeldelafosse"
        target="_blank"
        rel="noopener noreferrer"
        color={color}
      >
        github
      </Link>
      <Bull>•</Bull>
      <Link
        href="https://www.linkedin.com/in/axeldelafosse/"
        target="_blank"
        rel="noopener noreferrer"
        color={color}
      >
        linkedin
      </Link>
      <Bull>•</Bull>
      <Link
        href="https://medium.com/@axeldelafosse"
        target="_blank"
        rel="noopener noreferrer"
        color={color}
      >
        medium
      </Link>
      <Bull>•</Bull>
      <Link
        href="https://twitter.com/axeldelafosse"
        target="_blank"
        rel="noopener noreferrer"
        color={color}
      >
        twitter
      </Link>
    </Wrapper>
  );
}

export default Footer;
