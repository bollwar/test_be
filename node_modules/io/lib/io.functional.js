/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')

/**
 * Apply `fn` to each element in the stream.
 *
 * Example:
 *     range(1, 3).map('*2').each(console.log)
 *
 * Output:
 *     2
 *     4
 *     6
 *
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.map = function (fn) {
    fn = this.lambda(fn)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                return emit(fn(elem))
            }, end)
        }
    })
}

/**
 * Asynchronous version of `map()`.
 *
 * Example:
 *     range(1, 3).map(function (elem, emit) {
 *         emit(elem * 2)
 *     }).each(console.log)
 *
 * Output:
 *     2
 *     4
 *     6
 *
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.mapAsync = function (fn) {
    return this.extend(function (stream) {
        return function (emit, end) {
            var ended = false, pending = 0, halt
            stream(function (elem) {
                if (halt) return false
                pending++
                fn(elem, function (elem) {
                    halt = emit(elem) === false
                    if (ended && !--pending) {
                        end && end()
                    }
                })
            }, function () {
                ended = true
                if (!pending) {
                    end && end()
                }
            })
        }
    })
}

/**
 * Filter out elements in the stream if `fn(elem)` is false.
 *
 * Example:
 *     range(1, 5).filter('>=4').each(console.log)
 *
 * Output:
 *     4
 *     5
 *
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.filter = io.prototype.select = function (fn) {
    fn = this.lambda(fn)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (fn(elem)) {
                    if (false === emit(elem)) {
                        return false
                    }
                }
            }, end)
        }
    })
}

/**
 * Filter out elements in the stream if `fn(elem)` is true.
 *
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.reject = function (fn) {
    fn = this.lambda(fn)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (!fn(elem)) {
                    if (false === emit(elem)) {
                        return false
                    }
                }
            }, end)
        }
    })
}

/**
 * Reduce elements in the stream.
 *
 * Example:
 *     range(1, 3).reduce('+').each(console.log)
 *
 * Output:
 *     6
 *
 * @param {Mixed} accumulator (optional)
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.reduce = io.prototype.fold = function (accumulator, fn) {
    if (arguments.length === 1) {
        fn = accumulator
        accumulator = undefined
    }
    fn = this.lambda(fn)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (accumulator === undefined) {
                    accumulator = elem
                } else {
                    accumulator = fn(accumulator, elem)
                }
            }, function () {
                emit(accumulator)
                end && end()
            })
        }
    })
}

/**
 * Reduce elements in the stream, right to left.
 *
 * @param {Mixed} accumulator (optional)
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.reduceRight = io.prototype.foldRight = function (accumulator, fn) {
    if (arguments.length === 1) {
        fn = accumulator
        accumulator = undefined
    }
    fn = this.lambda(fn)

    return this.compress().extend(function (stream) {
        return function (emit, end) {
            stream(function (arr) {
                if (accumulator !== undefined) {
                    arr = arr.reduceRight(fn, accumulator)
                } else {
                    arr = arr.reduceRight(fn)
                }
                emit(arr)
            }, function () {
                end && end()
            })
        }
    })
}

/**
 * Compress elements in the stream into a single array.
 *
 * Example:
 *     range(1, 3).compress().each(console.log)
 *
 * Output:
 *     [1,2,3]
 *
 * @return this
 * @api public
 */

io.prototype.compress = function () {
    return this.extend(function (stream) {
        return function (emit, end) {
            var arr = []
            stream(function (elem) {
                arr.push(elem)
            }, function (err) {
                emit(arr)
                end && end()
            })
        }
    })
}

/**
 * Partition elements into arrays of size `num`.
 *
 * Example:
 *     range(1, 8).partition(3).each(console.log)
 *
 * Output:
 *     [1,2,3]
 *     [4,5,6]
 *     [7,8]
 *
 * @return this
 * @api public
 */

io.prototype.partition = function (num) {
    this.hasDefault(arguments, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            var elems = [], len = 0, ended = false
            stream(function (elem) {
                elems[len++] = elem
                if (len === num) {
                    if (false === emit(elems)) {
                        ended = true
                        return false
                    }
                    elems = []
                    len = 0
                }
            }, function () {
                if (len && !ended) {
                    emit(elems)
                }
                end && end()
            })
        }
    })
}

