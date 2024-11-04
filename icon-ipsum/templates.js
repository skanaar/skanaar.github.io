import { Vec } from './Vec.js'

function Line(start, end) {
  return { start, end }
}

export const templates = [
  {
    name: 'circle',
    edges: [
      { only: 'circle', lines: [Line(Vec(2, 12), Vec(22, 12))] },
      { only: 'patch', not: 'empty', lines: [Line(Vec(8, 12), Vec(16, 12))] },
    ],
  },
  {
    name: 'circle-flair',
    edges: [
      { only: 'circle-flair', lines: [Line(Vec(2, 12), Vec(22, 12))] },
      { only: 'patch', not: 'empty', lines: [Line(Vec(9, 12), Vec(15, 12))] },
    ],
  },
  {
    name: 'circle-barred',
    edges: [
      { only: 'circle', lines: [Line(Vec(2, 12), Vec(22, 12))] },
      {
        only: 'L taper',
        not: 'prefer-straight semicircle',
        lines: [Line(Vec(2, 12), Vec(22, 12))],
      },
    ],
  },
  {
    name: 'circle-flair-barred',
    edges: [
      { only: 'circle-flair', lines: [Line(Vec(2, 12), Vec(22, 12))] },
      { only: 'L taper', not: 'prefer-straight', lines: [Line(Vec(2, 12), Vec(22, 12))] },
    ],
  },
  {
    name: 'rectangle',
    edges: [
      { lines: [Line(Vec(2, 7), Vec(22, 7))], only: 'L', not: 'in tall' },
      { lines: [Line(Vec(22, 7), Vec(22, 17))], only: 'M', not: 'out' },
      { lines: [Line(Vec(22, 17), Vec(2, 17))], only: 'L', not: 'in tall' },
      { lines: [Line(Vec(2, 17), Vec(2, 7))], only: 'M', not: 'out' },
      { only: 'patch', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'rectangle-mirrored',
    edges: [
      { lines: [Line(Vec(2, 7), Vec(22, 7))], only: 'L', not: 'in tall' },
      { lines: [Line(Vec(22, 17), Vec(2, 17))], only: 'L', not: 'in tall' },
      {
        lines: [Line(Vec(22, 7), Vec(22, 17)), Line(Vec(2, 17), Vec(2, 7))],
        only: 'M',
        not: 'out',
      },
      { only: 'patch', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'card',
    edges: [
      { lines: [Line(Vec(4, 6), Vec(20, 6))], only: 'L', not: 'in tall' },
      { lines: [Line(Vec(20, 6), Vec(20, 18))], only: 'M', not: 'out' },
      { lines: [Line(Vec(20, 18), Vec(4, 18))], only: 'L', not: 'in tall' },
      { lines: [Line(Vec(4, 18), Vec(4, 6))], only: 'M', not: 'out' },
      { only: 'patch', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'card-mirrored',
    edges: [
      {
        lines: [Line(Vec(4, 6), Vec(20, 6))],
        only: 'L',
        not: 'in tall',
      },
      {
        lines: [Line(Vec(20, 18), Vec(4, 18))],
        only: 'L',
        not: 'in tall',
      },
      {
        lines: [Line(Vec(20, 6), Vec(20, 18)), Line(Vec(4, 18), Vec(4, 6))],
        only: 'M',
        not: 'out',
      },
      { only: 'patch', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'square-patch',
    edges: [
      { lines: [Line(Vec(2, 2), Vec(22, 2))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(22, 2), Vec(22, 22))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(22, 22), Vec(2, 22))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(2, 22), Vec(2, 2))], only: 'L', not: 'out deep' },
      { only: 'patch ortho', lines: [Line(Vec(9, 12), Vec(15, 12))] },
    ],
  },
  {
    name: 'square-symmetry',
    edges: [
      {
        lines: [Line(Vec(2, 2), Vec(22, 2)), Line(Vec(22, 22), Vec(2, 22))],
        only: 'L',
        not: 'out deep prefer-straight',
      },
      {
        lines: [Line(Vec(22, 2), Vec(22, 22)), Line(Vec(2, 22), Vec(2, 2))],
        only: 'L',
        not: 'out deep prefer-straight',
      },
    ],
  },
  {
    name: 'square-horizontal',
    edges: [
      {
        lines: [Line(Vec(2, 2), Vec(22, 2)), Line(Vec(22, 22), Vec(2, 22))],
        only: 'L',
        not: 'out deep prefer-straight',
      },
      {
        lines: [Line(Vec(22, 2), Vec(22, 22)), Line(Vec(2, 22), Vec(2, 2))],
        only: 'L',
        not: 'out in',
      },
      { only: 'patch ortho', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'square-vertical',
    edges: [
      {
        lines: [Line(Vec(2, 2), Vec(22, 2)), Line(Vec(22, 22), Vec(2, 22))],
        only: 'L',
        not: 'out in',
      },
      {
        lines: [Line(Vec(22, 2), Vec(22, 22)), Line(Vec(2, 22), Vec(2, 2))],
        only: 'L',
        not: 'out deep prefer-straight',
      },
      { only: 'patch ortho', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'square',
    edges: [
      { lines: [Line(Vec(7, 7), Vec(17, 7))], only: 'M', not: 'in' },
      { lines: [Line(Vec(17, 7), Vec(17, 17))], only: 'M', not: 'in' },
      { lines: [Line(Vec(17, 17), Vec(7, 17))], only: 'M', not: 'in' },
      { lines: [Line(Vec(7, 17), Vec(7, 7))], only: 'M', not: 'in' },
      { only: 'patch ortho', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'trapeze',
    edges: [
      { only: 'patch', lines: [Line(Vec(10, 4), Vec(14, 4))] },
      { lines: [Line(Vec(12 - 3, 8), Vec(12 + 3, 8))], only: 'M', not: 'in out' },
      { lines: [Line(Vec(12 + 3, 8), Vec(12 + 8, 16))], only: 'M', not: 'in out' },
      { lines: [Line(Vec(12 + 8, 16), Vec(12 - 8, 16))], only: 'M', not: 'in out' },
      { lines: [Line(Vec(12 - 8, 16), Vec(12 - 3, 8))], only: 'M', not: 'in out' },
      { only: 'patch', lines: [Line(Vec(10, 20), Vec(14, 20))] },
    ],
  },
  {
    name: 'rhomb',
    edges: [
      { lines: [Line(Vec(12, 4), Vec(20, 12))], only: 'M', not: 'in' },
      { lines: [Line(Vec(20, 12), Vec(12, 20))], only: 'M', not: 'in' },
      { lines: [Line(Vec(12, 20), Vec(4, 12))], only: 'M', not: 'in' },
      { lines: [Line(Vec(4, 12), Vec(12, 4))], only: 'M', not: 'in' },
      { only: 'patch ortho', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'rhomb-patch',
    edges: [
      { lines: [Line(Vec(12, 2), Vec(22, 12))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(22, 12), Vec(12, 22))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(12, 22), Vec(2, 12))], only: 'L', not: 'out deep' },
      { lines: [Line(Vec(2, 12), Vec(12, 2))], only: 'L', not: 'out deep' },
      { only: 'patch ortho', lines: [Line(Vec(10, 12), Vec(14, 12))] },
    ],
  },
  {
    name: 'triangle',
    edges: [
      ...[0, 1, 2].map((i) => {
        const p = (i) =>
          Vec(12 + 9 * Math.sin((i * 2 * Math.PI) / 3), 14 - 9 * Math.cos((i * 2 * Math.PI) / 3))
        return { lines: [Line(p(i), p(i + 1))], only: 'L taper', not: 'tall deep' }
      }),
    ],
  },
  {
    name: 'triangle-patch',
    edges: [
      ...[0, 1, 2].map((i) => {
        const p = (i) =>
          Vec(12 + 11 * Math.sin((i * 2 * Math.PI) / 3), 14 - 11 * Math.cos((i * 2 * Math.PI) / 3))
        return { lines: [Line(p(i), p(i + 1))], only: 'L taper', not: 'out in' }
      }),
      { only: 'patch hex', not: 'empty', lines: [Line(Vec(9, 14), Vec(15, 14))] },
    ],
  },
  {
    name: 'patch',
    edges: [{ only: 'patch', not: 'empty', lines: [Line(Vec(6, 12), Vec(18, 12))] }],
  },
  {
    name: 'stereo-patch',
    edges: [
      {
        only: 'patch',
        not: 'empty',
        lines: [Line(Vec(3, 12), Vec(15, 12)), Line(Vec(9, 12), Vec(21, 12))],
      },
    ],
  },
]
