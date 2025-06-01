export const canvas = `"std" include
"set-pixel" ( r g b a ref i - ) {
  2dup >@ >@ 4 * 3 + rot set
  @> @> 2dup >@ >@ 4 * 2 + rot set
  @> @> 2dup >@ >@ 4 * 1 + rot set
  @> @> 4 * rot set
} :

"canvas" 64 64 * 4 * create
{
  i 16 / i 16 / i 16 / 255  "canvas" i set-pixel
} 0 64 dup * range enumerate
"canvas" 64 display-image`

export const mandelbrot = `"std" include
"complex" include

"mandelbrot-iter" ( cr ci z0r z0i - cr ci z1r z1i ) {
  complex-sq >@ >@ 2dup @> @> complex-add
} :
"sq-mag" ( n n - n ) { dup * swap dup * + } :
"mandelbrot-at" ( cr ci - bool ) {
  0 0
  { mandelbrot-iter 2dup sq-mag 4 < leave-if } 0 20 range enumerate
  sq-mag 4 >
  -rot drop drop
} :

"x0" { -1.5 } :
"xscale" { 2.25 } :
"y0" { -1.1 } :
"yscale" { 2.2 } :
"res" { 128 } :

"x" { res mod } :
"y" { res / floor } :
"real" { res / xscale * x0 + } :
"imag" { res / yscale * y0 + } :

debug

"canvas" res res create-canvas
{
  i x real i y imag mandelbrot-at 0 255 ?
  dup dup 255 "canvas" i set-pixel
} 0 res res * range enumerate
"canvas" res display-image
`

export const complex = `"complex-mult" ( a b c d - x y ) {
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
`

export const standardLibrary = `
"pi" { 3.14 } :
"2dup" ( a b - a b a b ) { swap dup rot dup rot swap } :
"over" ( a b - a b a ) { swap dup rot swap } :
"factorial" ( n - n ) { 1 swap { i * } over 1 swap range enumerate } :
"trig-taylor" ( x i - x ) { swap over pow swap factorial / } :
"sin" ( x - x ) {
  dup 3 trig-taylor neg
  over 5 trig-taylor +
  over 7 trig-taylor neg +
  +
} :
"cos" ( x - x ) {
  1 swap
  dup 2 trig-taylor neg
  over 4 trig-taylor +
  over 6 trig-taylor neg +
  swap drop
  +
} :
"create-canvas" ( ref width height - ) { * 4 * create } :
"set-pixel" ( r g b a ref i - ) {
  2dup >@ >@ 4 * 3 + rot set
  @> @> 2dup >@ >@ 4 * 2 + rot set
  @> @> 2dup >@ >@ 4 * 1 + rot set
  @> @> 4 * rot set
} :
`
