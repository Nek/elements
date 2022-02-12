// @ts-ignore
import { OrbitControls, softShadows } from '@react-three/drei'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { render } from 'react-dom'
import { Sphere, Vector2, MultiplyBlending } from 'three'

function profile(SEGMENTS: number) {
  const step = 360 / SEGMENTS
  const K1 = Math.random() * 3 + 1
  const K2 = Math.random() + 0.1
  const K3 = (Math.random() * 15 + 5) * 0.1
  const K4 = Math.random() * 30 + 3

  const f1 = (k: number, i: number) =>
    (Math.sin((k * (i * step) * Math.PI) / 180) + 1) / 2

  return Array(SEGMENTS)
    .fill([])
    .map((_, i) => f1(K1, i) * f1(K2, i) + f1(K3, i) + 0.2)
}

function makePoints2d(HEIGHT, SEGMENTS) {
  return [
    new Vector2(0, 0),
    ...profile(SEGMENTS).map((x, y) => new Vector2(x, (y * HEIGHT) / SEGMENTS)),
    new Vector2(0, HEIGHT),
  ]
}

function App() {
  const SEGMENTS = 360
  const HEIGHT = 5

  const [points2d, setPoints2d] = useState(makePoints2d(HEIGHT, SEGMENTS))

  return (
    <Canvas shadows={true} camera={{ position: [0, 0, -16], fov: 30 }}>
      <OrbitControls autoRotate={true} autoRotateSpeed={-10} />
      <ambientLight />
      <directionalLight
        position={[10, 10, 10]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[-10, 0, -20]} color="red" intensity={2.5} />
      <pointLight position={[0, -10, 0]} intensity={1.5} />
      <group position={[0, -2.5, 0]}>
        <mesh
          castShadow
          receiveShadow
          onDoubleClick={() => setPoints2d(makePoints2d(HEIGHT, SEGMENTS))}
        >
          <latheGeometry args={[points2d, 72]} />
          <meshPhysicalMaterial
            color={'hotpink'}
            metalness={0.3}
            roughness={0.5}
            clearcoat={0}
          />
        </mesh>
      </group>
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
function useResource() {
  throw new Error('Function not implemented.')
}
