import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'
import { compileObject, latheMesh, toMatrix } from './geometry.js'
import { Box, Light, Mesh, Sphere } from './geometry.js'
import { Offset, Rotate, Scaling, Transforms } from './geometry.js'
import { add, cross, diff, EPSILON, matrixmult, RotateZ, Vec } from './math.js'

function isMeshRepresentable(obj) {
  return !['light', 'sphere'].includes(obj.kind)
}

export function Editor() {
  const [startPos, setStartPos] = React.useState(null)
  const [{ x: ox, y: oy, z: oz }, setOffset] = React.useState(Vec(0,0,0))
  function x(p) { return zoom * (view == 'side' ? p.z-oz : p.x-ox) }
  function y(p) { return zoom * (view == 'top' ? p.z-oz : p.y-oy) }
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
  useEvent(app, 'focus_selection', () => {
    if (!selected) return
    setZoom(0.5)
    setOffset(compileObject(selected).center)
  })
  useEvent(app, 'zoom', (factor) => setZoom(zoom * factor))
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'select_object', (item) => setSelected(item))
  useEvent(app, 'create_object', (kind) => {
    if (kind == 'light')
      scene.push(Light(64, Offset(ox, oy, oz)))
    if (kind == 'box')
      scene.push(
        Box(
          'box',
          Transforms(Offset(ox, oy, oz), Rotate(0,0,0), Scaling(30,30,30))
        )
      )
    if (kind == 'sphere')
      scene.push(
        Sphere('sphere', 'diffuse',
          Transforms(Offset(ox, oy, oz), Rotate(0,0,0), Scaling(30,30,30))
        )
      )
    app.trigger('scene_modified')
  })
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
    { style: { display: 'grid' } },
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
      }
      svg.canvas-3d path.crosshair {
        stroke-dasharray: 2 2;
        stroke-width: 1px;
      }`),
    el('svg',
      {
        className: 'canvas-3d',
        viewBox: '-170 -128 340 256',
        onMouseDown: (e) => {
          setStartPos(screenToSpace(e))
        },
        onMouseMove: (e) => {
          if (startPos) setOffset(o => add(o, diff(startPos, screenToSpace(e))))
        },
        onMouseUp: (e) => {
          setOffset(o => add(o, diff(startPos, screenToSpace(e))))
          setStartPos(null)
        }
      },
      el('path', {
        className: 'crosshair',
        d: `M${x(Vec(ox,oy,oz))-11},${y(Vec(ox,oy,oz))} l 22,0 m -11,-11 l 0,22`
      }),
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
      obj.material,
      latheMesh(
        [Vec(50*1.414,0,-100), Vec(0.1,0,0)],
        4,
        matrixmult(toMatrix(obj.transforms), RotateZ(Math.PI/4))
      )
    )
  }
  return compileObject(obj)
}
