var IO = require('../')
  , assert = require('assert')

function expect(io, expected) {
    io.each(function (e) {
        assert.deepEqual(expected.shift(), e)
    })
}

module.exports = {

    'test map()': function() {
        var io = new IO()
               .arguments(0,1,2)
               .map(function (e) { return e * 2 })

        expect(io, [0,2,4])
    },

    'test lambda map()': function() {
        var io = new IO()
               .arguments(0,1,2)
               .map('*2')

        expect(io, [0,2,4])
    },

    'test map() on an inifinite stream': function() {
        var io = new IO()
               .integers()
               .map('*2')
               .limit(3)

        expect(io, [0,2,4])
    },

    'test filter()': function () {
        var io = new IO()
               .arguments(0,1,2)
               .filter(function (e) { return e % 2 === 0 })

        expect(io, [0,2])
    },

    'test lambda filter()': function () {
        var io = new IO()
               .arguments(0,1,2)
               .filter('%2===0')

        expect(io, [0,2])
    },

    'test filter() on an infinite stream': function () {
        var io = new IO()
               .integers()
               .filter(function (e) { return e % 2 === 0 })
               .limit(3)

        expect(io, [0,2,4])
    },

    'test reject()': function () {
        var io = new IO()
               .arguments(0,1,2)
               .reject(function (e) { return e % 2 === 0 })

        expect(io, [1])
    },

    'test lambda reject()': function () {
        var io = new IO()
               .arguments(0,1,2)
               .reject('%2===0')

        expect(io, [1])
    },

    'test reject() on an infinite stream': function () {
        var io = new IO()
               .integers()
               .reject(function (e) { return e % 2 === 0 })
               .limit(3)

        expect(io, [1,3,5])
    },

    'test reduce()': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduce(0, function (acc, e) {
                  return acc + e
               })

        expect(io, [45])
    },

    'test lambda reduce()': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduce(0, '+')

        expect(io, [45])
    },

    'test reduce() with no accumulator': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduce('+')

        expect(io, [45])
    },

    'test reduceRight()': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduceRight(0, function (acc, e) {
                  return acc + e
               })

        expect(io, [45])
    },

    'test lambda reduceRight()': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduceRight(0, '+')

        expect(io, [45])
    },

    'test reduceRight() with no accumulator': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .reduceRight('+')

        expect(io, [45])
    },

    'test reduce() directions': function () {
        var io = new IO()
               .arguments([1,2],[3,4])
               .reduce(function (a, b) {
                  return a.concat(b)
               })

        expect(io, [[1,2,3,4]])

        var ior = new IO()
               .arguments([1,2],[3,4])
               .reduceRight(function (a, b) {
                  return a.concat(b)
               })

        expect(ior, [[3,4,1,2]])
    },

    'test count()': function () {
        var io = new IO()
               .integers()
               .limit(10)
               .count()

        expect(io, [10])
    },

    'test compress()': function () {
        var io = new IO()
               .integers()
               .limit(5)
               .compress()

        expect(io, [[0,1,2,3,4]])
    },

    'test partition()': function () {
        var io = new IO()
               .integers()
               .limit(6)
               .partition(2)

        expect(io, [[0,1],[2,3],[4,5]])
    },

    'test partition() before limit()': function () {
        var io = new IO()
               .integers()
               .partition(2)
               .limit(3)

        expect(io, [[0,1],[2,3],[4,5]])
    },

    'test flatten()': function () {
        var io = new IO()
               .arguments([0,1],[2,3],[4,5])
               .flatten()

        expect(io, [0,1,2,3,4,5])
    },

    'test pluck()': function () {
        var io = new IO()
               .arguments({foo:'foo'},{foo:'bar'})
               .pluck('foo')

        expect(io, ['foo','bar'])
    },

    'test unpluck()': function () {
        var io = new IO()
               .arguments('foo','bar')
               .unpluck('foo')

        expect(io, [{foo:'foo'},{foo:'bar'}])
    },

    'test pluck() many': function () {
        var io = new IO()
               .arguments({foo:'foo',bar:'a'},{foo:'bar',bar:'b'})
               .pluck('foo', 'bar')

        expect(io, [['foo','a'],['bar','b']])
    },

    'test unpluck() many': function () {
        var io = new IO()
               .arguments(['foo','a'],['bar','b'])
               .unpluck('foo', 'bar')

        expect(io, [{foo:'foo',bar:'a'},{foo:'bar',bar:'b'}])
    },

    'test scan()': function () {
        var io = new IO()
               .range(1, 3)
               .scan(0, function (acc, e) {
                  return acc + e
               })

        expect(io, [0,1,3,6])
    },

    'test lambda scan()': function () {
        var io = new IO()
               .range(1, 3)
               .scan(0, '+')

        expect(io, [0,1,3,6])
    },

    'test scan() with no accumulator': function () {
        var io = new IO()
               .range(1, 3)
               .scan('+')

        expect(io, [1,3,6])
    },

    'test scanRight()': function () {
        var io = new IO()
               .range(1, 3)
               .scanRight(0, function (acc, e) {
                  return acc + e
               })

        expect(io, [0,3,5,6])
    },

    'test lambda scanRight()': function () {
        var io = new IO()
               .range(1, 3)
               .scanRight(0, '+')

        expect(io, [0,3,5,6])
    },

    'test scanRight() with no accumulator': function () {
        var io = new IO()
               .range(1, 3)
               .scanRight('+')

        expect(io, [3,5,6])
    },

}

