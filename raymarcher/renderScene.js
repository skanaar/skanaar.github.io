export function renderScene(canvas, vertexSource, fragmentSource, time) {
  const gl = canvas.getContext('webgl')
  const program = buildShaderProgram(gl, vertexSource, fragmentSource)
  const buffers = {
    position: createPositionBuffer(gl),
    color: createColorBuffer(gl)
  }
  drawScene(gl, program, buffers, time)
}

export class ShaderError extends Error {
  constructor(message) {
    super(message)
    this.name = 'Shader Error'
  }
}

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

function createPositionBuffer(gl) {
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  const squareCorners = new Float32Array([1, 1, -1, 1, 1, -1, -1, -1])
  gl.bufferData(gl.ARRAY_BUFFER, squareCorners, gl.STATIC_DRAW)
  return positionBuffer
}

function createColorBuffer(gl) {
  const colors = [0,1,2,3].flatMap(() => [1.0, 1.0, 1.0, 1.0])
  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)
  return colorBuffer
}

function IdentityMatrix() {
  return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])
}

function OrthoMatrix() {
  return new Float32Array([1,0,0,0,0,1,0,0,0,0,-1,0,0,0,0,1])
}

function drawScene(gl, program, buffers, time) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
  const posLoc = gl.getAttribLocation(program, 'aVertexPosition')
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(posLoc)

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color)
  const colorLoc = gl.getAttribLocation(program, 'aVertexColor')
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(colorLoc)

  gl.useProgram(program)

  const timeLocation = gl.getUniformLocation(program, 'uTime')
  gl.uniform1f(timeLocation, time)

  const projectionLocation = gl.getUniformLocation(program, 'uProjectionMatrix')
  gl.uniformMatrix4fv(projectionLocation, false, OrthoMatrix())

  const modelViewLocation = gl.getUniformLocation(program, 'uModelViewMatrix')
  gl.uniformMatrix4fv(modelViewLocation, false, IdentityMatrix())

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}
