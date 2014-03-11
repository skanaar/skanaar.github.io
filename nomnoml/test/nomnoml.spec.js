describe('nomnoml', function() {

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

    describe('layout engine', function() {
        var textWidth = 100
        var config = { spacing: 5, margin: 2 }
        var measurer = {
            textWidth: function (s){ return textWidth },
            textHeight: function (s){ return 10 }
        }

        it('should handle [apa]', function(){
            var root = nomnoml.Classifier('class', 'apa', [
                nomnoml.Compartment(['apa'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+2)
            expect(layouted.x).toEqual(52)
            expect(layouted.y).toEqual(7)
        })

        it('should handle [apa; banana owner]', function(){
            var root = nomnoml.Classifier('class', 'apa', [
                nomnoml.Compartment(['apa','banana owner'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+10+2)
        })

        it('should handle [apa; banana owner| fleaCount]', function(){
            var root = nomnoml.Classifier('class', 'apa', [
                nomnoml.Compartment(['apa','banana owner'],[],[]),
                nomnoml.Compartment(['fleaCount'],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+10+2+2+10+2)
        })

        it('should handle [apa|]', function(){
            var root = nomnoml.Classifier('class', 'apa', [
                nomnoml.Compartment(['apa'],[],[]),
                nomnoml.Compartment([],[],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+100+2)
            expect(layouted.height).toEqual(2+10+2+2)
        })

        it('should handle [apa|[flea]]', function(){
            var root = nomnoml.Classifier('class', 'apa', [
                nomnoml.Compartment(['apa'],[],[]),
                nomnoml.Compartment([],[
                    nomnoml.Classifier('class', 'flea', [
                        nomnoml.Compartment(['flea'],[],[])
                    ])
                ],[])
            ])
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(2+2+100+2+2)
            expect(layouted.height).toEqual(2+10+2+2+2+10+2+2)
        })
        
    })

})
