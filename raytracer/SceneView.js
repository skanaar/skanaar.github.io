import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'
import { compileObject, latheMesh, Mesh, Rotate, toMatrix } from './geometry.js'
import { add, cross, diff, dot, EPSILON, Vec, π } from './math.js'

function isMeshRepresentable(obj) {
  return !['light', 'sphere'].includes(obj.kind)
}

export function SceneView() {
  const [startPos, setStartPos] = React.useState(null)
  const [{ x: ox, y: oy, z: oz }, setOffset] = React.useState(Vec(0,0,0))
  function x(p) { return Math.round(zoom * (view == 'side' ? p.z-oz : p.x-ox)) }
  function y(p) { return Math.round(zoom * (view == 'top' ? p.z-oz : p.y-oy)) }
  function z(p) { return view == 'front' ? p.z : view == 'side' ? p.x : -p.y }
  const [scene, setScene] = React.useState(app.scene)
  const forceUpdate = useForceUpdate()
  const [view, setView] = React.useState('front')
  const [zoom, setZoom] = React.useState(0.5)
  const [selected, setSelected] = React.useState(null)

  useEvent(app, 'scene_view', (view) => {
    app.check('scene_view', view)
    setView(view)
  })
  useEvent(app, 'reset_view', () => {
    setZoom(0.5)
    setOffset(Vec(0,0,0))
  })
  useEvent(app, 'zoom', (factor) => setZoom(zoom * factor))
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'select_object', (item) => setSelected(item))
  useEvent(app, 'scene_modified', forceUpdate)

  function screenToSpace({ movementX, movementY }) {
    switch (view) {
      case 'front': return Vec(movementX/zoom, movementY/zoom, 0)
      case 'side': return Vec(0, movementY/zoom, movementX/zoom)
      case 'top': return Vec(movementX/zoom, 0, movementY/zoom)
    }
  }

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
    el('svg', {
      className: 'canvas-3d',
      viewBox: '-170 -128 340 256',
      onMouseDown: (e) => setStartPos(screenToSpace(e)),
      onMouseMove: (e) => {
        if (startPos) setOffset(o => add(o, diff(startPos, screenToSpace(e))))
      },
      onMouseUp: (e) => {
        setOffset(o => add(o, diff(startPos, screenToSpace(e))))
        setStartPos(null)
      }
    },
      scene
        .filter(isMeshRepresentable)
        .map((e, i) => el('path', {
          key: `mesh${i}`,
          className: selected == e ? ' active' : '',
          d: compilePreviewObject(e)
            .polys
            .filter(({a,b,c}) => z(cross(diff(b,a), diff(c,a))) < EPSILON)
            .map(({a,b,c}) =>
            `M${x(a)},${y(a)} L${x(b)},${y(b)} L${x(c)},${y(c)} Z`)
            .join(''),
        })),
      scene
        .filter(e => e.kind === 'light')
        .map((e, i) => {
          let p = compilePreviewObject(e).point
          return el('path', {
            key: `light${i}`,
            className: 'light' + (selected == e ? ' active' : ''),
            d: `M${x(p)-3},${y(p)-3}l6,0l0,6l-6,0Zm-3,3l6,-6l6,6l-6,6 Z`
          })
        }),
      scene.filter(e => e.kind === 'sphere').map((e, i) => {
        let { center, r } = compilePreviewObject(e)
        return el('ellipse', {
          key: `sphere{i}`,
          className: selected == e ? ' active' : undefined,
          cx: x(center),
          cy: y(center),
          rx: zoom * r,
          ry: zoom * r
        })
      })
    )
  )
}

function compilePreviewObject(obj) {
  if (obj.kind === 'camera') {
    return Mesh(
      latheMesh(
        [Vec(50*1.414,0,-100), Vec(0.1,0,0)],
        4,
        toMatrix([...obj.transforms, Rotate(0,0,45)])
      )
    )
  }
  return compileObject(obj)
}

export function SceneObjects() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState([])
  useEvent(app, 'update_scene', (scene) => setScene(scene))

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
          app.trigger('select_object', e)
        },
        className: selected === e ? 'active' : undefined,
      },
      e.name || e.kind
    ))
  )
}

export function Properties() {
  const [selected, setSelected] = React.useState(null)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'select_object', (obj) => setSelected(obj))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'add_transform', (kind) => {
    if (!selected) return
    if (kind == 'scale')
      selected.transforms.push({ kind: 'scale', x: 1, y: 1, z: 1 })
    else
      selected.transforms.push({ kind, x: 0, y: 0, z: 0 })
    app.trigger('scene_modified')
  })

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
    selected
      .transforms
      ?.map((e,i) => el(TransformInput, { transform:e, title:e.kind, key:i })),
  )
}

export function TransformInput({ transform: trns, title }) {
  const [selected, setSelected] = React.useState(null)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'select_object', (obj) => setSelected(obj))
  useEvent(app, 'scene_modified', forceUpdate)

  const update = (field) => (event) => {
    trns[field] = event.target.value
    app.trigger('scene_modified')
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
    el('input', { type: 'number', value: trns.x, onChange: update('x') }),
    el('span', {}, 'Y'),
    el('input', { type: 'number', value: trns.y, onChange: update('y') }),
    el('span', {}, 'Z'),
    el('input', { type: 'number', value: trns.z, onChange: update('z') }),
  )
}
