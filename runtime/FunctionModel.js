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
 
function FunctionModel() {
	ObjModel.call(this);
	this.instance_model = new InstanceModel(this);
	this.default_proto_model = new ObjModel();
	this.return_model = UNDEFINED;
	this.used_params = [];
	this.client_obj_models = [];
}
FunctionModel.prototype = Object.create(ObjModel.prototype);

FunctionModel.cache = {};
FunctionModel.make = function(pos) {
	if(!pos || pos.start_offset === -1)
		return new FunctionModel();
	return FunctionModel.cache[pos.start_offset] || (FunctionModel.cache[pos.start_offset] = new FunctionModel());
};

FunctionModel.prototype.addReturnModel = function(model) {
	if(this.return_model === UNDEFINED)
		this.return_model = model;
	else
		this.return_model = Union.make([this.return_model, model]);
};

FunctionModel.prototype.getChildren = function() {
	var children = ObjModel.prototype.getChildren.call(this);
	add(children, this.instance_model);
	add(children, this.return_model);
	return children;
};

exports.FunctionModel = FunctionModel;