function seq(size, factory) {
  return Array(size).fill(0).map(factory)
}

export function Vec(x,y) { return {x,y} }

export const Vertical = (p, offset) => Vec(p.x, p.y+offset)
Vertical.id = 'vertical'
export const Horizontal = (p, offset) => Vec(p.x+offset, p.y)
Horizontal.id = 'horizontal'
Vertical.perpendicular = Horizontal
Horizontal.perpendicular = Vertical
const offsets = { vertical: Vertical, horizontal: Horizontal }

export function isEmpty(c) { return c === null }
export function isBlock(c) { return c && !!c.clues }
export function isLetter(c) { return c && ('string' == typeof c.letter) }
export function isMatch(c, letter) { return c.letter === letter }

export function Empty() { return null }
export function Block() {
  return {
    clues: { horizontal: null, vertical: null },
    uses: 0,
  }
}
export function Letter(letter) {
  return {
    letter,
    intersection: false
  }
}

export class WordGrid {
  constructor(size) {
    this.size = size
    this.grid = seq(size, () => seq(size, () => Empty()))
    this.words = []
    this.reserved = []
  }
  
  reserve({ x, y, width, height, image }) {
    this.reserved.push({ x, y, width, height, image })
    this.fill({ x, y, width: width, height: height })
  }
  
  fill({ x, y, width, height }) {
    for (let i=x; i<x+width; i++)
      for (let j=y; j<y+height; j++){
        this.grid[j][i] = Block()
        this.grid[j][i].uses++
      }
  }

  get(p) {
    return this.grid[p.y][p.x]
  }
  
  set(p, value) {
    this.grid[p.y][p.x] = value
  }
  
  setIntersection(p, intersecting) {
    this.grid[p.y][p.x].intersection = intersecting
  }

  try(direction, word, p) {
    var end = direction(p, word.length+1)
    if (end.y >= this.size) return false
    if (end.x >= this.size) return false
    if (p.y < 0) return false
    if (p.x < 0) return false
    var start = this.get(p)
    if (!(isEmpty(start) || isBlock(start))) return false
    var last = direction(p, word.length+1)
    if (isLetter(this.get(last))) return false
    for (var k=0; k<word.length; k++) {
      var cell = this.get(direction(p, k+1))
      if (isEmpty(cell) || (isLetter(cell) && isMatch(cell, word[k])))
        continue
      else
        return false
    }
    return true
  }

  place(direction, word, number, p) {
    this.words.push({ word, loc: p, direction: direction.id })
    if (isEmpty(this.get(p))){
      this.set(p, Block())
    }
    this.get(p).clues[direction.id] = number
    this.get(p).uses++

    for (var k=0; k<word.length; k++) {
      var loc = direction(p, k+1)
      if (isLetter(this.get(loc)))
        this.setIntersection(loc, true)
      else
        this.set(loc, Letter(word[k]))
    }

    var end = direction(p, word.length+1)
    if (isEmpty(this.get(end))) {
      this.set(end, Block())
    }
    this.get(end).uses++
  }

  removeLastWord() {
    if (this.words.length === 0) return
    var { word, direction, loc } = this.words.pop()
    var offset = offsets[direction]

    var start = this.get(loc)
    start.clues[direction] = null
    start.uses--
    if (start.uses == 0) this.set(loc, Empty())

    for (var k=0; k<word.length; k++) {
      var p = offset(loc, k+1)
      if (this.get(p).intersection)
        this.setIntersection(p, false)
      else
        this.set(p, Empty())
    }

    var endLoc = offset(loc, word.length+1)
    var end = this.get(endLoc)
    end.uses--
    if (end.uses == 0) this.set(endLoc, Empty())
  }

  score() {
    var result = 0
    for (var i=0; i<this.size; i++)
      for (var j=0; j<this.size; j++)
        result += isLetter(this.grid[j][i]) ? 1 : 0
    return result
  }
}
