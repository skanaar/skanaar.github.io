import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'
import { compileObject, latheMesh, toMatrix, Mesh } from './geometry.js'
import { Camera, Box, Light, Sphere, Composite, Instance } from './geometry.js'
import { Lathe, Point } from './geometry.js'
import { Offset, Rotate, Scaling, Transforms } from './geometry.js'
import { add, cross, diff, EPSILON, Identity, matrixStack, RotateX, RotateY, Vec } from './math.js'

export function Editor() {
  const [mode, setMode] = React.useState('pan')
  const [startPos, setStartPos] = React.useState(null)
  const [{ x: ox, y: oy, z: oz }, setOffset] = React.useState(Vec(0,0,0))
  function x(p) { return zoom * (view == 'side' ? p.z-oz : p.x-ox) }
  function y(p) { return zoom * (view == 'top' ? p.z-oz : p.y-oy) }
  function z(p) { return view == 'front' ? p.z : view == 'side' ? p.x : -p.y }
  function lathex(p) { return zoom * (view == 'side' ? -p.z-oz : -p.x-ox) }
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
    let compiled = compileObject(selected, scene)
    setZoom(100/Math.max(50, compiled.radius ?? 100))
    setOffset(compiled.center)
  })
  useEvent(app, 'edit_level', () => setOffset(Vec(0,0,0)))
  useEvent(app, 'editor_mode', (mode) => setMode(mode))
  useEvent(app, 'editor_mode', (mode) => app.check('editor_mode', mode))
  useEvent(app, 'zoom', (factor) => setZoom(zoom * factor))
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'select_object', (item) => setSelected(item))
  useEvent(app, 'create_object', (kind) => {
    let spawn = create(kind, Offset(ox, oy, oz), selected, scene)
    let index = scene.children.indexOf(selected)
    if (index > -1)
      scene.children.splice(index+1, 0, spawn)
    else
      scene.children.push(spawn)
    app.trigger('scene_modified')
  })
  useEvent(app, 'scene_modified', () => {
    scene.update?.()
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
    { style: { display: 'grid', gridTemplateRows: 'auto auto' } },
    el('style', {},
      `svg.canvas-3d :is(path, ellipse, rect) {
        fill: none;
        stroke-width: 0.5px;
        stroke: #000;
      }
      svg.canvas-3d path.mesh {
        stroke-linejoin: bevel;
        stroke-width: 0.125px
      }
      svg.canvas-3d :is(path, ellipse, rect).active {
        stroke-width: 2px
      }
      svg.canvas-3d path.crosshair {
        stroke-dasharray: 2 2;
        stroke-width: 1px;
      }
      editor-toolbar { display:flex; border-bottom:2px solid black; padding:4px}
      editor-toolbar span { margin-left: auto; }
      editor-toolbar button {
        apperance: none;
        border: 2px solid black;
        background: #fff;
        min-width: 30px;
        margin-right: -2px;
        font-size: 15px;
        padding: 2px 6px;
      }
      editor-toolbar button:active, editor-toolbar button[active] {
        color: #fff;
        background: #000;
      }
      editor-toolbar button[disabled] { color: #000; position: relative }
      editor-toolbar button[disabled]:before {
        content: ''; position: absolute; inset: 0;
        background: repeating-linear-gradient(
          45deg, #fff0, #fff0 1.414px, #fff 1.414px, #fff 2.818px
        );
      }`
    ),
    el('editor-toolbar', {},
      el(ToolButton, { event: 'scene_view', arg: 'side', toggle: 1 }, 'X'),
      el(ToolButton, { event: 'scene_view', arg: 'top', toggle: 1 }, 'Y'),
      el(ToolButton, { event: 'scene_view', arg: 'front', toggle: 1 }, 'Z'),
      el(ToolButton, { event: 'zoom', arg: 1/1.5 }, '-'),
      el(ToolButton, { event: 'zoom', arg: 1.5 }, '+'),
      el(ToolButton, { event: 'reset_view' }, '='),
      el('span', {}),
      el(ToolButton, { event: 'focus_selection' }, '⌾'),
      el(ToolButton, { event:'edit_level', arg:'composite' }, '↓'),
      el(ToolButton, { event:'edit_level', arg:'scene' }, '⏏'),
      el('span', {}),
      el(ToolButton, { event: 'editor_mode', arg: 'pan', toggle: 1 }, 'Pan'),
      el(ToolButton, { event: 'editor_mode', arg: 'move', toggle: 1 }, 'Move'),
    ),
    el('svg',
      {
        className: 'canvas-3d',
        viewBox: '-170 -128 340 256',
        onMouseDown: (e) => {
          setStartPos(screenToSpace(e))
        },
        onMouseMove: (e) => {
          if (mode == 'pan' && startPos) {
            setOffset(o => diff(o, screenToSpace(e)))
          }
          if (mode == 'move' && selected && startPos) {
            let o = selected.transforms.offset
            selected.transforms.offset = add(o, screenToSpace(e))
            app.trigger('scene_modified')
          }
        },
        onMouseUp: (e) => {
          setStartPos(null)
        }
      },
      el('path', {
        className: 'crosshair',
        d: `M${x(Vec(ox,oy,oz))-11},${y(Vec(ox,oy,oz))} l 22,0 m -11,-11 l 0,22`
      }),
      el('path', {
        className: 'crosshair',
        d: `M${x(Vec(0,0,0))-1000},${y(Vec(0,0,0))}l 2000,0m-1000,-1000 l0,2000`
      }),
      scene.children
        .map(e => (
          { entity: e, preview: compilePreviewObject(e, scene.children) }
        ))
        .filter(({ preview }) => preview.kind == 'mesh')
        .map(({ entity, preview }, i) => el('path', {
          key: `mesh${i}`,
          className: 'mesh' + (selected == entity ? ' active' : ''),
          d: preview
            .polys
            .filter(({a,b,c}) => z(cross(diff(b,a), diff(c,a))) < EPSILON)
            .map(({a,b,c}) =>
            `M${x(a)},${y(a)} L${x(b)},${y(b)} L${x(c)},${y(c)} Z`)
            .join(''),
        })),
      scene.children
        .filter(e => e.kind === 'light')
        .map((e, i) => {
          let p = compilePreviewObject(e, scene.children).point
          return el('path', {
            key: `light${i}`,
            className: 'light' + (selected == e ? ' active' : ''),
            d: `M${x(p)-3},${y(p)-3}l6,0l0,6l-6,0Zm-3,3l6,-6l6,6l-6,6 Z`
          })
        }),
      scene.children
        .filter(e => e.kind === 'sphere')
        .map((e, i) => {
          let { center, r } = compilePreviewObject(e)
          return el('ellipse', {
            key: `sphere{i}`,
            className: selected == e ? 'active' : undefined,
            cx: x(center),
            cy: y(center),
            rx: zoom * r,
            ry: zoom * r
          })
        }),
      scene.children
        .filter(e => e.kind === 'point')
        .map((e, i) => {
          return el('ellipse', {
            key: `point{i}`,
            className: selected == e ? 'active' : undefined,
            cx: x(e.transforms.offset),
            cy: y(e.transforms.offset),
            rx: 2,
            ry: 2
          })
        }),
    ),
  )
}

