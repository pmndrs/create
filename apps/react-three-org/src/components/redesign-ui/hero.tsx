import { useThree, useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { NavBar } from './navbar'
import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { createShaderMaterial } from './shader-material'

export const Hero = () => {
  return (
    <section className="flex flex-col-reverse xl:grid xl:grid-cols-12 xl:gap-4 border-b border-redesign-gray" aria-label="Hero section">
      <div className="w-full h-full col-start-1 col-end-7 flex flex-col gap-10 xl:justify-between py-6 xl:pt-6 xl:pb-12 px-4 xl:px-6">
        <NavBar />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium" aria-label="Project name">react-three</p>
          <h1 className="text-4xl text-balance" id="main-heading">BUILDING COOL 3D EXPERIENCES WITH THE REACT THREE ECOSYSTEM.</h1>
        </div>
      </div>
      <div 
        className="w-full h-80 col-start-7 col-end-13 border-b xl:border-b-0 xl:border-l border-redesign-gray"
        role="complementary"
        aria-label="3D visualization"
      >
        <Canvas camera={{ position: [0, 0, 5], fov: 20 }}>
          <ambientLight intensity={0.5} />
          <axesHelper args={[1]} />
          <CameraPlane />
        </Canvas>
        <div className="sr-only">
          Interactive 3D visualization demonstrating React Three capabilities
        </div>
      </div>
    </section>
  )
}

const CameraPlane = () => {
  const { camera, size } = useThree()
  const shaderMaterial = useMemo(() => createShaderMaterial(), [])

  const planeZ = 1
  const distanceFromCamera = camera.position.z - planeZ
  const fovRadians = THREE.MathUtils.degToRad(camera instanceof THREE.PerspectiveCamera ? camera.fov : 75)
  const height = 2 * Math.tan(fovRadians / 2) * distanceFromCamera
  const width = height * (size.width / size.height)

  useEffect(() => {
    if (shaderMaterial.uniforms?.uResolution) {
      shaderMaterial.uniforms.uResolution.value.set(size.width, size.height, 1)
    }
  }, [size, shaderMaterial])

  useFrame(({ clock }) => {
    if (shaderMaterial.uniforms?.uTime) {
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={[0, 0, planeZ]} rotation={[0, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  )
}


