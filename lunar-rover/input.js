export var input = {
  keys: {},
  NUMBER: {},
  onNumber: function (action) {
    document.addEventListener('keydown', function(e) {
      var c = e.keyCode;
      if (c >= 48 && c <= 57) action(c - 48);
    });
  },
  on: function (character, action) {
    document.addEventListener('keydown', function(e) {
      var c = String.fromCharCode(e.keyCode).toLowerCase();
      if (c === character) action(c);
    });
  },
  get up () { return this.keys[87] || this.keys[38] },
  get down () { return this.keys[83] || this.keys[40] },
  get left () { return this.keys[65] || this.keys[37] },
  get right () { return this.keys[68] || this.keys[39] },
  dispose: () => {},
  init() {
    var onkeydown = (e) => input.keys[e.keyCode] = true;
    var onkeyup = (e) => input.keys[e.keyCode] = false;
    document.addEventListener('keydown', onkeydown);
    document.addEventListener('keyup', onkeyup);
    this.dispose = () => {
      document.removeEventListener('keydown', onkeydown);
      document.removeEventListener('keyup', onkeyup);
    }
  }
}
