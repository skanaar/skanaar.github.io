

(function (){
	var link = document.getElementById('savebutton')
	if (link === null) return
	link.addEventListener('click', downloadImage, false);
	function downloadImage(){
		var url = canvas.toDataURL('image/png')
		var downloadUrl = url.replace(/^data:image\/[^;]/, 'data:application/octet-stream')
	    link.href = downloadUrl;
	}
}())

function toggleHelp(){
	document.getElementById('help').classList.toggle("visible");
}

function fillScreen(){
	w = canvas.parentElement.offsetWidth
	h = canvas.parentElement.offsetHeight
	canvas.setAttribute('width', w*0.75)
	canvas.setAttribute('height', h-200)
	sourceChanged()
}

var w, h;
var canvas = document.getElementById('canvas')
var textarea = document.getElementById('textarea')
var g = skanaar.Canvas(canvas, {})
window.addEventListener('resize', _.throttle(fillScreen, 750, {leading: true}))
textarea.addEventListener('input', _.debounce(sourceChanged, 300))
textarea.value = localStorage.getItem('nomnoml.lastSource') || document.getElementById('defaultGraph').innerHTML
fillScreen()

function discardCurrentGraph(){
	textarea.value = document.getElementById('defaultGraph').innerHTML
	sourceChanged()
}

function setFont(ast, isBold){
	var style = isBold === 'bold' ? 'bold ' : ''
	g.ctx.font = style+ast.fontSize+'pt '+ast.font+', Helvetica, sans-serif'
}

function sourceChanged(){
	var ast = parse(textarea.value)
	setFont(ast, 'bold')
	localStorage.setItem('nomnoml.lastSource', textarea.value)
	render(ast, layout(ast, measureNode))
}

function measureNode(fontSize, node){
	var lines = _.flatten([node.name, node.attrs, node.ops])
	var widths = _.map(lines, function (n){ return g.ctx.measureText(n).width })
	return {
		width: _.max(widths) + 25,
		height: (fontSize) *  (lines.length + (lines.length===1 ? 1.5 : 2.5))
	}
}

function trim(s){ return s.trim() }
function trims(ss){ return _.map(ss, trim) }

function parse(source){
	function parseRelationString(s){
		var pattern = /\[(.*)\]\s*(-:>|<:-|--:>|<:--|->|<-|\+->|<-\+|o->|<-o|-->|<--|<->|-|--|:)\s*\[(.*)\]/
		var parts = s.match(pattern)
		return parts && trims(_.tail(parts))
	}
	function parseMetaString(s){
		var pattern = /#([^:]*):(.*)/
		var parts = s.match(pattern)
		return parts && trims(_.tail(parts))
	}
	var lines = source.split('\n')
	var bimap = _.compact(_.map(lines, parseRelationString))
	var directives = _.object(_.compact(_.map(lines, parseMetaString)))
	var nodes = {}
	var relations = []
	function parseClass(nodes, classSerialization){
		var tokens = trims(classSerialization.split('|'))
		if (tokens.length === 3)
			delete nodes[tokens[0]]
		return nodes[tokens[0]] || {
			name: tokens[0],
			attrs: tokens[1] ? tokens[1].split(';') : [],
			ops: tokens[2] ? tokens[2].split(';') : []
		}
	}
	_.each(bimap, function (pair, i){
		var left = parseClass(nodes, pair[0])
		var right = parseClass(nodes, pair[2])
		if (left.name) nodes[left.name] = left
		if (right.name) nodes[right.name] = right
		var isLeftToRight = (pair[1][0] === '-' || pair[1][0] === '+' || pair[1][0] === 'o')
		var a = isLeftToRight ? left : right
		var b = isLeftToRight ? right : left
		var t = {
			'-:>': 'generalization',
			'<:-': 'generalization',
			'--:>': 'realization',
			'<:--': 'realization',
			'-->': 'dependency',
			'<--': 'dependency',
			'->': 'association',
			'<-': 'association',
			'o->': 'aggregation',
			'<-o': 'aggregation',
			'+->': 'composition',
			'<-+': 'composition',
			'<->': 'twoway',
			'-': 'nondirectional',
			'--': 'note'
		}[pair[1]]
		if (t && a.name && b.name)
			relations.push({id: i, start: a.name, end:b.name, type: t})
	})

	return {
		nodes: nodes,
		relations: relations,
		fontSize: (+directives.fontSize) || 12,
		font: directives.font || 'Calibri',
		spacing: (+directives.spacing) || 30,
		direction: {down: 'TB', right: 'LR'}[directives.direction] || 'TB',
		fillArrows: directives.fillArrows === 'true',
		frame: directives.frame
	}
}

