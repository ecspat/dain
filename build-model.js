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
    
function pushAll(a, b) {
	for(var i=0,n=b.length;i<n;++i) {
		a[a.length] = b[i];
	}
}

var no_cb = false,
    no_merging = false,
    callback_merging = false,
    i = 2, n;

outer:
while((/^--/).test(process.argv[i])) {
	switch(process.argv[i++]) {
	case '--no-cb':
		no_cb = true;
		break;
	case '--no-merging':
		no_merging = true;
		break;
	case '--callback-merging':
		callback_merging = true;
		break;
	case '--':
		break outer;
	default:
		console.warn("Ignoring unknown option " + process.argv[i-1]);
	}
}
    
var events = {
	prop_writes: [],
	returns: [],
	callbacks: []
};

for(n=process.argv.length;i<n;++i) {
	var new_events = JSON.parse(fs.readFileSync(process.argv[i], 'utf-8'));
	pushAll(events.prop_writes, new_events.prop_writes);
	pushAll(events.returns, new_events.returns);
	if(!no_cb) {
		pushAll(events.callbacks, new_events.callbacks);
	}
}
console.log(ModelBuilder.buildModel(events, no_merging, callback_merging));