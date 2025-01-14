precision mediump float;
varying vec4 vColor;
varying vec4 vSun;
varying vec4 vShadower1;
varying vec4 vShadower2;
varying vec4 vShadower3;
varying vec4 vShadower4;
varying vec4 vNormal;
varying vec4 vPos;

float random(vec3 p) {
    return fract(sin(dot(p, vec3(12.8,78.2,53.2))) * 43758.3);
}

float noise(vec3 st) {
    vec3 i = floor(st);
    vec3 f = fract(st);
    vec3 u = f * f * (3.0 - 2.0 * f);
    vec3 w = 1. - u;
    return
        (u.x*u.y*u.z) * random(i + vec3(1., 1., 1.)) +
        (u.x*u.y*w.z) * random(i + vec3(1., 1., 0.)) +
        (u.x*w.y*u.z) * random(i + vec3(1., 0., 1.)) +
        (u.x*w.y*w.z) * random(i + vec3(1., 0., 0.)) +
        (w.x*u.y*u.z) * random(i + vec3(0., 1., 1.)) +
        (w.x*u.y*w.z) * random(i + vec3(0., 1., 0.)) +
        (w.x*w.y*u.z) * random(i + vec3(0., 0., 1.)) +
        (w.x*w.y*w.z) * random(i + vec3(0., 0., 0.));
}

float fbm(vec3 p) {
    float value = 0.;
    float amplitude = 0.5;
    float freq = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p*freq);
        freq *= 2.;
        amplitude *= .5;
    }
    return value;
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main(void) {
    float falloff = step(.9, 1.-length(vPos.xz)/50.);
    vec3 bump = vec3(fbm(8. * vPos.xyz), fbm(8. * vPos.xyz + vec3(25.1,0.,0.)), 0.);
    vec3 normal = normalize(vNormal.xyz + .4 * (bump - vec3(.5,.5,.5)));
    float lux = dot(-normal, vSun.xyz);
    float shadow =
        min(1., smoothstep(0., 1., 1.5 * length(vPos.xz - vShadower1.xz))) *
        min(1., smoothstep(0., 1., 1.5 * length(vPos.xz - vShadower2.xz))) *
        min(1., smoothstep(0., 1., 1.5 * length(vPos.xz - vShadower3.xz))) *
        min(1., smoothstep(0., 1., 1.5 * length(vPos.xz - vShadower4.xz)));
    float tex = map(cos(vPos.y*.5), -1., 1., .7, 1.);
    gl_FragColor = vec4(tex*lux*shadow, tex*lux*shadow, tex*lux*shadow, 1);
}
