var vows = require('vows');
var assert = require('assert');
var winston = require('winston');
var SocketIO = require('../lib/winston-socketio').SocketIO;


require("../lib/winston-socketio");

vows.describe("winston-socketio").addBatch({

        "Create Instance of the transport": {
            topic: function() {
                return SocketIO;
            },

            "is this an instance of the transport": function(topic) {
                var transport = new topic({});
                assert.instanceOf(transport, SocketIO);
            },

            "can you set hostname option": function(topic) {
                var transport = new topic({ host: "http://test" });
                assert.deepEqual(transport.host, "http://test");
            },

            "can you set port option": function(topic) {
                var transport = new topic({ port: 8085 });
                assert.deepEqual(transport.port, 8085);
            },

            "can you set secure": function(topic) {
                var transport = new topic({ secure: true });
                assert.deepEqual(transport.secure, true);
            },

            "can you set reconnect": function(topic) {
                var transport = new topic({ reconnect: true });
                assert.deepEqual(transport.reconnect, true);
            },

            "can you set namespace option": function(topic) {
                var transport = new topic({ namespace: "josh_nsp" });
                assert.deepEqual(transport.namespace, "josh_nsp");
            },

            "can you set logformat option": function(topic) {

                var format = function(level, msg, meta) {
                    return { level: level, msg: msg, meta: meta };
                }

                var transport = new topic({ log_format: format });
                assert.deepEqual(transport.log_format, format);
            },

            "can you set log topic option": function(topic) {
                var transport = new topic({ log_topic: "josh_topic" });
                assert.deepEqual(transport.log_topic, "josh_topic");
            },

            "can you set max queue size option": function(topic) {
                var transport = new topic({ max_queue_size: 550 });
                assert.deepEqual(transport.max_queue_size, 550);
            }
        }
    })
    .addBatch({

        "Create Winston and add SocketIO transport": {
            topic: function() {
                return SocketIO;
            },

            "Can we add the winson transport without any errors": function(topic) {
                assert.doesNotThrow(function() {
                    var logger = new winston.Logger();
                    logger.add(topic, { host: "http://somehost", port: 8085 });
                }, Error);
            },
            "Can we add the winson transport and then remove it without any errors": function(topic) {
                assert.doesNotThrow(function() {
                    var logger = new winston.Logger();
                    logger.add(topic);
                    logger.remove(logger.transports.socketio);
                }, Error);
            },
            "Can we add the winson transport log to it errors": function(topic) {
                assert.doesNotThrow(function() {
                    var logger = new winston.Logger();
                    logger.add(topic);
                    logger.log("info", "test log");
                    logger.remove(logger.transports.socketio);
                }, Error);
            }
        }
    }).export(module);