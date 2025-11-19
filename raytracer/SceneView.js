import { useEvent, el } from '../assets/system.js'
import { app } from '../Raytracer.js'
import { compileObject } from './geometry.js'
import { cross, diff, dot } from './math.js'

function isCompilable(obj) {
  return !['light', 'sun', 'sphere', 'plane', 'camera'].includes(obj.kind)
}

export function SceneView() {
  function x(p) { return Math.round(zoom * (view == 'side' ? p.z : p.x)) }
  function y(p) { return Math.round(zoom * (view == 'top' ? p.z : p.y)) }
  function z(p) { return view == 'front' ? p.z : view == 'side' ? p.x : p.y }
  const [scene, setScene] = React.useState([])
  const [view, setView] = React.useState('front')
  const [zoom, setZoom] = React.useState(0.5)
  const [selected, setSelected] = React.useState(null)

  useEvent(app, 'scene_view', (view) => {
    app.check('scene_view', view)
    setView(view)
  })
  useEvent(app, 'zoom', (factor) => setZoom(zoom * factor))
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
    el('svg', { className: 'canvas-3d', viewBox: '-170 -128 340 256' },
      scene
        .filter(isCompilable)
        .map((e, i) => el('path', {
          key: `mesh${i}`,
          className: selected == e ? ' active' : '',
          d: compileObject(e)
            .polys
            .filter(({a,b,c}) => z(cross(diff(b,a), diff(c,a))) < 0)
            .map(({a,b,c}) =>
            `M${x(a)},${y(a)} L${x(b)},${y(b)} L${x(c)},${y(c)} Z`)
            .join(''),
        })),
      scene.filter(e => e.kind === 'light').map((e, i) => el('path', {
        key: `light${i}`,
        className: 'light' + (selected == e ? ' active' : ''),
        d: `M${x(e.point)-3},${y(e.point)-3}l6,0l0,6l-6,0Zm-3,3l6,-6l6,6l-6,6 Z`
      })),
      scene.filter(e => e.kind === 'sphere').map((e, i) => el('ellipse', {
        key: `sphere{i}`,
        className: selected == e ? ' active' : undefined,
        cx: x(e.center),
        cy: y(e.center),
        rx: zoom * e.r,
        ry: zoom * e.r
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
      obj-properties input { width: 64px }
      obj-properties input[type='number'] {
          -moz-appearance: textfield;
      }

      obj-properties input::-webkit-outer-spin-button,
      obj-properties input::-webkit-inner-spin-button {
          -webkit-appearance: none;
      }`),
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
