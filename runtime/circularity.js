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

var Model = require('./Model').Model,
    PrimitiveModel = require('./PrimitiveModel').PrimitiveModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    ObjModel = require('./ObjModel').ObjModel,
    Union = require('./Union').Union,
    util = require('./util'),
    add = util.add,
    forEach = util.forEach;

/** Circularity checker for models; every model that can transitively be reached from
 * one of its children is marked by setting its 'circular' property to true. */
 
Model.prototype.checkCircularity = function() {
	if(this.visited) {
		this.circular = true;
	} else {
		this.visited = true;
		this.getChildren().forEach(function(child) {
			child.checkCircularity();
		});
		delete this.visited;
	}
};

// primitive models are leaves, they cannot possibly be circular
PrimitiveModel.prototype.checkCircularity = function() {};

FunctionModel.prototype.getChildren = function() {
	var children = ObjModel.prototype.getChildren.call(this);
	add(children, this.instance_model);
	add(children, this.return_model);
	return children;
};

ObjModel.prototype.getChildren = function() {
	var children = [];
	forEach(this.property_models, function(_, model) {
		add(children, model);
	});
	return children;
};

Union.prototype.getChildren = function() {
	return this.members;
};