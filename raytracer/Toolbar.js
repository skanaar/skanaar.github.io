import { el, useEvent, useForceUpdate } from '../assets/system.js';
import { app } from '../Raytracer.js'

const style = `tool-bar {
  display: flex; border-bottom: 2px solid black; padding: 4px;
  & span { margin-left: auto; }
  & button {
    apperance: none;
    border: 2px solid black;
    background: #fff;
    min-width: 30px;
    margin-right: -2px;
    font-size: 15px;
    padding: 2px 6px;
  }
  & button:active, & button[active] { color: #fff; background: #000 }
  & button[disabled] { color: #000; position: relative }
  & button[disabled]:before {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(
      45deg, #fff0, #fff0 1.414px, #fff 1.414px, #fff 2.818px
    );
  }
}`;

export function Toolbar() {
  return el('tool-bar', {},
    el('style', {}, style),
    el(ToolButton, { event: 'scene_view', arg: 'side', toggle: 1 }, 'X'),
    el(ToolButton, { event: 'scene_view', arg: 'top', toggle: 1 }, 'Y'),
    el(ToolButton, { event: 'scene_view', arg: 'front', toggle: 1 }, 'Z'),
    el(ToolButton, { event: 'zoom', arg: 1 / 1.5 }, '-'),
    el(ToolButton, { event: 'zoom', arg: 1.5 }, '+'),
    el(ToolButton, { event: 'reset_view' }, '='),
    el('span', {}),
    el(ToolButton, { event: 'create_object', arg: 'point' }, '⊕'),
    el(ToolButton, { event: 'focus_selection' }, '⌾'),
    el(ToolButton, { event: 'edit_level', arg: 'composite' }, '↓'),
    el(ToolButton, { event: 'edit_level', arg: 'scene' }, '⏏'),
    el('span', {}),
    el(ToolButton, { event: 'editor_mode', arg: 'pan', toggle: 1 }, 'Pan'),
    el(ToolButton, { event: 'editor_mode', arg: 'move', toggle: 1 }, 'Move')
  );
}

function ToolButton({ event, arg, toggle, children }) {
  let forceUpdate = useForceUpdate()
  useEvent(app, 'app:menuability', forceUpdate)
  return el('button', {
    style: children.length == 1 ? { fontWeight: 'bold' } : undefined,
    onClick: () => app.trigger(event, arg),
    disabled: app.isEnabled(event, arg) ? undefined : true,
    active: (toggle && app.menuState[event] == arg) ? 'true' : undefined,
  }, children)
}
