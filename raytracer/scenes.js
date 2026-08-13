import {
  Camera,
  Sphere,
  Light,
  HeightMap,
  BezierPatchSet,
  Lathe,
  BezierLathe,
  Composite,
  Scene,
  Tree,
  Box,
  Material,
} from './objects.js'
import { Offset, Scaling, Rotate, Transforms } from './objects.js'
import { Vec } from './math.js'
import { teapotPatches } from './teapot.js'

export function sceneTeapot() {
  return Scene([
    Camera(Transforms(Offset(0,0,420))),
    Light(16, Offset(-100, -100, -100)),
    Light(150, Offset(200-128, 50-128, 256)),
    Lathe('room', 4,
      [Vec(0,-4,0), Vec(Math.sqrt(2),-4,0), Vec(Math.sqrt(2),1,0), Vec(0,1,0)],
      Transforms(Offset(0,0,0), Rotate(-90,0,45),Scaling(150,150,-150))
    ),
    Sphere('mirror sphere', 'mirror',
      Transforms(Offset(60,-60,-60), Rotate(0,0,0), Scaling(80,80,80))),
    BezierPatchSet('teapot',
      teapotPatches,
      3,
      Transforms(Offset(-8,150,0), Rotate(0, -15, 0), Scaling(0.8,0.8,0.8))
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
    Material('diffuse', 'solid', 1),
    Material('dark', 'solid', 0.5),
    Material('wood', 'wood', 0.5, 1,5),
    Material('granite', 'noise', 0, 0.3, 20),
    Material('mirror', 'mirror', 0),
  ])
}

export function sceneIsland() {
  let pillar = [Vec(8,-80,0),Vec(9,0,0)]
  let pillars = [
    Offset(38,0,0),
    Offset(12,0,-37),
    Offset(-31,0,-22),
    Offset(12,0,36),
    Offset(-30,0,22),
  ]
  let hex = [Vec(0,0,0),Vec(29,-5,0),Vec(32,0,0),Vec(33,200,0)]
  let hexes = [
    Offset(7,60,-134),
    Offset(-20,53,-150),
    Offset(7,45,-165),
    Offset(35,50,-150),
    Offset(-20,50,-181),
    Offset(7,50,-197),
    Offset(-20,40,-213),
    Offset(-48,60,-197),
  ]
  return Scene([
    Camera(Transforms(Offset(64,-64,256), Rotate(17,-12,0))),
    Light(4000, Offset(930, -175, 585)),
    Light(16, Offset(0, -30, 0)),
    HeightMap(
      'island',
      { res: 32, rseed: 34, isola: 1, zoom: 17, persistence: 0.6, octaves: 4, threshold: 0.1 },
      Transforms(Offset(0, 72, 0), Rotate(180, 0, 0), Scaling(300, 20, 300)),
      'ground'
    ),
    Tree('tree',
      { randomSeed: 8 },
      Transforms(Offset(-101,62,6), Rotate(0,-2,0), Scaling(0.29,0.29,0.29))
    ),
    ...hexes.map((offset, i) => Lathe(`hex ${i+1}`, 6, hex,
      Transforms(offset, Rotate(0,0,0), Scaling(0.51,0.51,0.51))
    )),
    Box('water', Transforms(Offset(0,70,0), Rotate(0, 0, 0), Scaling(1000, 0.1, 1000)), 'dark'),
    Composite('temple', [
      ...pillars.map((offset, i) =>
        Lathe(`p${i+1}`, 12, pillar, Transforms(offset, Rotate(0,0,0)))
      ),
      Lathe('roof', 5,
        [Vec(0,-20,0),Vec(55,-10,0),Vec(55,0,0)],
        Transforms(Offset(0,-80,0))
      ),
    ], Transforms(Offset(81, 68, 51), Rotate(0, 0, 0), Scaling(0.47, 0.47, 0.47))),
    Sphere('sun', 'diffuse', Transforms(Offset(1300,-350,830), Rotate(0,0,0), Scaling(300,300,300))),
    Sphere('sun', 'diffuse', Transforms(Offset(1300,-350,830), Rotate(0,0,0), Scaling(300,300,300))),
    Sphere('moon', 'diffuse', Transforms(Offset(370,-310,530), Rotate(0,0,0), Scaling(60,60,60))),
    Material('diffuse', 'solid', 1),
    Material('dark', 'solid', 0.4),
    Material('wood', 'wood', 0.5, 1, 5),
    Material('granite', 'noise', 0, 0.3, 20),
    Material('ground', 'noise', 0.4, 0.7, 10),
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
    ),
    Material('diffuse', 1),
  ])
}
