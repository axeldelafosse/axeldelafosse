import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import postList, { Post } from '@/utils/post-list';
import Switch from '@/components/switch';

function Blog({ posts }: { posts: Post[] }) {
  const [hideTechPosts, setHideTechPosts] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1>Blog</h1>
        <div className="flex items-center">
          <h4 className="mr-2 font-bold">Hide tech posts</h4>
          <Switch
            enabled={hideTechPosts}
            setEnabled={setHideTechPosts}
            accessibility="Hide tech posts"
          />
        </div>
      </div>
      {posts
        .filter((post) =>
          hideTechPosts ? post.tags.includes('tech') === false : true
        )
        .map((post) => (
          <Link key={post.uid} href={post.urlPath} passHref={true}>
            <h3 className="cursor-pointer">
              {post.title}{' '}
              <span className="text-lg text-gray-400 font-normal">
                {new Date(post.dateLastModified).toDateString()}
              </span>
            </h3>
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
