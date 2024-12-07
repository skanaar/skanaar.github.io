precision mediump float;
uniform lowp float uTime;
varying lowp vec4 vColor;

#define IDENTITY mat3(vec3(1,0,0),vec3(0,1,0),vec3(0,0,1))
#define CENTER vec3(128, 128, 128)

float angle = 0.5;
mat3 transform = IDENTITY;
mat3 localTransform = IDENTITY;

mat3 Rotate(float x, float y, float z) {
    return
        mat3(vec3(cos(z),-sin(z),0),vec3(sin(z),cos(z),0),vec3(0,0,1)) *
        mat3(vec3(cos(y),0,-sin(y)),vec3(0,1,0),vec3(sin(y),0,cos(y))) *
        mat3(vec3(1,0,0),vec3(0,cos(x),-sin(x)),vec3(0,sin(x),cos(x)));
}

vec3 sun = 0.75 * normalize(vec3(sin(uTime)*3., cos(uTime/2.)*3., -1.));

float smooth(float a, float b, float k) {
    k *= 16.0/3.0;
    float h = max( k-abs(a-b), 0.0 )/k;
    return min(a,b) - h*h*h*(4.0-h)*k*(1.0/16.0);
}
float smooth4(float a, float b, float c, float d, float k) {
    return smooth(smooth(a, b, k), smooth(c, d, k), k);
}

float sphere(vec3 p, vec3 center, float r) {
    return distance(p, center) - r;
}
float torus(vec3 p, vec2 t) {
  return length(vec2(length(p.xz) - t.x, p.y)) - t.y;
}
float box(vec3 p, vec3 center, vec3 dimensions, float radius) {
  vec3 q = abs(localTransform * (p - center)) - (dimensions - radius);
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - radius;
}

float meltingShapes(vec3 p) {
    localTransform = IDENTITY;
    transform = Rotate(0., uTime/10., 0.);
    vec3 p_ = transform * (p-CENTER) + CENTER;
    float a = sphere(p_, vec3(128-64,128,128), 50.);
    float b = sphere(p_, vec3(128,128+64,128), 50.);
    float c = sphere(p_, vec3(128+0,128-64,128), 50.);
    localTransform = localTransform * Rotate(uTime, 0., uTime/2.);
    float d = box(p_, vec3(128+64,128+0,128), vec3(50,50,50), 20.);
    float k = 8.0;
    float firefly = sphere(
        p_,
        CENTER+128.*vec3(cos(uTime),.25*cos(uTime),sin(uTime)),
        10.);
    return min(firefly, smooth4(a, b, c, d, k));
}

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
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(p*freq);
        freq *= 2.;
        amplitude *= .5;
    }
    return value;
}

float asteroid(vec3 p) {
    mat3 transform = Rotate(0., uTime/10., 0.);
    vec3 p_ = transform * (p-CENTER) + CENTER;
    return sphere(p_, vec3(128,128,128), 80.) - 40.*(fbm(p_/40.));
}

float cosRanged(float t, float low, float high) {
    return (cos(t) + 1.) * 0.5 * (high-low) + low;
}

float ruggedCube(vec3 p) {
    mat3 transform = Rotate(0., uTime/10., 0.);
    vec3 p_ = transform * (p-CENTER) + CENTER;
    localTransform = Rotate(1.2, 0., 0.3);
    float bump = 40. * fbm(p_/40.);

    return box(p_, CENTER, vec3(60), cosRanged(uTime/10., -10., 60.)) - bump;
}

float sdf(vec3 p) {
    return ruggedCube(p);
}

vec3 calculateNormal(vec3 p) {
    float epsilon = 0.001;
    float centerDistance = sdf(p);
    float dx = sdf(p + vec3(epsilon, 0, 0));
    float dy = sdf(p + vec3(0, epsilon, 0));
    float dz = sdf(p + vec3(0, 0, epsilon));
    return (vec3(dx, dy, dz) - centerDistance) / epsilon;
}

float hdr(float value) {
  return min(1., 1. - 1. / (1. + 2. * max(0.,value)));
}

void main(void) {
    vec3 start = gl_FragCoord.xyz;
    vec3 dir = vec3(0., 0., 1.);

    vec3 p = start;
    float lastStep = 0.;
    for (int i=0; i<20; i++) {
        lastStep = min(255., sdf(p));
        p = p + dir * lastStep;
    }

    vec3 normal = length(p) > 1024. ? vec3(0) : calculateNormal(p);
    float lux =
        max(0., dot(normal, sun));

    float bright = clamp(lux, 0., 1.);

    gl_FragColor = vec4(bright, bright, bright, 1.0);
}
