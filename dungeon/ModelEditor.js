import { el, App, useEvent } from '../assets/system.js'
import {
  CompositeGeometry,
  LatheGeometry,
  buildMesh,
  cullMesh,
  mmults,
  Scale,
  Perspective,
  RotateXYZ,
  transformQuad,
  Translate,
  Quad,
} from './ThreeDeeEngine.js'

const models = [
  new CompositeGeometry('stalactites', [], [
    new LatheGeometry('', [['translate',20,20,0],['rotate',0,360,20],['scale',1,1,1]], 7, 360, [[1,0,0],[10,0,50]], 128),
    new LatheGeometry('', [['translate',-20,10,0]], 7, 360, [[1,0,20],[15,0,50]], 128),
    new LatheGeometry('', [['translate',-30,5,0]], 7, 360, [[10,0,-50],[1,0,0]], 128),
    new LatheGeometry('', [['translate',5,35,0]], 7, 360, [[15,0,-50],[1,0,30]], 128),
    new LatheGeometry('', [['translate',0,4,0]], 7, 360, [[15,0,-50],[5,0,-10],[4.5,0,5],[13,0,50]], 128),
  ])
]

const cameraModes = ['iso', 'perspective', 'top', 'front', 'back', 'side']

function modelMenuItems() {
  return models.map(e => ({ title: e.name, event: 'set-model', arg: e.name }))
}

const icon = 'cube.svg'
export const app = new App('Modeller', ModelEditor, icon, [800, 400], 'noresize')
app.addMenu('Models', ...modelMenuItems())
app.addMenu(
  'Camera',
  ...cameraModes.map((e) => ({ title: e, event: 'set-camera', arg: e }))
)

export function ModelEditor() {
  const zoom = 0.85
  const [counter, setCounter] = React.useState(0)
  const [mesh, setMesh] = React.useState([])
  const [box, setBox] = React.useState([])
  const [selected, setSelected] = React.useState(0)

  const [cameraIndex, setCameraIndex] = React.useState(0)
  
  React.useEffect(() => updateMesh(cameraModes[cameraIndex], models[selected]), [])
  
  useEvent(app, 'set-model', (arg) => {
    const index = models.findIndex(e => e.name === arg)
    setSelected(index)
    updateMesh(cameraModes[cameraIndex], models[index])
  })
  useEvent(app, 'set-camera', (arg) => {
    const index = cameraModes.indexOf(arg)
    setCameraIndex(index)
    updateMesh(cameraModes[index], models[selected])
  })
  
  function cameraTransform(camera) {
    var base = mmults(Scale(zoom, zoom, zoom), Translate(50,50,-100))
    return {
      top: base,
      front: mmults(RotateXYZ(-90,0,0), base),
      back: mmults(RotateXYZ(90,0,0), RotateXYZ(0,0,90), base),
      side: mmults(RotateXYZ(0,90,0), RotateXYZ(0,0,90), base),
      iso: mmults(RotateXYZ(0,0,-45), RotateXYZ(-50,0,0), base),
      perspective: mmults(
        RotateXYZ(0,0,90*2/3),
        RotateXYZ(-200,0,0),
        Translate(0,0,700),
        Perspective(0.175, 1000, 20000),
        base,
      ),
    }[camera] || base
  }

  function constructMesh(camera, model) {
    const matrix = cameraTransform(camera)
    const scene = buildMesh(model).map(q => transformQuad(q, matrix))
    const mesh = cullMesh(scene)
    console.log({mesh})
    return mesh.map((quad) => Quad(quad[0],quad[1],quad[2],quad[3]))
  }
  
  function updateMesh(camera, model){
    setMesh(constructMesh(camera, model))
    setBox(box)
  }

  return (
    el('modeller-viewer', {},
      el('svg', {
        className: 'canvas-3d ' + (cameraIndex === 1 ? 'offset' : ''),
        viewBox: '0 0 100 100'
      },
        box.map((e, i) => el('path', {
          key: `b${i}`,
          d: `M${e[0][0]},${e[0][1]} L${e[1][0]},${e[1][1]} L${e[2][0]},${e[2][1]} L${e[3][0]},${e[3][1]} Z`,
          fill: 'none',
          className: 'outline'
        })),
        mesh.map((e, i) => el('path', {
          key: `m${i}`,
          d: `M${e[0][0]},${e[0][1]} L${e[1][0]},${e[1][1]} L${e[2][0]},${e[2][1]} L${e[3][0]},${e[3][1]} Z`,
          fill: 'none',
        } )),
      ),
      
      el('div', { className: 'scrollable padded' },
        el('header', {}, models[selected].name),
        el(GeometryEditor, { model: models[selected], onChange: (value) => {
          models[selected] = value
          setCounter(counter+1)
        } })
      ),

    )
  )
}

