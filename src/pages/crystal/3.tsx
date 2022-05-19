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
      <style
        dangerouslySetInnerHTML={{
          __html: `
:root {
    --gradient-color-1: #ffffff;
    --gradient-color-2: #ffffff;
    --gradient-color-3: #7038ff;
    --gradient-color-4: #0000c3;
}
        `
        }}
      />
      <CrystalBall
        toneMappingExposure={2}
        meshPhysicalMaterialProps={meshPhysicalMaterialProps}
      />
    </div>
  )
}

export default Crystal
