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
vec3 moon = 0.5 * normalize(vec3(-1., 0., 0.));
vec3 star = 0.5 * normalize(vec3(0, 1., 0.));

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

float sdf(vec3 p) {
    localTransform = IDENTITY;
    transform = Rotate(0., uTime/10., 0.);
    vec3 p_ = transform * (p-CENTER) + CENTER;
    float a = sphere(p_, vec3(128-64,128,128), 50.);
    float b = sphere(p_, vec3(128,128+64,128), 50.);
    float c = sphere(p_, vec3(128+0,128-64,128), 50.);
    localTransform = localTransform * Rotate(uTime, 0., uTime/2.);
    float d = box(p_, vec3(128+64,128+0,128), vec3(50,50,50), 20.);
    float k = 8.0;
    return smooth4(a, b, c, d, k);
}

vec3 calculateNormal(vec3 p) {
    float epsilon = 0.001;
    float centerDistance = sdf(p);
    float dx = sdf(p + vec3(epsilon, 0, 0));
    float dy = sdf(p + vec3(0, epsilon, 0));
    float dz = sdf(p + vec3(0, 0, epsilon));
    return (vec3(dx, dy, dz) - centerDistance) / epsilon;
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
    float lux = dot(normal, sun) + dot(normal, moon) + dot(normal, star);

    float bright = clamp(lux, 0.0, 1.0);

    gl_FragColor = vec4(bright, bright, bright, 1.0);
}
