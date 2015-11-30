/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')
  , os = require('os')
  , net = require('net')
  , childProcess = require('child_process')
  , netBinding = process.binding('net')

/**
 * Is this the master process?
 */

var isMaster = !process.env._CHILD_ID_

/**
 * Fork worker processes.
 *
 * @param {Object} workers (optional) - defaults to # of cores
 * @return this
 * @api public
 */

io.prototype.fork = function (workers) {
    this.hasDefault(arguments, os.cpus.length)

    var nodes = spawnWorkers(workers)
      , master, children = []

    //The master receives this event on each spawn
    nodes.addListener('child', function (stream) {
        stream = frameStream(stream)

        stream.addListener('message', function (data) {
            //
        })

        children.push(stream)
        if (--workers) {
            //All spawned..
        }
    })

    //Each child receives this event
    nodes.addListener('', function (stream) {
        stream = frameStream(stream)

        stream.addListener('message', function (data) {
            //
        })

        master = stream
    })

    return this.extend(function (stream, io) {
        return function (emit, end) {

            //

            stream(function (input) {
                emit(input)
            }, function () {
                end && end()
            })
        }
    })
}

/**
 * Spawns child processes and sets up communication channels.
 *
 * @param {Number} num
 * @param {String} options (optional)
 * @return EventEmitter
 * @api public
 */

var spawnWorkers = function (num, options) {
    var emitter = new process.EventEmitter();

    options = options || {};

    if (!isMaster) {

        var stdin = new net.Stream(0, 'unix')
        var descriptorType
        stdin.addListener('data', function (message) {
            descriptorType = message
        });
        stdin.addListener('fd', function (fd) {
            if (descriptorType == 'master') {
                var stream = new net.Stream(fd, 'unix')
                emitter.emit('master', stream)
                stream.resume()
            } else {
                throw new Error('Unknown file descriptor ' + descriptorType)
            }
        })
        stdin.resume()

    } else {

        var children = [],
            numChildren = num || 1,
            priorArgs = process.argv

        if (process.platform === 'cygwin' && priorArgs) {
            priorArgs = ['/usr/bin/bash', '--login', '-c', 'cd ' + process.cwd() + ' && ' + priorArgs.join(' ')]
        }

        var env = {}
        for (var i in process.env) {
            env[i] = process.env[i]
        }

        var createChild = function (i) {

            var childConnection = netBinding.socketpair()
            env._CHILD_ID_ = i

            //Spawn the child process
            var child = children[i] = childProcess.spawn(
                priorArgs[0],
                priorArgs.slice(1),
                env,
                [childConnection[1], 1, 2]
            )
            child.master = new net.Stream(childConnection[0], 'unix')

            (function (child) {
                var masterChildConnection = netBinding.socketpair()
                process.nextTick(function () {
                    var stream = new net.Stream(masterChildConnection[0], 'unix')
                    emitter.emit('child', stream)
                    stream.resume()
                    child.master.write('master', 'ascii', masterChildConnection[1])
                })
            }(child))

        }

        for (i = 0; i < numChildren; i++) {
            createChild(i)
        }

        ['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGQUIT', 'SIGHUP', 'exit'].forEach(function (signal) {
            process.addListener(signal, function () {
                children.forEach(function (child) {
                    try {
                        child.kill()
                    } catch (e) {}
                });
                if (signal !== 'exit' && signal !== 'SIGHUP') {
                    process.exit()
                }
            })
        })
    }

    return emitter
};

/**
 * Fast JSON parsing.
 */

var parse = function (json) {
    return eval('(' + json + ')')
}

/**
 * Pass in a raw unframed binary stream and get a framed stream for sending and
 * receiving JSON data.
 *
 * @param {Object} stream
 * @param {Boolean} trusted (optional) - use eval-based parsing (faster)
 * @api public
 */

var frameStream = function (stream) {
    var emitter = new process.EventEmitter(),
        buffered = [], start

    var condense_buffered = function () {
        var totalSize = 0
        buffered.forEach(function (part) {
            totalSize += part.length
        })
        var buffer = new Buffer(totalSize)
        var index = 0
        buffered.forEach(function (part) {
            part.copy(buffer, index, 0, part.length)
            index += part.length
        })
        buffered = []
        return buffer
    }

    stream.addListener('data', function (data) {
        start = 0
        for (var i = 0, l = data.length; i < l; i++) {
            var b = data[i]
            if (b === 0) {
                start = i + 1
            } else if (b === 255) {
                if (start === i) {
                    emitter.emit('message', parse(condense_buffered().toString('utf8')))
                } else {
                    var buffer = data.slice(start, i)
                    if (buffered.length) {
                        buffered.push(buffer);
                        buffer = condense_buffered()
                    }
                    emitter.emit('message', parse(buffer.toString('utf8', 0, buffer.length)))
                }
                start = i + 1
            }
        }
        if (start < l) {
            buffered.push(data.slice(start, data.length))
        }
    })

    emitter.send = function (message) {
        var buffer = new Buffer(JSON.stringify(message), 'utf8')
        var framedBuffer = new Buffer(buffer.length + 2)
        framedBuffer[0] = 0
        buffer.copy(framedBuffer, 1, 0, buffer.length)
        framedBuffer[framedBuffer.length - 1] = 255
        stream.write(framedBuffer)
    }

    emitter.on = emitter.addListener

    return emitter
}

