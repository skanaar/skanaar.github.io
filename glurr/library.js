export const files = {

  mandelbrot: `"std" include
"complex" include

def mandelbrot-iter ( c c z0 z0 - c c z1 z1 ) {
  complex-sq >§ >§ 2dup §> §> complex-add
} ;
def sq-mag ( n n - n ) { dup * swap dup * + } ;
def escaping { 2dup sq-mag 4 > } ;
def +1! { dup @ 1 + swap ! } ;

.iter-count 0 =:
def mandelbrot-at ( cr ci - bool ) {
  0 0
  0 .iter-count !
  {
    .iter-count +1!
    mandelbrot-iter escaping leave-if
  } 0 maxiter range enumerate
  drop drop drop drop .iter-count @
} ;

def x0 { -1.75 } ;
def y0 { -1.25 } ;
def scale { 2.5 } ;
def res { 128 } ;
def maxiter { 20 } ;

def x { res mod } ;
def y { res / floor } ;
def real { res / scale * x0 + } ;
def imag { res / scale * y0 + } ;
def iter-spectrum { maxiter / 255 * floor } ;
def rgba { dup dup 255 } ;

debug

.canvas res res create-canvas
{
  i x real i y imag mandelbrot-at iter-spectrum
  rgba .canvas i set-pixel
} 0 res res * range enumerate
.canvas res display-image
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
  std: `def pi { 3.14159 } ;
def -rot ( a b c - c a b ) { rot rot } ;
def 2dup ( a b - a b a b ) { swap dup rot dup rot swap } ;
def over ( a b - a b a ) { swap dup rot swap } ;
def if-else { >§ over >§ if §> not §> if } ;
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
`
}
