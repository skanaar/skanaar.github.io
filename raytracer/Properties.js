import { useForceUpdate, useEvent, el } from '../assets/system.js';
import { app } from '../Raytracer.js';

export function Properties() {
  const [selected, setSelected] = React.useState(null)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'select_object', (obj) => setSelected(obj))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'add_transform', (kind) => {
    if (!selected) return
    let val = (kind == 'scale') ? 1 : 0
    selected.transforms.push({ kind, x: val, y: val, z: val })
    app.trigger('scene_modified')
  })

  if (!selected) return null

  return el(
    'obj-props',
    {},
    el('style', {},
      `obj-props { display: block }
      obj-props input { width: 64px }
      obj-props input[type='number'] { -moz-appearance: textfield }
      obj-props input::-webkit-outer-spin-button,
      obj-props input::-webkit-inner-spin-button { -webkit-appearance: none }`),
    selected
      .transforms
      ?.map((e,i) => el(TransformInput, {
        key: JSON.stringify(e),
        first: i == 0,
        last: selected.transforms.at(-1) == e,
        onUp: () => {
          let [extracted] = selected.transforms.splice(i, 1)
          selected.transforms.splice(i-1, 0, extracted)
          app.trigger('scene_modified')
        },
        onDown: () => {
          let [extracted] = selected.transforms.splice(i, 1)
          selected.transforms.splice(i+1, 0, extracted)
          app.trigger('scene_modified')
        },
        transform: e,
        name: e.kind,
      })),
  )
}

export function TransformInput({ transform, name, last, first, onUp, onDown }) {
  const [selected, setSelected] = React.useState(null)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'select_object', (obj) => setSelected(obj))
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (field) => (event) => {
    transform[field] = event.target.value
    app.trigger('scene_modified')
  }

  return el(
    'transform-input',
    {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr auto auto',
        alignItems: 'center',
        justifyItems: 'center',
      }
    },
    el('span', {}, name),
    el('span', {}, 'X'),
    el('input', { type: 'number', value: transform.x, onChange: update('x') }),
    el('span', {}, 'Y'),
    el('input', { type: 'number', value: transform.y, onChange: update('y') }),
    el('span', {}, 'Z'),
    el('input', { type: 'number', value: transform.z, onChange: update('z') }),
    first
      ? el('button', { className: 'btn small', style: { padding: 1 }}, ' ')
      : el('button', {
        className: 'btn small',
        onClick: onUp,
        style: { padding: 1 }
      }, '↑'),
    last
      ? el('button', { className: 'btn small', style: { padding: 1 }}, ' ')
      : el('button', {
        className: 'btn small',
        onClick: onDown,
        style: { padding: 1 }
      }, '↓')
  )
}
