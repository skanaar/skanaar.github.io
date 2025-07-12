export const files = {

mandelbrot: `"std" include
"complex" include

def mandelbrot-iter { complex-sq 2over complex-add } ;
def sq-mag ( n n - n ) { dup * swap dup * + } ;
def escaping { 2dup sq-mag 4 > } ;
def 4drop { drop drop drop drop } ;

.iter-count 0 =:
def mandelbrot-at { 0 0 mandelbrot-iterate 4drop .iter-count @ } ;
def mandelbrot-iterate ( c z - c z ) {
  {
    i .iter-count ! mandelbrot-iter escaping leave-if
  } 0 maxiter range enumerate
} ;

def x0 { -1.75 } ;
def y0 { -1.25 } ;
def scale { 2.5 } ;
def res { 128 } ;
def maxiter { 50 } ;
def x { res mod } ;
def y { res / floor } ;
def real { res / scale * x0 + } ;
def imag { res / scale * y0 + } ;
def to255 { maxiter / 255 * } ;
def rgba { floor dup dup 255 } ;
def to-coord { dup x real swap y imag } ;
def mandelbrot-pixel { to-coord mandelbrot-at to255 rgba } ;

debug

.img res res create-canvas
{ i mandelbrot-pixel .img i set-pixel } 0 res sq range enumerate
.img res display-image
`,

complex: `def complex-mult ( a b c d - x y ) {
  4 pick 3 pick *
  4 pick 3 pick * neg
  + >§
  -rot *
  -rot *
  + §> swap
} ;

def complex-sq ( 2n 2n - 2n ) { 2dup complex-mult } ;
def complex-add ( a b c d - x y ) { rot + rot rot + swap } ;
def complex-neg ( a b - x y ) { neg swap neg swap } ;
`,

std: `
def -rot ( a b c - c a b ) { rot rot } ;
def 2dup ( a b - a b a b ) { swap dup rot dup rot swap } ;
def 2over { 4 pick 4 pick } ;
def over ( a b - a b a ) { swap dup rot swap } ;
def if-else { >§ over >§ if §> not §> if } ;
def +1! { dup @ 1 + swap ! } ;

-- random ----
.rseed 4711 =:
def rand-ceil { 7537 4711 * } ;
def rand-next { .rseed @ 17 * 11 + rand-ceil mod .rseed ! } ;
def rand { rand-next .rseed @ swap mod } ;

-- math ----
def pi { 3.14159 } ;
def sq { dup * } ;
def factorial ( n - n ) { dup 1 > { dup 1 - factorial * } if } ;
def trig-taylor ( x i - x ) { swap over pow swap factorial / } ;
def sin ( x - x ) {
  pi 2 * mod
  >§
  §copy
  §copy 3 pow 3 factorial / neg +
  §copy 5 pow 5 factorial / +
  §> 7 pow 7 factorial / neg +
} ;
def cos ( x - x ) {
  pi 2 * mod
  1 swap
  dup 2 trig-taylor neg
  over 4 trig-taylor +
  over 6 trig-taylor neg +
  swap drop
  +
} ;

def create-canvas ( ref width height - ) { * 4 * byte-array } ;
def set-pixel ( r g b a ref i - ) {
  2dup >§ >§ 4 * 3 + rot set
  §> §> 2dup >§ >§ 4 * 2 + rot set
  §> §> 2dup >§ >§ 4 * 1 + rot set
  §> §> 4 * rot set
} ;
`,

draw: `"std" include

def res { 64 } ;

.canvas-stroke 4 byte-array
.canvas-width 0 =:
.canvas-ref 0 =:
def set-stroke {
  >§
  .canvas-stroke 3 255 set
  .canvas-stroke 2 §copy set
  .canvas-stroke 1 §copy set
  .canvas-stroke 0 §> set
} ;
def stroke-pixel ( x y - ) {
  .canvas-width @ * + 4 * >§
  .canvas-ref @ §copy 0 + .canvas-stroke 0 get set
  .canvas-ref @ §copy 1 + .canvas-stroke 1 get set
  .canvas-ref @ §copy 2 + .canvas-stroke 2 get set
  .canvas-ref @ §copy 3 + .canvas-stroke 3 get set
  §> drop
} ;

.line-slope 0 =:
.line-dx 0 =:
.line-dy 0 =:
def shallow-line ( ax ay bx by - ) {
  2 pick 4 pick - .dx !
  2 pick 5 pick - .dy !
  {
    i 6 pick +
    i .dy @ .dx @ / * 5 pick +
    stroke-pixel
  } 0 .dx @ range enumerate
} ;

.y 0 =:
.offset 0 =:
.bitmap res res create-canvas
{
  i 0.2 * sin 5 * 32 + floor .y !
  .y @ res * i + .offset !
  0 0 0 255 .bitmap .offset @ set-pixel
} 0 res range enumerate
.bitmap res display-image
`,

snake: `"std" include

def w { 128 } ;

.img w w create-canvas
.trinkets 32 byte-array

.px 0 =: .py 0 =: .pw 0 =: .ph 0 =:
def rect {
  .ph ! .pw ! .py ! .px !
  {
    0 0 0 255 .img
      .px @ i .pw @ mod +
      .py @ i .ph @ / floor + w * +
    set-pixel
  } 0 .pw @ .ph @ * range enumerate
} ;

{ 0 0 0 255 .img i w 0 * + set-pixel } 0 w range enumerate
{ 0 0 0 255 .img i w w 1 - * + set-pixel } 0 w range enumerate
{ 0 0 0 255 .img i w * set-pixel } 0 w range enumerate
{ 0 0 0 255 .img i w * w 1 - + set-pixel } 0 w range enumerate

{ 0 0 0 255 .img w w * rand set-pixel } 0 1024 range enumerate

debug
{ 31 rand 4 * 31 rand 4 * 4 4 rect } 0 128 range enumerate

.img w display-image
`
}