function create(kind, pos, selected, scene) {
  let withSize = (s) => Transforms(pos, Rotate(0,0,0), Scaling(s,s,s))
  switch (kind) {
    case 'light': return Light(64, pos)
    case 'camera': return Camera(withSize(1))
    case 'box': return Box('box', withSize(30))
    case 'cylinder':
      return Lathe('cylinder', 16, [Vec(1,0,-2),Vec(1,0,2)], withSize(30))
    case 'cone':
      return Lathe('cone',16,[Vec(0,0,0),Vec(1,0,0),Vec(0,0,2)],withSize(30))
    case 'sphere': return Sphere('sphere', 'diffuse', withSize(30))
    case 'composite':
      return Composite('composite', [create('box', pos)], withSize(1))
    case 'instance':
      let ref = isMeshable(selected?.kind) ? null : (selected?.name ?? null)
      return Instance('instance', ref, withSize(1))
    case 'point': return Point(scene.children.length+1, withSize(1).offset)
  }
}

function isMeshable(kind) {
  return ['light', 'camera'].includes(kind)
}

function compilePreviewObject(obj, entities) {
  if (obj.kind === 'camera') {
    return Mesh(
      obj.material,
      latheMesh(
        [Vec(50*1.414,-100,0), Vec(0.1,0,0)],
        4,
        matrixStack(toMatrix(obj.transforms), RotateX(Math.PI/2), RotateY(Math.PI/4))
      )
    )
  }
  return compileObject(obj, entities)
}

function ToolButton({ event, arg, toggle, children }) {
  let forceUpdate = useForceUpdate()
  useEvent(app, 'app:menuability', forceUpdate)
  return el('button', {
    style: children.length == 1 ? { fontWeight: 'bold' } : undefined,
    onClick: () => app.trigger(event, arg),
    disabled: app.isEnabled(event, arg) ? undefined : true,
    active: (toggle && app.menuState[event] == arg) ? 'true' : undefined,
  }, children)
}
