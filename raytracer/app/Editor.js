import { useEvent, el, useForceUpdate } from '../../assets/system.js'
import { app, renderSize } from './Raytracer.js'
import { compileObject, toMatrix, toInverseMatrix } from '../geometry.js'
import { latheMesh } from '../geometry/lathe.js'
import { Offset, Rotate, Scaling, Mesh, createObject, compositeCompatibles } from '../objects.js'
import { add, cross, diff, EPSILON, mag, mapply, matrixStack } from '../math.js'
import { clamp, dot, mult, norm } from '../math.js'
import { RotateX, RotateY, Vec } from '../math.js'
import { Toolbar } from './Toolbar.js'
import { LatheEditable } from '../geometry/LatheEditable.js'
import { PatchesEditable } from '../geometry/PatchesEditable.js'
import { jsonSerialize } from './json-serialize.js'

let creatables = [
  'camera', 'light', 'sphere', 'box', 'lathe',
  'tree', 'composite', 'instance', 'material'
]
let clipboard = null

let round2 = (v) => Math.round(v * 1e2) / 1e2
let roundVec = (v) => Vec(round2(v.x), round2(v.y), round2(v.z))

const ISO = Math.sqrt(3) / 2
const ISO_DRAG = 1 / Math.sqrt(3)
const projections = {
  front: { u: Vec(1, 0, 0), v: Vec(0, 1, 0), w: Vec(0, 0, 1) },
  side: { u: Vec(0, 0, 1), v: Vec(0, 1, 0), w: Vec(1, 0, 0) },
  top: { u: Vec(1, 0, 0), v: Vec(0, 0, 1), w: Vec(0, -1, 0) },
  iso: { u: Vec(ISO, 0, -ISO), v: Vec(0.5, 1, 0.5), w: norm(Vec(1, -1, 1)) },
}
const dragProjections = {
  front: { u: Vec(1, 0, 0), v: Vec(0, 1, 0) },
  side: { u: Vec(0, 0, 1), v: Vec(0, 1, 0) },
  top: { u: Vec(1, 0, 0), v: Vec(0, 0, 1) },
  iso: { u: Vec(ISO_DRAG, 0, -ISO_DRAG), v: Vec(1, 0, 1) },
}

function svgPoint(svg, evt) {
  let pt = svg.createSVGPoint()
  pt.x = evt.clientX
  pt.y = evt.clientY
  return pt.matrixTransform(svg.getScreenCTM().inverse())
}

