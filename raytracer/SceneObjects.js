import { useEvent, el, useForceUpdate } from '../assets/system.js'
import { app } from '../Raytracer.js'

export function SceneObjects() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState([])
  const forceUpdate = useForceUpdate()
  useEvent(app, 'update_scene', (scene) => setScene(scene))
  useEvent(app, 'scene_modified', forceUpdate)
  useEvent(app, 'rename_object', () => {
    if (!selected) return
    let name = prompt(`Rename object "${selected.name}"`)
    if (name) selected.name = name
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
