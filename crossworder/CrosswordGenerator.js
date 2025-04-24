import { generateSparse, randomizeWords } from './algo-sparse.js'
import { generateGrown } from './algo-grow.js'
import { renderSvg } from './render.js'
import { ordlista } from './svenska.js'
import { wordlist } from './english.js'
import { Optimizer, timeout } from './optimizer.js'
import { WordGrid } from './wordgrid.js'

export function CrosswordGenerator({ onRender }) {

  var self = {
    wordgrid: null,
    generate,
  }

  async function saveSvg(size) {
    try {
      var scale = 500/size
      var svgSource = renderSvg(self.wordgrid, { scale, answer: false })
      const blob = new Blob([svgSource], {type : 'image/svg+xml'})
      const newHandle = await window.showSaveFilePicker()
      const writableStream = await newHandle.createWritable()
      await writableStream.write(blob)
      await writableStream.close()
    } catch (e) { console.log(e) }
  }

  function blocking(action, onChange = (isBlocked) => {}) {
    var blockable = async () => {
      if (blockable.isBlocked) return
      blockable.isBlocked = true
      try {
        onChange(true)
        await action()
      }
      finally {
        blockable.isBlocked = false
        onChange(false)
      }
    }
    blockable.isBlocked = false
    return blockable
  }

  async function generate(size, [insetx,insety], duration, lang, mandatory) {
    var scale = 500/size
    var inset = [insetx,insety]

    var optimize = Optimizer({
      seconds: duration,
      onProgress(progress) {
        //console.log(`progress: ${progress * 100}%`)
      }
    })

    var wordOptions = {
      sv: ordlista,
      en: wordlist,
      none: [],
      saol: 'saol'
    }
    var words = wordOptions[lang]
    if (words == 'saol') words = await (await fetch('saol.json')).json()

    var algos = {
      sparse: generateSparse,
      grow: generateGrown,
    }

    var algo = algos.sparse
    var insetSize = { width: inset[0], height: inset[1] }

    var grid = await optimize(async function () {
      var wordlist = randomizeWords({ mandatory, fillers: words })
      var grid = new WordGrid(size)
      grid.reserve({ ...insetSize, x: 0, y: 0, image: null })
      var result = null
      for(var step of algo(wordlist, grid)) {
        result = step
        onRender(renderSvg(grid, { scale, answer: true }))
        await timeout(10)
      }
      return result
    })
    self.wordgrid = grid
    console.log('score: ' + grid.score())
    console.log(`usedWords: ${grid.words.map(e => e.word).join(',')}`)
    onRender(renderSvg(grid, { scale, answer: true }))
  }

  return self
}
