// Copyright 2012 Mark Cavage.  All rights reserved.

var fast = require('../lib');

if (require.cache[__dirname + '/helper.js'])
    delete require.cache[__dirname + '/helper.js'];
var test = require('./helper.js').test;



////--- Globals

var PORT = process.env.TEST_PORT || 12345;

var client;
var server;



///--- Tests

test('createServer', function (t) {
    server = fast.createServer();
    t.ok(server);
    t.done();
});


test('listen', function (t) {
    server.listen(PORT, function () {
        t.done();
    });
});


test('createClient', function (t) {
    client = fast.createClient({
        host: 'localhost',
        port: PORT
    });
    client.on('connect', function () {
        t.done();
    });
});


test('echo RPC handler', function (t) {
    server.rpc('echo', function (message, res) {
        res.end(message);
    });
    var req = client.rpc('echo', 'hello world');
    t.ok(req);
    req.on('message', function (msg) {
        t.equal(msg, 'hello world');
    });
    req.on('end', function () {
        t.done();
    });
});


test('error RPC handler', function (t) {
    server.rpc('err', function (res) {
        var e = new Error('suck it, mr. client');
        e.context = {
            foo: 'bar'
        };
        res.write(e);
    });
    var req = client.rpc('err');
    t.ok(req);
    req.on('error', function (err) {
        t.ok(err);
        t.equal(err.message, 'suck it, mr. client');
        t.ok(err.context);
        if (err.context)
            t.equal(err.context.foo, 'bar');
        t.done();
    });
});


test('streaming RPC handler', function (t) {
    server.rpc('stream', function (res) {
        for (var i = 1; i <= 10; i++)
            res.write({i: i});
        res.end();
    });
    var req = client.rpc('stream');
    var seen = 0;
    t.ok(req);
    req.on('message', function (obj) {
        t.ok(obj);
        t.ok(obj.i);
        seen++;
    });
    req.on('end', function () {
        t.equal(seen, 10);
        t.done();
    });
});


test('RPC handler with thrown error #1', function (t) {
    server.rpc('echo2', function (message, res) {
        process.nextTick(function () {
            throw new Error('boom');
        });
    });

    server.once('error', function (err, msg, res) {
        t.ok(err);
        t.ok(msg);
        t.ok(res);
        res.end(err);
    });

    client.rpc('echo2', 'foo').once('error', function (err) {
        t.ok(err);
        t.done();
    });

});



test('RPC handler with thrown error #2', function (t) {
    server.rpc('echo3', function (message, res) {
        process.nextTick(function () {
            throw new Error('boom');
        });
    });

    server.once('uncaughtException', function (err, msg, res) {
        t.ok(err);
        t.ok(msg);
        t.ok(res);
        res.end(err);
    });

    client.rpc('echo3', 'foo').once('error', function (err) {
        t.ok(err);
        t.done();
    });
});


test('teardown', function (t) {
    var serverClosed = false;
    var clientClosed = false;
    function tryEnd() {
        if (serverClosed && clientClosed) {
            t.done();
        }
    }
    server.on('close', function () {
        serverClosed = true;
        tryEnd();
    });
    client.on('close', function () {
        clientClosed = true;
        tryEnd();
    });
    client.close();
    server.close();
});
