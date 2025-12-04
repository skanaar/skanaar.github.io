import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import {
  Camera,
  Sphere,
  Light,
  HeightMap,
  compileScene,
  BezierPatchSet,
  Offset,
  Scaling,
  Rotate,
  Lathe,
  BezierLathe,
  Composite,
  Box,
} from './raytracer/geometry.js'
import { Vec } from './raytracer/math.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { teapotPatches } from './raytracer/teapot.js'
import { SceneView } from './raytracer/SceneView.js'
import { SceneObjects } from './raytracer/SceneObjects.js'
import { Properties } from './raytracer/Properties.js'

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
  { title: 'Add offset', event: 'add_transform', arg: 'offset' },
  { title: 'Add rotation', event: 'add_transform', arg: 'rotate' },
  { title: 'Add scaling', event: 'add_transform', arg: 'scale' },
)
app.addMenu(
  'Camera',
  { title: 'Render', event: 'render' },
  { title: null },
  { title: 'Reflections', event: 'toggle_reflections', arg: true, cmd: 'm' },
  { title: 'Dither', event: 'toggle_dithering', arg: true, cmd: 'd' },
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
)
app.addMenu('Window',
  { title: 'Overview', event: 'app:show_child_window', arg: 'Overview' },
  { title: 'Objects', event: 'app:show_child_window', arg: 'Objects' },
  { title: 'Properties', event: 'app:show_child_window', arg: 'Properties' }
)
app.check('scene_view', 'front')
app.check('toggle_reflections', true)
app.addWindow('Objects', SceneObjects, {
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
app.addWindow('Overview', SceneView, {
  visible: true,
  offset: [256+20, 0],
  size: [400,300],
  sizing: 'noresize'
})

app.scene = []
let size = 256
let dithering = false
let reflections = true

function sceneTeapot() {
  return [
    Camera([Rotate(0,0,0), Offset(0,0,256+128)]),
    Light(16, [Offset(-100, -100, -100)]),
    Light(150, [Offset(200-128, 50-128, 256)]),
    Lathe('room', 4,
      [Vec(0,0,-4), Vec(Math.sqrt(2),0,-4), Vec(Math.sqrt(2),0,1), Vec(0,0,1)],
      [Rotate(0,0,45),Scaling(150,150,-150)]
    ),
    Sphere('mirror sphere', 'mirror', [Offset(60,-60,-60), Scaling(80,80,80)]),
    Box('box', [Rotate(45,45,0), Scaling(40,40,40)]),
    BezierPatchSet('teapot',
      teapotPatches,
      3,
      [Offset(-8,150,0), Scaling(45,45,45), Rotate(90, 0, 0.5)]
    ),
    Lathe('column',
      16,
      [
        Vec(25,0,-100), Vec(25,0,-80), Vec(20,0,-75),
        Vec(20,0,75), Vec(25,0,80), Vec(25,0,85), Vec(2,0,90),
        Vec(2,0,100), Vec(25,0,105), Vec(25,0,110), Vec(20,0,115)
      ],
      [Offset(-100,20,-100), Scaling(0.7,1.26,0.7), Rotate(90,0,0.5)]
    ),
  ]
}

function sceneIsland() {
  let rx = (y) => Rotate(0, y, 0)
  let pillar = [Vec(9,0,0),Vec(8,0,80)]
  return [
    Camera([Rotate(0,17,0), Rotate(17,0,0), Offset(0,0,256)]),
    Light(4000, [Offset(1000, -1000, 500)]),
    Light(16, [Offset(0, -30, 0)]),
    HeightMap(
      'island',
      { res: 16, size: 256, height: 0, bump: 64 },
      [Offset(0,72,0), Rotate(180,0,0)]
    ),
    Composite('temple', [
      Lathe('p1', 12, pillar, [rx(0), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('p2', 12, pillar, [rx(60), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('p3', 12, pillar, [rx(120), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('p4', 12, pillar, [rx(180), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('p4', 12, pillar, [rx(240), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('p4', 12, pillar, [rx(300), Offset(40,0,0), Rotate(90,0,0)]),
      Lathe('roof', 6,
        [Vec(55,0,0),Vec(55,0,10),Vec(0,0,20)],
        [Offset(0,-80,0), Rotate(90,0,0)]
      ),
    ], [Scaling(1,1.5,1), Offset(0,40,0)])
  ]
}

function sceneMushroom() {
  return [
    Camera([Rotate(20,20,0), Offset(0,0,256)]),
    Light(4000, [Offset(1000, -1000, 500)]),
    Light(1000, [Offset(-1000, 1000, 500)]),
    BezierLathe('mushroom-foot',
      32, 16,
      [Vec(20,0,0), Vec(30,0,0), Vec(30,0,20), Vec(25,0,50)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(90,0,0), Rotate(0,0,1)]
    ),
    Lathe('mushroom-gills',
      32,
      [Vec(50,0,50), Vec(25,0,50)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(90,0,0), Rotate(0,0,1)]
    ),
    BezierLathe('mushroom-hat',
      32, 16,
      [Vec(50,0,50), Vec(50,0,80), Vec(15,0,90), Vec(1,0,90)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(90,0,0), Rotate(0,0,1)]
    )
  ]
}

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

  useEvent(app, 'scene', apply((arg) => {
    app.check('scene', arg)
    app.scene = {
      teapot: sceneTeapot(),
      island: sceneIsland(),
      mushroom: sceneMushroom(),
    }[arg]
    app.trigger('update_scene', app.scene)
  }))
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
