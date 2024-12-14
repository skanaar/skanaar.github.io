attribute vec4 aVertex;
attribute vec4 aNormal;

uniform mat4 uModelView;
uniform mat4 uProjection;
uniform vec4 uSun;

varying lowp vec4 vColor;
varying lowp vec4 vNormal;
varying lowp vec4 vSun;

void main(void) {
    gl_Position = uProjection * uModelView * aVertex;
    vNormal = uModelView * aNormal;
    vSun = uSun;
    vColor = clamp(vec4(aVertex.yyy / 2. + 0.6,1.), 0.3, 1.);
}
