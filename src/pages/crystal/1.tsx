import dynamic from 'next/dynamic'

const CrystalBall = dynamic(() => import('@/components/crystal-ball'), {
  ssr: false
})

function Crystal() {
  return (
    <div className="mx-auto h-[80vh] w-full max-w-[580px]">
      <CrystalBall />
    </div>
  )
}

export default Crystal
