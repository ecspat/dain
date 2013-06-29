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

var PrimitiveModel = require('./PrimitiveModel').PrimitiveModel,
    GlobalModel = require('./GlobalModel').GlobalModel,
    ArrayModel = require('./ArrayModel').ArrayModel,
    ObjModel = require('./ObjModel').ObjModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    Union = require('./Union').Union,
    util = require('./util'),
    forEach = util.forEach,
    add = util.add;

// primitives are already hashconsed
PrimitiveModel.prototype.hashcons = function() {
	return this;
};

// ditto for global model
GlobalModel.prototype.hashcons = function() {
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

ObjModel.prototype.hashcons = function() {
	forEach(this.property_models, function(_, model) {
		return model.hashcons();
	});
	
	if(this.circular) {
		return this;
	} else {
		var sig = this.signature();
		return ObjModel.cache[sig] || (ObjModel.cache[sig] = this);
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
	forEach(this.property_models, function(_, model) {
		return model.hashcons();
	});
	this.instance_model = this.instance_model.hashcons();
	this.return_model = this.return_model.hashcons();
	
	if(this.circular) {
		return this;
	} else {
		var sig = this.signature();
		return FunctionModel.cache[sig] || (FunctionModel.cache[sig] = this);
	}	
};

// no hashconsing for instance models
InstanceModel.prototype.hashcons = function() {
	return this;
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

Union.prototype.hashcons = function(members) {
	if(this.circular) {
		return this;
	} else {
		var sig = this.signature();
		return Union.cache[sig] || (Union.cache[sig] = this);
	}
};