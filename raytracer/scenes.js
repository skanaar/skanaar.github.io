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
  Transforms,
} from './geometry.js'
import { Vec } from './math.js'
import { teapotPatches } from './teapot.js'

export function sceneTeapot() {
  return [
    Camera(Transforms(Offset(0,0,256+128))),
    Light(16, Offset(-100, -100, -100)),
    Light(150, Offset(200-128, 50-128, 256)),
    Lathe('room', 4,
      [Vec(0,0,-4), Vec(Math.sqrt(2),0,-4), Vec(Math.sqrt(2),0,1), Vec(0,0,1)],
      Transforms(Offset(0,0,0), Rotate(0,0,45),Scaling(150,150,-150))
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
        Vec(25,0,-100), Vec(25,0,-80), Vec(20,0,-75),
        Vec(20,0,75), Vec(25,0,80), Vec(25,0,85), Vec(0,0,90),
        Vec(0,0,100), Vec(25,0,105), Vec(25,0,110), Vec(20,0,115)
      ],
      Transforms(Offset(-100,20,-100), Rotate(90,0,0.5), Scaling(0.7,0.7,1.25))
    ),
  ]
}

export function sceneIsland() {
  let pillar = [Vec(9,0,0),Vec(8,0,80)]
  return [
    Camera(Transforms(Offset(64,-64,256), Rotate(17,-12,0))),
    Light(4000, Offset(1000, -1000, 500)),
    Light(16, Offset(0, -30, 0)),
    HeightMap(
      'island',
      { res: 16, size: 256, height: 0, bump: 64 },
      Transforms(Offset(0,72,0), Rotate(180,0,0))
    ),
    Composite('temple', [
      Lathe('p1', 12, pillar, Transforms(Offset(40,0,0), Rotate(90,0,0))),
      Lathe('roof', 6,
        [Vec(55,0,0),Vec(55,0,10),Vec(0,0,20)],
        Transforms(Offset(0,-80,0), Rotate(90,0,0))
      ),
    ], Transforms(Offset(0,40,0), Scaling(1,1.5,1)))
  ]
}

export function sceneMushroom() {
  return [
    Camera(Transforms(Offset(-100,-100,178), Rotate(20,20,8))),
    Light(4000, Offset(1000, -1000, 500)),
    Light(1000, Offset(-1000, 1000, 500)),
    BezierLathe('mushroom-foot',
      32, 16,
      [Vec(20,0,0), Vec(30,0,0), Vec(30,0,20), Vec(25,0,50)],
      Transforms(Offset(0,72,-80), Rotate(90,0,1), Scaling(2,2,2))
    ),
    Lathe('mushroom-gills',
      32,
      [Vec(50,0,50), Vec(25,0,50)],
      Transforms(Offset(0,72,-80), Rotate(90,0,1), Scaling(2,2,2))
    ),
    BezierLathe('mushroom-hat',
      32, 16,
      [Vec(50,0,50), Vec(50,0,80), Vec(15,0,90), Vec(1,0,90)],
      Transforms(Offset(0,72,-80), Rotate(90,0,1), Scaling(2,2,2))
    )
  ]
}
