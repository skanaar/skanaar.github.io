import {
  Camera,
  Sphere,
  Light,
  HeightMap,
  BezierPatchSet,
  Offset,
  Scaling,
  Rotate,
  Lathe,
  BezierLathe,
  Composite,
  Transforms,
  Scene,
} from './geometry.js'
import { Vec } from './math.js'
import { teapotPatches } from './teapot.js'

export function sceneTeapot() {
  return Scene([
    Camera(Transforms(Offset(0,0,256+128))),
    Light(16, Offset(-100, -100, -100)),
    Light(150, Offset(200-128, 50-128, 256)),
    Lathe('room', 4,
      [Vec(0,-4,0), Vec(Math.sqrt(2),-4,0), Vec(Math.sqrt(2),1,0), Vec(0,1,0)],
      Transforms(Offset(0,0,0), Rotate(-90,45,0),Scaling(150,150,-150))
    ),
    Sphere('mirror sphere', 'mirror',
      Transforms(Offset(60,-60,-60), Rotate(0,0,0), Scaling(80,80,80))),
    BezierPatchSet('teapot',
      teapotPatches,
      3,
      Transforms(Offset(-8,150,0), Rotate(90, 0, 0.5), Scaling(45,45,45))
    ),
    Lathe('column', 16,
      [
        Vec(20,-115,0),
        Vec(25,-110,0),
        Vec(25,-105,0),
        Vec(0,-100,0),
        Vec(0,-90,0),
        Vec(25,-85,0),
        Vec(25,-80,0),
        Vec(20,-75,0),
        Vec(20,75,0),
        Vec(25,80,0),
        Vec(25,100,0),
      ],
      Transforms(Offset(-100,20,-100), Rotate(0,0,0.5), Scaling(0.7,1.25,0.7))
    ),
  ])
}

export function sceneIsland() {
  let pillar = [Vec(8,-80,0),Vec(9,0,0)]
  return Scene([
    Camera(Transforms(Offset(64,-64,256), Rotate(17,-12,0))),
    Light(4000, Offset(1000, -1000, 500)),
    Light(16, Offset(0, -30, 0)),
    HeightMap(
      'island',
      { res: 16, size: 256, isola: 1, zoom: 10, persistence: 0.5, octaves: 4 },
      Transforms(Offset(0,72,0), Rotate(180,0,0), Scaling(200, 50, 200))
    ),
    Composite('temple', [
      Lathe('p1', 12, pillar, Transforms(Offset(40,0,0), Rotate(0,0,0))),
      Lathe('roof', 6,
        [Vec(0,-20,0),Vec(55,-10,0),Vec(55,0,0)],
        Transforms(Offset(0,-80,0))
      ),
    ], Transforms(Offset(0,40,0), Scaling(1,1.5,1)))
  ])
}

export function sceneMushroom() {
  return Scene([
    Camera(Transforms(Offset(-100,-100,178), Rotate(20,20,8))),
    Light(4000, Offset(1000, -1000, 500)),
    Light(1000, Offset(-1000, 1000, 500)),
    BezierLathe('mushroom-foot',
      32, 16,
      [Vec(20,0,0), Vec(30,0,0), Vec(30,20,0), Vec(25,50,0)],
      Transforms(Offset(0,72,-80), Rotate(0,0,1), Scaling(2,2,2))
    ),
    Lathe('mushroom-gills',
      32,
      [Vec(50,50,0), Vec(25,50,0)],
      Transforms(Offset(0,72,-80), Rotate(0,0,1), Scaling(2,2,2))
    ),
    BezierLathe('mushroom-hat',
      32, 16,
      [Vec(50,50,0), Vec(50,80,0), Vec(15,90,0), Vec(1,90,0)],
      Transforms(Offset(0,72,-80), Rotate(0,0,1), Scaling(2,2,2))
    )
  ])
}
