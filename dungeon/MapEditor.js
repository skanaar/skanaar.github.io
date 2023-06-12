import { el, App, Button } from '../assets/system.js'
import { files } from './file-system.js'

function seq(count) {
  return [...new Array(count)].map((_, i) => i)
}
function grid(w, h, factory) {
  return seq(w).map(() => seq(h).map(factory))
}

const icon = 'map.svg'
export const app = new App('MapEditor', MapEditor, icon, [520, 400], 'noresize')

export function MapEditor() {
  const { map: field, tiles, entities } = files['world']
  const [, setCounter] = React.useState(0)

  function render() {
    setCounter((i) => i + 1)
  }

  return el(
    'map-editor',
    {
      style: {
        display: 'grid',
        width: '520px',
        height: '400px',
        gridTemplateColumns: '1fr 120px',
      },
    },
    el('style', {}, style),
    el('div', { style: { overflow: 'auto', border: '2px solid black' } },
      el('map-viewport', {
        style: {
          display: 'grid',
          gridTemplateColumns: seq(field.length)
            .map(() => '1fr')
            .join(' '),
          width: field.length * 26,
        }
      },
        field.flatMap((column, i) =>
          [...column].map((cell, j) =>
            el(
              'button',
              {
                key: `${i},${j}`,
                onClick: () => {
                },
                disabled: cell.open,
              },
              cell,
            ),
          ),
        ),
      ),
    ),
    el('div', { style: { overflow: 'auto', padding: '0 10px' } },
      Object.entries(tiles).map(([key, tile]) => el(Button, { key }, `${key} ${tile.name}`)),
      Object.entries(entities).map(([key, e]) => el(Button, { key }, `${key} ${e.name}`)),
    )
  )
}

const style = `
map-editor h2 {
  margin: 0;
  text-align: center;
}
map-editor {
  margin: 5px;
}
map-editor.disabled {
  color: #888;
}
map-editor button {
  width: 26px;
  height: 26px;
  appearance: none;
  background-color: #fff;
  border: 1px dashed var(--win-color);
  border-radius: 0;
  padding: 0;
  text-align: center;
  font-weight: bold;
  font-family: inherit;
  font-size: inherit;
}
map-editor.disabled button {
  border-color: #888;
  color: #888;
}
map-editor:not(.disabled) button:hover:not([disabled]) {
  background-color: #000;
  color: #fff;
}
map-editor button:disabled {
  color: inherit;
  border-color: transparent;
}
map-editor:not(.disabled) button:active:not([disabled]) {
  color: #fff;
  background-color: #000;
}
`
