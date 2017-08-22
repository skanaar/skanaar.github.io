function Vec(x,y){ return {x:x, y:y} }
function dist(a,b){ return mag(diff(a,b)) }
function eq(a,b){ return Math.abs(a.x-b.x) < 1 && Math.abs(a.y-b.y) < 1 }
function rund(a){ return Vec(Math.round(a.x), Math.round(a.y)) }
function add(a,b){ return { x: a.x + b.x, y: a.y + b.y } }
function diff(a,b){ return { x: a.x - b.x, y: a.y - b.y } }
function mult(v,factor){ return { x: factor*v.x, y: factor*v.y } }
function mag(v){ return Math.sqrt(v.x*v.x + v.y*v.y) }
function normalize(v){ return mult(v, 1/mag(v)) }
function rot(a){ return { x: a.y, y: -a.x } }
function rotate(v, a){
  return {
    x: v.x*Math.cos(a) - v.y*Math.sin(a),
    y: v.x*Math.sin(a) + v.y*Math.cos(a)
  }
}

_.mixin({
  sq: x => x*x,
  
  sum: function (list, iteratee) {
    return list.map(_.iteratee(iteratee)).reduce((a,b) => a+b, 0)
  },

  bubbleUp: function (list, index) {
    if (index == 0) return
    var slice = list.splice(index, 1)
    list.splice(index-1, 0, slice[0])
  },

  bubbleDown: function (list, index) {
    if (index == list.length-1) return
    var slice = list.splice(index, 1)
    list.splice(index+1, 0, slice[0])
  },

  toDataUrl: function (payload) {
    return 'data:text;charset=utf-8,' + encodeURIComponent(payload)
  },

  readFile: function (file, callback) {
    var reader = new FileReader()
    reader.onload = () => callback(reader.result)
    reader.readAsText(file)
  },

  fetch: function (url, fn) {
    var req = new XMLHttpRequest()
    req.onreadystatechange = function() {
      if (req.readyState == 4 && (req.status == 200 || (!req.status && req.responseText.length)))
        fn(req.responseText)
    }
    req.open('GET', url, true)
    req.send('')
  },

  jsonParse: function (source) {
    try { return JSON.parse(source) }
    catch (e) { return undefined }
  },

  pairs: function (list, action) {
    for (var i=0; i<list.length; i++)
      for (var j=i+1; j<list.length; j++)
        action(list[i], list[j])
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
});
