// The MIT License (MIT)

// Copyright (c) 2014 Vladimir Agafonkin. Original: https://github.com/Leaflet/Leaflet/tree/master/src/core
// Copyright (c) 2014 @kosjoli           

// access is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this access notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// _____class.js___________________________________________________________________ 
// Taken from Class.js in Leaflet.js by Vladimir Agafonkin, @LeafletJS

Wu = {};
Wu.Class = function () {};
Wu.Class.extend = function (props) {

	// extended class with the new prototype
	var NewClass = function () {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		if (this._initHooks.length) {
			this.callInitHooks();
		}
	};

	// jshint camelcase: false
	var parentProto = NewClass.__super__ = this.prototype;

	var proto = Wu.Util.create(parentProto);
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	//inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		Wu.extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		Wu.Util.extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (proto.options) {
		props.options = Wu.Util.extend(Wu.Util.create(proto.options), props.options);
	}

	// mix given properties into the prototype
	Wu.extend(proto, props);

	proto._initHooks = [];

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) { return; }

		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};

// method for adding properties to prototype
Wu.Class.include = function (props) {
	Wu.extend(this.prototype, props);
};

// merge new default options to the Class
Wu.Class.mergeOptions = function (options) {
	Wu.extend(this.prototype.options, options);
};

// add a constructor hook
Wu.Class.addInitHook = function (fn) { // (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
};





