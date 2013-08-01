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

/** A model representing the global object. */
function GlobalModel(global) {
	/** There should only be one global object model. */
	if(GlobalModel.GLOBAL)
		throw new Error("Cannot have more than one global model.");
	ObjModel.call(this);
	
	/** Keep a reference to the global object model. */
	this.global = global;
	
	/** This array is filled with information about callbacks to user-supplied functions. */
	this.callbacks = [];
	
	/** Make the singleton instance available. */
	GlobalModel.GLOBAL = this;
}
GlobalModel.prototype = Object.create(ObjModel.prototype);

/** Add a number of callback entries. */
GlobalModel.prototype.addCallbacks = function(callbacks) {
	for(var i=0,n=callbacks.length;i<n;++i) {
		this.callbacks.push(callbacks[i]);
	}
};

/** The children of this model are its properties, and (for each callback entry) the callee
  * model and the argument models. */
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