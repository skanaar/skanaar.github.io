function fragmentRouting(defaultFragment, handlers, finallyHandler){
    function fragmentChange(fragment, fragmentCrumbs){
        $('.tab_page').hide()
        $('.tab_page_' + fragment).show()
        $('.tab_link').toggleClass('active', false)
        $('.tab_link_' + fragment).toggleClass('active', true)
        if (handlers && handlers[fragment])
            handlers[fragment].apply(null, fragmentCrumbs)
        if (finallyHandler)
            finallyHandler.apply(null, fragmentCrumbs)
    }
    function handleUrlChange(e){
        var tokens = e.newURL.split('#')
        if (tokens.length === 1)
            fragmentChange(defaultFragment)
        else {
            var crumbs = tokens[1].split('/')
            fragmentChange(crumbs[0], crumbs)
        }
    }
    addEventListener('hashchange', handleUrlChange)
    handleUrlChange({ newURL: location.hash })
}

function bindData(targetId, data){
    var target = $('#' + targetId)
    for(var key in data)
        if (data.hasOwnProperty(key))
            target.find('.bind-' + key).text(data[key])
}

angular.module('cluster', [])

angular.module('cluster').controller('SearchCtrl', function ($scope){
    $scope.solutions = ClusterPlatform.entities
    $scope.filters = {
        mobility: false,
        nutrition: false,
        building: false
    }

    var orderedSolutions = []
    $scope.orderedSolutions = function (){
        orderedSolutions.length = 0
        var s = _.sortBy($scope.solutions, function (s){
            return -(!!$scope.filters.mobility) * s.properties.mobility
                   -(!!$scope.filters.nutrition) * s.properties.nutrition
                   -(!!$scope.filters.building) * s.properties.building
        })
        for (var i=0; i<s.length; i++)
            orderedSolutions.push(s[i])
        return orderedSolutions
    }
})

angular.module('cluster').controller('ClusterCtrl', function ($scope){

    $scope.solutions = ClusterPlatform.entities
    $scope.filter = {
        existing: true,
        supporting: true,
        potential: true,
        core: true,
        accelerator: true,
        expander: true
    }

    $scope.$watch('filter', function (){
        ClusterPlatform.engine.filter($scope.filter)
    }, true)

    $scope.togglePane = function (key){
        $scope.activePane = ($scope.activePane === key) ? "none" : key
    }

    var orderedSolutions = []
    $scope.orderedSolutions = function (){
        orderedSolutions.length = 0
        var s = _.sortBy($scope.solutions, function (s){
            return -(!!$scope.filters.mobility) * s.properties.mobility
                   -(!!$scope.filters.nutrition) * s.properties.nutrition
                   -(!!$scope.filters.building) * s.properties.building
        })
        for (var i=0; i<s.length; i++)
            orderedSolutions.push(s[i])
        return orderedSolutions
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