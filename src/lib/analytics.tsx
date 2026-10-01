import { useEffect } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/router'

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA

export function LoadAnalytics() {
  if (!GA_TRACKING_ID) return null

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      strategy="lazyOnload"
    />
  )
}

export function TrackPageView() {
  const router = useRouter()

  useEffect(() => {
    if (!GA_TRACKING_ID) return

    const handlePageViewTracking = (url: string) => {
      window?.gtag?.('config', GA_TRACKING_ID, {
        page_path: url,
        transport_type: 'beacon'
      })
    }

    router.events.on('routeChangeComplete', handlePageViewTracking)
    return () => {
      router.events.off('routeChangeComplete', handlePageViewTracking)
    }
  }, [router.events])

  return <noscript />
}
