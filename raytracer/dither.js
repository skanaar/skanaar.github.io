import { hilbert } from '../Hilbert.js'
import { clamp, generateRowByRowCoordinates, Vec } from './math.js'

export class HilbertDitherer {
  cursor = 0
  errorBuffer = new Array(32).fill(0)
  errorWeight = new Array(32).fill(0).map((_,i) => Math.pow(1/8, i/31)/13.6)
  coordinates = function * (size) {
    for (let [i,j] of hilbert([0, 0], [size-1, 0], size)) yield Vec(i,j,0)
  }
  apply(value) {
    let len = this.errorBuffer.length
    this.cursor = (this.cursor + 1) % len
    let adjustedValue = value - this.errorBuffer[this.cursor]
    let clamped = adjustedValue > 0.5 ? 1 : 0
    this.errorBuffer[this.cursor] = 0
    let deviation = (clamped - adjustedValue)
    for (let n = 0; n < len; n++)
      this.errorBuffer[(n+this.cursor) % len] += deviation * this.errorWeight[n]
    return clamped
  }
}

export class FloydSteinbergDitherer {
  cursor = 0
  errorBuffer = []
  coordinates(size) {
    this.errorBuffer = [new Array(size).fill(0), new Array(size).fill(0)]
    return generateRowByRowCoordinates(size)
  }
  apply(value, { x: i, y: j }) {
    if (i === 0){
      let [a, b] = this.errorBuffer
      this.errorBuffer = [b, a.map(() => 0)]
    }
    let [currentRow, nextRow] = this.errorBuffer
    const valueWithDiffusedError = clamp(value + currentRow[i], 0, 1)
    let clamped = (valueWithDiffusedError) > 0.5 ? 1 : 0
    let deviation = (valueWithDiffusedError - clamped) / 16
    if (i+1 < currentRow.length) currentRow[i+1] += deviation * 7
    if (i-1 > 0) nextRow[i-1] += deviation * 3
    nextRow[i] += deviation * 5
    if (i+1 < nextRow.length) nextRow[i+1] += deviation * 1
    return clamped
  }
}

export class NoiseDitherer {
  cursor = 0
  noise = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
  coordinates = generateRowByRowCoordinates
  apply(value) {
    this.cursor = (this.cursor + 1) % this.noise.length
    return (value > this.noise[this.cursor]) ? 1 : 0
  }
}

export class NoDitherer {
  cursor = 0
  noise = [0.17, 0.75, 0.43, 0.55, 0.56, 0.70, 0.88]
  coordinates = generateRowByRowCoordinates
  apply(value) {
    return value
  }
}
