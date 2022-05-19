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
      <style
        dangerouslySetInnerHTML={{
          __html: `
:root {
    --gradient-color-1: #000000;
    --gradient-color-2: #000000;
    --gradient-color-3: #7038ff;
    --gradient-color-4: #0000c3;
}
        `
        }}
      />
      <CrystalBall
        toneMappingExposure={0.69}
        meshPhysicalMaterialProps={meshPhysicalMaterialProps}
      />
    </div>
  )
}

export default Crystal