function TransformListEditor({ transforms, onChange }) {
  return el('transform-editor', {},
    ...transforms.map((e,i) =>
      el(TransformEditor, {
        transform: e,
        onDelete: () => onChange(transforms.toSpliced(i, 1)),
        onChange: (value) => onChange(transforms.toSpliced(i, 1, value))
      })),
    el('div', {}),
    el('div', {}),
    el('div', {}),
    el('div', {}),
    el('button', {
      onClick: () => onChange([...transforms, ['translate', 0, 0, 0]])
    }, '⨁')
  )
}

function GeometryEditorHeader({ model, onChange, onDelete }) {
  return el(React.Fragment, {},
    el('span', {}, model.geometry),
    el('input', { value: model.name, placeholder: 'name', onChange: (e) => onChange({ ...model, name: e.target.value }) }),
    el('button', { onClick: onDelete }, '✕'),
    el('hr'),
    el(TransformListEditor, { transforms: model.transform, onChange: (value) => onChange({ ...model, transform: value })}),
    el('hr'),
  )
}

function GeometryEditor({ model, onChange, onDelete }) {
  if (model.geometry === 'composite'){
    return el('geometry-editor', {},
      el(GeometryEditorHeader, { model, onChange, onDelete }),
      el('div', { class: 'composite-parts'},
        model.parts.map((e, i) => el(GeometryEditor, {
          model: e,
          onChange: (value) => onChange({ ...model, parts: model.parts.toSpliced(i, 1, value)})
        })),
      ),
      el('label', {},
        'Add geometry',
        el('select', { onChange: () => onChange({ ...model, parts: [...model.parts, new LatheGeometry('', [], 8, 2*Math.PI, [])] }) },
          el('option', {}, 'composite'),
          el('option', {}, 'lathe'),
          el('option', {}, 'cube'),
          el('option', {}, 'mesh'),
          el('option', {}, 'extrude'),
        )
      )
    )
  }
  if (model.geometry === 'lathe'){
    return el('geometry-editor', {},
      el(GeometryEditorHeader, { model, onChange, onDelete }),
      el('label', {}, 'Res', el('input', { type: 'number', value: model.res })),
      el('label', {}, 'Angle', el('input', { type: 'number', value: model.angle })),
    )
  }
  if (model.geometry === 'cube'){
    return el('geometry-editor', {},
      el(GeometryEditorHeader, { model, onChange, onDelete })
    )
  }
  if (model.geometry === 'mesh'){
    return el('geometry-editor', {},
      el(GeometryEditorHeader, { model, onChange, onDelete })
    )
  }
  if (model.geometry === 'extrude'){
    return el('geometry-editor', {},
      el(GeometryEditorHeader, { model, onChange, onDelete })
    )
  }
}

function TransformEditor({ transform, onChange, onDelete }) {
  const [type, x, y, z] = transform
  return el(React.Fragment, {},
    el('select', { value: type, onChange: (e) => onChange([e.target.value, x, y, z]) }, 
      el('option', {}, 'scale'),
      el('option', {}, 'rotate'),
      el('option', {}, 'translate'),
      el('option', {}, 'subdivide'),
      el('option', {}, 'parabola'),
      el('option', {}, 'sphere'),
      el('option', {}, 'radial-wave'),
    ),
    el('input', { type: 'number', value: x, onChange: (e) => onChange([type, e.target.value, y, z]) }),
    el('input', { type: 'number', value: y, onChange: (e) => onChange([type, x, e.target.value, z]) }),
    el('input', { type: 'number', value: z, onChange: (e) => onChange([type, x, y, e.target.value]) }),
    el('button', { onClick: onDelete}, '✕')
  )
}
