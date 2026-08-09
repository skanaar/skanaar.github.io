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

export function ObjectList() {
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState(app.scene)
  const forceUpdate = useForceUpdate()
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'select_object', (obj) => setSelected(obj))

  const items = scene.children
    .filter(e => !e.renderOnly)
    .filter(e => !query || e.name?.includes(query) || e.kind.includes(query))

  return el(
    'scene-objects',
    {},
    el('style', {}, style),
    el('bread-crumbs', {},
      el('span', { style: { marginRight: 'auto' }},
        app.breadcrumbs.length ? `scene > ${app.breadcrumbs[0]}` : 'scene'
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
        el('span', { class: 'name' }, e.name || e.kind),
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
