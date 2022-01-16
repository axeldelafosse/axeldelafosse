import { useEffect } from 'react'
import Gradient from '@/components/gradient'

function GradientBackground() {
  useEffect(() => {
    const gradient = new Gradient()
    // @ts-ignore
    gradient.initGradient('#gradient-canvas')
  }, [])

  return (
    <div className="fixed h-screen w-screen blur-[1px] transform-gpu">
      <canvas id="gradient-canvas" />
    </div>
  )
}

export default GradientBackground