function layout(ast, measureNode){
	function buildDagreGraph(ast){
		var g = new dagre.Digraph()
		_.each(ast.nodes, function (e, key){
			var size = measureNode(ast.fontSize, e)
			g.addNode(key, { label: key, width: size.width, height: size.height })
		})
		_.each(ast.relations, function (r){
			g.addEdge(r.id, r.start, r.end)
		})
		return g
	}
	function packageDagreGraph(ast, dagreLayout){
		var nodes = {}
		var relations = []
		dagreLayout.eachNode(function (key, data){
			nodes[key] = {
				name: key,
				x: data.x,
				y: data.y,
				attrs: ast.nodes[key].attrs,
				ops: ast.nodes[key].ops,
				width: data.width,
				height: data.height
			}
		})
		dagreLayout.eachEdge(function (id, start, end, data){
			relations.push({
				start: nodes[start],
				middle: _.pick(data, 'x', 'y'),
				end: nodes[end],
				path: _.flatten([nodes[start], data.points, nodes[end]]),
				type: _.findWhere(ast.relations, {id: id}).type
			})
		})
		var g = dagreLayout.graph()
		return { nodes: nodes, relations: relations, width: g.width, height: g.height }
	}
	var dagreLayout = dagre.layout()
						   .rankSep(ast.spacing)
						   .nodeSep(ast.spacing)
						   .edgeSep(ast.spacing)
						   .rankDir(ast.direction)
						   .run(buildDagreGraph(ast))
	return packageDagreGraph(ast, dagreLayout)
}

