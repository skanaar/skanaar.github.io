import { el, App, useEvent } from '../assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './dither.js'
import { compileScene } from './geometry.js'
import { Camera, Light, Scene, Offset, Rotate, Transforms } from './objects.js'
import { raytraceParallel } from './raytraceParallel.js'
import { Editor } from './Editor.js'
import { ObjectList } from './ObjectList.js'
import { Properties } from './Properties.js'
import { sceneIsland, sceneMushroom, sceneTeapot } from './scenes.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.position(30, 60)
app.addMenu(
  'File',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Island', event: 'scene', arg: 'island' },
  { title: 'Mushroom', event: 'scene', arg: 'mushroom' },
  { title: null },
  { title: 'Open scene', event: 'load_scene', cmd: 'o' },
  { title: 'Save scene', event: 'save_scene', cmd: 's' },
)
app.addMenu(
  'Edit',
  { title: 'Copy', event: 'copy_object', cmd: 'c' },
  { title: 'Paste', event: 'paste_object', cmd: 'v' },
  { title: null },
  { title: 'Edit object', event: 'edit_object', cmd: 'e' },
  { title: 'Edit scene', event: 'edit_scene' },
  { title: null },
  { title: 'Rename selected...', event: 'rename_object' },
  { title: 'Delete selected', event: 'delete_object' },
)
app.addMenu(
  'Create',
  { title: 'Camera', event: 'create_object', arg: 'camera' },
  { title: 'Light', event: 'create_object', arg: 'light' },
  { title: 'Sphere', event: 'create_object', arg: 'sphere' },
  { title: 'Box', event: 'create_object', arg: 'box' },
  { title: 'Lathe', event: 'create_object', arg: 'lathe' },
  { title: 'Tree', event: 'create_object', arg: 'tree' },
  { title: 'Terrain', event: 'create_object', arg: 'heightmap' },
  { title: 'Composite', event: 'create_object', arg: 'composite' },
  { title: 'Instance', event: 'create_object', arg: 'instance' },
  { title: 'Material', event: 'create_object', arg: 'material' },
  { title: null },
  { title: 'Link camera', event: 'link_camera' },
  { title: 'Point', event: 'create_object', arg: 'point' },
)
app.addMenu(
  'View',
  { title: 'Front', event: 'scene_view', arg: 'front', cmd: '1' },
  { title: 'Side', event: 'scene_view', arg: 'side', cmd: '2' },
  { title: 'Top', event: 'scene_view', arg: 'top', cmd: '3' },
  { title: null },
  { title: 'Zoom out', event: 'zoom', arg: 1/1.5, cmd: ',', },
  { title: 'Zoom in', event: 'zoom', arg: 1.5, cmd: '.' },
  { title: 'Reset view', event: 'reset_view' },
  { title: 'Focus selection', event: 'focus_selection' },
  { title: 'Axis', event: 'toggle_axis', arg: true },
  { title: 'Crosshair', event: 'toggle_crosshair', arg: true },
  { title: null },
  { title: 'Render', event: 'render', cmd: 'r' },
  { title: 'Select camera', event: 'select_camera' },
  { title: 'Auto rerender', event: 'toggle_autorender', arg: true },
  { title: 'Reflections', event: 'toggle_reflections', arg: true },
  { title: 'Dither', event: 'toggle_dithering', arg: true },
  { title: 'Link hotspots', event: 'toggle_hotspots', arg: true },
)
app.addMenu(
  'Tool',
  { title: 'Pan', event: 'editor_mode', arg: 'pan', cmd: 'p' },
  { title: 'Move', event: 'editor_mode', arg: 'move', cmd: 'm' },
)
app.addMenu('Window',
  { title: 'Editor', event: 'app:show_child_window', arg: 'Editor' },
  { title: 'Objects', event: 'app:show_child_window', arg: 'Objects' },
  { title: 'Properties', event: 'app:show_child_window', arg: 'Properties' }
)
app.check('scene_view', 'front')
app.check('toggle_axis', true)
app.check('toggle_crosshair', true)
app.check('toggle_reflections', true)
app.check('toggle_autorender', true)
app.check('toggle_hotspots', true)
app.check('editor_mode', 'pan')
app.enable('edit_object', null, false)
app.enable('edit_scene', null, false)
app.enable('rename_object', null, false)
app.enable('delete_object', null, false)
app.enable('focus_selection', null, false)
app.enable('select_camera', null, false)
app.enable('copy_object', null, false)
app.enable('paste_object', null, false)
app.enable('create_object', 'point', false)
app.addWindow('Objects', ObjectList, {
  visible: true,
  offset: [0, 192+50],
  size: [256,300],
  sizing: 'noresize'
})
app.addWindow('Properties', Properties, {
  visible: true,
  offset: [256+20, 450+90],
  size: [200,100],
  sizing: 'noresize'
})
app.addWindow('Editor', Editor, {
  visible: true,
  offset: [256+20, 0],
  size: [600,450],
  sizing: 'noresize'
})

