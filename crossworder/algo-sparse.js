import { Vec, Vertical, Horizontal, isBlock, isLetter} from './wordgrid.js'

function shuffle(list) {
  var input = [...list]
  var result = []
  while(input.length) {
    var i = Math.floor(input.length*Math.random())
    result.push(input[i])
    input.splice(i, 1)
  }
  return result
}

export function randomizeWords({ mandatory, fillers }) {
  return [
    ...shuffle(mandatory.filter(e => e)),
    ...shuffle(fillers)
      .filter(e => e)
      .sort((a,b) => a.length < b.length)
  ]
}

export function* generateSparse(words, grid) {
  var size = grid.size
  var number = 1
  var [first, ...tail] = words.filter(e => e.length + 2 <= size)

  grid.place(Horizontal, first, number++, Vec(Math.floor((size-first.length-2)/2), Math.floor(size/2)))

  var isVertical = true
  for(var word of tail){
    if (isVertical){
      let p = find_v(word, 2, 1)
      if (p) {
        grid.place(Vertical, word, number++, p)
        yield grid
        isVertical = !isVertical
      }
    } else {
      let p = find_h(word, 2, 1)
      if (p) {
        grid.place(Horizontal, word, number++, p)
        yield grid
        isVertical = !isVertical
      }
    }
  }

  function find_v(word, modulo = 1, offset = 0) {
    for (var i=offset; i<size-1; i+=modulo)
      for (var j=0; j<size-word.length; j++)
        if ((isBlock(grid.get(Vec(i,j)))) || [].some.call(word, (_,l) => isLetter(grid.grid[j+l+1][i])))
          if (grid.try(Vertical, word, Vec(i,j)))
            return Vec(i,j)
    return false
  }

  function find_h(word, modulo = 1, offset = 0) {
    for (var i=0; i<size-word.length; i++)
      for (var j=offset; j<size-1; j+=modulo)
        if ((isBlock(grid.get(Vec(i,j)))) || [].some.call(word, (_,l) => isLetter(grid.grid[j][i+l+1])))
          if (grid.try(Horizontal, word, Vec(i,j)))
            return Vec(i,j)
    return false
  }
}