function render(ast, layout){

	function rectIntersection(p1, p2, w, h){
		var v = diff(p1, p2)
		for(var t=1; t>=0; t-= 0.01){
			var p = mult(v, t)
			if(Math.abs(p.x) < w/2 && Math.abs(p.y) < h/2)
				return add(p2, p)
		}
		return p1
	}

	function drawArrow(path, isOpen, target, diamond){
		var size = ast.spacing / 30
		var v = diff(path[path.length-2], _.last(path))
		var nv = normalize(v)
		var arrowPoint = rectIntersection(path[path.length-2], _.last(path), target.width, target.height)
		var arrowBase = add(arrowPoint, mult(nv, (diamond ? 7 : 10)*size))
		var t = rot(nv)
		var arrowButt = (diamond) ? add(arrowPoint, mult(nv, 14*size))
				: (isOpen && !ast.fillArrows) ? add(arrowPoint, mult(nv, 5*size)) : arrowBase
		var arrow = [
			add(arrowBase, mult(t, 4*size)),
			arrowButt,
			add(arrowBase, mult(t, -4*size)),
			arrowPoint,
			add(arrowBase, mult(t, 4*size))
		]
		g.ctx.fillStyle = isOpen ? '#111' : '#fff'
		var ctx = g.path(arrow).fill().stroke()
	}

	function drawFrame(title, layout){
		g.ctx.fillStyle = '#000'
		setFont(ast, 'normal')
		g.ctx.textAlign = 'left'
		g.ctx.strokeRect(0, 0, layout.width+2*frameMarg, layout.height+frameMarg*3+lineHeight)
		var w = g.ctx.measureText(title).width + frameMarg
		var h = lineHeight+frameMarg
		g.path([{x:0, y:h}, {x:w-frameMarg*2/3, y:h}, {x:w, y:h-frameMarg}, {x:w, y:0}]).stroke()
		g.ctx.fillText(ast.frame, frameMarg/2, frameMarg/2 + lineHeight)
	}

	function rnd(x){ return Math.round(x) }

	var empty = !true
	var filled = !false
	var diamond = 'diamond'
	var lineHeight = ast.fontSize
	var frameMarg = 10

	g.ctx.save()
	g.ctx.clearRect(0, 0, w, h)
	g.ctx.strokeStyle = '#111'
	g.ctx.lineWidth = 1

	g.ctx.translate(rnd((g.width() - layout.width)/2)+0.5, 0.5)

	if (ast.frame)
		drawFrame(ast.frame, layout)

	g.ctx.translate(frameMarg, frameMarg*2 + lineHeight)
	g.ctx.textAlign = 'center'

	_.each(layout.relations, function (r){
		if (r.type == 'generalization'){
			g.path(r.path).stroke()
			drawArrow(r.path, empty, r.end)
		}
		else if (r.type == 'realization'){
			g.dashPath(r.path, 3, 3)
			drawArrow(r.path, empty, r.end)
		}
		else if (r.type == 'dependency'){
			g.dashPath(r.path, 3, 3)
			drawArrow(r.path, filled, r.end)
		}
		else if (r.type == 'association'){
			g.path(r.path).stroke()
			drawArrow(r.path, filled, r.end)
		}
		else if (r.type == 'aggregation'){
			g.path(r.path).stroke()
			drawArrow(r.path, filled, r.end)
			drawArrow(_.clone(r.path).reverse(), empty, r.start, diamond)
		}
		else if (r.type == 'composition'){
			g.path(r.path).stroke()
			drawArrow(r.path, filled, r.end)
			drawArrow(_.clone(r.path).reverse(), filled, r.start, diamond)
		}
		else if (r.type == 'nondirectional'){
			g.path(r.path).stroke()
		}
		else if (r.type == 'note'){
			g.dashPath(r.path, 3, 3)
		}
		else if (r.type === 'twoway'){
			g.path(r.path).stroke()
			drawArrow(r.path, 'dependency', r.end)
			drawArrow(_.clone(r.path).reverse(), 'dependency', r.start)
		}
	})
	g.ctx.lineWidth = 1
	_.each(layout.nodes, function (e){
		var w = e.width
		var h = e.height
		var rx = rnd(e.x-w/2)
		var ry = rnd(e.y-h/2)
		var y = e.y-h/2
		g.ctx.fillStyle = 'rgba(220, 220, 220, 1)'
		g.ctx.fillRect(rx, ry, w, h)
		g.ctx.strokeRect(rx, ry, w, h)
		g.ctx.fillStyle = '#333'
		y += rnd(lineHeight*1.5)
		setFont(ast, 'bold')
		g.ctx.textAlign = 'center'
		if (!(e.attrs.length || e.ops.length)){
			g.ctx.fillText(e.name, e.x, y+ast.fontSize/5)
		} else {
			g.ctx.fillText(e.name, e.x, y)
			y += rnd(lineHeight/2)
			var line = [{x: rx, y: y}, {x: rx+w, y: y}]
			g.path(line).stroke()
			g.path(line, {x:0, y:rnd((e.attrs.length+0.75)*lineHeight)}).stroke()
			y += lineHeight/4
		}
		setFont(ast, 'normal')
		g.ctx.textAlign = 'left'
		var tx = rnd(e.x-w/2)+13
		_.each(e.attrs, function (a, i){
			y += lineHeight
			g.ctx.fillText(a, tx, y)
		})
		y += lineHeight*0.75
		_.each(e.ops, function (a, i){
			y += lineHeight
			g.ctx.fillText(a, tx, y)
		})
	})
	g.ctx.restore()
}