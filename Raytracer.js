import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import { compileScene } from './raytracer/geometry.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { Editor } from './raytracer/Editor.js'
import { ObjectList } from './raytracer/ObjectList.js'
import { Properties } from './raytracer/Properties.js'
import { sceneIsland, sceneMushroom, sceneTeapot } from './raytracer/scenes.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.position(30, 60)
app.addMenu(
  'File',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Island', event: 'scene', arg: 'island' },
  { title: 'Mushroom', event: 'scene', arg: 'mushroom' },
)
app.addMenu(
  'Edit',
  { title: 'Edit composite', event: 'edit_level', arg: 'composite', cmd: 'e' },
  { title: 'Edit scene', event: 'edit_level', arg: 'scene' },
  { title: 'Rename selected...', event: 'rename_object' },
  { title: 'Delete selected', event: 'delete_object' },
  { title: null },
  { title: 'Create light', event: 'create_object', arg: 'light' },
  { title: 'Create sphere', event: 'create_object', arg: 'sphere' },
  { title: 'Create box', event: 'create_object', arg: 'box' },
  { title: 'Create instance', event: 'create_object', arg: 'instance' },
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
  { title: null },
  { title: 'Render', event: 'render', cmd: 'r' },
  { title: 'Reflections', event: 'toggle_reflections', arg: true },
  { title: 'Dither', event: 'toggle_dithering', arg: true },
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
app.check('toggle_reflections', true)
app.check('editor_mode', 'pan')
app.enable('edit_level', 'composite', false)
app.enable('edit_level', 'scene', false)
app.enable('rename_object', null, false)
app.enable('delete_object', null, false)
app.enable('focus_selection', null, false)
app.addWindow('Objects', ObjectList, {
  visible: true,
  offset: [0, 256+50],
  size: [200,300],
  sizing: 'noresize'
})
app.addWindow('Properties', Properties, {
  visible: true,
  offset: [200+20, 256+50+50],
  size: [200,100],
  sizing: 'noresize'
})
app.addWindow('Editor', Editor, {
  visible: true,
  offset: [256+20, 0],
  size: [400,300],
  sizing: 'noresize'
})

app.scene = []
app.breadcrumbs = []
let size = 256
let dithering = false
let reflections = true

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event) => {
    action(arg, event)

    raytraceParallel({
      canvas: hostRef.current,
      size,
      maxDepth: reflections ? 2 : 0,
      scene: compileScene(app.scene),
      ditherer: dithering ? new FloydSteinbergDitherer() : new NoDitherer(),
    }).then((result) => app.trigger('done', result))
  }

  useEvent(app, 'select_object', (obj) => {
    app.enable('edit_level', 'composite', obj.kind == 'composite')
    app.enable('rename_object', null, !!obj)
    app.enable('delete_object', null, !!obj)
    app.enable('focus_selection', null, !!obj)
  })

  useEvent(app, 'scene', apply((arg) => {
    app.check('scene', arg)
    app.scene = {
      teapot: sceneTeapot(),
      island: sceneIsland(),
      mushroom: sceneMushroom(),
    }[arg]
    app.trigger('update_scene', app.scene)
  }))
  useEvent(app, 'edit_level', (arg) => {
    if (arg != 'scene') return
    app.enable('edit_level', 'scene', false)
    app.enable('edit_level', 'composite', true)
    app.breadcrumbs = []
    app.trigger('update_scene', app.scene)
  })
  useEvent(app, 'toggle_reflections', apply(() => {
    reflections = !reflections
    app.check('toggle_reflections', reflections)
  }))
  useEvent(app, 'toggle_dithering', apply(() => {
    dithering = !dithering
    app.check('toggle_dithering', dithering)
  }))
  useEvent(app, 'render', apply(() => {}))

  React.useEffect(() => {
    setTimeout(() => {
      app.scene = sceneTeapot()
      app.trigger('scene', 'teapot')
    }, 0)
  }, [])

  return el('canvas', { width: size, height: size, ref: hostRef })
}
