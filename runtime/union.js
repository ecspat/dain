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

/*global HiddenClass UnionClass UNDEFINED*/
	
HiddenClass.prototype.unionWith = function(that) {
	if(this.id === that.id)
		return this;
		
	if(that instanceof UnionClass) {
		var res = this;
		that.members.forEach(function(member) {
			res = res.unionWith(member);
		});
		return res;
	} else {
		return new UnionClass(this, that);
	}
};

UnionClass.prototype.unionWith = function(that) {
	if(that instanceof UnionClass) {
		var res = this;
		that.members.forEach(function(member) {
			res = res.unionWith(member);
		});
		return res;
	} else {
		for(var i=0;i<this.members.length;++i) {
			if(this.members[i].id === that.id)
				return this;
		}
		this.members[i] = that;
		return this;
	}
};
	
UNDEFINED.unionWith = function(klass) {
	return klass;
};