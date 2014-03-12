describe('nomnoml', function() {
    /* import */ var clas = nomnoml.Classifier, comp = nomnoml.Compartment

    describe('jison parser', function() {
        it('should handle single relation', function(){
            var source = '[apa]->[banan]'
            var ast = parser.parse(source)
            expect(ast.type).toEqual('->')
            expect(ast.start).toEqual({parts:['apa']})
            expect(ast.end).toEqual({parts:['banan']})
        })

        it('should handle single class', function(){
            var source = '[apa]'
            var ast = parser.parse(source)
            expect(ast).toEqual({parts:['apa']})
        })

        it('should handle single class with compartments', function(){
            var source = '[apa|+field: int;#x:int|apply]'
            var ast = parser.parse(source)
            expect(ast).toEqual({parts:['apa','|','+field: int','#x:int','|','apply']})
        })
    })

    describe('astBuilder', function() {
        xit('should transform single relation to virtual classifier with single compartment', function(){
            var jisonOutput = {
                type: '->', 
                start: { parts: ['apa'] }, 
                end: { parts: ['banan'] }
            }
            var ast = astBuilder.apply(jisonOutput)
            expect(ast).toEqual(clas('virtual', '[root]', [
                comp([],[
                        clas('class', 'apa', [comp(['apa'],[],[])]),
                        clas('class', 'banan', [comp(['banan'],[],[])])
                    ],[{
                        id: 0,
                        type: 'association',
                        start: 'apa',
                        end: 'banan'
                    }]
                )
            ]))
        })

        it('should handle single class', function(){
            var ast = astBuilder.apply({parts:['apa']})
            expect(ast).toEqual(clas('class', 'apa', [ comp(['apa'],[],[]) ]))
        })

        it('should choose longest definition of classes defined twice', function(){
            var ast = astBuilder.apply({"parts":[{"parts":["apa"]},{"parts":["apa","|","fleas"]}]})
            expect(ast).toEqual(clas('class', 'apa', [ comp(['apa'],[],[]), comp(['fleas'],[],[]) ]))
        })

        it('should handle [apa|+field: int;#x:int|apply]', function(){
            var ast = astBuilder.apply({parts:['apa','|','+field: int','#x:int','|','apply']})
            expect(ast).toEqual(clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp(['+field: int', '#x:int'],[],[]),
                comp(['apply'],[],[])
            ]))
        })

        it('should handle nested classes [apa|+field: int;#x:int|[flea]]', function(){
            var ast = astBuilder.apply({parts:['apa','|','+field: int','#x:int','|',{parts:['flea']}]})
            expect(ast).toEqual(clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp(['+field: int', '#x:int'],[],[]),
                comp([],[clas('class', 'flea', [comp(['flea'],[],[])])],[])
            ]))
        })

        it('should handle multiple nested classes [apa|[flea];[dandruff]]', function(){
            var ast = astBuilder.apply({parts:['apa','|',{parts:['flea']},{parts:['dandruff']}]})
            expect(ast).toEqual(clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[
                    clas('class', 'flea', [comp(['flea'],[],[])]),
                    clas('class', 'dandruff', [comp(['dandruff'],[],[])])
                ],[])
            ]))
        })
    })

    describe('layout engine', function() {
        var textWidth = 100
        var config = { spacing: 5, margin: 2 }
        var measurer = {
            textWidth: function (s){ return textWidth },
            textHeight: function (s){ return 10 }
        }

        it('should handle [apa]', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+2)
            expect(layouted.x).toEqual(52)
            expect(layouted.y).toEqual(7)
        })

        it('should handle [apa; banana owner]', function(){
            var root = clas('class', 'apa', [
                comp(['apa','banana owner'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+10+2)
        })

        it('should handle [apa; banana owner| fleaCount]', function(){
            var root = clas('class', 'apa', [
                comp(['apa','banana owner'],[],[]),
                comp(['fleaCount'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+10+2+2+10+2)
        })

        it('should handle [apa|]', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+2+2)
        })

        it('should handle [apa|[flea]]', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[
                    clas('class', 'flea', [
                        comp(['flea'],[],[])
                    ])
                ],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+2+100+2+2)
            expect(layouted.height).toEqual(2+10+2+2+2+10+2+2)
        })

        it('should handle [apa|[flea];[dandruff]] horizontally stacked inner classes', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[
                    clas('class', 'flea', [comp(['flea'],[],[])]),
                    clas('class', 'dandruff', [comp(['dandruff'],[],[])])
                ],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+2+100+2+5+2+100+2+2)
            expect(layouted.height).toEqual(2+10+2+2+2+10+2+2)
        })

        it('should handle [apa|[flea]->[dandruff]] vertically stacked inner classes', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[
                        clas('class', 'flea', [comp(['flea'],[],[])]),
                        clas('class', 'dandruff', [comp(['dandruff'],[],[])])
                    ],[{
                        id: 0,
                        type: 'association',
                        start: 'flea',
                        end: 'dandruff'
                    }]
                )
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+2+100+2+2)
            expect(layouted.height).toEqual(2+10+2+2+2+10+2+5+2+10+2+2)
            var flea = layouted.compartments[1].nodes[0]
            var dandruff = layouted.compartments[1].nodes[1]
            expect(flea.x).toEqual(52)
            expect(flea.y).toEqual(7)
            expect(dandruff.x).toEqual(52)
            expect(dandruff.y).toEqual(10+2+2+5+7)
        })

        it('should handle [apa|[flea]->[dandruff]] relation placement', function(){
            var root = clas('class', 'apa', [
                comp(['apa'],[],[]),
                comp([],[
                        clas('class', 'flea', [comp(['flea'],[],[])]),
                        clas('class', 'dandruff', [comp(['dandruff'],[],[])])
                    ],[{
                        id: 0,
                        type: 'association',
                        start: 'flea',
                        end: 'dandruff'
                    }]
                )
            ])
            var layouted = layouter.layout(measurer, config, root)
            var rel = layouted.compartments[1].relations[0]
            expect(rel.path).toEqual([{x:52,y:7}, {x:52,y:16.5}, {x:52,y:26}])
        })
        
    })

})
