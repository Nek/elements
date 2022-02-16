// @ts-ignore
import {
  Cloud,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  OrbitControls,
  RoundedBox,
  softShadows,
  Sphere,
  Stars,
} from '@react-three/drei'
import {
  Canvas,
  extend,
  ReactThreeFiber,
  useFrame,
  useThree,
} from '@react-three/fiber'
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { render } from 'react-dom'
import { MeshPhongMaterial, Vector2 } from 'three'

declare var fxrand: () => number

import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

function profile(SEGMENTS: number, PRNG: () => number) {
  const step = 360 / SEGMENTS
  const K1 = PRNG() * 3 + 1
  const K2 = PRNG() + 0.1
  const K3 = (PRNG() * 15 + 5) * 0.1

  const f1 = (k: number, i: number) =>
    (Math.sin((k * (i * step) * Math.PI) / 180) + 1) / 2

  return Array(SEGMENTS)
    .fill([])
    .map((_, i) => (f1(K1, i) * f1(K2, i) + f1(K3, i)) / (SEGMENTS / (SEGMENTS - i)) + 0.2)
}

function makePoints2d(HEIGHT: number, SEGMENTS: number, PRNG: () => number) {
  return [
    new Vector2(0, 0),
    ...profile(SEGMENTS, PRNG).map(
      (x, y) => new Vector2(x, (y * HEIGHT) / SEGMENTS),
    ),
    new Vector2(0, HEIGHT),
  ]
}

function calcHEIGHT() {
  return 7 + fxrand()*7
}

function calcHeights(n) {
  return Array(n).fill(0).map(calcHEIGHT)
}



function Tree(props) {
  const { HEIGHT } = props

  const SEGMENTS = 360

  const [points2d, setPoints2d] = useState(
    makePoints2d(HEIGHT, SEGMENTS, fxrand),
  )
  useEffect(() => setPoints2d(makePoints2d(HEIGHT, SEGMENTS, fxrand)), [HEIGHT])
  const [rad, setRad] = useState(0)
  useEffect(()=>{
    setRad(points2d[1].x * (1 + fxrand()*2))
  }, [points2d[1].x])

  return (
    <group {...props}>
      <Sphere
        position={[0, HEIGHT, 0]}
        args={[rad, 36, 36]}
        castShadow
        receiveShadow
      >
      <MeshDistortMaterial distort={0.2} radius={points2d[1].x} speed={2} color={"green"} />
      </Sphere>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points2d, 72]} />
        <meshPhongMaterial color={'hotpink'} />
      </mesh>
    </group>
  )
}

function App() {
  const [R, setR] = useState(4)
  const [N, setN] = useState(5)
  const [heights, setHeights] = useState(calcHeights(N))
  const HEIGHT = Math.max.apply(null, heights)

  useEffect(() => setHeights(calcHeights(N)), [N])
  useEffect(() => setR(N - 1), [N])

  return (
    <Canvas shadows={true} camera={{ position: [0, 0, -34], fov: 30 }}>
      <OrbitControls autoRotate={false} autoRotateSpeed={-10} />
      <group
        onDoubleClick={() => {
          setN(Math.ceil(fxrand()*5))
        }}
        position={[0, -HEIGHT / 2, 0]}
      >
{/*      <mesh position={[0,0.5,0]}>
        <boxGeometry args={[1,1,1,6,6,6]} />
        <meshBasicMaterial color={"lightblue"} />
      </mesh>*/}
        <ambientLight />
        <directionalLight
          position={[12, HEIGHT * 2, 0]}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={80}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 0, -20]} color="red" intensity={2.5} />
        <pointLight position={[0, -10, 0]} intensity={1.5} />
{/*        <group>
          <React.Suspense fallback={null}>
            <Cloud position={[0, 0, 3]} args={[0.5, 2]} />
            <Cloud position={[0, 0, -3]} args={[0.5, 2]} />
            <Cloud position={[-3, 0, 0]} args={[0.5, 4]} />
            <Cloud position={[3, 0, 0]} args={[0.5, 6]} />
          </React.Suspense>
        </group>*/}
        {heights.map((HEIGHT, i, a) => {
          return  <Tree position={[Math.sin(i * Math.PI*2/a.length)* R, 0, Math.cos(i * Math.PI*2/a.length)*R]} HEIGHT={HEIGHT} />
        })}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, 0]}
          rotation={[Math.PI + Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[50, 50, 10, 10]} />
          <shadowMaterial color={'white'} />
        </mesh>
      </group>
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
function useResource() {
  throw new Error('Function not implemented.')
}
