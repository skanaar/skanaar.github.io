export const el = (...args) => React.createElement(...args)

export class App {
  constructor(name, component, icon, [width, height] = [300, 200], size) {
    this.name = name
    this.component = component
    this.icon = icon
    this.width = width
    this.height = height
    this.pos = {
      x: 100 + Math.floor(Math.random() * 500),
      y: Math.floor(Math.random() * 300),
    }
    this.resizeable = size !== 'noresize'
    this.menus = [
      { title: name, items: [{ title: 'Quit', app: name, event: 'quit' }]},
    ]
  }
  addToAppMenu(...items) {
    this.menus[0].items.unshift(...items.map(({ title, event, arg }) => ({ title, app: this.name, event, arg }))
    )
  }
  addMenu(menuTitle, ...items) {
    this.menus.push({
      title: menuTitle,
      items: items.map(({ title, event, arg }) => ({ title, app: this.name, event, arg }))
    })
  }
}

export function useEvent(app, event, callback) {
  React.useEffect(() => {
    const cleanup = signals.on(app.name, event, callback)
    return cleanup
  }, [])
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

export function Desktop({ title, apps }) {
  const [current, setCurrent] = React.useState(null)
  const [openApps, setOpenApps] = React.useState({})
  
  const openAppNames = [...Object.entries(openApps)].filter(([, open]) => open).map(pair => pair[0])
  
  React.useEffect(() => {
    const onEvent = (arg, event, app) => {
      if (event == 'restart') location.reload()
      if (event == 'focus') {
        setCurrent(app)
        setOpenApps((state) => ({ ...state, [app]: true }))
      }
      if (event == 'quit') {
        setCurrent(null)
        setOpenApps((state) => ({ ...state, [app]: false }))
      }
    }
    signals.on(null, null, onEvent)
    return () => { signals.off(onEvent)}
  }, [])
  
  const systemMenu = el(
    Menu,
    {
      title,
      items: [
        { title: 'About Skanaar', app: 'Readme', event: 'focus' },
        { title: null },
        ...openAppNames.map(name => ({ title: name, app: name, event: 'focus' })),
        { title: null },
        { title: 'Restart', app: null, event: 'restart' }
      ]
    },
  )
  
  const appMenuSpecs = apps.find(e => e.name === current)?.menus ?? []
  const appMenus = appMenuSpecs.map(e =>
    el(Menu, { title: e.title, items: e.items })
  )

  return el(
    'desktop-host',
    { class: 'halftone' },
    el('header', {}, systemMenu, ...appMenus, el(Clock)),
    el(
      'main',
      {},
      apps.map((app, i) =>
        el(AppIcon, {
          key: `icon-${app.name}`,
          component: app.component,
          icon: 'assets/'+app.icon,
          open: !!openApps[app.name],
          title: app.name,
          style: { left: 20 + 100*(i % 3), top: 50 + 120 * Math.floor(i / 3) },
          onClick: () => signals.trigger(app.name, 'focus', null)
        }),
      ),
      apps
        .filter((app) => !!openApps[app.name])
        .map((app) =>
          el(
            Window,
            {
              key: app.name,
              x: app.pos.x,
              y: app.pos.y,
              w: app.width,
              h: app.height,
              resizeable: app.resizeable,
              title: app.name,
              focused: current === app.name,
              onFocus: () => setCurrent(app.name),
              onClose: ({ pos }) => {
                app.pos = pos
                signals.trigger(app.name, 'quit')
              },
            },
            el(app.component, {}),
          ),
        ),
    ),
  )
}

function Window({
  x,
  y,
  w,
  h,
  resizeable,
  title,
  focused,
  onFocus,
  onClose,
  children,
}) {
  const [pos, setPos] = React.useState({ x, y })
  const pressed = React.useRef(false)

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (pressed.current) {
        setPos(({ x, y }) => ({
          x: Math.min(window.innerWidth - w, Math.max(0, x + e.movementX)),
          y: Math.min(
            window.innerHeight - 28 - h,
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

  const style = { left: pos.x, top: pos.y, minWidth: w, minHeight: h }
  if (resizeable) style.resize = 'both'
  const className = focused ? 'focused' : ''

  return el(
    React.Fragment,
    {},
    el(
      'window-frame',
      { style, onMouseDown: onFocus, class: className },
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
      el('window-body', {}, children),
    ),
  )
}

function AppIcon({ icon, component, open, title, style, onClick }) {
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

export function Menu({ title, items }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef()
  const isOpen = React.useRef(false)
  const showDropdown = open && items
  function activate() {
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
            { key: i, item, onClose: () => setOpen(false) }
          ))
        )
    ),
  )
}

export function MenuItem({ item, onClose }) {
  if (item.title === null) return el(Divider)
  const onClick = () => {
    signals.trigger(item.app, item.event, item.arg)
    onClose()
  }
  return el('menu-item', {}, el('button', { onClick }, item.title))
}

export function Divider() {
  return el('menu-item', {}, el('hr'))
}
