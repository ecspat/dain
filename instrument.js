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
 
 /*global require console process setTimeout __dirname */

var esprima = require('esprima'),
    escodegen = require('escodegen'),
    normalizer = require('JS_WALA/normalizer/lib/normalizer.js'),
    ast = require('JS_WALA/common/lib/ast.js'),
    runtime = require('./runtime/runtime.js'),
    fs = require('fs'),
    path = require('path'),
    temp = require('temp'),
    Browser = require('zombie'),
    ArgumentParser = require('argparse').ArgumentParser;
    
function parseStmt(src) {
    return esprima.parse(src).body[0];
}

function parseExpr(src) {
    return parseStmt("(" + src + ");").expression;
}

function quote(str) {
    return escodegen.generate({ type: 'Literal', value: str });
}

function instrument_ast(nd) {
	var pos;
	
	if(!nd)
		return;

	if(Array.isArray(nd))
		return nd.flatmap(instrument_ast);

	if(nd.type === 'FunctionExpression') {
		instrument_ast(nd.body);
		nd.body.body.unshift(parseStmt("if(this.__proto__ === arguments.callee.prototype) { __tagNew(this, arguments.callee); }"));
		if(nd.params.length === 1 && nd.params[0].name === '__global') {
			nd.body.body.unshift(parseStmt("__tagGlobal(__global);"));
		} else {
			var ret_var = ast.getAttribute(nd, 'ret_var');
			nd.body.body.splice(nd.body.body.length-1, 0, parseStmt("__return(arguments.callee, " + ret_var + ");"));
		}
	} else if(nd.type === 'ExpressionStatement' && nd.expression.type === 'AssignmentExpression') {
		var left = nd.expression.left, right = nd.expression.right;
		if(left.type === 'MemberExpression') {
			return [nd,
			        parseStmt("__write(" + left.object.name + ", " + left.property.name + "," + right.name + ");")];
		} else if(right.type === 'FunctionExpression') {
			pos = ast.getPosition(right);
			instrument_ast(right);
			return [nd,
					parseStmt("__tagFn(" + left.name + ", " + pos.start_line + ", " + pos.start_offset + ");")];
		} else if(right.type === 'ObjectExpression') {
			pos = ast.getPosition(right);
			instrument_ast(right);
			var res = [nd,
			           parseStmt("__tagObjLit(" + left.name + ", " + pos.start_line + ", " + pos.start_offset + ");")];
			right.properties.forEach(function(prop) {
				if(prop.kind === 'init')
					return res[res.length] = parseStmt("__write(" + left.name + ", " + quote(prop.key.name || prop.key.value) + "," + prop.value.name + ");");
			});
			return res;
		}
	} else if(nd.type === 'BlockStatement') {
		nd.body = instrument_ast(nd.body);
	} else {
		ast.forEachChild(nd, instrument_ast);
	}
	return [nd];
}

function instrument(file, load, cb) {
    var original_ast = esprima.parse(fs.readFileSync(file, 'utf-8'), 
				     { loc: true, range: true });
    var normalized_ast = normalizer.normalize(original_ast, 
					      { unify_ret: true });
    var instrumented_ast = instrument_ast(normalized_ast)[0];
    var instrumented_src = runtime.getRuntimeSource() + escodegen.generate(instrumented_ast);

    if (load) {
    	var htmlTmp = temp.openSync({
    		suffix: '.html'
    	});
    	fs.writeSync(htmlTmp.fd, "<html><head>\n" +
    	                         "<script src='https://raw.github.com/Constellation/escodegen/master/escodegen.browser.js'></script>\n" +
    	                         "<script>\n" + instrumented_src + "\n" + "</script>\n" +
    	                         "</head><body></body></html>\n");

    	var browser = new Browser();
    	browser.on("error", function(error) {
    		console.error("ERROR: " + error);
    		console.error(error.stack);
    	});

    	browser.visit("file://" + htmlTmp.path, function(e, browser, status) {
    		setTimeout(function() {
    			if (browser.errors && browser.errors.length) {
    				console.error(browser.errors.join('\n'));
    				return;
    			}
    			cb(browser.window.__done());
    		}, 1000);
    	});
    } else {
    	cb(instrumented_src);
    }
}
exports.instrument = instrument;

if(require.main === module) {
    var argParser = new ArgumentParser({
	addHelp: true,
	description: 'DAIN: Dynamic API Inferencer',
	usage: 'node ' + path.basename(process.argv[1]) + ' [OPTION]... FILE'
    });

    argParser.addArgument(['-l', '--load'], 
			  { nargs: 0, 
			    help: 'Immediately load instrumented code in a ' +
  			          'trivial HTML page.'});
    
    var r = argParser.parseKnownArgs();
    if(r[1].length !== 1 || r[1][0][0] === '-') {
	argParser.printHelp();
	process.exit(-1);
    }

    instrument(r[1][0], r[0].load, console.log);
}