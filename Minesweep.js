import { el, App, Button } from './assets/system.js'

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

const icon = 'bomb.svg'
export const app = new App('Minesweep', Minesweep, icon, [150, 50], 'autosize')

export function Minesweep() {
  const [field, setField] = React.useState(null)
  const [gameSpec, setGameSpec] = React.useState(null)
  const sizePicker = React.useRef()
  const [state, setState] = React.useState('menu')

  function startGame() {
    const spec = JSON.parse(sizePicker.current.value)
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
        el(
          'select',
          { ref: sizePicker },
          el('option', { value: '{"size":5, "mines":4}' }, '5 ✕ 5'),
          el('option', { value: '{"size":7, "mines":10}' }, '7 ✕ 7'),
          el('option', { value: '{"size":10, "mines":20}' }, '10 ✕ 10'),
        ),
        el(Button, { onClick: startGame }, 'Start'),
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

  function render() {
    setCounter((i) => i + 1)
  }

  function isFieldCleared() {
    return field
      .flatMap((e) => e)
      .every((cell) => cell.open || cell.item === 'mine')
  }

  function clearCell(i, j) {
    openCell(field, i, j)
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
            },
            onClick: () => {
              if (disabled) return
              clearCell(i, j)
            },
            disabled: cell.open,
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
mine-field:not(.disabled) button:hover:not([disabled]) {
  background-color: #000;
  color: #fff;
}
mine-field button:disabled {
  color: inherit;
  border-color: transparent;
}
mine-field:not(.disabled) button:active:not([disabled]) {
  color: #fff;
  background-color: #000;
}
`
