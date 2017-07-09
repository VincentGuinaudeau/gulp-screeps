/*
 * gulp-screeps
 * https://github.com/pcmulder/gulp-screeps
 *
 * Copyright (c) 2015 Patrick Mulder
 * Licensed under the MIT license.
 */

'use strict';

var through    = require('through2'),
	toThrough  = require('to-through'),
	gutil      = require('gulp-util'),
	http       = require('http'),
	https      = require('https'),
	util       = require('util'),
	path       = require('path'),
	fs         = require("fs");

var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-screeps';

module.exports = function (opt) {
	opt = opt || {};

	var files = [];
	var modules = {};

	if (typeof opt.host !== 'string') {
		opt.host = 'screeps.com';
	}
	
	if (typeof opt.port !== 'number') {
		opt.port = 443;
	}

	if (typeof opt.secure !== 'boolean') {
		opt.secure = opt.port == 443;
	}

	if (typeof opt.email !== 'string' || typeof opt.password !== 'string') {
		throw new PluginError(PLUGIN_NAME, 'Please provide account information');
	}
	
	if (typeof opt.branch !== 'string') {
		opt.branch = 'default';
	}
	
	if (typeof opt.action !== 'string') {
		opt.action = 'push';
	}

	function bufferContents(file, enc, cb) {
		// ignore empty files
		if (file.isNull()) {
			cb();
			return;
		}

		if (file.isStream()) {
			this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
			cb();
			return;
		}
		files.push(file);

		cb();
	}

	function endStream(cb) {

		files.map(function (file) {
			var name = path.basename(file.path).replace(/\.js$/,'');
			modules[name] = file.contents.toString('utf-8');
		});

		var request = (opt.secure ? https : http).request;
		var req = request({
				hostname: opt.host,
				port: opt.port,
				path: opt.ptr ? '/ptr/api/user/code' : '/api/user/code',
				method: 'POST',
				auth: opt.email + ':' + opt.password,
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}
			},
			function (res) {
				res.setEncoding('utf8');

				var data = '';

				res.on('data', function (chunk) {
					data += chunk;
				});

				res.on('end', function () {
					data = JSON.parse(data);
					if (data.ok) {
						var msg = 'Committed to Screeps account "' + opt.email + '"';
						if (opt.branch) {
							msg += ' branch "' + opt.branch + '"';
						}
						if (opt.host != "screeps.com") {
							msg += ' on server "' + opt.host + '"';
						}
						msg += '.';
						gutil.log(msg);
					}
					else {
						gutil.log('Error while committing to Screeps: ' + util.inspect(data));
					}
				});
			});

		var data = {
			branch: opt.branch,
			modules: modules
		};

		req.write(JSON.stringify(data));
		req.end();

		cb();
	}

	function pullParse()
	{
		var msg = 'Pulling from Screeps account "' + opt.email + '"';
		if (opt.branch) {
			msg += ' branch "' + opt.branch + '"';
		}
		if (opt.host !== "screeps.com") {
			msg += ' on server "' + opt.host + '"';
		}
		msg += '.';
		gutil.log(msg);
		var wrap_vinyl = through.obj(function (obj, enc, callback) {
			callback(null, new gutil.File(obj));
		})
		var request = (opt.secure ? https : http).request;
		var options = {
				hostname: opt.host,
				port: opt.port,
				path: (opt.ptr ? '/ptr/api/user/code' : '/api/user/code') + (opt.branch ? "?branch=" + opt.branch : ""),
				method: 'GET',
				auth: opt.email + ':' + opt.password
			}
		var req = request(options, function (res) {
			res.setEncoding('utf8');

			var data = "";

			res.on('data', function (chunk) {
				data += chunk;
			});

			res.on('end', function () {
				try {
					data = JSON.parse(data);
				}
				catch (err) {
					gutil.log('Error while pulling from Screeps');
					wrap_vinyl.end();
					return;
				}
				if (data.ok) {
					for (var index in data.modules) {
						gutil.log("received module " + index)
						wrap_vinyl.write({
							path: index + ".js",
							contents: Buffer.from(data.modules[index])
						});
					}
				}
				else {
					gutil.log('Error while pulling from Screeps: ' + util.inspect(data));
				}
				wrap_vinyl.end();
				return;
			});
		});
		req.end();
		return toThrough(wrap_vinyl);
	}

	switch (opt.action)
	{
		case "push":
			return through.obj(bufferContents, endStream);
		case "pull":
			return pullParse();
		default:
			throw new PluginError(PLUGIN_NAME, 'invalid "action" attribute');
	}
};
