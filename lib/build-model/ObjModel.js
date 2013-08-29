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
 
 var Model = require('./Model').Model,
     Union = require('./Union').Union,
     util = require('../util'),
     forEach = util.forEach,
     add = util.add,
     isIdentifier = util.isIdentifier;

/** An object model represents a family of runtime objects, for instance all objects that arise
  * from the same textual definition. Object models keep track of the models of all values ever
  * stored in their properties. */
function ObjModel(pp_id) {
	Model.call(this);
	
	/** The pp_id is used for pretty printing. */
	this.pp_id = arguments.length ? pp_id : this.id;
	
	/** Map from property names to property models. Property names are prefixed with '$$' to
	  * avoid name clashes with special properties. Accessor methods are also supported: their
	  * keys are of the form 'get x' and 'set x', respectively; since there is no danger of
	  * name clash, they are not prefixed with '$$'. */
	this.property_models = {};
}
ObjModel.prototype = Object.create(Model.prototype);

/** Object model factory: create and cache object models based on a source position.
  * Currently, the position is identified by its start offset, which won't work if we instrument
  * several files. */
ObjModel.cache = {};
ObjModel.make = function(pos) {
	if(!pos || pos.start_offset === -1)
		return new ObjModel();
	return ObjModel.cache[pos.start_offset] || (ObjModel.cache[pos.start_offset] = new ObjModel(pos.start_offset));
};

/** Convenience method for adding a model for a property. If the property already has a model, replace
  * it with a union model. Note that the property name is first put through method normalisePropName.
  * Its default definition (overridden by some subclasses) is to collapse all non-identifier properties
  * into a single pseudo-property '*'. This reflects the intuition that non-identifier properties usually
  * arise from objects being used as hash maps, for which it usually does not make sense to precisely
  * model their keys. */
ObjModel.prototype.addPropertyModel = function(prop, model) {
	prop = '$$' + this.normalisePropName(prop);
	if(prop in this.property_models) {
		this.property_models[prop] = Union.make([this.property_models[prop], model]);
	} else {
		this.property_models[prop] = model;
	}
};

/** Install the given model as the model of the getter for function prop. If there already is a getter, it is
  * overwritten. This doesn't sound like the right behaviour, but since an accessor syntactically has to be a
  * function it isn't so easy to model union getters. */
ObjModel.prototype.defineGetter = function(prop, model) {
	this.property_models['get ' + prop] = model;
	model.getter = true;
};

/** Like defineGetter, but for setters. */
ObjModel.prototype.defineSetter = function(prop, model) {
	this.property_models['set ' + prop] = model;
	model.setter = true;
};

/** Default implementation of property name normalisation; merges non-identifier properties into a single
  * pseudo-property '*'. */
ObjModel.prototype.normalisePropName = function(prop) {
	return isIdentifier(prop) ? prop : '*';
};

/** The child models of an object model are all the values of its property_models map. */
ObjModel.prototype.getChildren = function() {
	var children = [];
	forEach(this.property_models, function(pn, model) {
		// if the unit test suite used to build the model is run using Jasmine, we may end up
		// with Jasmine sticking its own (enumerable!) flag properties into property_models;
		// make sure we don't treat those as children
		if(pn.match(/^(\$\$|get |set )/)) {
			add(children, model);
		}
	});
	return children;
};

exports.ObjModel = ObjModel;