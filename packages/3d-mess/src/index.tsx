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
import { useRegisterAudioCore } from './audio'
import { el } from '@elemaudio/core'

declare var fxrand: () => number

import fragmentShader from './fragment.glsl'
import vertexShader from './vertex.glsl'

function makeKs(PRNG) {
  return {
    K1: PRNG() * 3 + 1,
    K2: PRNG() + 0.1,
    K3: (PRNG() * 15 + 5) * 0.1,
  }
}

function profile(SEGMENTS: number, { K1, K2, K3 }) {
  const step = 360 / SEGMENTS

  const f1 = (k: number, i: number) =>
    (Math.sin((k * (i * step) * Math.PI) / 180) + 1) / 2

  return Array(SEGMENTS)
    .fill([])
    .map(
      (_, i) =>
        (f1(K1, i) * f1(K2, i) + f1(K3, i)) / (SEGMENTS / (SEGMENTS - i)) + 0.2,
    )
}

function makePoints2d(
  HEIGHT: number,
  SEGMENTS: number,
  ks: { K1: number; K2: number; K3: number },
) {
  const profile2d = profile(SEGMENTS, ks)
  return [
    new Vector2(0, 0),
    ...profile2d.map((x, y) => new Vector2(x, (y * HEIGHT) / SEGMENTS)),
    new Vector2(0, HEIGHT),
  ]
}

function calcHEIGHT() {
  return 7 + fxrand() * 7
}

function calcHeights(n) {
  return Array(n).fill(0).map(calcHEIGHT)
}

const SEGMENTS = 360

function Tree(props) {
  const { HEIGHT, points2d, rad } = props
  return (
    <group {...props}>
      <Sphere
        position={[0, HEIGHT, 0]}
        args={[rad, 36, 36]}
        castShadow
        receiveShadow
      >
        <MeshDistortMaterial
          distort={0.2}
          radius={points2d[1].x}
          speed={50}
          color={'green'}
        />
      </Sphere>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points2d, 72]} />
        <meshPhongMaterial color={'hotpink'} />
      </mesh>
    </group>
  )
}

softShadows()

function makeState() {
  const N = Math.ceil(fxrand() * 4) + 2
  const heights = calcHeights(N)
  const R = N - 1
  const trees = heights.map((HEIGHT, i, a) => {
    const ks = makeKs(fxrand)
    const points2d = makePoints2d(HEIGHT, SEGMENTS, ks)
    return {
      position: [
        Math.sin((i * Math.PI * 2) / a.length) * R,
        0,
        Math.cos((i * Math.PI * 2) / a.length) * R,
      ],
      HEIGHT,
      points2d,
      rad: points2d[1].x * (1 + fxrand() * 2),
      ks,
    }
  })
  return {
    N,
    heights,
    HEIGHT: Math.max.apply(null, heights),
    R,
    trees,
  }
}

const FREQS = [432/8 ,
432/4 ,
432/2 ,]

function App() {
  const [state, setState] = useState(makeState())
  const [coreLoaded, core] = useRegisterAudioCore()

  useEffect(() => {
    if (coreLoaded) { 
      const audio = el.div(
        el.add(
          state.trees.map(({ HEIGHT, ks: { K1, K2, K3 } }) =>
            el.mul(
              HEIGHT / state.HEIGHT,
              el.add(0.1, el.mul(0.9, el.div(el.add(el.cycle(HEIGHT / state.trees.length), 1), 2))),
              el.div(
                el.add(
                  [K1,K2,K3].sort().map((v, i) => el.cycle(FREQS[i] / v))
                ),
                3,
              ),
            ),
          ),
        ),
        state.trees.length,
      )
      core.render(audio, audio)
    }
  }, [coreLoaded, state])

  return (
    <Canvas shadows={true} camera={{ position: [0, 0, -34], fov: 30 }}>
      <OrbitControls autoRotate={true} autoRotateSpeed={-1} />
      <group
        onDoubleClick={() => {
          setState(makeState())
        }}
        position={[0, -state.HEIGHT / 2, 0]}
      >
        <ambientLight />
        <directionalLight
          position={[12, state.HEIGHT * 2, 0]}
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
        {state.trees.map((props, i, a) => {
          return <Tree key={`tree-${i}`} {...props} />
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
