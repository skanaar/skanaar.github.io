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
        var config = { spacing: 2 }
        var measurer = {
            textWidth: function (s){ return textWidth },
            textHeight: function (s){ return 10 }
        }

        it('should handle single relation', function(){
            var root = {
                type: 'class',
                name: 'apa',
                compartments: [{
                    lines: 'apa',
                    nodes: [],
                    relations: []
                }]
            }
            var layouted = layouter.layout(measurer, config, root)
            expect(layouted.width).toEqual(100+2+2)
            expect(layouted.height).toEqual(10+2+2)
            expect(layouted.x).toEqual(0)
            expect(layouted.y).toEqual(0)
        })
        
    })

})
