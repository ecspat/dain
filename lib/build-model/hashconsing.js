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

/*global require exports*/

/** Methods for hashconsing models that are not circular. */

var Model = require('./Model').Model,
    ArrayModel = require('./ArrayModel').ArrayModel,
    ObjModel = require('./ObjModel').ObjModel,
    ClientObjModel = require('./ClientObjModel').ClientObjModel,
    GlobalModel = require('./GlobalModel').GlobalModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    BuiltinObjectModel = require('./BuiltinObjectModel').BuiltinObjectModel,
    Union = require('./Union').Union,
    util = require('../util'),
    add = util.add,
    addAll = util.addAll,
    array_eq = util.array_eq;
    
// no hashconsing by default
Model.prototype.hashcons = function() {
	return this;
};

BuiltinObjectModel.prototype.hashcons = function() {
	return this;
};

// and in particular not for client objects
ClientObjModel.prototype.hashcons = function() {
	return this;
};

// object models get hashconsed based on their structure
ObjModel.cache = {};

ObjModel.prototype.signature = function() {
	var property_models = this.property_models;
	return Object.keys(property_models).sort().map(function(p) {
		return p.substring(2) + ":" + property_models[p].id;
	}).join(',');
};

// slightly different signature for instance model to prevent them from being hashconsed together with other objects
// TODO: signature should say something about prototype
InstanceModel.prototype.signature = function() {
	if(this.fn_model instanceof BuiltinObjectModel) {
		return "Instance(" + this.fn_model.full_name + ")";
	} else {
		return "Instance(" + ObjModel.prototype.signature.call(this) + ")";
	}
};

ObjModel.prototype.hashcons = function() {
	if(this.hashconsed) {
		return this.hashconsed;
	}
	this.hashconsed = this;
	
	for(var p in this.property_models) {
		// see ObjModel.prototype.getChildren for an explanation of this test
		if(p.match(/^(\$\$|get |set )/)) {
			this.property_models[p] = this.property_models[p].hashcons();
		}
	}
	
	if(this.circular) {
		return this;
	} else {
		var sig = this.signature();
		return this.hashconsed = (ObjModel.cache[sig] || (ObjModel.cache[sig] = this));
	}
};

// array models work basically the same as object models, but we give them a slightly
// different signature to make sure we don't gratuitously merge them

ArrayModel.prototype.signature = function() {
	return "[" + ObjModel.prototype.signature.call(this);
};

// ditto for function models
FunctionModel.cache = {};

FunctionModel.prototype.signature = function() {
	return ObjModel.prototype.signature.call(this) + 
		"|" + this.instance_model.id +
		":" + this.return_model.id;
};

FunctionModel.prototype.hashcons = function() {
	if(this.hashconsed) {
		return this.hashconsed;
	}
	this.hashconsed = this;
	
	if(this.getter || this.setter) {
		return this.hashconsed;
	}
		
	for(var p in this.property_models) {
		// see ObjModel.prototype.getChildren for an explanation of this test
		if(p.match(/^(\$\$|get |set )/)) {
			this.property_models[p] = this.property_models[p].hashcons();
		}
	}
	this.instance_model = this.instance_model.hashcons();
	this.return_model = this.return_model.hashcons();
	
	if(this.circular || this.used_params.length > 0) {
		return this;
	} else {
		var sig = this.signature();
		if(sig in FunctionModel.cache) {
			this.hashconsed = FunctionModel.cache[sig];
			addAll(this.hashconsed.source_positions, this.source_positions);
		} else {
			FunctionModel.cache[sig] = this;
		}
		return this.hashconsed;
	}	
};

// unions are hashconsed based on their members
Union.cache = {};

Union.prototype.signature = function(members) {
	var ids = [];
	this.members.forEach(function(member) {
		add(ids, member.id);
	});
	return ids.sort().join(',');
};

Union.prototype.hashcons = function() {
	if(this.hashconsed) {
		return this.hashconsed;
	}
	this.hashconsed = this;
	
	var members = [];
	for(var i=0,n=this.members.length;i<n;++i) {
		add(members, this.members[i].hashcons());
	}
	this.members = members;
	
	var sig = this.signature();
	return this.hashconsed = (Union.cache[sig] || (Union.cache[sig] = this));
};

// the global model itself isn't hashconsed, but callbacks may be
GlobalModel.prototype.hashcons = function() {
	if(this.hashconsed)
		return this;
	this.hashconsed = true;
		
	for(var p in this.property_models) {
		// see ObjModel.prototype.getChildren for an explanation of this test
		if(p.match(/^(\$\$|get |set )/)) {
			this.property_models[p] = this.property_models[p].hashcons();
		}
	}

	var callbacks = [];
	this.callbacks.forEach(function(callback) {
		callback.callee = callback.callee.hashcons();
		for(var i=0,n=callback.args.length;i<n;++i) {
			callback.args[i] = callback.args[i] && callback.args[i].hashcons();
		}
		
		for(i=0,n=callbacks.length;i<n;++i) {
			if(callbacks[i].callee === callback.callee &&
			   array_eq(callbacks[i].args, callback.args)) {
				return;
			}
		}
		callbacks.push(callback);
	});
	this.callbacks = callbacks;
	
	return this;
};