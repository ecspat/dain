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

var util = require('../util');
 
var next_id = 0;

function Tag(props) {
	this._id = next_id++;
	
	for(var p in props)
		this[p] = props[p];
}

Tag.cache = [];
Tag.make = function(props) {
	if(props.pos && props.pos.start_offset >= 0) {
		var offset = props.pos.start_offset;
		return Tag.cache[offset] || (Tag.cache[offset] = new Tag(props));
	} else {
		return new Tag(props);
	}
};

Tag.prototype.mkClientObjTag = function(idx) {
	if(!this._client_obj_tags) {
		this._client_obj_tags = [];
	}
	
	return this._client_obj_tags[idx] ||
		  (this._client_obj_tags[idx] = new Tag({
			type: 'clientobj',
			func: this,
			idx: idx
		   }));
};

Tag.prototype.mkNewTag = function() {
	return this._new_tag || (this._new_tag = new Tag({ type: 'new', func: this }));
};

Tag.prototype.mkProtoTag = function() {
	return this._proto_tag || (this._proto_tag = new Tag({ type: 'proto', default_proto_of: this }));
};

Tag.prototype.toString = function(replacer, space) {
	var res = "{ ", fst = true;
	for(var p in this) {
		if(p[0] != '_' && util.hasOwnProperty(this, p)) {
			fst = !fst && !(res += ", ");
			res += '"' + p + '": ';
			if(p === 'pos') {
				res += '{ "start_offset": ' + this.pos.start_offset + ' }';
			} else if(typeof this[p] === 'string') {
				res += '"' + this[p] + '"';
			} else {
				res += this[p];
			}
		}
	}
	return res + " }";
};

exports.Tag = Tag;
exports.GLOBAL = new Tag({ type: 'global' }),
exports.UNDEFINED = new Tag({ type: 'undefined' }),
exports.BOOLEAN = new Tag({ type: 'boolean' }),
exports.NUMBER = new Tag({ type: 'number' }),
exports.STRING = new Tag({ type: 'string' }),
exports.NULL = new Tag({ type: 'null' }),
exports.REGEXP = new Tag({ type: 'regexp' }),
exports.UNKNOWN = new Tag({ type: 'unknown' });
    
exports.UNKNOWN.mkClientObjTag = function() { return this; };
exports.UNKNOWN.mkNewTag = function() { return this; };
exports.UNKNOWN.mkProtoTag = function() { return this; };