// Copyright 2013 Mark Cavage.  All rights reserved.

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var assert = require('assert-plus');

var RpcEncoder = require('./rpc_encoder').RpcEncoder;



///--- API

function RpcDecoder(options) {
    assert.object(options, 'options');
    assert.object(options.connection, 'options.connection');
    assert.object(options.decoder, 'options.decoder');
    assert.object(options.encoder, 'options.encoder');
    assert.object(options.emitter, 'options.emitter');

    var decoder = options.decoder;
    var emitter = options.emitter;
    var self = this;

    decoder.on('message', function onMessage(msg) {
        if (!msg.data || !msg.data.m || !msg.data.d) {
            self.emit('error', new Error('invalid message'));
            return (undefined);
        }

        var args = msg.data.d.slice();
        args.unshift(msg.data.m.name);
        var encoder = new RpcEncoder({
            connection: options.connection,
            encoder: options.encoder,
            method: msg.data.m.name,
            msgid: msg.msgid,
            start: msg.start,
            _arguments: msg.data.d
        });
        args.push(encoder);

        // decoder.once('end', function onEnd() {
        //     encoder.emit('end');
        // });

        emitter.emit.apply(emitter, args);
        return (undefined);
    });
}
util.inherits(RpcDecoder, EventEmitter);



///--- Exports

module.exports = {
    RpcDecoder: RpcDecoder
};
