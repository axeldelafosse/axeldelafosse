import React from 'react';
import styled from 'styled-components';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import postList, { Post } from '@/utils/post-list';

const Title = styled.h1``;

const PostTitle = styled.h3`
  cursor: pointer;
`;

const PostDate = styled.span`
  font-size: 90%;
  font-weight: 500;
  color: lightgrey;
`;

function Blog({ posts }: { posts: Post[] }) {
  return (
    <>
      <Title>Blog</Title>
      {posts.map((post) => (
        <Link key={post.uid} href={post.urlPath} passHref={true}>
          <PostTitle>
            {post.title}{' '}
            <PostDate>
              {new Date(post.dateLastModified).toDateString()}
            </PostDate>
          </PostTitle>
        </Link>
      ))}
    </>
  );
}

export default Blog;

export const getStaticProps: GetStaticProps = async () => {
  const posts = postList();
  return { props: { posts } };
};
