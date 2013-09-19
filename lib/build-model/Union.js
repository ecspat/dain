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
    util = require('../dain_util'),
    add = util.add,
    UNDEFINED = require('./PrimitiveModel').UNDEFINED;

/** Union models are used to handle cases where values with different models were
  * seen in the same property (or return value). */
function Union(members) {
	Model.call(this);
	
	/** The set of member models. */
	this.members = [];
	
	/** Set up this.members, making sure to only add every member once. */
	var ids = [], self = this;
	members.forEach(function(member) {
		if(ids.indexOf(member.id) === -1) {
			ids.push(member.id);
			self.members.push(member);
		}
	});
}
Union.prototype = Object.create(Model.prototype);

// filter out members satisfying test
Union.prototype.without = function(test) {
	var new_members = [];
	for(var i=0,n=this.members.length;i<n;++i) {
		if(!test(this.members[i])) {
			new_members.push(this.members[i]);
		}
	}
	
	if(new_members.length === 0) {
		return UNDEFINED;
	} else if(new_members.length === 1) {
		return new_members[0];
	} else {
		return new Union(new_members);
	}
};

/** Factory method for creating unions. If any of the provided members are themselves
  * unions, they are flattened out first. */
Union.make = function(members) {
	if(!members) {
		return UNDEFINED;
	}
	
	var flattened_members = [];
	members.forEach(function(member) {
		if(member instanceof Union) {
			member.members.forEach(function(memmember) {
				add(flattened_members, memmember);
			});
		} else if(member !== UNDEFINED) {
			add(flattened_members, member);
		}
	});
		
	// handle special cases of zero-member and one-member unions
	if(flattened_members.length === 0)
		return UNDEFINED;
	if(flattened_members.length === 1)
		return members[0];
		
	return new Union(flattened_members);
};

/** Its members are a union model's only children. */
Union.prototype.getChildren = function() {
	return this.members;
};

exports.Union = Union;
