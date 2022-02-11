export function shuffle(array: any[]) {
  let currentIndex: number = array.length
  let randomIndex: number

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

console.log("!!!!@")

export function partition(array: any[], chunkSize: number) {
  return Array(Math.ceil(array.length / chunkSize))
    .fill(undefined)
    .map((_, index) => index * chunkSize)
    .map((begin) => array.slice(begin, begin + chunkSize))
}

export function bresenhamEuclidean(
  onsets: number,
  pulses: number,
  shift: number = 0,
): number[] {
  let slope = onsets / pulses
  var result = []
  var previous: number | null = null
  for (let i of Array(pulses)
    .fill(undefined)
    .map((_, i) => i)) {
    let current = Math.floor(i * slope)
    result.push(current != previous ? 1 : 0)
    previous = current
  }
  const start = result.splice(0, shift)
  return [...result, ...start]
}

export function choose(opts: any[]) {
  return opts[Math.floor(opts.length * Math.random())]
}
