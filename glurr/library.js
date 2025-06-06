export const files = {

  mandelbrot: `"std" include
"complex" include

"mandelbrot-iter" ( c c z0 z0 - c c z1 z1 ) {
  complex-sq >@ >@ 2dup @> @> complex-add
} :
"sq-mag" ( n n - n ) { dup * swap dup * + } :

.iter-count 0 =:
"mandelbrot-at" ( cr ci - bool ) {
  0 0
  0 .iter-count !
  {
    .iter-count @ 1 + .iter-count !
    mandelbrot-iter 2dup sq-mag 4 > leave-if
  } 0 maxiter range enumerate
  sq-mag 4 >
  -rot drop drop
  drop .iter-count @
} :

"x0" { -1.75 } :
"y0" { -1.25 } :
"scale" { 2.5 } :
"res" { 128 } :
"maxiter" { 20 } :

"x" { res mod } :
"y" { res / floor } :
"real" { res / scale * x0 + } :
"imag" { res / scale * y0 + } :

debug

.canvas res res create-canvas
{
  i x real i y imag mandelbrot-at 255 * maxiter / floor
  dup dup 255 .canvas i set-pixel
} 0 res res * range enumerate
.canvas res display-image
`,
  complex: `"complex-mult" ( a b c d - x y ) {
  4 pick 3 pick *
  4 pick 3 pick * neg
  + >@
  -rot *
  -rot *
  + @> swap
} :

"complex-sq" ( 2n 2n - 2n ) { 2dup complex-mult } :
"complex-add" ( a b c d - x y ) { rot + rot rot + swap } :
"complex-neg" ( a b - x y ) { neg swap neg swap } :
`,
  std: `"pi" { 3.14159 } :
"-rot" ( a b c - c a b ) { rot rot } :
"2dup" ( a b - a b a b ) { swap dup rot dup rot swap } :
"over" ( a b - a b a ) { swap dup rot swap } :
"factorial" ( n - n ) { dup >@ { i * } 1 @> range enumerate } :

"trig-taylor" ( x i - x ) { swap over pow swap factorial / } :
"sin" ( x - x ) {
  pi 2 * mod
  >@
  @copy
  @copy 3 pow 3 factorial / neg +
  @copy 5 pow 5 factorial / +
  @> 7 pow 7 factorial / neg +
} :
"cos" ( x - x ) {
  pi 2 * mod
  1 swap
  dup 2 trig-taylor neg
  over 4 trig-taylor +
  over 6 trig-taylor neg +
  swap drop
  +
} :

"create-canvas" ( ref width height - ) { * 4 * byte-array } :
"set-pixel" ( r g b a ref i - ) {
  2dup >@ >@ 4 * 3 + rot set
  @> @> 2dup >@ >@ 4 * 2 + rot set
  @> @> 2dup >@ >@ 4 * 1 + rot set
  @> @> 4 * rot set
} :
`,
  draw: `"std" include

"res" { 64 } :

.canvas-stroke 4 byte-array
.canvas-width 0 =:
.canvas-ref 0 =:
"set-stroke" {
  >@
  .canvas-stroke 3 255 set
  .canvas-stroke 2 @copy set
  .canvas-stroke 1 @copy set
  .canvas-stroke 0 @> set
} :
"stroke-pixel" ( x y - ) {
  .canvas-width @ * + 4 * >@
  .canvas-ref @ @copy 0 + .canvas-stroke 0 get set
  .canvas-ref @ @copy 1 + .canvas-stroke 1 get set
  .canvas-ref @ @copy 2 + .canvas-stroke 2 get set
  .canvas-ref @ @copy 3 + .canvas-stroke 3 get set
  @> drop
} :

.line-slope 0 =:
.line-dx 0 =:
.line-dy 0 =:
"shallow-line" ( ax ay bx by - ) {
  2 pick 4 pick - .dx !
  2 pick 5 pick - .dy !
  {
    i 6 pick +
    i .dy @ .dx @ / * 5 pick +
    stroke-pixel
  } 0 .dx @ range enumerate
} :

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