/*
 * L.Util contains various utility functions used throughout Leaflet code.
 * https://github.com/Leaflet/Leaflet/blob/master/src/core/Util.js
██╗   ██╗████████╗██╗██╗     
██║   ██║╚══██╔══╝██║██║     
██║   ██║   ██║   ██║██║     
██║   ██║   ██║   ██║██║     
╚██████╔╝   ██║   ██║███████╗
 ╚═════╝    ╚═╝   ╚═╝╚══════╝
*/
Wu.Util = {
	// extend an object with properties of one or more other objects
	extend: function (dest) {
		var sources = Array.prototype.slice.call(arguments, 1),
		    i, j, len, src;

		for (j = 0, len = sources.length; j < len; j++) {
			src = sources[j];
			for (i in src) {
				dest[i] = src[i];
			}
		}
		return dest;
	},

	// create an object from a given prototype
	create: Object.create || (function () {
		function F() {}
		return function (proto) {
			F.prototype = proto;
			return new F();
		};
	})(),

	// bind a function to be called with a given context
	bind: function (fn, obj) {
		var slice = Array.prototype.slice;

		if (fn.bind) {
			return fn.bind.apply(fn, slice.call(arguments, 1));
		}

		var args = slice.call(arguments, 2);

		return function () {
			return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
		};
	},

	// return unique ID of an object
	stamp: function (obj) {
		// jshint camelcase: false
		obj._leaflet_id = obj._leaflet_id || ++Wu.Util.lastId;
		return obj._leaflet_id;
	},

	lastId: 0,

	// return a function that won't be called more often than the given interval
	throttle: function (fn, time, context) {
		var lock, args, wrapperFn, later;

		later = function () {
			// reset lock and call if queued
			lock = false;
			if (args) {
				wrapperFn.apply(context, args);
				args = false;
			}
		};

		wrapperFn = function () {
			if (lock) {
				// called too soon, queue to call later
				args = arguments;

			} else {
				// call and lock until later
				fn.apply(context, arguments);
				setTimeout(later, time);
				lock = true;
			}
		};

		return wrapperFn;
	},

	// wrap the given number to lie within a certain range (used for wrapping longitude)
	wrapNum: function (x, range, includeMax) {
		var max = range[1],
		    min = range[0],
		    d = max - min;
		return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
	},

	// do nothing (used as a noop throughout the code)
	falseFn: function () { return false; },

	// round a given number to a given precision
	formatNum: function (num, digits) {
		var pow = Math.pow(10, digits || 5);
		return Math.round(num * pow) / pow;
	},

	// trim whitespace from both sides of a string
	trim: function (str) {
		return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
	},

	trimAll : function (str) {
		return str.replace(/\s+/g, '');
	},

	// split a string into words
	splitWords: function (str) {
		return Wu.Util.trim(str).split(/\s+/);
	},

	// set options to an object, inheriting parent's options as well
	setOptions: function (obj, options) {
		if (!obj.hasOwnProperty('options')) {
			obj.options = obj.options ? Wu.Util.create(obj.options) : {};
		}
		for (var i in options) {
			obj.options[i] = options[i];
		}
		return obj.options;
	},

	// make an URL with GET parameters out of a set of properties/values
	getParamString: function (obj, existingUrl, uppercase) {
		var params = [];
		for (var i in obj) {
			params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
		}
		return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
	},

	// super-simple templating facility, used for TileLayer URLs
	template: function (str, data) {
		return str.replace(Wu.Util.templateRe, function (str, key) {
			var value = data[key];

			if (value === undefined) {
				throw new Error('No value provided for variable ' + str);

			} else if (typeof value === 'function') {
				value = value(data);
			}
			return value;
		});
	},

	templateRe: /\{ *([\w_]+) *\}/g,

	// minimal image URI, set to an image when disposing to flush memory
	emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',

	isArray: Array.isArray || function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Array]');
	},

	isObject: function (obj) {
		return (Object.prototype.toString.call(obj) === '[object Object]');
	},

	capitalize : function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	setAddressBar : function (string) {
		window.history.pushState( {} , '', string );
	},

	checkDisconnect : function (response) {
		var string = response.substring(0,15);
		if (string == '<!doctype html>')  {
			
			// we got a disconnect!!!
			// app.feedback.setError({
			// 	title : 'You have been logged out.', 
			// 	description : 'Please reload the page to log back in.',
			// 	clearTimer : false
			// });

			app._login('You have been logged out. Please log back in.')

			return false;
		}

		return true;
	},

	debugXML : function (json) {
		console.log('==== debugXML ====');

		var obj = Wu.parse(json);
		obj ? console.log(obj) : console.log(json);

		console.log('==================');
	},

	verifyResponse : function (response) {
		
		// print response if debug
		if (app.debug) Wu.Util.debugXML(response);

		// check for disconnect (<html> response)
		return Wu.Util.checkDisconnect(response);
		
	},

	// post without callback
	post : function (path, json, done) {
		// var that = this,
		//     http = new XMLHttpRequest(),
		//     url = Wu.Util._getServerUrl(); 
		// url += path;
		
		// http.open("POST", url, true);

		// //Send the proper header information along with the request
		// http.setRequestHeader("Content-type", "application/json");

		// // set access_token on header
		// http.setRequestHeader("Authorization", "Bearer " + app.tokens.access_token);

		// http.onreadystatechange = function() {
		// 	if(http.readyState == 4 && http.status == 200) {
		// 		var valid = Wu.verify(http.responseText);
		// 	}
		// }
		// http.send(json);
		var http = new XMLHttpRequest();
		var url = Wu.Util._getServerUrl();
		url += path;

		// open
		http.open("POST", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText); 
				} else {
					console.log('http.status: ', http.status);
					console.log('httP', http);
					Wu.Util.checkDisconnect(http.responseText);
					done && done(http.status, http.responseText);
				}
			}

		};

		// add access_token to request
		var access_token = app.tokens ? app.tokens.access_token : null;
		var options = _.isString(json) ? Wu.parse(json) : json;
		options.access_token = access_token;
		var send_json = Wu.stringify(options);

		// send
		http.send(send_json);

		console.error('deprecated: move to api.js');
	},

	// post with callback
	postcb : function (path, json, done, context, baseurl) {
		var http = new XMLHttpRequest();
		var url = baseurl || Wu.Util._getServerUrl();
		url += path;

		// open
		http.open("POST", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText); 
				} else {
					console.log('http.status: ', http.status);
					console.log('httP', http);
					Wu.Util.checkDisconnect(http.responseText);
					done && done(http.status, http.responseText);
				}
			}

		};

		// add access_token to request
		var access_token = app.tokens ? app.tokens.access_token : null;
		var options = _.isString(json) ? Wu.parse(json) : json;
		options.access_token = access_token;
		var send_json = Wu.stringify(options);

		// send
		http.send(send_json);

		console.error('deprecated: move to api.js');

		// var that = context,
		//     http = new XMLHttpRequest(),
		//     url = baseurl || Wu.Util._getServerUrl();
		
		// url += path;

		// http.open("POST", url, true);

		// //Send the proper header information along with the request
		// http.setRequestHeader('Content-type', 'application/json');

		// // set access_token on header
		// http.setRequestHeader("Authorization", "Bearer " + app.tokens.access_token);

		// http.onreadystatechange = function() {
		// 	if(http.readyState == 4 && http.status == 200) {

		// 		// verify response
		// 		var valid = Wu.verify(http.responseText);

		// 		// callback
		// 		if (cb && valid) cb(context, http.responseText); 
		// 	}
		// }

		// // stringify objects
		// if (Wu.Util.isObject(json)) json = JSON.stringify(json);

		// http.send(json);
	},


	
	// post with callback and error handling (do callback.bind(this) for context)
	send : function (path, json, done) {
		// var that = this;
		// var http = new XMLHttpRequest();
		// var url = Wu.Util._getServerUrl();
		// url += path;

		// http.open("POST", url, true);
		// http.setRequestHeader('Content-type', 'application/json');

		// // set access_token on header
		// http.setRequestHeader("Authorization", "Bearer " + app.tokens.access_token);

		// http.onreadystatechange = function() {
		// 	if (http.readyState == 4) {
		    		
		// 		var valid = Wu.verify(http.responseText);

		// 		if (http.status == 200 && valid) { // ok
		// 			if (callback) callback(null, http.responseText); 
		// 		} else { 
		// 			if (callback) callback(http.status);
		// 		}
		// 	}
		// }
		
		// // stringify objects
		// if (Wu.Util.isObject(json)) json = JSON.stringify(json);
		
		// // send string
		// http.send(json);
		var http = new XMLHttpRequest();
		var url = Wu.Util._getServerUrl();
		url += path;

		// open
		http.open("POST", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText); 
				} else {
					console.log('http.status: ', http.status);
					console.log('httP', http);
					Wu.Util.checkDisconnect(http.responseText);
					done && done(http.status, http.responseText);
				}
			}

		}

		// add access_token to request
		var access_token = app.tokens ? app.tokens.access_token : null;
		var options = _.isString(json) ? Wu.parse(json) : json;
		options.access_token = access_token;
		var send_json = Wu.stringify(options);

		// send
		http.send(send_json);

		console.error('deprecated: move to api.js');

	},


	

	_getServerUrl : function () {
		// return window.location.origin;
		return app.options.servers.portal.slice(0,-1);
	},

	// get with callback
	_getJSON : function (url, callback) {
		var http = new XMLHttpRequest();
		http.open("GET", url, true);

		//Send the proper header information along with the request
		http.setRequestHeader("Content-type", "application/json");

		http.onreadystatechange = function() {
		    if(http.readyState == 4 && http.status == 200) {
			var valid = Wu.verify(http.responseText);
			
			if (valid) callback(http.responseText); 
		    }
		}
		http.send(null);
	},
	

	// parse with error handling
	_parse : function (json) {
		try { 
			var obj = JSON.parse(json); 
			return obj;
		} catch (e) { 
			return false; 
		}

	},

	// parse with error handling
	_stringify : function (json) {
		try { 
			var str = JSON.stringify(json); 
			return str;
		} catch (e) { 
			return false; 
		}
	},

	_getParentClientID : function (pid) {
		var cid = '';
		for (c in Wu.app.Clients) {
			var client = Wu.app.Clients[c];
			client.projects.forEach(function(elem, i, arr) {
				if (elem == pid) { cid = client.uuid; }
			});
		}
		if (!cid) { cid = Wu.app._activeClient.uuid; }
		return cid;
	},

	// create uuid.v4() with optional prefix
	guid : function (prefix) {
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		if (prefix) { return prefix + '-' + uuid };
		return uuid;
	},

	createRandom : function (digits) {
		return Math.random().toString(36).slice((digits) * -1).toUpperCase()
	},

	getRandomChars : function (len, charSet) {
		charSet = charSet || 'abcdefghijklmnopqrstuvwxyz';
		var randomString = '';
		for (var i = 0; i < len; i++) {
			var randomPoz = Math.floor(Math.random() * charSet.length);
			randomString += charSet.substring(randomPoz,randomPoz+1);
		}
		return randomString;
	},

	deselectText : function () {
		var selection = ('getSelection' in window)
		? window.getSelection()
		: ('selection' in document)
		? document.selection
		: null;
		if ('removeAllRanges' in selection) selection.removeAllRanges();
		else if ('empty' in selection) selection.empty();
	},

	// experimental zip fn's
	generateZip : function (data) {

		if (!typeof data == 'string') {
			data = JSON.stringify(data);
		}

		var compressed = LZString.compress(data);

		return compressed;

	},

	zipSave : function (path, json) {

		if (!typeof json == 'string') {
			var string = JSON.stringify(json);
		} else {
			var string = json;
		}

		var my_lzma = new LZMA('//85.10.202.87:8080/js/lib/lzma/lzma_worker.js');
		my_lzma.compress(string, 1, function (result) {
		       
			var string = JSON.stringify(result);

			var http = new XMLHttpRequest();
			var url = window.location.origin; //"http://85.10.202.87:8080/";// + path;//api/project/update";
			url += path;
			http.open("POST", url, true);

			//Send the proper header information along with the request
			//http.setRequestHeader("Content-type", "application/json");

			http.onreadystatechange = function() {
				if(http.readyState == 4 && http.status == 200) {
					// console.log(http.responseText);
				}
			}
			http.send(string);



		}, 

		function (percent) {
			// console.log('lzma progress: ', percent);
		});

		

	},

	zippedSave : function () {



	},

	
	prettyDate : function(date, compareTo){
		/*
		 * Javascript Humane Dates
		 * Copyright (c) 2008 Dean Landolt (deanlandolt.com)
		 * Re-write by Zach Leatherman (zachleat.com)
		 * Refactor by Chris Pearce (github.com/Chrisui)
		 *
		 * Adopted from the John Resig's pretty.js
		 * at http://ejohn.org/blog/javascript-pretty-date
		 * and henrah's proposed modification
		 * at http://ejohn.org/blog/javascript-pretty-date/#comment-297458
		 *
		 * Licensed under the MIT license.
		*/

		function normalize(val, single)
		{
			var margin = 0.1;
			if(val >= single && val <= single * (1+margin)) {
				return single;
			}
			return val;
		}

		if(!date) {
			return;
		}

		var lang = {
			ago: 'Ago',
			from: '',
			now: 'Just Now',
			minute: 'Minute',
			minutes: 'Minutes',
			hour: 'Hour',
			hours: 'Hours',
			day: 'Day',
			days: 'Days',
			week: 'Week',
			weeks: 'Weeks',
			month: 'Month',
			months: 'Months',
			year: 'Year',
			years: 'Years'
		},
		formats = [
			[60, lang.now],
			[3600, lang.minute, lang.minutes, 60], // 60 minutes, 1 minute
			[86400, lang.hour, lang.hours, 3600], // 24 hours, 1 hour
			[604800, lang.day, lang.days, 86400], // 7 days, 1 day
			[2628000, lang.week, lang.weeks, 604800], // ~1 month, 1 week
			[31536000, lang.month, lang.months, 2628000], // 1 year, ~1 month
			[Infinity, lang.year, lang.years, 31536000] // Infinity, 1 year
		];

		var isString = typeof date == 'string',
			date = isString ?
						new Date(('' + date).replace(/-/g,"/").replace(/T|(?:\.\d+)?Z/g," ")) :
						date,
			compareTo = compareTo || new Date,
			seconds = (compareTo - date +
							(compareTo.getTimezoneOffset() -
								// if we received a GMT time from a string, doesn't include time zone bias
								// if we got a date object, the time zone is built in, we need to remove it.
								(isString ? 0 : date.getTimezoneOffset())
							) * 60000
						) / 1000,
			token;

		if(seconds < 0) {
			seconds = Math.abs(seconds);
			token = lang.from ? ' ' + lang.from : '';
		} else {
			token = lang.ago ? ' ' + lang.ago : '';
		}

		for(var i = 0, format = formats[0]; formats[i]; format = formats[++i]) {
			if(seconds < format[0]) {
				if(i === 0) {
					// Now
					return format[1];
				}

				var val = Math.ceil(normalize(seconds, format[3]) / (format[3]));
				return val +
						' ' +
						(val != 1 ? format[2] : format[1]) +
						(i > 0 ? token : '');
			}
		}
	},


	stripAccents : function (str) {
		/**
		* Normalise a string replacing foreign characters
		*
		* @param {String} str
		* @return {String}
		*/

		var map = {
			"À": "A",
			"Á": "A",
			"Â": "A",
			"Ã": "A",
			"Ä": "A",
			"Å": "A",
			"Æ": "AE",
			"Ç": "C",
			"È": "E",
			"É": "E",
			"Ê": "E",
			"Ë": "E",
			"Ì": "I",
			"Í": "I",
			"Î": "I",
			"Ï": "I",
			"Ð": "D",
			"Ñ": "N",
			"Ò": "O",
			"Ó": "O",
			"Ô": "O",
			"Õ": "O",
			"Ö": "O",
			"Ø": "O",
			"Ù": "U",
			"Ú": "U",
			"Û": "U",
			"Ü": "U",
			"Ý": "Y",
			"ß": "s",
			"à": "a",
			"á": "a",
			"â": "a",
			"ã": "a",
			"ä": "a",
			"å": "a",
			"æ": "ae",
			"ç": "c",
			"è": "e",
			"é": "e",
			"ê": "e",
			"ë": "e",
			"ì": "i",
			"í": "i",
			"î": "i",
			"ï": "i",
			"ñ": "n",
			"ò": "o",
			"ó": "o",
			"ô": "o",
			"õ": "o",
			"ö": "o",
			"ø": "o",
			"ù": "u",
			"ú": "u",
			"û": "u",
			"ü": "u",
			"ý": "y",
			"ÿ": "y",
			"Ā": "A",
			"ā": "a",
			"Ă": "A",
			"ă": "a",
			"Ą": "A",
			"ą": "a",
			"Ć": "C",
			"ć": "c",
			"Ĉ": "C",
			"ĉ": "c",
			"Ċ": "C",
			"ċ": "c",
			"Č": "C",
			"č": "c",
			"Ď": "D",
			"ď": "d",
			"Đ": "D",
			"đ": "d",
			"Ē": "E",
			"ē": "e",
			"Ĕ": "E",
			"ĕ": "e",
			"Ė": "E",
			"ė": "e",
			"Ę": "E",
			"ę": "e",
			"Ě": "E",
			"ě": "e",
			"Ĝ": "G",
			"ĝ": "g",
			"Ğ": "G",
			"ğ": "g",
			"Ġ": "G",
			"ġ": "g",
			"Ģ": "G",
			"ģ": "g",
			"Ĥ": "H",
			"ĥ": "h",
			"Ħ": "H",
			"ħ": "h",
			"Ĩ": "I",
			"ĩ": "i",
			"Ī": "I",
			"ī": "i",
			"Ĭ": "I",
			"ĭ": "i",
			"Į": "I",
			"į": "i",
			"İ": "I",
			"ı": "i",
			"Ĳ": "IJ",
			"ĳ": "ij",
			"Ĵ": "J",
			"ĵ": "j",
			"Ķ": "K",
			"ķ": "k",
			"Ĺ": "L",
			"ĺ": "l",
			"Ļ": "L",
			"ļ": "l",
			"Ľ": "L",
			"ľ": "l",
			"Ŀ": "L",
			"ŀ": "l",
			"Ł": "l",
			"ł": "l",
			"Ń": "N",
			"ń": "n",
			"Ņ": "N",
			"ņ": "n",
			"Ň": "N",
			"ň": "n",
			"ŉ": "n",
			"Ō": "O",
			"ō": "o",
			"Ŏ": "O",
			"ŏ": "o",
			"Ő": "O",
			"ő": "o",
			"Œ": "OE",
			"œ": "oe",
			"Ŕ": "R",
			"ŕ": "r",
			"Ŗ": "R",
			"ŗ": "r",
			"Ř": "R",
			"ř": "r",
			"Ś": "S",
			"ś": "s",
			"Ŝ": "S",
			"ŝ": "s",
			"Ş": "S",
			"ş": "s",
			"Š": "S",
			"š": "s",
			"Ţ": "T",
			"ţ": "t",
			"Ť": "T",
			"ť": "t",
			"Ŧ": "T",
			"ŧ": "t",
			"Ũ": "U",
			"ũ": "u",
			"Ū": "U",
			"ū": "u",
			"Ŭ": "U",
			"ŭ": "u",
			"Ů": "U",
			"ů": "u",
			"Ű": "U",
			"ű": "u",
			"Ų": "U",
			"ų": "u",
			"Ŵ": "W",
			"ŵ": "w",
			"Ŷ": "Y",
			"ŷ": "y",
			"Ÿ": "Y",
			"Ź": "Z",
			"ź": "z",
			"Ż": "Z",
			"ż": "z",
			"Ž": "Z",
			"ž": "z",
			"ſ": "s",
			"ƒ": "f",
			"Ơ": "O",
			"ơ": "o",
			"Ư": "U",
			"ư": "u",
			"Ǎ": "A",
			"ǎ": "a",
			"Ǐ": "I",
			"ǐ": "i",
			"Ǒ": "O",
			"ǒ": "o",
			"Ǔ": "U",
			"ǔ": "u",
			"Ǖ": "U",
			"ǖ": "u",
			"Ǘ": "U",
			"ǘ": "u",
			"Ǚ": "U",
			"ǚ": "u",
			"Ǜ": "U",
			"ǜ": "u",
			"Ǻ": "A",
			"ǻ": "a",
			"Ǽ": "AE",
			"ǽ": "ae",
			"Ǿ": "O",
			"ǿ": "o"
		};

		var nonWord = /\W/g;

		var mapping = function (c) {
			return map[c] || c; 
		};

		
		return str.replace(nonWord, mapping);
	},

	bytesToSize : function (bytes) {
		var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		if (bytes == 0) return '0 Byte';
		var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
	},

	parseUrl : function () {
		var query = window.location.search.substr(1);
		var result = {};
		query.split("&").forEach(function(part) {
			var item = part.split("=");
			if (item[0] != '') {
				result[item[0]] = decodeURIComponent(item[1]);
			}
		});
		if (_.size(result)) return result;
		return false;
	},


	getWindowSize : function () {

		var size = {
			width : window.innerWidth,
			height : window.innerHeight
		}

		return size;
	},


	setStyle : function (tag, rules) {

		// set rules 
		jss.set(tag, rules);

		// eg: 
		// jss.set('img', {
		// 	'border-top': '1px solid red',
		// 	'border-left': '1px solid red'
		// });
		// https://github.com/Box9/jss
	},

	getStyle : function (tag) {
		return jss.getAll(tag);
	},


	confirm : function (msg, callback) {

		var confirmed = confirm(msg);

		callback && callback(confirmed);

		return confirmed;
	},
	

	isMobile : function  () {
		
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			var isMobile = {};
			isMobile.userAgent = navigator.userAgent;
			// OBS! Perhaps this loads too early... it often gives the wrong number, for some reason...
			// isMobile.width = window.innerWidth ||
			// 		 document.documentElement.clientWidth ||
			// 		 document.body.clientWidth ||
			// 		 document.body.offsetWidth;
			isMobile.width = screen.width;
			isMobile.height = screen.height;
			var ismobile = (/iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(navigator.userAgent.toLowerCase()));
			var istablet = (/ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(navigator.userAgent.toLowerCase()));
			isMobile.tablet = istablet;
			isMobile.mobile = ismobile;
		} else {
			var isMobile = false;
		}

		return isMobile;

	}


	
};

