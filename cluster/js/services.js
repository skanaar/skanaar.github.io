
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
            return files.then(function (rs){
                return _.flatten(_.pluck(rs, 'entities'))
            })
        },
        blankCluster: function (){
            return JSON.parse(JSON.stringify(clusterTemplate))
        },
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