function App() {
  var cache = {
    'my/events': ['myparty', 'rockroll'],
    'event/myparty': Event('myparty', 'My Party', 'Lets party!', ['myparty.Jocke', 'myparty.Bobo'], [0,1]),
    'event/myparty/invitees': [Invitee('Bobo', null), Invitee('Jocke', true)],
    'event/myparty/posts': [Post('Jocke', 'Hej hej'), Post('Bobo', 'jaa!')],
    'post/myparty.0': Post('Jocke', 'Hej nu rullar vi'),
    'post/myparty.1': Post('Bobo', 'jaa!'),
    'invitee/myparty.Bobo': Invitee('Bobo', true),
    'invitee/myparty.Jocke': Invitee('Jocke', true),
    'event/rockroll': Event('rockroll', 'Rockkonsert', 'Vi spelar massvis med rock', ['rockroll.Jocke'], [0]),
    'event/rockroll/invitees': [Invitee('Bengt', false), Invitee('Jocke', null)],
    'event/rockroll/posts': [Post('Bengt', 'when does it start?')],
    'post/rockroll.0': Post('Bengt', 'when does it start?'),
    'invitee/rockroll.Bengt': Invitee('Bengt', true),
    'invitee/rockroll.Jocke': Invitee('Jocke', true),
  }

  function read(path){
    return (id, callback) => callback(cache[path.split('#').join(id)])
  }

  var app = {

    signals: riot.observable(),

    page: 'create',

    route: function (page, id) {
      app.page = page || 'create'
      app.signals.trigger('reroute', app.page, id)
    },

    api: {
      myEvents: read('my/events'),
      event: read('event/#'),
      invitees: read('event/#/invitees'),
      posts: read('event/#/posts'),
      invitee: read('invitee/#'),
      post: read('post/#'),
    },

    persist: {
      event: function (id, obj){ cache[id] = obj }
    }
  }

  return app;
}