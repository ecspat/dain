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
    ast = require('./ast'),
    mkDecl = ast.mkDecl,
    mkThis = ast.mkThis,
    mkIdentifier = ast.mkIdentifier;

/** Class representing the global object. */
function GlobalClass(global) {
	GlobalClass.GLOBAL = this;
    HiddenClass.call(this);
    this.obj = global;
    this.calls = [];
}
GlobalClass.prototype = Object.create(HiddenClass.prototype);

GlobalClass.prototype.mkTempName = function() {
    return "global_" + this.id;
};

GlobalClass.prototype.generate_asg = function(decls) {
    if(!this.name) {
		this.name = this.mkTempName();
		decls.push(mkDecl(this.name, mkThis()));
    }
	return mkIdentifier(this.name);
};

exports.GlobalClass = GlobalClass;