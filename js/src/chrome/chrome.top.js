Wu.Chrome.Top = Wu.Chrome.extend({

	_ : 'topchrome',

	_initialize : function (options) {

		// init container
		this.initContainer();

		// add hooks
		this.addHooks();
	},

	initContainer : function () {

		var isPublic = app.Account.isPublic();

		var cName = 'chrome chrome-container chrome-top';
		isPublic ? cName += ' public' : cName += ' logged-in';


		// container to hold errything
		this._container = Wu.DomUtil.create('div', cName, app._appPane);

		// Menu Button
		this._menuButton = Wu.DomUtil.create('div', 'chrome-menu-button', this._container);

		// css experiment
		// this._menuButton.innerHTML = '<i class="top-button fa fa-bars"></i>';
		this._menuButton.innerHTML = '<i class="top-button systemapic-icons systemapic-icon-projects-and-users"></i>';

		// Project title container
		this._projectTitleContainer = Wu.DomUtil.create('div', 'chrome-project-title-container', this._container);

		// WRAPPER FOR BUTTONS			// todo: make pluggable
		this._buttonWrapper = Wu.DomUtil.create('div', 'chrome-buttons', this._container);

		// Project title
		// this._projectTitle = Wu.DomUtil.create('div', 'chrome-project-title', this._projectTitleContainer);
		this._projectTitle = Wu.DomUtil.create('div', 'chrome-button chrome-project-title', this._buttonWrapper);

		// Client Logo
		var clientLogoConfig = app.options.logos.clientLogo;
		if (clientLogoConfig && clientLogoConfig.active) {
			this._clientLogo = Wu.DomUtil.create('div', 'chrome-button chrome-client-logo', this._buttonWrapper);
			this._clientLogo.style.backgroundImage = clientLogoConfig.backgroundImage;
			this._clientLogo.style.backgroundSize = clientLogoConfig.backgroundSize;
			this._clientLogo.style.backgroundPosition = clientLogoConfig.backgroundPosition;
			this._clientLogo.style.backgroundColor = clientLogoConfig.backgroundColor;

			// add link
			var logoLink = app.options.logos.portalLink;
			if (logoLink) {
				var linkDiv = Wu.DomUtil.create('a', 'logo-link');
				linkDiv.setAttribute('href', logoLink);
				linkDiv.setAttribute('target', '_blank');
				this._clientLogo.appendChild(linkDiv);
			}
		}
		
		// set default
		this.initDefault();

	},

	// add button to top chrome
	_registerButton : function (button) {

		// button options
		var className = button.className;
		var trigger = button.trigger;
		var name = button.name;
		var ctx = button.context;
		var project_dependent = button.project_dependent;

		if (project_dependent) className += ' displayNone';

		// buttons holder
		this._buttons = this._buttons || {};

		// create button
		var buttonDiv = Wu.DomUtil.create('div', className);

		// css exp // hacky! (depending if logo is shown or not)
		var clientLogoConfig = app.options.logos.clientLogo;
		var referenceNode = (clientLogoConfig && clientLogoConfig.active) ? this._buttonWrapper.lastChild.previousSibling : this._buttonWrapper.lastChild;
		this._buttonWrapper.insertBefore(buttonDiv, referenceNode);

		// save
		this._buttons[name] = {
			div : buttonDiv,
			options : button
		};

		// register event
		Wu.DomEvent.on(buttonDiv, 'mousedown', trigger, ctx);

		return buttonDiv;
	},


	_updateButtonVisibility : function () {
		var buttons = _.filter(this._buttons, function (b) {
			return b.options.project_dependent;
		});

		if (app.activeProject) {
			buttons.forEach(function (button) {
				Wu.DomUtil.removeClass(button.div, 'displayNone');
			});

		} else {
			buttons.forEach(function (button) {
				Wu.DomUtil.addClass(button.div, 'displayNone');
			});
		}
	},

	initDefault : function () {

		// Init CPU clock
		this.initCPUclock(this._container);
	},

	// todo: refactor into own script
	initCPUclock : function (wrapper) {	

		this._CPUwrapper = Wu.DomUtil.create('div', 'cpu-wrapper', wrapper);

		this._CPUbars = [];

		for (var i = 0; i < 10; i++ ) {
			this._CPUbars[i] = Wu.DomUtil.create('div', 'cpu-bar', this._CPUwrapper);
		}

	},


	updateCPUclock : function (percent) {

		// hide if not editor
		var project = app.activeProject;
		if (!project || !project.isEditable()) {
			this._CPUwrapper.style.display = 'none';
		} else {
			this._CPUwrapper.style.display = 'block';
		}

		// Get value as numbers
		var pp = parseInt(percent);

		// Get clean value of number
		var p = Math.round(pp / 10);

		for (var i = 0; i < 10; i++ ) {
			
			// Get the right div
			var no = 9 - i;

			// Set the right classes
			(i >= p) ? Wu.DomUtil.removeClass(this._CPUbars[no], 'cpu-on') : Wu.DomUtil.addClass(this._CPUbars[no], 'cpu-on');
		}
	},

	_setHooks : function (onoff) {

		// Toggle left pane
		Wu.DomEvent[onoff](this._menuButton, 'click', this._toggleLeftPane, this);

		Wu.Mixin.Events[onoff]('_openLayerMenu', this._onLayMenuOpen, this);

	},

	_onLayMenuOpen : function () {
		if ( !app.isMobile || !app.isMobile.mobile ) return;
		this.closeLeftPane();
	},

	addHooks : function () {
		this._setHooks('on');
	},

	removeHooks : function () {
		this._setHooks('off');
	},

	_projectSelected : function (e) {
		
		// show settings/share buttons
		this._updateButtonVisibility();

		// get project
		var projectUuid = e.detail.projectUuid;
		if (!projectUuid) return;

		// set project
		this._project = app.activeProject = app.Projects[projectUuid];
		
		// refresh pane
		this._refresh();
	},

	_refresh : function () {

		this._setProjectTitle();
		this._showHideLayerButton();

		// The layer menu
		this.__layerMenu = app.MapPane.getControls().layermenu;
		

		// TODO: fikse dette...
		setTimeout(function() {

			// Set active state to Layer menu button if it's open
			if ( this.__layerMenu._open ) this._openLayerMenu();

		}.bind(this), 50);
	},

	_showHideLayerButton : function () {
	},

	_setProjectTitle : function () {

		if ( !this._project ) return;

		// get project name, make sure it's not too long
		this._projectTitleName = this._shortenTitle(this._project.getHeaderTitle());

		// set project title
		this._projectTitle.innerHTML = this._projectTitleName.camelize();
	},

	_shortenTitle : function (title) {
		var maxLength = this._getMaxTitleLength();
		console.log('maxLength', maxLength);
		if (!title || !_.isString(title) || title.length <= maxLength) return title;
		var cutString = title.substring(0, maxLength-1) + '...';
		return cutString;
	},

	_getMaxTitleLength : function () {
		var screenSize = Wu.Util.getWindowSize();
		if (screenSize.width < 1120) return 15;
		if (screenSize.width < 1280) return 30;
		if (screenSize.width < 1320) return 35;
		if (screenSize.width < 1360) return 50;
		if (screenSize.width < 1421) return 65;
		if (screenSize.width < 1821) return 80;
		if (screenSize.width < 2221) return 90; // guessing, todo: test on large screen
		return 100;
	},

	_onWindowResize : function () {
		this._setProjectTitle();
	},

	_toggleLeftPane : function (e) {
		this._leftPaneisOpen ? this.closeLeftPane() : this.openLeftPane();
		Wu.Mixin.Events.fire('toggleLeftChrome', {detail : {leftPaneisOpen : this._leftPaneisOpen }}); 
	},

	openLeftPane : function () {

		// close other tabs
		Wu.Mixin.Events.fire('closeMenuTabs');

		this._leftPaneisOpen = true;

		// Set active state of button
		Wu.DomUtil.addClass(this._menuButton, 'active');

		// open left chrome
		app.Chrome.Left.open();

	},

	closeLeftPane : function () {

		// app.Chrome.Left.isOpen = false;
		this._leftPaneisOpen = false;

		// Remove active state of button
		Wu.DomUtil.removeClass(this._menuButton, 'active');

		// close left chrome
		app.Chrome.Left.close();

	},

	// close menu when clicking on map, header, etc.
	_addAutoCloseTriggers : function () {

		// map pane
		Wu.DomEvent.on(app.MapPane._container, 'click', this.closeLeftPane, this);
		
		// chrome top
		Wu.DomEvent.on(this._container, 'click', this.closeLeftPane, this);
	},

	_removeAutoCloseTriggers : function () {

		// map pane
		Wu.DomEvent.off(app.MapPane._container, 'click', this.closeLeftPane, this);
		
		// chrome top
		Wu.DomEvent.on(this._container, 'click', this.closeLeftPane, this);
	},

	setContentHeights : function () {

		var clientsPane = app.SidePane.Clients;
		var optionsPane = app.SidePane.Options;

		if (clientsPane) clientsPane.setContentHeight();
		if (optionsPane) optionsPane.setContentHeight();
	},


	_toggleLayermenu : function () {

		// Disable the ability to toggle off layer menu when in data library
		if ( app.Tools.DataLibrary._isOpen ) return;

		// Toggle
		this._layerMenuOpen ? this._closeLayerMenu() : this._openLayerMenu();
	},

	_openLayerMenu : function () {
	

		// use a variable to mark editor as open
		this._layerMenuOpen = true;

		// TODO: Open Layer Menu
		this.__layerMenu.openLayerPane();

		if ( !app.isMobile || !app.isMobile.mobile ) return;
		this.closeLeftPane();
	},

	_closeLayerMenu : function () {

		// mark not open
		this._layerMenuOpen = false;

		// TODO: Close Layer Menu
		this.__layerMenu.closeLayerPane();
	},	

	_onCloseMenuTabs : function () {	

		// app.Chrome();
		this.closeLeftPane();
	}
	
});