import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import {
  Camera,
  Sphere,
  Light,
  HeightMap,
  Sun,
  compileScene,
  BezierPatchSet,
  Offset,
  Scaling,
  Rotate,
  Lathe,
  BezierLathe,
  Composite,
} from './raytracer/geometry.js'
import { Vec, π } from './raytracer/math.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { teapotPatches } from './raytracer/teapot.js'
import { SceneView, SceneObjects, Properties } from './raytracer/SceneView.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.addToAppMenu({
  title: 'Show options...',
  event: 'app:show_child_window',
  arg: 'Options',
  cmd: 'i',
})
app.addMenu(
  'File',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Island', event: 'scene', arg: 'island' },
  { title: 'Mushroom', event: 'scene', arg: 'mushroom' },
)
app.addMenu(
  'View',
  { title: 'Front', event: 'scene_view', arg: 'front', cmd: '1' },
  { title: 'Side', event: 'scene_view', arg: 'side', cmd: '2' },
  { title: 'Top', event: 'scene_view', arg: 'top', cmd: '3' },
  { title: null },
  { title: 'Zoom out', event: 'zoom', arg: 0.5, cmd: ',', },
  { title: 'Zoom in', event: 'zoom', arg: 2, cmd: '.' },
)
app.check('scene_view', 'front')
app.addWindow('Options', RenderOptions, {
  visible: true,
  offset: [256+20,0],
  size: [200,100]
})
app.addWindow('Scene Objects', SceneObjects, {
  visible: true,
  offset: [0, 256+40],
  size: [200,300],
  sizing: 'noresize'
})
app.addWindow('Properties', Properties, {
  visible: true,
  offset: [256+20, 100+40],
  size: [200,100],
  sizing: 'noresize'
})
app.addWindow('Scene View', SceneView, {
  visible: true,
  offset: [220, 256+40],
  size: [400,300],
  sizing: 'noresize'
})

let size = 256
let ditherMethod = 'none' //'floydsteinberg'
let maxDepth = 3

export let scene = []

function sceneTeapot() {
  return [
    Camera([Rotate(0,0,0), Offset(0,0,256+128)]),
    Light(Vec(-100, -100, -100), 16),
    Light(Vec(200-128, 50-128, 256), 150),
    Lathe('room', 4,
      [Vec(0.01,0,-4), Vec(1.414,0,-4), Vec(1.414,0,1), Vec(0.01,0,1)],
      [Rotate(0,0,Math.PI/4),Scaling(150,150,-150)]
    ),
    Sphere('mirror sphere', Vec(60,-60,-60), 80, 'mirror'),
    BezierPatchSet('teapot',
      teapotPatches,
      3,
      [Offset(-8,150,0), Scaling(45,45,45), Rotate(Math.PI/2, 0, 0.5)]
    ),
    Lathe('column',
      16,
      [
        Vec(25,0,-100), Vec(25,0,-80), Vec(20,0,-75),
        Vec(20,0,75), Vec(25,0,80), Vec(25,0,85), Vec(2,0,90),
        Vec(2,0,100), Vec(25,0,105), Vec(25,0,110), Vec(20,0,115)
      ],
      [Offset(-100,20,-100), Scaling(0.7,1.26,0.7), Rotate(Math.PI/2,0,0.5)]
    ),
  ]
}

function sceneIsland() {
  return [
    Camera([Rotate(0,0.3,0), Rotate(0.3,0,0), Offset(0,0,256)]),
    Sun(Vec(-1, 1, -0.5), 2),
    Light(Vec(0, -30, 0), 16),
    HeightMap(
      'island',
      { res: 16, size: 256, height: 0, bump: 64 },
      [Offset(0,72,0), Rotate(π,0,0)]
    ),
    Composite('temple', [
      Lathe('p1', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,0.0,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
      Lathe('p2', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,π/3,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
      Lathe('p3', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,π*2/3,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
      Lathe('p4', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,π,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
      Lathe('p4', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,π*4/3,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
      Lathe('p4', 12, [Vec(9,0,0),Vec(8,0,80)],
        [Rotate(0,π*5/3,0), Offset(40,0,0), Rotate(π/2,0,0)]
      ),
    ], [Scaling(1,2,1), Offset(0,40,0)])
  ]
}

function sceneMushroom() {
  return [
    Camera([Rotate(0.4,0.4,0), Offset(0,0,256)]),
    Sun(Vec(-1, 1, -0.5), 2),
    Sun(Vec(1, -1, -0.5), 0.5),
    BezierLathe('mushroom-foot',
      32, 16,
      [Vec(20,0,0), Vec(30,0,0), Vec(30,0,20), Vec(25,0,50)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
    ),
    Lathe('mushroom-gills',
      32,
      [Vec(50,0,50), Vec(25,0,50)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
    ),
    BezierLathe('mushroom-hat',
      32, 16,
      [Vec(50,0,50), Vec(50,0,80), Vec(15,0,90), Vec(1,0,90)],
      [Offset(0,72,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
    )
  ]
}

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event) => {
    action(arg, event)

    let ditherer = {
      floydsteinberg: new FloydSteinbergDitherer(),
      none: new NoDitherer(),
    }[ditherMethod]

    raytraceParallel({
      canvas: hostRef.current,
      size,
      maxDepth,
      scene: compileScene(scene),
      ditherer,
    }).then((result) => app.trigger('done', result))
  }
  let render = apply(() => null)

  useEvent(app, 'scene', apply((arg) => {
    app.check('scene', arg)
    scene = {
      teapot: sceneTeapot(),
      island: sceneIsland(),
      mushroom: sceneMushroom(),
    }[arg]
    app.trigger('update-scene', scene)
  }))
  useEvent(app, 'dither', apply((arg) => { ditherMethod = arg }))
  useEvent(app, 'maxdepth', apply((arg) => { maxDepth = arg }))

  React.useEffect(() => {
    setTimeout(() => {
      scene = sceneTeapot()
      app.trigger('scene', 'teapot')
    }, 0)
  }, [])

  return el('canvas', { width: size, height: size, ref: hostRef })
}

function RenderOptions() {
  const [reflections, setReflections] = React.useState(maxDepth)
  const [dither, setDither] = React.useState(ditherMethod)
  const [duration, setDuration] = React.useState(0)
  useEvent(app, 'maxdepth', (arg) => setReflections(arg))
  useEvent(app, 'dither', (arg) => setDither(arg))
  useEvent(app, 'done', (arg) => setDuration(arg.duration))

  return el(
    'div',
    { style: { display: 'flex', flexDirection: 'column', margin: 10 } },
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: reflections > 0,
        onChange: (e) => app.trigger('maxdepth', e.target.checked ? 3 : 0),
      }),
      'Reflections'
    ),
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: dither == 'floydsteinberg',
        onChange: (e) => {
          app.trigger('dither', e.target.checked ? 'floydsteinberg' : 'none')
        },
      }),
      'Dither'
    ),
    `Duration: ${duration.toFixed(0)}ms`
  )
}
