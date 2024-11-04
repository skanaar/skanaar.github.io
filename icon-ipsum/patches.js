import { Vec } from './Vec.js'
import { seq } from './random.js'

export function patches() {
  return [
    { name: 'empty', tags: 'patch ortho hex empty', lines: [] },
    { name: 'empty', tags: 'patch ortho hex empty prefer-empty', lines: [] },
    { name: 'empty', tags: 'patch ortho hex empty prefer-empty', lines: [] },
    { name: 'empty', tags: 'patch ortho hex empty prefer-empty', lines: [] },
    { name: 'empty', tags: 'patch ortho hex empty prefer-empty', lines: [] },
    { name: 'empty', tags: 'patch ortho hex empty prefer-empty', lines: [] },
    {
      name: 'circle',
      tags: 'patch ortho hex circle closed',
      lines: [
        seq(33).map((i) =>
          Vec(0.5 - 0.5 * Math.cos((i * 2 * Math.PI) / 32), 0.5 * Math.sin((i * 2 * Math.PI) / 32))
        ),
      ],
    },
    {
      name: 'circle-flair',
      tags: 'patch ortho hex circle-flair',
      lines: [
        seq(33).map((i) =>
          Vec(0.5 - 0.5 * Math.cos((i * 2 * Math.PI) / 32), 0.5 * Math.sin((i * 2 * Math.PI) / 32))
        ),
      ],
    },
    {
      name: 'circle-dashed',
      tags: 'circle-flair',
      lines: [
        seq(33).map((i) =>
          Vec(0.5 - 0.5 * Math.cos((i * 2 * Math.PI) / 32), 0.5 * Math.sin((i * 2 * Math.PI) / 32))
        ),
        ...seq(13).map((i) => [
          Vec(
            0.5 - 0.35 * Math.cos(((i - 0.15) * 2 * Math.PI) / 12),
            0.35 * Math.sin(((i - 0.15) * 2 * Math.PI) / 12)
          ),
          Vec(
            0.5 - 0.35 * Math.cos(((i + 0.15) * 2 * Math.PI) / 12),
            0.35 * Math.sin(((i + 0.15) * 2 * Math.PI) / 12)
          ),
        ]),
      ],
    },
    {
      name: 'circle-rays',
      tags: 'circle-flair',
      lines: [
        seq(33).map((i) =>
          Vec(0.5 - 0.5 * Math.cos((i * 2 * Math.PI) / 32), 0.5 * Math.sin((i * 2 * Math.PI) / 32))
        ),
        ...seq(13).map((i) => [
          Vec(0.5 - 0.5 * Math.cos((i * 2 * Math.PI) / 12), 0.5 * Math.sin((i * 2 * Math.PI) / 12)),
          Vec(
            0.5 - 0.35 * Math.cos((i * 2 * Math.PI) / 12),
            0.35 * Math.sin((i * 2 * Math.PI) / 12)
          ),
        ]),
      ],
    },
    {
      name: 'triangle',
      tags: 'patch hex closed',
      lines: [
        seq(4).map((i) =>
          Vec(0.5 - 0.5 * Math.sin((i * Math.PI * 2) / 3), 0.5 * Math.cos((i * Math.PI * 2) / 3))
        ),
      ],
    },
    {
      name: 'triangle-invert',
      tags: 'patch hex closed',
      lines: [
        seq(4).map((i) =>
          Vec(0.5 - 0.5 * Math.sin((i * Math.PI * 2) / 3), -0.5 * Math.cos((i * Math.PI * 2) / 3))
        ),
      ],
    },
    {
      name: 'tri-cross',
      tags: 'patch hex',
      lines: [
        ...seq(4).map((i) => [
          Vec(0.5 - 0.5 * Math.sin((i * Math.PI * 2) / 3), -0.5 * Math.cos((i * Math.PI * 2) / 3)),
          Vec(0.5, 0),
        ]),
      ],
    },
    {
      name: 'rect',
      tags: 'patch ortho rect closed',
      lines: [[Vec(0, -0.5), Vec(1, -0.5), Vec(1, 0.5), Vec(0, 0.5), Vec(0, -0.5)]],
    },
    {
      name: 'rhomb',
      tags: 'patch ortho closed',
      lines: [[Vec(0.5, -0.5), Vec(1, 0), Vec(0.5, 0.5), Vec(0, 0), Vec(0.5, -0.5)]],
    },
    {
      name: 'chevron-right',
      tags: 'patch ortho',
      lines: [[Vec(0.3, -0.5), Vec(0.8, 0), Vec(0.3, 0.5)]],
    },
    {
      name: 'chevron-left',
      tags: 'patch ortho',
      lines: [[Vec(0.7, -0.5), Vec(0.2, 0), Vec(0.7, 0.5)]],
    },
    {
      name: 'chevron-up',
      tags: 'patch ortho',
      lines: [[Vec(0, -0.2), Vec(0.5, 0.3), Vec(1, -0.2)]],
    },
    {
      name: 'chevron-up',
      tags: 'patch ortho',
      lines: [[Vec(0, 0.2), Vec(0.5, -0.3), Vec(1, 0.2)]],
    },
    {
      name: 'cross',
      tags: 'patch ortho',
      lines: [
        [Vec(0, -0.5), Vec(1, 0.5)],
        [Vec(1, -0.5), Vec(0, 0.5)],
      ],
    },
    {
      name: 'solidus',
      tags: 'patch ortho',
      lines: [[Vec(0, -0.5), Vec(1, 0.5)]],
    },
    {
      name: 'bars',
      tags: 'patch ortho',
      lines: [
        [Vec(0, 0.4), Vec(1, 0.4)],
        [Vec(0, -0.4), Vec(1, -0.4)],
      ],
    },
    {
      name: 'menu',
      tags: 'patch ortho',
      lines: [
        [Vec(0, 0.5), Vec(1, 0.5)],
        [Vec(0, 0), Vec(1, 0)],
        [Vec(0, -0.5), Vec(1, -0.5)],
      ],
    },
    {
      name: 'plus',
      tags: 'patch ortho',
      lines: [
        [Vec(0, 0), Vec(1, 0)],
        [Vec(0.5, -0.5), Vec(0.5, 0.5)],
      ],
    },
    {
      name: 'minus',
      tags: 'patch ortho hex',
      lines: [[Vec(0, 0), Vec(1, 0)]],
    },
    {
      name: 'bar',
      tags: 'patch ortho hex',
      lines: [[Vec(0.5, -0.5), Vec(0.5, 0.5)]],
    },
  ]
}
