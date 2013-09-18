/*******************************************************************************
 * Copyright (c) 2013 Max Schaefer.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     Max Schaefer - initial API and implementation
 *******************************************************************************/

/**
 * Instrumenter for dynamic model inference as described in README.txt.
 */

/*global require console process setTimeout __dirname exports module */

var esprima = require('esprima'),
	escodegen = require('escodegen'),
	eavesdropper = require('eavesdropper/eavesdropper'),
	ModelBuilder = require('./lib/build-model/ModelBuilder'),
	browserify = require('browserify'),
	fs = require('fs'),
	path = require('path'),
	temp = require('temp'),
	Browser = require('zombie'),
	ArgumentParser = require('argparse').ArgumentParser;

function instrument(file, load, node, only_trace, test, cb) {
	if (only_trace && !load) {
		console.warn("Option -t is meaningless without -l");
	}

	var instrumented_src = eavesdropper.instrument(fs.readFileSync(file, 'utf-8'), file);
	if (node) {
		if(load) {
			console.warn("Option -l is ignored if --node is specified.");
		}
		
		instrumented_src = "var __runtime = require('" + __dirname + "/lib/runtime');\n" + instrumented_src;
		cb(instrumented_src);
	} else {
		browserify(__dirname + "/lib/browser_runtime.js").bundle({
			debug: false
		}, function(err, runtime) {
			if (err) throw new Error(err);

			instrumented_src = runtime + instrumented_src;

			if (load) {
				var htmlTmp = temp.openSync({
					suffix: '.html'
				}),
					jsTmp = temp.openSync({
						suffix: '.js'
					});

				fs.writeSync(jsTmp.fd, instrumented_src);

				fs.writeSync(htmlTmp.fd, "<html><head>\n" + "<script src='" + jsTmp.path + "'></script>\n" + "</head><body></body>\n" + (test ? "<script>\n" + fs.readFileSync(test, 'utf-8') + "</script>\n" : "") + "</html>\n");

				Browser.visit("file://" + htmlTmp.path, function(e, browser, status) {
					if (browser.errors && browser.errors.length) {
						console.error(browser.errors.join('\n'));
						return;
					}
					cb(only_trace ? browser.window.__runtime.getEvents() : browser.window.__runtime.getModel());
				});
			} else {
				cb(instrumented_src + (test ? fs.readFileSync(test, 'utf-8') : ''));
			}
		});
	}
}
exports.instrument = instrument;

if (require.main === module) {
	var argParser = new ArgumentParser({
		addHelp: true,
		description: 'DAIN: Dynamic API Inferencer',
		usage: 'node ' + path.basename(process.argv[1]) + ' [OPTION]... FILE [FILE]'
	});

	argParser.addArgument(['-l', '--load'], {
		nargs: 0,
		help: 'Immediately load instrumented code in a trivial HTML page.'
	});

	argParser.addArgument(['-t', '--trace'], {
		nargs: 0,
		help: 'Only record a trace of events.'
	});
	
	argParser.addArgument(['--node'], {
		nargs: 0,
		help: 'Instrument for running under node.'
	});

	var r = argParser.parseKnownArgs();
	if (r[1].length < 1 || r[1].length > 2 || r[1][0][0] === '-') {
		argParser.printHelp();
		process.exit(-1);
	}

	instrument(r[1][0], r[0].load, r[0].node, r[0].trace, r[1][1], console.log);
}