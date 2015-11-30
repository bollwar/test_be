/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')
  , fs = require('fs')

/**
 * Write each element to a stream or file.
 *
 * @param {WritableStream|String} stream - or a filename
 * @param {String} separator (optional) -.hasDefaults to \n
 * @param {String} encoding (optional) -.hasDefaults to utf8
 * @return this
 * @api public
 */

io.prototype.write = function (stream, separator, encoding) {
    this.hasDefault(arguments, null, '\n', 'utf8')

    if (!stream) {
        stream = process.stdout
    } else if (!(stream instanceof process.EventEmitter)) {
        stream = fs.createWriteStream(stream, { encoding: encoding })
    }

    this.stream(function (elem) {
        stream.write(elem + separator)
    })

    return this
}

/**
 * Read elements from a stream or file.
 *
 * @param {ReadableStream|String} stream - or filename
 * @param {String} separator (optional) -.hasDefaults to \n
 * @param {String} encoding (optional) -.hasDefaults to utf8
 * @return this
 * @api public
 */

io.prototype.read = function (stream, separator, encoding) {
    this.hasDefault(arguments, null, '\n', 'utf8')

    if (!stream) {
        stream = process.stdin
    } else if (!(stream instanceof process.EventEmitter)) {
        stream = fs.createReadStream(stream)
    }
    stream.setEncoding(encoding)

    return this.extend(function () {
        return function (emit, end) {
            var elems = [], data = '', i, l
            stream.resume()
            stream.on('data', function (chunk) {
                data += chunk
                if (separator) {
                    elems = data.split(separator)
                    data = elems.pop()
                    for (i = 0, l = elems.length; i < l; i++) {
                        if (false === emit(elems[i])) {
                            stream.pause()
                            return false
                        }
                    }
                }
            }).on('end', function () {
                if (data) {
                    emit(data)
                }
                end && end()
            }).on('error', function (err) {
                end && end(err)
            })
        }
    })
}

/**
 * Throttle the flow of stream elements.
 *
 * Examples:
 *     throttle(1, 1);   //Let one through each second
 *     throttle(10, 60); //Let ten through a minute
 *
 * @param {Integer} allow_through - the number of elements to let through
 * @param {Integer} timeframe (optional) -.hasDefault is 1 second
 * @return this
 * @api public
 */

io.prototype.throttle = function (allow_through, timeframe) {
    this.hasDefault(arguments, 10, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            var buffer = []
              , buffer_len = 0
              , flowing = true
              , remaining = allow_through
              , ended = false
              , interval

            function endWith(err) {
                clearInterval(interval)
                end && end(err)
            }

            function tick() {
                while (flowing && buffer_len) {
                    emit(buffer.shift())
                    buffer_len--
                    if (!--remaining) {
                        flowing = false
                        if (ended && buffer_len === 00) {
                            endWith()
                        }
                    }
                }
            }

            interval = setInterval(function () {
                flowing = true
                remaining = allow_through
                tick()
            }, 1000 * timeframe)

            stream(function (elem) {
                buffer.push(elem)
                buffer_len++
                tick()
            }, function (err) {
                if (err) {
                    endWith(err)
                }
                ended = true
            })
        }
    })
}

/**
 * Read up to `num` elements from the stream.
 *
 * @param {Integer} num
 * @return this
 * @api public
 */

io.prototype.limit = io.prototype.head = function (num) {
    this.hasDefault(arguments, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (false === emit(elem)){
                    return false
                }
                return --num > 0
            }, end)
        }
    })
}

/**
 * Skip the first `num` elements from the stream.
 *
 * @param {Integer} num (optional) -.hasDefaults to 1
 * @return this
 * @api public
 */

io.prototype.skip = function (num) {
    this.hasDefault(arguments, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                if (num-- <= 0) {
                    return emit(elem)
                }
            }, end)
        }
    })
}

io.prototype.array = function (arr) {
    return this.extend(function (stream) {
        return function (emit, end) {
            for (var i = 0, l = arr.length; i < l; i++) {
                if (false === emit(arr[i])) {
                    break
                }
            }
            end && end()
        }
    })
}

io.prototype.arguments = function () {
    return this.array(arguments)
}

io.prototype.range = function (min, max, step) {
    this.hasDefault(arguments, 0, 100, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            for (var i = min; i <= max; i += step) {
                if (false === emit(i)) {
                    break
                }
            }
            end && end()
        }
    })
}

io.prototype.integers = function (seed, step) {
    this.hasDefault(arguments, 0, 1)

    return this.extend(function (stream) {
        return function (emit, end) {
            while (emit(seed) !== false) {
                seed += step
            }
            end && end()
        }
    })
}

io.prototype.repeat = function (seed) {
    this.hasDefault(arguments, 0)

    return this.extend(function (stream) {
        return function (emit, end) {
            while (emit(seed) !== false)
            end && end()
        }
    })
}

io.prototype.generate = function (fn) {
    return this.extend(function (stream) {
        return function (emit, end) {
            while (emit(fn()) !== false)
            end && end()
        }
    })
}

io.prototype.random = function (min, max) {
    this.hasDefault(arguments, 0, 100)

    return this.generate(function () {
       return Math.round(Math.random() * (max - min)) + min
    })
}

io.prototype.last = function () {
    return this.extend(function (stream) {
        return function (emit, end) {
            var last
            stream(function (elem) {
                last = elem
            }, function (err) {
                if (typeof last !== 'undefined') {
                    emit(last)
                }
                end && end()
            })
        }
    })
}

io.prototype.first = function () {
    return this.limit(1)
}

io.prototype.tail = function (num) {
    if (!num) {
        return this.last()
    }
    return this.compress().extend(function (stream) {
        return function (emit, end) {
            stream(function (elem) {
                var ended = false
                elem.slice(-1 * num).forEach(function (elem) {
                    if (!ended && false === emit(elem)) {
                        ended = true
                    }
                });
                return ended
            }, end)
        }
    })
}

io.prototype.append = function () {
    var streams = this.collect(arguments)
    streams.unshift(this)

    return this.extend(function (stream) {
        return function (emit, end) {
            var stream, ended = false
            function next() {
                if (stream = streams.shift()) {
                    return !ended && stream.stream(function (elem) {
                        if (!ended && false === emit(elem)) {
                            ended = true
                            return false
                        }
                    }, function (err) {
                        !ended && next()
                    })
                }
                end && end()
            }
        }
    })
}

io.prototype.prepend = function () {
    var streams = this.collect(arguments)
    streams.push(this)

    return this.extend(function (stream) {
        return function (emit, end) {
            var stream, ended = false
            function next() {
                if (!ended && (stream = streams.shift())) {
                    return stream.stream(function (elem) {
                        if (!ended && false === emit(elem)) {
                            ended = true
                            return false
                        }
                    }, function (err) {
                        !ended && next()
                    })
                }
                end && end()
            }
        }
    })
}

