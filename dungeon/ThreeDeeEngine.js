export function CompositeGeometry(name, transform, parts, texture = 255) {
  return { geometry: 'composite', name, transform, parts, texture }
}

export function LatheGeometry(name, transform, res, angle, path, texture = 255) {
  return { geometry: 'lathe', name, transform, res, path, angle, texture }
}

export function ExtrudeGeometry(name, transform, path, depth, texture = 255) {
  return { geometry: 'extrude', name, transform, path, depth, texture }
}

export function CubeGeometry(name, transform, texture = 255) {
  return { geometry: 'cube', name, transform, texture }
}

export function MeshGeometry(name, transform, quads) {
  return { geometry: 'mesh', name, transform, quads }
}

export function Quad(a, b, c, d, texture = 255) {
  return [a, b, c, d, texture]
}

function seq(count) {
  return [...new Array(count)].map((_, i) => i)
}

export function buildMesh(model){
  switch(model.geometry) {
    case 'lathe': return applyTransforms(lathe(model), model)
    case 'extrude': return applyTransforms(extrude(model), model)
    case 'composite': return applyTransforms(model.parts.flatMap(buildMesh), model)
    case 'cube': return applyTransforms(cube(model), model)
    case 'mesh': return applyTransforms(model.quads, model)
  }
}

export function cullMesh(quads){
  const sorter = ([a,b,c,d]) => -Math.max(a[2],b[2],c[2],d[2])
  return quads
    .filter(([a,b,c,d]) => a[2] < 0 && b[2] < 0 && c[2] < 0 && d[2] < 0)
    .filter(([a,b,c,d]) => vcross(vdiff(c, a), vdiff(b, d))[2] < 0)
    .sort((a,b) => sorter(a) - sorter(b))
}

function cube(model) {
  return [
    Quad([-1,-1,1],[-1,1,1],[1,1,1],[1,-1,1], model.texture),
    Quad([-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1], model.texture),
    Quad([-1,-1,-1],[-1,1,-1],[-1,1,1],[-1,-1,1], model.texture),
    Quad([1,1,-1],[1,-1,-1],[1,-1,1],[1,1,1], model.texture),
    Quad([1,-1,-1],[-1,-1,-1],[-1,-1,1],[1,-1,1], model.texture),
    Quad([1,1,1],[-1,1,1],[-1,1,-1],[1,1,-1], model.texture),
  ]
}

function lathe(model) {
  var mesh = []
  var maxAngle = (model.angle || 360) * d2r
  seq(model.res).map(function (slice) {
    var vertex = (i,j) => mapply(RotateZ(maxAngle * i/model.res), model.path[j])
    for (var i=1; i<model.path.length; i++) {
      mesh.push(
        Quad(
          vertex(slice,i),
          vertex(slice+1,i),
          vertex(slice+1,i-1),
          vertex(slice,i-1),
          model.texture
        )
      )
    }
  })
  return mesh
}

function extrude(model) {
  const path = [...model.path, model.path[0]]
  return model.path.map((point, i) => Quad(
    point,
    path[i+1],
    vadd(path[i+1], [0,0,model.depth]),
    vadd(point, [0,0,model.depth]),
    model.texture
  ))
}

export function transformQuad([a,b,c,d,texture], matrix) {
  return Quad(mapply(matrix,a), mapply(matrix,b), mapply(matrix,c), mapply(matrix,d), texture)
}

