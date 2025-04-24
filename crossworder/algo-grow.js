import { Vec, Vertical, Horizontal, isEmpty, isBlock } from './wordgrid.js'

export function* generateGrown(words, grid) {
  var size = grid.size
  grid.fill({ x: 0, y: 0, width: 1, height: size })
  grid.fill({ x: 0, y: 0, width: size, height: 1 })
  for(var area of grid.reserved) {
    grid.fill({ x: area.x, y: area.y, width: area.width+1, height: area.height+1 })
  }

  for (var p of diagonally(size)) {
    if (isEmpty(grid.get(p))) {
      findAndPlaceWord(words, grid, Horizontal, p)
      findAndPlaceWord(words, grid, Vertical, p)
    }
  }

  yield grid
}

function findAndPlaceWord(words, grid, direction, p) {
  var loc = findSeedPoint(grid, direction, p)
  if (loc) {
    for (var word of findMatchingWords(words, grid, direction, loc)) {
      if (!placeWordOnGrid(words, grid, direction, word, loc)) {
        return false
      }
    }
  }
  return true
}

function findSeedPoint(grid, direction, p) {
  for (var i=1; i<grid.size; i++) {
    var loc = direction(p, -i)
    if (isBlock(grid.get(loc)))
      return loc
  }
  return null
}

function* findMatchingWords(words, grid, direction, p) {
  for (var word of words)
    if (grid.words.every(e => e.word !== word))
      if (grid.try(direction, word, p))
        yield word
}

function placeWordOnGrid(words, grid, direction, word, p) {
  grid.place(direction, word, grid.words.length+1, p)
  for (var i=1; i<word.length+1; i++) {
    var loc = direction(p, i)
    if (grid.get(loc).intersection) continue
    if (!findAndPlaceWord(words, grid, direction.perpendicular, loc)) {
      grid.removeLastWord()
      return false
    }
  }
  return true
}

export function* diagonally(size) {
  var x = 0
  var y = 0
  while(y < size) {
    yield Vec(x, y)
    x++
    y--
    if (y < 0) {
      y = x
      x = 0
    }
  }
  while(!(x == size-1 && y == size-1)) {
    x++
    y--
    if (x == size) {
      x = y+2
      y = size-1
    }
    yield Vec(x, y)
  }
}
