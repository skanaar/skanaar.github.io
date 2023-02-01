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
  }
}

function Clock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const handle = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(handle)
  }, [])

  return el('span', {}, time.toLocaleTimeString())
}

export function Desktop({ title, apps }) {
  const [current, setCurrent] = React.useState('setting')
  const [openApps, setOpenApps] = React.useState({})

  return el(
    'desktop-host',
    { class: 'halftone' },
    el('header', {}, title, el(Clock)),
    el(
      'main',
      {},
      apps.map((app, i) =>
        el(AppIcon, {
          key: `icon-${app.name}`,
          icon: openApps[app.name] ? null : 'assets/'+app.icon,
          title: app.name,
          style: { left: i % 2 ? 130 : 20, top: 50 + 120 * Math.floor(i / 2) },
          onClick: () => {
            setOpenApps({ ...openApps, [app.name]: true })
            setCurrent(app.name)
          },
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
                setOpenApps({ ...openApps, [app.name]: false })
              },
            },
            el(app.component),
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

function AppIcon({ icon, title, style, onClick }) {
  return el(
    'a',
    { style, className: 'app-icon', onClick },
    el('img', { src: icon ?? 'assets/open-app.svg' }),
    el('span', {}, title),
  )
}

export function Button(props) {
  return el('button', { ...props, className: 'btn ' + (props.className ?? '') })
}
