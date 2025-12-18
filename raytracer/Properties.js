import { useForceUpdate, useEvent, el } from '../assets/system.js';
import { app } from '../Raytracer.js';

export function Properties() {
  const [selected, setSelected] = React.useState(null)
  const [objects, setObjects] = React.useState([])
  const forceUpdate = useForceUpdate()
  useEvent(app, 'select_object', (obj) => setSelected(obj))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'update_scene', (objs) => setObjects(objs))

  if (!selected) return null

  let trns = selected.transforms

  return el(
    'obj-props',
    {},
    el('style', {},
      `obj-props {
        display: grid;
        grid-template-columns: 80px 1fr 1fr 1fr;
        align-items: center;
        justify-items: start;
        margin: 2px 5px;
      }
      obj-props input { width: 64px }
      obj-props input[type='number'] { -moz-appearance: textfield }
      obj-props input::-webkit-outer-spin-button,
      obj-props input::-webkit-inner-spin-button { -webkit-appearance: none }`),
    selected.material ? el(MaterialField, { object: selected }) : null,
    selected.kind == 'light' ? el(LightField, { light: selected }) : null,
    selected.kind == 'instance'
      ? el(InstanceField, { instance: selected, objects })
      : null,
    el(TransformInput, { name:'Offset', step: 1, transform: trns.offset }),
    el(TransformInput, { name:'Rotate', step: 1, transform: trns.rotate }),
    el(TransformInput, { name:'Scale', step: 0.1, transform: trns.scale })
  )
}

export function TransformInput({ transform: tr, name, step }) {
  const update = (field) => (event) => {
    tr[field] = +event.target.value
    app.trigger('scene_modified')
  }

  return el(React.Fragment, {},
    el('span', {}, name),
    el('input', { type: 'number', value: tr.x, step, onChange: update('x') }),
    el('input', { type: 'number', value: tr.y, step, onChange: update('y') }),
    el('input', { type: 'number', value: tr.z, step, onChange: update('z') })
  )
}

function LightField({ light }) {
  const update = (event) => {
    light.amount = event.target.value
    app.trigger('scene_modified')
  }

  return el(React.Fragment, {},
    el('span', {}, 'Intensity'),
    el('input', { type: 'number', value: light.amount, onChange: update }),
    el('div', {}),
    el('div', {})
  )
}

const span3col = { gridColumn: '2 / span 3', alignSelf: 'start' }

function InstanceField({ instance, objects }) {
  const update = (event) => {
    instance.ref = event.target.value
    app.trigger('scene_modified')
  }

  return el(React.Fragment, {},
    el('span', {}, 'Template'),
    el('select', { value: instance.ref, onChange: update, style: span3col },
      el('option', {}, ''),
      objects
        .filter(e => e != instance)
        .filter(e => e.kind !== 'light')
        .filter(e => e.kind !== 'camera')
        .map(e => el('option', {}, e.name ?? e.kind))
    )
  )
}

function MaterialField({ object }) {
  const update = (event) => {
    object.material = event.target.value
    app.trigger('scene_modified')
  }

  return el(React.Fragment, {},
    el('span', {}, 'Material'),
    el('select', { value: object.material, onChange: update, style: span3col },
      el('option', {}, 'diffuse'),
      el('option', {}, 'mirror'),
    )
  )
}
