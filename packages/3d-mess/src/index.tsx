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
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { render } from 'react-dom'
import {
  Float32BufferAttribute,
  LatheGeometry,
  MeshPhongMaterial,
  Vector2,
} from 'three'
import { useRegisterAudioCore } from './audio'
import { el } from '@elemaudio/core'

export const _zip = (...args: any[]) => {
  const [arr, ...arrs] = args
  return arr.map((val: any, i: string | number) =>
    arrs.reduce((a, arr) => [...a, arr[i]], [val]),
  )
}

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

function morph(v1,v2,k) {
  return v1 * (1 - k) + v2 * k
}

function Tree({ states, morphTargetInfluences }) {
  const [attrs, setAttrs] = useState({ position: [], normal: [] })

  useEffect(() => {
    const geo = new LatheGeometry(states[1].points2d, 72)
    setAttrs({
      position: [geo.attributes.position.clone()],
      normal: [geo.attributes.normal.clone()],
    })
  }, [states[1].points2d])

  const k = morphTargetInfluences[0]
  const HEIGHT = morph(states[0].HEIGHT, states[1].HEIGHT, k)
  const rad = morph(states[0].rad, states[1].rad, k)
const rad2 = morph(states[0].points2d[1].x, states[1].points2d[1].x, k)
  return (
    <group {...states[0]}>
      <Sphere
        position={[0, HEIGHT, 0]}
        args={[rad, 36, 36]}
        castShadow
        receiveShadow
      >
        <MeshDistortMaterial
          distort={0.2}
          radius={rad2}
          speed={50}
          color={'green'}
        />
      </Sphere>
      <mesh
        castShadow
        receiveShadow
        morphTargetInfluences={morphTargetInfluences}
      >
        <latheGeometry
          args={[states[0].points2d, 72]}
          morphAttributes={attrs}
        />
        <meshPhongMaterial color={'hotpink'} />
      </mesh>
    </group>
  )
}

softShadows()

function makeTrees(heights, R) {
  return heights.map((HEIGHT, i, a) => {
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
}

function makeState() {
  const N = Math.ceil(fxrand() * 4) + 2
  const heights1 = calcHeights(N)
  const heights2 = calcHeights(N)
  const HEIGHT = Math.max.apply(null, [...heights1, ...heights2])
  const heights = _zip(heights1, heights2) 
  const R = N - 1
  const trees = [makeTrees(heights1, R), makeTrees(heights2, R)]
  return {
    N,
    heights,
    HEIGHT,
    R,
    trees,
    zipTrees: _zip.apply(null, trees)
  }
}

const FREQS = [432 / 8, 432 / 4, 432 / 2]

const initialState = makeState()

function Forest() {
  const [state, setState] = useState(initialState)
  const [coreLoaded, core] = useRegisterAudioCore()
  const [morph, setMorph] = useState(0)

  useFrame((state) => {
    setMorph((Math.sin(state.clock.elapsedTime) + 1) / 2)
  })

  useEffect(() => {
    if (coreLoaded) {

      const state0 = el.div(
        el.add(
          state.trees[0].map(({ HEIGHT, ks: { K1, K2, K3 } }) =>
            el.mul(
              HEIGHT / state.HEIGHT,
              el.add(
                0.1,
                el.mul(
                  0.9,
                  el.div(
                    el.add(el.cycle(HEIGHT / state.trees[0].length), 1),
                    2,
                  ),
                ),
              ),
              el.div(
                el.add(
                  [K1, K2, K3].sort().map((v, i) => el.cycle(FREQS[i] / v)),
                ),
                3,
              ),
            ),
          ),
        ),
        state.trees[0].length,
      )
      const state1 = el.div(
        el.add(
          state.trees[1].map(({ HEIGHT, ks: { K1, K2, K3 } }) =>
            el.mul(
              HEIGHT / state.HEIGHT,
              el.add(
                0.1,
                el.mul(
                  0.9,
                  el.div(
                    el.add(el.cycle(HEIGHT / state.trees[0].length), 1),
                    2,
                  ),
                ),
              ),
              el.div(
                el.add(
                  [K1, K2, K3].sort().map((v, i) => el.cycle(FREQS[i] / v)),
                ),
                3,
              ),
            ),
          ),
        ),
        state.trees[1].length,
      )
      const audio = el.add(el.mul(state0, el.sub(1, morph)), el.mul(state1, morph))
      core.render(audio, audio)
    }
  }, [coreLoaded, state, morph])

  return (
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
      {state.zipTrees.map((states, i, a) => {
        return (
          <Tree
            key={`tree-${i}`}
            states={states}
            morphTargetInfluences={[morph]}
          />
        )
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
  )
}

function App() {
  return (
    <Canvas shadows={true} camera={{ position: [0, 0, -38], fov: 30 }}>
      <OrbitControls autoRotate={true} autoRotateSpeed={-1} />
      <Forest />
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