(function () {
	// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

	function getPrefixed(name) {
		return window['webkit' + name] || window['moz' + name] || window['ms' + name];
	}

	var lastTime = 0;

	// fallback for IE 7-8
	function timeoutDefer(fn) {
		var time = +new Date(),
		    timeToCall = Math.max(0, 16 - (time - lastTime));

		lastTime = time + timeToCall;
		return window.setTimeout(fn, timeToCall);
	}

	var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer,
	    cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
		       getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };


	Wu.Util.requestAnimFrame = function (fn, context, immediate, element) {
		if (immediate && requestFn === timeoutDefer) {
			fn.call(context);
		} else {
			return requestFn.call(window, Wu.bind(fn, context), element);
		}
	};

	Wu.Util.cancelAnimFrame = function (id) {
		if (id) {
			cancelFn.call(window, id);
		}
	};
})();

// shortcuts for most used utility functions
Wu.extend = Wu.Util.extend;
Wu.bind = Wu.Util.bind;
Wu.stamp = Wu.Util.stamp;
Wu.setOptions = Wu.Util.setOptions;
Wu.save = Wu.Util.post;
Wu.post = Wu.Util.postcb;
Wu.send = Wu.Util.send;
Wu.parse = Wu.Util._parse;
Wu.stringify = Wu.Util._stringify;
Wu.zip = Wu.Util.generateZip;
Wu.zave = Wu.Util.zipSave;
Wu.can = Wu.Util.can;
Wu.setStyle = Wu.Util.setStyle;
Wu.getStyle = Wu.Util.getStyle;
Wu.verify = Wu.Util.verifyResponse;
Wu.getJSON = Wu.Util._getJSON;
Wu.confirm = Wu.Util.confirm;


