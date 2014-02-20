var skanaar = skanaar || {}
skanaar.Canvas = function (canvas, callbacks){
	var ctx = canvas.getContext('2d');
	var mousePos = { x: 0, y: 0 }
	var twopi = 2*3.1416

	function mouseEventToPos(event){
		var e = canvas
		return {
			x: event.clientX - e.getBoundingClientRect().left - e.clientLeft + e.scrollLeft,
			y: event.clientY - e.getBoundingClientRect().top - e.clientTop + e.scrollTop
		}
	}
	
	canvas.addEventListener("mousedown", function (event){
		if (callbacks.mousedown) callbacks.mousedown(mouseEventToPos(event))
	})
	
	canvas.addEventListener("mouseup", function (event){
		if (callbacks.mouseup) callbacks.mouseup(mouseEventToPos(event))
	})

	canvas.addEventListener("mousemove", function (event){
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

	return {
		mousePos: function (){ return mousePos },
		width: function (){ return canvas.width },
		height: function (){ return canvas.height },
		ctx: ctx,
		background: function (r, g, b){
			ctx.fillStyle = color255(r, g, b)
			ctx.fillRect (0, 0, canvas.width, canvas.height)
		},
		circle: function (x, y, r){
			ctx.beginPath()
			if (arguments.length === 2)
				ctx.arc(x.x, x.y, y, 0, twopi)
			else	
				ctx.arc(x, y, r, 0, twopi)
			return chainable
		},
		arc: function (x, y, r, start, stop){
			ctx.beginPath()
			ctx.moveTo(x,y)
			ctx.arc(x, y, r, start, stop)
			return chainable
		},
		path: function (path, offset, s){
			s = s === undefined ? 1 : s
			offset = offset || {x:0, y:0}
			ctx.beginPath()
			ctx.moveTo(offset.x + s*path[0].x, offset.y + s*path[0].y)
			for(var i=1, len=path.length; i<len; i++)
				ctx.lineTo(offset.x + s*path[i].x, offset.y + s*path[i].y)
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
				if (colors.hasOwnProperty(key))
					grad.addColorStop(key, colors[key])
			return grad
		}
	}
}