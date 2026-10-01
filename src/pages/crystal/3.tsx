import dynamic from 'next/dynamic'

const CrystalBall = dynamic(() => import('@/components/crystal-ball'), {
  ssr: false
})

function Crystal() {
  const meshPhysicalMaterialProps = {
    color: 'white',
    transmission: 0.99
  }

  return (
    <div className="mx-auto h-[80vh] w-full max-w-[580px]">
      <CrystalBall
        toneMappingExposure={2}
        meshPhysicalMaterialProps={meshPhysicalMaterialProps}
      />
    </div>
  )
}

export default Crystal
