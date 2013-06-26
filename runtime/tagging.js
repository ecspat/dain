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
 
/*global BOOLEAN NUMBER STRING UNDEFINED NULL REGEXP ObjClass ArrayClass FunctionClass InstanceClass GlobalClass ClientObjClass setHiddenProp Observer isIdentifier array_eq global*/

function getHiddenClass(obj) {
	switch(typeof obj) {
	case "boolean":
		return BOOLEAN;
	case "number":
		return NUMBER;
	case "string":
		return STRING;
	case "undefined":
		return UNDEFINED;
	case "object":
	case "function":
		if(!obj)
			return NULL;
		if(obj instanceof RegExp)
			return REGEXP;
		if(obj.hasOwnProperty('__class'))
			return obj.__class;
		return typeof obj === "object" ? tagObjLit(obj, -1, -1) : tagFn(obj, -1, -1);
	default:
		throw new Error("cannot determine hidden class");
	}
}

function hasHiddenClass(obj) {
	var tp = typeof obj;
	if(tp === 'object' || tp === 'function')
		return !obj || obj.hasOwnProperty('__class');
	return true;
}

function tagGlobal(global) {
	if(!global.hasOwnProperty('__class'))
		setHiddenProp(global, '__class', new GlobalClass(global));
	return global.__class;
}
	
function tagNew(obj, fn) {
	if(!obj.hasOwnProperty('__class') && fn.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', InstanceClass.from(fn));
	return obj.__class;
}
	
function tagFn(fn, line, offset) {
	if(!fn.hasOwnProperty('__class')) {
		var fnclass = FunctionClass.make(fn, line, offset);
	    setHiddenProp(fn, '__class', fnclass);
	    if(fn.prototype)
		    setHiddenProp(fn.prototype, '__class', fnclass.prototype_class);
	}
	return fn.__class;
}
	
function tagObjLit(obj, line, offset) {
	if(!obj.hasOwnProperty('__class'))
		setHiddenProp(obj, '__class', ObjClass.make(obj, line, offset));
	return obj.__class;
}

function tagMember(obj_klass, prop, val) {
	var val_klass = getHiddenClass(val);
	if (!isIdentifier("" + prop))
		prop = "*";
	obj_klass.setPropClass('$$' + prop, val_klass);
}

Observer.prototype.afterObjectExpression = function(pos, obj) {
	tagObjLit(obj, pos.start_line, pos.start_offset);
	var obj_klass = getHiddenClass(obj);
	for(var p in obj) {
		if(obj.hasOwnProperty(p)) {
			var desc = Object.getOwnPropertyDescriptor(obj, p);
			if(!desc.get && !desc.set)
				tagMember(obj_klass, p, obj[p]);
		}
	}
};

Observer.prototype.afterArrayExpression = function(pos, ary) {
	if(!ary.hasOwnProperty('__class'))
		setHiddenProp(ary, '__class', ArrayClass.make(ary, pos.start_line, pos.start_offset));
	var klass = getHiddenClass(ary);
	for(var i=0,n=ary.length;i<n;++i)
		klass.setPropClass('$$' + i, getHiddenClass(ary[i]));
};

Observer.prototype.afterFunctionExpression = function(pos, fn) {
	tagFn(fn, pos.start_line, pos.start_offset);
};

Observer.prototype.atFunctionEntry = function(pos, recv, args) {
	// TODO: replace with more robust test based on tracking function calls/returns
	if(recv instanceof args.callee)
		tagNew(recv, args.callee);
		
	// tag client objects when we first see them
	var fn_class = getHiddenClass(args.callee);
	for(var i=0,n=args.length;i<n;++i) {
		if(!hasHiddenClass(args[i])) {
			setHiddenProp(args[i], '__class', ClientObjClass.make(fn_class, i));
		}
	}
};

Observer.prototype.beforeFunctionCall = function(pos, callee, args) {
	this.beforeCall(pos, null, callee, args, 'function');
};

Observer.prototype.beforeMethodCall = function(pos, obj, prop, _, args) {
	if(obj) {
		var callee = obj[prop];
		// flatten out reflective calls
		if(callee === Function.prototype.call)
			this.beforeCall(pos, args[0], obj, Array.prototype.slice.call(args, 1), 'method');
		else if(callee === Function.prototype.apply)
			this.beforeCall(pos, args[0], obj, args[1], 'method');
		else
			this.beforeCall(pos, obj, callee, args, 'method');
	}
};

Observer.prototype.beforeNewExpression = function(pos, callee, args) {
	this.beforeCall(pos, null, callee, args, 'new');
};

Observer.prototype.beforeCall = function(pos, recv, callee, args, kind) {
	if (typeof callee === 'function' && hasHiddenClass(callee)) {
		var callee_class = getHiddenClass(callee);
		if (callee_class instanceof ClientObjClass) {
			var arg_classes = Array.prototype.map.call(args, getHiddenClass);
			recv = kind === 'method' && getHiddenClass(recv);
			
			// record call, but only if there isn't already an equivalent call
			var global_class = getHiddenClass(global);
			for(var i=0,n=global_class.calls.length;i<n;++i) {
				var call = global_class.calls[i];
				if(call.callee === callee_class && array_eq(call.args, arg_classes) &&
				   call.kind === kind && call.recv === recv)
					return;
			}
			
			global_class.calls.push({
				callee: callee_class,
				recv: recv,
				args: arg_classes,
				kind: kind
			});
		}
	}
};