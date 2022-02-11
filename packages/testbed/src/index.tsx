// @ts-ignore
import { el, ElementaryWebAudioRenderer as core } from '@elemaudio/core'
import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'

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

function App() {
  const [coreLoaded, setCoreLoaded] = useState(false)
  useEffect(() => {
    core.on('load', () => setCoreLoaded(true))
  }, [])

  useEffect(() => {
    if (coreLoaded) {
      const audio = el.train(2)
      renderAudio(audio)
    }
  }, [coreLoaded])

  return <div>Hello audiovisual world!</div>
}

render(<App />, document.getElementById('app'))
