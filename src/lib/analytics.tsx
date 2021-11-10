import React, { useEffect } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/router'

export function LoadAnalytics() {
  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA}`}
      strategy="lazyOnload"
    />
  )
}

export function TrackPageView() {
  const router = useRouter()

  useEffect(() => {
    const handlePageViewTracking = (url: string) => {
      window?.gtag?.('config', process.env.NEXT_PUBLIC_GA as string, {
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
