import { isBlock } from './wordgrid.js'

export function ascii(grid) {
  return grid.grid.map(e => e.map(e => e?e:' ').join(' ')).join('\n')
}

export function renderSvg(wordgrid, { scale = 20, answer = false }) {
  var padding = scale/5
  var z = scale

  function renderBox(i, j){
    return `<rect x="${z*i}" y="${z*j}" width="${z}" height="${z}" />`
  }

  function renderLetter(i, j, cell){
    return `<text x="${z*i+z/2}" y="${z*j+z-padding}">${cell.letter.toUpperCase()}</text>`
  }

  function renderBlock(i, j, cell){
    var pad = z/10
    var clueh = cell.clues.horizontal
      ? `<text x="${z*i+z-pad}" y="${z*j+z/2}" class="clue-h">${cell.clues.horizontal}</text>`
      : ''
    var cluev = cell.clues.vertical
      ? `<text x="${z*i+pad}" y="${z*j+z-pad}" class="clue-v">${cell.clues.vertical}</text>`
      : ''
    return `
      <rect x="${z*i}" y="${z*j}" width="${z}" height="${z}" class="solid" />
      ${clueh}
      ${cluev}`
  }

  function renderCell(cell, i, j) {
    if (!cell) return ''
    if (isBlock(cell)) return renderBlock(i, j, cell)
    if (answer) return renderBox(i, j) + renderLetter(i, j, cell)
    return renderBox(i, j)
  }

  function renderArea({ x, y, width, height, image }) {
    return (image ? `<image href="${image}" width="${width*z}" height="${height*z}"/>` : '') +
      `<rect class="reserved ${image ? 'border' : ''}" x="${z*x}" y="${z*y}" width="${width*z}" height="${height*z}" fill="#fff" />`
  }

  var elements = []
  for (var i=0; i<wordgrid.size; i++)
    for (var j=0; j<wordgrid.size; j++)
      elements.push(renderCell(wordgrid.get({x:i,y:j}), i, j))

  var attrs = 'version="1.1" baseProfile="full" xmlns="http://www.w3.org/2000/svg"'
  var viewBox = `-1 -1 ${wordgrid.size*z+2} ${wordgrid.size*z+2}`

  return `<svg ${attrs} crossword="crossword" viewBox="${viewBox}">
  <style>
    [crossword] rect { fill:none; stroke:#000; stroke-width: 4px; }
    [crossword] rect.reserved { fill:#fff; }
    [crossword] rect.reserved.border { fill:#0000; }
    [crossword] .solid { fill:#000 }
    [crossword] path { fill:#fff }
    [crossword] text { fill: #000; text-anchor: middle; font-family: sans-serif; font-size: ${z*0.8}px; font-weight: bold; }
    [crossword] text.clue-h { text-anchor: end; fill: #fff; font-size: ${z*0.4}px }
    [crossword] text.clue-v { text-anchor: start; fill: #fff; font-size: ${z*0.4}px }
  </style>
  ${elements.join('')}
  ${wordgrid.reserved.map(renderArea).join('')}
  </svg>`
}
