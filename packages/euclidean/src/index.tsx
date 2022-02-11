// @ts-ignore
import { el, ElementaryWebAudioRenderer as core } from '@elemaudio/core'
import React, { useEffect, useState } from 'react'
import { render } from 'react-dom'
import { Layer, Stage } from 'react-konva'
import Sequence from './Sequence'
import {
  Scale,
  createScale,
  noteToObject,
  objectToNote,
  noteToFrequency,
  NOTES,
// @ts-ignore
} from 'music-fns'
import { partition, shuffle } from '@elements/utils'
import { makeBeats } from './makeBeats'

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

const renderBeat = (beats: boolean[], i: number, freq: number) => {
  const seq = el.seq(
    { seq: beats.map((v) => (v ? 1 : 0)), key: `beat-${i}-seq` },
    el.train(beats.length / 2),
  )
  const adsr = el.adsr(0.05, 0.05, 0.8, 1 / beats.length / 4, seq)
  return el.mul(
    adsr,
    i < 2 ? el.cycle(freq) : el.mul(0.5, el.bleptriangle(freq)),
  )
}

const renderAudio = (audio: core.Node) => {
  core.render(audio, audio)
}

const notes = createScale(
  NOTES[Math.floor(Math.random() * NOTES.length)][0],
  Scale.MINOR_PENTATONIC,
)
  .map(noteToObject)
  .map((obj: any, i: number) => ({ ...obj, octave: 3}))
  .map(objectToNote)
  .map(noteToFrequency)

const beatsLengths = shuffle([5, 7, 9, 11, 13])

function App() {
  const [coreLoaded, setCoreLoaded] = useState(false)
  useEffect(() => {
    core.on('load', () => setCoreLoaded(true))
  }, [])

  const [beats, setBeats] = useState(
    // [...beatsLengths
    // .slice(0, notes.length - 2), 4, 12]
    [4, 7, 12, 16, 21]
      .map(makeBeats)
      .sort((a, b) => (a.length <= b.length ? -1 : 1)),
  )

  useEffect(() => {
    if (coreLoaded) {
      const beatsInParts = partition(beats, 8)
      const renderedBeats = beatsInParts.map((part) =>
        el.add(part.map((seq, i) => renderBeat(seq, i, notes[i]))),
      )
      const audio = el.div(el.add(renderedBeats), beats.length)
      renderAudio(audio)
    }
  }, [beats, coreLoaded])

  let totalHeight = 0
  const WIDTH = 600
  const sequences = beats.map((beat, i) => {
    const currHeight = WIDTH / beat.length
    const seq = (
      <Sequence
        width={600}
        key={`seq-${i}`}
        y={totalHeight}
        height={currHeight}
        beats={beats[i]}
        setBeats={(newBeat: number[]) => {
          const newBeats = [...beats]
          newBeats[i] = newBeat
          setBeats(newBeats)
        }}
      />
    )
    totalHeight += currHeight
    return seq
  })

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>{sequences}</Layer>
    </Stage>
  )
}

render(<App />, document.getElementById('app'))
