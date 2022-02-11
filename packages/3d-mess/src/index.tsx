// @ts-ignore
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { useState } from 'react'
import { render } from 'react-dom'
import { Vector2 } from 'three'

function profile(SEGMENTS: number) {
  const step = 360 / SEGMENTS
  const K1 = Math.random() * 3 + 1
  const K2 = Math.random() + 0.1
  const K3 = (Math.random() * 15 + 5) * 0.1

  const f1 = (k: number, i: number) =>
    Math.sin((k * (i * step) * Math.PI) / 180)

  return Array(SEGMENTS)
    .fill([])
    .map((_, i) => f1(K1, i) * f1(K2, i) + f1(K3, i))
}

function makePoints2d(HEIGHT, SEGMENTS) {
  return [
    new Vector2(0, 0),
    ...profile(SEGMENTS).map(
      (x, y) => new Vector2(x - 2, (y * HEIGHT) / SEGMENTS),
    ),
    new Vector2(0, HEIGHT),
  ]
}

function App() {
  const SEGMENTS = 360
  const HEIGHT = 10

  const [points2d, setPoints2d] = useState(
    makePoints2d(HEIGHT, SEGMENTS),
  )

  return (
    <Canvas camera={{ position: [0, 0, -10] }}>
      <OrbitControls autoRotate={true} autoRotateSpeed={-10} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <group position={[0, -5, 0]}>
        <mesh
          onDoubleClick={() =>
            setPoints2d(makePoints2d(HEIGHT, SEGMENTS))
          }
        >
          <latheGeometry args={[points2d, 72]} />
          <meshStandardMaterial color={'hotpink'} />
        </mesh>
      </group>
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
