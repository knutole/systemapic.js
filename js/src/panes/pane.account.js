Wu.Pane.Account = Wu.Pane.extend({

	_initialize : function (options) {
		this.addAccountTab();
	},

	addAccountTab : function () {

		// register button in top chrome
		var top = app.Chrome.Top;

		// add a button to top chrome
		this._accountTab = top._registerButton({
			name : 'account',
			className : 'chrome-button account',
			trigger : this._toggleAccountTab,
			context : this,
			project_dependent : false
		});

		// user icon
		this._accountTab.innerHTML = '<i class="fa fa-user"></i>';
	},


	_toggleAccountTab : function () {
		this._accountTabOpen ? this._closeAccountTab() : this._openAccountTab();
	},


	// todo: refactor into new Wu.Pane.Account()
	_openAccountTab : function () {

		// close other tabs
		Wu.Mixin.Events.fire('closeMenuTabs');

		// for public account
		if (app.Account.isPublic()) {

			// temp hack
			return this.openLogin();

			// create login button if public account
			// create dropdown
			this._accountDropdown = Wu.DomUtil.create('div', 'share-dropdown account-dropdown', app._appPane);
			var account_name = 'Not logged in';

			// temp hack, set to left
			this._accountDropdown.style.left = 0;

			// items
			// this._accountName = Wu.DomUtil.create('div', 'share-item no-hover', this._accountDropdown, '<i class="fa fa-user logout-icon"></i>' + account_name);
			this._logoutDiv = Wu.DomUtil.create('div', 'share-item', this._accountDropdown, '<i class="fa fa-sign-in logout-icon"></i>Log in');

			// events
			Wu.DomEvent.on(this._logoutDiv,  'click', this.openLogin, this);


		// normal user account
		} else {

			// create dropdown
			this._accountDropdown = Wu.DomUtil.create('div', 'share-dropdown account-dropdown', app._appPane);
			var account_name = app.Account.getUsername();

			// locate me
			this._locate = Wu.DomUtil.create('div', 'share-item locate-me', this._accountDropdown, '<i class="fa fa-location-arrow" aria-hidden="true"></i> Locate me!');

			// items
			this._accountName = Wu.DomUtil.create('div', 'share-item no-hover', this._accountDropdown, '<i class="fa fa-user logout-icon"></i>' + account_name);
			this._logoutDiv = Wu.DomUtil.create('div', 'share-item', this._accountDropdown, '<i class="fa fa-sign-out logout-icon"></i>Log out');

			
			// events
			Wu.DomEvent.on(this._logoutDiv,  'click', this.logout, this);

			Wu.DomEvent.on(this._locate, 'click', this._toggleLocate, this);

		}
		
		// mark open
		this._accountTabOpen = true;

		// mark active
		Wu.DomUtil.addClass(this._accountTab, 'active');

	},

	_toggleLocate : function () {

		// already locating, stop it
		if (this._locating) {

			// set text
			this._locate.innerHTML = '<i class="fa fa-location-arrow" aria-hidden="true"></i> Locate me!';

			// stop
			this.stopLocating();

		// locate!
		} else {

			// start locating
			this.startLocating();

			// set text
			this._locate.innerHTML = '<i class="fa fa-location-arrow" aria-hidden="true"></i> Stop locating...';
		}

	},

	startLocating : function () {
		var map = app._map;

		console.log('startLocating', this);


		// locate with leaflet
		map.locate({
			watch : true, // continuous
			setView : true,
			enableHighAccuracy : true
		});

		// add events
		map.on('locationfound', this._onLocationFound.bind(this));
		map.on('locationerror', this._onLocationError.bind(this));

		// mark
		this._locating = true;
	},

	stopLocating : function () {
		var map = app._map;
		console.log('stopLocate', this);
		
		// stop locating
		map.stopLocate();

		// remove events
		map.off('locationerror', this._onLocationError.bind(this));
		map.off('locationfound', this._onLocationFound.bind(this));
		
		// remove circle
		if (this._locationRadius && map.hasLayer(this._locationRadius)) {
	 		map.removeLayer(this._locationRadius);
	 	}

	 	// mark
		this._locating = false;
	},

	_onLocationFound : function (e) {
		var radius = e.accuracy / 2;
		var map = app._map;

		console.log('_onLocationFound', this);

		// remove circle if exists
	 	if (this._locationRadius && map.hasLayer(this._locationRadius)) {
	 		map.removeLayer(this._locationRadius);
	 	}

	 	// draw radius circle
	    this._locationRadius = L.circle(e.latlng, {
	    	radius : radius,
	    	fillColor : 'gray',
	    	interactive : false,
	    	opacity : 0.8
	    });

	    // add to map
	    this._locationRadius.addTo(map);
	},

	_onLocationError : function (e) {

	},



	_closeAccountTab : function () {
		if (!this._accountTabOpen) return;

		Wu.DomEvent.off(this._logoutDiv,  'click', this.logout, this);

		Wu.DomUtil.remove(this._accountDropdown);

		this._accountTabOpen = false;

		// mark closed
		Wu.DomUtil.removeClass(this._accountTab, 'active');
	},

	logout : function () {
		app.api.logout({}, function (err, result) {
			if (err) {
				app.feedback.setError({
					title : 'Something went wrong.'
				});
			} else {
				app.feedback.setMessage({
					title : 'Log out',
					description : result
				});
				window.location.href = '/';
			}
		});
		// window.location.href = '/logout';
	},

	openLogin : function () {
		
		// close other tabs
		Wu.Mixin.Events.fire('closeMenuTabs');

		// open login
		var login = new Wu.Pane.Login();
		login.open();
	},

	_onCloseMenuTabs : function () {
		this._closeAccountTab();
	}
	
});