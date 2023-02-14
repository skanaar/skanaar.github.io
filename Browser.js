import { el, App, useEvent } from './assets/system.js'

export class BrowserApp extends App {
  constructor(name, icon, url, [width, height] = [400, 500]) {
    super(name, Browser, icon, [width, height], 'autosize')
    this.args = { app: this, url, width, height }
    this.addMenu('Browser', { title: 'Visit site...', event: 'visit' })
  }
}

export function Browser({ app, url, width, height }) {
  
  useEvent(app, 'visit', () => window.open(url, '_blank'))
  
  return el(
    'browser-view',
    {},
    el('style', {}, 'browser-view iframe { display: block; margin: -10px; border: none }'),
    el('iframe', { src: url, width, height: height - 25 }),
  )
}
