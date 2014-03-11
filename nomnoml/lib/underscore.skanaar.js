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