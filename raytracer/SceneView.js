import { useEvent, el } from '../assets/system.js'
import { app } from '../Raytracer.js'
import { compileObject } from './geometry.js'

function isCompilable(obj) {
  return obj.kind === 'patches' || obj.kind === 'heightmap'
}

export function SceneView() {
  function r(x) { return Math.round(x) }
  const [scene, setScene] = React.useState([])
  const [selected, setSelected] = React.useState(null)

  useEvent(app, 'update-scene', (scene) => setScene(scene))
  useEvent(app, 'select-object', (item) => setSelected(item))

  return el(
    'div',
    {},
    el('style', {},
      `svg.canvas-3d :is(path, ellipse, rect) {
        fill: none;
        stroke-width: 0.5px;
        stroke: #000;
      }
      svg.canvas-3d path:not(.light) {
        stroke-linejoin: bevel;
        stroke-width: 0.125px
      }
      svg.canvas-3d :is(path, ellipse, rect).active {
        stroke-width: 2px
      }`),
    el('svg', { className: 'canvas-3d', viewBox: '0 0 400 300' },
      scene
        .filter(isCompilable)
        .map((e, i) => el('path', {
          key: `mesh${i}`,
          className: selected == e ? ' active' : '',
          d: compileObject(e).polys.map(({a,b,c}) =>
            `M${r(a.x)},${r(a.y)} L${r(b.x)},${r(b.y)} L${r(c.x)},${r(c.y)} Z`)
            .join(''),
        })),
      scene.filter(e => e.kind === 'light').map((e, i) => el('path', {
        key: `light${i}`,
        className: 'light' + (selected == e ? ' active' : ''),
        d: `M${r(e.point.x)-3},${r(e.point.y)-3} l6,0 l0,6 l-6,0Zm1.5,1.5 l0,3 l3,0 l0,-3 Z`
      })),
      scene.filter(e => e.kind === 'sphere').map((e, i) => el('ellipse', {
        key: `sphere{i}`,
        className: selected == e ? ' active' : undefined,
        cx: e.center.x,
        cy: e.center.y,
        rx: e.r, ry: e.r
      }))
    )
  )
}

export function SceneObjects() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState([])
  useEvent(app, 'update-scene', (scene) => setScene(scene))

  return el(
    'scene-objects',
    {},
    el('style', {},
      `scene-objects {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        height: 300px;
      }
      scene-objects span { padding: 3px }
      scene-objects span.active { background: black; color: white; }
      `),
    scene.map(e => el('span', {
        onClick: () => {
          setSelected(e)
          app.trigger('select-object', e)
        },
        className: selected === e ? 'active' : undefined,
      },
      e.name || e.kind
    ))
  )
}

export function Properties() {
  const [selected, setSelected] = React.useState(null)
  useEvent(app, 'select-object', (obj) => setSelected(obj))

  if (!selected) return null

  return el(
    'obj-properties',
    {},
    el('style', {},
      `obj-properties { display: block }
      obj-properties input { width: 64px }`),
    selected.kind === 'sphere'
      ? el(TransformInput, { transform: selected, title: 'pos' })
      : null,
    selected.kind === 'light'
      ? el(TransformInput, { transform: selected, title: 'pos' })
      : null,
    selected
      .transforms
      ?.map((e,i) => el(TransformInput, { transform: e, title: e.kind, key: i })),
  )
}

export function TransformInput({ transform: trns, title }) {
  const [selected, setSelected] = React.useState(null)
  useEvent(app, 'select-object', (obj) => setSelected(obj))

  const update = (field) => (event) => {
    trns[field] = event.target.value
    app.trigger('scene-modified')
  }

  return el(
    'transform-input',
    {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr',
        alignItems: 'center',
        justifyItems: 'center',
      }
    },
    el('span', {}, title),
    el('span', {}, 'X'),
    el('input', { type: 'number', value: trns.x, onChange: e => update('x') }),
    el('span', {}, 'Y'),
    el('input', { type: 'number', value: trns.y, onChange: e => update('y') }),
    el('span', {}, 'Z'),
    el('input', { type: 'number', value: trns.z, onChange: e => update('z') }),
  )
}
