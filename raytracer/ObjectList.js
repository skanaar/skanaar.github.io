import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from './Raytracer.js'
import { compileObject } from './geometry.js'

const style = `scene-objects {
  display: grid; grid-template-rows: auto minmax(0, 1fr); height: 300px;
  & ul { list-style: none; margin: 0; padding: 0; overflow-y: auto }
  & li { display: flex; align-items: center; padding: 3px; cursor: default }
  & li.active { background: black; color: white; }
  & li.hidden > span { opacity: 0.4 }
  & li .name { margin-right: auto }
  & li button  {
    margin-left: 2px; padding: 0 2px; visibility: hidden; font-size: inherit;
    border: 2px solid black; background: none; color:inherit; border-radius:2px;
  }
  & li > svg { flex: none; margin-right: 4px }
  & li.hidden > svg { opacity: 0.4 }
  & li:hover button, & li.hidden button { visibility: visible }
  & li:hover .count, & li.hidden .count { display: none }
  & li:hover button, & li.hidden button { display: inline-block }
  & bread-crumbs {
    display: flex; align-items: center;
    border-bottom: 2px solid black; padding: 2px 2px 2px 4px
  }
}`
function polyCount(entity, entities) {
  return compileObject(entity, entities).polys?.length
}

const icons = {
  camera: 'M1,4h6v5h-6z M7,6.5l3.5,-2.5v5z',
  light: 'M4,6a2,2 0 1,0 4,0a2,2 0 1,0 -4,0 M6,1v1.5 M6,9.5v1.5'
    + ' M1,6h1.5 M9.5,6h1.5',
  link: 'M1,3h5v6h-5z M7,6h4 M9,4l2,2l-2,2',
  box: 'M1,4h6v6h-6z M1,4l3,-3h6v6l-3,3 M7,4l3,-3',
  lathe: 'M2.5,3a3.5,1.5 0 1,0 7,0a3.5,1.5 0 1,0 -7,0'
    + ' M2.5,3v6a3.5,1.5 0 0,0 7,0v-6',
  sphere: 'M2,6a4,4 0 1,0 8,0a4,4 0 1,0 -8,0'
    + ' M6,2a2.6,4 0 0,0 0,8a2.6,4 0 0,0 0,-8',
  heightmap: 'M1,10l3,-5l2,3l2,-4l3,6z',
  material: 'M2,2 L10,2 L10,10 L2,10z M6,2 L6,10 M2,6 L10,6',
  instance: 'M2,7a2,2 0 1,0 4,0a2,2 0 1,0 -4,0 M6,7 l4,0',
  composite: 'M1,4a2,2 0 1,0 4,0a2,2 0 1,0 -4,0'
    + 'M7, 4a2, 2 0 1, 0 4, 0a2, 2 0 1, 0 -4, 0'
    + 'M4, 9a2, 2 0 1, 0 4, 0a2, 2 0 1, 0 -4, 0',
}

function KindIcon({ kind }) {
  return el('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 12 12',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1,
  }, el('path', { d: icons[kind] ?? icons.box }))
}

export function ObjectList() {
  const [query, setQuery] = React.useState('')
  const [filter, setFilter] = React.useState('all')
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState(app.scene)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'select_object', (obj) => setSelected(obj))

  const items = scene.children
    .filter(e => !e.renderOnly)
    .filter(e => {
      switch (filter) {
        case 'all': return true
        case 'cameras': return 'camera link'.includes(e.kind)
        case 'objects': return !'camera material link'.includes(e.kind)
        case 'materials': return e.kind == 'material'
      }
    })
    .filter(e => !query || e.name?.includes(query) || e.kind.includes(query))

  return el(
    'scene-objects',
    {},
    el('style', {}, style),
    el('bread-crumbs', {},
      el('select', { value: filter, onChange: (e) => setFilter(e.target.value) },
        el('option', {}, 'all'),
        el('option', {}, 'cameras'),
        el('option', {}, 'objects'),
        el('option', {}, 'materials'),
      ),
      el("input", {
        type: "search",
        style: { width: '100px', margin: '0' },
        value: query,
        onChange: e => setQuery(e.target.value),
      }),
    ),
    el('ul', {},
      items.map(e => el('li', {
        onClick: () => app.trigger('select_object', e),
        onDoubleClick: () => app.trigger('rename_object'),
        className: [selected === e && 'active', e.hidden && 'hidden']
          .filter(Boolean).join(' ') || undefined,
      },
        el(KindIcon, { kind: e.kind }),
        el('span', { class: 'name' },
          e.name || e.kind,
          e.kind == 'link' && el('span', {}, ` ${e.source} - ${e.target}`)
        ),
        e.kind == 'camera' && el('button', {
          onClick: (ev) => {
            ev.stopPropagation()
            app.trigger('link_camera')
          },
        }, el('span', {}, 'link')),
        el('button', {
          onClick: (ev) => {
            ev.stopPropagation()
            e.hidden = !e.hidden
            app.trigger('scene_modified')
          },
        }, el('span', {}, e.hidden ? 'show' : 'hide')),
        el('span', { class: 'count' }, polyCount(e, scene.children))
      ))
    )
  )
}
