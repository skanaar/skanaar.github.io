(function (){
    function randomName(syllables){
        var vowel = 'aaeeiioouuy'
        var conso = 'bcddfghhkllmnnprrsstttv'
        function syllable(){ return _.sample(vowel) + _.sample(conso) }
        return _.sample(conso).toUpperCase() + _.times(syllables || _.random(2,4), syllable).join('')
    }
    function sum(list, plucker){
        var transform = {
            'undefined': _.identity,
            'string': function (obj){ return obj[plucker] },
            'number': function (obj){ return obj[plucker] },
            'function': plucker
        }[typeof plucker]
        for(var i=0, sum=0, len=list.length; i<len; i++)
            sum += transform(list[i])
        return sum
    }
    function average(list, plucker){
        return sum(list, plucker) / list.length
    }
    _.mixin({
        sum: sum,
        average: average,
        randomName: randomName
    })
}())

function attachDataUrlToLink(id, dataType, linkGenerator){
    var link = document.getElementById(id)
    link.addEventListener('click', function (){
        var downloadType = 'data:application/octet-stream'
        link.href = linkGenerator().replace(new RegExp('^data:'+dataType), downloadType)
    }, false);
}

angular.module('cluster', ['ngRoute']).config(function($routeProvider) {
    $routeProvider
    .when('/login', {controller:'GoalsCtrl', templateUrl:'login.partial.html'})
    .when('/dashboard', {controller:'DashboardCtrl', templateUrl:'dashboard.partial.html'})
    .when('/goals', {controller:'GoalsCtrl', templateUrl:'goals.partial.html'})
    .when('/newsolution', {controller: 'RegisterSolutionCtrl', templateUrl:'newsolution.partial.html'})
    .when('/searchclusters', {controller:'SearchCtrl', templateUrl:'clustersearch.partial.html'})
    .when('/cluster/:clusterId', {controller:'ClusterCtrl', templateUrl:'cluster.partial.html'})
    .otherwise({ redirectTo: '/login' })
})

angular.module('cluster').controller('NavbarCtrl', function ($scope){
    $scope.isApp = function (name) {
        function startsWith(haystack, needle){
            return haystack.substr(0, needle.length) === needle;
        }
        return startsWith(window.location.hash, '#/' + name);
    }
})

angular.module('cluster').factory('clusterLoader', function ($http, $q){
    var files = $q.all([
        $http.get('data/cluster-1.json'),
        $http.get('data/cluster-2.json'),
        $http.get('data/cluster-3.json'),
        $http.get('data/cluster-4.json')
    ]).then(function (rs){
        return _.map(rs, function (r){ return unpackCluster(r.data) })
    })

    function unpackCluster(c){
        return {
            name: c.name || 'unnamed cluster',
            centralEntity: c.centralEntity || 0,
            relations: _.map(c.relations, function (r){
                return {
                    start: { id: r.start },
                    end: { id: r.end },
                    type: r.type,
                    description: r.description || 'relation description',
                    author: r.author || 'unknown author',
                    date: r.date
                }
            }),
            entities: _.map(c.entities, function (e){
                return  {
                    id: +e.id,
                    name: e.name,
                    company: e.company,
                    email: e.email || 'unknown email',
                    description: e.description || _.randomName(),
                    status: e.status || 'supporting',
                    type: e.type || 'core',
                    mobility: +e.mobility,
                    nutrition: +e.nutrition,
                    building: +e.building,
                    x: e.x,
                    y: e.y,
                    date: e.date
                }
            })
        }
    }

    return {
        getClusters: function (){
            return files
        },
        getSolutions: function (){
            return files.then(function (rs){ return _.flatten(_.pluck(rs, 'entities')) })
        },
        unpack: unpackCluster
    }
})

