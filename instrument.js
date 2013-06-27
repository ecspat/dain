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
    eavesdropper = require('eavesdropper/eavesdropper.js'),
    runtime = require('./runtime/runtime.js'),
    fs = require('fs'),
    path = require('path'),
    temp = require('temp'),
    Browser = require('zombie'),
    ArgumentParser = require('argparse').ArgumentParser;
    
function instrument(file, load, test, cb) {
    var instrumented_src = runtime.getRuntimeSource() + eavesdropper.instrument(fs.readFileSync(file, 'utf-8'), file);

    if (load) {
		var htmlTmp = temp.openSync({ suffix: '.html' });
		fs.writeSync(htmlTmp.fd,
					"<html><head>\n" +
					"<script>\n" + instrumented_src + "\n" + "</script>\n" +
					"</head><body></body>\n" +
					(test ? "<script>\n" + fs.readFileSync(test, 'utf-8') + "</script>\n" : "") +
					"</html>\n");

		Browser.visit("file://" + htmlTmp.path, function(e, browser, status) {
			setTimeout(function() {
				if (browser.errors && browser.errors.length) {
					console.error(browser.errors.join('\n'));
					return;
				}
				cb(browser.window.__observer.done());
			}, 1000);
		});
    } else {
		cb(instrumented_src);
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
		help: 'Immediately load instrumented code in a ' + 'trivial HTML page.'
	});

	var r = argParser.parseKnownArgs();
	if (r[1].length < 1 || r[1].length > 2 || r[1][0][0] === '-') {
		argParser.printHelp();
		process.exit(-1);
	}
	
	if(!r[0].load && r[1].length > 1)
		console.warn("Ignoring test file since '-l' wasn't given.");

	instrument(r[1][0], r[0].load, r[1][1], console.log);
}