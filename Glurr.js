import { el, App, useEvent } from './assets/system.js'
import { Docs } from './glurr/Docs.js'
import { Debugger } from './glurr/Debugger.js'
import { interpret } from './glurr/interpret.js'
import { files } from './glurr/library.js'
import { testsuite } from './glurr/test.js'

export const app = new App('Glurr', Glurr, 'server.svg')
app.addMenu('File',
  { title: 'New file...', event: 'new_file', cmd: 'n' },
  { title: 'Rename this file...', event: 'rename_file' },
  { title: 'Delete this file', event: 'delete_file' },
)
app.addMenu('Window',
  { title: 'Docs...', event: 'app:show_child_window', arg: 'Glurr docs' },
  { title: 'Console...', event: 'app:show_child_window', arg: 'Glurr console' }
)
app.addWindow('Glurr console', Output, { visible: true, offset: [0,400] })
app.addWindow('Glurr docs', Docs, { visible: true, offset: [520,0] })
app.menuState = { debug: false }

function Glurr() {
  const [mode, setMode] = React.useState('run')
  const [duration, setDuration] = React.useState(0)
  const [filename, setFilename] = React.useState('mandelbrot')
  const [source, setSource] = React.useState(files.mandelbrot)
  const [line, setLine] = React.useState(0)
  const textareaRef = React.useRef()
  useEvent(app, 'new_file', React.useCallback(() => {
    let name = prompt('Enter filename:', 'untitled')
    if (!name) return
    files[name] = ''
    setFilename(name)
    setSource(files[name])
  }, [filename]))
  useEvent(app, 'rename_file', React.useCallback(() => {
    let name = prompt('Enter filename:', filename)
    if (!name) return
    files[name] = files[filename]
    delete files[filename]
    setFilename(name)
    setSource(files[name])
  }, [filename]))
  useEvent(app, 'delete_file', React.useCallback(() => {
    if (Object.keys(files).length < 2) return
    delete files[filename]
    const newSelected = Object.keys(files)[0]
    setFilename(newSelected)
    setSource(files[newSelected])
  }, [filename]))
  const onRun = () => {
    app.trigger('clear-output')
    setMode('run')
    const start = Date.now()
    interpret(filename, {
      files: files,
      out: (val) => app.trigger('output', val),
    })
    setDuration(Date.now() - start)
  }
  const onDebug = () => {
    app.trigger('clear-output')
    setMode('debug')
  }

  React.useEffect(testsuite, [])
  React.useEffect(() => {
    let onEvent = e => {
      setLine(source.substring(0, e.target.selectionStart).split('\n').length)
    }
    textareaRef.current?.addEventListener('selectionchange', onEvent)
    return () => {
      textareaRef.current?.removeEventListener('selectionchange', onEvent)
    }
  }, [textareaRef.current])

  if (mode == 'debug')
    return el('glurr-app', {},
      el('style', {}, css),
      el(Debugger, { app, filename, files, onStop: () => setMode('run') })
    )

  return el('glurr-app', {},
    el('style', {}, css),
    el('div', { class: 'toolbar' },
      el('select', {
        value: filename,
        onChange: (e) => {
          setFilename(e.target.value)
          setSource(files[e.target.value])
        }
      },
        Object.keys(files).map(file =>
          el('option', { value: file }, file)
        ),
      ),
      el('span', { style: { marginRight: 'auto' } }, `Line ${line}`),
      el('span', {}, duration ? `${duration}ms` : null),
      el('button', { className: 'btn', onClick: onRun }, 'Run'),
      el('button', { className: 'btn', onClick: onDebug }, 'Debug'),
    ),
    el('textarea', {
      value: source,
      spellcheck: 'false',
      onChange: (e) => {
        setSource(e.target.value)
        files[filename] = e.target.value
      },
      ref: textareaRef,
    })
  )
}

function Output() {
  const [data, setData] = React.useState([])
  useEvent(app, 'clear-output', () => setData([]))
  useEvent(app, 'output', (data) => setData(s => [...s, data]))
  return el('pre', { className: 'glurr-console' },
    data.map(e => el(ConsoleEntry, { value: e }))
  )
}

function ConsoleEntry({ value }) {
  if (value.type == 'image')
    return el(ConsoleImage, { width: value.width, data: value.data })
  return el('div', {}, value)
}

// react component that renders an ImageData object to a canvas
function ConsoleImage({ width, data }) {
  const ref = React.useRef()
  React.useEffect(() => {
    if (!ref.current) return
    const ctx = ref.current.getContext('2d')
    ref.current.width = width
    ref.current.height = data.length / 4 / width
    const imgData = new ImageData(new Uint8ClampedArray(data), width)
    ctx.putImageData(imgData, 0, 0)
  }, [data, ref.current])
  return el('canvas', { ref, style: { borderRadius: 4 } })
}

const css = `
glurr-app {
  display: grid;
}
glurr-app textarea, glurr-app debug-view debug-source {
  box-sizing: border-box;
  font-family: 'Monaco', monospace;
  font-size: 12px;
  line-height: 18px;
  height: 300px;
  width: 500px;
  border: none;
  border-top: 2px solid black;
  padding: 10px;
  resize: none;
}
glurr-app textarea:focus {
  outline: none;
}
.glurr-console {
  box-sizing: border-box;
  display: grid;
  padding: 2px;
  margin: 0;
  min-height: 4em;
  width: 500px;
  height: 150px;
  resize: both;
  overflow: auto;
}
glurr-app .toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px;
  gap: 5px;
}
glurr-app .toolbar .btn {
  min-width: 80px;
}
glurr-app debug-view {
  display: flex;
}
glurr-app debug-view debug-source {
  display: block;
  overflow-y: auto;
}
glurr-app debug-view stack-view {
  box-sizing: border-box;
  display: flex;
  width: 100px;
  height: 300px;
  overflow-y: auto;
  flex-direction: column;
  border-left: 2px solid black;
  border-top: 2px solid black;
  gap: 2px;
  padding: 2px;
  font-family: 'Monaco', monospace;
  font-size: 12px;
}
glurr-app debug-view stack-view source-token {
  border: 1px solid black;
  overflow: hidden;
  text-overflow: ellipsis;
}
glurr-app debug-view source-token {
  display: inline-block;
  padding: 0px 2px;
  border: 1px solid transparent;
  border-radius: 4px;
}
glurr-app debug-view source-token[current] {
  background: black;
  color: white;
}
glurr-app debug-view source-token[breakpoint] {
  border: 1px solid black;
}
`
