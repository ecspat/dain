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
    util = require('./util'),
    add = util.add,
    UNDEFINED = require('./PrimitiveModel').UNDEFINED;

function Union(members) {
	Model.call(this);
	this.members = [];
	
	var ids = [], self = this;
	members.forEach(function(member) {
		if(ids.indexOf(member.id) === -1) {
			ids.push(member.id);
			self.members.push(member);
		}
	});
}

Union.cache = {};

Union.signature = function(members) {
	var ids = [];
	members.forEach(function(member) {
		add(ids, member.id);
	});
	return ids.sort().join(',');
};

Union.make = function(members) {
	if(members.length === 0)
		return UNDEFINED;
	if(members.length === 1)
		return members[0];
		
	// if any of the members are themselves unions, flatten them out first
	var flattened_members = [];
	members.forEach(function(member) {
		if(member instanceof Union) {
			member.members.forEach(function(memmember) {
				add(flattened_members, memmember);
			});
		} else {
			add(flattened_members, member);
		}
	});
		
	/*var sig = Union.signature(members),
	    model = Union.cache[sig];
	
	if(!model) {
		Union.cache[sig] = model = new Union(members);
	}
	
	return model;*/
	return new Union(flattened_members);
};

exports.Union = Union;