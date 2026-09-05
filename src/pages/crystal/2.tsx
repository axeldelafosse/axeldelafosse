import dynamic from 'next/dynamic'

const CrystalBall = dynamic(() => import('@/components/crystal-ball'), {
  ssr: false
})

function Crystal() {
  const meshPhysicalMaterialProps = {
    color: 'black'
  }

  return (
    <div className="h-[80vh]">
      <CrystalBall
        toneMappingExposure={0.69}
        meshPhysicalMaterialProps={meshPhysicalMaterialProps}
      />
    </div>
  )
}

export default Crystal
