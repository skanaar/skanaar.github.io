varying lowp vec4 vColor;
varying lowp vec4 vSun;
varying lowp vec4 vNormal;
varying lowp vec4 vPos;

void main(void) {
    lowp float falloff = step(.9, 1.-length(vPos.xz)/25.);
    lowp float lux = dot(-normalize(vNormal.xyz), vSun.xyz) * falloff;
    gl_FragColor = vec4(lux, lux, lux, 1);
}
