import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'

export function ObjectList() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState([])
  const forceUpdate = useForceUpdate()
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'edit_level', (arg) => {
    if (arg != 'composite' || selected?.kind !== 'composite') return
    app.enable('edit_level', 'scene', true)
    app.enable('edit_level', 'composite', false)
    app.breadcrumbs = [selected.name]
    setSelected(null)
    app.trigger('select_object', null)
    app.trigger('update_scene', selected.children)
  })
  useEvent(app, 'rename_object', () => {
    if (!selected) return
    let name = prompt(`Rename object "${selected.name}"`)
    if (name) selected.name = name
    app.trigger('scene_modified')
  })
  useEvent(app, 'delete_object', () => {
    if (!selected) return
    let decision = confirm(`Delete object "${selected.name}"`)
    let index = scene.findIndex(e => e == selected)
    if (decision && index >= 0) scene.splice(index, 1)
    app.trigger('scene_modified')
  })

  return el(
    'scene-objects',
    {},
    el('style', {},
      `scene-objects {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        height: 300px;
      }
      scene-objects span { padding: 3px }
      scene-objects span.active { background: black; color: white; }
      `),
    scene.map(e => el('span', {
      onClick: () => {
        setSelected(e)
        app.trigger('select_object', e)
      },
      className: selected === e ? 'active' : undefined,
    },
      e.name || e.kind
    ))
  )
}
