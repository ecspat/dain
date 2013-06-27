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

/*global HiddenClass add mkOr */

/** A UnionClass represents an alternative of several hidden classes. We keep the member
 * classes sorted by ID to ensure canonicity. */
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

UnionClass.prototype.generate_asg = function(decls) {
	if(this.asg)
		return this.asg;

	if(this.members.length === 1) {
		this.asg = this.members[0].generate_asg(decls);
	} else {
		var n = this.members.length;
		this.asg = mkOr(this.members[0].generate_asg(decls), this.members[1].generate_asg(decls));
		for(var i=2;i<n;++i) {
			this.asg = mkOr(this.asg, this.members[i].generate_asg(decls));
		}
	}
	
	this.asg.temp_name = "tmp_" + this.id;

    return this.asg;
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
	
