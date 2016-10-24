Wu.Share = Wu.Pane.extend({
	
	type : 'share',
	title : 'Share',

	options : {
		permissions : [{
			title : 'View project',
			permission : 'read_project',
			checked : true,
			enabled : false
		},{
			title : 'Download data',
			permission : 'download_file',
			checked : false,
			enabled : true
		},{
			title : 'Invite others',
			permission : 'share_project',
			checked : true,
			enabled : true
		}],

		text : {
			screenshot : 'Create screenshot',
			invite : 'Invite others to project',
			creating : 'Creating screenshot...'
		}
	},

	initialize : function (options) {

		// set options
		Wu.setOptions(this, options);

		// init container
		this._initContent();
		
		// listen up (events on parent)
		this._listen();
	},      

	_initContent : function () {

		// create layout
		this._initLayout();

		// put button in top chrome
		this._registerButton();
	},

	_initLayout : function () {

		// create dropdown
		this._shareDropdown = Wu.DomUtil.create('div', 'share-dropdown displayNone', app._appPane);

		// items
		this._shareImageButton = Wu.DomUtil.create('div', 'share-item', this._shareDropdown);
		this._shareInviteButton  = Wu.DomUtil.create('div', 'share-item', this._shareDropdown);
		this._feedbackButton = Wu.DomUtil.create('div', 'share-item-processing', this._shareDropdown);

		// events
		Wu.DomEvent.on(this._shareImageButton,  'click', this._shareImage, this);
	},

	_registerButton : function () {

		// register button in top chrome
		var top = app.Chrome.Top;

		// add a button to top chrome
		this._shareButton = top._registerButton({
			name : 'share',
			className : 'chrome-button share',
			trigger : this._togglePane,
			context : this,
			project_dependent : true
		});

		// share icon
		this._shareButton.innerHTML = '<i class="fa fa-paper-plane"></i>';
	},

	_togglePane : function () {
		this._isOpen ? this._close() : this._open();
	},

	_setFeedback : function (msg) {
		this._feedbackButton.innerHTML = msg;
		Wu.DomUtil.addClass(this._feedbackButton, 'invite-feedback-active');

	},

	_closeFeedback : function () {
		this._feedbackButton.innerHTML = '';
		Wu.DomUtil.removeClass(this._feedbackButton, 'invite-feedback-active');
	},

	_open : function () {

		// close other tabs
		Wu.Mixin.Events.fire('closeMenuTabs');

		Wu.DomUtil.removeClass(this._shareDropdown, 'displayNone');
		this._isOpen = true;

		// mark button active
		Wu.DomUtil.addClass(this._shareButton, 'active');

		// fill titles
		this._fillTitles();
	},

	_close : function () {
		Wu.DomUtil.addClass(this._shareDropdown, 'displayNone');
		this._isOpen = false;

		// remove links if open
		if (this._shareLinkWrapper) Wu.DomUtil.remove(this._shareLinkWrapper);
		if (this._sharePDFInput) Wu.DomUtil.remove(this._sharePDFInput);
		if (this._inviteWrapper) Wu.DomUtil.remove(this._inviteWrapper);
		
		this._shareInviteButton.innerHTML = this.options.text.invite;
		Wu.DomUtil.removeClass(this._shareDropdown, 'wide-share');

		// mark button inactive
		Wu.DomUtil.removeClass(this._shareButton, 'active');

		// close feedback
		this._closeFeedback();
	},

	_onCloseMenuTabs : function () {
		this._close();
	},


	_fillTitles : function () {
		this._shareImageButton.innerHTML = this.options.text.screenshot;
		this._shareInviteButton.innerHTML = this.options.text.invite;
	},

	_clearTitles : function () {
		this._shareImageButton.innerHTML = '';
		this._shareInviteButton.innerHTML = '';
	},

	_addGhost : function () {
		this._ghost = Wu.DomUtil.create('div', 'share-ghost', app._appPane);
		Wu.DomEvent.on(this._ghost, 'click', this._close, this);
	},

	_removeGhost : function () {
		if (!this._ghost) return; 
		Wu.DomEvent.off(this._ghost, 'click', this._close, this);
		Wu.DomUtil.remove(this._ghost);
	},

	// on select project
	_refresh : function () {

		var project = this._project;

		if (project.isShareable()) {
			Wu.DomUtil.removeClass(this._shareInviteButton, 'disabled');
			Wu.DomEvent.on(this._shareInviteButton, 'click', this._shareInvite, this);
		} else {
			Wu.DomUtil.addClass(this._shareInviteButton, 'disabled');
			Wu.DomEvent.off(this._shareInviteButton, 'click', this._shareInvite, this);
		}
		
	},

	_shareImage : function () {

		// return this._setFeedback('Screenshot currently disabled.');

		// take snap
		app.phantomjs.snap(function (err, file) {

			// open image in new tab
			this.openImage(err, file);

		}.bind(this));

		// set progress bar for a 10sec run
		app.ProgressBar.timedProgress(3000);

		// set feedback
		this._setFeedback(this.options.text.creating);
	},

	openImage : function (context, file, c) {

		// parse results
		var result = Wu.parse(file);
		var image = result.image;
		var path = app.options.servers.portal;
		path += 'pixels/';
		path += image;
		path += '?raw=true'; // add raw to path
		path += '&access_token=' + app.tokens.access_token;

		// open (note: some browsers will block pop-ups. todo: test browsers!)
		window.open(path, 'mywindow')

		// close share dropdown
		this._close();

		var project = app.activeProject;

		// app.Analytics.onScreenshot({
		// 	project_name : project.getName(),
		// 	file_id : image
		// });

		// set feedback
		this._setFeedback('Done!');

	},

	

	_shareInvite : function () {
		app.Chrome.Left._tabs.projects.openShare();
		this._close();
	}

});
