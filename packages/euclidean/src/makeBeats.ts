import {choose, bresenhamEuclidean} from "@elements/utils"

function sizeToOnsetRatio(size: number) {
  return {
    4: [1, 0.8, 0.6],
    7: [0.8, 0.7, 0.6, 0.5],
    12: [0.6, 0.5, 0.4],
    16: [0.5, 0.4, 0.3],
    21: [0.2, 0.3, 0.4],
  }[size]
}

export function makeBeats(size: number) {
  return bresenhamEuclidean(
    Math.floor(size * choose(sizeToOnsetRatio(size)!)),
    size,
    Math.floor((Math.random() * size) / 2),
  )
}
