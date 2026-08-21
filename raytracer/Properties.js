import { useForceUpdate, useEvent, el } from "../assets/system.js";
import { instanceCompatibles } from "./objects.js";
import { app } from "./Raytracer.js";

export function Properties() {
  const [selected, setSelected] = React.useState(null)
  const [objects, setObjects] = React.useState([])
  const forceUpdate = useForceUpdate()
  useEvent(app, "select_object", (obj) => setSelected(obj))
  useEvent(app, "scene_modified", forceUpdate)
  useEvent(app, "update_scene", (objs) => setObjects(objs.parts))

  if (!selected) return null;

  let trns = selected.transforms;

  return el(
    "obj-props",
    {},
    el(
      "style",
      {},
      `obj-props {
        display: grid;
        grid-template-columns: 80px 1fr 1fr 1fr;
        align-items: center;
        justify-items: start;
        margin: 2px 5px;
      }
      obj-props input { width: 64px }
      obj-props input[type='number'] { -moz-appearance: textfield }
      obj-props input::-webkit-outer-spin-button,
      obj-props input::-webkit-inner-spin-button { -webkit-appearance: none }`,
    ),
    selected.material
      ? el(MaterialField, { instance: selected, objects })
      : null,
    selected.kind == "light" ? el(LightField, { light: selected }) : null,
    selected.kind == "lathe" ? el(LatheFields, { object: selected }) : null,
    selected.kind == "patches" ? el(SegmentsField, { object: selected }) : null,
    selected.kind == "heightmap"
      ? el(TerrainFields, { object: selected })
      : null,
    selected.kind == "tree" ? el(TreeFields, { object: selected }) : null,
    selected.kind == "instance"
      ? el(InstanceField, { instance: selected, objects })
      : null,
    selected.kind == "material"
      ? el(MaterialFields, { instance: selected })
      : null,
    selected.kind == "link" ? el(LinkFields, { object: selected }) : null,
    selected.transforms && el(React.Fragment, {},
      el(TransformInput, { name: "Offset", step: 1, transform: trns.offset }),
      el(TransformInput, { name: "Rotate", step: 1, transform: trns.rotate }),
      el(TransformInput, { name: "Scale", step: 0.1, transform: trns.scale }),
    )
  )
}

export function TransformInput({ transform: tr, name, step }) {
  const update = (field) => (event) => {
    tr[field] = +event.target.value;
    app.trigger("scene_modified")
  };

  return el(
    React.Fragment,
    {},
    el("span", {}, name),
    el("input", { type: "number", value: tr.x, step, onChange: update("x") }),
    el("input", { type: "number", value: tr.y, step, onChange: update("y") }),
    el("input", { type: "number", value: tr.z, step, onChange: update("z") }),
  )
}

function NumericInput({ field, object, range, step }) {
  const update = (event) => {
    object[field] = +event.target.value;
    app.trigger("scene_modified")
  };
  return el("input", {
    type: "number",
    value: object[field],
    onChange: update,
    min: range?.[0],
    max: range?.[1],
    step: step ?? (range ? (range[1] - range[0] < 10 ? 0.1 : 1) : undefined),
  })
}

function Select({ field, object, children }) {
  const update = (event) => {
    object[field] = event.target.value;
    app.trigger('scene_modified')
  }
  return el('select',
    { value: object[field], onChange: update, style: span3col },
    children.map((e) => el('option', {}, e)),
  )
}

function LightField({ light }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Intensity"),
    el(NumericInput, { field: "amount", object: light, range: [0, 10000] }),
    el("div", {}),
    el("div", {}),
  )
}

function LatheFields({ object }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Segments"),
    el(NumericInput, { field: "res", object, range: [2, 64] }),
    el("span", {}, "Angle"),
    el(NumericInput, { field: "angle", object, range: [1, 360] }),
  )
}

function SegmentsField({ object }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Segments"),
    el(NumericInput, { field: "res", object, range: [2, 64] }),
    el("div", {}),
    el("div", {}),
  )
}

