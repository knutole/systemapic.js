Wu.PhantomJS = Wu.Class.extend({

	initialize : function () {
		this.listen();
	},

	// called from server-side phantomJS script
	listen : function (options, done) {
		if (this._listening) return;
		this._listening = true;

		// tunnell all phantomjs events to window.callPhantom
		Wu.Mixin.Events.on('phantomjs', function (e) {
			window.callPhantom && window.callPhantom({text : e.detail});
		}, this);
	},

	setAccessToken : function (access_token) {
		app.tokens.access_token = access_token;
	},

	// save a hash 
	snap : function (callback) {

		// get active layers
		var active = app.MapPane.getControls().layermenu._getActiveLayers();
		var layers = _.map(active, function (l) {
			return l.item.layer;
		});

		// get project;
		var project = project || app.activeProject;

		var view = {
			project_id : project.getUuid(),
			position : app.MapPane.getPosition(),
			layers : layers
		};

		app.api.snap(view, function (err, result) {
			callback(err, result);
		});

	},

	ping : function (message) {
		Wu.Mixin.Events.fire('phantomjs', { detail : message });
	},
	
	develop : function (view) {		

		// phantom feedback
		this.ping('developing!');


		

		// set style
		this.phantomStyle();


		// parse if string
		if (_.isString(view)) view = Wu.parse(view);
		
		this.ping(Wu.stringify(view));

		var project_id = view.project_id;
		var position = view.position;
		var layers = view.layers;

		this.ping(project_id);

		if (!project_id) {
			return this.ping(JSON.stringify({
				error: {
					message: 'no project_id',
					code: 400
				}
			}));
		}

		if (!position) {
			return this.ping(JSON.stringify({
				error: {
					message: 'no position',
					code: 400
				}
			}));	
		}

		// request project from server
		app.api.getPrivateProject({
			project_id : project_id
		}, function (err, project_json) {
			if (!project_json || !JSON.parse(project_json).uuid) {
				return this.ping(JSON.stringify({
					error: {
						message: 'error: empty project',
						code: 404
					}
				}));
			}
			if (err) {
				this.ping('error: err getting project, err:' + err);
				return app._login('Please log in to view this private project.');
			}

			// parse
			var project_store = Wu.parse(project_json);

			// import project to portal
			app._importProject(project_store, function (err, project) {
				if (err) return this.ping('error: err importing project');

				// feedback
				this.ping('project name: ' + project.getName());
				this.ping('project createdBy: ' + project.getCreatedByUsername());
				
				// select project
				project.selectProject();

				// wait for project to load
				setTimeout(function () {
					this.ping('set position');

					// set position
					app.MapPane.setPosition(position);

					// deselect all default layers
					var map = app._map;
					var lm = app.MapPane.getControls().layermenu;
					var activeLayers = lm._getActiveLayers();
					activeLayers.forEach(function (al) {
						al && al.layer.remove(map);
					});

					// set layers
					view.layers.forEach(function (layerUuid) { 	
											
						// add layer
						var layer = project.getLayer(layerUuid);

						// if in layermenu
						var bases = project.getBaselayers();
						var base = _.find(bases, function (b) {
							return b.uuid == layerUuid;
						});

						if (base) {
							// add as baselayer
							layer.add('baselayer'); 
						} else {
							layer.add();
						}
						
					}, this);

					// wait for all layers to load
					var waiting = setInterval(function () {

						var stillLoading = app._map._tileLayersToLoad;

						// feedback
						this.ping('layers to load: ' + stillLoading);

						// ready!
						if (stillLoading <= 0 || _.isUndefined(stillLoading)) {

							// kill interval
							clearInterval(waiting);

							// close guide
							Wu.Mixin.Events.fire('doingScreenshot');

							// wait an extra second
							setTimeout(function () {

								// alert phantom we're ready!
								this.ping('ready');

							}.bind(this), 1000);
						} 
					}.bind(this), 300);
				}.bind(this), 1000);
			}.bind(this));
		}.bind(this));
	},

	phantomStyle : function () {

		// app.MapPane._controls.description.compactLegend()


		this._styletag = Wu.DomUtil.get("styletag");

		// append darktheme stylesheet
		var phantom = document.createElement("link");
		phantom.rel = 'stylesheet';
		phantom.href = app.options.servers.portal + 'css/phantomJS.css';
		this._styletag.appendChild(phantom);
	},		

	// todo: move hashes to own script
	initHash : function (hash, project) {

		// get hash values from server,
		app.phantomjs.getHash(hash, project, app.phantomjs.renderHash);
		return true;
	},

	// get saved hash
	getHash : function (id, project, callback) {

		// get a saved setup - which layers are active, position, 
		Wu.post('/api/project/hash/get', JSON.stringify({
			projectUuid : project.getUuid(),
			id : id
		}), callback, this);
	},

	renderHash : function (context, json) {

		// parse
		var result = JSON.parse(json); 

		// handle errors
		if (result.error) console.log('error?', result.error);

		// set vars
		var hash = result.hash;
		var projectUuid = hash.project || result.project;	// hacky.. clean up setHash, _renderHash, errything..
		var project = app.Projects[projectUuid];

		// select project
		project.selectProject();

		// set position
		app.MapPane.setPosition(hash.position);
	},

	// todo: move phantom to own script.. app.phantomjs = new Wu.PhantomJS()
	phantomJS : function (args) {
		var projectUuid = args.projectUuid;
		var hash    	= args.hash;
		var isThumb     = args.thumb;

	   	// return if no project
	   	if (!projectUuid) return false;

	   	// set hash for phantom
	   	this._phantomHash = hash;

		// get project
		var project = app.Projects[projectUuid];
		
		// return if no such project
		if (!project) return false;

		// check for hash
		if (hash) {

			// select project
			project.selectProject();

			// set position
			app.MapPane.setPosition(hash.position);

			setTimeout(function () {

				// deselect all default layers
				var map = app._map;
				var lm = app.MapPane.getControls().layermenu;
				var activeLayers = lm._getActiveLayers();
				activeLayers.forEach(function (al) {
					al.layer.remove(map);
				});

				// set layers
				hash.layers.forEach(function (layerUuid) { 	
										
					// add layer
					var layer = project.getLayer(layerUuid);

					// if in layermenu
					var bases = project.getBaselayers();
					var base = _.find(bases, function (b) {
						return b.uuid == layerUuid;
					});

					if (base) {
						// add as baselayer
						layer.add('baselayer'); 
					} else {
						layer.add();
					}
					
				}, this);

			}.bind(this), 2000);


		}

		// add phantomJS stylesheet		
		isThumb ? app.Style.phantomJSthumb() : app.Style.phantomJS();

		app._isPhantom = true;

	},
	
	_setPhantomArgs : function (args) {
		app._phantomArgs = args;
	},
	
	phantomReady : function () {
		if (!app.activeProject) return false;

		var hashLayers = _.size(app._phantomHash.layers),
		    baseLayers = _.size(app.activeProject.getBaselayers()),
		    numLayers = hashLayers + baseLayers;

		// check if ready for screenshot
		if (!app._loaded || !app._loading) return false;

		// if no layers, return
		if (numLayers == 0) return true;

		// if not loaded, return
		if (app._loaded.length == 0 ) return false; 

		// if all layers loaded
		if (app._loaded.length == numLayers) return true;

		// not yet
		return false;
	},

	// phantomjs: loaded layers
	_loaded : [],

	_loading : []


});
