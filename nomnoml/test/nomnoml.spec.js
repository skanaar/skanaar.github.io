describe('nomnoml', function() {

    describe('parser', function() {
        it('sanity test of jison parser', function(){
            var source = '[apa]->[banan]'
            var ast = parser.parse(source)
            expect(ast.type).toEqual('->')
            expect(ast.start).toEqual({parts:['apa']})
            expect(ast.end).toEqual({parts:['banan']})
        })
    })

})