const span3col = { gridColumn: "2 / span 3", alignSelf: "start" };

function InstanceField({ instance, objects }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Template"),
    el(Select, { object: instance, field: 'ref' },
      objects
        .filter((e) => e != instance)
        .filter((e) => instanceCompatibles.has(e.kind))
        .map((e) => e.name ?? e.kind),
    ),
  )
}

function MaterialFields({ instance }) {
  const update = (event) => {
    instance.materialKind = event.target.value;
    app.trigger("scene_modified")
  };
  return el(
    React.Fragment,
    {},
    el("span", {}, "Kind"),
    el("select", {
      value: instance.materialKind, onChange: update, style: span3col
    },
      el("option", {}, "solid"),
      el("option", {}, "wood"),
      el("option", {}, "noise"),
      el("option", {}, "dots"),
      el("option", {}, "mirror"),
    ),
    el("span", {}, "Shades"),
    el(NumericInput, { field: "shade1", object: instance, range: [0, 1] }),
    el(NumericInput, { field: "shade2", object: instance, range: [0, 1] }),
    el('div', {}),
    el("span", {}, "Scale"),
    el(NumericInput, { field: "zoom", object: instance, range: [0, 100] }),
  )
}

function MaterialField({ instance, objects }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Material"),
    el(Select, { object: instance, field: 'material' },
      objects.filter(e => e.kind == 'material').map(e => e.name),
    ),
  )
}

function LinkFields({ object }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "From, To"),
    el(NumericInput, { field: "source", object: object, range: [0, 1024] }),
    el(NumericInput, { field: "target", object: object, range: [0, 1024] }),
    el('div', {}),
    el("span", {}, "Left, Top"),
    el(NumericInput, { field: "x", object: object, range: [0, 100] }),
    el(NumericInput, { field: "y", object: object, range: [0, 100] }),
    el('div', {}),
    el("span", {}, "Width, Height"),
    el(NumericInput, { field: "w", object: object, range: [0, 100] }),
    el(NumericInput, { field: "h", object: object, range: [0, 100] }),
  )
}

function TreeFields({ object }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Branching"),
    el(NumericInput, { field: "branches", object, range: [1, 6], step: 1 }),
    el("span", {}, "Iterations"),
    el(NumericInput, { field: "iterations", object, range: [1, 5], step: 1 }),
    el("span", {}, "Branch"),
    el(NumericInput, { field: "branchLength", object, range: [0, 2] }),
    el("span", {}, "Trunk"),
    el(NumericInput, { field: "trunkWidth", object, range: [0, 100] }),
    el("span", {}, "Angle"),
    el(NumericInput, { field: "branchAngle", object, range: [0, 180] }),
    el("span", {}, "Angle rnd"),
    el(NumericInput, { field: "angleRandomness", object, range: [0, 90] }),
    el("span", {}, "Seed"),
    el(NumericInput, { field: "randomSeed", object, range: [0, 9999] }),
    el("span", {}, "Leaves"),
    el(NumericInput, { field: "leafCount", object, range: [0, 6], step: 1 }),
    el('div', {}),
    el('div', {}),
  )
}

function TerrainFields({ object }) {
  return el(
    React.Fragment,
    {},
    el("span", {}, "Res"),
    el(NumericInput, { field: "res", object, range: [4, 64] }),
    el("span", {}, "Seed"),
    el(NumericInput, { field: "rseed", object, range: [1, 256] }),
    el("span", {}, "Isola"),
    el(NumericInput, { field: "isola", object, range: [0, 1] }),
    el("span", {}, "Zoom"),
    el(NumericInput, { field: "zoom", object, range: [0, 200] }),
    el("span", {}, "Persist"),
    el(NumericInput, { field: "persistence", object, range: [0, 1] }),
    el("span", {}, "Octaves"),
    el(NumericInput, { field: "octaves", object, range: [1, 12] }),
    el("span", {}, "Threshold"),
    el(NumericInput, { field: "threshold", object, range: [-1, 3] }),
    el('div', {}),
    el('div', {}),
  )
}
