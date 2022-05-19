import dynamic from 'next/dynamic'

const CrystalBall = dynamic(() => import('@/components/crystal-ball'), {
  ssr: false
})

function Crystal() {
  return (
    <div className="h-[80vh]">
      <CrystalBall />
    </div>
  )
}

export default Crystal
