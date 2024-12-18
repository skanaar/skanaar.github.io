export function LandscapeModel(terrain, res) {
  const vertices = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      const [x,y,z] = terrain.point(i-res/2, j-res/2)
      vertices.push(x,y,z)
    }
  }
  const normals = []
  for (var i=0; i<res; i++) {
    for (var j=0; j<res; j++) {
      const [x,y,z] = terrain.normal(i-res/2, j-res/2)
      normals.push(x,y,z)
    }
  }
  const indices = []
  for (var i=0; i<res-1; i++) {
    for (var j=0; j<res-1; j++) {
      const k = i + res*j
      if (i&2==0) {
        indices.push(k, k+1, k+1+res)
        indices.push(k, k+1+res, k+res)
      } else {
        indices.push(k, k+1, k+res)
        indices.push(k+1, k+1+res, k+res)
      }
    }
  }
  return { count: (res-1)*(res-1)*2*3, vertices, normals, indices }
}
