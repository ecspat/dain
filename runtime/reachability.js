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

/*global HiddenClass UnionClass InstanceClass*/

HiddenClass.prototype.markReachable = function() {
	this.refcount = (this.refcount || 0) + 1;
	if(this.refcount === 1)
		this.markSuccessors();
};

FunctionClass.prototype.markReachable = function() {
    HiddenClass.prototype.markReachable.call(this);
    for(var p in this.properties)
	if(p.substring(0, 2) === '$$') {
	    var prop = this.properties[p];
	    if(!(prop instanceof ObjClass) || !prop.isEmpty)
		++this.refcount;
	}
};

HiddenClass.prototype.markSuccessors = function() {
	for(var p in this.properties)
		if(this.properties.hasOwnProperty(p))
			this.properties[p].markReachable();
};

UnionClass.prototype.markSuccessors = function() {
	this.members.forEach(function(member) {
		member.markReachable();
	});
};

InstanceClass.prototype.markSuccessors = function() {
	HiddenClass.prototype.markSuccessors.call(this);
	this.fnclass.markReachable();
};