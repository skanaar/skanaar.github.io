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

})
