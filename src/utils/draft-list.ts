import fs from 'fs'

const postFileNames = () => {
  const postFileNames = fs.readdirSync('./src/pages/blog/drafts') ?? []
  return postFileNames
}

export interface Post {
  uid: string
  title: string
  description: string
  date: string
  dateLastModified: string
  secondsSinceEpoch: number
  urlPath: string
}

const createPostList = (fileNameList: string[]): Post[] => {
  return fileNameList
    .reduce((list: Post[], fileName: string) => {
      const splittedFileName = fileName.split('.')
      const uid = splittedFileName[0]
      const fileExtension = splittedFileName[1]

      if (fileExtension !== 'mdx') return list

      try {
        const { title, description, date, dateLastModified } =
          require(`../pages/blog/drafts/${fileName}`).meta || {
            title: uid,
            description: '',
            date: new Date(),
            dateLastModified: new Date()
          }

        list.push({
          uid,
          title,
          description,
          urlPath: `/blog/drafts/${uid}`,
          date: new Date(date).toISOString(),
          dateLastModified: new Date(dateLastModified).toISOString(),
          secondsSinceEpoch: new Date(date).getTime() / 1000
        })
      } catch (error) {}

      return list
    }, [])
    .sort((a, b) => a.secondsSinceEpoch - b.secondsSinceEpoch)
    .reverse()
}

export default function postList() {
  const fileNameList = postFileNames()
  return createPostList(fileNameList)
}
