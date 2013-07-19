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
 
 /*global require exports */
 
 var ObjModel = require('./ObjModel').ObjModel,
     add = require('./util').add;

function GlobalModel(global) {
	if(GlobalModel.GLOBAL)
		throw new Error("Cannot have more than one global model.");
	ObjModel.call(this);
	this.global = global;
	this.callbacks = [];
	GlobalModel.GLOBAL = this;
}
GlobalModel.prototype = Object.create(ObjModel.prototype);

GlobalModel.prototype.addCallbacks = function(callbacks) {
	for(var i=0,n=callbacks.length;i<n;++i) {
		this.callbacks.push(callbacks[i]);
	}
};

GlobalModel.prototype.getChildren = function() {
	var children = ObjModel.prototype.getChildren.call(this);
	this.callbacks.forEach(function(callback) {
		add(children, callback.callee);
		callback.args.forEach(function(arg) {
			if(arg) {
				add(children, arg);
			}
		});
	});
	return children;
};

exports.GlobalModel = GlobalModel;