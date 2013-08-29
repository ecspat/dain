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
 
 /*global process require console*/

/**
 * Build a model from previously recorded traces.
 */
var ModelBuilder = require('./lib/build-model/ModelBuilder'),
    fs = require('fs');
    
var events = {
	prop_writes: [],
	returns: [],
	callbacks: []
};

for(var i=2,n=process.argv.length;i<n;++i) {
	var new_events = JSON.parse(fs.readFileSync(process.argv[i], 'utf-8'));
	['prop_writes', 'returns', 'callbacks'].forEach(function(p) {
		Array.prototype.push.apply(events[p], new_events[p]);
	});
}
console.log(ModelBuilder.buildModel(events));