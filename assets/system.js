export const el = (...args) => React.createElement(...args)

export class App {
  constructor(name, component, icon) {
    this.name = name
    this.component = component
    this.icon = icon
    this.width = -1
    this.height = -1
    this.pos = {
      x: 30 + Math.floor(Math.random() * window.innerWidth/3),
      y: 30 + Math.floor(Math.random() * window.innerHeight/4),
    }
    this.sizing = 'autosize'
    this.menus = [
      { title: name, items: [{ title: 'Quit', app: name, event: 'app:quit', cmd: '§' }]},
    ]
    this.childWindows = []
    this.args = { app: this }
    this.menuState = {}
  }
  resizable([width, height]) {
    this.sizing = 'resizable'
    this.width = width
    this.height = height
  }
  addAbout(component, opts) {
    const id = `About ${this.name}`
    this.addWindow(id, component, { offset: [50,50], visible: false, ...opts })
    this.addToAppMenu({ title: id, event: 'app:show_child_window', arg: id })
  }
  addToAppMenu(...items) {
    this.menus[0].items.unshift(
      ...items.map(({ title, event, arg, cmd }) =>
        ({ title, app: this.name, event, arg, cmd })
      ),
      { title: null }
    )
  }
  addMenu(menuTitle, ...items) {
    this.menus.push({
      title: menuTitle,
      items: items.map(({ title, event, arg, cmd }) =>
        ({ title, app: this.name, event, arg, cmd })
      )
    })
  }
  addWindow(name, component, { offset, size, sizing, visible }) {
    this.childWindows.push({
      name,
      component,
      visible: !!visible,
      options: {
        offset,
        size: size ?? [-1,-1],
        sizing: sizing ?? 'autosize'
      }
    })
  }
  check(event, arg) {
    this.menuState[event] = arg
  }
  trigger(event, arg) {
    signals.trigger(this.name, event, arg)
  }
}

export function useEvent(app, event, callback) {
  React.useEffect(() => {
    const cleanup = signals.on(app.name, event, callback)
    return cleanup
  })
}

function Clock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const handle = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(handle)
  }, [])

  return el('clock-widget', {}, time.toLocaleTimeString())
}

const signals = {
  listeners: [],
  on(app, event, callback) {
    this.listeners.push({ app, event, callback })
    return () => this.off(app, event, callback)
  },
  off(app, event, callback) {
    this.listeners = this.listeners.filter(
      (e) => !(e.app === app && e.event === event && e.callback === callback)
    )
  },
  trigger(app, event, arg) {
    for (const item of this.listeners) {
      const appMatches = item.app === null || item.app === app
      const eventMatches = item.event === null || item.event === event
      if (appMatches && eventMatches) item.callback(arg, event, app)
    }
  }
}

