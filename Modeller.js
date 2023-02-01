import { el, App, Button } from './assets/system.js'

function seq(count) {
  return [...new Array(count)].map((_, i) => i)
}

const icon = 'cube.svg'
export const app = new App('Modeller', Modeller, icon, [400, 475], 'noresize')

export function Modeller() {
  const zoom = 0.85
  const [mesh, setMesh] = React.useState([])
  const [box, setBox] = React.useState([])
  const [selected, setSelected] = React.useState(0)

  const [cameraIndex, setCameraIndex] = React.useState(0)
  const cameraModes = ['perspective', 'top', 'front', 'back', 'side', 'iso']
  
  React.useEffect(() => updateMesh(cameraModes[cameraIndex], models[selected]), [])

  function cycleMode() {
    const index = (cameraIndex + 1) % cameraModes.length
    setCameraIndex(index)
    updateMesh(cameraModes[index], models[selected])
  }
  
  function changeSelected(delta) {
    const index = (selected + delta + models.length) % models.length
    setSelected(index)
    updateMesh(cameraModes[cameraIndex], models[index])
  }

  function compile(model) {
    var compilate = {
      name: 'Compiled ' + model.name,
      geometry: 'mesh',
      transform: [['scale', 1, 1, 1], ['rotate', 0, 0, 0], ['translate', 0, 0, 0]],
      quads: buildMesh(model).map(q => q.map(p => p.map(x => Math.round(x))))
    }
    models.push(compilate)
  }

  function buildMesh(model){
    switch(model.geometry) {
    case 'lathe': return applyTransforms(lathe(model), model)
    case 'composite': return applyTransforms(model.parts.flatMap(buildMesh), model)
    case 'cube': return applyTransforms(cube(), model)
    case 'mesh': return applyTransforms(model.quads, model)
    }
  }
  
  function updateMesh(camera, model){
    let mesh = applyPerspective(camera, zoom, buildMesh(model))
    mesh = mesh.filter(function (quad) {
      let normal = vcross(vdiff(quad[2], quad[0]), vdiff(quad[1], quad[3]))
      return normal[2] < 0
    })
    const sorter = (quad) => -(quad[0][2]+quad[2][2])
    mesh = mesh.sort((a,b) => sorter(a) - sorter(b))
    let box = applyPerspective(camera, zoom, [[[-170,-170,0], [-170,170,0], [170,170,0], [170,-170,0]]])
    setMesh(mesh)
    setBox(box)
  }

  function shading(quad) {
    var normal = vnormalize(vcross(vdiff(quad[2], quad[0]), vdiff(quad[1], quad[3])))
    var shade = Math.ceil(200*vdot(normal, vnormalize([1,-1,-1])))
    if (shade < 0) shade = 0
    return 'rgba('+[shade,shade,shade].join()+',0.85)'
  }

  return (
    el('modeller-viewer', {},
      el('style', {},
        `modeller-viewer header {
          text-align: center;
          position: absolute;
          left: 10px;
          right: 10px;
          top: 10px;
        }
        modeller-viewer footer {
          display: flex;
          justify-content: space-between;
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 10px;
        }
        modeller-viewer .canvas-3d {
          display: block;
          position: relative;
          margin: -10px;
          top: 20px;
          width: 400px;
          height: 450px;
        }
        modeller-viewer .canvas-3d.offset {
          top: -65px;
        }
        modeller-viewer svg.canvas-3d path {
          fill: #fff;
          stroke-linejoin: bevel;
          stroke-width: 1px;
          stroke: #000;
        }
        modeller-viewer svg.canvas-3d path.outline {
          stroke: #000;
          stroke-width: 1px;
          stroke-dasharray: 1 5;
        }`),

      el('svg', {
        className: 'canvas-3d ' + (cameraIndex === 1 ? 'offset' : ''),
        viewBox: '350 220 300 300'
      },
        box.map((e, i) => el('path', {
          key: `b${i}`,
          d: `M${e[0][0]},${e[0][1]} L${e[1][0]},${e[1][1]} L${e[2][0]},${e[2][1]} L${e[3][0]},${e[3][1]} Z`,
          fill: 'none',
          className: 'outline'
        })),
        mesh.map((e, i) => el('path', {
          key: `m${i}`,
          d: `M${e[0][0]},${e[0][1]} L${e[1][0]},${e[1][1]} L${e[2][0]},${e[2][1]} L${e[3][0]},${e[3][1]} Z`,
          fill: 'none',
          className: shading(e)
        } ))
      ),

      el('header', {}, models[selected].name),

      el('footer', {},
        el(Button, { onClick: () => changeSelected(-1) }, '<'),
        el(Button, { onClick: cycleMode }, 'Camera'),
        el(Button, { onClick: () => changeSelected(+1) }, '>'),
      ),
    )
  )
}

function cube() {
  return [
    [[-1,-1,1],[-1,1,1],[1,1,1],[1,-1,1]],
    [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]],
    [[-1,-1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1]],
    [[1,1,-1],[1,-1,-1],[1,-1,1],[1,1,1]],
    [[1,-1,-1],[-1,-1,-1],[-1,-1,1],[1,-1,1]],
    [[1,1,1],[-1,1,1],[-1,1,-1],[1,1,-1]]
  ]
}

function lathe(model) {
  var mesh = []
  var maxAngle = (model.angle || 360) * d2r
  seq(model.res).map(function (slice) {
    var vertex = (i,j) => mapply(rotateZ(maxAngle * i/model.res), model.path[j])
    for (var i=1; i<model.path.length; i++) {
      mesh.push([vertex(slice,i), vertex(slice+1,i), vertex(slice+1,i-1), vertex(slice,i-1)])
    }
  })
  return mesh
}

function transformQuad(quad, matrix) {
  return quad.map(p => mapply(matrix, p))
}

function sq(x) {
  return x * x
}

function parabola(p, vec) {
  var dir = vnormalize(vec)
  var lift = vdot(dir, p)
  var p2 = vadd(vmult(-lift, dir), p)
  return vadd(p, vmult(sq(vmag(p2)), vec))
}

function lerp(k, a, b) { return (1-k)*a + k*b }

function radialWave(p, args) {
  let radius = lerp(args[1], 0.5 + 0.5 * Math.cos(args[0] * Math.atan2(p[1], p[0])), 1)
  return [p[0]*radius, p[1]*radius, p[2]]
}

function subdivideQuad(quad) {
  let mid = (i,j) => vmult(0.5, vadd(quad[i], quad[j]))
  let center = vmult(0.5, vadd(mid(0,1), mid(2,3)))
  return [
    [quad[0], mid(0,1), center, mid(0,3)],
    [mid(0,1), quad[1], mid(1,2), center],
    [center, mid(1,2), quad[2], mid(2,3)],
    [mid(3,0), center, mid(2,3), quad[3]]
  ]
}

