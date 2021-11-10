import fs from 'fs'

const postFileNames = () => {
  const postFileNames = fs.readdirSync('./src/pages/blog') ?? []
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
  tags: string[]
}

const createPostList = (fileNameList: string[]): Post[] => {
  return fileNameList
    .reduce((list: Post[], fileName: string) => {
      const splittedFileName = fileName.split('.')
      const uid = splittedFileName[0]
      const fileExtension = splittedFileName[1]

      if (fileExtension !== 'mdx') return list

      const { title, description, date, dateLastModified, tags } =
        require(`../pages/blog/${fileName}`).meta

      list.push({
        uid,
        title,
        description,
        urlPath: `/blog/${uid}`,
        date: new Date(date).toISOString(),
        dateLastModified: new Date(dateLastModified).toISOString(),
        secondsSinceEpoch: new Date(dateLastModified).getTime() / 1000,
        tags: tags ?? []
      })

      return list
    }, [])
    .sort((a, b) => a.secondsSinceEpoch - b.secondsSinceEpoch)
    .reverse()
}

export default function postList() {
  const fileNameList = postFileNames()
  return createPostList(fileNameList)
}
