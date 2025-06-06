import { V } from './vector.js'

export function Terrain(points){
	var verts = points
	function vertex(i){ return verts[(i + verts.length) % verts.length] }
	return {
		vertices: verts,
		vertex: vertex,
		segment: function (i){
			var start = vertex(i)
			var end = vertex(i+1)
			var dir = V.normalize(V.diff(end, start))
			var normal = V.rot(dir)
			return { start: start, end: end, dir: dir, normal: normal }
		}
	}
}

export function Particles(w, h, scale, maxCount){
	var field = V.VectorField(w, h, {
		initializer: function (i,j){
			return V.add(V.random(10), V.Vec(0, (j/2-h/2)))
		}
	})
	var particles = []

	function dropSurplus(){
		let count = Math.max(0, particles.length - maxCount)
    for (let i = 0; i < count; i++) {
			var index = Math.floor(Math.random()*particles.length)
			particles.splice(index, 1)
		}
	}

	return {
		particles: particles,
		add: function (pos, size, radius, density){
			if (pos.x < 0 || pos.x > w*scale || pos.y < 0 || pos.y > h*scale)
				return
			if (particles.length + density > maxCount)
				density = Math.round(density/2)
			for (let i = 0; i < density; i++) {
				particles.push({
					size: size,
					pos: V.add(pos, V.random(Math.random()*radius)),
					value: Math.random()/2 + 0.5
				})
			}
			dropSurplus()
		},
		update: function (deltaT){
			for (let e of particles) {
				e.value -= 0.01
				var cell = V.mult(e.pos, 1/scale)
				var force = field.sample(cell)
				e.pos = V.add(e.pos, V.mult(force, deltaT))
			}
			for(var k=0; k<particles.length; k++)
				if (particles[k].value <= 0)
					particles.splice(k, 1)
		}
	}
}

export function Unit(pos, opt = {}){
	return {
		style: null,
		pos: pos,
		vel: V.Vec(),
		radius: 10,
		isGrounded: false,
		isCollider: true,
		hasVisualDeath: true,
		terrain: 0,
		segment: 0,
		jumpCharge: 0,
		age: 0,
		maxAge: 0,
		airFriction: 1,
		groundFriction: 0.97,
		maxHealth: 1000,
		health: 1000,
		damageRadius: 50,
		damageOnDeath: 200,
		suspension: 200,
		...opt
	}
}

export function Explosion(pos, opt){
	return Unit(pos, {
		...opt,
		style: 'explosion',
		airFriction: 0,
		damageOnDeath: 0,
		hasVisualDeath: false,
		isCollider: false
	})
}

export function World(){
	var units = [
		Unit(V.Vec(250, 20), { groundFriction: 0.99 }),
		Unit(V.Vec(80, 30), { airFriction: 0.7, radius: 3 }),
		Unit(V.Vec(550, 200), {
			vel: V.Vec(-80, -80)
		})
	]
	return {
		gravity: V.Vec(0, 500),
		particles: Particles(80, 40, 10, 400),
		terrains: [
			Terrain([V.Vec(350, 150), V.Vec(550, 150), V.Vec(450, 200)]),
			Terrain([
				{x:-5,y:405},{x:-5,y:-5},{x:30,y:209},{x:75,y:248},{x:85,y:250},
				{x:145,y:219},{x:170,y:146},{x:144,y:112},{x:124,y:70},
				{x:223,y:54},{x:336,y:89},{x:320,y:119},{x:258,y:176},
				{x:244,y:256},{x:227,y:280},{x:251,y:316},{x:457,y:349},
				{x:550,y:300},{x:690,y:300},{x:700,y:295},{x:805,y:-5},
				{x:805,y:405}])
		],
		units: units
	}
}