Wu.Events = Wu.Class.extend({

	on: function (types, fn, context) {

		// types can be a map of types/handlers
		if (typeof types === 'object') {
			for (var type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}

		} else {
			// types can be a string of space-separated words
			types = Wu.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	off: function (types, fn, context) {

		if (!types) {
			// clear all listeners if called without arguments
			delete this._events;

		} else if (typeof types === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}

		} else {
			types = Wu.Util.splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on: function (type, fn, context) {

		var events = this._events = this._events || {},
		    contextId = context && context !== this && Wu.stamp(context);

		if (contextId) {
			// store listeners with custom context in a separate hash (if it has an id);
			// gives a major performance boost when firing and removing events (e.g. on map object)

			var indexKey = type + '_idx',
			    indexLenKey = type + '_len',
			    typeIndex = events[indexKey] = events[indexKey] || {},
			    id = Wu.stamp(fn) + '_' + contextId;

			if (!typeIndex[id]) {
				typeIndex[id] = {fn: fn, ctx: context};

				// keep track of the number of keys in the index to quickly check if it's empty
				events[indexLenKey] = (events[indexLenKey] || 0) + 1;
			}

		} else {
			// individual layers mostly use "this" for context and don't fire listeners too often
			// so simple array makes the memory footprint better while not degrading performance

			events[type] = events[type] || [];
			events[type].push({fn: fn});
		}
	},

	_off: function (type, fn, context) {
		var events = this._events,
		    indexKey = type + '_idx',
		    indexLenKey = type + '_len';

		if (!events) { return; }

		if (!fn) {
			// clear all listeners for a type if function isn't specified
			delete events[type];
			delete events[indexKey];
			delete events[indexLenKey];
			return;
		}

		var contextId = context && context !== this && Wu.stamp(context),
		    listeners, i, len, listener, id;

		if (contextId) {
			id = Wu.stamp(fn) + '_' + contextId;
			listeners = events[indexKey];

			if (listeners && listeners[id]) {
				listener = listeners[id];
				delete listeners[id];
				events[indexLenKey]--;
			}

		} else {
			listeners = events[type];

			if (listeners) {
				for (i = 0, len = listeners.length; i < len; i++) {
					if (listeners[i].fn === fn) {
						listener = listeners[i];
						listeners.splice(i, 1);
						break;
					}
				}
			}
		}

		// set the removed listener to noop so that's not called if remove happens in fire
		if (listener) {
			listener.fn = Wu.Util.falseFn;
		}
	},

	fire: function (type, data, propagate) {
		if (!this.listens(type, propagate)) { return this; }

		var event = Wu.Util.extend({}, data, {type: type, target: this}),
		    events = this._events;

		if (events) {
		    var typeIndex = events[type + '_idx'],
			i, len, listeners, id;

			if (events[type]) {
				// make sure adding/removing listeners inside other listeners won't cause infinite loop
				listeners = events[type].slice();

				for (i = 0, len = listeners.length; i < len; i++) {
					listeners[i].fn.call(this, event);
				}
			}

			// fire event for the context-indexed listeners as well
			for (id in typeIndex) {
				typeIndex[id].fn.call(typeIndex[id].ctx, event);
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	listens: function (type, propagate) {
		var events = this._events;

		if (events && (events[type] || events[type + '_len'])) { return true; }

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) { return true; }
			}
		}
		return false;
	},

	once: function (types, fn, context) {

		if (typeof types === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		var handler = Wu.bind(function () {
			this
			    .off(types, fn, context)
			    .off(types, handler, context);
		}, this);

		// add a listener that's executed once and removed after that
		return this
		    .on(types, fn, context)
		    .on(types, handler, context);
	},

	// adds a parent to propagate events to (when you fire with true as a 3rd argument)
	addEventParent: function (obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[Wu.stamp(obj)] = obj;
		return this;
	},

	removeEventParent: function (obj) {
		if (this._eventParents) {
			delete this._eventParents[Wu.stamp(obj)];
		}
		return this;
	},

	_propagateEvent: function (e) {
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, Wu.extend({layer: e.target}, e), true);
		}
	},


	bytesToSize : function (bytes) {
		   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		   if (bytes == 0) return '0 Byte';
		   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
	}


});

var proto = Wu.Events.prototype;

// aliases; we should ditch those eventually
proto.addEventListener = proto.on;
proto.removeEventListener = proto.clearAllEventListeners = proto.off;
proto.addOneTimeEventListener = proto.once;
proto.fireEvent = proto.fire;
proto.hasEventListeners = proto.listens;


Wu.Mixin = {Events: proto};

Wu._on = proto.on;
Wu._off = proto.off;
Wu._fire = proto.fire;


// DOM Utilities
Wu.DomUtil = {

	get: function (id) {
	       return typeof id === 'string' ? document.getElementById(id) : id;
	},

	getStyle: function (el, style) {

		var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

		if ((!value || value === 'auto') && document.defaultView) {
		    var css = document.defaultView.getComputedStyle(el, null);
		    value = css ? css[style] : null;
		}

		return value === 'auto' ? null : value;
	},

	create: function (tagName, className, container, content) {

		var el = document.createElement(tagName);
		el.className = className;

		if (container) {
			container.appendChild(el);
		}

		if (content) {
			if (tagName == 'input') {
				el.setAttribute('placeholder', content);
			} else if (tagName == 'image') {
				el.src = content;
			} else if (tagName == 'img') {
				el.src = content;
			} else {
				el.innerHTML = content;
			}
		}

		return el;
	},

	makeit : function (m) {

		var hook = document.createElement(m.type);
		if ( m.id ) { hook.id = m.id; }
		if ( m.cname ) { hook.className = m.cname; }
		if ( m.style ) { hook.setAttribute("style", m.style) }	
		if ( m.hlink ) { hook.setAttribute("href", m.hlink); }
		if ( m.source ) { hook.src = m.source }
		if ( m.inner ) { hook.innerHTML = m.inner; }
		if ( m.appendto ) { m.appendto.appendChild(hook); }
		if ( m.attr ) { m.attr.forEach(function(att) { hook.setAttribute(att[0], att[1]) }) }
		return hook;

	},
	
	createId : function(tagName, id, container) {
		// https://github.com/Leaflet/Leaflet/blob/master/src/dom/DomUtil.js
		
		var el = document.createElement(tagName);
		el.id = id;

		if (container) {
			container.appendChild(el);
		}

		return el;

	},

	remove: function (el) {
		var parent = el.parentNode;
		if (parent) {
		    parent.removeChild(el);
		}
	},

	toFront: function (el) {
		el.parentNode.appendChild(el);
	},

	toBack: function (el) {
		var parent = el.parentNode;
		parent.insertBefore(el, parent.firstChild);
	},

	hasClass: function (el, name) {
		if (el.classList !== undefined) {
		    return el.classList.contains(name);
		}
		var className = Wu.DomUtil.getClass(el);
		return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
	},

	addClass: function (el, name) {
		if (!el) return console.error('addClass: div undefined. fix!');
		if (el.classList !== undefined) {
		    var classes = Wu.Util.splitWords(name);
		    for (var i = 0, len = classes.length; i < len; i++) {
			el.classList.add(classes[i]);
		    }
		} else if (!Wu.DomUtil.hasClass(el, name)) {
		    var className = Wu.DomUtil.getClass(el);
		    Wu.DomUtil.setClass(el, (className ? className + ' ' : '') + name);
		}
	},

	removeClass: function (el, name) {
		if (!el) return console.error('removeClass: div undefined. fix!');
		if (el.classList !== undefined) {
		    el.classList.remove(name);
		} else {
		    Wu.DomUtil.setClass(el, Wu.Util.trim((' ' + Wu.DomUtil.getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
		}
	},


	classed: function(el, name, bol) {
		if ( !bol ) {
			this.removeClass(el,name);
		} else {
			this.addClass(el,name);
		}
	},	

	clearChildClasses : function (parent, divclass) {
		for (var i=0; i < parent.children.length; i++) {
			var child = parent.children[i];
			Wu.DomUtil.removeClass(child, divclass);
		}
	},

	setClass: function (el, name) {
		if (el.className.baseVal === undefined) {
		    el.className = name;
		} else {
		    // in case of SVG element
		    el.className.baseVal = name;
		}
	},

	getClass: function (el) {
		return el.className.baseVal === undefined ? el.className : el.className.baseVal;
	},

	appendTemplate : function (container, template) {
		if (typeof template === 'string') {
			var holder = Wu.DomUtil.create('div');
			holder.innerHTML = template;
			for (i=0; i < holder.childNodes.length; i++) {
				container.appendChild(holder.childNodes[i]);
			}
		}
		return container;
	},

	prependTemplate : function (container, template, firstsibling) {
		if (typeof template === 'string') {
			var holder = Wu.DomUtil.create('div');
			holder.innerHTML = template;
			if (firstsibling) {
			    var firstChild = container.firstChild;
			} else {
			    var firstChild = container.firstChild.nextSibling;
			}
			for (i=0; i < holder.childNodes.length; i++) {
				container.insertBefore(holder.childNodes[i], firstChild);
			}
		}
		return container;
	},

	thumbAdjust : function (imgContainer, dimentions) {

		// Plasserer thumbs sentrert i container
		// avhengig av kvadratisk ramme!

		var img = new Image();
		img.src = imgContainer.src;
		
		img.onload = function() {
			
			var w = this.width;
			var h = this.height;
			var wProp = w/dimentions;
			var hProp = h/dimentions;

			var portrait = true;
			if ( w>=h ) portrait = false;

			// Plassere bildet i boksen
			if ( !portrait ) {
				imgContainer.style.height = '100%';
				imgContainer.style.left = - Math.floor(wProp)/2 + 'px';
			} else {
				imgContainer.style.width = '100%';
				imgContainer.style.top = - Math.floor(hProp)/2 + 'px';				
			}
		}
	},



};



var eventsKey = '_leaflet_events';

Wu.DomEvent = {

    on: function (obj, types, fn, context) {


	if (typeof types === 'object') {
		
	    for (var type in types) {
		this._on(obj, type, types[type], fn);
	    }
	} else {
	    types = Wu.Util.splitWords(types);

	    for (var i = 0, len = types.length; i < len; i++) {

	    	// OBS!!!

	    	// From Jørgen: I've changed this code, so that there is an automatic fallback to 
	    	// touchstart for click events. I've done this so that we don't have to change the
	    	// whole code for touch devices, but perhaps it needs to be written elsewhere?

	    	// Check with Knut Ole :)

	    	// This is the original one...
		this._on(obj, types[i], fn, context);

	    	// This is a fallback for mobile/touch devices...

	    	// // App doesn't exist on login page...
	    	// if ( !app ) {

	    	// 	this._on(obj, 'click', fn, context);

	    	// } else {

		    // 	if ( app.isMobile && types[i] == 'click') { //  || types[i] == 'mousedown' 
		    // 		var type = 'touchstart';
		    // 	} else {
		    // 		var type = types[i];
		    // 	}

		    // 	this._on(obj, type, fn, context);

	    	// }

	    
	

	    }
	}

	return this;
    },

    off: function (obj, types, fn, context) {

	if (typeof types === 'object') {
	    for (var type in types) {
		this._off(obj, type, types[type], fn);
	    }
	} else {
	    types = Wu.Util.splitWords(types);

	    for (var i = 0, len = types.length; i < len; i++) {
		this._off(obj, types[i], fn, context);
	    }
	}

	return this;
    },

    _on: function (obj, type, fn, context) {

	var id = type + Wu.stamp(fn) + (context ? '_' + Wu.stamp(context) : '');

	if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

	var handler = function (e) {
	    return fn.call(context || obj, e || window.event);
	};

	var originalHandler = handler;

	if (Wu.Browser.pointer && type.indexOf('touch') === 0) {
	    return this.addPointerListener(obj, type, handler, id);
	}
	if (Wu.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
	    this.addDoubleTapListener(obj, handler, id);
	}

	if ('addEventListener' in obj) {

	    if (type === 'mousewheel') {
		obj.addEventListener('DOMMouseScroll', handler, false);
		obj.addEventListener(type, handler, false);

	    } else if ((type === 'mouseenter') || (type === 'mouseleave')) {
		handler = function (e) {
		    e = e || window.event;
		    if (!Wu.DomEvent._checkMouse(obj, e)) { return; }
		    return originalHandler(e);
		};
		obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false);

	    } else {
		if (type === 'click' && Wu.Browser.android) {
		    handler = function (e) {
			return Wu.DomEvent._filterClick(e, originalHandler);
		    };
		}
		obj.addEventListener(type, handler, false);
	    }

	} else if ('attachEvent' in obj) {
	    obj.attachEvent('on' + type, handler);
	}

	obj[eventsKey] = obj[eventsKey] || {};
	obj[eventsKey][id] = handler;

	return this;
    },

    _off: function (obj, type, fn, context) {

	var id = type + Wu.stamp(fn) + (context ? '_' + Wu.stamp(context) : ''),
	    handler = obj[eventsKey] && obj[eventsKey][id];

	if (!handler) { return this; }

	if (Wu.Browser.pointer && type.indexOf('touch') === 0) {
	    this.removePointerListener(obj, type, id);

	} else if (Wu.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
	    this.removeDoubleTapListener(obj, id);

	} else if ('removeEventListener' in obj) {

	    if (type === 'mousewheel') {
		obj.removeEventListener('DOMMouseScroll', handler, false);
		obj.removeEventListener(type, handler, false);

	    } else {
		obj.removeEventListener(
		    type === 'mouseenter' ? 'mouseover' :
		    type === 'mouseleave' ? 'mouseout' : type, handler, false);
	    }

	} else if ('detachEvent' in obj) {
	    obj.detachEvent('on' + type, handler);
	}

	obj[eventsKey][id] = null;

	return this;
    },

    stopPropagation: function (e) {

	if (e.stopPropagation) {
	    e.stopPropagation();
	} else {
	    e.cancelBubble = true;
	}
	Wu.DomEvent._skipped(e);

	return this;
    },

    disableScrollPropagation: function (el) {
	return Wu.DomEvent.on(el, 'mousewheel MozMousePixelScroll', Wu.DomEvent.stopPropagation);
    },

    preventDefault: function (e) {

	if (e.preventDefault) {
	    e.preventDefault();
	} else {
	    e.returnValue = false;
	}
	return this;
    },

    stop: function (e) {
	return Wu.DomEvent
	    .preventDefault(e)
	    .stopPropagation(e);
    },

    getWheelDelta: function (e) {

	var delta = 0;

	if (e.wheelDelta) {
	    delta = e.wheelDelta / 120;
	}
	if (e.detail) {
	    delta = -e.detail / 3;
	}
	return delta;
    },

    _skipEvents: {},

    _fakeStop: function (e) {
	// fakes stopPropagation by setting a special event flag, checked/reset with L.DomEvent._skipped(e)
	Wu.DomEvent._skipEvents[e.type] = true;
    },

    _skipped: function (e) {
	var skipped = this._skipEvents[e.type];
	// reset when checking, as it's only used in map container and propagates outside of the map
	this._skipEvents[e.type] = false;
	return skipped;
    },

    // check if element really left/entered the event target (for mouseenter/mouseleave)
    _checkMouse: function (el, e) {

	var related = e.relatedTarget;

	if (!related) { return true; }

	try {
	    while (related && (related !== el)) {
		related = related.parentNode;
	    }
	} catch (err) {
	    return false;
	}
	return (related !== el);
    },

    // this is a horrible workaround for a bug in Android where a single touch triggers two click events
    _filterClick: function (e, handler) {
	var timeStamp = (e.timeStamp || e.originalEvent.timeStamp),
	    elapsed = Wu.DomEvent._lastClick && (timeStamp - Wu.DomEvent._lastClick);

	// are they closer together than 500ms yet more than 100ms?
	// Android typically triggers them ~300ms apart while multiple listeners
	// on the same event should be triggered far faster;
	// or check if click is simulated on the element, and if it is, reject any non-simulated events

	if ((elapsed && elapsed > 100 && elapsed < 500) || (e.target._simulatedClick && !e._simulated)) {
	    Wu.DomEvent.stop(e);
	    return;
	}
	Wu.DomEvent._lastClick = timeStamp;

	return handler(e);
    }
};


// Wu.Browser
(function () {

    var ua = navigator.userAgent.toLowerCase(),
	doc = document.documentElement,

	ie = 'ActiveXObject' in window,

	webkit    = ua.indexOf('webkit') !== -1,
	phantomjs = ua.indexOf('phantom') !== -1,
	android23 = ua.search('android [23]') !== -1,
	chrome    = ua.indexOf('chrome') !== -1,

	mobile = typeof orientation !== 'undefined',
	msPointer = navigator.msPointerEnabled && navigator.msMaxTouchPoints && !window.PointerEvent,
	pointer = (window.PointerEvent && navigator.pointerEnabled && navigator.maxTouchPoints) || msPointer,

	ie3d = ie && ('transition' in doc.style),
	webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
	gecko3d = 'MozPerspective' in doc.style,
	opera3d = 'OTransition' in doc.style;


    var retina = 'devicePixelRatio' in window && window.devicePixelRatio > 1;

    if (!retina && 'matchMedia' in window) {
	var matches = window.matchMedia('(min-resolution:1.5dppx)');
	retina = matches && matches.matches;
    }

    var touch = !window.L_NO_TOUCH && !phantomjs && (pointer || 'ontouchstart' in window ||
	    (window.DocumentTouch && document instanceof window.DocumentTouch));

    Wu.Browser = {
	ie: ie,
	ielt9: ie && !document.addEventListener,
	webkit: webkit,
	gecko: (ua.indexOf('gecko') !== -1) && !webkit && !window.opera && !ie,
	android: ua.indexOf('android') !== -1,
	android23: android23,
	chrome: chrome,
	safari: !chrome && ua.indexOf('safari') !== -1,

	ie3d: ie3d,
	webkit3d: webkit3d,
	gecko3d: gecko3d,
	opera3d: opera3d,
	any3d: !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs,

	mobile: mobile,
	mobileWebkit: mobile && webkit,
	mobileWebkit3d: mobile && webkit3d,
	mobileOpera: mobile && window.opera,

	touch: !!touch,
	msPointer: !!msPointer,
	pointer: !!pointer,

	retina: !!retina
    };

}());

Wu.extend(Wu.DomEvent, {

	//static
	POINTER_DOWN: Wu.Browser.msPointer ? 'MSPointerDown' : 'pointerdown',
	POINTER_MOVE: Wu.Browser.msPointer ? 'MSPointerMove' : 'pointermove',
	POINTER_UP: Wu.Browser.msPointer ? 'MSPointerUp' : 'pointerup',
	POINTER_CANCEL: Wu.Browser.msPointer ? 'MSPointerCancel' : 'pointercancel',

	_pointers: [],
	_pointerDocumentListener: false,

	// Provides a touch events wrapper for (ms)pointer events.
	// Based on changes by veproza https://github.com/CloudMade/Leaflet/pull/1019
	//ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

	addPointerListener: function (obj, type, handler, id) {
		console.log('addPointerListener', type);
		switch (type) {
		case 'touchstart':
			return this.addPointerListenerStart(obj, type, handler, id);
		case 'touchend':
			return this.addPointerListenerEnd(obj, type, handler, id);
		case 'touchmove':
			return this.addPointerListenerMove(obj, type, handler, id);
		default:
			throw 'Unknown touch event type';
		}
	},

	addPointerListenerStart: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    pointers = this._pointers;

		var cb = function (e) {

			Wu.DomEvent.preventDefault(e);

			var alreadyInArray = false;
			for (var i = 0; i < pointers.length; i++) {
				if (pointers[i].pointerId === e.pointerId) {
					alreadyInArray = true;
					break;
				}
			}
			if (!alreadyInArray) {
				pointers.push(e);
			}

			e.touches = pointers.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchstart' + id] = cb;
		obj.addEventListener(this.POINTER_DOWN, cb, false);

		// need to also listen for end events to keep the _pointers list accurate
		// this needs to be on the body and never go away
		if (!this._pointerDocumentListener) {
			var internalCb = function (e) {
				for (var i = 0; i < pointers.length; i++) {
					if (pointers[i].pointerId === e.pointerId) {
						pointers.splice(i, 1);
						break;
					}
				}
			};
			//We listen on the documentElement as any drags that end by moving the touch off the screen get fired there
			document.documentElement.addEventListener(this.POINTER_UP, internalCb, false);
			document.documentElement.addEventListener(this.POINTER_CANCEL, internalCb, false);

			this._pointerDocumentListener = true;
		}

		return this;
	},

	addPointerListenerMove: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		function cb(e) {

			// don't fire touch moves when mouse isn't down
			if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) { return; }

			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches[i] = e;
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		}

		obj[pre + 'touchmove' + id] = cb;
		obj.addEventListener(this.POINTER_MOVE, cb, false);

		return this;
	},

	addPointerListenerEnd: function (obj, type, handler, id) {
		var pre = '_leaflet_',
		    touches = this._pointers;

		var cb = function (e) {
			for (var i = 0; i < touches.length; i++) {
				if (touches[i].pointerId === e.pointerId) {
					touches.splice(i, 1);
					break;
				}
			}

			e.touches = touches.slice();
			e.changedTouches = [e];

			handler(e);
		};

		obj[pre + 'touchend' + id] = cb;
		obj.addEventListener(this.POINTER_UP, cb, false);
		obj.addEventListener(this.POINTER_CANCEL, cb, false);

		return this;
	},

	removePointerListener: function (obj, type, id) {
		var pre = '_leaflet_',
		    cb = obj[pre + type + id];

		switch (type) {
		case 'touchstart':
			obj.removeEventListener(this.POINTER_DOWN, cb, false);
			break;
		case 'touchmove':
			obj.removeEventListener(this.POINTER_MOVE, cb, false);
			break;
		case 'touchend':
			obj.removeEventListener(this.POINTER_UP, cb, false);
			obj.removeEventListener(this.POINTER_CANCEL, cb, false);
			break;
		}

		return this;
	}
});


Wu.DomEvent.addListener = Wu.DomEvent.on;
Wu.DomEvent.removeListener = Wu.DomEvent.off;

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};

Array.prototype.moveUp = function(value, by) {
    var index = this.indexOf(value),     
        newPos = index - (by || 1);
     
    if(index === -1) 
        throw new Error('Element not found in array');
     
    if(newPos < 0) 
        newPos = 0;
         
    this.splice(index,1);
    this.splice(newPos,0,value);
};
 
Array.prototype.moveDown = function(value, by) {
    var index = this.indexOf(value),     
        newPos = index + (by || 1);
     
    if(index === -1) 
        throw new Error('Element not found in array');
     
    if(newPos >= this.length) 
        newPos = this.length;
     
    this.splice(index, 1);
    this.splice(newPos,0,value);
};

String.prototype.camelize = function () {
    return this.replace (/(?:^|[_])(\w)/g, function (_, c) {
      return c ? c.toUpperCase () : '';
    });
}


// bind fn for phantomJS
Function.prototype.bind = Function.prototype.bind || function (thisp) {
	var fn = this;
	return function () {
		return fn.apply(thisp, arguments);
	};
};




Wu.Tools = {


	validateDateFormat : function (_key) {


		var _m = moment(_key,"YYYY-MM-DD");
		var isDate = _m._pf.charsLeftOver == 0 && _m._pf.unusedTokens.length==0 && _m._pf.unusedInput.length==0 && _m.isValid();
		if ( isDate ) {
			var m = moment(_key, ["YYYYMMDD", moment.ISO_8601]).format("YYYY-MM-DD");
			if ( m != 'Invalid date' ) return m;	
		}

		var _m = moment(_key,"DD-MM-YYYY");
		var isDate = _m._pf.charsLeftOver == 0 && _m._pf.unusedTokens.length==0 && _m._pf.unusedInput.length==0 && _m.isValid();
		if ( isDate ) {
			var m = moment(_key, ["DDMMYYYY", moment.ISO_8601]).format("DD-MM-YYYY");
			if ( m != 'Invalid date' ) return m;	
		}

		return false;
	},



	// **************************************************************************
	// **************************************************************************
	// **************************************************************************		
	// **************************************************************************
	// **************************************************************************


	// color tools – color tools – color tools – color tools – color tools
	// color tools – color tools – color tools – color tools – color tools
	// color tools – color tools – color tools – color tools – color tools
	// color tools – color tools – color tools – color tools – color tools
	// color tools – color tools – color tools – color tools – color tools
	// color tools – color tools – color tools – color tools – color tools

	// Coverts any color (RGB, RGBA, Names (lavender), #333, #ff33ff) to [r,g,b]
	color2RGB : function (color) {
		
		// The color is a hex decimal
		if ( color[0] == '#' ) return this.hex2RGB(color);

		// The color is RGBA
		if ( color.substring(0,3).toLowerCase() == 'rgba' ) {
			var end = color[color.length-1] == ';' ? color.length-2 : color.length-1;
			var cc = c.substring(5,end);
			var expl = cc.split(",");
			var rgb = {
				r : expl[0],
				g : expl[1],
				b : expl[2]
			}
			return rgb;
		}

		// The color is RGB
		if ( color.substring(0,2).toLowerCase() == 'rgb' ) {		
			var end = color[color.length-1] == ';' ? color.length-2 : color.length-1;
			var cc = c.substring(4,end);
			var expl = cc.split(",");
			var rgb = {
				r : expl[0],
				g : expl[1],
				b : expl[2]
			}
			return rgb;
		}

		// ... or else the color has a name
		var convertedColor = this.colorNameToHex(color);
		return this.hex2RGB(convertedColor);

	},

	componentToHex : function (c) {
    		var hex = c.toString(16);
    		return hex.length == 1 ? "0" + hex : hex;
	},	

	rgb2HEX : function (rgb) {
		var r = this.componentToHex(rgb.r);
		var g = this.componentToHex(rgb.g);
		var b = this.componentToHex(rgb.b);

		return '#' + r + g + b;
	},

	// Creates RGB from hex
	hex2RGB : function (hex) {

		hex = this.checkHex(hex);

		var r = parseInt(hex.substring(1,3), 16);
		var g = parseInt(hex.substring(3,5), 16);
		var b = parseInt(hex.substring(5,7), 16);

		var rgb = {
			r : r,
			g : g,
			b : b
		}

		return rgb;

	},	

	// Turns 3 digit hex values to 6 digits
	checkHex : function (hex) {
		
		// If it's a 6 digit hex (plus #), run it.
		if ( hex.length == 7 ) {
			return hex;
		}

		// If it's a 3 digit hex, convert
		if ( hex.length == 4 ) {
			var r = parseInt(hex.substring(1,3), 16);
			var g = parseInt(hex.substring(3,5), 16);
			var b = parseInt(hex.substring(5,7), 16);
			return '#' + r + r + g + g + b + b;
		}

	},
	
	// Turns color names (lavender) to hex
	colorNameToHex : function (color) {

    		var colors = {	"aliceblue" : "#f0f8ff",
    				"antiquewhite":"#faebd7",
    				"aqua":"#00ffff",
    				"aquamarine":"#7fffd4",
    				"azure":"#f0ffff",
    				"beige":"#f5f5dc",
    				"bisque":"#ffe4c4",
    				"black":"#000000",
    				"blanchedalmond":"#ffebcd",
    				"blue":"#0000ff",
    				"blueviolet":"#8a2be2",
    				"brown":"#a52a2a",
    				"burlywood":"#deb887",
    				"cadetblue":"#5f9ea0",
    				"chartreuse":"#7fff00",
    				"chocolate":"#d2691e",
    				"coral":"#ff7f50",
    				"cornflowerblue":"#6495ed",
    				"cornsilk":"#fff8dc",
    				"crimson":"#dc143c",
    				"cyan":"#00ffff",
				"darkblue":"#00008b",
				"darkcyan":"#008b8b",
				"darkgoldenrod":"#b8860b",
				"darkgray":"#a9a9a9",
				"darkgreen":"#006400",
				"darkkhaki":"#bdb76b",
				"darkmagenta":"#8b008b",
				"darkolivegreen":"#556b2f",
				"darkorange":"#ff8c00",
				"darkorchid":"#9932cc",
				"darkred":"#8b0000",
				"darksalmon":"#e9967a",
				"darkseagreen":"#8fbc8f",
				"darkslateblue":"#483d8b",
				"darkslategray":"#2f4f4f",
				"darkturquoise":"#00ced1",
				"darkviolet":"#9400d3",
				"deeppink":"#ff1493",
				"deepskyblue":"#00bfff",
				"dimgray":"#696969",
				"dodgerblue":"#1e90ff",
			    	"firebrick":"#b22222",
			    	"floralwhite":"#fffaf0",
			    	"forestgreen":"#228b22",
			    	"fuchsia":"#ff00ff",
    				"gainsboro":"#dcdcdc",
    				"ghostwhite":"#f8f8ff",
    				"gold":"#ffd700",
    				"goldenrod":"#daa520",
    				"gray":"#808080",
    				"green":"#008000",
    				"greenyellow":"#adff2f",
    				"honeydew":"#f0fff0",
    				"hotpink":"#ff69b4",
				"indianred ":"#cd5c5c",
				"indigo":"#4b0082",
				"ivory":"#fffff0",
				"khaki":"#f0e68c",
				"lavender":"#e6e6fa",
				"lavenderblush":"#fff0f5",
				"lawngreen":"#7cfc00",
				"lemonchiffon":"#fffacd",
				"lightblue":"#add8e6",
				"lightcoral":"#f08080",
				"lightcyan":"#e0ffff",
				"lightgoldenrodyellow":"#fafad2",
				"lightgrey":"#d3d3d3",
				"lightgreen":"#90ee90",
				"lightpink":"#ffb6c1",
				"lightsalmon":"#ffa07a",
				"lightseagreen":"#20b2aa",
				"lightskyblue":"#87cefa",
				"lightslategray":"#778899",
				"lightsteelblue":"#b0c4de",
				"lightyellow":"#ffffe0",
				"lime":"#00ff00",
				"limegreen":"#32cd32",
				"linen":"#faf0e6",
				"magenta":"#ff00ff",
				"maroon":"#800000",
				"mediumaquamarine":"#66cdaa",
				"mediumblue":"#0000cd",
				"mediumorchid":"#ba55d3",
				"mediumpurple":"#9370d8",
				"mediumseagreen":"#3cb371",
				"mediumslateblue":"#7b68ee",
				"mediumspringgreen":"#00fa9a",
				"mediumturquoise":"#48d1cc",
				"mediumvioletred":"#c71585",
				"midnightblue":"#191970",
				"mintcream":"#f5fffa",
				"mistyrose":"#ffe4e1",
				"moccasin":"#ffe4b5",
				"navajowhite":"#ffdead",
				"navy":"#000080",
				"oldlace":"#fdf5e6",
				"olive":"#808000",
				"olivedrab":"#6b8e23",
				"orange":"#ffa500",
				"orangered":"#ff4500",
				"orchid":"#da70d6",
				"palegoldenrod":"#eee8aa",
				"palegreen":"#98fb98",
				"paleturquoise":"#afeeee",
				"palevioletred":"#d87093",
				"papayawhip":"#ffefd5",
				"peachpuff":"#ffdab9",
				"peru":"#cd853f",
				"pink":"#ffc0cb",
				"plum":"#dda0dd",
				"powderblue":"#b0e0e6",
				"purple":"#800080",
				"red":"#ff0000",
				"rosybrown":"#bc8f8f",
				"royalblue":"#4169e1",
				"saddlebrown":"#8b4513",
				"salmon":"#fa8072",
				"sandybrown":"#f4a460",
				"seagreen":"#2e8b57",
				"seashell":"#fff5ee",
				"sienna":"#a0522d",
				"silver":"#c0c0c0",
				"skyblue":"#87ceeb",
				"slateblue":"#6a5acd",
				"slategray":"#708090",
				"snow":"#fffafa",
				"springgreen":"#00ff7f",
				"steelblue":"#4682b4",
				"tan":"#d2b48c",
				"teal":"#008080",
				"thistle":"#d8bfd8",
				"tomato":"#ff6347",
				"turquoise":"#40e0d0",
				"violet":"#ee82ee",
				"wheat":"#f5deb3",
				"white":"#ffffff",
				"whitesmoke":"#f5f5f5",
				"yellow":"#ffff00",
				"yellowgreen":"#9acd32"
				};

		var c = color.toLowerCase();

		// Return hex color
		if ( colors[c] ) return colors[c];
		
		// Return black if there are no matches
		// (could return false, but will have to catch that error later)
		return '#000000';				
	},

	mixColors : function (RGB1, RGB2, percent) {

		if ( !RGB1 || !RGB2 ) return;
		if ( !percent ) var percent = 50;

		// Get each color range
		var r_range = Math.abs(RGB1.r - RGB2.r);
		var g_range = Math.abs(RGB1.g - RGB2.g);
		var b_range = Math.abs(RGB1.b - RGB2.b);

		// Avoid false on zero
		var a1 = RGB1.a ? RGB1.a : 0;
		var a2 = RGB2.a ? RGB2.a : 0;

		// Get new alpha
		var a_range = Math.abs(a1 - a2);
		var a_diff = a_range * percent;
		var a_new = a1 < a2 ? a1 + a_diff : a1 - a_diff;
		a_new = Math.ceil(a_new * 100)/100;

		// Figure out new color value
		var r_diff = Math.round(r_range * percent);
		var g_diff = Math.round(g_range * percent);
		var b_diff = Math.round(b_range * percent);

		var r_new = RGB1.r < RGB2.r ? RGB1.r + r_diff : RGB1.r - r_diff;
		var g_new = RGB1.g < RGB2.g ? RGB1.g + g_diff : RGB1.g - g_diff;
		var b_new = RGB1.b < RGB2.b ? RGB1.b + b_diff : RGB1.b - b_diff;

		return { r : r_new, g : g_new, b : b_new, a : a_new };

	},

	rgbStyleStr : function (rgb) {
		return 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
	},

	rgbaStyleStr : function (rgba) {
		return 'rgba(' + rgba.r + ',' + rgba.g + ',' + rgba.b + ',' + rgba.a + ')';
	},

	createGradient : function (colors) {

		var c = colors.join(',');

		var style = 'background: -webkit-linear-gradient(left, ' + c + ');';
		style += 'background: -o-linear-gradient(right, ' + c + ');';
		style += 'background: -moz-linear-gradient(right, ' + c + ');';
		style += 'background: linear-gradient(to right, ' + c + ');';
		return style;
	},

	transformTranslate : function (x, y) {
		var str  = '-ms-transform: translate(' + x + 'px,' + y + 'px);';
		    str += '-webkit-transform: translate(' + x + 'px,' + y + 'px);';
   		    str += 'transform: translate(' + x + 'px,' + y + 'px);';
    		return str;
	},


	isElement : function (obj) {
		try {
			//Using W3 DOM2 (works for FF, Opera and Chrome)
			return obj instanceof HTMLElement;
		} catch(e) {
			//Browsers not supporting W3 DOM2 don't have HTMLElement and
			//an exception is thrown and we end up here. Testing some
			//properties that all elements have. (works on IE7)
			return (typeof obj==="object") &&
			(obj.nodeType===1) && (typeof obj.style === "object") &&
			(typeof obj.ownerDocument ==="object");

		}
	},

	forceNumeric : function (e) {		
		// only allow '0-9' + '.' and '-'
		return e.charCode >= 45 && e.charCode <= 57 && e.charCode != 47;
	},

	keyMap : function (key) {
		var keyboardMap = [
			"", // [0]
			"", // [1]
			"", // [2]
			"CANCEL", // [3]
			"", // [4]
			"", // [5]
			"HELP", // [6]
			"", // [7]
			"BACK_SPACE", // [8]
			"TAB", // [9]
			"", // [10]
			"", // [11]
			"CLEAR", // [12]
			"ENTER", // [13]
			"ENTER_SPECIAL", // [14]
			"", // [15]
			"SHIFT", // [16]
			"CONTROL", // [17]
			"ALT", // [18]
			"PAUSE", // [19]
			"CAPS_LOCK", // [20]
			"KANA", // [21]
			"EISU", // [22]
			"JUNJA", // [23]
			"FINAL", // [24]
			"HANJA", // [25]
			"", // [26]
			"ESCAPE", // [27]
			"CONVERT", // [28]
			"NONCONVERT", // [29]
			"ACCEPT", // [30]
			"MODECHANGE", // [31]
			"SPACE", // [32]
			"PAGE_UP", // [33]
			"PAGE_DOWN", // [34]
			"END", // [35]
			"HOME", // [36]
			"LEFT", // [37]
			"UP", // [38]
			"RIGHT", // [39]
			"DOWN", // [40]
			"SELECT", // [41]
			"PRINT", // [42]
			"EXECUTE", // [43]
			"PRINTSCREEN", // [44]
			"INSERT", // [45]
			"DELETE", // [46]
			"", // [47]
			"0", // [48]
			"1", // [49]
			"2", // [50]
			"3", // [51]
			"4", // [52]
			"5", // [53]
			"6", // [54]
			"7", // [55]
			"8", // [56]
			"9", // [57]
			"COLON", // [58]
			"SEMICOLON", // [59]
			"LESS_THAN", // [60]
			"EQUALS", // [61]
			"GREATER_THAN", // [62]
			"QUESTION_MARK", // [63]
			"AT", // [64]
			"A", // [65]
			"B", // [66]
			"C", // [67]
			"D", // [68]
			"E", // [69]
			"F", // [70]
			"G", // [71]
			"H", // [72]
			"I", // [73]
			"J", // [74]
			"K", // [75]
			"L", // [76]
			"M", // [77]
			"N", // [78]
			"O", // [79]
			"P", // [80]
			"Q", // [81]
			"R", // [82]
			"S", // [83]
			"T", // [84]
			"U", // [85]
			"V", // [86]
			"W", // [87]
			"X", // [88]
			"Y", // [89]
			"Z", // [90]
			"OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
			"", // [92]
			"CONTEXT_MENU", // [93]
			"", // [94]
			"SLEEP", // [95]
			"NUMPAD0", // [96]
			"NUMPAD1", // [97]
			"NUMPAD2", // [98]
			"NUMPAD3", // [99]
			"NUMPAD4", // [100]
			"NUMPAD5", // [101]
			"NUMPAD6", // [102]
			"NUMPAD7", // [103]
			"NUMPAD8", // [104]
			"NUMPAD9", // [105]
			"MULTIPLY", // [106]
			"ADD", // [107]
			"SEPARATOR", // [108]
			"SUBTRACT", // [109]
			"DECIMAL", // [110]
			"DIVIDE", // [111]
			"F1", // [112]
			"F2", // [113]
			"F3", // [114]
			"F4", // [115]
			"F5", // [116]
			"F6", // [117]
			"F7", // [118]
			"F8", // [119]
			"F9", // [120]
			"F10", // [121]
			"F11", // [122]
			"F12", // [123]
			"F13", // [124]
			"F14", // [125]
			"F15", // [126]
			"F16", // [127]
			"F17", // [128]
			"F18", // [129]
			"F19", // [130]
			"F20", // [131]
			"F21", // [132]
			"F22", // [133]
			"F23", // [134]
			"F24", // [135]
			"", // [136]
			"", // [137]
			"", // [138]
			"", // [139]
			"", // [140]
			"", // [141]
			"", // [142]
			"", // [143]
			"NUM_LOCK", // [144]
			"SCROLL_LOCK", // [145]
			"WIN_OEM_FJ_JISHO", // [146]
			"WIN_OEM_FJ_MASSHOU", // [147]
			"WIN_OEM_FJ_TOUROKU", // [148]
			"WIN_OEM_FJ_LOYA", // [149]
			"WIN_OEM_FJ_ROYA", // [150]
			"", // [151]
			"", // [152]
			"", // [153]
			"", // [154]
			"", // [155]
			"", // [156]
			"", // [157]
			"", // [158]
			"", // [159]
			"CIRCUMFLEX", // [160]
			"EXCLAMATION", // [161]
			"DOUBLE_QUOTE", // [162]
			"HASH", // [163]
			"DOLLAR", // [164]
			"PERCENT", // [165]
			"AMPERSAND", // [166]
			"UNDERSCORE", // [167]
			"OPEN_PAREN", // [168]
			"CLOSE_PAREN", // [169]
			"ASTERISK", // [170]
			"PLUS", // [171]
			"PIPE", // [172]
			"HYPHEN_MINUS", // [173]
			"OPEN_CURLY_BRACKET", // [174]
			"CLOSE_CURLY_BRACKET", // [175]
			"TILDE", // [176]
			"", // [177]
			"", // [178]
			"", // [179]
			"", // [180]
			"VOLUME_MUTE", // [181]
			"VOLUME_DOWN", // [182]
			"VOLUME_UP", // [183]
			"", // [184]
			"", // [185]
			"SEMICOLON", // [186]
			"EQUALS", // [187]
			"COMMA", // [188]
			"MINUS", // [189]
			"PERIOD", // [190]
			"SLASH", // [191]
			"BACK_QUOTE", // [192]
			"", // [193]
			"", // [194]
			"", // [195]
			"", // [196]
			"", // [197]
			"", // [198]
			"", // [199]
			"", // [200]
			"", // [201]
			"", // [202]
			"", // [203]
			"", // [204]
			"", // [205]
			"", // [206]
			"", // [207]
			"", // [208]
			"", // [209]
			"", // [210]
			"", // [211]
			"", // [212]
			"", // [213]
			"", // [214]
			"", // [215]
			"", // [216]
			"", // [217]
			"", // [218]
			"OPEN_BRACKET", // [219]
			"BACK_SLASH", // [220]
			"CLOSE_BRACKET", // [221]
			"QUOTE", // [222]
			"", // [223]
			"META", // [224]
			"ALTGR", // [225]
			"", // [226]
			"WIN_ICO_HELP", // [227]
			"WIN_ICO_00", // [228]
			"", // [229]
			"WIN_ICO_CLEAR", // [230]
			"", // [231]
			"", // [232]
			"WIN_OEM_RESET", // [233]
			"WIN_OEM_JUMP", // [234]
			"WIN_OEM_PA1", // [235]
			"WIN_OEM_PA2", // [236]
			"WIN_OEM_PA3", // [237]
			"WIN_OEM_WSCTRL", // [238]
			"WIN_OEM_CUSEL", // [239]
			"WIN_OEM_ATTN", // [240]
			"WIN_OEM_FINISH", // [241]
			"WIN_OEM_COPY", // [242]
			"WIN_OEM_AUTO", // [243]
			"WIN_OEM_ENLW", // [244]
			"WIN_OEM_BACKTAB", // [245]
			"ATTN", // [246]
			"CRSEL", // [247]
			"EXSEL", // [248]
			"EREOF", // [249]
			"PLAY", // [250]
			"ZOOM", // [251]
			"", // [252]
			"PA1", // [253]
			"WIN_OEM_CLEAR", // [254]
			"" // [255]
		];
		return keyboardMap[key];
	},

	// Get cursor position in input field
	getCursorPos : function (input) {
	    // Internet Explorer Caret Position (TextArea)
	    if (document.selection && document.selection.createRange) {
	        var range = document.selection.createRange();
	        var bookmark = range.getBookmark();
	        var caret_pos = bookmark.charCodeAt(2) - 2;
	    } else {
	        // Firefox Caret Position (TextArea)
	        if (input.setSelectionRange)
	            var caret_pos = input.selectionStart;
	    }
	    return caret_pos;
	},

	


};

if (typeof window.console == "undefined") {
    window.console = {log: function() {}};
}