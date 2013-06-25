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

/*global require exports __dirname console module*/ 
 
var fs = require('fs');
 
function include(mod) {
	return fs.readFileSync(__dirname + '/' + mod + '.js', 'utf-8');
}

exports.getRuntimeSource = function() {
	return "var __observer;\n" +
		   "if(!__observer) {\n" +
		   "  __observer = (function(global) {\n" +
		        include('Observer') +
                include('util') +
                include('HiddenClass') +
                include('FunctionClass') +
                include('CallBackClass') +
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
           "    tagGlobal(global);\n" +
           "    return new Observer();\n" +
		   "  })(this);\n" +
		   "}\n";
};

if (require.main === module) {
	console.log(exports.getRuntimeSource());
}