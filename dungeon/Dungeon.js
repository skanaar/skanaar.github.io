import { el, App, Button, useEvent } from '../assets/system.js'
import { DungeonGame } from './DungeonGame.js'
import { World } from './World.js'
import { files } from './file-system.js'

let game = new DungeonGame(new World(files['world']))

const icon = 'arch.svg'
export const app = new App('Dungeon', Dungeon, icon, [375, 500], 'noresize')
app.addMenu('World', { title: 'Reload world', event: 'reload', arg: null })

const frameMs = 20

export function Dungeon() {
  const [state, setState] = React.useState('')
  useEvent(app, 'reload', () => {
    game = new DungeonGame(new World())
  })

  React.useEffect(() => {
    const handler = (event) => {
      switch(event.key) {
        case "ArrowLeft": return game.turn(90)
        case "ArrowRight": return game.turn(-90)
        case "ArrowUp": return game.walk(1)
        case "ArrowDown": return game.walk(-1)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  })

  React.useEffect(() => {
    const handle = setInterval(() => {
      game.update(frameMs/1000)
      const { x, y, rot, message, dialog, inventory: inv, dialogAnswers } = game
      const newState = `${x} ${y} ${rot} ${message} ${inv.map(e => e.name)} ${dialog} ${dialogAnswers}`
      if (state != newState) setState(newState)
    }, frameMs)
    return () => clearInterval(handle)
  })

  const mesh = game.mesh()

  return (
    el('dungeon-crawler', {},
      el('style', {}, style),
      el('svg',
        { className: 'canvas-3d', viewBox: '0 0 400 300' },
        mesh.map((e, i) => el('path', {
          key: `m${i}`,
          d: quadPath(e),
          fill: `rgb(${rund(e[4])}, ${rund(e[4])}, ${rund(e[4])})`,
        } ))
      ),
      game.dialog && el('dialog-panel', {}, game.dialog),
      el('hr'),
      el('message-panel', {}, game.message ?? '-'),
      el('hr'),
      game.dialog ? el('game-buttons', {},
        ...game.dialogAnswers.map((text, i) => el(Button, { onClick: () => game.respond(text, i) }, text)),
      )
      : el('game-buttons', {},
        el(Button, { onClick: () => game.inspect() }, 'inspect'),
        el(Button, { onClick: () => game.walk(1) }, '↑'),
        el(Button, { onClick: () => game.take() }, 'take'),
        el(Button, { onClick: () => game.turn(90) }, '←'),
        el(Button, { onClick: () => game.walk(-1) }, '↓'),
        el(Button, { onClick: () => game.turn(-90) }, '→'),
        el(Button, { onClick: () => game.interact() }, 'interact'),
      ),
      el('hr'),
      el(
        'inventory-panel',
        {},
        game.inventory.map(e =>
          el(React.Fragment, { key: e.name },
            el('label', {}, e.name),
            e.effect ? el(Button, { onClick: () => game.use(e) }, 'use') : el('div')
          )
        )
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
  display: flex;
  flex-direction: column;
  position: relative;
}
dungeon-crawler svg {
  display: block;
  background: linear-gradient(to top, #eee, #000, #eee)
}
dungeon-crawler .canvas-3d {
  display: block;
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

dungeon-crawler hr {
  height: 2px;
  border: none;
  background: #000;
  margin: 0;
}

dungeon-crawler message-panel {
  display: block;
  padding: 10px;
}
dungeon-crawler dialog-panel {
  position: absolute;
  display: block;
  top: 10px;
  left: 10px;
  right: 10px;
  background: #fff;
  border: 2px solid #000;
  padding: 10px;
  border-radius: 4px;
}
dungeon-crawler inventory-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  margin: 5px 10px;
}
dungeon-crawler inventory-panel label {
  align-self: center;
}

dungeon-crawler game-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 10px;
  gap: 5px;
}`
