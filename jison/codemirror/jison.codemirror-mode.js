CodeMirror.defineMode('jison', function() {
  return {
    startState: function() {
      return {
        section: null
      }
    },
    token: function(stream, state) {
      switch (state.section) {

      case 'preamble':

        if (stream.match(/^\s*%}\s*$/)) {
          state.section = null
          return 'keyword'
        }
        if (stream.match(/^.*$/)) return 'comment'
        break;

      case null:

        if (stream.match(/^\s*%\{\s*$/)) {
          state.section = 'preamble'
          return 'keyword'
        }
        if (stream.match(/^%.*$/)) {
          return 'keyword'
        }
        if (stream.match(/^[a-zA-Z0-9]*$/)){
          state.section = 'matchers'
          return 'atom'
        }
        if (stream.match(/[\s\n]*\:\s*/)){
          state.section = 'matchers'
          return 'atom'
        }
        if (stream.match(/[\s\n]*\|\s*/)){
          state.section = 'matchers'
          return 'atom'
        }
        break;

      case 'matchers':

        if (stream.match(/[^\{-]*/)){
          state.section = 'action'
          return 'variable'
        }
        break;

      case 'action':

        if (stream.match(/-> [^|]*|\{[^|]*\}/)){
          state.section = null
          return 'string'
        }
        break;

      }
      if (stream.match(/^.*$/)) return 'comment'
      return null
    }
  };
});