export function Desktop(props) {
  const { systemMenuLabel, systemName, aboutApp, columns = 3, apps } = props
  const initialApp = (window.location.hash || null)?.substring(1)
  const { startupApps = initialApp ? [initialApp] : [] } = props
  const [currentApp, setCurrentApp] = React.useState(initialApp)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [openApps, setOpenApps] = React.useState(
    Object.fromEntries(startupApps.map(app => [app, true]))
  )

  const childWindow = (app, window) =>
    apps.find(e => e.name === app).childWindows.find(e => e.name == window)

  React.useEffect(() => {
    const onEvent = (arg, event, appName) => {
      if (event == 'sys:restart') location.reload()
      if (event == 'app:focus') {
        setCurrentApp(appName)
        setOpenApps((state) => ({ ...state, [appName]: true }))
      }
      if (event == 'app:show_child_window') {
        childWindow(appName, arg).visible = true
        setCurrentApp(appName)
        setOpenApps((state) => ({ ...state, [appName]: true }))
      }
      if (event == 'app:hide_child_window') {
        childWindow(appName, arg).visible = false
        setCurrentApp(appName)
        setOpenApps((state) => ({ ...state, [appName]: true }))
      }
      if (event === 'sys:enter_fullscreen') {
        document.querySelector('html').requestFullscreen()
          .then(() => setFullscreen(true), () => setFullscreen(false))
      }
      if (event === 'sys:exit_fullscreen') {
        document.exitFullscreen()
        setFullscreen(false)
      }
      if (event == 'app:quit') {
        setCurrentApp(null)
        setOpenApps((state) => ({ ...state, [appName]: false }))
      }
    }
    signals.on(null, null, onEvent)
    return () => { signals.off(onEvent)}
  }, [])

  const systemMenu = el(
    Menu,
    {
      title: systemMenuLabel,
      items: [
        ...Object
          .entries(openApps)
          .filter(([, open]) => open)
          .map(([name]) => ({ title: name, app: name, event: 'app:focus' })),
        { title: null },
        { title: 'Restart', app: null, event: 'sys:restart' }
        ].filter(e => !!e)
    },
  )

  const systemMenuItems = aboutApp ? [{
    title: `About ${systemName}`,
    app: aboutApp,
    event: 'app:focus'
  }] : []

  const app = apps.find(e => e.name === currentApp)
  const appMenus = app
    ? app.menus.map(e => el(Menu, { app, title: e.title, items: e.items }))
    : [el(Menu, { app, title: systemName, items: systemMenuItems })]
  const displayMenuItems = fullscreen
    ? [{ title: 'Exit fullscreen', event: 'sys:exit_fullscreen' }]
    : [{ title: 'Fullscreen', event: 'sys:enter_fullscreen' }]

  const onDesktopKeyDown = (event) => {
    if (!app || !event.metaKey) return
    let menuItem = app.menus.flatMap(_ => _.items).find(_ => _.cmd===event.key)
    if (menuItem) {
      event.preventDefault()
      signals.trigger(menuItem.app, menuItem.event, menuItem.arg)
    }
  }

  return el(
    'desktop-host',
    {
      style: { backgroundImage: `url(${halfToneTile()})` },
      tabIndex: -1,
      onKeyDown: onDesktopKeyDown
    },
    el('header', {},
      el('section', {}, systemMenu, ...appMenus),
      el('section', {},
        el(Menu, { title: 'Display', items: displayMenuItems }),
        el('menu-label', {}, el(Clock))
      ),
    ),
    el(
      'main',
      { onClick: (e) => {
        if (e.target.tagName === 'MAIN')
          setCurrentApp(null)}
      },
      apps.map((app, i) =>
        el(AppIcon, {
          key: `icon-${app.name}`,
          component: app.component,
          icon: '/assets/'+app.icon,
          open: !!openApps[app.name],
          title: app.name,
          style: {
            position: 'absolute',
            left: 20 + 100*(i % columns),
            top: 50 + 120 * Math.floor(i / columns)
          },
          onClick: () => signals.trigger(app.name, 'app:focus', null)
        }),
      ),
      apps
        .filter((app) => !!openApps[app.name])
        .flatMap((app) =>[
          el(
            Window,
            {
              key: app.name,
              x: app.pos.x,
              y: app.pos.y,
              w: app.width,
              h: app.height,
              sizing: app.sizing,
              app,
              title: app.name,
              focused: currentApp === app.name,
              onFocus: () => setCurrentApp(app.name),
              onClose: ({ pos }) => {
                app.pos = pos
                signals.trigger(app.name, 'app:quit')
              },
            },
            el(app.component, app.args),
          ),
          ...app.childWindows.filter(e => e.visible).map(win =>
            el(
              Window,
              {
                key: app.name + ' childwindow' + win.name,
                x: app.pos.x + win.options.offset[0],
                y: app.pos.y + win.options.offset[1],
                w: win.options.size[0],
                h: win.options.size[1],
                sizing: win.options.sizing,
                app,
                title: win.name,
                focused: currentApp === app.name,
                onFocus: () => setCurrentApp(app.name),
                onClose: () => {
                  signals.trigger(app.name, 'app:hide_child_window', win.name)
                },
              },
              el(win.component, win.args),
            )
          )
        ]),
    ),
  )
}

