Wu.Api = Wu.Class.extend({


	initialize : function (options) {
		Wu.setOptions(this, options);
	},

	// PORTAL


	getPortal : function (done) {
		// var path = '/api/portal';	// TODO: GET request
		var path = '/v2/portal';
		// this.post(path, {}, done);
		this.get(path, {}, done);
	},

	logout : function (options, done) {
		var path = '/logout';
		
		options = options || {};
		this.get(path, options, done);
	},










	// PROJECTS


	createProject : function (options, done) {
		// var path = '/api/project/create';
		var path = '/v2/projects/create';
		this.post(path, options, done);
	},

	updateProject : function (options, done) {
		// var path = '/api/project/update';
		var path = '/v2/projects/update';
		this.post(path, options, done);
	},

	deleteProject : function (options, done) {
		// var path = '/api/project/delete';
		var path = '/v2/projects/delete';
		this.post(path, options, done);
	},

	getProject : function (options, done) {
  		// var path = '/api/project/get/public';
  		var path = '/v2/projects/public';		
		this.get(path, options, done)
  	},

  	getPrivateProject : function (options, done) {
  		// var path = '/api/project/get/private';
  		var path = '/v2/projects/private';
		this.get(path, options, done)
  	},

  	addFileToTheProject : function (options, done) {
		// var path = '/api/file/addtoproject';
		var path = '/v2/projects/data';
		this.post(path, options, done);
	},

	projectSetAccess  : function (options, done) {
		// var path = '/api/project/setAccess';
		var path = '/v2/projects/access';		// todo: refactor to update
		this.post(path, options, done);
	},







  	// USERS


	auth : function (done) {
		// var path = '/api/user/session';		
		var path = '/v2/users/session';
		this.get(path, {}, done);
	},

	getTokenFromPassword : function (options, done) {
		// var path = '/api/token';
		var path = '/v2/users/token';
		this.get(path, options, done);
	},

	deleteUser : function (options, done) {
		// var path = '/api/user/delete';
		var path = '/v2/users/delete';
		this.post(path, options, done);
	},

	updateUser: function (options, done) {
		// var path = '/api/user/update';
		var path = '/v2/users/update';
		this.post(path, options, done);
	},

	createUser: function (options, done) {
		// var path = '/api/user/update';
		var path = '/v2/users/create';
		this.post(path, options, done);
	},

	uniqueEmail: function (options, done) {
		// var path = '/api/user/uniqueEmail';
		var path = '/v2/users/email/unique';
		this.post(path, options, done);
	},

	uniqueUsername: function (options, done) {
		// var path = '/api/user/uniqueUsername';
		var path = '/v2/users/username/unique';
		this.post(path, options, done);
	},

	requestContact : function (options, done) {
		// var path = '/api/user/requestContact';
		// var path = '/v2/contacts/request';			
		var path = '/v2/users/contacts/request';
		this.post(path, options, done);
	},
	
	resetPassword : function (options, done) {
   		// var path = '/reset';
   		var path = '/v2/users/password/reset';
		this.post(path, options, done) 		
  	},

	userInvite : function (options, done) {
		// var path = '/api/user/invite';
		// var path = '/v2/invites/user';	// todo: refactor invite endpoints
		var path = '/v2/users/invite';
		this.post(path, options, done);
	},

	addInvites: function (options, done) {
		// var path = '/api/project/addInvites';
		// var path = '/v2/invites/project';
		var path = '/v2/users/invite/project';	// todo: refactor, see /v2/users/invite/projects (with s) below
		this.post(path, options, done);
	},

	inviteLink : function (options, done) {
		// var path = '/api/invite/link';
		// var path = '/v2/invites/link';
		var path = '/v2/users/invite/link';
		this.get(path, options, done);
	},

	acceptInvite : function (options, done) {
		var path = '/v2/users/invite/accept';
		this.post(path, options, done);
	},

	inviteToProjects : function (options, done) {
		// var path = '/api/user/inviteToProjects';
		// var path = '/v2/invites/user/project';		//todo: refactor
		var path = '/v2/users/invite/projects';		//todo: refactor
		this.post(path, options, done);
	},

	













	// DATA 


	shareDataset : function (options, done) {
		// var path = '/api/dataset/share'; 
		var path = '/v2/data/share';
		this.post(path, options, done);
	},

	deleteDataset : function (options, done) {
		// var path = '/api/file/delete';
		var path = '/v2/data/delete';
		this.post(path, options, done);
	},

	updateFile : function (options, done) {
		// var path = '/api/file/update';
		var path = '/v2/data/update';
		this.post(path, options, done);
  	},

  	fileGetLayers : function (options, done) {
		// var path = '/api/file/getLayers';
		var path = '/v2/data/layers';
		this.post(path, options, done);
	},

	getLayer : function (options, done) {
		var path = '/v2/layers/getLayer';
		this.post(path, options, done);
	},

	downloadDataset : function (options, done) {
		// var path = '/api/file/downloadDataset';
		var path = '/v2/data/download';
		this.post(path, options, done);
	},

	vectorizeDataset : function (options, done) {
		var path = '/v2/tiles/vectorize';
		this.post(path, options, done);
	},

	importStatus : function (options, done) {
		var path = '/v2/data/import/status';
		this.get(path, options, done);
	},

	




  	// LAYERS
  	getWMSLayers : function (options, done) {
  		var path  = '/v2/layers/wms';
  		this.get(path, options, done);
  	},


	deleteLayer : function (options, done) {
		// var path = '/api/layers/delete';
		var path = '/v2/layers/delete';
		this.post(path, options, done);
	},

	updateLayer : function (options, done) {
		// var path = '/api/layer/update';
		var path = '/v2/layers/update';
		this.post(path, options, done);
	},

	setCartocss : function (options, done) {
		// var path = '/api/layers/cartocss/set';
		var path = '/v2/layers/carto';
		this.post(path, options, done);
	},

	getCartocss : function (options, done) {
		// var path = '/api/layers/cartocss/get';
		// var path = '/v2/layers/carto/get';	
		var path = '/v2/layers/carto';		
		this.get(path, options, done);
	},

	json2carto : function (options, done) {
		var path = '/v2/layers/carto/json';
		this.post(path, options, done);
	},

	customCarto : function (options, done) {
		var path = '/v2/layers/carto/custom';
		this.post(path, options, done);
	},

	downloadLayerDataset : function (options, done) {
		// var path = '/api/layer/downloadDataset';
		var path = '/v2/layers/download';
		this.post(path, options, done);
	},

	createLayer : function (options, done) {
		// var path = '/api/layers/new';
		var path = '/v2/layers/create';
		this.post(path, options, done);
	},

	createDefaultLayer : function (options, done) {
		// var path = '/api/layers/default';			// todo: refactor
		var path = '/v2/layers/create/default';
		this.post(path, options, done);
	},

	reloadMeta : function (options, done) {
		// var path = '/api/layer/reloadmeta';
		var path = '/v2/layers/meta';
		this.post(path, options, done);
	},

	updateCube : function (options, done) {
		var path = '/v2/cubes/update';
		this.post(path, options, done);
	},

	removeFromCube : function (options, done) {
		var path = '/v2/cubes/remove';
		this.post(path, options, done);
	},

	addToCube : function (options, done) {
		var path = '/v2/cubes/add';
		this.post(path, options, done);
	},

	createCube : function (options, done) {
		var path = '/v2/cubes/create';
		this.post(path, options, done);
	},

	
	// TILES
	// [pile]
	createTileLayer : function (options, done) {
		var path = '/v2/tiles/create';
		this.post(path, options, done);
	},


	// [pile]
	addMask : function (options, done) {
		var path = '/v2/cubes/mask';
		this.post(path, options, done);
	},














	// LEGENDS


	createLegends : function (options, done) {
		// var path = '/api/layer/createlegends';
		var path = '/v2/legends/create';
		this.post(path, options, done);
	},

	

	









	// HASHES
	
	
	getHash : function (options, done) {
		// var path = '/api/project/hash/get';
		// var path = '/v2/hashes/get';		
		var path = '/v2/hashes';		
		this.get(path, options, done);
	},

	setHash : function (options, done) {
		// var path = '/api/project/hash/set';
		// var path = '/v2/hashes/set';
		var path = '/v2/hashes';
		this.post(path, options, done);
	},





	// QUERIES

	queryCube : function (options, done) {
		var path = '/v2/cubes/query';
		this.post(path, options, done);
	},
	
	dbFetchArea : function (options, done) {
		var path = '/v2/query/polygon';
		this.post(path, options, done);
	},

	dbFetch : function (options, done) {
		var path = '/v2/query/point';
		this.post(path, options, done);
	},

	fetchHistogram : function (options, done) {
		var path = '/v2/query/histogram';
		this.post(path, options, done);
	},

	getVectorPoints : function (options, done) {
		var path = '/v2/query/getVectorPoints';
		this.post(path, options, done);
	},



	// LOG


	errorLog : function (options, done) {
		// var path = '/api/error/log';
		var path = '/v2/log/error';
		this.post(path, options, done);
	},

	analyticsSet : function (options, done) {
		// var path = '/api/analytics/set';
		var path = '/v2/log';
		this.post(path, options, done);
	},

	analyticsGet : function (options, done) {
		// var path = '/api/analytics/get';
		var path = '/v2/log';
		this.get(path, options, done);
	},


	// get custom data (allYears)
	getCustomData : function (options, done) {
  		var path = '/v2/static/getCustomData';		
		this.get(path, options, done)
  	},





	// STATIC



	createThumb : function (options, done) {
		// var path = '/api/util/createThumb';
		var path = '/v2/static/thumb';		// todo: GET ?
		this.post(path, options, done);
	},

	pdfsnapshot : function (options, done) {
		// var path = '/api/util/pdfsnapshot';
		var path = '/v2/static/pdf';
		this.post(path, options, done);
	},

	snap : function (options, done) {
		// var path = '/api/util/snapshot';
		var path = '/v2/static/screen';
		this.post(path, options, done);
	},














	
	// helper fn's
	post : function (path, options, done) {
		this._post(path, JSON.stringify(options), function (err, response) {
			done && done(err, response);
		});
	},

	_post : function (path, json, done, context, baseurl) {
		var http = new XMLHttpRequest();
		var url = baseurl || this.options.url || Wu.Util._getServerUrl();
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
					done && done(http.status, http.responseText);
				}
			}
		};

		// add access_token to request
		var access_token = (window.app && app.tokens) ? app.tokens.access_token : null;
		var options = _.isString(json) ? Wu.parse(json) : json;
		options.access_token = options.access_token || access_token;
		var send_json = Wu.stringify(options);
		// send
		http.send(send_json);
	},

	get : function (path, options, done) {
		this._get(path, JSON.stringify(options), function (err, response) {
			done && done(err, response);
		});
	},

	_get : function (path, options, done, context, baseurl) {
		var http = new XMLHttpRequest();
		var url = baseurl || this.options.url || Wu.Util._getServerUrl();
		url += path;

		// add options to query
		url = this._addQueryOptions(url, options);

		// open
		http.open("GET", url, true);

		// set json header
		http.setRequestHeader('Content-type', 'application/json');

		// response
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				if (http.status == 200) {
					done && done(null, http.responseText);
				} else {
					done && done(http.status, http.responseText);
				}
			}
		};
		
		// send
		http.send();
	},

	_addQueryOptions : function (url, options) {
		var options = options || {};
		options = _.isObject(options) ? options : Wu.parse(options);
		options.access_token = (window.app && app.tokens) ? app.tokens.access_token : null;
		if (!_.isEmpty(options)) {
			_.forOwn(options, function (value, key) {
				// encode and add
				url += _.includes(url, '?') ? '&' : '?';
				url += encodeURIComponent(key) + '=' + encodeURIComponent(value);
			});
		}
		return url;
	},

});