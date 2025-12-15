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
    selected.transforms.push({ kind, id: Date.now(), x: val, y: val, z: val })
    app.trigger('scene_modified')
  })

  if (!selected) return null

  let trns = selected.transforms

  return el(
    'obj-props',
    {},
    el('style', {},
      `obj-props {
        display: grid;
        grid-template-columns: 70px 1fr 1fr 1fr;
        align-items: center;
        justify-items: start;
        margin: 2px 5px;
      }
      obj-props input { width: 64px }
      obj-props input[type='number'] { -moz-appearance: textfield }
      obj-props input::-webkit-outer-spin-button,
      obj-props input::-webkit-inner-spin-button { -webkit-appearance: none }`),
    selected.material ? el(MaterialProperties, { object: selected }) : null,
    selected.kind == 'light' ? el(LightProperties, { light: selected }) : null,
    el(TransformInput, { name:'Offset', step: 1, transform: trns.offset }),
    el(TransformInput, { name:'Rotate', step: 1, transform: trns.rotate }),
    el(TransformInput, { name:'Scale', step: 0.1, transform: trns.scale })
  )
}

export function TransformInput({ transform: tr, name, step }) {
  const forceUpdate = useForceUpdate()
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (field) => (event) => {
    tr[field] = event.target.value
    app.trigger('scene_modified')
  }

  return el(
    React.Fragment,
    {},
    el('span', {}, name),
    el('input', { type: 'number', value: tr.x, step, onChange: update('x') }),
    el('input', { type: 'number', value: tr.y, step, onChange: update('y') }),
    el('input', { type: 'number', value: tr.z, step, onChange: update('z') })
  )
}

function LightProperties({ light }) {
  const forceUpdate = useForceUpdate()
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (event) => {
    light.amount = event.target.value
    app.trigger('scene_modified')
  }

  return el(
    React.Fragment,
    {},
    el('span', {}, 'intensity'),
    el('input', { type: 'number', value: light.amount, onChange: update }),
    el('div', {}),
    el('div', {})
  )
}

function MaterialProperties({ object }) {
  const forceUpdate = useForceUpdate()
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (event) => {
    object.material = event.target.value
    app.trigger('scene_modified')
  }

  return el(
    React.Fragment,
    {},
    el('span', {}, 'material'),
    el('select', {
        value: object.material,
        onChange: update,
        style: { gridColumn: '2 / span 3', alignSelf: 'start' }
      },
      el('option', {}, 'diffuse'),
      el('option', {}, 'mirror'),
    )
  )
}
