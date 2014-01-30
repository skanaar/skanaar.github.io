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
	
	canvas.addEventListener ("mouseup", function (event){
		if (callbacks.mouseup) callbacks.mouseup(mouseEventToPos(event))
	})

	canvas.addEventListener ("mousemove", function (event){
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
			ctx.arc(x, y, r, 0, twopi)
			return chainable
		},
		path: function (path, x, y, s){
			s = s === undefined ? 1 : s
			x = x || 0
			y = y || 0
			ctx.beginPath()
			ctx.moveTo(x + s*path[0][0], y + s*path[0][1])
			for(var i=1, len=path.length; i<len; i++)
				ctx.lineTo(x + s*path[i][0], y + s*path[i][1])
			return chainable
		},
		colorNorm: function (r, g, b, a){
			return color255(255*r, 255*g, 255*b, a)
		},
		color255: color255
	}
}