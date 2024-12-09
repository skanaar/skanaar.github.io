import { DitherImage } from './assets/DitherImage.js'
import { el, App } from './assets/system.js'

export const app = new App('Readme', Readme, 'file.svg')
app.resizable([300, 400])

export function Readme() {
  const [exp, setExp] = React.useState(0)
  return el(
    'div',
    { className: 'padded', onClick: () => setExp(exp-0.1) },
    el('h2', {}, 'Daniel Kallin'),
    el(DitherImage, {
      src: '../daniel/autumn.jpg',
      width: 200,
      height: 200,
      exposure: exp
    }),
    el('h2', {}, 'Links'),
    el('p', { className: 'stack' },
      el('a', { href: "http://www.rymdmotor.se" }, 'rymdmotor ab'),
      el('a', { href: "https://github.com/skanaar" }, 'github profile'),
      el('a', { href: "https://www.linkedin.com/in/danielkallin" }, 'linkedin'),
      el('a', { href: "daniel/cv.html" }, 'résumé')
    ),
    el('h2', {}, 'Projects'),
    el('p', { className: 'stack' },
      el('a', { href: "http://www.nomnoml.com" }, 'nomnoml.com'),
      el('a', { href: "https://gissa-krogen.vercel.app/" }, 'Gissa Krogen'),
      el('a', { href: "http://www.rymdmotor.se/nebula-sky" }, 'nebula sky'),
      el('a', { href: "deimos/editor.html#models" }, 'deimos'),
      el('a', { href: "fin-script" }, 'fin-script'),
      el('a', { href: "cytank" }, 'cytank'),
    ),
  )
}
