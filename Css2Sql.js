import { el, App } from './assets/system.js'

export const app = new App('Css2Sql', Css2Sql, 'cube.svg', [450, 250])

export function Css2Sql() {
  const [input, setInput] = React.useState('')
  
  function link(src, text) {
    return el('a', { href: '#', onClick: (e) => {
      e.preventDefault()
      setInput(src)
    } }, text, el('br'))
  }

  return el(
    'div',
    {},
    el('div', { className: 'stack' },
      el('input', { value: input, onChange: (e) => setInput(e.target.value) }),
      el('p', {}, css2sql(input)),
    ),
    el('h2', {}, 'Examples'),
    el('p', { className: 'stack' },
      link('products[type=pen][color=green]', 'all green pens'),
      link('transactions[value>100]:last-child', 'last transaction of more than EUR 100'),
      link('players[faction=orc]:sum(gold)', 'total wealth of all orcs'),
      link('players#Leeroy', 'get player with id Leeroy'),
      link('players[name*=Captain]', 'players with names like "Captain"')
    ),
  )
}

function css2sql(selector) {
  var trimquot = s => s.replace('"', '').replace("'", '')
  function transpileLike(attr) {
    var p = attr.split('*=')
    return p.length == 1 ? attr : (p[0] + ' LIKE \'%' + trimquot(p[1]) + '%\'')
  }
  function unary(s) {
    var parts = s.split(/:|\[|#/)
    var operation = ''
    var picker = '*'
    var where = (s.match(/\[.*?\]/g) || []).map(e => e.substr(1,e.length-2)).map(transpileLike)
    var pseudo = (s.match(/:[-_0-9a-zA-Z()]*/) || [''])[0]
    var id = (s.match(/#[-_0-9a-zA-Z()]*/) || [''])[0]

    if (pseudo.substr(0,5) === ':sum(') picker = pseudo.substr(1)
    if (pseudo.substr(0,7) === ':count(') picker = pseudo
    if (pseudo === ':first-child') operation = 'ORDER BY date ASC LIMIT 1'
    if (pseudo === ':last-child') operation = 'ORDER BY date DESC LIMIT 1'
    if (id[0] === '#') where.push('id=' + id.substr(1))
    return { table: parts[0], picker: picker, where: where, operation: operation }
  }
  var ast = unary(selector)
  var wheres = ast.where.length ? ' WHERE ' + ast.where.join(' AND ') : ''
  var sql = `SELECT ${ast.picker} FROM ${ast.table}${wheres} ${ast.operation}`
  return sql.trim()
}