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
 
 var ObjModel = require('./ObjModel').ObjModel;

/** A client object model represents all objects that are passed into a certain function
  * argument from non-instrumented code. */
function ClientObjModel(fn_model, idx) {
	ObjModel.call(this);
	
	/** The function (model) where the client object was first observed. */
	this.fn_model = fn_model;
	
	/** The argument position in which it was seen. */
	this.idx = idx;
}
ClientObjModel.prototype = Object.create(ObjModel.prototype);

/** Caching of client object models is handled by the client_obj_models array of function models. */
ClientObjModel.make = function(fn_model, idx) {
	return fn_model.client_obj_models[idx] || (fn_model.client_obj_models[idx] = new ClientObjModel(fn_model, idx));
};

/** Client object models have no children. */
ClientObjModel.prototype.getChildren = function() {
	return [];
};

exports.ClientObjModel = ClientObjModel;