import { el, App, AppIcon, useEvent } from './assets/system.js'

function File(name, app, content) {
  return { type: 'file', name, app, content }
}
function Folder(name, entries) {
  return { type: 'folder', name, entries }
}
class FileSystem {
  constructor() {
    this.entries = []
  }
}

export const app = new App('FileBrowser', FileBrowser, 'folder.svg', [400, 300])
app.addMenu('File',
  { title: 'New file', event: 'new-file' },
  { title: 'New folder', event: 'new-folder' }
)

const fs = new FileSystem()
fs.entries.push(new Folder('nomnoml', [
  new File('readme', 'Readme', 'test'),
  new File('apa', 'Nomnoml', '[apa]->[banan]'),
  new File('foo', 'Nomnoml', '[foobar]')
]))
fs.entries.push(
  new File('readme', 'Readme', 'test'),
  new File('graph', 'Nomnoml', '[apa]->[banan]')
)

export function FileBrowser() {
  const [, setCounter] = React.useState(0)
  const update = () => setCounter(s => s+1)
  const [path, setPath] = React.useState([])
  let entries = fs.entries
  for (const step of path) entries = entries.find(e => e.name === step).entries

  useEvent(app, 'new-file', () => {
    entries.push(new File('untitled', 'Readme', ''))
    update()
  })
  useEvent(app, 'new-folder', () => {
    entries.push(new Folder('untitled folder', []))
    update()
  })

  return el(
    'div',
    {},
    el('file-tools', { style: { margin: 5, display:'flex', justifyContent: 'space-between'} },
      el('span', { style: { display: 'flex', gap: 10 } },
        el('a', { onClick: () => setPath([]) }, 'disk'),
        path.map(e => el('a', { key: e }, e)),
      ),
      el('span', {}, `${entries.filter(e => e.type == 'file').length} files`)
    ),
    el('hr'),
    el('div',
      { style: { display: 'flex' } },
      entries.map(e => (el(AppIcon, {
        key: e.name,
        icon: `assets/${e.type}.svg`,
        title: e.name,
        onClick: () => {
          if (e.type === 'folder')
            setPath([...path, e.name])
        }
      })))
    )
  )
}
