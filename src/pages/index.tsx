import { GetStaticProps } from 'next';

import postList from '@/utils/post-list';
import Home from '@/components/home';

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const posts = postList();
  return { props: { posts } };
};
