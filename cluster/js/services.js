
function serializeCluster(){
    var es = ClusterPlatform.nodes.entities
    var rs = ClusterPlatform.nodes.relations
    var c = ClusterPlatform.cluster
    var data = {
        name: c.name,
        potential: c.potential,
        centralEntity: c.centralEntity,
        mobility: c.mobility,
        nutrition: c.nutrition,
        building: c.building,
        entities: _.map(es, function (e){
            var o = _.omit(e, ['$$hashKey', 'fx', 'fy'])
            o.x = Math.round(o.x)
            o.y = Math.round(o.y)
            o.url = o.url || 'http://www.' + o.company.split(' ').join('') + '.com'
            return o
        }),
        relations:  _.map(rs, function (r){
            return {
                start: r.start.id,
                end: r.end.id,
                description: r.description,
                date: r.date,
                author: r.author,
                connectionsByAuthor: r.connectionsByAuthor,
                verified: r.verified,
                type: r.type
            }
        })
    }
    return JSON.stringify(data, undefined, 2)
}

angular.module('cluster').factory('clusterLoader', function ($http, $q){
    var files = $http.get('data/clustersearch.json').then(function (response){
        return $q.all(_.times(response.data.clusterCount+1, function (i){
            return $http.get('data/clusters/cluster-'+i+'.json')
        }))
    }).then(function (rs){
        return _.map(rs, function (r){ return unpackCluster(r.data) })
    })

    var functions = {
        "building_physical_Light": "on",
        "building_physical_Right": "on",
        "building_physical_Healthy": "on",
        "building_physical_Fresh": "on",
        "building_physical_Cooked": "on",
        "building_physical_Clean": "on",
        "building_physical_Energy": "on",
        "building_physical_Shelter": "on",
        "building_physical_Storage": "on",
        "building_physical_Other": "",
        "building_social_Working": "on",
        "building_social_Coworking": "on",
        "building_social_Work": "on",
        "building_social_Private": "on",
        "building_social_Network": "on",
        "building_social_Exhibitions": "on",
        "building_social_Playing": "on",
        "building_social_Other": "",
        "building_economical_Save": "on",
        "building_economical_Other": "",
        "building_ethical_Equal": "on",
        "building_ethical_Environmental": "on",
        "building_ethical_Human": "on",
        "building_ethical_Sustainable": "on",
        "building_ethical_Other": "",
        "building_chain_Other": "",
        "mobility_physical_Transportation": "on",
        "mobility_physical_Other": "",
        "mobility_social_Meeting": "on",
        "mobility_social_Coworking": "on",
        "mobility_social_Representativeness": "on",
        "mobility_social_Security": "on",
        "mobility_social_Other": "",
        "mobility_economy_SaveMoney": "on",
        "mobility_economy_SaveTime": "on",
        "mobility_economy_Other": "",
        "mobility_ethical_Equal": "on",
        "mobility_ethical_Environmental": "on",
        "mobility_ethical_Human": "on",
        "mobility_ethical_Sustainable": "on",
        "mobility_ethical_Other": "",
        "mobility_chain_Other": "",
        "nutrition_needs_Protein": "on",
        "nutrition_needs_Carbohydrates": "on",
        "nutrition_needs_Fat": "on",
        "nutrition_needs_Water": "on",
        "nutrition_needs_Vitamins": "on",
        "nutrition_needs_Minerals": "on",
        "nutrition_needs_Other": "",
        "nutrition_optimize_Balance": "on",
        "nutrition_optimize_Total": "on",
        "nutrition_optimize_Other": "",
        "nutrition_social_Meet": "on",
        "nutrition_social_Active": "on",
        "nutrition_social_Culture": "on",
        "nutrition_social_Optimize": "on",
        "nutrition_social_Other": "",
        "nutrition_economy_Save": "on",
        "nutrition_economy_Other": "",
        "nutrition_ethical_Equal": "on",
        "nutrition_ethical_Environmental": "on",
        "nutrition_ethical_Human": "on",
        "nutrition_ethical_Animal": "on",
        "nutrition_ethical_Sustainable": "on",
        "nutrition_ethical_Other": "",
        "nutrition_chain_Other": ""
    }

    function randomFunctions(){
        var f = _.clone(functions)
        for(var key in functions){
            f[key] = _.random(100) < 10
        }
        return f
    }

    function buildFunctionTree(){
        var functionTree = {}
        for(var key in functions){
            if (functions.hasOwnProperty(key)){
                var tokens = key.split('_')
                var a = tokens[0], b = tokens[1], c = tokens[2]
                functionTree[a] = functionTree[a] || {}
                functionTree[a][b] = functionTree[a][b] || {}
                functionTree[a][b][c] = functionTree[a][b][c] || {}
                functionTree[a][b][c] = false
            }
        }
        return functionTree
    }

    function unpackCluster(c){
        return {
            name: c.name || 'unnamed cluster',
            potential: c.potential,
            centralEntity: c.centralEntity || 0,
            mobility: c.mobility || _.random(100),
            nutrition: c.nutrition || _.random(100),
            building: c.building || _.random(100),
            relations: _.map(c.relations, function (r){
                return {
                    start: { id: r.start },
                    end: { id: r.end },
                    type: r.type,
                    description: r.description || 'relation description',
                    author: r.author || 'unknown author',
                    connectionsByAuthor: r.connectionsByAuthor || '1',
                    verified: !!r.verified,
                    date: r.date
                }
            }),
            entities: _.map(c.entities, function (e){
                return  {
                    id: +e.id,
                    name: e.name,
                    company: e.company,
                    url: e.url,
                    email: e.email || 'unknown email',
                    description: e.description || _.randomName(),
                    functions: e.functions || randomFunctions(),
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

    return {
        getClusters: function (){
            return files
        },
        getSolutions: function (){
            function byName(s){ return s.name }
            return files.then(function (rs){
                return _.uniq(_.flatten(_.pluck(rs, 'entities')), byName)
            })
        },
        blankCluster: function (){
            return JSON.parse(JSON.stringify(clusterTemplate))
        },
        solutionFunctions: functions,
        getSolutionFunctionTree: buildFunctionTree,
        unpack: unpackCluster
    }
})

angular.module('cluster').factory('uploader', function ($http){
    return {
        send: function (params, whenDone){
            var formMime = 'application/x-www-form-urlencoded; charset=UTF-8'
            var config = { headers: {'Content-Type':formMime} }
            var payload = $.param({
                key: 'ofd38sd',
                subject: params.subject,
                message: params.message,
                data: params.data
            })
            function onResponse(response){
                if (response.data === 'success')
                    alert('Data successfully uploaded')
                else
                    alert('Failed to upload data')
                if (whenDone) whenDone()
            }
            function failure(response){
                alert('Failed to upload data')
                if (whenDone) whenDone()
            }
            $http.post('upload.php', payload, config)
                .then(onResponse, failure)
        }
    }
})