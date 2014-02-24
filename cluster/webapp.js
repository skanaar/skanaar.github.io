angular.module('cluster', ['ngRoute']).config(function($routeProvider) {
    $routeProvider
    .when('/dashboard', {controller:'DashboardCtrl', templateUrl:'dashboard.partial.html'})
    .when('/goals', {controller:'GoalsCtrl', templateUrl:'goals.partial.html'})
    .when('/newsolution', {controller: 'RegisterSolutionCtrl', templateUrl:'newsolution.partial.html'})
    .when('/searchclusters', {controller:'SearchCtrl', templateUrl:'clustersearch.partial.html'})
    .when('/cluster/:clusterId', {controller:'ClusterCtrl', templateUrl:'cluster.partial.html'})
    .otherwise({ redirectTo: '/dashboard' })
})

function attachDataUrlToLink(id, dataType, linkGenerator){
    var link = document.getElementById(id)
    link.addEventListener('click', function (){
        var downloadType = 'data:application/octet-stream'
        link.href = linkGenerator().replace(new RegExp('^data:'+dataType), downloadType)
    }, false);
}

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

    var clusterTemplate = {
        name: "blank cluster",
        centralEntity: 0,
        entities: [{
            id: 0,
            name: "blank solution",
            company: "blank company",
            description: "description...",
            status: "existing",
            type: "core",
            mobility: 50,
            nutrition: 50,
            building: 50,
            x: 0,
            y: 0
        }],
        relations: []
    }

    $scope.selectedEntity = undefined
    $scope.selectedRelation = undefined
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

    ClusterPlatform.engine.setFilter($scope.filter)
    $scope.$watch('filter', function (){
        ClusterPlatform.engine.setFilter($scope.filter)
        $scope.visibleSolutions = ClusterPlatform.engine.getVisibleSubset().entities
    }, true)

    ClusterPlatform.engine.setNodes(new Nodes([], []))
    var clusterId = $routeParams.clusterId
    if (clusterId === 'blank')
        loadCluster(copyOfTemplate())
    else
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
        ClusterPlatform.cluster = c
        ClusterPlatform.engine.setNodes(nodes)
        ClusterPlatform.engine.setCentralEntityId(c.centralEntity)
        ClusterPlatform.engine.select(c.centralEntity)
        ClusterPlatform.engine.centerSelected()
        ClusterPlatform.nodes = nodes

        ClusterPlatform.engine.onSelectedEntityChanged(function (e){
            $scope.$apply(function (){ $scope.selectedEntity = e })
        })

        ClusterPlatform.engine.onSelectedRelationChanged(function (r){
            $scope.$apply(function (){ $scope.selectedRelation = r })
        })
    }

    function copyOfTemplate(){ return JSON.parse(JSON.stringify(clusterTemplate)) }

    $scope.$on('$locationChangeStart', function(scope, next, current){
        ClusterPlatform.engine.pause()
    })

    $scope.togglePane = function (key){
        $scope.activePane = ($scope.activePane === key) ? "none" : key
    }

    $scope.selectEntity = function (id){
        ClusterPlatform.engine.select(id)
    }

    $scope.loadClusterFile = function (files){
        var reader = new FileReader()
        reader.onload = function(e) {
            loadCluster(JSON.parse(reader.result))
        }
        reader.readAsText(files[0])
    }

    $scope.addSolution = function (){
        var fields = {
            id:_.uniqueId(),
            name: randomName(),
            company: randomName() + ' ' + randomName(),
            description: randomName(),
            status: _.sample(['existing', 'supporting', 'potential']),
            type: _.sample(['core', 'accelerator', 'expander']),
            mobility: _.random(100),
            nutrition: _.random(100),
            building: _.random(100)
        }
        ClusterPlatform.nodes.addEntity(fields)
        ClusterPlatform.nodes.runFor(1000)
    }

    $scope.removeEntity = function (){
        if ($scope.selectedEntity)
            ClusterPlatform.nodes.removeEntity($scope.selectedEntity)
    }

    $scope.removeRelation = function (){
        if ($scope.selectedRelation)
            ClusterPlatform.nodes.removeRelation($scope.selectedRelation)
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

angular.module('cluster').controller('RegisterSolutionCtrl', function ($scope){
    $scope.area = {
        mobility: 0,
        nutrition: 0,
        building: 0
    }
    $scope.panes = {}
    $scope.toggle = function (key){
        $scope.panes[key] = !$scope.panes[key]
    }
    $scope.icon = function (key){
        return $scope.panes[key] ?
            'fa fa-chevron-circle-down fa-lg' :
            'fa fa-chevron-circle-right fa-lg'
    }
})