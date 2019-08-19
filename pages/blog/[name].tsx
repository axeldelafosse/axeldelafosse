import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';

const Error = styled.h1``;

const Suggestion = styled.h3``;

function BlogPost404() {
  const router = useRouter();
  const query = router.query;

  return (
    <>
      <Error>Can't find post "{query.name}"</Error>
      <Suggestion>
        Here's what we can do:
        <br />
        <br />
        1. Send me an email to suggest this post
        <br />
        or
        <br />
        2. Open a pull request to submit this post
      </Suggestion>
    </>
  );
}

export default BlogPost404;
