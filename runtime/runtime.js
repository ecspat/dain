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
 * Runtime support for programs instrumented with property-discovery.js.
 */

/*global require exports __dirname*/ 
 
var fs = require('fs');
 
function include(mod) {
	return fs.readFileSync(__dirname + '/' + mod + '.js', 'utf-8');
}
 
exports.getRuntimeSource = function() {
	return "var __write, __return, __done, __tagGlobal, __tagFn, __tagNew, __tagObjLit;\n" +
		   "(function(global, undefined) {\n" +
             include('util') +
             include('HiddenClass') +
             include('FunctionClass') +
             include('ObjClass') +
             include('InstanceClass') +
             include('PrimitiveClass') +
             include('UnionClass') +
             include('GlobalClass') +
             include('union') +
             include('pp') +
             include('tagging') +
             include('reachability') +
             include('api') +
		   "})(this);\n";
};