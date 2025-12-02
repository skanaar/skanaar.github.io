import { useEvent, el } from '../assets/system.js'
import { app } from '../Raytracer.js'

export function SceneObjects() {
  const [selected, setSelected] = React.useState(null)
  const [scene, setScene] = React.useState([])
  useEvent(app, 'update_scene', (scene) => setScene(scene))

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
