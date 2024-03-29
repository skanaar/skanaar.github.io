import {
  ExtrudeGeometry,
  Mesh,
  MeshLambertMaterial,
  Quaternion,
  Shape,
  Vector2,
  Vector3
} from 'three';
import { vec } from './vec.js'
import { Entity } from './entity.js';

export function Rover(wheelA, wheelB, wheelC, wheelD, width){
  return {
    _drawObject: null,
    turn: 0,
    obj: Entity(0, vec.Vec(0,0,0)),
    dir: vec.Vec(1,0,0),
    update: function (dt, gravity, terrain){
      this.apply();
      [wheelA, wheelB, wheelC, wheelD].forEach(function (wheel){
        wheel.update(dt, gravity);
        wheel.collisions(dt, terrain);
      });
      wheelA.attraction(wheelB, dt, width);
      wheelD.attraction(wheelB, dt, width);
      wheelA.attraction(wheelC, dt, width);
      wheelC.attraction(wheelD, dt, width);
      wheelA.attraction(wheelD, dt, width*1.414);
      wheelB.attraction(wheelC, dt, width*1.414);

      //make sure the wheels turn with the body of the rover boggies
      var frontBoggie = vec.add(wheelA.obj.pos, wheelB.obj.pos);
      var backBoggie = vec.add(wheelC.obj.pos, wheelD.obj.pos);
      this.obj.pos = vec.mult(vec.add(frontBoggie, backBoggie), 0.25);
      this.dir = vec.normalize(vec.diff(frontBoggie, backBoggie));
      var leftFactor = this.turn > 0 ? 0.5 : 1;
      var rightFactor = this.turn < 0 ? 0.5 : 1;
      wheelA.turn(this.dir,  leftFactor  * this.turn);
      wheelB.turn(this.dir,  rightFactor * this.turn);
      wheelC.turn(this.dir, -leftFactor  * this.turn);
      wheelD.turn(this.dir, -rightFactor * this.turn);
    },
    drawObject: function (){
      var shape = new Shape([
        new Vector2( width/2,  -width/16),
        new Vector2( width/2,         0 ),
        new Vector2( width/8,   width/8 ),
        new Vector2(-width/1.8, width/8 ),
        new Vector2(-width/2,         0 ),
        new Vector2(-width/2,  -width/16)
      ]);
      var extrude = {
        depth: 0,
        steps: 1,
        material: 1,
        extrudeMaterial: 0,
        bevelEnabled: true,
        bevelThickness: width/3,
        bevelSize: width*0.1,
        bevelSegments: 1
      };
      var geometry = new ExtrudeGeometry(shape, extrude);

      //var geometry = new BoxGeometry(width, width/3, width/2);
      var material = new MeshLambertMaterial({color: 0xdd8800});
      this._drawObject = new Mesh(geometry, material);
      this._drawObject.matrixAutoUpdate = false;
      this._drawObject.castShadow = true;
      return this._drawObject;
    },
    apply: function (){
      var q = new Quaternion();
      q.setFromUnitVectors(new Vector3(1, 0, 0), this.dir);
      var p = new Vector3(this.obj.x, this.obj.y + width/3, this.obj.z);
      this._drawObject.position.copy(p);
      this._drawObject.quaternion.copy(q);
      this._drawObject.updateMatrix();
      wheelA.apply();
      wheelB.apply();
      wheelC.apply();
      wheelD.apply();
    },
    addSpeed: function (dv){
      wheelA.addSpeed(dv);
      wheelB.addSpeed(dv);
      wheelC.addSpeed(dv);
      wheelD.addSpeed(dv);
    },
    steer: function (angle){
      var vel = vec.sum([
        wheelA.obj.vel,
        wheelB.obj.vel,
        wheelC.obj.vel,
        wheelD.obj.vel
      ]);
      var speed = vec.mag(vel);
      this.turn += angle / (1+speed/20);
    },
    steerAhead: function (amount){
      this.turn *= 1 - amount;
    }
  }
}
