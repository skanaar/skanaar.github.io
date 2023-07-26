import {
  CompositeGeometry,
  CubeGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  MeshGeometry,
} from './ThreeDeeEngine.js'

export class World {
  
  startLocation() {
    for (let y=0; y<this.map.length; y++)
      for (let x=0; x<this.map[0].length; x++)
        if (this.map[y][x] === '@') return [x,y]
    return [1,1]
  }
  
  cloneEntities() {
    return this.map
      .flatMap((row, y) =>
        row.split('').map((cell, x) => this.entities[cell] ? { ...this.entities[cell], x, y } : null))
      .filter(e => e)
  }
  
  mapModel() {
    const models = this.map.flatMap((row, y) => {
      return row.split('').map((cell, x) => {
        const model = this.models[this.tile(x, y).model]
        return new CompositeGeometry('', [['translate',x*100,y*100,0]], [model])
      })
    })
    return new CompositeGeometry('', [], models)
  }
  
  isWithinBounds(x, y) {
    return x >= 0 && x < this.map[0].length && y >= 0 && y < this.map.length
  }

  isWalkable(x, y){
    if (!this.isWithinBounds(x, y)) return false
    return this.tile(x, y).walkable
  }
  
  tile(x, y) {
    return this.tiles[this.map[y][x]] ?? this.tiles[' ']
  }

  map = [
    '##########',
    '#s#a #   #',
    '# ## ### #',
    '# #° °## #',
    '# #° °#v #',
    '# #° °#v #',
    '#=#° °##K#',
    '#     k# #',
    '#   @  | #',
    '##########',
  ]
  
  scripts = [
    [
      { type: 'condition', visit: [2,7] },
      { type: 'dialog', text: 'hello stranger, this is Gullmars Underplan', answers: ['I love it'] }
    ],
    [
      { type: 'condition', visit: [4,7] },
      { type: 'dialog', text: 'hello stranger, this is Gullmars Underplan', answers: ['I love it'] },
      { type: 'dialog', text: 'the ljus lager left over from before the Varsam Förnyelse is running out. We need the new brewery up and running soon!', answers: ['OK'] }
    ]
  ]

  entities = {
    a: {
      name: 'arboga 7,2', model: 'bottle', pickable: true, walkable: true,
      effect: { action: 'consume' }
    },
    s: { name: 'rock', model: 'stone', pickable: false, walkable: true },
    k: {
      name: 'gate key', model: 'chest', pickable: true, walkable: true,
      effect: { action: 'remove', remove: 'gate' }
    },
    K: {
      name: 'door key', model: 'chest', pickable: true, walkable: true,
      effect: { action: 'remove', remove: 'door' }
    },
    '@': { name: 'start', model: 'platform', pickable: false, walkable: true },
    '-': { name: 'gate', model: 'hGate', pickable: false, walkable: false },
    '|': { name: 'gate', model: 'vGate', pickable: false, walkable: false },
    '=': { name: 'door', model: 'hDoor', pickable: false, walkable: false },
    '‖': { name: 'door', model: 'vDoor', pickable: false, walkable: false },
  }
  
  tiles = {
    '#': { model: 'stoneWall', walkable: false },
    'O': { model: 'pillarWall', walkable: false },
    '°': { model: 'pillar', walkable: false },
    'v': { model: 'stalactites', walkable: false },
    ' ': { model: 'floor', walkable: true },
  }

  models = {
    stoneWall: new ExtrudeGeometry('stoneWall', [['scale',50,50,50]], [
      [-1,-0.8,-1],[-1,0,-1],[-1,0.8,-1],
      [-0.8,1,-1],[0,1,-1],[0.8,1,-1],
      [1,0.8,-1],[1,0,-1],[1,-0.8,-1],
      [0.8,-1,-1],[0,-1,-1],[-0.8,-1,-1],[-1,-0.8,-1]
    ], 2),

    platform: new LatheGeometry('platform', [], 8, [
      [16,0,50],[20,0,48],[36,0,48],[40,0,50]
    ]),

    pillarWall: new LatheGeometry('pillarWall', [], 16, [
      [-55,0,-50],[-55,0,-45],[-50,0,-40],[-45,0,-30],[-45,0,30],[-50,0,40],[-55,0,45],[-55,0,50]
    ]),

    pillar: new LatheGeometry('pillar', [], 8, [
      [-35,0,-50],[-35,0,-45],[-30,0,-40],[-25,0,-30],[-25,0,30],[-30,0,40],[-35,0,45],[-35,0,50]
    ]),

    stalactites: new CompositeGeometry('stalactites', [], [
      new LatheGeometry('', [['translate',20,20,0]], 7, [[1,0,0],[10,0,50]]),
      new LatheGeometry('', [['translate',-20,10,0]], 7, [[1,0,20],[15,0,50]]),
      new LatheGeometry('', [['translate',-30,5,0]], 7, [[10,0,-50],[1,0,0]]),
      new LatheGeometry('', [['translate',5,35,0]], 7, [[15,0,-50],[1,0,30]]),
      new LatheGeometry('', [['translate',0,4,0]], 7, [[15,0,-50],[5,0,-10],[4.5,0,5],[13,0,50]]),
    ]),

    stone: new CubeGeometry('stone', [['subdivide'], ['sphere',15,15,5], ['rotate',0,0,20], ['translate',0,0,42]]),

    bottle: new LatheGeometry('bottle', [['rotate',180,0,0], ['scale',0.1,0.1,0.1], ['translate',30,30,35]], 8, [
      [0,0,-140],[50,0,-150],[55,0,-145],[55,0,-40],[52,0,-10],[42,0,20],[28,0,50],[20,0,80],[18,0,110],[23,0,115],[20,0,135],[22,0,155],[18,0,159],[0,0,160]
    ]),

    chest: new CompositeGeometry('chest', [['scale',1,1,1], ['rotate',-90,0,30], ['translate',-20,20,45]], [
      new LatheGeometry('', [['translate',0,5,0]], 8, [[2,0,-15],[10,0,-15],[10,0,15],[2,0,15]], 180),
      new CubeGeometry('', [['scale',10,5,15]])
    ]),

    floor: new MeshGeometry('floor', [['subdivide'], ['scale',45,45,1], ['translate',0,0,50]], [[[-1,-1,0],[1,-1,0],[1,1,0],[-1,1,0]]]),

    hDoor: new CompositeGeometry('hDoor', [], [
      ...[-25, 25].map(x => new CubeGeometry('', [['scale',20,2,50], ['translate',x,0,0]]))
    ]),

    vDoor: new CompositeGeometry('vDoor', [], [
      ...[-25, 25].map(y => new CubeGeometry('', [['scale',2,20,50], ['translate',0,y,0]]))
    ]),

    hGate: new CompositeGeometry('hGate', [], [
      ...[-40, -20, 0, 20, 40].map(x => new CubeGeometry('', [['scale',5,5,50], ['translate',x,0,0]]))
    ]),

    vGate: new CompositeGeometry('vGate', [], [
      ...[-40, -20, 0, 20, 40].map(y => new CubeGeometry('', [['scale',5,5,50], ['translate',0,y,0]]))
    ])
  }
}
