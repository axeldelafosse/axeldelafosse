import { allPosts } from 'contentlayer2/generated'
import { validatePostMetadata } from '../src/lib/post-validation'

const posts = allPosts.filter((post) => post._raw.sourceFileDir === '.')
const errors = validatePostMetadata(posts)
if (errors.length) throw new Error(errors.join('\n'))
console.log(`Validated metadata for ${posts.length} posts.`)