app.scene = Scene([])
app.breadcrumbs = []
let currentScene = []
let cameraId = -1
export const renderSize = { w: 256, h: 192 }
let { w, h } = renderSize

function RayTracer() {
  const hostRef = React.useRef()
  const renderScene = () => {
    const defaultCam = Camera(Transforms(Offset(-100,-100,240),Rotate(20,20,8)))
    let camera = currentScene.children
      .find(e => e.kind == 'camera' && e.id == cameraId) ?? defaultCam
    let entities = currentScene.children
    if (entities.every(e => e.kind != 'light')){
      entities = [
        Light(128, Offset(100,-100,100)),
        Light(64, Offset(-100,-100,100)),
        ...entities
      ]
    }
    raytraceParallel({
      canvas: hostRef.current,
      w,
      h,
      maxDepth: app.menuState['toggle_reflections'] == true ? 2 : 0,
      scene: compileScene(entities),
      camera,
      ditherer: app.menuState['toggle_dithering'] == true
        ? new FloydSteinbergDitherer()
        : new NoDitherer(),
    }).then((result) => {
      if (app.menuState['toggle_hotspots'] == true)
        drawLinks(hostRef.current, currentScene.children, cameraId)
      app.trigger('render_complete', result)
    })
  }

  useEvent(app, 'select_object', (obj) => {
    app.enable(
      'edit_object',
      null,
      obj?.kind == 'composite' || obj?.kind == 'lathe' || obj?.kind == 'patches'
    )
    app.enable('create_object', 'point', Boolean(currentScene.lathe && obj))
    app.enable('rename_object', null, !!obj)
    app.enable('delete_object', null, !!obj)
    app.enable('focus_selection', null, !!obj)
    app.enable('link_camera', null, obj?.kind == 'camera')
    app.enable('select_camera', null, obj?.kind == 'camera')
  })

  useEvent(app, 'scene', (arg) => {
    app.check('scene', arg)
    app.scene = {
      teapot: sceneTeapot(),
      island: sceneIsland(),
      mushroom: sceneMushroom(),
    }[arg]
    app.trigger('update_scene', app.scene)
  })
  useEvent(app, 'toggle_axis', () => {
    app.check('toggle_axis', !app.menuState['toggle_axis'])
  })
  useEvent(app, 'toggle_crosshair', () => {
    app.check('toggle_crosshair', !app.menuState['toggle_crosshair'])
  })
  useEvent(app, 'toggle_reflections', () => {
    app.check('toggle_reflections', !app.menuState['toggle_reflections'])
    app.trigger('render')
  })
  useEvent(app, 'toggle_dithering', () => {
    app.check('toggle_dithering', !app.menuState['toggle_dithering'])
    app.trigger('render')
  })
  useEvent(app, 'toggle_autorender', () => {
    app.check('toggle_autorender', !app.menuState['toggle_autorender'])
  })
  useEvent(app, 'toggle_hotspots', () => {
    app.check('toggle_hotspots', !app.menuState['toggle_hotspots'])
    app.trigger('render')
  })
  useEvent(app, 'pick_camera', (id) => {
    cameraId = id
    app.trigger('render')
  })
  useEvent(app, 'update_scene', (scene) => {
    currentScene = scene
    cameraId = scene.children.find(e => e.kind === 'camera')?.id
    app.enable('create_object', 'point', false)
    app.trigger('render')
  })
  useEvent(app, 'scene_modified', debounce(() => app.trigger('render'), 1000))
  useEvent(app, 'render', renderScene)

  React.useEffect(() => {
    setTimeout(() => {
      app.scene = sceneTeapot()
      app.trigger('scene', 'teapot')
    }, 0)
  }, [])

  return el('canvas', { width: w, height: h, ref: hostRef })
}

function drawLinks(canvas, children, cameraId) {
  if (cameraId < 0) return
  let ctx = canvas.getContext('2d')
  ctx.save()
  ctx.lineWidth = 1
  for (let link of children) {
    if (link.kind !== 'link' || link.source !== cameraId) continue
    if (link.hidden) continue
    ctx.strokeStyle = '#fff'
    ctx.strokeRect(
      Math.round(link.x * w) + 0.5, // +0.5 to align with pixel grid
      Math.round(link.y * h) + 0.5,
      Math.round(link.w * w),
      Math.round(link.h * h)
    )
    ctx.strokeStyle = '#000'
    ctx.strokeRect(
      Math.round(link.x * w) + 0.5 - 1,
      Math.round(link.y * h) + 0.5 - 1,
      Math.round(link.w * w) + 2,
      Math.round(link.h * h) + 2
    )
  }
  ctx.restore()
}

function debounce(callback, delay) {
  let timeoutId = null

  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}
