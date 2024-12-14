import { PerspectiveMatrix, RotateX, RotateY, TranslateMatrix, vcross, vdiff, vnormalize } from './math.js'
import { Vec4, normalize, mmult } from './math.js'
import { generateLandscape } from './landscape.js'
import { quad } from './quadtree.js'

export function Engine(canvas, vertexSrc, fragmentSrc) {
  const gl = canvas.getContext('webgl2')
  const program = buildShaderProgram(gl, vertexSrc, fragmentSrc)
  const model = buildGrid(gl, 256, 6, 5, 2)

  return {
    render(t, u) {
      drawScene(gl, program, model, t, u)
    },
    dispose() {}
  }
}
//------------------------
export class ShaderError extends Error {
  constructor(message) {
    super(message)
    this.name = 'Shader Error'
  }
}
//------------------------
function buildShaderProgram(gl, vsSource, fsSource) {
  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, loadShader(gl, gl.VERTEX_SHADER, vsSource))
  gl.attachShader(shaderProgram, loadShader(gl, gl.FRAGMENT_SHADER, fsSource))
  gl.linkProgram(shaderProgram)
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw new ShaderError(`${gl.getProgramInfoLog(shaderProgram)}`)
  }
  return shaderProgram
}
//------------------------
function loadShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new ShaderError(`${message}`)
  }
  return shader
}
//------------------------
function createVec3Buffer(gl, elements) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW)
  return buffer
}
//------------------------
function createIndexBuffer(gl, indx) {
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indx), gl.STATIC_DRAW)
  return buffer
}
//------------------------
function buildGrid(gl, res, freq, width, height) {
  var quadtree = generateLandscape(res)
  function point(i,j) {
    return [
      width * (i/res-.5),
      -height * quad.at(quadtree, i, j).value/60,//(Math.cos(freq*i/res)*Math.sin(freq*j/res)),
      width * (j/res-.5)
    ]
  }
  const verts = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      verts.push(...point(i,j))
    }
  }
  const norms = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      const dx = vdiff(point(i+1,j), point(i-1,j))
      const dy = vdiff(point(i,j+1), point(i,j-1))
      norms.push(...vnormalize(vcross(dx, dy)))
    }
  }
  const indices = []
  for (var i=0; i<res-1; i++) {
    for (var j=0; j<res-1; j++) {
      const k = i + res*j
      indices.push(k, k+1, k+1+res)
      indices.push(k, k+1+res, k+res)
    }
  }
  return {
    count: (res-1)*(res-1)*2*3,
    vertices: createVec3Buffer(gl, verts),
    normals: createVec3Buffer(gl, norms),
    indices: createIndexBuffer(gl, indices),
  }
}
//------------------------
function drawScene(gl, program, { count, vertices, normals, indices }, t, u) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const ctx = GLContext(gl, program)
  gl.useProgram(program)
  ctx.bindPoints('aVertex', vertices)
  ctx.bindPoints('aNormal', normals)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  ctx.bindVector('uSun', normalize(Vec4(1,0.5,0.5)))
  ctx.bindMatrix('uProjection', PerspectiveMatrix(.25*3.14, 500/375, 0.1, 1000))
  ctx.bindMatrix(
    'uModelView',
    mmult(mmult(TranslateMatrix(0,0,-6), RotateX(t)), RotateY(u))
  )

  gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
}

function GLContext(gl, program) {
  return {
    bindMatrix(name, matrix) {
      gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, matrix)
    },
    bindVector(name, vector) {
      gl.uniform4fv(gl.getUniformLocation(program, name), vector)
    },
    bindPoints(name, points) {
      gl.bindBuffer(gl.ARRAY_BUFFER, points)
      const loc = gl.getAttribLocation(program, name)
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0)
      gl.enableVertexAttribArray(loc)
    }
  }
}
