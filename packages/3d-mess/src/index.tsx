// @ts-ignore
import { OrbitControls, softShadows } from '@react-three/drei'
import {
  Canvas,
  extend,
  ReactThreeFiber,
  useFrame,
  useThree,
} from '@react-three/fiber'
import React, { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { render } from 'react-dom'
import { Sphere, Vector2, MultiplyBlending, FrontSide, BackSide } from 'three'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass'
//@ts-ignore
import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass'

import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader'

extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, SSRPass })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      sSRPass: ReactThreeFiber.Object3DNode<SSRPass, typeof SSRPass>
    }
  }
}

function Effects({ selects, reflectorGeometry }) {
  console.log(reflectorGeometry)

  let groundReflector = null

  if (reflectorGeometry !== undefined) {
    groundReflector = new ReflectorForSSRPass(reflectorGeometry, {
      clipBias: 0.0003,
      textureWidth: window.innerWidth,
      textureHeight: window.innerHeight,
      color: 0x888888,
      useDepthTexture: true,
    })
    groundReflector.material.depthWrite = false
    groundReflector.rotation.x = -Math.PI / 2
    groundReflector.visible = false
  }

  const composer = useRef()
  const { scene, gl, size, camera } = useThree()
  useEffect(() => composer.current.setSize(size.width, size.height), [size])
  useFrame(() => composer.current.render(), 2)
  return (
    <effectComposer ref={composer} args={[gl]}>
      <renderPass attachArray="passes" scene={scene} camera={camera} />
      <sSRPass
        attachArray="passes"
        thickness={0.018}
        args={[
          {
            scene,
            camera,
            renderer: gl,
            width: size.width,
            height: size.height,
            selects,
            groundReflector,
          },
        ]}
        maxDistance={0.03}
        renderToScreen
      />
    </effectComposer>
  )
}

const vertexShader = `
        uniform float time;
        varying vec2 vUv;
        varying float hValue;

        //https://thebookofshaders.com/11/
        // 2D Random
        float random (in vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))
                         * 43758.5453123);
        }

        // 2D Noise based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            // Smooth Interpolation

            // Cubic Hermine Curve.  Same as SmoothStep()
            vec2 u = f*f*(3.0-2.0*f);
            // u = smoothstep(0.,1.,f);

            // Mix 4 coorners percentages
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }

        void main() {
          vUv = uv;
          vec3 pos = position;

          pos *= vec3(0.8, 2, 0.725);
          hValue = position.y;
          //float sinT = sin(time * 2.) * 0.5 + 0.5;
          float posXZlen = length(position.xz);

          pos.y *= 1. + (cos((posXZlen + 0.25) * 3.1415926) * 0.25 + noise(vec2(0, time)) * 0.125 + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y; // flame height

          pos.x += noise(vec2(time * 2., (position.y - time) * 4.0)) * hValue * 0.0312; // flame trembling
          pos.z += noise(vec2((position.y - time) * 4.0, time * 2.)) * hValue * 0.0312; // flame trembling

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
      `

const fragmentShader = `
        varying float hValue;
        varying vec2 vUv;

        // honestly stolen from https://www.shadertoy.com/view/4dsSzr
        vec3 heatmapGradient(float t) {
          return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
        }

        void main() {
          float v = abs(smoothstep(0.0, 0.4, hValue) - 1.);
          float alpha = (1. - v) * 0.99; // bottom transparency
          alpha -= 1. - smoothstep(1.0, 0.97, hValue); // tip transparency
          gl_FragColor = vec4(heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95,0.95,0.4), alpha) ;
          gl_FragColor.rgb = mix(vec3(0,0,1), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue)); // blueish for bottom
          gl_FragColor.rgb += vec3(1, 0.9, 0.5) * (1.25 - vUv.y); // make the midst brighter
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1., hValue)); // tip
        }
      `

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

function Candle() {
  const refFront = useRef()
  const refBack = useRef()

  useFrame((state) => {
    refFront.current.material.uniforms.time.value = state.clock.elapsedTime
    refBack.current.material.uniforms.time.value = state.clock.elapsedTime
  })

  const frontData = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
      },
      fragmentShader,
      vertexShader,
      side: FrontSide,
      transparent: true,
    }),
    [],
  )

  const backData = useMemo(
    () => ({
      uniforms: {
        time: { value: 0 },
      },
      fragmentShader,
      vertexShader,
      side: BackSide,
      transparent: true,
    }),
    [],
  )

  const SEGMENTS = 360
  const HEIGHT = 5

  const [points2d, setPoints2d] = useState(makePoints2d(HEIGHT, SEGMENTS))

  return (
    <group
      position={[0, -4.5, 0]}
      onDoubleClick={() => setPoints2d(makePoints2d(HEIGHT, SEGMENTS))}
    >
      <mesh ref={refFront} position={[0, HEIGHT * 2 + 0.1, 0]}>
        <sphereBufferGeometry args={[0.2, 32, 30]} />
        <shaderMaterial {...frontData} />
      </mesh>
      <mesh ref={refBack} position={[0, HEIGHT * 2 + 0.1, 0]}>
        <sphereBufferGeometry args={[0.2, 32, 30]} />
        <shaderMaterial {...backData} />
      </mesh>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[points2d, 72]} />
        <meshPhongMaterial color={'hotpink'} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, 0, 0]}
        rotation={[Math.PI + Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[25, 25, 10, 10]} />
        <shadowMaterial color={'white'} />
      </mesh>
      <mesh position={[0, HEIGHT + HEIGHT / 2, 0]}>
        <cylinderGeometry
          args={[
            points2d[points2d.length - 2].x * 0.5,
            points2d[points2d.length - 2].x * 0.7,
            HEIGHT,
            36,
          ]}
        />
        <meshPhongMaterial color={'white'} />
      </mesh>
    </group>
  )
}

function App() {
  return (
    <Canvas
      shadows={true}
      camera={{ position: [0, 0, -24], fov: 30 }}
    >
      <OrbitControls autoRotate={false} autoRotateSpeed={-10} />
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
      <Candle />
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
function useResource() {
  throw new Error('Function not implemented.')
}
