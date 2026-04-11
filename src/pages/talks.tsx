import BlogLayout from '@/components/blog-layout'

export default function Post() {
  return (
    <BlogLayout>
      <article>
        <h1>Talks</h1>
        <ul>
          <li>
            React Native London in 2022:{' '}
            <a href="https://www.youtube.com/watch?v=sy4bRqMrGjc" target="_blank">
              How to Build a Universal Design System
            </a>
          </li>
          <li>
            App.js Conf in 2022:{' '}
            <a href="https://www.youtube.com/watch?v=CDl3EH3vUHA" target="_blank">
              How to Build a Universal Design System
            </a>
          </li>
          <li>
            The Data Stack Show in 2020:{' '}
            <a href="https://datastackshow.com/podcast/15-early-stage-analytics-and-learning-from-the-y-combinator-experience-with-axel-delafosse-from-pool" target="_blank">
              Early Stage Analytics and Learning from the Y Combinator
              Experience
            </a>
          </li>
          <li>
            Facebook Developer Circles in 2018:{' '}
            <a href="https://www.slideshare.net/slideshow/from-react-to-react-native/90840054" target="_blank">
              From React to React Native
            </a>
          </li>
        </ul>
      </article>
    </BlogLayout>
  )
}
