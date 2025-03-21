import { el, App, Button, useEvent } from './assets/system.js'

function seq(count) {
  return [...new Array(count)].map((_, i) => i)
}
function grid(w, h, factory) {
  return seq(w).map(() => seq(h).map(factory))
}

function* neighbors(field, i, j) {
  const w = field.length
  const h = field[0].length
  for (let i2 = Math.max(0, i - 1); i2 < Math.min(w, i + 2); i2++)
    for (let j2 = Math.max(0, j - 1); j2 < Math.min(h, j + 2); j2++)
      if (!(i2 === i && j2 === j))
        yield { neighbor: field[i2][j2], x: i2, y: j2 }
}

function buildField(w, h, mines) {
  const field = grid(w, h, () => ({ open: false, flag: false, item: 0 }))
  for (let count = 0; count < mines; ) {
    const i = Math.floor(w * Math.random())
    const j = Math.floor(h * Math.random())
    if (field[i][j].item === 'mine') continue
    count++
    field[i][j].item = 'mine'
    for (const { neighbor } of neighbors(field, i, j))
      if (neighbor.item != 'mine') neighbor.item++
  }

  return field
}

function openCell(field, i, j) {
  const cell = field[i][j]
  cell.open = true
  if (cell.item === 0)
    for (const { neighbor, x, y } of neighbors(field, i, j))
      if (neighbor.open === false) openCell(field, x, y)
}

const gameTypes = [
  { name: '5 ✕ 5', arg: { size: 5, mines: 4 } },
  { name: '5 ✕ 5 hard', arg: { size: 5, mines: 5 } },
  { name: '7 ✕ 7', arg: { size: 7, mines: 8 } },
  { name: '7 ✕ 7 hard', arg: { size: 7, mines: 10 } },
  { name: '10 ✕ 10', arg: { size: 10, mines: 15 } },
  { name: '10 ✕ 10 hard', arg: { size: 10, mines: 20 } },
]

export const app = new App('Minesweep', Minesweep, 'bomb.svg')
app.addToAppMenu(...gameTypes.map((e) => (
  { title:`Start ${e.name} game`, event:'newgame', arg:e.arg }
)))

export function Minesweep() {
  const [field, setField] = React.useState(null)
  const [gameSpec, setGameSpec] = React.useState(null)
  const sizePicker = React.useRef()
  const [state, setState] = React.useState('menu')

  useEvent(app, 'newgame', (arg) => startGame(arg))

  function startGame(spec) {
    setGameSpec(spec)
    setField(buildField(spec.size, spec.size, spec.mines))
    setState('game')
  }

  if (state === 'menu')
    return el(
      'mine-sweep',
      {},
      el('style', {}, style),
      el(
        'grid-2col',
        {},
        el('select', { ref: sizePicker }, ...gameTypes.map((e) =>
          el('option', { value: JSON.stringify(e.arg) }, e.name)
        )),
        el(Button, {
          onClick: () => startGame(JSON.parse(sizePicker.current.value))
        }, 'Start'),
      ),
    )

  if (state === 'success')
    return el(
      'mine-sweep',
      {},
      el('style', {}, style),
      el('h2', {}, 'Success!'),
      el('hr'),
      el(MineField, { field, disabled: true }),
    )
  if (state === 'failure')
    return el(
      'mine-sweep',
      {},
      el('style', {}, style),
      el('h2', {}, 'Failure'),
      el('hr'),
      el(MineField, { field, disabled: true }),
    )

  return el(
    'mine-sweep',
    {},
    el('style', {}, style),
    el('h2', {}, gameSpec.mines, ' mines'),
    el('hr'),
    el(MineField, {
      field,
      onFailure: () => setState('failure'),
      onSuccess: () => setState('success'),
    }),
  )
}

export function MineField({ field, disabled = false, onFailure, onSuccess }) {
  const [, setCounter] = React.useState(0)
  const isContextClick = React.useRef(false)

  function render() {
    setCounter((i) => i + 1)
  }

  function isFieldCleared() {
    return field
      .flatMap((e) => e)
      .every((cell) => cell.open || cell.item === 'mine')
  }

  function clickCell(i, j) {
    const cell = field[i][j]
    if (cell.open) {
      let flagCount = 0
      for (let { neighbor } of neighbors(field, i, j))
        if (neighbor.flag) flagCount += 1
      if (flagCount === cell.item) {
        for (let { neighbor, x, y } of neighbors(field, i, j))
          if (!neighbor.open && !neighbor.flag) clickCell(x, y)
      }
    } else {
      openCell(field, i, j)
    }
    if (field[i][j].item === 'mine') onFailure?.()
    else if (isFieldCleared()) onSuccess?.()
    render()
  }

  function flagCell(cell) {
    cell.flag = !cell.flag
    render()
  }

  return el(
    'mine-field',
    {
      style: {
        display: 'grid',
        gridTemplateColumns: seq(field.length)
          .map(() => '1fr')
          .join(' '),
        width: field.length * 30,
      },
      class: disabled ? 'disabled' : undefined,
    },
    field.flatMap((column, i) =>
      column.map((cell, j) =>
        el(
          'button',
          {
            key: `${i},${j}`,
            onContextMenu: (event) => {
              if (disabled) return
              event.preventDefault()
              flagCell(cell)
              // safari fires both contextmenu and click events
              isContextClick.current = true
              setTimeout(() => {
                isContextClick.current = false
              }, 200)
            },
            onClick: () => {
              if (isContextClick.current) return
              if (disabled) return
              clickCell(i, j)
            },
            open: cell.open,
          },
          el(CellSymbol, { cell }),
        ),
      ),
    ),
  )
}

function CellSymbol({ cell }) {
  if (cell.open) {
    if (cell.item === 'mine') return '#'
    if (cell.item === 0) return ''
    return cell.item
  }
  return cell.flag ? 'F' : ''
}

const style = `
mine-sweep {
  display: block;
  padding: 10px;
}
mine-sweep h2 {
  margin: 0;
  text-align: center;
}
mine-field {
  margin: -5px;
}
mine-field.disabled {
  color: #888;
}
mine-field button {
  width: 26px;
  height: 26px;
  appearance: none;
  background-color: #fff;
  border: 2px solid var(--win-color);
  border-radius: 4px;
  padding: 0;
  margin: 2px;
  text-align: center;
  font-weight: bold;
  font-family: inherit;
  font-size: inherit;
}
mine-field.disabled button {
  border-color: #888;
  color: #888;
}
mine-field:not(.disabled) button:hover:not([disabled]):not([open]) {
  background-color: #000;
  color: #fff;
}
mine-field button[open] {
  color: inherit;
  border-color: transparent;
}
mine-field:not(.disabled) button:active:not([disabled]) {
  color: #fff;
  background-color: #000;
}
grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 5px;
  margin: 5px 0;
}
`
