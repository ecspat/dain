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

var fs = require('fs'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    instrumenter = require('../instrument');

function runtest(test, input_file, output_file) {
    test.expect(1);
    var expected_output = escodegen.generate(esprima.parse(fs.readFileSync(output_file, 'utf-8')));
    instrumenter.instrument(input_file, true, function(actual_output) {
	actual_output = escodegen.generate(esprima.parse(actual_output));
	test.equal(expected_output, actual_output);
	test.done();
    });
}

var IN_DIR = "in/",
    OUT_DIR = "out/";
fs.readdirSync(IN_DIR).forEach(function(file) {
    if(/\.js$/.test(file))
	exports[file] = function(test) {
	    runtest(test, IN_DIR + file, OUT_DIR + file);
	};
});

var reporter = require('nodeunit').reporters['default'];
reporter.run({"test-normalise" : module.exports});