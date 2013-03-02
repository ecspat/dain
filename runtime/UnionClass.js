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

/*global HiddenClass add*/

function UnionClass() {
	HiddenClass.call(this);
		
	this.members = [];
	for(var i=0;i<arguments.length;++i)
		if(arguments[i] instanceof UnionClass)
			for(var j=0;j<arguments[i].members.length;++j)
				add(this.members, arguments[i].members[j]);
		else
			add(this.members, arguments[i]);
					
	this.members.sort(function(x, y) { return x.id - y.id; });
}
UnionClass.prototype = Object.create(HiddenClass.prototype);
	
UnionClass.prototype.setPropClass = function(prop, klass) {
	this.members.forEach(function(member) {
		member.setPropClass(prop, klass);
	});
};