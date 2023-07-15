import { el, App, Button } from './assets/system.js'
import { DungeonGame } from './dungeon/DungeonGame.js'

const game = new DungeonGame()

const icon = 'arch.svg'
export const app = new App('Dungeon', Dungeon, icon, [400, 295], 'noresize')

const frameMs = 20

export function Dungeon() {
  const [state, setState] = React.useState('')
  
  React.useEffect(() => {
    const handler = (event) => game.input(event.key)
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })
  
  React.useEffect(() => {
    const handle = setInterval(() => {
      game.update(frameMs/1000)
      const newState = `${game.x} ${game.y} ${game.rot}`
      if (state != newState) setState(newState)
    }, frameMs)
    return () => clearInterval(handle)
  })

  const mesh = game.mesh()

  return (
    el('dungeon-crawler', {},
      el('style', {}, style),
      el('svg', {
        className: 'canvas-3d',
        viewBox: '0 0 400 300'
      },
        mesh.map((e, i) => el('path', {
          key: `m${i}`,
          d: quadPath(e),
          fill: `rgb(${rund(-e[3][2]*15)}, ${rund(-e[3][2]*15)}, ${rund(-e[3][2]*15)})`,
        } )),
      ),
      
      game.message ? el('message-dialog', {}, game.message) : null,

      el('footer', {},
        `${Math.round(game.x)},${Math.round(game.y)} | ${Math.round(game.rot)}`,
        el(Button, { className: 'small', onClick: () => game.turn(90) }, '←'),
        el(Button, { className: 'small', onClick: () => game.walk(1) }, '↑'),
        el(Button, { className: 'small', onClick: () => game.turn(-90) }, '→'),
        el(Button, { className: 'small', onClick: () => game.inspect() }, 'inspect'),
      ),
    )
  )
}

function quadPath([a,b,c,d]) {
  return `M${rund(a[0])},${rund(a[1])} L${rund(b[0])},${rund(b[1])} L${rund(c[0])},${rund(c[1])} L${rund(d[0])},${rund(d[1])} Z`
}

function rund(x) {
  return Math.round(x)
}


const style = `
dungeon-crawler {
  position: relative;
}
dungeon-crawler svg { display: block; background: linear-gradient(to top, #eee, #000, #eee) }
dungeon-crawler footer {
  display: flex;
  justify-content: space-between;
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
}
dungeon-crawler .canvas-3d {
  display: block;
  margin: -10px;
}
dungeon-crawler svg.canvas-3d path {
  stroke-linejoin: bevel;
  stroke-width: 1px;
  stroke: #000;
}
dungeon-crawler svg.canvas-3d path.outline {
  stroke: #000;
  stroke-width: 1px;
  stroke-dasharray: 1 5;
}
dungeon-crawler message-dialog {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border: 2px solid black;
  padding: 20px;
}`