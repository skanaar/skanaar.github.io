export const main = `"std" include
"complex" include

"sq" ( n - n ) { dup * } :

"mandelbrot-iter" ( cr ci z0r z0i - cr ci z1r z1i ) {
  complex-sq >@ >@ 2dup @> @> complex-add
} :
"sq-mag" ( n n - n ) { sq swap sq + } :
"mandelbrot-at" ( cr ci - bool ) {
  0 0
  { mandelbrot-iter } 0 50 range enumerate
  sq-mag 4 >
  -rot drop drop
} :

"x0" { -1.5 } :
"xscale" { 2.25 } :
"y0" { -1.1 } :
"yscale" { 2.2 } :
"res" { 20 } :

"mandelbrot-line" ( y s - s ) {
  {
    over i res 2 * / xscale * x0 + swap
    mandelbrot-at "x" "-" rot ? concat
  } 0 res 2 * range enumerate
  swap drop
} :

{ i res / yscale * y0 + "" mandelbrot-line . } 0 res range enumerate
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
`
