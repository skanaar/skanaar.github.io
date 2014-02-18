angular.module('cluster', ['ngRoute']).config(function($routeProvider) {
    $routeProvider
    .when('/dashboard', {controller:'DashboardCtrl', templateUrl:'dashboard.partial.html'})
    .when('/goals', {controller:'GoalsCtrl', templateUrl:'goals.partial.html'})
    .when('/searchclusters', {controller:'SearchCtrl', templateUrl:'clustersearch.partial.html'})
    .when('/cluster/:clusterId', {controller:'ClusterCtrl', templateUrl:'cluster.partial.html'})
    .otherwise({ redirectTo: '/' })
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

angular.module('cluster').controller('SearchCtrl', function ($scope){
    $scope.clusters = _.times(20, function (i){
        return {
            name: randomName(),
            id: i,
            mobility:  _.random(100),
            nutrition: _.random(100),
            building:  _.random(100)
        }
    })

    $scope.filters = {
        mobility: false,
        nutrition: false,
        building: false
    }

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

angular.module('cluster').controller('ClusterCtrl', function ($scope, $http){
    ClusterPlatform.clusterScope = $scope
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

    $scope.$watch('filter', function (){
        ClusterPlatform.engine.filter($scope.filter)
    }, true)

    $scope.setCluster = function (clusterId, engine){
        $http.get('data/cluster-'+clusterId+'.json').then(function (response){
            ClusterPlatform.engine.setNodes(new Nodes([], []))
            _.each(response.data.relations, function (r){
                r.start = { id: r.start.id }
                r.end = { id: r.end.id }
            })
            var nodes = new Nodes(response.data.entities, response.data.relations)
            ClusterPlatform.engine.setNodes(nodes)
        })
    }

    $scope.$on('$locationChangeStart', function(scope, next, current){
        ClusterPlatform.engine.pause()
    });

    $scope.togglePane = function (key){
        $scope.activePane = ($scope.activePane === key) ? "none" : key
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