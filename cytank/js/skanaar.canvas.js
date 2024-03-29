export function Canvas(canvas, callbacks){
	var ctx = canvas.getContext('2d');
	var mousePos = { x: 0, y: 0 }
	var twopi = 2*3.1416

	function mouseEventToPos(event){
		var e = canvas
		var rect = e.getBoundingClientRect()
		return {
			x: event.clientX - rect.left - e.clientLeft + e.scrollLeft,
			y: event.clientY - rect.top - e.clientTop + e.scrollTop
		}
	}
	
	canvas.addEventListener('mousedown', function (event){
		if (callbacks.mousedown) callbacks.mousedown(mouseEventToPos(event))
	})
	
	canvas.addEventListener('mouseup', function (event){
		if (callbacks.mouseup) callbacks.mouseup(mouseEventToPos(event))
	})

	canvas.addEventListener('mousemove', function (event){
		mousePos = mouseEventToPos(event)
		if (callbacks.mousemove) callbacks.mousemove(mouseEventToPos(event))
	})

	var chainable = {
		stroke: function (){
			ctx.stroke()
			return chainable
		},
		fill: function (){
			ctx.fill()
			return chainable
		}
	}

	function color255(r, g, b, a){
		var optionalAlpha = a === undefined ? 1 : a
		var comps = [Math.floor(r), Math.floor(g), Math.floor(b), optionalAlpha]
		return 'rgba('+ comps.join() +')'
	}

	function tracePath(path, offset, s){
		s = s === undefined ? 1 : s
		offset = offset || {x:0, y:0}
		ctx.beginPath()
		ctx.moveTo(offset.x + s*path[0].x, offset.y + s*path[0].y)
		for(var i=1, len=path.length; i<len; i++)
			ctx.lineTo(offset.x + s*path[i].x, offset.y + s*path[i].y)
		return chainable
	}

	return {
		mousePos: function (){ return mousePos },
		width: function (){ return canvas.width },
		height: function (){ return canvas.height },
		ctx: ctx,
		inTransform: function (t, func){
			if (!func){
				func = t
				t = {}
			}
			ctx.save()
			if (t.translate) ctx.translate(t.translate.x, t.translate.y)
			if (t.rotate) ctx.rotate(t.rotate)
			if (t.scale) ctx.scale(t.scale)
			func()
			ctx.restore()
		},
		background: function (r, g, b){
			ctx.fillStyle = color255(r, g, b)
			ctx.fillRect (0, 0, canvas.width, canvas.height)
		},
		clear: function (){
			ctx.clearRect(0, 0, canvas.width, canvas.height)
		},
		circle: function (x, y, r){
			ctx.beginPath()
			if (arguments.length === 2)
				ctx.arc(x.x, x.y, y, 0, twopi)
			else	
				ctx.arc(x, y, r, 0, twopi)
			return chainable
		},
		ellipse: function (center, rx, ry, start, stop){
			if (start === undefined) start = 0
			if (stop === undefined) stop = twopi
			if (ry === undefined) ry = rx
			ctx.beginPath()
			ctx.save()
			ctx.translate(center.x, center.y)
			ctx.scale(1, ry/rx)
			ctx.arc(0, 0, rx, start, stop)
			ctx.restore()
			return chainable
		},
		arc: function (x, y, r, start, stop){
			ctx.beginPath()
			ctx.moveTo(x,y)
			ctx.arc(x, y, r, start, stop)
			return chainable
		},
		roundRect: function (x, y, w, h, r){
			ctx.beginPath()
			ctx.moveTo(x+r, y)
			ctx.arcTo(x+w, y, x+w, y+r, r)
			ctx.lineTo(x+w, y+h-r)
			ctx.arcTo(x+w, y+h, x+w-r, y+h, r)
			ctx.lineTo(x+r, y+h)
			ctx.arcTo(x, y+h, x, y+h-r, r)
			ctx.lineTo(x, y+r)
			ctx.arcTo(x, y, x+r, y, r)
			ctx.closePath()
			return chainable
		},
		path: tracePath,
		circuit: function (path, offset, s){
			tracePath(path, offset, s)
			ctx.closePath()
			return chainable
		},
		colorNorm: function (r, g, b, a){
			return color255(255*r, 255*g, 255*b, a)
		},
		color255: color255,
		colorObjHSL: function (hue, sat, lit){
			function component(v){
				var x = Math.cos(6.283*v)/2 + 0.5
				return lit*(1-sat + sat*x*x)
			}
			return {
				r: component(hue),
				g: component(hue-1/3),
				b: component(hue+1/3)
			}
		},
		radialGradient: function (x, y, r1, r2, colors){
			var grad = ctx.createRadialGradient(x, y, r1, x, y, r2)
			for(var key in colors)
				// eslint-disable-next-line no-prototype-builtins
				if (colors.hasOwnProperty(key))
					grad.addColorStop(key, colors[key])
			return grad
		}
	}
}