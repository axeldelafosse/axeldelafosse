import React, { useRef } from 'react'
import * as THREE from 'three'

import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber'
import {
  useGLTF,
  PresentationControls,
  Center,
  Stage,
  PerspectiveCamera
} from '@react-three/drei'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { motion } from 'framer-motion-3d'

const useEquirectangularHDR = (url: string) => {
  const { gl } = useThree()
  const pmremGenerator = new THREE.PMREMGenerator(gl)
  pmremGenerator.compileEquirectangularShader()

  const hdrEquirect = useLoader(RGBELoader, url)
  hdrEquirect.mapping = THREE.EquirectangularReflectionMapping
  hdrEquirect.magFilter = THREE.LinearFilter
  hdrEquirect.needsUpdate = true

  const hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrEquirect)
  hdrEquirect.dispose()
  pmremGenerator.dispose()

  return hdrCubeRenderTarget.texture
}

type Props = {
  url?: string
  toneMappingExposure?: number
  cursor?: boolean
  meshPhysicalMaterialProps?: any
}

function Model({
  url = '/sphere.glb',
  meshPhysicalMaterialProps,
  ...rest
}: Props) {
  const groupRef = useRef(null)
  const meshRef = useRef(null)
  const { nodes } = useGLTF(url) as any
  const hdrTexture = useEquirectangularHDR('/crystal.hdr')
  const { scene } = useThree()
  useFrame(() => (scene.rotation.y += 0.01))

  const gradientColors = ['#7038ff', '#0000c3']

  return (
    <group ref={groupRef} {...rest} dispose={null} name="Crystal Ball">
      <PerspectiveCamera makeDefault={true} far={1000} near={1} fov={45} />

      <Center alignTop>
        <motion.mesh
          ref={meshRef}
          name="Sphere"
          castShadow
          receiveShadow
          geometry={nodes.Sphere.geometry}
          material={nodes.Sphere.material}
          position={[0, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 1.5 }}
        >
          <motion.meshPhysicalMaterial
            envMap={hdrTexture}
            envMapIntensity={1.5}
            color={gradientColors[0]}
            roughness={0}
            metalness={0}
            reflectivity={0.69}
            clearcoat={0}
            clearcoatRoughness={0}
            transparent={true}
            opacity={1}
            transmission={0.9}
            thickness={2}
            ior={1.4}
            specularIntensity={1}
            side={THREE.DoubleSide}
            {...meshPhysicalMaterialProps}
          />
        </motion.mesh>
      </Center>
    </group>
  )
}

function CrystalBall({
  url,
  toneMappingExposure = 1.69,
  cursor = true,
  meshPhysicalMaterialProps
}: Props) {
  return (
    <Canvas
      gl={{
        outputEncoding: THREE.sRGBEncoding,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: toneMappingExposure
      }}
    >
      <Stage
        contactShadow={false}
        shadows={false}
        environment="night"
        preset="soft"
      >
        <PresentationControls
          global={true}
          cursor={cursor}
          snap={false}
          speed={1}
          zoom={1}
          rotation={[0, 0, 0]}
          polar={[0, 0]}
          azimuth={[-Infinity, Infinity]}
          config={{ mass: 1, tension: 170, friction: 26 }}
        >
          <Model
            url={url}
            meshPhysicalMaterialProps={meshPhysicalMaterialProps}
          />
        </PresentationControls>
      </Stage>
    </Canvas>
  )
}

export default CrystalBall