/**
 * If an element is an array, emit each element from within it separately.
 *
 * Example:
 *     arguments([1,2],[3,4]).flatten().each(console.log)
 *
 * Output:
 *     1
 *     2
 *     3
 *     4
 *
 * @return this
 * @api public
 */
io.prototype.flatten = function () {
    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (!Array.isArray(elem)) {
                    return emit(elem)
                }
                for (var i = 0, l = elem.length; i < l; i++) {
                    if (false === emit(elem[i])) {
                        return false
                    }
                }
            }, end)
        }
    })
}

/**
 * Pluck a key from each element.
 *
 * Example:
 *     arguments({foo:'bar'}).pluck('foo').each(console.log)
 *
 * Output:
 *     bar
 *
 * @param {String} key
 * @return this
 * @api public
 */

io.prototype.pluck = function (key) {
    if (arguments.length === 1) {
        return this.map(function (elem) {
            return elem[key] || null
        })
    } else {
        var keys = this.collect(arguments), l = keys.length
        return this.map(function (elem) {
            var arr = []
            for (i = 0; i < l; i++) {
                arr[i] = elem[keys[i]] || null
            }
            return arr
        })
    }
}

/**
 * Unpluck each element into a new object.
 *
 * Example:
 *     arguments('bar').unpluck('foo').each(console.log)
 *
 * Output:
 *     { foo: 'bar' }
 *
 * @param {String} key
 * @return this
 * @api public
 */

io.prototype.unpluck = function (key) {
    if (arguments.length === 1) {
        return this.map(function (elem) {
            var obj = {}
            obj[key] = elem
            return obj
        })
    } else {
        var keys = this.collect(arguments), l = keys.length
        return this.map(function (elem) {
            var obj = {}
            for (i = 0; i < l; i++) {
                obj[keys[i]] = elem[i] || null
            }
            return obj
        })
    }
}

/**
 * Count the number of elements in the stream.
 *
 * Example:
 *     arguments(1,2,3,4).count().each(console.log)
 *
 * Output:
 *     4
 *
 * @return this
 * @api public
 */

io.prototype.count = function () {
    return this.extend(function (stream) {
        return function (emit, end) {
            var count = 0
            stream(function (elem) {
                count++
            }, function (err) {
                emit(count)
                end && end()
            })
        }
    })
}

/**
 * Reduce elements in the stream and emit each intermediate.
 *
 * Example:
 *     range(1, 3).scan('+').each(console.log)
 *
 * Output:
 *     1
 *     3
 *     6
 *
 * @param {Mixed} accumulator (optional)
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.scan = function (accumulator, fn) {
    var emit_first = true
    if (arguments.length === 1) {
        fn = accumulator
        accumulator = undefined
        emit_first = false
    }
    fn = this.lambda(fn)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (accumulator === undefined) {
                    accumulator = elem
                    emit(accumulator)
                } else {
                    if (emit_first) {
                        emit(accumulator)
                        emit_first = false
                    }
                    accumulator = fn(accumulator, elem)
                    emit(accumulator)
                }
            }, end)
        }
    })
}

/**
 * Reduce elements in the stream (right to left) and emit each intermediate.
 *
 * Example:
 *     range(1, 3).scanRight('+').each(console.log)
 *
 * Output:
 *     3
 *     5
 *     6
 *
 * @param {Mixed} accumulator (optional)
 * @param {Function} fn
 * @return this
 * @api public
 */

io.prototype.scanRight = function (accumulator, fn) {
    var emit_first = true
    if (arguments.length === 1) {
        fn = accumulator
        accumulator = undefined
        emit_first = false
    }
    fn = this.lambda(fn)

    return this.compress().extend(function (stream) {
        return function (emit, end) {
            stream(function (arr) {
                var elem, len = arr.length
                while (len--) {
                    elem = arr[len]
                    if (accumulator === undefined) {
                        accumulator = elem
                        emit(accumulator)
                    } else {
                        if (emit_first) {
                            emit(accumulator)
                            emit_first = false
                        }
                        accumulator = fn(accumulator, elem)
                        emit(accumulator)
                    }
                }
            }, end)
        }
    })
}

