import React from 'react';
import { useRouter } from 'next/router';

function BlogPost404() {
  const router = useRouter();
  const query = router.query;

  return (
    <>
      <h1>Can&apos;t find post &quot;{query.name}&quot;</h1>
      <h3>
        Here&apos;s what we can do:
        <br />
        <br />
        1. Send me an email to suggest this post
        <br />
        or
        <br />
        2. Open a pull request to submit this post
      </h3>
    </>
  );
}

export default BlogPost404;