function transformMesh(mesh, m) {
  if (m[0] == 'scale')
    return mesh.map(quad => transformQuad(quad, scale(m[1], m[2], m[3])))
  if (m[0] == 'rotate')
    return mesh.map(quad => transformQuad(quad, rotateXYZ(m[1], m[2], m[3])))
  if (m[0] == 'translate')
    return mesh.map(quad => quad.map(p => [p[0]+m[1], p[1]+m[2], p[2]+m[3]]))
  if (m[0] == 'subdivide')
    return mesh.flatMap(subdivideQuad)
  if (m[0] == 'parabola'){
    var vec = [m[1], m[2], m[3]]
    return mesh.map(quad => quad.map(p => parabola(p, vec)))
  }
  if (m[0] == 'sphere'){
    var s = scale(m[1], m[2], m[3])
    return mesh.map(quad => quad.map(p => mapply(s, vnormalize(p))))
  }
  if (m[0] == 'radial-wave'){
    var args = [m[1], m[2], m[3]]
    return mesh.map(quad => quad.map(p => radialWave(p, args)))
  }
}

function applyTransforms(mesh, model) {
  return model.transform.reduce((mesh, trans) => transformMesh(mesh, trans), mesh)
}

function applyPerspective(camera, scaleFactor, mesh) {
  var zoom = scale(scaleFactor, scaleFactor, scaleFactor)
  var perspective = {
    top: zoom,
    front: mmult(zoom, rotateX(-Math.PI/2)),
    back: mmult(zoom, mmult(rotateX(Math.PI/2), rotateZ(Math.PI))),
    side: mmult(zoom, mmult(rotateY(Math.PI/2), rotateZ(Math.PI/2))),
    iso: mmult(zoom, mmult(rotateZ(-0.75), rotateX(-1.1))),
    perspective: mmult(zoom, mmult(rotateZ(Math.PI/3-Math.PI/2), rotateX(-1.05)))
  }[camera] || zoom
  return mesh.map(q => transformQuad(q, perspective).map(p => vtranslate(p, [500,400,0])))
}

var d2r = Math.PI*2/360
var rotateX = (a) => [1,0,0,  0,Math.cos(a),-Math.sin(a),  0,Math.sin(a),Math.cos(a)]
var rotateY = (a) => [Math.cos(a),0,Math.sin(a), 0,1,0, -Math.sin(a),0,Math.cos(a)]
var rotateZ = (a) => [Math.cos(a),-Math.sin(a),0,  Math.sin(a),Math.cos(a),0,  0,0,1]
var rotateXYZ = (x,y,z) => mmult(mmult(rotateX(d2r*x), rotateY(d2r*y)), rotateZ(d2r*z))
var scale = (x,y,z) => [x,0,0,  0,y,0,  0,0,z]
var identity = () => [1,0,0, 0,1,0, 0,0,1]
var vtranslate = (vec, delta) => [vec[0]+delta[0], vec[1]+delta[1], vec[2]+delta[2]]
var vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]]
var vdiff = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
var vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
var vmult = (k, v) => [k*v[0], k*v[1], k*v[2]]
var vmag = v => Math.sqrt(vdot(v, v))
var vnormalize = v => vmult(1/vmag(v), v)
var vcross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]

function mapply (matrix, vec) {
    return [vec[0]*matrix[0+3*0] + vec[1]*matrix[1+3*0] + vec[2]*matrix[2+3*0],
            vec[0]*matrix[0+3*1] + vec[1]*matrix[1+3*1] + vec[2]*matrix[2+3*1],
            vec[0]*matrix[0+3*2] + vec[1]*matrix[1+3*2] + vec[2]*matrix[2+3*2]]
}

function mmult (a, b) {
    var m = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
    for (var i=0; i<3; i++) {
        for (var j=0; j<3; j++) {
            for (var k=0; k<3; k++) {
                m[i+3*j] += a[i+3*k]*b[k+3*j]
            }
        }
    }
    return m
}

