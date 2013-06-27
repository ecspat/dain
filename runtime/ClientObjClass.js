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
     mkIdentifier = require('./ast').mkIdentifier;

/** This class represents all client objects (including functions) passed as parameter 'i' to
 * function 'fn'. */
function ClientObjClass(fn, i) {
	HiddenClass.call(this);
	this.fn = fn;
	this.index = i;
}
ClientObjClass.prototype = Object.create(HiddenClass.prototype);

ClientObjClass.make = function(fn, i) {
	return fn.client_obj_classes[i] || (fn.client_obj_classes[i] = new ClientObjClass(fn, i));
};

ClientObjClass.prototype.mkTempName = function() {
	return this.fn.mkTempName() + "_" + this.index;
};

ClientObjClass.prototype.generate_asg = function(decls) {
	if (this.asg)
		return mkIdentifier(this.asg.name);

	var tmp_name = this.mkTempName();
	this.asg = mkIdentifier(tmp_name);
	
	// generate declaration for global variable to hold this client object
	if (!decls[0] || decls[0].type !== 'VariableDeclaration') {
		decls.unshift({
			type: 'VariableDeclaration',
			declarations: [],
			kind: 'var'
		});
	}
	decls[0].declarations.push({
		type: 'VariableDeclarator',
		id: mkIdentifier(tmp_name),
		init: null
	});
	
	// notify function that parameter was used
	this.fn.parameterUsed(this.index);
	
	return this.asg;
};

exports.ClientObjClass = ClientObjClass;