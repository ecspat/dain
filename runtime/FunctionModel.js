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

var ObjModel = require('./ObjModel').ObjModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    Union = require('./Union').Union,
    UNDEFINED = require('./PrimitiveModel').UNDEFINED,
    add = require('./util').add;
 
 /** A function model represents a set of concrete runtime functions, for instance all functions arising
   * from the same textual definition. A function model is an object model, so it keeps track of its
   * properties. Additionally, it has an instance model representing all objects created as instances
   * of this function, a return model capturing all observed return values, and a default proto model
   * that stands for the default prototype object (as initially stored in the function's 'prototype'
   * property). */
function FunctionModel(pp_id) {
	ObjModel.call(this);
	
	/** ID used for pretty printing; may encode information about source position to aid debugging. */
	this.pp_id = arguments.length ? pp_id : this.id;
	
	/** The model of all instances of this function model. */
	this.instance_model = new InstanceModel(this);
	
	/** The model of the default prototype object of this function. */
	this.default_proto_model = new ObjModel();
	this.default_proto_model.default_proto_of = this;
	
	/** The model of all observed return values of this function. */
	this.return_model = UNDEFINED;

	/** Cache for client objects models that were first encountered as arguments of this function. */	
	this.client_obj_models = [];

	/** If a client object first seen in parameter i of this function ends up being called or passed
	  * as an argument to a call back, index i of this array will be set to true to indicate that this
	  * parameter is important. When generating ASGs, we will generate parameter names for used
	  * parameters (but not for the other ones). */
	this.used_params = [];
}
FunctionModel.prototype = Object.create(ObjModel.prototype);

/** Caching based on source position as for object models. */
FunctionModel.cache = {};
FunctionModel.make = function(pos) {
	if(!pos || pos.start_offset === -1)
		return new FunctionModel();
	return FunctionModel.cache[pos.start_offset] || (FunctionModel.cache[pos.start_offset] = new FunctionModel(pos.start_offset));
};

/** Record a new return model. */
FunctionModel.prototype.addReturnModel = function(model) {
	if(this.return_model === UNDEFINED)
		this.return_model = model;
	else
		this.return_model = Union.make([this.return_model, model]);
};

/** The children of a function model are its property models, its instance model, its default proto model, and its return model. */
FunctionModel.prototype.getChildren = function() {
	var children = ObjModel.prototype.getChildren.call(this);
	add(children, this.instance_model);
	add(children, this.default_proto_model);
	add(children, this.return_model);
	return children;
};

exports.FunctionModel = FunctionModel;