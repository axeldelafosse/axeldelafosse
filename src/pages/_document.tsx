import Document, { Html, Head, Main, NextScript } from 'next/document'
import { themeInitScript } from '@/lib/theme'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" className="dark">
        <Head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
