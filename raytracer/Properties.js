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

  return el(
    'obj-props',
    {},
    el('style', {},
      `obj-props {
        display: grid;
        grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
        align-items: center;
        justify-items: center;
      }
      obj-props input { width: 64px }
      obj-props input[type='number'] { -moz-appearance: textfield }
      obj-props input::-webkit-outer-spin-button,
      obj-props input::-webkit-inner-spin-button { -webkit-appearance: none }`),
    selected.material ? el(MaterialProperties, { object: selected }) : null,
    selected.kind == 'light' ? el(LightProperties, { light: selected }) : null,
    el(TransformInput, { name:'Offset', transform:selected.transforms.offset }),
    el(TransformInput, { name:'Rotate', transform:selected.transforms.rotate }),
    el(TransformInput, { name:'Scale', transform:selected.transforms.scale })
  )
}

export function TransformInput({ transform, name }) {
  const forceUpdate = useForceUpdate()
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (field) => (event) => {
    transform[field] = event.target.value
    app.trigger('scene_modified')
  }

  return el(
    React.Fragment,
    {},
    el('span', {}, name),
    el('span', {}, 'X'),
    el('input', { type: 'number', value: transform.x, onChange: update('x') }),
    el('span', {}, 'Y'),
    el('input', { type: 'number', value: transform.y, onChange: update('y') }),
    el('span', {}, 'Z'),
    el('input', { type: 'number', value: transform.z, onChange: update('z') })
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
    el('div', {}),
    el('input', { type: 'number', value: light.amount, onChange: update }),
    el('div', {}),
    el('div', {}),
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
    el('div', {}),
    el('select', { value: object.material, onChange: update },
      el('option', {}, 'diffuse'),
      el('option', {}, 'mirror'),
    ),
    el('div', {}),
    el('div', {}),
    el('div', {}),
    el('div', {})
  )
}
