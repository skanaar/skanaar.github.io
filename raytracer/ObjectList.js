import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'

const style = `scene-objects {
  display: grid; grid-template-rows: auto minmax(0, 1fr); height: 300px;
  & ul { list-style: none; margin: 0; padding: 0; overflow-y: auto }
  & li { display: flex; align-items: center; padding: 3px; cursor: default }
  & li.active { background: black; color: white; }
  & li.hidden > span { opacity: 0.4 }
  & li button {
    margin-left: auto; padding: 0 2px; visibility: hidden; font-size: inherit;
    border: 2px solid black; background: none; color:inherit; border-radius:2px;
  }
  & li:hover button, & li.hidden button { visibility: visible }
  & bread-crumbs { border-bottom: 2px solid black; padding:2px }
  & bread-crumbs .info { position: absolute; right: 5px; font-style: italic }
}`
export function ObjectList() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState(app.scene)
  const [status, setStatus] = React.useState('')
  const forceUpdate = useForceUpdate()
  useEvent(app, 'render_complete', (data) => setStatus(data.duration))
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'select_object', (obj) => setSelected(obj))

  return el(
    'scene-objects',
    {},
    el('style', {}, style),
    el('bread-crumbs', {},
      el('span', { style: { marginRight: 'auto' }},
        app.breadcrumbs.length ? `scene > ${app.breadcrumbs[0]}` : 'scene'
      ),
      el('span', { class: 'info' }, status+'ms'),
    ),
    el('ul', {},
      scene.children.filter(e => !e.renderOnly).map(e => el('li', {
        onClick: () => app.trigger('select_object', e),
        onDoubleClick: () => app.trigger('rename_object'),
        className: [selected === e && 'active', e.hidden && 'hidden']
          .filter(Boolean).join(' ') || undefined,
      },
        el('span', {}, e.name || e.kind),
        el('button', {
          onClick: (ev) => {
            ev.stopPropagation()
            e.hidden = !e.hidden
            app.trigger('scene_modified')
          },
        }, el('span', {}, e.hidden ? 'show' : 'hide'))
      ))
    )
  )
}
