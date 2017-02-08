_.mixin({
  fetch: function (url, fn) {
    var req = new XMLHttpRequest()
    req.onreadystatechange = function() {
      if (req.readyState == 4 && (req.status == 200 || (!req.status && req.responseText.length)))
        fn(req.responseText)
    }
    req.open('GET', url, true)
    req.send('')
  },

  stringify: function (obj, options) {
    // Note: This regex matches even invalid JSON strings, but since we’re
    // working on the output of `JSON.stringify` we know that only valid strings
    // are present (unless the user supplied a weird `options.indent` but in
    // that case we don’t care since the output would be invalid anyway).
    var stringOrChar = /("(?:[^"]|\\.)*")|[:,]/g
    function prettify (string) {
      return string.replace(stringOrChar, function (match, string) {
        return string ? match : match + ' '
      })
    }

    function get (options, name, defaultValue) {
      return (name in options ? options[name] : defaultValue)
    }
    options = options || {}
    var indent = JSON.stringify([1], null, get(options, 'indent', 2)).slice(2, -3)
    var maxLength = (indent === '' ? Infinity : get(options, 'maxLength', 80))

    return (function _stringify (obj, currentIndent, reserved) {
      if (obj && typeof obj.toJSON === 'function') {
        obj = obj.toJSON()
      }

      var string = JSON.stringify(obj)

      if (string === undefined) {
        return string
      }

      var length = maxLength - currentIndent.length - reserved

      if (string.length <= length) {
        var prettified = prettify(string)
        if (prettified.length <= length) {
          return prettified
        }
      }

      if (typeof obj === 'object' && obj !== null) {
        var nextIndent = currentIndent + indent
        var items = []
        var delimiters
        var comma = function (array, index) {
          return (index === array.length - 1 ? 0 : 1)
        }

        if (Array.isArray(obj)) {
          for (var index = 0; index < obj.length; index++) {
            items.push(
              _stringify(obj[index], nextIndent, comma(obj, index)) || 'null'
            )
          }
          delimiters = '[]'
        } else {
          Object.keys(obj).forEach(function (key, index, array) {
            var keyPart = JSON.stringify(key) + ': '
            var value = _stringify(obj[key], nextIndent,
                                   keyPart.length + comma(array, index))
            if (value !== undefined) {
              items.push(keyPart + value)
            }
          })
          delimiters = '{}'
        }

        if (items.length > 0) {
          return [
            delimiters[0],
            indent + items.join(',\n' + nextIndent),
            delimiters[1]
          ].join('\n' + currentIndent)
        }
      }
      return string
    }(obj, '', 0))
  }
})