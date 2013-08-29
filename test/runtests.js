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

/*global require exports module __dirname process*/

var fs = require('fs'),
	path = require('path'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    instrumenter = require('../instrument');

function runtest(test, input_file, client_file, output_file) {
	test.expect(1);
	var expected_output = escodegen.generate(esprima.parse(fs.readFileSync(output_file, 'utf-8')));
	instrumenter.instrument(input_file, true, client_file, function(actual_output) {
		actual_output = escodegen.generate(esprima.parse(actual_output));
		if(expected_output !== actual_output) {
			console.log("expected: " + expected_output);
			console.log("actual: " + actual_output);
		}
		test.equal(expected_output, actual_output);
		test.done();
	});
}

var IN_DIR = __dirname + "/in", OUT_DIR = __dirname + "/out";
fs.readdirSync(IN_DIR).forEach(function(file) {
	if (/\.js$/.test(file) && !/_client\.js$/.test(file)) {
		var client = IN_DIR + '/' + path.basename(file, '.js') + '_client.js';
		if(!fs.existsSync(client))
			client = null;
			
		exports[file] = function(test) {
			runtest(test, IN_DIR + '/' + file, client, OUT_DIR + '/' + file);
		};
	}
});

var reporter = require('nodeunit').reporters['default'];

/* If any arguments are passed, interpret them as names of tests to run. Otherwise, run all tests. */
if(process.argv.length > 2) {
	var tests = {};
	var fixture = { "unit tests": tests };
	for(var i=2,n=process.argv.length;i<n;++i) {
		var tmp = process.argv[i].split("/"),
			test = tmp[tmp.length-1];
		tests[test] = exports[test];
	}
	reporter.run(fixture);
} else {
	reporter.run({ "unit tests": exports });
}