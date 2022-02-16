// @ts-ignore
import { el, ElementaryWebAudioRenderer as core } from '@elemaudio/core'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

const initAudioCore = async () => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
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

export function useRegisterAudioCore() {
  useEffect(() => {
    document.addEventListener('click', initAudioCore)
    document.addEventListener('touchstart', initAudioCore)
  }, [])
  const [coreLoaded, setCoreLoaded] = useState(false)
  useEffect(() => {
    core.on('load', () => setCoreLoaded(true))
  }, [])

  return [coreLoaded, core]
}