export function mapQuad([a,b,c,d,texture], transform) {
  return Quad(transform(a), transform(b), transform(c), transform(d), texture)
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

export function lerp(k, a, b) { return (1-k)*a + k*b }

function radialWave(p, args) {
  let radius = lerp(args[1], 0.5 + 0.5 * Math.cos(args[0] * Math.atan2(p[1], p[0])), 1)
  return [p[0]*radius, p[1]*radius, p[2]]
}

function subdivideQuad(quad) {
  let mid = (i,j) => vmult(0.5, vadd(quad[i], quad[j]))
  let center = vmult(0.5, vadd(mid(0,1), mid(2,3)))
  return [
    Quad(quad[0], mid(0,1), center, mid(0,3), quad[4]),
    Quad(mid(0,1), quad[1], mid(1,2), center, quad[4]),
    Quad(center, mid(1,2), quad[2], mid(2,3), quad[4]),
    Quad(mid(3,0), center, mid(2,3), quad[3], quad[4]),
  ]
}

function transformMesh(mesh, m) {
  if (m[0] == 'scale')
    return mesh.map(quad => transformQuad(quad, Scale(m[1], m[2], m[3])))
  if (m[0] == 'rotate')
    return mesh.map(quad => transformQuad(quad, RotateXYZ(m[1], m[2], m[3])))
  if (m[0] == 'translate')
    return mesh.map(quad => transformQuad(quad, Translate(m[1], m[2], m[3])))
  if (m[0] == 'subdivide')
    return mesh.flatMap(subdivideQuad)
  if (m[0] == 'parabola'){
    var vec = [m[1], m[2], m[3]]
    return mesh.map(quad => mapQuad(quad, p => parabola(p, vec)))
  }
  if (m[0] == 'sphere'){
    var s = Scale(m[1], m[2], m[3])
    return mesh.map(quad => mapQuad(quad, p => mapply(s, vnormalize(p))))
  }
  if (m[0] == 'radial-wave'){
    var args = [m[1], m[2], m[3]]
    return mesh.map(quad => mapQuad(quad, p => radialWave(p, args)))
  }
}

function applyTransforms(mesh, model) {
  return model.transform.reduce((mesh, trans) => transformMesh(mesh, trans), mesh)
}

export var d2r = Math.PI*2/360
export var degToRad = (deg) => deg * Math.PI*2/360
export var RotateX = (a) => [1,0,0,0,  0,Math.cos(a),-Math.sin(a),0,  0,Math.sin(a),Math.cos(a),0, 0,0,0,1]
export var RotateY = (a) => [Math.cos(a),0,Math.sin(a),0, 0,1,0,0, -Math.sin(a),0,Math.cos(a),0, 0,0,0,1]
export var RotateZ = (a) => [Math.cos(a),-Math.sin(a),0,0,  Math.sin(a),Math.cos(a),0,0,  0,0,1,0, 0,0,0,1]
export var RotateXYZ = (x,y,z) => mmult(mmult(RotateX(d2r*x), RotateY(d2r*y)), RotateZ(d2r*z))
export var Scale = (x,y,z) => [x,0,0,0,  0,y,0,0,  0,0,z,0, 0,0,0,1]
export var Translate = (dx,dy,dz) => [1,0,0,dx,  0,1,0,dy,  0,0,1,dz, 0,0,0,1]
export var vtranslate = (vec, delta) => [vec[0]+delta[0], vec[1]+delta[1], vec[2]+delta[2]]
export var vadd = (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]]
export var vdiff = (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]]
export var vdot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
export var vmult = (k, v) => [k*v[0], k*v[1], k*v[2]]
export var vmag = v => Math.sqrt(vdot(v, v))
export var vnormalize = v => vmult(1/vmag(v), v)
export var vcross = (a, b) => [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]]

export function Perspective(degrees, near, far) {
    var angle = degrees * 3.1416 / 180
    var s = 1 / Math.tan(angle / 2)
    var a = -(far + near) / (far - near)
    var b = -2 * (far * near) / (far - near)
    return [
      s, 0, 0, 0,
      0, s, 0, 0,
      0, 0, a, b,
      0, 0, 1, 0
    ]
}

export function mapply(m, v) {
    var out = [v[0]*m[0+4*0] + v[1]*m[1+4*0] + v[2]*m[2+4*0] + 1*m[3+4*0],
               v[0]*m[0+4*1] + v[1]*m[1+4*1] + v[2]*m[2+4*1] + 1*m[3+4*1],
               v[0]*m[0+4*2] + v[1]*m[1+4*2] + v[2]*m[2+4*2] + 1*m[3+4*2],
               v[0]*m[0+4*3] + v[1]*m[1+4*3] + v[2]*m[2+4*3] + 1*m[3+4*3]]
    // normalize if w is different than 1 (convert from homogeneous to Cartesian coordinates)
    var w = out[3]
    return (w != 0) ? vmult(1/w, out) : out
}

export function mmults(...matrixes) {
  if (matrixes.length === 2)
    return mmult(matrixes[0], matrixes[1])
  else
    return mmult(matrixes[0], mmults(...matrixes.slice(1)))
}

export function mmult(a, b) {
    var m = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]
    for (var i=0; i<4; i++) {
        for (var j=0; j<4; j++) {
            for (var k=0; k<4; k++) {
                m[i+4*j] += a[i+4*k]*b[k+4*j]
            }
        }
    }
    return m
}
