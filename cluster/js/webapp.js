(function (){
    function randomName(syllables){
        var vowel = 'aaeeiioouuy'
        var conso = 'bcddfghhkllmnnprrsstttv'
        function syllable(){ return _.sample(vowel) + _.sample(conso) }
        return _.sample(conso).toUpperCase() + 
                _.times(syllables || _.random(2,4), syllable).join('')
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

function clusterToDataUrl(){
    return 'data:text/json;charset=utf-8,' + encodeURIComponent(serializeCluster())
}

function attachDataUrlToLink(id, dataType, linkGenerator){
    var link = document.getElementById(id)
    link.addEventListener('click', function (){
        var downloadType = 'data:application/octet-stream'
        var regex = new RegExp('^data:'+dataType)
        link.href = linkGenerator().replace(regex, downloadType)
    }, false);
}

angular.module('cluster', ['ngRoute', 'ngSanitize']).config(function($routeProvider) {
    $routeProvider
    .when('/login', 
        {controller:'LoginCtrl', 
        templateUrl:'partials/login.partial.html'})
    .when('/dashboard', {
        controller:'DashboardCtrl', 
        templateUrl:'partials/dashboard.partial.html'})
    .when('/map', {
        controller:'MapCtrl', 
        templateUrl:'partials/map.partial.html'})
    .when('/goals', {
        controller:'GoalsCtrl', 
        templateUrl:'partials/goals.partial.html'})
    .when('/settings', {
        controller: 'SettingsCtrl',
        templateUrl:'partials/settings.partial.html'})
    .when('/newsolution', {
        controller: 'RegisterSolutionCtrl',
        templateUrl:'partials/newsolution.partial.html'})
    .when('/searchclusters', {
        controller:'SearchCtrl', 
        templateUrl:'partials/clustersearch.partial.html'})
    .when('/searchsolutions', {
        controller:'SearchSolutionCtrl', 
        templateUrl:'partials/searchsolution.partial.html'})
    .when('/cluster/:clusterId', {
        controller:'ClusterCtrl', 
        templateUrl:'partials/cluster.partial.html'})
    .when('/network', {
        templateUrl:'partials/network.partial.html'})
    .otherwise({ redirectTo: '/login' })
})
.run(function ($rootScope, $location){
    $rootScope.$on('$locationChangeStart', function(scope, next, current){
        if (next.indexOf('#/login') === -1 && !localStorage['user'])
            $location.path('/login')
    })
})

angular.module('cluster').controller('NavbarCtrl', function ($scope, $location){
    $scope.isApp = function (name) {
        function startsWith(haystack, needle){
            return haystack.substr(0, needle.length) === needle;
        }
        return startsWith(window.location.hash, '#/' + name);
    }
    $scope.logout = function () {
        delete localStorage.user
        $location.path('/login')
    }
})

angular.module('cluster').controller('SearchCtrl', 
    function ($scope, $http, clusterLoader){
    $scope.clusters = []
    $scope.filters = {
        mobility: false,
        nutrition: false,
        building: false
    }

    clusterLoader.getClusters().then(function (clusters){
        $scope.clusters = _.tail(clusters)
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

angular.module('cluster').controller('SearchSolutionCtrl', 
    function ($scope, $http, clusterLoader){
    $scope.solutions = []

    clusterLoader.getSolutions().then(function (sols){
        $scope.solutions = sols
    })

    $scope.funcs = clusterLoader.getSolutionFunctionTree()

    var cachedArrayInstance = []
    $scope.filteredSolutions = function (){
        cachedArrayInstance.length = 0
        function accept(s){
            for(var a in $scope.funcs){
                for(var b in ($scope.funcs[a] || {})){
                    for(var c in ($scope.funcs[a][b] || {})){
                        if (s.functions[a+'_'+b+'_'+c] && $scope.funcs[a][b][c])
                            return true
                    }
                }
            }
            return false
        }
        _.each($scope.solutions, function (e){
            if (accept(e)) cachedArrayInstance.push(e)
        })
        return cachedArrayInstance
    }
})

angular.module('cluster').controller('MapCtrl', function ($scope, $http){
    if (googleMapsMarkers.length){
        initializeGoogleMaps()
    } else {
        $http.get('data/map.json').then(function (response){
            googleMapsMarkers = _.shuffle(response.data)
            var script = document.createElement('script')
            script.type = 'text/javascript'
            var params = [
                'v=3.exp',
                'sensor=false',
                'callback=initializeGoogleMaps'
            ]
            script.src = 'https://maps.googleapis.com/maps/api/js?'+params.join('&')
            document.body.appendChild(script)
        })
    }
})

angular.module('cluster').controller('ClusterCtrl',
  function ($scope, $http, $q, $timeout, $routeParams, clusterLoader, uploader){
    ClusterPlatform.clusterScope = $scope

    $scope.funcs = clusterLoader.getSolutionFunctionTree()
    $scope.relationTypes = [
        'participant',
        'provider',
        'catalyst',
        'potential',
        'alternative'
    ]
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
        loadCluster(clusterLoader.blankCluster())
    else {
        $http.get('data/clusters/cluster-'+clusterId+'.json').then(function (response){
            loadCluster(response.data)
        })
    }

    function loadCluster(c){
        c = clusterLoader.unpack(c)
        $scope.visibleSolutions = c.entities
        $scope.cluster = c

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

        ClusterPlatform.engine.fillScreen()
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

    $scope.toggleRelationFilters = function (){
        var rels = ['rel_participant',
                    'rel_provider',
                    'rel_catalyst',
                    'rel_potential',
                    'rel_alternative']
        var all = _.every(_.pick($scope.filter, rels))
        _.each(rels, function (r){ $scope.filter[r] = !all })
    }

    $scope.prepareDownloadLink = function (){
        document.getElementById('download-save-link2').href = clusterToDataUrl()
        $scope.readyToDownload = true
    }

    $scope.showUploadDialog = false
    $scope.uploadCluster = function (){
        uploader.send({
            subject: 'UPLOAD_CLUSTER',
            message: 'user: ' + localStorage.user + "\nmessage: " + $scope.uploadMessage,
            data: serializeCluster()
        }, function (){ $scope.showUploadDialog = false })
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
        ClusterPlatform.nodes.runFor(4000)
    }

    function getNewSiblingPositionFor(e){
        var centroid = {
            x: _.average(ClusterPlatform.nodes.entities, 'x'),
            y: _.average(ClusterPlatform.nodes.entities, 'y')
        }
        return add($scope.selectedEntity, mult(normalize(diff(e, centroid)), 200))
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
            var skipList = ['id', 'x', 'y', '$$hashKey']
            var e = _.omit($scope.addSolutionWizard.chosenSolution, skipList)
            e.type = $scope.addSolutionWizard.type
            e.status = $scope.addSolutionWizard.status
            _.extend(e, getNewSiblingPositionFor($scope.selectedEntity))
            var created = ClusterPlatform.nodes.addEntity(e)
            var rel_t = $scope.addSolutionWizard.rel_type
            var rel_desc = $scope.addSolutionWizard.rel_desc
            var nodes = ClusterPlatform.nodes
            nodes.addRelation($scope.selectedEntity, created, rel_t, rel_desc)
            nodes.runFor(4000)
            $scope.addSolutionWizard.cancel()
        }
    }

    $scope.commentSolution = function (){
        uploader.send({
            subject: 'COMMENT_SOLUTION',
            message: [
                'user: ' + localStorage.user,
                'solution: ' + $scope.selectedEntity.name,
                'comment: ' + $scope.comment ].join(" \n"),
            data: serializeCluster()
        }, function (){ $scope.showComment = false })
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

angular.module('cluster').controller('LoginCtrl', 
    function ($scope, $http, $location, uploader){
    $scope.username = ''
    $scope.password = ''

    $scope.login = function (){
        var usr = $scope.username.toLowerCase()
        $http.get('data/users/'+usr+'.json').then(function (response){
            if ($scope.password === response.data.password){
                localStorage['user'] = usr.toLowerCase()
                $location.path('/dashboard')
            }
            else
                alert('Incorrect username/password')
        }, function (){
            alert('Incorrect username/password')
        })
    }

    $scope.registerInterest = function (){
        uploader.send({
            subject: 'REGISTER_INTEREST',
            message: $scope.email + ", \n" + $scope.motivation,
            data: ''
        }, function (){ $scope.showRegister = false })
    }

    $scope.forgotLogin = function (){
        uploader.send({
            subject: 'FORGOT_LOGIN',
            message: $scope.email,
            data: ''
        }, function (){ $scope.showForgotLogin = false })
    }
})

angular.module('cluster').controller('DashboardCtrl', function ($scope, $http, uploader){
    $http.get('data/updates/'+localStorage.user+'.json').then(function (response){
        $scope.updates = response.data
    })
    $http.get('data/goals/'+localStorage.user+'.json').then(function (response){
        $scope.goals = response.data
    })
    $http.get('data/users/'+localStorage.user+'.json').then(function (response){
        $scope.profile = response.data
    })
    $scope.imageUrl = 'data/user-img/' + localStorage.user + '.jpg'
    $scope.setUpdateKind = function (u){
        $scope.updateKind = ($scope.updateKind === u) ? null : u
    }

    $scope.sendOpinion = function (opinion, message){
        uploader.send({
            subject: 'NEWS_OPINION',
            message: [
                'user: ' + localStorage.user,
                'opinion: ' + opinion,
                'message: ' + message ].join(" \n"),
            data: ''
        })
    }
})

angular.module('cluster').controller('GoalsCtrl', function ($scope, $http){
    $http.get('indicator/indicator.pde').then(function (response){
        new Processing('indicator', response.data)
    })
})

angular.module('cluster').controller('RegisterSolutionCtrl',
function ($scope, uploader){
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
    $scope.uploadSolution = function (){
        var jqData = $('#newsolutionform').serializeArray()
        var data = _.object(_.map(jqData, function (e){ return [e.name, e.value] }))
        var serialization = JSON.stringify(data, undefined, 2)
        uploader.send({
            subject: 'NEW_SOLUTION',
            message: 'user: ' + localStorage.user,
            data: serialization
        })
    }
})

angular.module('cluster').controller('SettingsCtrl', function ($scope, $http, uploader){
    $scope.qq_mobility = 0
    $scope.qq_nutrition = 0
    $scope.qq_building = 0

    $http.get('data/settings/' + localStorage.user + '.json').then(function (response){
        $scope.form = response.data
    })
    
    $scope.uploadSettings = function (){
        var serialization = JSON.stringify($scope.form, undefined, 2)
        uploader.send({
            subject: 'SAVE_SETTINGS',
            message: 'user: ' + localStorage.user,
            data: serialization
        })
    }
})