angular.module('cluster').controller('SearchCtrl', function ($scope, $http, $q, clusterLoader){
    $scope.clusters = []
    $scope.filters = {
        mobility: false,
        nutrition: false,
        building: false
    }

    clusterLoader.getClusters().then(function (clusters){
        $scope.clusters = clusters
        _.each($scope.clusters, function (c){
            c.mobility = Math.round(_.average(c.entities, 'mobility'))
            c.nutrition= Math.round(_.average(c.entities, 'nutrition'))
            c.building = Math.round(_.average(c.entities, 'building'))
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

angular.module('cluster').controller('ClusterCtrl', function ($scope, $http, $q, $routeParams, clusterLoader){
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

    $scope.relationTypes = ['participant','provider','catalyst','potential','alternative']
    $scope.solutionStatuses = ['existing', 'supporting', 'potential']
    $scope.solutionTypes = ['core', 'accelerator', 'expander']
    $scope.newRelationType = $scope.relationTypes[0]
    $scope.selectedEntity = undefined
    $scope.selectedRelation = undefined
    $scope.allSolutions = []
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
        solutionAge: 30,
        // relations
        rel_participant: true,
        rel_provider: true,
        rel_catalyst: true,
        rel_potential: true,
        rel_alternative: true,
        rel_age: 30
    }
    $scope.clusterName = 'loading...'

    clusterLoader.getSolutions().then(function (sols){
        $scope.allSolutions = sols
    })

    ClusterPlatform.engine.setFilter($scope.filter)
    $scope.$watch('filter', function (){
        ClusterPlatform.engine.setFilter($scope.filter)
        $scope.visibleSolutions = ClusterPlatform.engine.getVisibleSubset().entities
    }, true)

    $scope.$watch('newRelationType', function (t){
        ClusterPlatform.engine.setNewRelationType(t)
    })

    ClusterPlatform.engine.setNodes(new Nodes([], []))
    var clusterId = $routeParams.clusterId
    if (clusterId === 'blank')
        loadCluster(copyOfTemplate())
    else {
        $http.get('data/cluster-'+clusterId+'.json').then(function (response){
            loadCluster(response.data)
        })
    }

    function loadCluster(c){
        c = clusterLoader.unpack(c)
        $scope.visibleSolutions = c.entities
        $scope.clusterName = c.name
        var centralEntity = _.findWhere(c.entities, {id: c.centralEntity})
        $scope.companyName = centralEntity && centralEntity.company

        $scope.clusterProperties = {
            mobility: _.average(c.entities, 'mobility'),
            nutrition: _.average(c.entities, 'nutrition'),
            building: _.average(c.entities, 'building')
        }

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
            name: _.randomName(),
            company: _.randomName() + ' ' + _.randomName(),
            description: _.randomName(),
            status: _.sample(['existing', 'supporting', 'potential']),
            type: _.sample(['core', 'accelerator', 'expander']),
            mobility: _.random(100),
            nutrition: _.random(100),
            building: _.random(100)
        }
        ClusterPlatform.nodes.addEntity(fields)
        ClusterPlatform.nodes.runFor(1000)
    }

    $scope.addSolutionWizard = {
        start: function (){
            $scope.addSolutionWizard.cancel()
            $scope.addSolutionWizard.show = true
        },
        cancel: function (){
            $scope.addSolutionWizard.show = false
            $scope.addSolutionWizard.chosenSolution = undefined
            $scope.addSolutionWizard.page = 1
        },
        show: false,
        page: 1,
        rel_desc: '',
        rel_type: 'participant',
        status: 'existing',
        type: 'core',
        chosenSolution: undefined,
        chooseSolution: function (e){
            $scope.addSolutionWizard.chosenSolution = _.clone(e)
            $scope.addSolutionWizard.page = 2
        },
        done: function (){
            var e = _.omit($scope.addSolutionWizard.chosenSolution, ['id', 'x', 'y'])
            e.type = $scope.addSolutionWizard.type
            e.status = $scope.addSolutionWizard.status
            var created = ClusterPlatform.nodes.addEntity(e)
            var rel_t = $scope.addSolutionWizard.rel_type
            var rel_desc = $scope.addSolutionWizard.rel_desc
            ClusterPlatform.nodes.addRelation($scope.selectedEntity, created, rel_t, rel_desc)
            $scope.addSolutionWizard.cancel()
        }
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