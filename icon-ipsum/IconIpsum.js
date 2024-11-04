import { dist, add, diff, mult, normalize, rot } from './Vec.js'
import { templates } from './templates.js'
import { patches } from './patches.js'
import { borders } from './borders.js'
import { get, random } from './random.js'

export class IconIpsum {
  offset = 0
  options = {}

  constructor(options = {}) {
    this.options = options
    this.parts = [...borders(), ...patches()]
  }

  seed(seed) {
    this.offset = seed
    return this
  }

  icon(templateName) {
    let { width = 24, height = 24, stroke = '#000', strokeWidth = 1 } = this.options
    function requireTags(required, item) {
      if (!required) return true
      return required.split(' ').every((e) => item.tags.split(' ').includes(e))
    }
    function forbidTags(forbidden, item) {
      if (!forbidden) return true
      return forbidden.split(' ').every((e) => !item.tags.split(' ').includes(e))
    }
    let filteredTemplates = templateName
      ? templates.filter((e) => e.name === templateName)
      : templates
    if (filteredTemplates.length === 0) throw new Error('unknown template name')
    let template = get(filteredTemplates, this.offset)
    let bulkheads = template.edges.map(({ only, not }, i) =>
      get(
        this.parts.filter((item) => requireTags(only, item) && forbidTags(not, item)),
        i + random(1, this.parts.length)
      )
    )
    let svgElements = template.edges.flatMap((edge, i) => {
      let { name, lines } = bulkheads[i]
      return edge.lines.flatMap(({ start, end }) => {
        let height = dist(start, end)
        return lines.map((line) => svgPath(name, stretchBetween(line, start, end, height)))
      })
    })
    this.offset += svgElements.length
    const svg =
      `<svg width="${width}" height="${height}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">` +
      `<desc>${template.name} ${bulkheads.map((e) => e.name).join()}</desc>` +
      `<g stroke="${stroke}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
      svgElements.join('') +
      '</g>' +
      '</svg>'
    return svg
  }

  iconDataUri(segments) {
    return 'data:image/svg+xml,' + encodeURIComponent(this.icon(segments))
  }
}

function stretchBetween(path, start, end, height) {
  let dir = diff(end, start)
  let trans = mult(normalize(rot(dir)), height)
  return path.map((p) => add(start, add(mult(dir, p.x), mult(trans, p.y))))
}

function svgPath(name, points) {
  let d = 'M' + points.map(({ x, y }) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')
  return `<path data-name="${name}" d="${d}" />`
}
