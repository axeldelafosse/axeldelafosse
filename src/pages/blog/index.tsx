import React from 'react';
import styled from 'styled-components';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import postList, { Post } from '@/utils/post-list';

const Title = styled.h1``;

const PostTitle = styled.h3`
  cursor: pointer;
`;

function Blog({ posts }: { posts: Post[] }) {
  return (
    <>
      <Title>Blog</Title>
      {posts.map((post) => (
        <Link key={post.uid} href={post.urlPath} passHref={true}>
          <PostTitle>{post.title}</PostTitle>
        </Link>
      ))}
    </>
  );
}

export default Blog;

export const getStaticProps: GetStaticProps = async () => {
  const posts = await Promise.resolve(postList());
  return { props: { posts } };
};
