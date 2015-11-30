var IO = require('../')
  , assert = require('assert')
  , fs = require('fs')

function expect(io, expected) {
    io.each(function (e) {
        assert.deepEqual(expected.shift(), e)
    })
}

module.exports = {

    'test arguments()': function() {
        var io = new IO()
               .arguments(1,2,3)

        expect(io, [1,2,3])
    },

    'test array()': function() {
        var io = new IO()
               .array([1,2,3])

        expect(io, [1,2,3])
    },

    'test limit() and integers()': function() {
        var io = new IO()
               .integers()
               .limit(5)

        expect(io, [0,1,2,3,4])

        var io = new IO()
               .integers(3)
               .limit(5)

        expect(io, [3,4,5,6,7])

        var io = new IO()
               .integers(1, 2)
               .limit(3)

        expect(io, [1,3,5])
    },

    'test skip()': function () {
        var io = new IO()
               .integers()
               .skip(2)
               .limit(5)

        expect(io, [2,3,4,5,6])
    },

    'test range()': function () {
        var io = new IO()
               .range(1, 5)

        expect(io, [1,2,3,4,5])
    },

    'test range() step': function () {
        var io = new IO()
               .range(1, 10, 2)

        expect(io, [1,3,5,7,9])
    },

    'test repeat()': function () {
        var io = new IO()
               .repeat(3)
               .limit(5)

        expect(io, [3,3,3,3,3])
    },

    'test random()': function () {
        var io = new IO()
               .random()
               .limit(10)

        io.each(function (num) {
            assert.ok(num >= 0 && num <= 100)
        })
    },

    'test first()': function () {
        var io = new IO()
               .integers(1)
               .first()

        expect(io, [1])
    },

    'test last()': function () {
        var io = new IO()
               .range(1, 10)
               .last()

        expect(io, [10])
    },

    'test head()': function () {
        var io = new IO()
               .range(1, 10)
               .head(3)

        expect(io, [1,2,3])
    },

    'test tail()': function () {
        var io = new IO()
               .range(1, 10)
               .tail(3)

        expect(io, [8,9,10])
    },

    'test append()': function () {
        var a = new IO().range(1, 3)
          , b = new IO().range(7, 9)
          , c = new IO().range(10, 12)

        a.append(b, c);

        expect(a, [1,2,3,7,8,9,10,11,12])
    },

    'test prepend()': function () {
        var a = new IO().range(1, 3)
          , b = new IO().range(7, 9)
          , c = new IO().range(10, 12)

        a.prepend(b, c);

        expect(a, [7,8,9,10,11,12,1,2,3])
    },

    'test read() from file': function () {
        var io = new IO().read(__dirname + '/files/input.csv')

        expect(io, ['1,2,3', 'a,b,c'])
    },

    'test read() from file stream': function () {
        var file = fs.createReadStream(__dirname + '/files/input.csv')
          , io = new IO().read(file)

        expect(io, ['1,2,3', 'a,b,c'])
    },

    'test read() from file with sep': function () {
        var io = new IO().read(__dirname + '/files/input.csv', ',')

        expect(io, ['1','2','3\na','b','c\n'])
    },

    'test write()': function () {
        var io = new IO().integers().limit(3).write(__dirname + '/files/output.csv')

        setTimeout(function () {
            var result = fs.readFileSync(__dirname + '/files/output.csv').toString()
            assert.equal(result, '0\n1\n2\n')
        }, 500)
    },

    'test write() with sep': function () {
        var io = new IO().integers().limit(3).write(__dirname + '/files/outputsep.csv', ',')

        setTimeout(function () {
            var result = fs.readFileSync(__dirname + '/files/outputsep.csv').toString()
            assert.equal(result, '0,1,2,')
        }, 500)
    },

    'test throttle()': function () {
        var io = new IO().integers().limit(9).throttle(3, 0.4)

        var received = []
        io.each(function (e) {
            received.push(e)
        })

        setTimeout(function () {
            assert.deepEqual(received, [0,1,2])
        }, 300)

        setTimeout(function () {
            assert.deepEqual(received, [0,1,2,3,4,5])
        }, 600)

        setTimeout(function () {
            assert.deepEqual(received, [0,1,2,3,4,5,6,7,8])
        }, 900)
    }

}

