attribute vec4 aVertex;
attribute vec4 aNormal;

uniform mat4 uModelView;
uniform mat4 uModelTranslation;
uniform mat4 uProjection;
uniform vec4 uSun;
uniform vec4 uShadower1;
uniform vec4 uShadower2;
uniform vec4 uShadower3;
uniform vec4 uShadower4;

varying lowp vec4 vPos;
varying lowp vec4 vColor;
varying lowp vec4 vNormal;
varying lowp vec4 vSun;
varying lowp vec4 vShadower1;
varying lowp vec4 vShadower2;
varying lowp vec4 vShadower3;
varying lowp vec4 vShadower4;

void main(void) {
    gl_Position = uProjection * uModelTranslation * uModelView * aVertex;
    vPos = uModelTranslation * uModelView * aVertex;
    vNormal = uModelView * aNormal;
    vSun = uSun;
    vShadower1 = uModelView * uModelTranslation * uShadower1;
    vShadower2 = uModelView * uModelTranslation * uShadower2;
    vShadower3 = uModelView * uModelTranslation * uShadower3;
    vShadower4 = uModelView * uModelTranslation * uShadower4;
    vColor = clamp(vec4(aVertex.yyy / 2. + 0.6,1.), 0.3, 1.);
}
