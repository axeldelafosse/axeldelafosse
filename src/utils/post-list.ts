const postFileNames = () => {
  const postFileNames =
    // @ts-ignore
    preval`module.exports = require('fs').readdirSync('./src/pages/blog')` ||
    [];
  return Promise.resolve(postFileNames);
};

export interface Post {
  uid: string;
  title: string;
  description: string;
  date: string;
  dateLastModified: string;
  secondsSinceEpoch: number;
  urlPath: string;
}

const createPostList = (fileNameList: string[]): Post[] => {
  return fileNameList
    .reduce((list: Post[], fileName: string) => {
      const splittedFileName = fileName.split('.');
      const uid = splittedFileName[0];
      const fileExtension = splittedFileName[1];

      if (fileExtension !== 'mdx') return list;

      const {
        title,
        description,
        date,
        dateLastModified
      } = require(`../pages/blog/${fileName}`).meta;

      list.push({
        uid,
        title,
        description,
        urlPath: `/blog/${uid}`,
        date: new Date(date).toISOString(),
        dateLastModified: new Date(dateLastModified).toISOString(),
        secondsSinceEpoch: new Date(dateLastModified).getTime() / 1000
      });

      return list;
    }, [])
    .sort((a, b) => a.secondsSinceEpoch - b.secondsSinceEpoch)
    .reverse();
};

export default async function postList() {
  return postFileNames()
    .then((fileNameList) => {
      return createPostList(fileNameList);
    })
    .catch((error) => console.error(error));
}
