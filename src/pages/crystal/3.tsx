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
    <div className="h-[80vh]">
      <CrystalBall
        toneMappingExposure={2}
        meshPhysicalMaterialProps={meshPhysicalMaterialProps}
      />
    </div>
  )
}

export default Crystal
