/*
 * winston-socketio.js: A winston transport for emitting logs to a socket.io server
 *
 * Author: Josh Bass
 *
 */
var util = require('util');
var winston = require('winston');
var io = require("socket.io-client");


var SocketIO = exports.SocketIO = function(options) {
    options = options || {};

    this.default_format = function(level, msg, meta) {
        return {
            level: level,
            msg: msg,
            meta: meta
        };
    };

    this.name = 'socketio';
    this.host = options.host || 'http://localhost';
    this.port = options.port || 3000;
    this.secure = options.secure || false;
    this.reconnect = options.reconnect || false;
    this.namespace = options.namespace || null;
    this.log_topic = options.log_topic || "log";
    this.log_format = options.log_format || this.default_format;
    this.max_queue_size = options.max_queue_size || 1000;

    this._state = "uninitialized";
    this._queue = [];
};

//
// Inherit from `winston.Transport`.
//
util.inherits(SocketIO, winston.Transport);


winston.transports.SocketIO = SocketIO;

/*
 * log - log a message to the server.  If the connection isnt open yet then the messages will be buffered.
 */
SocketIO.prototype.log = function(level, msg, meta, callback) {

    var _this = this;

    var do_log = function() {
        console.log("log " + _this._state);
        if (_this._state === "open") {
            _this.socket.emit(_this.log_topic, _this.log_format(level, msg, meta));
            callback();
        }
    }

    if (this._state === "uninitialized") {
        this.open(do_log);
    } else if (this._state === "open") {
        do_log();
    } else {
        this._enqueue(do_log);
    }
};

/*
 * open - Open the socket.io connection, buffer up log statements until they can be sent over the wire.
 */
SocketIO.prototype.open = function(callback) {

    var _this = this;


    if (this.namespace) {
        this.socket = io(this.host + ":" + this.port + "/" + this.namespace, { secure: this.secure, reconnect: this.reconnect });
    } else {
        this.socket = io(this.host + ":" + this.port, { secure: this.secure, reconnect: this.reconnect });
    }

    this._state = "pending";
    this._enqueue(callback);

    this.socket.on("connect", function() {
        _this._state = "open";
        _this._flushQueue();
    });

    this.socket.on("reconnect", function() {
        _this._state = "open";
        _this._flushQueue();
    });

    this.socket.on("connect_error", function(error) {
        _this._state = "error";
    });

    this.socket.on("connect_timeout", function(error) {
        _this._state = "error";
    });
};

/*
 * close - close socket when the transport is removed.
 */
SocketIO.prototype.close = function() {
    if (this.socket) {
        this.socket.close();
        this.emit("closed");
    }
}

/*
 * enqueue - add a log messge to the queue.  remove one if max log size has been reached.
 */
SocketIO.prototype._enqueue = function(data) {

    this._queue.push(data);
    if (this._queue.length > this.max_queue_size) {
        this._queue.splice(0, 1);
    }
}

/*
 * flushQueue - emit each of the log statemets to the server since we believe we
 *              are now connected.
 */
SocketIO.prototype._flushQueue = function(callback) {

    if (this._state === "open" && this._queue.length > 0) {
        while (this._queue.length > 0) {
            var cb = this._queue.splice(0, 1);
            console.log(cb);
            cb[0]();
        }
    }
}