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

/*global FunctionClass HiddenClass InstanceClass ObjClass UnionClass PrimitiveClass add*/

var indent_incr = "  ";

function isValidIdentifier(id) {
	return id.match(/^[a-zA-Z$_][a-zA-Z0-9$_]*$/);
}

function quote(str) {
    return "'" + str.replace(/\\/g, "\\\\")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/'/g, "\\'") + "'";
}

function mkMemberExpr(base, prop) {
	if(isValidIdentifier(prop))
		return base + "." + prop;
	else
  	        return base + "[" + quote(prop) + "]";
}

FunctionClass.prototype.pp_prototypical_object = function(decls, indent) {
	var pp = "function fn() {";

	for(var p in this.properties)
		if(p.substring(0, 2) === '$$') {
			var prop_name = p.substring(2);
			var pp_prop_class = this.properties[p].pp(decls, indent + indent_incr);
			// don't print trivial function prototypes
			if(prop_name !== 'prototype' || pp_prop_class !== '{}')
				pp += "\n" + indent + indent_incr + mkMemberExpr("fn", prop_name) + " = " + pp_prop_class + ";";
		}
				
	if(this.fn.__instance_class)
		for(p in this.fn.__instance_class.properties)
			if(p.substring(0, 2) === '$$')
				pp += "\n" + indent + indent_incr + mkMemberExpr("this", p.substring(2)) + " = " +  this.fn.__instance_class.properties[p].pp(decls, indent + indent_incr) + ";";
					
	if(this.properties['return'])
		pp += "\n" + indent + indent_incr + "return " + this.properties['return'].pp(decls, indent + indent_incr) + ";";
			
	if(pp === "function fn() {")
		pp += "}";
	else
		pp += "\n" + indent + "}";
	return pp;
};
	
ObjClass.prototype.pp_prototypical_object = function(decls, indent) {
	var props = "{";
	var first = true;
	for(var p in this.properties)
		if(p.substring(0, 2) === '$$') {
			var prop_name = p.substring(2);
			if(!isValidIdentifier(prop_name))
			    prop_name = quote(prop_name);
				
			if(first) {
				first = false;
				props += "\n";
			} else {
				props += ",\n";
			}
			
			props += indent + indent_incr + prop_name + ": " + this.properties[p].pp(decls, indent_incr);
		}
	if(first)
		props += "}";
	else
		props += "\n" + indent + "}";
	return props;
};
	
InstanceClass.prototype.pp_prototypical_object = function(decls, indent) {
    var pp_fn = this.fnclass.pp(decls, indent);
    return "new " + pp_fn + "()";
};

HiddenClass.pp_cache = {};	
HiddenClass.prototype.pp = function(decls, indent, name) {
    if(this.pp_done) {
	if(this.refcount <= 1)
	    throw new Error("inconsistent refcount: <= 1, yet visited multiple times");
	if(name)
	    decls.push("var " + name + " = " + this.pp_done + ";\n");
	return this.pp_done;
    }
    
    if(this.refcount < 1)
	throw new Error("inconsistent refcount: 0, yet visited");
    
    if(this.refcount === 1 && !name)
	return this.pp_prototypical_object(decls, indent);
    
    this.pp_done = name || this.mkTempName();
    var pp_obj = this.pp_prototypical_object(decls, indent);
    
    var cached = HiddenClass.pp_cache[pp_obj];
    if(cached) {
	this.pp_done = cached;
	if(name)
	    decls.push("var " + name + " = " + cached + ";\n");
    } else {
	HiddenClass.pp_cache[pp_obj] = this.pp_done;
	decls.push("var " + this.pp_done + " = " + pp_obj + ";\n");
    }
    return this.pp_done;
};
	
UnionClass.prototype.pp = function(decls, indent, name) {
    if(this.pp_done)
	return this.pp_done;

    var members_pp = [];
    this.members.forEach(function(member) {
	add(members_pp, member.pp(decls, indent));
    });
    this.pp_done = members_pp.join(" || ");
    if(name) {
	decls.push("var " + name + " = " + this.pp_done + ";\n");
	this.pp_done = name;
    }
    return this.pp_done;
};
	
PrimitiveClass.prototype.pp = function(decls, indent, name) {
    if(name)
	decls.push("var " + name + " = " + this.name + ";\n");
    return this.name;
};

GlobalClass.prototype.pp = function(decls, indent, name) {
    if(this.pp_done) {
	if(name)
	    decls.push("var " + name + " = " + this.pp_done + ";\n");
	return this.pp_done;
    }

    this.pp_done = name || this.mkTempName();
    decls.push("var " + this.pp_done + " = this;\n");
    return this.pp_done;
};