function Window({
  x,
  y,
  w,
  h,
  sizing,
  app,
  title,
  focused,
  onFocus,
  onClose,
  children,
}) {
  const [pos, setPos] = React.useState({ x, y })
  const [error, setError] = React.useState(null)
  const pressed = React.useRef(false)

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (pressed.current) {
        setPos(({ x, y }) => ({
          x: Math.min(window.innerWidth - 30, Math.max(0, x + e.movementX)),
          y: Math.min(
            window.innerHeight - 28 - 30,
            Math.max(28, y + e.movementY),
          ),
        }))
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  React.useEffect(() => {
    const handleMouseUp = () => (pressed.current = false)
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])
  useEvent(app, 'app:error', (err) => {
    setError(err)
  })

  const style = { left: pos.x, top: pos.y }
  const bodyStyle = sizing === 'noresize'
    ? { minWidth: w, minHeight: h, resize: 'both', overflowY: 'auto' }
    : sizing === 'autosize'
    ? {}
    : { width: w, minWidth: w, height: h, resize: 'both', overflowY: 'auto' }

  return el(
    'window-frame',
    { style, onMouseDown: onFocus, class: focused ? 'focused' : '' },
    el(
      'window-title',
      {
        onMouseDown: (e) => {
          if (e.target.nodeName === 'WINDOW-TITLE') pressed.current = true
        },
      },
      el('button', { onClick: () => onClose({ pos }) }),
      title,
    ),
    el('window-body', { style: bodyStyle },
      error ? el(ErrorMsg, { error }) : el(ErrorBoundary, {}, children)
    )
  )
}

function ErrorMsg({ error }) {
  return el('error-msg', {}, error.name ?? 'ERROR', el('p', {}, error.message ))
}

class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state?.error) return el(ErrorMsg, { error: this.state.error })
    return this.props.children
  }
}

export function AppIcon({ icon, component, open, title, style, onClick }) {
  if (typeof component === 'string') return el(
    'a',
    { style, className: 'app-icon', href: component, target: '_blank' },
    el('img', { src: icon }),
    el('span', {}, title),
  )

  return el(
    'a',
    { style, className: 'app-icon ' + (open ? 'open' : ''), onClick },
    el('img', { src: icon }),
    el('span', {}, title),
  )
}

export function Button(props) {
  return el('button', { ...props, className: 'btn ' + (props.className ?? '') })
}

export function Checkbox({ name, children, onChange }) {
  const type = 'checkbox'
  return el('label', {}, el('input', { type, name, onChange }), children)
}

export function Menu({ app, title, items }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef()
  const isOpen = React.useRef(false)
  const showDropdown = open && items
  const activate = () => {
    setOpen(!open)
    isOpen.current = !open
  }

  return el(React.Fragment, {},
    open && el('menu-backdrop', { onClick: () => setOpen(false) }),
    el(
      'menu-root',
      { ref },
      el('button', { className: 'menu-item', onClick: activate }, title),
      showDropdown &&
        el(
          'menu-dropdown',
          {},
          items.map((item, i) => el(
            MenuItem,
            { key: i, app, item, onClose: () => setOpen(false) }
          ))
        )
    ),
  )
}

export function MenuItem({ app, item, onClose }) {
  if (item.title === null) return el('menu-item', {}, el('hr'))
  const onClick = () => {
    signals.trigger(item.app, item.event, item.arg)
    onClose()
  }
  return el('menu-item', {},
    el('button', { onClick },
      app?.menuState[item.event] === item.arg && item.arg !== undefined
      ? '✔ '
      : null,
      item.title,
      item.cmd && el('kbd', {}, '⌘'+item.cmd)
    )
  )
}

export function useMenuState(app, name) {
  const [val, setVal] = React.useState(app.menuState[name])
  useEvent(app, name, (arg) => {
    app.check(name, arg)
    setVal(arg)
  })
  return val
}

function halfToneTile() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 8
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 8, 8)
  ctx.fillStyle = '#fff'
  for (let i of [1,3,4,6,9,11,12,14])
    ctx.fillRect(2*(i%4), 2*Math.floor(i/4), 2, 2)
  return canvas.toDataURL()
}
