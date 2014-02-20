angular.module('cluster', ['ngRoute']).config(function($routeProvider) {
    $routeProvider
    .when('/dashboard', {controller:'DashboardCtrl', templateUrl:'dashboard.partial.html'})
    .when('/goals', {controller:'GoalsCtrl', templateUrl:'goals.partial.html'})
    .when('/newsolution', { templateUrl:'newsolution.partial.html'})
    .when('/searchclusters', {controller:'SearchCtrl', templateUrl:'clustersearch.partial.html'})
    .when('/cluster/:clusterId', {controller:'ClusterCtrl', templateUrl:'cluster.partial.html'})
    .otherwise({ redirectTo: '/dashboard' })
})

function bindData(targetId, data){
    var target = $('#' + targetId)
    for(var key in data)
        if (data.hasOwnProperty(key))
            target.find('.bind-' + key).text(data[key])
}

function randomName(syllables){
    var vowel = 'aaeeiioouuy'
    var conso = 'bcddfghhkllmnnprrsstttv'
    function syllable(){ return _.sample(vowel) + _.sample(conso) }
    return _.sample(conso).toUpperCase() + _.times(syllables || _.random(2,4), syllable).join('')
}

angular.module('cluster').controller('NavbarCtrl', function ($scope){
    $scope.isApp = function (name) {
        function startsWith(haystack, needle){
            return haystack.substr(0, needle.length) === needle;
        }
        return startsWith(window.location.hash, '#/' + name);
    };
})

angular.module('cluster').controller('SearchCtrl', function ($scope, $http, $q){
    $scope.clusters = []
    $scope.filters = {
        mobility: false,
        nutrition: false,
        building: false
    }

    $q.all([
        $http.get('data/cluster-1.json'),
        $http.get('data/cluster-2.json'),
        $http.get('data/cluster-3.json'),
        $http.get('data/cluster-4.json')
    ]).then(function (responses){
        $scope.clusters = _.pluck(responses, 'data')
        function sumProp(list, propName){
            return _.reduce(_.pluck(list, propName), function (memo, x){ return memo + x }, 0)
        }
        _.each($scope.clusters, function (c){
            c.mobility = Math.round(sumProp(c.entities, 'mobility') / c.entities.length)
            c.nutrition= Math.round(sumProp(c.entities, 'nutrition') / c.entities.length)
            c.building = Math.round(sumProp(c.entities, 'building') / c.entities.length)
        })
    })

    var orderedSolutions = []
    $scope.orderedSolutions = function (){
        orderedSolutions.length = 0
        var s = _.sortBy($scope.clusters, function (s){
            return -(!!$scope.filters.mobility) * s.mobility
                   -(!!$scope.filters.nutrition) * s.nutrition
                   -(!!$scope.filters.building) * s.building
        })
        for (var i=0; i<s.length; i++)
            orderedSolutions.push(s[i])
        return orderedSolutions
    }
})

angular.module('cluster').controller('ClusterCtrl', function ($scope, $http, $routeParams){
    ClusterPlatform.clusterScope = $scope
    $scope.visibleSolutions = []
    $scope.filter = {
        mobility: 0,
        nutrition: 0,
        building: 0,
        existing: true,
        supporting: true,
        potential: true,
        core: true,
        accelerator: true,
        expander: true,
        // relations
        rel_participant: true,
        rel_provider: true,
        rel_catalyst: true,
        rel_potential: true,
        rel_alternative: true
    }
    $scope.clusterName = 'loading...'

    $scope.$watch('filter', function (){
        var subset = ClusterPlatform.engine.filter($scope.filter)
        $scope.visibleSolutions = subset.entities
    }, true)

    ClusterPlatform.engine.setNodes(new Nodes([], []))
    var clusterId = $routeParams.clusterId
    $http.get('data/cluster-'+clusterId+'.json').then(function (response){
        loadCluster(response.data)
    })

    function loadCluster(c){
        $scope.visibleSolutions = c.entities
        $scope.clusterName = c.name
        var centralEntity = _.findWhere(c.entities, {id: c.centralEntity})
        $scope.companyName = centralEntity && centralEntity.company
        _.each(c.relations, function (r){
            r.start = { id: r.start }
            r.end = { id: r.end }
        })
        var nodes = new Nodes(c.entities, c.relations)
        ClusterPlatform.engine.setNodes(nodes)
        ClusterPlatform.engine.setCentralEntityId(c.centralEntity)
        ClusterPlatform.engine.select(c.centralEntity)
        ClusterPlatform.engine.centerSelected()
        ClusterPlatform.nodes = nodes
    }

    $scope.$on('$locationChangeStart', function(scope, next, current){
        ClusterPlatform.engine.pause()
    })

    $scope.togglePane = function (key){
        $scope.activePane = ($scope.activePane === key) ? "none" : key
    }

    $scope.selectEntity = function (id){
        ClusterPlatform.engine.select(id)
    }
})

angular.module('cluster').controller('DashboardCtrl', function ($scope, $http){
    $http.get('data/updates.json').then(function (response){
        $scope.updates = response.data
    })
    $http.get('data/goals.json').then(function (response){
        $scope.goals = response.data
    })
})

angular.module('cluster').controller('GoalsCtrl', function ($scope, $http){
    $http.get('indicator/indicator.pde').then(function (response){
        new Processing('indicator', response.data)
    })
})