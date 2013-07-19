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

var util = require('./util'),
    Union = require('./Union').Union,
    ObjModel = require('./ObjModel').ObjModel,
    ArrayModel = require('./ArrayModel').ArrayModel,
    GlobalModel = require('./GlobalModel').GlobalModel,
    InstanceModel = require('./InstanceModel').InstanceModel,
    FunctionModel = require('./FunctionModel').FunctionModel,
    PrimitiveModel = require('./PrimitiveModel'),
    ClientObjModel = require('./ClientObjModel').ClientObjModel,
    UNDEFINED = PrimitiveModel.UNDEFINED,
	NULL = PrimitiveModel.NULL,
	BOOLEAN = PrimitiveModel.BOOLEAN,
	NUMBER = PrimitiveModel.NUMBER,
	STRING = PrimitiveModel.STRING,
	REGEXP = PrimitiveModel.REGEXP,
    add = util.add,
    forEach = util.forEach,
    getOrCreateHiddenProp = util.getOrCreateHiddenProp,
    setHiddenProp = util.setHiddenProp;

function getModel(obj) {
	// TODO: the type test in the next line is ugly
	var tag = obj.getTag && obj.getTag() || obj.hasOwnProperty('__tag') && obj.__tag || obj, model, property_models;
	
	if(tag.model)
		return tag.model;
		
	switch(tag.type) {
	case 'undefined':
		tag.model = UNDEFINED;
		break;
	case 'boolean':
		tag.model = BOOLEAN;
		break;
	case 'number':
		tag.model = NUMBER;
		break;
	case 'string':
		tag.model = STRING;
		break;
	case 'null':
		tag.model = NULL;
		break;
	case 'regexp':
		tag.model = REGEXP;
		break;
	case 'global':
		tag.model = new GlobalModel(obj.getValue());
		property_models = forEach(tag.props, function(prop, vals) {
			return Union.make(vals.map(getModel));
		});
		tag.model.addPropertyModels(property_models);
		tag.model.addCallbacks(tag.callbacks.map(function(info) {
			debugger;
			return {
				callee: getModel(info.callee),
				args: info.args.map(getModel),
				kind: info.kind
			};
		}));
		break;
	case 'instance':
		tag.model = getModel(tag.fn).instance_model;
		break;
	case 'client object':
		tag.model = ClientObjModel.make(getModel(tag.fn), tag.index);
		break;
	case 'arraylit':
	case 'objlit':
	case 'unknown':
		tag.model = tag.type === 'arraylit' ? new ArrayModel() : new ObjModel();
		property_models = forEach(tag.props, function(prop, vals) {
			return Union.make(vals.map(getModel));
		});
		tag.model.addPropertyModels(property_models);
		break;
	case 'function':
		tag.model = new FunctionModel();
		property_models = forEach(tag.props, function(prop, vals) {
			return Union.make(vals.map(getModel));
		});
		tag.model.addPropertyModels(property_models);
			
		tag.instances.forEach(function(inst) { 
			var instance_property_models = forEach(inst.props, function(prop, vals) {
				return Union.make(vals.map(getModel));
			});
			tag.model.instance_model.addPropertyModels(instance_property_models);
		});
		tag.model.return_model = Union.make(tag.ret.map(getModel));
		break;
	default:
		throw new Error("unknown type " + tag.type);
	}
	return tag.model;
}

exports.getModel = getModel;