function pickFile(accept) {
  return new Promise((resolve) => {
    let input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', () => resolve(input.files[0] ?? null))
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

function downloadFile(name, text) {
  let url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  let a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function Editor() {
  const [mode, setMode] = React.useState('pan')
  const [startPos, setStartPos] = React.useState(null)
  const isDragging = React.useRef(false)
  const [{ x: ox, y: oy, z: oz }, setOffset] = React.useState(Vec(0,0,0))
  function rel(p) { return diff(p, Vec(ox, oy, oz)) }
  function x(p) { return zoom * dot(projections[view].u, rel(p)) }
  function y(p) { return zoom * dot(projections[view].v, rel(p)) }
  function z(p) { return dot(projections[view].w, p) }
  const [scene, setScene] = React.useState(app.scene)
  const forceUpdate = useForceUpdate()
  const [view, setView] = React.useState('front')
  const [zoom, setZoom] = React.useState(0.75)
  const [selected, setSelected] = React.useState(null)
  const [cameraId, setCameraId] = React.useState(null)
  const svgRef = React.useRef()

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
    let compiled = compileObject(selected, scene.parts)
    if (!compiled.center) return
    setZoom(100/Math.max(50, compiled.radius ?? compiled.r ?? 100))
    setOffset(compiled.center)
  })
  useEvent(app, 'edit_object', () => setOffset(Vec(0,0,0)))
  useEvent(app, 'edit_scene', () => setOffset(Vec(0,0,0)))
  useEvent(app, 'editor_mode', (mode) => setMode(mode))
  useEvent(app, 'editor_mode', (mode) => app.check('editor_mode', mode))
  useEvent(app, 'zoom', (factor) => setZoom(zoom * factor))
  useEvent(app, 'update_scene', (scene) => {
    setScene(scene)
    setCameraId(scene.parts.find(e => e.kind == 'camera')?.id)
    if (scene.kind === 'lathe-editable') {
      let r = Math.max(1, ...scene.parts.map(e => mag(e.transforms.offset)))
      setZoom(100 / r)
      setOffset(Vec(0,0,0))
    }
  })
  useEvent(app, 'select_object', (item) => {
    setSelected(item)
    app.enable('copy_object', null, isCopyable(item?.kind))
  })
  useEvent(app, 'pick_camera', (cam) => setCameraId(cam))
  useEvent(app, 'select_camera', () => {
    if (selected?.kind != 'camera') return
    app.trigger('pick_camera', selected?.id)
  })

  function insertAfterSelection(spawn) {
    let index = scene.parts.indexOf(selected)
    if (index > -1)
      scene.parts.splice(index+1, 0, spawn)
    else
      scene.parts.push(spawn)
    app.trigger('scene_modified')
    app.trigger('select_object', spawn)
  }

  useEvent(app, 'create_object', (kind) => {
    insertAfterSelection(createObject(kind, Offset(ox, oy, oz), selected, scene))
  })
  useEvent(app, 'copy_object', () => {
    if (!isCopyable(selected?.kind)) return
    clipboard = structuredClone(selected)
    app.enable('paste_object', null, true)
  })
  useEvent(app, 'paste_object', () => {
    if (!clipboard) return
    insertAfterSelection(structuredClone(clipboard))
  })
  useEvent(app, 'scene_modified', () => {
    scene.update?.()
  })
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'toggle_axis', forceUpdate)
  useEvent(app, 'toggle_crosshair', forceUpdate)
  useEvent(app, 'edit_object', () => {
    if (!['composite', 'lathe', 'patches'].includes(selected?.kind)) return
    for (let e of creatables)
      app.enable('create_object', e,
        selected.kind == 'composite'
          ? compositeCompatibles.has(e)
          : e == 'point'
      )
    app.enable('create_object', 'light', false)
    app.enable('create_object', 'sphere', false)
    app.enable('paste_object', null, !!clipboard && selected.kind == 'composite')
    app.enable('edit_object', null, false)
    app.enable('edit_scene', null, true)
    app.breadcrumbs = [selected.name]
    app.trigger('select_object', null)
    if (selected?.kind == 'patches')
      app.trigger('update_scene', PatchesEditable(selected))
    else if (selected?.kind == 'lathe')
      app.trigger('update_scene', LatheEditable(selected))
    else if (selected?.kind == 'composite')
      app.trigger('update_scene', selected)
    app.trigger('select_object', null)
  })
  useEvent(app, 'edit_scene', () => {
    app.enable('create_object', 'sphere', true)
    app.enable('create_object', 'light', true)
    for (let e of creatables) app.enable('create_object', e, true)
    app.enable('paste_object', null, !!clipboard)
    app.enable('edit_object', null, true)
    app.enable('edit_scene', null, false)
    app.breadcrumbs = []
    app.trigger('update_scene', app.scene)
    app.trigger('select_object', null)
  })
  useEvent(app, 'rename_object', () => {
    if (!selected) return
    let name = prompt(`Rename object "${selected.name}"`)
    if (name) selected.name = name
    app.trigger('scene_modified')
  })
  useEvent(app, 'delete_object', () => {
    if (!selected) return
    let decision = confirm(`Delete object "${selected.name}"`)
    let index = scene.parts.findIndex(e => e == selected)
    if (decision && index >= 0) scene.parts.splice(index, 1)
    app.trigger('scene_modified')
  })
  useEvent(app, 'link_camera', () => {
    const currentCamera = scene.parts.find(o => o.id == cameraId)
    if (!selected || !currentCamera) return
    let link = createObject('link', null, selected, scene)
    link.source = currentCamera.id
    link.target = selected.id
    let rect = viewportRect(currentCamera, selected, 30, 30)
    if (rect) {
      link.x = rect.x
      link.y = rect.y
      link.w = rect.w
      link.h = rect.h
    }
    const camIndex = scene.parts.findIndex(o => o.id == cameraId)
    scene.parts.splice(camIndex+1, 0, link)
    app.trigger('scene_modified')
    app.trigger('select_object', link)
  })

  useEvent(app, 'save_scene', () => {
    scene.update?.()
    downloadFile('scene.json', jsonSerialize(app.scene))
  })
  useEvent(app, 'load_scene', async () => {
    let file = await pickFile('.json,application/json')
    if (!file) return
    try {
      app.scene = JSON.parse(await file.text())
      app.check('scene', null)
      app.trigger('edit_scene')
    }
    catch (e) { alert(`Could not open scene: ${e.message}`) }
  })

  function screenToSpace(evt) {
    let ctm = svgRef.current.getScreenCTM()
    return viewDelta(evt.movementX / ctm.a / zoom, evt.movementY / ctm.d / zoom)
  }

  function viewDelta(dx, dy) {
    let { u, v } = dragProjections[view]
    return roundVec(add(mult(dx, u), mult(dy, v)))
  }

  function viewRotation(rot) {
    let k = 1
    switch (view) {
      case 'front': return Rotate(0, 0, rot*k)
      case 'side': return Rotate(rot*k, 0, 0)
      case 'top': return Rotate(0, rot*k, 0)
      case 'iso': return Rotate(0, rot*k, 0)
    }
  }

  function viewScaling(s) {
    switch (view) {
      case 'front': return Scaling(s, 1, 1)
      case 'side': return Scaling(1, 1, s)
      case 'top': return Scaling(1, s, 1)
      case 'iso': return Scaling(s, 1, s)
    }
  }

  React.useEffect(() => {
    function onKeyDown(e) {
      if (!selected || !selected.transforms) return
      if (/^(input|textarea|select)$/i.test(e.target.tagName)) return
      if (e.key == 'Delete' || e.key == 'Backspace') {
        e.preventDefault()
        app.trigger('delete_object')
        return
      }
      let step = e.shiftKey ? 10 : 1
      let delta = {
        ArrowLeft: viewDelta(-step, 0),
        ArrowRight: viewDelta(step, 0),
        ArrowUp: viewDelta(0, -step),
        ArrowDown: viewDelta(0, step)
      }[e.key]
      if (!delta) return
      e.preventDefault()
      selected.transforms.offset = roundVec(add(selected.transforms.offset, delta))
      app.trigger('scene_modified')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected, view])

  React.useEffect(() => {
    let svg = svgRef.current
    function onWheel(e) {
      e.preventDefault()
      let unit = e.deltaMode == 1 ? 16 : e.deltaMode == 2 ? 100 : 1
      let next = clamp(zoom * Math.exp(-e.deltaY * unit * 0.002), 0.01, 100)
      if (next == zoom) return
      let c = svgPoint(svg, e)
      let k = 1/zoom - 1/next
      setOffset(o => roundVec(add(o, viewDelta(c.x * k, c.y * k))))
      setZoom(next)
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [zoom, view])

  function pickAt(evt) {
    let c = svgPoint(evt.currentTarget, evt)
    let hit = null
    let best = 10
    for (let e of scene.parts) {
      if (!e.transforms || e.renderOnly || e.hidden) continue
      let p = e.transforms.offset
      let d = Math.hypot(x(p) - c.x, y(p) - c.y)
      if (d <= best) { best = d; hit = e }
    }
    return hit
  }

  return el(
    'div',
    { style: { display: 'grid', gridTemplateRows: 'auto auto' } },
    el('style', {}, `
      svg.canvas-3d :is(path, ellipse, rect) {
        fill: none;
        stroke-width: 0.5px;
        stroke: #000;
      }
      svg.canvas-3d path.mesh { stroke-linejoin: bevel; stroke-width: 0.125px }
      svg.canvas-3d :is(path, ellipse, rect).active { stroke-width: 2px }
      svg.canvas-3d path.crosshair { stroke-dasharray: 2 2; stroke-width: 0.5px }`
    ),
    el(Toolbar, {}),
    el('svg',
      {
        className: 'canvas-3d',
        ref: svgRef,
        viewBox: '-170 -128 340 256',
        onMouseDown: (e) => {
          setStartPos(screenToSpace(e))
        },
        onMouseMove: (e) => {
          if (startPos != null) isDragging.current = true
          if (mode == 'pan' && startPos) {
            setOffset(o => roundVec(diff(o, screenToSpace(e))))
          }
          if (mode == 'move' && selected && selected.transforms && startPos) {
            let t = selected.transforms
            if (e.altKey) {
              let r = viewRotation(e.movementX)
              t.rotate = Rotate(t.rotate.x+r.x, t.rotate.y+r.y, t.rotate.z+r.z)
            } else if (e.shiftKey) {
              let f = 1 + (e.movementX - e.movementY) / 100
              t.scale = Scaling(t.scale.x * f, t.scale.y * f, t.scale.z * f)
            } else if (e.metaKey) {
              let s = viewScaling(1 + (e.movementX) / 100)
              t.scale = Scaling(t.scale.x*s.x, t.scale.y*s.y, t.scale.z*s.z)
            } else {
              t.offset = roundVec(add(t.offset, screenToSpace(e)))
            }
            app.trigger('scene_modified')
          }
        },
        onMouseUp: (e) => {
          setStartPos(null)
          let hit = pickAt(e)
          if (hit && !isDragging.current) app.trigger('select_object', hit)
          isDragging.current = false
        }
      },
      !app.menuState['toggle_crosshair'] ? null : el('path', {
        className: 'crosshair',
        d: `M${x(Vec(ox,oy,oz))-11},${y(Vec(ox,oy,oz))} l 22,0 m -11,-11 l 0,22`
      }),
      !app.menuState['toggle_axis'] ? null : el('path', {
        className: 'crosshair',
        d: `M${x(Vec(0,0,0))-1000},${y(Vec(0,0,0))}l 2000,0m-1000,-1000 l0,2000`
      }),
      scene.parts
        .filter(e => !e.hidden)
        .map(e => (
          {
            entity: e,
            preview: compilePreviewObject(e, scene.parts, selected == e)
          }
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
      scene.parts
        .filter(e => e.kind === 'light' && !e.hidden)
        .map((e, i) => {
          let p = compilePreviewObject(e, scene.parts).point
          return el('path', {
            key: `light${i}`,
            className: 'light' + (selected == e ? ' active' : ''),
            d: `M${x(p)-3},${y(p)-3}l6,0l0,6l-6,0Zm-3,3l6,-6l6,6l-6,6 Z`
          })
        }),
      scene.parts
        .filter(e => e.kind === 'sphere' && !e.hidden)
        .map((e) => {
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
      scene.parts
        .filter(e => e.kind === 'point' && !e.hidden)
        .map((e) => {
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

function viewportRect(camera, target, w, h) {
  if (camera?.kind != 'camera' || !target?.transforms) return null
  let center = mapply(toMatrix(target.transforms), Vec(0,0,0))
  let p = mapply(toInverseMatrix(camera.transforms), center)
  if (p.z > -EPSILON) return null
  let aspect = renderSize.h / renderSize.w
  return {
    x: Math.round((p.x / -p.z + 0.5) * 100 - w/2),
    y: Math.round((p.y / -p.z / aspect + 0.5) * 100 - h/2),
    w,
    h,
  }
}

function isCopyable(kind) {
  return 'box lathe composite tree terrain material'.includes(kind)
}

function compilePreviewObject(obj, entities, selected) {
  if (obj.kind === 'camera') {
    return Mesh(
      obj.material,
      latheMesh(
        selected
          ? [Vec(15*Math.SQRT2,-30,0), Vec(0,0,0), Vec(1,-500, 0)]
          : [Vec(15*Math.SQRT2,-30,0), Vec(0,0,0)],
        4,
        360,
        matrixStack(toMatrix(obj.transforms), RotateX(Math.PI/2), RotateY(Math.PI/4))
      )
    )
  }
  return compileObject(obj, entities)
}
