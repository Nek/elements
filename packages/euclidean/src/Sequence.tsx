import React from 'react'
import { Group, Rect } from 'react-konva'

const Toggle = (props: any) => {
  return (
    <Rect
      fill={props.toggled ? 'chartreuse' : 'white'}
      stroke={'grey'}
      strokeWidth={1}
      {...props}
    />
  )
}

type InstrumentProps = {
  y: number
  height: number
  beats: number[]
  setBeats: Function
  width: number
}

export default function Sequence({
  y,
  beats,
  setBeats,
  height,
  width,
}: InstrumentProps) {
  const toggles = beats.map((toggled, i) => (
    <Toggle
      key={`toggle-${i}`}
      x={i * (width / beats.length)}
      y={y}
      width={width / beats.length}
      height={height}
      toggled={toggled}
      onClick={() => {
        const newBeats = [...beats]
        newBeats[i] = newBeats[i] === 1 ? 0 : 1
        setBeats(newBeats)
      }}
    />
  ))

  return <Group>{toggles}</Group>
}
