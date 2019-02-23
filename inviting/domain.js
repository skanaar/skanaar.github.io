function Event(id, name, desc, invitees, posts) {
  return {
    id: id,
    name: name,
    description: desc,
    time: '2019-04-05T20:00',
    invitees: invitees,
    posts: posts
  }
}

function Invitee(name, rsvp) {
  return {
    id: name,
    name: name,
    rsvp: rsvp
  }
}

function Post(author, text) {
  return {
    text: text,
    author: author
  }
}

function rand(max) { return Math.floor(Math.random()*max) }
function sample(list) { return list[rand(list.length)] }

function Guid(len) {
  var inital = 'b,br,bl,c,d,dr,f,g,gh,h,j,k,kl,l,m,n,p,q,r,s,t,tr,x,z'.split(',')
  var tinyCons = 'b,br,bl,ck,d,dr,f,g,gh,h,j,k,l,m,n,p,q,r,s,t,tr,x,z'.split(',')
  var longCons = 'b,br,bl,ck,d,dd,dr,f,g,gh,h,j,k,l,ll,m,mm,n,nn,p,q,r,s,t,tr,x,z,zz'.split(',')
  var vowels = 'aaeeiioouuy'
  var word = sample(inital)
  for(var i=0;i<(len||5);i++)
    word += sample(vowels) + sample((len%2) ? longCons : tinyCons)
  return word
}