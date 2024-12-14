varying lowp vec4 vColor;
varying lowp vec4 vSun;
varying lowp vec4 vNormal;

void main(void) {
    lowp float lux = dot(-normalize(vNormal.xyz), vSun.xyz);
    gl_FragColor = vec4(lux, lux, lux, 1);
}
