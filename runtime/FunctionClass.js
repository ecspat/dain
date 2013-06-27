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

var HiddenClass = require('./HiddenClass').HiddenClass,
    ObjClass = require('./ObjClass').ObjClass,
    ast = require('./ast'),
    mkIdentifier = ast.mkIdentifier,
    isEmptyObjectLiteral = ast.isEmptyObjectLiteral,
    mkAssignStmt = ast.mkAssignStmt,
    mkMemberExpression = ast.mkMemberExpression,
    mkThis = ast.mkThis,
    mkReturn = ast.mkReturn;

/** This class represents all function objects arising from a particular textual definition. */
function FunctionClass(fn, line, offset) {
	HiddenClass.call(this);
	this.fn = fn;
	this.line = line;
	this.offset = offset;
	this.prototype_class = new ObjClass(fn.prototype, line, offset);
	this.setPropClass('$$prototype', this.prototype_class);
	this.client_obj_classes = [];
	this.used_params = [];
}
FunctionClass.prototype = Object.create(HiddenClass.prototype);

FunctionClass.cache = {};
FunctionClass.make = function(fn, line, offset) {
	if(line !== -1 && offset !== -1) {
		var id = "function_" + line + "_" + offset;
		var fnclass = FunctionClass.cache[id];
		if(!fnclass)
			FunctionClass.cache[id] = fnclass = new FunctionClass(fn, line, offset);
		return fnclass;
	} else {
		return new FunctionClass(fn, line, offset);
	}
};

FunctionClass.prototype.mkTempName = function() {
	return this.line === -1 || this.offset === -1 ? "function_" + this.id : "function_" + this.line + "_" + this.offset;
};

FunctionClass.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;
		
	var body = [], params = [];
	this.asg = {
		type: 'FunctionExpression',
		id: null,
		params: params,
		defaults: [],
		body: {
			type: 'BlockStatement',
			body: body
		},
		rest: null,
		generator: false,
		expression: false,
		temp_name: this.mkTempName()
	};
	
	// handle callback parameters
	for (var i = 0, n = this.used_params.length; i < n; ++i) {
		// generate parameter declaration
		params.push(mkIdentifier('x' + i));
		
		if (this.used_params[i]) {
			this.generateClientObjStore(i);
		}
	}
				 
	// handle function properties
	for(var p in this.properties) {
		if(p.substring(0, 2) === '$$') {
		    var prop_name = p.substring(2);
		    var prop_asg = this.properties[p].generate_asg(decls);

		    // don't include trivial function prototypes
		    if (prop_name !== 'prototype' || !isEmptyObjectLiteral(prop_asg))
				decls.push(mkAssignStmt(mkMemberExpression(this.asg, prop_name), prop_asg));
		}
	}
	
	// handle instance properties
    if(this.fn.__instance_class)
		for(p in this.fn.__instance_class.properties)
		    if(p.substring(0, 2) === '$$') {
				body.push(mkAssignStmt(mkMemberExpression(mkThis(), p.substring(2)),  this.fn.__instance_class.properties[p].generate_asg(decls)));
			}
			
	// handle return type
	if(this.properties['return'])
		body.push(mkReturn(this.properties['return'].generate_asg(decls)));
		
	return this.asg;
};

// generate a store statement for parameter i
FunctionClass.prototype.generateClientObjStore = function(i) {
	var klass = this.client_obj_classes[i],
		tmp_name = klass.mkTempName(),
		body = this.asg.body.body,
		idx;
	
	// compute index at which to insert the store statement
	if(body.length > 0 && body[body.length-1].type === 'ReturnStatement') {
		idx = body.length-1;
	} else {
		idx = body.length;
	}
	
	body.splice(idx, 0, mkAssignStmt(mkIdentifier(tmp_name), mkIdentifier('x' + i)));
};

// called to notify the class that one of its parameters was used somewhere
FunctionClass.prototype.parameterUsed = function(i) {
	if(!this.used_params[i]) {
		this.used_params[i] = true;
		
		// if we've already generated the ASG (or at least started to generate it), we need to patch it up here
		if(this.asg) {
			this.generateClientObjStore(i);
			
			for(var j=this.asg.params.length;j<=i;++j)
				this.asg.params[j] = mkIdentifier('x' + j);
		}
	}
};

exports.FunctionClass = FunctionClass;