const models = [
  {
    "name": "Trade Conduit",
    "geometry": "composite",
    "transform": [["rotate",90,0,10],["translate",0,0,-80]],
    "parts": [
      {"geometry":"lathe","res":12,"transform":[["scale",1.75,1.75,1],["translate",0,0,-80]],"path":[[42,0,30],[35,0,10],[35,0,-10],[40,0,-30],[42,0,-30],[42,0,30]]},
      {"geometry":"lathe","res":12,"transform":[["scale",1.75,1.75,1],["translate",0,0,0]],"path":[[42,0,30],[35,0,10],[35,0,-10],[40,0,-30],[42,0,-30],[42,0,30]]},
      {"geometry":"lathe","res":12,"transform":[["scale",1.75,1.75,1],["translate",0,0,80]],"path":[[42,0,30],[35,0,10],[35,0,-10],[40,0,-30],[42,0,-30],[42,0,30]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Freelancer",
    "geometry": "composite",
    "transform": [["scale",1.4,1.2,1.2],["rotate",180,0,90],["translate",0,20,-65]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",90,90,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-60,35,20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",90,90,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-40,75,-20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",90,90,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-60,-35,20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",90,90,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-40,-75,-20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":7,"transform":[["scale",1,0.75,1.4],["rotate",90,0,0],["translate",45,0,0],["parabola",0,0,-0.002]],"path":[[0,0,-50],[25,0,-50],[45,0,-15],[45,0,15],[25,0,50],[0,0,50]]},
      {"geometry":"lathe","res":5,"transform":[["rotate",90,0,0],["parabola",0.02,0,0],["translate",-65,-10,0],["scale",1.5,1,0.57],["scale",0.98,1.7,1.7],["rotate",90,0,0]],"path":[[0,0,-15],[55,0,-5],[55,0,5],[0,0,15]]}
    ],
    "tags": "foe"
  },
  {
    "name": "NBN HQ",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",2,2,2],["rotate",0,-20,0],["translate",0,0,-75]],
    "path": [[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]],
    "parts": [
      {
        "name": "Relay 60deg",
        "tags": "anomaly",
        "geometry": "composite",
        "transform": [["translate",0,70,0],["rotate",-30,0,0],["translate",0,0,-25],["scale",0.6,0.6,0.6]],
        "parts": [
          {"geometry":"lathe","res":8,"transform":[["rotate",90,22.5,0],["scale",1,1,1]],"path":[[0,0,-83],[4,0,-80],[4,0,-30],[2,0,-27],[2,0,120],[0,0,122]]},
          {"name":"engine","geometry":"lathe","res":10,"transform":[["rotate",90,17.5,0],["translate",0,-85,0]],"path":[[24,0,3],[20,0,25],[20,0,0],[24,0,3]]},
          {
            "name": "dish",
            "geometry": "composite",
            "transform": [["scale",3,3,-3],["rotate",0,0,0],["parabola",0,0.006,0],["translate",0,-95,0]],
            "parts": [
              {"geometry":"lathe","res":4,"angle":160,"transform":[["rotate",90,-10,0],["scale",1,1,1]],"path":[[10,0,0],[18,0,0],[26,0,0],[18,0,0],[10,0,0]]},
              {"geometry":"lathe","res":4,"angle":160,"transform":[["rotate",90,170,0],["scale",1,1,1]],"path":[[10,0,0],[18,0,0],[26,0,0],[18,0,0],[10,0,0]]}
            ]
          }
        ]
      },
      {"name":"body","geometry":"lathe","res":16,"transform":[["scale",1.4,1.4,1.4],["rotate",0,0,0],["translate",0,0,0]],"path":[[45,0,-10],[50,0,-5],[50,0,5],[45,0,10],[42,0,8],[44,0,5],[44,0,-5],[42,0,-8],[45,0,-10]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Shards",
    "geometry": "composite",
    "tags": "anomaly",
    "transform": [["scale",1.15,1.15,1.15],["rotate",0,0,0],["translate",0,0,-90]],
    "parts": [
      {"geometry":"cube","transform":[["subdivide",0,0,0],["sphere",20,20,80],["rotate",-10,8,0],["translate",-40,-50,0]]},
      {"geometry":"cube","transform":[["rotate",50,70,50],["subdivide",0,0,0],["sphere",20,20,80],["rotate",0,-5,15],["translate",40,-40,-5]]},
      {"geometry":"cube","transform":[["rotate",30,0,0],["subdivide",0,0,0],["sphere",20,20,80],["rotate",20,0,-17],["translate",20,40,-10]]},
      {"geometry":"cube","transform":[["rotate",30,40,0],["sphere",10,5,60],["rotate",10,0,17],["translate",-30,10,20]]},
      {"geometry":"cube","transform":[["rotate",30,50,0],["sphere",10,5,60],["rotate",10,-30,17],["translate",70,20,30]]}
    ]
  },
  {
    "name": "Brewery",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",1.8,1.8,1.8],["rotate",0,0,80],["translate",0,0,-81]],
    "path": [[0,0,-50],[50,0,0],[0,0,50]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["translate",0,17,0]],"path":[[0,0,-70],[20,0,-70],[25,0,-65],[25,0,-55],[10,0,-45],[3,0,-25],[3,0,30]]},
      {"geometry":"lathe","res":6,"transform":[["translate",-15,-8.5,50]],"path":[[0,0,-70],[20,0,-70],[25,0,-65],[25,0,-55],[10,0,-45],[3,0,-25],[3,0,-20]]},
      {"geometry":"lathe","res":6,"transform":[["translate",15,-8.5,25]],"path":[[0,0,-70],[20,0,-70],[25,0,-65],[25,0,-55],[10,0,-45],[3,0,-25],[3,0,5]]},
      {"geometry":"lathe","res":6,"transform":[["translate",0,0,90]],"path":[[0,0,-60],[25,0,-60],[25,0,-70],[30,0,-65],[30,0,-55],[0,0,-45]]},
      {"geometry":"lathe","res":12,"transform":[["translate",0,0,29]],"path":[[63,0,5],[65,0,-3],[70,0,0],[70,0,2],[63,0,5]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Hover",
    "geometry": "composite",
    "transform": [["scale",3,3,3],["rotate",90,0,90],["translate",0,0,-32]],
    "parts": [
      {"name":"body","geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["scale",3.6,2,3],["rotate",180,90,0],["translate",0,0,0]],"path":[[0,0,-11],[3,0,-10],[5,0,-1],[5,0,7],[0,0,10]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,12,0],["translate",20,0,23]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,-12,0],["translate",20,0,-23]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",-8,0,26]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",-8,0,-26]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",-35,0,13]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",-35,0,-13]],"path":[[0,0,-3],[10,0,-5],[11,0,0],[10,0,5],[0,0,3]]}
    ],
    "tags": "foe"
  },
  {
    "name": "Relay 300deg",
    "tags": "anomaly",
    "geometry": "composite",
    "transform": [["scale",1.2,1.2,1.2],["translate",0,40,-95],["rotate",0,0,230]],
    "parts": [
      {"geometry":"lathe","res":8,"transform":[["rotate",90,22.5,0],["scale",1,1,1]],"path":[[0,0,-83],[4,0,-80],[4,0,-30],[2,0,-27],[2,0,120],[0,0,122]]},
      {"name":"wing-1","geometry":"lathe","res":3,"transform":[["rotate",0,0,-60],["translate",-1,0,0],["parabola",0.056,0,0],["scale",12,1.5,5],["rotate",90,0,0],["translate",-57,-66,0]],"path":[[0,0,-6.8],[4,0,-4.4],[4,0,4.4],[0,0,8.5]]},
      {"name":"wing-2","geometry":"lathe","res":3,"transform":[["rotate",0,0,-60],["translate",-1,0,0],["parabola",0.056,0,0],["scale",12,1.5,5],["rotate",90,180,0],["translate",57,-66,0]],"path":[[0,0,-6.8],[4,0,-4.4],[4,0,4.4],[0,0,8.5]]},
      {"name":"engine","geometry":"lathe","res":10,"transform":[["rotate",90,17.5,0],["translate",0,-85,0]],"path":[[24,0,3],[20,0,25],[20,0,0],[24,0,3]]},
      {
        "name": "dish",
        "geometry": "composite",
        "transform": [["scale",3,3,-3],["rotate",0,0,0],["parabola",0,0.006,0],["translate",0,-95,0]],
        "parts": [
          {"geometry":"lathe","res":4,"angle":160,"transform":[["rotate",90,-10,0],["scale",1,1,1]],"path":[[10,0,0],[18,0,0],[26,0,0],[18,0,0],[10,0,0]]},
          {"geometry":"lathe","res":4,"angle":160,"transform":[["rotate",90,170,0],["scale",1,1,1]],"path":[[10,0,0],[18,0,0],[26,0,0],[18,0,0],[10,0,0]]}
        ]
      }
    ]
  },
  {
    "name": "Cosmic Whales",
    "geometry": "composite",
    "tags": "anomaly",
    "transform": [["rotate",180,0,0],["translate",40,40,-50]],
    "parts": [
      {"geometry":"lathe","res":8,"transform":[["scale",0.8,0.8,0.9],["rotate",-90,0,-6],["parabola",0,0,-0.002],["translate",50,0,20]],"path":[[0,0,0],[30,0,-30],[45,0,-20],[50,0,0],[50,0,30],[38,0,70],[0,0,150]]},
      {"geometry":"lathe","res":8,"transform":[["scale",0.7,0.7,1],["rotate",-90,0,-12],["parabola",0,0,0.002],["translate",-100,70,-10]],"path":[[0,0,0],[30,0,-30],[45,0,-20],[50,0,0],[50,0,30],[38,0,70],[0,0,150]]},
      {"geometry":"lathe","res":8,"transform":[["rotate",-90,0,0],["parabola",0,0,0.002],["translate",-40,-60,0]],"path":[[0,0,0],[30,0,-30],[45,0,-20],[50,0,0],[50,0,30],[38,0,70],[0,0,150]]}
    ]
  },
  {
    "name": "Alien Buoy",
    "geometry": "composite",
    "transform": [["rotate",-12,23,0],["translate",0,0,-80],["scale",1.25,1.25,1.25]],
    "parts": [
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",180,0,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]},
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",90,0,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]},
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",-90,0,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]},
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",0,0,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]},
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",0,90,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]},
      {"geometry":"lathe","res":4,"transform":[["scale",1,1,2],["rotate",0,-90,0]],"path":[[0,0,5],[20,0,15],[0,0,45]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Security Drone",
    "geometry": "composite",
    "transform": [["scale",2.5,2.5,2.5],["rotate",0,72,0],["translate",0,0,-80]],
    "parts": [
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",-90,0,0],["translate",0,0,-40]],"path":[[0,0,-20],[9,0,-5],[10,0,0],[6,0,30],[0,0,25]]},
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",-90,0,0],["translate",0,0,40]],"path":[[0,0,-20],[9,0,-5],[10,0,0],[6,0,50],[0,0,45]]},
      {"name":"body","geometry":"lathe","res":8,"transform":[["scale",0.75,0.75,0.75],["rotate",0,90,0],["translate",1,0,0]],"path":[[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]]}
    ],
    "res": 8,
    "path": [[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]],
    "tags": "foe"
  },
  {
    "name": "Rocket Drone",
    "geometry": "composite",
    "transform": [["scale",2.5,2.5,2.5],["rotate",0,72,30],["translate",0,0,-90]],
    "parts": [
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",-90,0,0],["translate",0,0,-40]],"path":[[0,0,-20],[9,0,-5],[10,0,0],[6,0,30],[0,0,25]]},
      {"name":"R3mafackas","geometry":"lathe","res":6,"transform":[["scale",1.5,1.5,1.5],["rotate",-90,36,0],["translate",-23,-10,0]],"path":[[0,0,-20],[9,0,-5],[10,0,0],[6,0,30],[0,0,25]]},
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",-90,0,0],["translate",0,-10,38]],"path":[[0,0,-20],[9,0,-5],[10,0,0],[6,0,50],[0,0,45]]},
      {"name":"body","geometry":"lathe","res":8,"transform":[["scale",0.75,0.75,0.75],["rotate",0,90,0],["translate",-5,0,0]],"path":[[40,0,0],[38,0,7],[30,0,10],[15,0,7],[10,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]]}
    ],
    "res": 8,
    "path": [[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]],
    "tags": "foe"
  },
  {
    "name": "Buoy",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",1.3,1.3,1.3],["rotate",0,-23,0],["translate",0,0,-82]],
    "path": [[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]],
    "parts": [
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,0.5],["rotate",-77,0,0],["translate",0,0,-40]],"path":[[0,0,0],[15,0,2],[25,0,10],[28,0,15],[25,0,10],[15,0,2],[0,0,0]]},
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",1,1,0.5],["rotate",-103,0,0],["translate",0,0,40]],"path":[[0,0,0],[15,0,2],[25,0,10],[28,0,15],[25,0,10],[15,0,2],[0,0,0]]},
      {"name":"body","geometry":"lathe","res":8,"transform":[["scale",0.75,0.75,0.75],["rotate",180,0,0],["translate",0,0,0]],"path":[[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]]},
      {"name":"strut","geometry":"lathe","res":4,"transform":[["scale",3,1,19],["rotate",-210,0,0],["translate",0,-11,24]],"path":[[1,0,-1],[1,0,1]]},
      {"name":"strut","geometry":"lathe","res":4,"transform":[["scale",3,1,19],["rotate",210,0,0],["translate",0,-11,-24]],"path":[[1,0,-1],[1,0,1]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Terran Buoy",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",2,2,2],["rotate",0,-20,0],["translate",0,0,-52]],
    "path": [[40,0,0],[38,0,7],[30,0,10],[22,0,7],[20,0,0],[22,0,-7],[30,0,-10],[38,0,-7],[40,0,0]],
    "parts": [
      {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",0.75,0.75,0.75],["rotate",-130,0,0],["translate",0,0,-40]],"path":[[0,0,0],[15,0,2],[25,0,10],[28,0,15],[25,0,10],[15,0,2],[0,0,0]]},
      {"name":"body","geometry":"lathe","res":8,"transform":[["scale",0.75,0.75,0.75],["rotate",180,0,0],["translate",0,0,0]],"path":[[45,0,-20],[50,0,-15],[50,0,15],[45,0,20],[38,0,15],[10,0,15],[0,0,50]]},
      {"geometry":"mesh","transform":[["scale",2.4,1,0.2],["translate",-58,0,0],["rotate",-40,0,-22.5]],"quads":[[[10,0,-10],[10,0,10],[-10,0,10],[-10,0,-10]],[[-10,0,-10],[-10,0,10],[10,0,10],[10,0,-10]]]},
      {"geometry":"mesh","transform":[["scale",1,1,3],["translate",-70,0,0],["rotate",-40,0,-22.5]],"quads":[[[10,0,-10],[10,0,10],[-10,0,10],[-10,0,-10]],[[-10,0,-10],[-10,0,10],[10,0,10],[10,0,-10]]]},
      {"geometry":"mesh","transform":[["scale",1,1,3],["translate",-47,0,0],["rotate",-40,0,-22.5]],"quads":[[[10,0,-10],[10,0,10],[-10,0,10],[-10,0,-10]],[[-10,0,-10],[-10,0,10],[10,0,10],[10,0,-10]]]}
    ],
    "tags": "anomaly"
  },
  {"name":"Soma Soot","geometry":"lathe","res":12,"transform":[["scale",0.75,0.75,0.75],["translate",0,0,-40]],"path":[[90,0,22],[41,0,-28],[45,0,-31],[140,0,-12],[150,0,-6],[160,0,-8],[200,0,0],[90,0,22]],"tags":"foe"},
  {"name":"Soma Saay","geometry":"lathe","res":12,"transform":[["scale",0.75,0.75,0.75],["translate",0,0,-30]],"path":[[50,0,0],[50,0,-15],[55,0,-20],[110,0,-20],[115,0,-40],[120,0,-40],[190,0,-10],[200,0,0],[200,0,5],[50,0,0]],"tags":"foe"},
  {
    "name": "Soma Sonn",
    "geometry": "composite",
    "tags": "foe",
    "transform": [["scale",0.85,0.85,0.85],["translate",0,0,-50]],
    "parts": [
      {"geometry":"lathe","angle":280,"res":9,"transform":[["rotate",0,0,-50]],"path":[[169,0,0],[125,0,-35],[130,0,-40],[170,0,-20],[170,0,20],[130,0,40],[125,0,35],[169,0,0]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",100,0,0]],"path":[[0,0,-100],[35,0,-30],[35,0,30],[0,0,100]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",90,0,0],["translate",-100,0,0]],"path":[[0,0,-100],[35,0,-30],[35,0,30],[0,0,100]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,90,0],["translate",0,100,0]],"path":[[0,0,-100],[35,0,-30],[35,0,30],[0,0,100]]}
    ]
  },
  {
    "name": "Mimos Dart",
    "geometry": "composite",
    "tags": "foe",
    "transform": [["scale",1,1,1],["rotate",0,0,0],["translate",0,40,-45]],
    "parts": [
      {"geometry":"lathe","res":9,"transform":[["radial-wave",3,0.3,0],["rotate",180,0,30],["parabola",0,-0.008,0],["scale",1,1.5,1.5]],"path":[[0,0,-30],[140,0,-5],[150,0,0],[140,0,5],[0,0,30]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,0],["radial-wave",1,3,0],["rotate",0,0,90],["scale",0.41,1,1.5],["translate",55,-88,18]],"path":[[0,0,-10],[20,0,-5],[25,0,0],[20,0,5],[0,0,10]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,0],["radial-wave",1,3,0],["rotate",0,0,90],["scale",0.41,1,1.5],["translate",55,-88,-18]],"path":[[0,0,-10],[20,0,-5],[25,0,0],[20,0,5],[0,0,10]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,0],["radial-wave",1,3,0],["rotate",0,0,90],["scale",0.41,1,1.5],["translate",-55,-88,18]],"path":[[0,0,-10],[20,0,-5],[25,0,0],[20,0,5],[0,0,10]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,0],["radial-wave",1,3,0],["rotate",0,0,90],["scale",0.41,1,1.5],["translate",-55,-88,-18]],"path":[[0,0,-10],[20,0,-5],[25,0,0],[20,0,5],[0,0,10]]}
    ]
  },
  {
    "name": "Mimos Guard",
    "geometry": "composite",
    "tags": "foe",
    "transform": [["scale",0.7,0.7,0.7],["rotate",-90,0,0],["translate",0,50,-70]],
    "parts": [
      {"geometry":"lathe","res":12,"transform":[["scale",1,1,1],["rotate",0,0,15],["radial-wave",3,0.5,0],["parabola",0,0,0.005],["rotate",180,0,-30],["translate",0,0,0]],"path":[[0,0,-180],[150,0,0],[0,0,250]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,70,-180],["rotate",0,0,60]],"path":[[0,0,-150],[50,0,0],[0,0,65]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,70,-180],["rotate",0,0,-60]],"path":[[0,0,-150],[50,0,0],[0,0,65]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,70,-180],["rotate",0,0,180]],"path":[[0,0,-150],[50,0,0],[0,0,65]]}
    ]
  },
  {"name":"Kerr Dinghy","geometry":"composite","transform":[["translate",0,-30,-50]],"parts":[{"name":"body","geometry":"lathe","res":3,"transform":[["scale",3,0.75,0.75],["rotate",90,0,90]],"path":[[0,0,-100],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,100]]}],"tags":"ship"},
  {"name":"Kerr Clipper","geometry":"lathe","res":5,"transform":[["scale",3,0.75,0.75],["rotate",90,0,90],["parabola",0,-0.01,0],["translate",0,0,-50]],"path":[[0,0,-130],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,130]],"tags":"ship"},
  {"name":"Kerr Runner","geometry":"lathe","res":5,"transform":[["scale",3,0.75,0.75],["rotate",90,0,90],["parabola",0,-0.007,0],["translate",0,20,-50]],"path":[[0,0,-170],[50,0,-73],[45,0,-65],[45,0,-55],[55,0,-45],[55,0,45],[45,0,55],[45,0,65],[50,0,73],[0,0,170]],"tags":"ship"},
  {
    "name": "Kerr Interdictor",
    "geometry": "lathe",
    "res": 5,
    "transform": [["scale",3,0.75,0.75],["rotate",90,0,90],["parabola",0,-0.007,0],["translate",0,40,-50]],
    "path": [[0,0,-160],[20,0,-170],[50,0,-73],[50,0,-73],[46,0,-50],[30,0,-30],[30,0,30],[46,0,50],[50,0,73],[20,0,170],[0,0,160]],
    "tags": "ship"
  },
  {
    "name": "Journeyman",
    "geometry": "composite",
    "res": 6,
    "transform": [["scale",1,0.3,2],["rotate",90,0,0],["translate",0,25,-50]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[],"path":[[0,0,-70],[75,0,-20],[50,0,-10],[125,0,38],[125,0,42],[40,0,70],[0,0,60]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,0,-45],["scale",1,0.8,1]],"angle":90,"path":[[88,0,10],[130,0,36],[130,0,44],[78,0,60],[130,0,44],[130,0,36],[88,0,10]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,0,-225],["scale",1,0.8,1]],"angle":90,"path":[[88,0,10],[130,0,36],[130,0,44],[78,0,60],[130,0,44],[130,0,36],[88,0,10]]}
    ],
    "tags": "ship"
  },
  {
    "name": "Kerr Frigate",
    "geometry": "lathe",
    "res": 8,
    "transform": [["rotate",0,0,22.5],["scale",1.3,1.3,1.3],["scale",1.5,0.5,1],["rotate",90,0,0],["translate",0,0,-40]],
    "path": [[0,0,-131],[20,0,-120],[50,0,-100],[50,0,-30],[40,0,-10],[40,0,10],[50,0,30],[50,0,100],[20,0,120],[0,0,110]],
    "tags": "ship"
  },
  {
    "name": "CES Interplan",
    "geometry": "composite",
    "transform": [["scale",7,7,7],["rotate",90,0,0],["translate",0,-40,-70]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",0,0,0]],"path":[[0,0,-13],[3,0,-10],[3,0,-1.5],[1.5,0,0],[1.5,0,21.5],[2,0,22],[2,0,28],[0,0,30]]},
      {"geometry":"lathe","res":16,"transform":[["scale",1,1,1],["rotate",0,0,0],["translate",0,0,-1]],"path":[[10,0,3],[10,0,-3],[12,0,-2],[12,0,2],[10,0,3]]},
      {"geometry":"lathe","res":16,"transform":[["scale",1,1,1],["rotate",0,0,0],["translate",0,0,7]],"path":[[10,0,3],[10,0,-3],[12,0,-2],[12,0,2],[10,0,3]]}
    ],
    "tags": "ship"
  },
  {
    "name": "CES Bioculus",
    "geometry": "composite",
    "transform": [["scale",7.5,7.5,7.5],["rotate",90,0,0],["translate",0,-50,-40]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",0,0,0]],"path":[[0,0,-13],[3,0,-10],[3,0,-1.5],[1.5,0,0],[1.5,0,21.5],[2,0,22],[2,0,28],[0,0,30]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,0,-60],["translate",-1,0,0],["parabola",0.24,0,0],["scale",1,0.3,1],["translate",-12,0,5.8]],"path":[[0,0,-6.8],[4,0,-4.4],[4,0,4.4],[0,0,7]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,0,-60],["translate",-1,0,0],["parabola",0.24,0,0],["scale",1,0.3,1],["translate",-12,0,5.8],["rotate",0,0,180,0]],"path":[[0,0,-6.8],[4,0,-4.4],[4,0,4.4],[0,0,7]]},
      {"name":"aux","geometry":"lathe","res":6,"transform":[["scale",1,0.3,1],["translate",0,-3,-4.5],["rotate",0,0,180,0]],"path":[[0,0,-6.8],[4,0,-4.4],[4,0,4.4],[0,0,5.5]]}
    ],
    "tags": "ship"
  },
  {
    "name": "CES Marathon",
    "geometry": "composite",
    "transform": [["scale",8,8,8],["rotate",90,0,0],["translate",0,-60,-60]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",0,0,0]],"path":[[0,0,-13],[3,0,-10],[3,0,-1.5],[1.5,0,0],[1.5,0,21.5],[2,0,22],[2,0,28],[0,0,30]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,0]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,120]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,60]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,180]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,-120]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]},
      {"geometry":"lathe","res":7,"transform":[["scale",0.3,0.3,0.3],["rotate",0,0,-12.6],["translate",0,6,3],["rotate",0,0,-60]],"path":[[6,0,0],[8,0,-2],[10,0,0],[8,0,20],[6,0,0]]}
    ],
    "tags": "ship"
  },
  {
    "name": "NS Vanguard",
    "geometry": "composite",
    "transform": [["scale",65,65,65],["rotate",180,0,0],["translate",0,0,-70]],
    "parts": [
      {"name":"saucer","geometry":"lathe","res":12,"transform":[["scale",2,2,2],["scale",1,0.7,0.26]],"path":[[0,0,-1],[0.5,0,-0.8],[0.9,0,-0.3],[1,0,-0.05],[1,0,0.05],[0.9,0,0.3],[0.5,0,0.8],[0,0,1]]},
      {
        "name": "nacelle trio 1",
        "geometry": "composite",
        "transform": [["rotate",180,0,0],["translate",0,1,0.6]],
        "parts": [
          {"geometry":"lathe","res":6,"transform":[["rotate",67.5,0,0],["rotate",0,36,0],["translate",-0.8,0,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
          {"geometry":"lathe","res":6,"transform":[["rotate",67.5,0,0],["rotate",0,0,0],["translate",0,0,-0.1]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
          {"geometry":"lathe","res":6,"transform":[["rotate",67.5,0,0],["rotate",0,-36,0],["translate",0.8,0,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]}
        ]
      },
      {
        "name": "nacelle trio 2",
        "geometry": "composite",
        "transform": [["rotate",180,180,0],["translate",0,1,-0.6]],
        "parts": [
          {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",67.5,0,0],["rotate",0,36,0],["translate",-0.8,0,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
          {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",67.5,0,0],["rotate",0,0,0],["translate",0,0,-0.1]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
          {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",67.5,0,0],["rotate",0,-36,0],["translate",0.8,0,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]}
        ]
      }
    ],
    "tags": "ship"
  },
  {
    "name": "NS Salem",
    "geometry": "composite",
    "transform": [["scale",2.3,2.3,2.3],["rotate",90,0,0],["translate",0,0,-70]],
    "parts": [
      {"geometry":"lathe","res":9,"transform":[["scale",1,1,1.5],["rotate",180,0,0],["translate",0,0,0]],"path":[[0,0,-50],[10,0,-40],[18,0,-20],[20,0,0],[18,0,20],[10,0,40],[0,0,50]]},
      {"geometry":"lathe","res":9,"transform":[["scale",1,1,1.2],["rotate",180,0,0],["translate",0,0,6]],"path":[[21,0,-40],[30,0,-10],[28,0,-7],[24,0,-8],[21,0,-40]]}
    ],
    "tags": "ship"
  },
  {
    "name": "NS Sloop",
    "geometry": "composite",
    "transform": [["scale",1.2,1.2,1.2],["rotate",180,0,90],["translate",0,-10,-50]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",60,60,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-30,0,22]],"path":[[0,0,-1.2],[0.2,0,-1.1],[0.3,0,-0.9],[0.3,0,0.9],[0.2,0,1.1],[0,0,1.2]]},
      {"geometry":"lathe","res":6,"transform":[["scale",60,60,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-30,0,-22]],"path":[[0,0,-1.2],[0.2,0,-1.1],[0.3,0,-0.9],[0.3,0,0.9],[0.2,0,1.1],[0,0,1.2]]},
      {"geometry":"lathe","res":6,"transform":[["scale",80,80,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-40,35,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",80,80,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-40,-35,0]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":9,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",80,0,0]],"path":[[0,0,-25],[30,0,-25],[45,0,-10],[70,0,-5],[70,0,5],[45,0,10],[30,0,25],[0,0,25]]}
    ],
    "tags": "ship"
  },
  {
    "name": "NS Argo",
    "geometry": "composite",
    "transform": [["scale",1.4,1.4,1.4],["rotate",180,0,90],["translate",0,20,-65]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["scale",70,70,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-50,35,20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",70,70,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-50,35,-20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",70,70,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-50,-35,20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":6,"transform":[["scale",70,70,60],["rotate",0,0,30],["rotate",0,90,0],["translate",-50,-35,-20]],"path":[[0,0,-1],[0.2,0,-0.9],[0.3,0,-0.7],[0.3,0,0.7],[0.2,0,0.9],[0,0,1]]},
      {"geometry":"lathe","res":9,"transform":[["scale",1,1,1],["rotate",90,0,0],["translate",45,0,0]],"path":[[0,0,-50],[30,0,-50],[45,0,-15],[35,0,-5],[35,0,5],[45,0,15],[30,0,50],[0,0,50]]},
      {"geometry":"lathe","res":5,"transform":[["rotate",90,0,0],["parabola",0.02,0,0],["translate",-54,0,0],["scale",1.5,1,0.57]],"path":[[0,0,-15],[55,0,-5],[55,0,5],[0,0,15]]}
    ],
    "tags": "ship"
  },
  {
    "name": "Monitor Drone",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",2,2,2],["translate",0,0,-90]],
    "path": [[20,0,1],[20,0,-1],[38,0,-3],[40,0,0],[38,0,2],[20,0,1]],
    "angle": 6,
    "parts": [
      {"geometry":"lathe","res":8,"transform":[["scale",1,1,1],["rotate",90,-8,0],["translate",0,0,0]],"path":[[20,0,2],[20,0,-2],[38,0,-5],[40,0,0],[38,0,5],[20,0,2]],"angle":344},
      {"geometry":"lathe","res":8,"transform":[["scale",1,1,1],["rotate",0,180,-8],["translate",2,0,0]],"path":[[20,0,2],[20,0,-2],[38,0,-5],[40,0,0],[38,0,5],[20,0,2]],"angle":344}
    ],
    "tags": "foe"
  },
  {
    "name": "Junk",
    "geometry": "composite",
    "transform": [["scale",1.3,1.3,1.3],["rotate",180,0,0],["translate",-20,40,-30]],
    "parts": [
      {"geometry":"lathe","res":4,"transform":[["rotate",180,0,0],["translate",50,0,0]],"angle":115,"path":[[30,0,0],[50,0,4],[30,0,0]]},
      {"geometry":"lathe","res":5,"transform":[["rotate",180,-30,120],["translate",-50,30,0]],"angle":143,"path":[[30,0,0],[50,0,-8],[30,0,0]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,-30,120],["translate",70,50,30]],"angle":86,"path":[[30,0,4],[50,0,-4],[30,0,4]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Debris",
    "geometry": "composite",
    "transform": [["scale",1.5,1.5,1.5],["rotate",180,0,0],["translate",-30,40,-30]],
    "parts": [
      {"geometry":"lathe","res":8,"transform":[["rotate",180,0,0],["translate",50,0,0]],"path":[[30,0,0],[50,0,4],[50,0,14],[30,0,0]]},
      {"geometry":"cube","transform":[["scale",15,15,15],["rotate",180,-30,120],["translate",-30,50,20]],"angle":2.5,"path":[[30,0,0],[50,0,-8],[50,0,-18],[30,0,0]]},
      {"geometry":"lathe","res":3,"transform":[["rotate",0,-30,120],["translate",70,50,30]],"path":[[0,0,4],[30,0,-4],[0,0,4]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Ruin",
    "geometry": "composite",
    "tags": "anomaly",
    "transform": [["scale",10,10,10],["rotate",0,183,0],["translate",0,0,-50]],
    "parts": [
      {"geometry":"lathe","res":16,"transform":[["rotate",0,-10,0],["translate",0.5,0,-1]],"path":[[10,0,3],[10,0,-3],[12,0,-2],[12,0,2],[10,0,3]]},
      {"geometry":"lathe","res":7,"angle":170,"transform":[["translate",0,0,7]],"path":[[10,0,3],[10,0,-3],[12,0,-2],[12,0,2],[10,0,3]]},
      {"geometry":"lathe","res":5,"angle":115,"transform":[["rotate",183,0,0],["translate",-1,-3,6]],"path":[[10,0,3],[10,0,-3],[12,0,-2],[12,0,2],[10,0,3]]}
    ]
  },
  {
    "name": "Thanatos",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",20,20,20],["rotate",97,-12,0],["translate",0,0,-50]],
    "path": [[20,0,1],[20,0,-1],[38,0,-3],[40,0,0],[38,0,2],[20,0,1]],
    "angle": 6,
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["scale",2,0.5,1],["rotate",0,180,0]],"path":[[0,0,0],[1.99,0,2],[1.2,0,7],[0,0,6.8]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["scale",2,0.5,1],["rotate",0,60,0]],"path":[[0,0,0],[1.99,0,2],[1.2,0,7],[0,0,6.8]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["scale",2,0.5,1],["rotate",0,-60,0]],"path":[[0,0,0],[1.99,0,2],[1.2,0,7],[0,0,6.8]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Mimos Habitat",
    "geometry": "composite",
    "tags": "anomaly",
    "transform": [["rotate",0,27,0],["scale",0.7,0.7,0.7],["translate",60,0,30]],
    "parts": [
      {"geometry":"lathe","res":12,"transform":[["rotate",0,0,15],["radial-wave",3,0.5,0],["parabola",0,0,0.005],["rotate",180,0,-30],["scale",1.5,1.5,0.3],["translate",0,0,-125]],"path":[[0,0,-180],[150,0,0],[0,0,150]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,140,-160],["rotate",0,0,60]],"path":[[0,0,-150],[50,0,0],[0,0,20]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,140,-160],["rotate",0,0,-60]],"path":[[0,0,-150],[50,0,0],[0,0,20]]},
      {"geometry":"lathe","res":6,"transform":[["scale",1,1,1],["translate",0,140,-160],["rotate",0,0,180]],"path":[[0,0,-150],[50,0,0],[0,0,20]]}
    ]
  },
  {
    "name": "Sternrat Station",
    "geometry": "composite",
    "transform": [["scale",4,4,4],["rotate",-90,0,0],["translate",0,-160,-80]],
    "parts": [
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,30]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,90]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,149]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,208]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,-90]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"geometry":"lathe","res":1,"angle":30,"transform":[["rotate",0,0,-14],["rotate",0,12,-30]],"path":[[2,0,0],[9,0,7],[9,0,75],[2,0,81],[9,0,75],[9,0,7],[2,0,0]]},
      {"name":"body","geometry":"lathe","res":6,"transform":[],"path":[[0,0,0],[10,0,6],[13,0,20],[10,0,24],[10,0,40],[5,0,46],[5,0,60],[2,0,65],[0,0,100]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Sol Array",
    "geometry": "composite",
    "transform": [["scale",20,20,20],["rotate",150,0,172],["translate",0,-20,-30]],
    "parts": [
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["translate",4,0,-0.5],["rotate",0,-23,36]],"path":[[2,0,0],[2,0,0.2],[1.2,0,0],[2,0,0.2]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["translate",4,0,-0.5],["rotate",0,-23,108]],"path":[[2,0,0],[2,0,0.2],[1.2,0,0],[2,0,0.2]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["translate",4,0,-0.5],["rotate",0,-23,180]],"path":[[2,0,0],[2,0,0.2],[1.2,0,0],[2,0,0.2]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["translate",4,0,-0.5],["rotate",0,-23,-108]],"path":[[2,0,0],[2,0,0.2],[1.2,0,0],[2,0,0.2]]},
      {"geometry":"lathe","res":6,"transform":[["rotate",0,0,30],["translate",4,0,-0.5],["rotate",0,-23,-36]],"path":[[2,0,0],[2,0,0.2],[1.2,0,0],[2,0,0.2]]},
      {"geometry":"lathe","res":5,"transform":[["scale",2.8,2.8,2.8],["translate",0,0,-0.3]],"path":[[0,0,0],[0.6,0,0],[0.7,0,0.3],[0.3,0,0.3],[0.05,0,0.1],[0.05,0,1.5],[0.1,0,1.55],[0.1,0,2.2],[0,0,2.3]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Observatory",
    "geometry": "composite",
    "transform": [["scale",1,1,1],["rotate",180,0,0],["translate",0,0,-70]],
    "parts": [
      {"name":"Sensor","geometry":"lathe","res":8,"transform":[["scale",1,1,1],["rotate",220,20,0],["translate",0,0,0]],"path":[[50,0,0],[40,0,30],[30,0,0],[40,0,-30],[50,0,0]]},
      {"name":"platform","geometry":"lathe","res":8,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",0,0,0]],"path":[[120,0,0],[80,0,10],[80,0,-10],[120,0,0]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Temple of Apate",
    "geometry": "composite",
    "transform": [["scale",1,1,1],["rotate",180,0,0],["translate",0,0,-70]],
    "parts": [
      {"geometry":"lathe","res":7,"transform":[["scale",1,1,1],["rotate",190,0,0],["translate",0,0,0]],"path":[[60,0,15],[30,0,20],[30,0,-20],[60,0,-15],[60,0,15]]},
      {"name":"platform","geometry":"lathe","res":7,"transform":[["scale",1,1,1],["rotate",3.3,0,0],["translate",0,0,0]],"path":[[120,0,0],[80,0,10],[80,0,-10],[120,0,0]]}
    ],
    "tags": "anomaly"
  },
  {"name":"Larato Gate","geometry":"composite","transform":[["translate",0,0,-80]],"parts":[{"geometry":"lathe","res":8,"transform":[["scale",2,2,1],["rotate",220,-22,0],["translate",0,0,0]],"path":[[50,0,0],[40,0,30],[35,0,15],[38,0,0],[35,0,-15],[40,0,-30],[50,0,0]]}],"tags":"anomaly"},
  {
    "name": "Helyon Shipyards",
    "geometry": "composite",
    "transform": [["scale",2.3,2.3,2.3],["rotate",0,0,80],["translate",0,0,-140]],
    "parts": [
      {"name":"R1","geometry":"lathe","res":8,"transform":[["scale",1,1,0.25],["rotate",0,0,8],["translate",0,0,0]],"path":[[50,0,0],[40,0,30],[35,0,15],[38,0,0],[35,0,-15],[40,0,-30],[50,0,0]],"angle":344},
      {"name":"R2","geometry":"lathe","res":8,"transform":[["scale",1,1,0.25],["rotate",0,0,7],["translate",0,0,40]],"path":[[40,0,0],[30,0,30],[25,0,15],[28,0,0],[25,0,-15],[30,0,-30],[40,0,0]],"angle":346.6},
      {"name":"Pillar","geometry":"lathe","res":3,"transform":[["scale",1.5,0.5,4],["rotate",0,0,180],["rotate",0,-0.2,0],["translate",37,0,20]],"path":[[0,0,-11],[15,0,-10],[20,0,-7],[10,0,10],[0,0,10]]},
      {"name":"Kerr Journeyman","geometry":"lathe","res":6,"transform":[["scale",0.05,0.05,0.05],["scale",1,0.3,2],["rotate",90,-17,0],["translate",-60,50,-10]],"path":[[0,0,-70],[75,0,-20],[50,0,-10],[125,0,40],[40,0,70],[0,0,60]]},
      {"name":"Kerr Clipper","geometry":"lathe","res":3,"transform":[["scale",0.03,0.03,0.03],["scale",3,0.75,0.75],["rotate",90,0,-67],["translate",60,-30,45]],"path":[[0,0,-100],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,100]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Worm",
    "geometry": "composite",
    "res": 20,
    "transform": [["scale",2,2,2],["rotate",-90,0,0],["translate",0,60,-80]],
    "path": [[0,0,0],[20,0,0],[40,0,0],[60,0,0],[40,0,0],[20,0,0],[0,0,0]],
    "parts": [
      {"name":"Worm","geometry":"lathe","res":20,"transform":[["scale",1,1,1],["radial-wave",5,0.5,0],["parabola",0,0,-0.03]],"path":[[20,0,0],[40,0,-10],[60,0,0],[40,0,10],[20,0,0]]},
      {"name":"Worm","geometry":"lathe","res":20,"transform":[["scale",1,1,1],["radial-wave",5,0.5,0],["parabola",0,0,-0.03],["translate",0,0,30],["rotate",0,0,36]],"path":[[20,0,0],[40,0,-5],[60,0,0],[40,0,5],[20,0,0]]}
    ],
    "tags": "foe"
  },
  {
    "name": "Worm Seedling",
    "geometry": "composite",
    "res": 20,
    "transform": [["scale",1.6,1.6,1.6],["rotate",-90,0,0],["translate",0,30,-70]],
    "path": [[0,0,0],[20,0,0],[40,0,0],[60,0,0],[40,0,0],[20,0,0],[0,0,0]],
    "parts": [{"name":"Worm","geometry":"lathe","res":16,"transform":[["parabola",0,0,0.01],["radial-wave",4,0.5,0],["parabola",0,0,-0.03],["rotate",0,0,45]],"path":[[20,0,0],[40,0,-20],[60,0,0],[40,0,20],[20,0,0]]}],
    "tags": "foe"
  },
  {
    "name": "Paxos Station",
    "geometry": "composite",
    "transform": [["scale",1,1,1],["rotate",10,0,0],["rotate",180,0,0],["translate",0,0,-70]],
    "parts": [
      {"name":"core","geometry":"lathe","res":5,"transform":[["scale",1,1,1]],"path":[[60,0,15],[30,0,20],[30,0,-20],[60,0,-15],[60,0,15]]},
      {"name":"outer","geometry":"lathe","res":15,"transform":[["scale",-1.25,1.25,-1],["radial-wave",5,0.6,0]],"path":[[130,0,0],[80,0,15],[80,0,-15],[130,0,0]]},
      {"name":"Kerr Journeyman","geometry":"lathe","res":6,"transform":[["scale",0.1,0.1,0.1],["scale",1,0.3,2],["rotate",90,-17,120],["translate",-140,70,-50]],"path":[[0,0,-70],[75,0,-20],[50,0,-10],[125,0,40],[40,0,70],[0,0,60]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Hermit Home",
    "geometry": "composite",
    "transform": [["scale",1,1,1],["rotate",0,-12,0],["translate",0,0,-60]],
    "parts": [
      {
        "name": "Hermit Home",
        "geometry": "composite",
        "transform": [["scale",4,4,4]],
        "parts": [
          {"name":"Ring","geometry":"lathe","res":9,"transform":[["scale",1,1,0.25]],"path":[[20,0,-30],[22,0,-20],[22,0,20],[20,0,30],[14,0,25],[14,0,-25],[20,0,-30]]},
          {"name":"Hub","geometry":"lathe","res":9,"transform":[],"path":[[1,0,-20],[1,0,-15],[10,0,-13],[12,0,-10],[12,0,10],[10,0,13],[0,0,15]]},
          {"name":"R1","geometry":"lathe","res":6,"transform":[["scale",0.25,0.25,0.2],["rotate",-103,0,0],["translate",0,0,-22]],"path":[[0,0,0],[15,0,2],[25,0,10],[28,0,15],[25,0,10],[15,0,2],[0,0,0]]}
        ],
        "tags": "anomaly station"
      },
      {"name":"parked ship","geometry":"lathe","res":5,"transform":[["scale",3,0.75,0.75],["rotate",90,0,90],["parabola",0,-0.01,0],["scale",0.3,0.3,0.3],["rotate",-90,0,90],["translate",-94,0,-22],["rotate",0,0,-120]],"path":[[0,0,-130],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,130]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Ring Station",
    "geometry": "composite",
    "transform": [["scale",3,3,3],["rotate",0,12,0],["translate",0,0,-50]],
    "parts": [
      {"name":"Ring","geometry":"lathe","res":9,"transform":[["scale",1,1,0.25],["rotate",0,0,10]],"path":[[40,0,-20],[42,0,-10],[42,0,10],[40,0,20],[34,0,15],[34,0,-15],[40,0,-20]]},
      {"name":"Hub","geometry":"lathe","res":6,"transform":[["scale",1,1,1],["rotate",0,0,0]],"path":[[0,0,-5],[6,0,-3],[6,0,3],[0,0,5]]},
      {"name":"spoke","geometry":"lathe","res":6,"transform":[["rotate",90,0,0]],"path":[[2,0,5],[2,0,32]]},
      {"name":"spoke","geometry":"lathe","res":6,"transform":[["rotate",90,0,120]],"path":[[2,0,5],[2,0,32]]},
      {"name":"spoke","geometry":"lathe","res":6,"transform":[["rotate",90,0,-120]],"path":[[2,0,5],[2,0,32]]},
      {"name":"Kerr Journeyman","geometry":"lathe","res":6,"transform":[["scale",0.05,0.05,0.05],["scale",1,0.3,2],["rotate",90,17,0],["translate",40,40,-10]],"path":[[0,0,-70],[75,0,-20],[50,0,-10],[125,0,40],[40,0,70],[0,0,60]]},
      {"name":"Kerr Clipper","geometry":"lathe","res":3,"transform":[["scale",0.03,0.03,0.03],["scale",3,0.75,0.75],["rotate",90,0,-1.17],["translate",-50,-15,-8]],"path":[[0,0,-100],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,100]]}
    ],
    "tags": "anomaly"
  },
  {
    "name": "Tiendong Station",
    "geometry": "composite",
    "res": 8,
    "transform": [["scale",1.8,1.8,1.8],["rotate",0,0,-0.2],["rotate",0,63,0],["translate",0,0,-85]],
    "path": [[0,0,-50],[50,0,0],[0,0,50]],
    "parts": [
      {"geometry":"lathe","res":9,"transform":[["scale",1,1,1],["rotate",180,0,0],["translate",0,0,0]],"path":[[0,0,-70],[20,0,-70],[25,0,-65],[25,0,-25],[25,0,25],[25,0,65],[20,0,70],[0,0,70]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,30]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,-30],["rotate",0,0,40]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,-30],["rotate",0,0,-80]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,-30],["rotate",0,0,160]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,30],["rotate",0,0,60]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"geometry":"lathe","res":4,"transform":[["rotate",0,0,46],["translate",-25,0,30],["rotate",0,0,-60]],"path":[[0,0,-20],[3,0,-20],[3,0,20],[0,0,20]]},
      {"name":"Kerr Runner","geometry":"lathe","res":5,"transform":[["scale",3,0.75,0.75],["rotate",90,0,90],["parabola",0,-0.01,0],["scale",0.1,0.1,0.1],["rotate",0,-55,0],["translate",-60,30,-50]],"path":[[0,0,-130],[50,0,-33],[40,0,-25],[40,0,25],[50,0,33],[0,0,130]],"tags":"ship"}
    ],
    "tags": "anomaly"
  }
]