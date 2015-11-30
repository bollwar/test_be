var IO = require('../')
  , assert = require('assert')

function expect(io, expected) {
    io.each(function (e) {
        assert.deepEqual(expected.shift(), e)
    })
}

module.exports = {

    'test join()': function() {
        var io = new IO()
               .arguments([1,2,3],[4,5,6])
               .join(',')

        expect(io, ['1,2,3', '4,5,6'])
    },

    'test join() delimited': function() {
        var io = new IO()
               .arguments(['1,2','3",4'])
               .join(',')

        expect(io, ['1,2,3",4'])

        var io = new IO()
               .arguments(['1,2','3",4'])
               .join(',', '"', '"')

        expect(io, ['"1,2","3"",4"'])
    },

    'test split()': function() {
        var io = new IO()
               .arguments('1,2,3', '4,5,6')
               .split(',')

        expect(io, [[1,2,3],[4,5,6]])
    },

    'test split() delimited': function() {
        var io = new IO()
               .arguments('"1,2","3"",4"')
               .split(',', '"', '"')

        expect(io, [['1,2','3",4']])
    },

}

