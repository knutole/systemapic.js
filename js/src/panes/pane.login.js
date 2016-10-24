Wu.Pane.Login = Wu.Pane.extend({

	_description : 'Sign in to Mapic',
	
	setDescription : function (text) {
		this._description = text;
	},

	open : function () {

		// select project
		Wu.Mixin.Events.fire('closePopups');

		// frames
		this._loginFullscreen = Wu.DomUtil.create('div', 'fullscreen-background', app._appPane);
		this._login_wrapper = Wu.DomUtil.create('div', 'login-wrapper', this._loginFullscreen);
		this._login_box = Wu.DomUtil.create('div', 'login-box', this._login_wrapper);

		// colors from login
		this._login_box.style.backgroundColor = app.options.logos.loginLogo.backgroundColor;
		this._login_box.style.color = app.options.logos.loginLogo.color;

		// logos
		this._createLogo();

		// login content wrapper
		this._loginInner = Wu.DomUtil.create('div', 'login-inner', this._login_box);
		this._forgotInner = Wu.DomUtil.create('div', 'login-forgot-inner', this._login_box);

		// description
		this._descriptionDiv = Wu.DomUtil.create('div', 'login-description', this._loginInner, this._description);
		this.login_form = Wu.DomUtil.create('form', 'login-form', this._loginInner);
		this.login_form.setAttribute('action', '/api/token');
		this.login_form.setAttribute('method', 'post');
		
		// email input
		this._email_input = this._createInput({
			label : 'Email',
			placeholder : 'name@domain.com',
			appendTo : this.login_form,
			type : 'email'
		});

		// password input
		this._password_input = this._createInput({
			label : 'Password',
			placeholder : 'Enter your password',
			appendTo : this.login_form,
			type : 'password'
		});

		// error feedback
		this._error_feedback = Wu.DomUtil.create('div', 'login-error-label', this._loginInner);

		// buttons wrapper
		this._buttons = Wu.DomUtil.create('div', 'login-buttons-wrapper', this._loginInner);

		// button
		this._loginBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save invite', this._buttons, 'Login');
		
		// cancel button
		this._cancelBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save invite cancel', this._buttons, 'Cancel');

		// forgot password
		this._forgotLink = Wu.DomUtil.create('a', 'login-forgot-link', this._buttons, 'Forgot your password?');

		// add events
		this.addEvents();

		// focus
		this._email_input.focus();
	},

	_createLogo : function () {
		var logoConfig = app.options.logos.loginLogo;
		var logo = Wu.DomUtil.create('div', 'login-popup-logo', this._login_box);
		logo.style.backgroundImage = logoConfig.image;
		logo.style.height = logoConfig.height;
		logo.style.width = logoConfig.width;
		logo.style.backgroundSize = logoConfig.backgroundSize;
		logo.style.backgroundPosition = logoConfig.backgroundPosition;
	},

	_openForgotPassword : function () {

		// hide login
		Wu.DomUtil.addClass(this._loginInner, 'displayNone');

		// add buttons
		this._forgotDescriptionDiv = Wu.DomUtil.create('div', 'login-description', this._forgotInner, 'Request password reset');

		// add input
		this._forgot_input = this._createInput({
			label : 'Email',
			placeholder : 'Enter your email',
			appendTo : this._forgotInner,
			type : 'email'
		});

		// buttons wrapper
		this._forgotButtons = Wu.DomUtil.create('div', 'login-buttons-wrapper', this._forgotInner);

		// button
		this._resetBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save invite', this._forgotButtons, 'Reset');
		
		// cancel button
		this._forgotCancelBtn = Wu.DomUtil.create('div', 'smooth-fullscreen-save invite cancel', this._forgotButtons, 'Cancel');

		// events
		Wu.DomEvent.on(this._forgotCancelBtn, 'click', this.close, this);
		Wu.DomEvent.on(this._resetBtn, 'click', this.requestReset, this);

		// set height
		this._login_box.style.height = '340px';
	},

	requestReset : function () {
		var email = this._forgot_input.value;

		app.api.resetPassword({
			email : email
		}, function (err, result) {
			if (err) {
				app.feedback.setError({
					title : 'Something went wrong.',
				});
			} else {
				app.feedback.setMessage({
					title : 'Password reset',
					description : result
				});
			}

			// close window
			this.close();

		}.bind(this));
	},

	addEvents : function () {
		// add events
		// Wu.DomEvent.on(this._loginFullscreen, 'click', this.close, this);
		Wu.DomEvent.on(this._login_box, 'click', Wu.DomEvent.stop, this);
		Wu.DomEvent.on(this._loginBtn, 'click', this._doLogin, this);
		Wu.DomEvent.on(this._cancelBtn, 'click', this.close, this);
		Wu.DomEvent.on(this._password_input, 'keydown', this._checkEnter, this);
		Wu.DomEvent.on(this._forgotLink, 'click', this._openForgotPassword, this);
		Wu.DomEvent.on(window, 'keydown', this._keyDown, this);
	},

	removeEvents : function () {
		// remove events
		// Wu.DomEvent.off(this._loginFullscreen, 'click', this.close, this);
		Wu.DomEvent.off(this._login_box, 'click', Wu.DomEvent.stop, this);
		Wu.DomEvent.off(this._loginBtn, 'click', this._doLogin, this);
		Wu.DomEvent.off(this._cancelBtn, 'click', this.close, this);
		Wu.DomEvent.off(this._password_input, 'keydown', this._checkEnter, this);
		Wu.DomEvent.off(window, 'keydown', this._keyDown, this);

	},

	_keyDown : function (e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 27) { //Enter keycode
			this.close(e);
		}
	},

	_checkEnter : function (e) {
		var code = (e.keyCode ? e.keyCode : e.which);
		if(code == 13) { //Enter keycode	
			this._doLogin(e);
		}	
	},

	_doLogin : function (e) {
		Wu.DomEvent.stop(e);

		// clear feedback
		this._error_feedback.innerHTML = '';

		// get fields
		var email = this._email_input.value;
		var password = this._password_input.value;

		// get token from user/pass from server
		app.api.getTokenFromPassword({
			email : email,
			password : password
		}, this._didLogin.bind(this));
	},

	_didLogin : function (err, result) {
		var tokens = Wu.parse(result);

		// invalid credentials
		if (err && err == 400) {
			// set error feedback
			return this._error_feedback.innerHTML = tokens.error.message;
		}

		// set tokens
		app.tokens = tokens;

		// reload portal
		window.location = app.options.servers.portal;
	},

	_createInput : function (options) {

		var appendTo = options.appendTo;
		var label = options.label;
		var type = options.type;
		var placeholder = options.placeholder;

		// label
		var name = Wu.DomUtil.create('div', 'smooth-fullscreen-name-label invite-emails', appendTo, label);
		
		// container
		var invite_container = Wu.DomUtil.create('div', 'invite-container narrow', appendTo);
		var invite_inner = Wu.DomUtil.create('div', 'invite-inner', invite_container);
		var invite_input_container = Wu.DomUtil.create('div', 'invite-input-container', invite_inner);

		// input box
		var invite_input = Wu.DomUtil.create('input', 'invite-email-input-form', invite_input_container);
		var invite_error = Wu.DomUtil.create('div', 'smooth-fullscreen-error-label', appendTo);
		if (type) invite_input.setAttribute('type', type);
		if (placeholder) invite_input.setAttribute('placeholder', placeholder);

		return invite_input;
	},

	close : function () {
		this.removeEvents();
		Wu.DomUtil.remove(this._loginFullscreen);
	},

	_onCloseMenuTabs : function () {
		this.close();
	}

});