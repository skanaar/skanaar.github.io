import { Vec } from './Vec.js'
import { seq } from './random.js'

export function circle([x, y], r, radians) {
  let N = Math.abs(Math.floor(32 * (radians / 6)))
  return seq(N + 1).map((i) =>
    Vec(x - r * Math.cos((i * radians) / N), y + r * Math.sin((i * radians) / N))
  )
}

export function borders() {
  const mL = 0.2
  const mM = 0.3
  const mS = 0.4
  const hL = 0.3
  const hS = 0.2

  const doubleLine = (m) => [
    [Vec(0, 0), Vec(1, 0)],
    [Vec(0, m), Vec(1, m)],
  ]

  const tripleLine = (m) => [
    [Vec(0.3, -m), Vec(0.7, -m)],
    [Vec(0, 0), Vec(1, 0)],
    [Vec(0.3, m), Vec(0.7, m)],
  ]

  const stripes = (count) =>
    seq(count).map((i) => {
      const x = i / count
      return [Vec(x, 0), Vec(x + mL, -mL)]
    })

  return [
    { name: 'straight', tags: 'L M S taper', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    { name: 'straight', tags: 'L M S taper prefer-straight', lines: [[Vec(0, 0), Vec(1, 0)]] },
    {
      name: 'striped',
      tags: 'L in',
      lines: [[Vec(0, 0), Vec(1, 0)], [Vec(0, -mL), Vec(1, -mL)], ...stripes(4)],
    },
    {
      name: 'striped',
      tags: 'M in',
      lines: [[Vec(0, 0), Vec(1, 0)], [Vec(0, -mL), Vec(1, -mL)], ...stripes(3)],
    },
    {
      name: 'striped',
      tags: 'S in',
      lines: [[Vec(0, 0), Vec(1, 0)], [Vec(0, -mL), Vec(1, -mL)], ...stripes(2)],
    },
    { name: 'double-L', tags: 'L out', lines: doubleLine(mL) },
    { name: 'double-M', tags: 'M out', lines: doubleLine(mM) },
    { name: 'double-S', tags: 'S out', lines: doubleLine(mS) },
    { name: 'double-in-L', tags: 'L in', lines: doubleLine(-mL) },
    { name: 'double-in-M', tags: 'M in', lines: doubleLine(-mM) },
    { name: 'double-in-S', tags: 'S in', lines: doubleLine(-mS) },
    { name: 'triple-L', tags: 'L out in taper', lines: tripleLine(0.15) },
    { name: 'triple-M', tags: 'M out in taper', lines: tripleLine(0.2) },
    { name: 'triple-S', tags: 'S out in taper', lines: tripleLine(0.3) },
    {
      name: 'double-dashed',
      tags: 'L out',
      lines: [
        [Vec(0, 0), Vec(1, 0)],
        [Vec(0, mL), Vec(0.3, mL)],
        [Vec(0.7, mL), Vec(1, mL)],
      ],
    },
    {
      name: 'double-dashed',
      tags: 'M out',
      lines: [
        [Vec(0, 0), Vec(1, 0)],
        [Vec(0, mM), Vec(0.3, mM)],
        [Vec(0.7, mM), Vec(1, mM)],
      ],
    },
    {
      name: 'dotted',
      tags: 'L M taper in out',
      lines: [
        [Vec(0, 0), Vec(0.3, 0)],
        [Vec(0.7, 0), Vec(1, 0)],
        circle([0.5, 0], 0.2, 17, 2 * Math.PI),
      ],
    },
    {
      name: 'handle-out',
      tags: 'L M out taper',
      lines: [[Vec(0, 0), Vec(1, 0)], circle([0.5, 0], hL, Math.PI)],
    },
    {
      name: 'handle-in',
      tags: 'L M in taper',
      lines: [[Vec(0, 0), Vec(1, 0)], circle([0.5, 0], -hL, Math.PI)],
    },
    {
      name: 'semicircle',
      tags: 'L M S out tall taper semicircle',
      lines: [circle([0.5, 0], 0.5, Math.PI)],
    },
    {
      name: 'notch',
      tags: 'L M S in taper',
      lines: [[Vec(0, 0), ...circle([0.5, 0], 0.2, -Math.PI), Vec(1, 0)]],
    },
    {
      name: 'jig-out',
      tags: 'L M out taper',
      lines: [
        [
          Vec(0, 0),
          Vec(0.5 - hS, 0),
          Vec(0.5 - hS, hS),
          Vec(0.5 + hS, hS),
          Vec(0.5 + hS, 0),
          Vec(1, 0),
        ],
      ],
    },
    {
      name: 'jig-in',
      tags: 'L M in taper',
      lines: [
        [
          Vec(0, 0),
          Vec(0.5 - hS, 0),
          Vec(0.5 - hS, -hS),
          Vec(0.5 + hS, -hS),
          Vec(0.5 + hS, 0),
          Vec(1, 0),
        ],
      ],
    },
    {
      name: 'chevron-out',
      tags: 'L M S out tall taper',
      lines: [[Vec(0, 0), Vec(0.5, 0.3), Vec(1, 0)]],
    },
    {
      name: 'envelope',
      tags: 'L M S in deep taper',
      lines: [
        [Vec(0, 0), Vec(0.5, -0.3), Vec(1, 0)],
        [Vec(0, 0), Vec(1, 0)],
      ],
    },
    {
      name: 'chevron-in',
      tags: 'L M S in deep taper',
      lines: [[Vec(0, 0), Vec(0.5, -0.3), Vec(1, 0)]],
    },
  ]
}
