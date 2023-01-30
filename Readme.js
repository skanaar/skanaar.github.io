import { el, App } from './assets/system.js'

export const app = new App('Readme', Readme, 'file.svg', [300, 300])

export function Readme() {
  return el(
    'div',
    {},
    el('h2', {}, 'Daniel Kallin'),
    el(
      'p',
      { className: 'stack' },
      el('h2', {}, 'Links'),
      el('a', { href: "http://www.rymdmotor.se" }, 'rymdmotor ab'),
      el('a', { href: "https://www.linkedin.com/in/danielkallin" }, 'linkedin'),
      el('a', { href: "daniel/cv.html" }, 'résumé'),
      el('h2', {}, 'Projects'),
      el('a', { href: "http://www.nomnoml.com" }, 'nomnoml.com'),
      el('a', { href: "http://www.rymdmotor.se/nebula-sky" }, 'nebula sky'),
      el('a', { href: "deimos/editor.html#models" }, 'deimos'),
      el('a', { href: "fin-script" }, 'fin-script'),
      el('a', { href: "cytank" }, 'cytank'),
    ),
  )
}
