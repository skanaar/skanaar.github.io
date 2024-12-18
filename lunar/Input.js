export class Input {
  #keys = {}
  #listeners = []
  #onkeydown = null
  #onkeyup = null

  constructor() {
    this.#onkeydown = (e) => {
      this.#keys[e.key] = true
      for (const { key, action } of this.#listeners) {
        if (e.key === key) action(char)
      }
    }
    this.#onkeyup = (e) => this.#keys[e.key] = false
    document.addEventListener('keydown', this.#onkeydown)
    document.addEventListener('keyup', this.#onkeyup)
  }

  dispose() {
      document.removeEventListener('keydown', this.#onkeydown)
      document.removeEventListener('keyup', this.#onkeyup)
  }

  on(key, action) {
    this.#listeners.push({ key, action })
  }

  isPressed(key) {
    return this.#keys[key]
  }

  get up() { return this.#keys['ArrowUp'] || this.#keys['w'] }
  get down() { return this.#keys['ArrowDown'] || this.#keys['s'] }
  get left() { return this.#keys['ArrowLeft'] || this.#keys['a'] }
  get right() { return this.#keys['ArrowRight'] || this.#keys['d'] }
}
