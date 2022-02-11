// @ts-ignore
import { ElementaryWebAudioRenderer as core } from '@elemaudio/core'
import React, { useState, useRef } from 'react'
import { render } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const initAudioCore = () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  async function main() {
    let node = await core.initialize(ctx, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })

    node.connect(ctx.destination)
  }
  main()
  document.removeEventListener('click', initAudioCore)
  document.removeEventListener('touchstart', initAudioCore)
}
document.addEventListener('click', initAudioCore)
document.addEventListener('touchstart', initAudioCore)

const renderAudio = (audio: core.Node) => {
  core.render(audio, audio)
}

const k = 0.1
console.log(
  Array(36)
    .fill(undefined)
    .map((_, i) => Math.sin(((k * i * 10) / Math.PI) * 2)),
)

function App() {
  const points = Array(36)
    .fill(undefined)
    .map((_, i) => Math.sin(((k * i * 10) / Math.PI) * 2))
    .map((x, y) => new THREE.Vector3(x, y, 0))
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <group position={[0, -2.5, -10]}>
        <line_ geometry={lineGeometry}>
          <lineBasicMaterial
            attach="material"
            color={'#9c88ff'}
            linewidth={10}
            linecap={'round'}
            linejoin={'round'}
          />
        </line_>
      </group>
    </Canvas>
  )
}

render(<App />, document.getElementById('app'))
