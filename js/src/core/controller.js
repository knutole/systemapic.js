Wu.Controller = Wu.Class.extend({

	initialize : function () {
		this._listen();
	},

	_listen : function () {
		Wu.Mixin.Events.on('projectSelected', this._projectSelected, this);
		Wu.Mixin.Events.on('appReady', this._appReady, this);
	},

	_appReady : function () {

		if (app.options.settings.guide) {

			// init guide
			this._initGuide();
		}
	},

	_initGuide : function () {

		var isPublic = app.Account.isPublic();
		var cookie = Cookies.get('guide');
		var seenBefore = (cookie == 'seen');

		// start guide if public
		if (isPublic && !seenBefore) {
			setTimeout(function () {
				this._guide = new Wu.Guide();
				this._guide.start();
			}, 500);
		}

		// remove systeampic logo in corner if public
		if (isPublic && app.options.removeSystemapicAttribution) {
			app.MapPane._attributionControl.removeAttribution(app.options.systemapicAttribution);
		}

	},
	
	_projectSelected : function (e) {
		var projectUuid = e.detail.projectUuid;

		if (!projectUuid) return Wu.Util.setAddressBar('');

		// set project
		this._project = app.activeProject = app.Projects[projectUuid];

		// set url
		this._project._setUrl(); // refactor

	},

	_loadState : function () {
		var project = this._project,
		    state = project.getState(),
		    saveState = project.getSettings().saveState;
		
		if (!saveState || !state) return;


		var json = {
			project_id : this._project.getUuid(),
			id : state
		};

		// get a saved setup - which layers are active, position, 
		app.api.getHash(json, function (err, response) {

			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
			}

			var result = Wu.parse(response);

			var hash = result.hash;

			// set position
			app.MapPane.setPosition(hash.position);

			// set layermenu layers
			var layers = hash.layers;
			_.each(layers, function (layerUuid) {
				app.MapPane.getControls().layermenu._enableLayerByUuid(layerUuid);
			});


		}.bind(this), this);

	},

	// todo!
	_saveState : function (options) {

		var project = options.project || app.activeProject;

		var layers = app.MapPane.getZIndexControls().l._index;


		var layerUuids = [];
		_.each(layers, function (l) {
			layerUuids.push(l.store.uuid);
		});


		// hash object
		var json = {
			project_id : project.getUuid(),
			hash : {
				id 	 : Wu.Util.createRandom(6),
				position : app.MapPane.getPosition(),
				layers 	 : layerUuids 			// layermenuItem uuids, todo: order as z-index
			},
			saveState : true
		};

		// save hash to server
		app.api.setHash(json, function (err, response) {

			if (err) {
				return app.feedback.setError({
					title : 'Something went wrong',
					description : err
				});
			}

			console.log('saved state!', json);
		}.bind(this));

	},

	// todo: remove these ??
	hideControls : function () {

		// layermenu
		var lm = app.MapPane.getControls().layermenu;
		if (lm) lm.hide();

		// inspect
		var ic = app.MapPane.getControls().inspect;
		if (ic) ic.hide();

		// legends
		var lc = app.MapPane.getControls().legends;
		if (lc) lc.hide();

		// description
		var dc = app.MapPane.getControls().description;
		if (dc) dc.hide();
	},

	showControls : function () {

		// layermenu
		var lm = app.MapPane.getControls().layermenu;
		if (lm) lm.show();

		// inspect
		var ic = app.MapPane.getControls().inspect;
		if (ic) ic.show();

		// legends
		var lc = app.MapPane.getControls().legends;
		if (lc) lc.show();

		// description
		var dc = app.MapPane.getControls().description;
		if (dc) dc.show();
	},

	showStartPane : function () {

		// called from project._unload(), ie. when deleting active project

		// flush mappane, headerpane, controls
		// show startpane

		app.MapPane._flush();
		app.HeaderPane._flush();
		app.HeaderPane._hide();

		var controls = app.MapPane.getControls();

		for (var c in controls) {
			var control = controls[c];
			control._off();
		}

		app.StatusPane.close()
		app.StartPane.activate();

	},

	openDefaultProject : function () {
		var defaultProject = app.options.defaults.project.name;

		// open last updated (if exists)
		var opened = app.Controller.openLastUpdatedProject();
		if (opened) return; 

		if (!_.isEmpty(defaultProject)) {
			return app._initHotlink(Wu.stringify(defaultProject));
		}

	},

	openLastUpdatedProject : function () {
		var project = _.first(_.sortBy(_.toArray(app.Projects), function (p) {
			return p.store.lastUpdated;
		}).reverse());
		if (project) {
			project.selectProject();
			return true;
		}
		return false;
	},

	openFirstProject : function () {
		var project = _.first(_.sortBy(_.toArray(app.Projects), function (p) {
			return p.getName().toLowerCase();
		}));
		if (project) project.selectProject();
	},


	loadjscssfile : function (filename, filetype) {
		
		if (filetype=="js") { //if filename is a external JavaScript file
			var fileref=document.createElement('script');
			fileref.setAttribute("type","text/javascript");
			fileref.setAttribute("src", filename);
		} 
		if (filetype=="css") { //if filename is an external CSS file
			var fileref=document.createElement("link");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", filename);
		}

		if (typeof fileref!="undefined") {
			document.getElementsByTagName("head")[0].appendChild(fileref);
		
		}
	},

});