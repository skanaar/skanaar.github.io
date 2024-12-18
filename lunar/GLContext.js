export function GLContext(gl, vertexSrc, fragmentSrc) {
  const program = buildShaderProgram(gl, vertexSrc, fragmentSrc)
  gl.useProgram(program)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  gl.cullFace(gl.FRONT)
  gl.depthFunc(gl.LEQUAL)

  return {
    clear() {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    },
    prepareModel({ count, vertices, normals, indices }) {
      return {
        count,
        vertices: this.createVec3Buffer(vertices),
        normals: this.createVec3Buffer(normals),
        indices: this.createIndexBuffer(indices),
      }
    },
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
    },
    createVec3Buffer(elements) {
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW)
      return buffer
    },
    createIndexBuffer(indx) {
      const uintIndx = new Uint16Array(indx)
      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, uintIndx, gl.STATIC_DRAW)
      return buffer
    },
    draw({ count, vertices, normals, indices }) {
      this.bindPoints('aVertex', vertices)
      this.bindPoints('aNormal', normals)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
    }
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
export class ShaderError extends Error {
  constructor(message) {
    super(message)
    this.name = 'Shader Error'
  }
}
