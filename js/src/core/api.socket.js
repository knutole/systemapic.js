Wu.Socket = Wu.Class.extend({

	initialize : function () {

		// create socket
		this._socket = io.connect();

		// add listeners
		this._listen();

		// add loops
		this._addLoops();
	},

	_addLoops : function () {
		setInterval(function () {
			this._getServerStats();
		}.bind(this), 2000);
	},

	_getServerStats : function () {
		app.Socket.send('get_server_stats');
	},

	sendUserEvent : function (options) {
		// defaults
		options.user = options.user || app.Account.getFullName();
		options.timestamp = options.timestamp || Date.now();

		// send event
		var socket = this._socket;
		app.Socket.send('analytics', options);
	},

	analytics : function (options) {
		// // defaults
		// options.user = options.user || app.Account.getFullName();
		// options.timestamp = options.timestamp || Date.now();

		// send event
		var socket = this._socket;
		app.Socket.send('analytics', options);
	},


	send : function (channel, options, callback) {

		// add access_token
		var options = options || {};
		options.access_token = app.tokens.access_token;

		// send event
		var socket = this._socket;
		socket.emit(channel, options);
	},

	_listen : function () {
		var socket = this._socket;

		socket.on('server_stats', function (data) {
			var stats = data.server_stats;
			if (app.Chrome) app.Chrome.Top.updateCPUclock(stats.cpu_usage);
		});

		socket.on('connect', function(){
			console.log('Securely connected to socket.');
			app.Socket.send('ready');
		});
		
		socket.on('event', function(data){
			console.log('event data: ', data);
		});

		socket.on('tile_count', function(data){
			Wu.Mixin.Events.fire('tileCount', {
				detail : data
			});
		});
		
		socket.on('tileset_meta', function(data){
			Wu.Mixin.Events.fire('tileset_meta', {
				detail : data
			});
		});
		
		socket.on('disconnect', function(){
			console.log('disconnect!');
			// app._login('You have been logged out. Please log back in.')
		});
		
		socket.on('reconnect', function(){
			console.log('reconnecting!');
		});
		
		socket.on('reconnect_error', function(){
			console.log('reconnect_error!');
		});
		
		socket.on('reconnect_failed', function(){
			console.log('reconnect_failed!');
		});
		
		socket.on('processingProgress', function(data) {
			Wu.Mixin.Events.fire('processingProgress', {
				detail : data
			});
		});
		
		socket.on('stats', function(data) {
		});
		
		socket.on('uploadDone', function (data) {
		});
		
		socket.on('generate_tiles', function (data) {

			if (data.err) return;

			// fire
			Wu.Mixin.Events.fire('generatedTiles', {
				detail : data
			});

		});
		
		socket.on('downloadReady', function (data) {
			// select project
			var event_id = 'downloadReady-' + data.file_id;
			Wu.Mixin.Events.fire(event_id, {detail : data});
		});
		
		socket.on('processingDone', function (data) {

			// notify data lib
			var file_id = data.file_id;
			var import_took_ms = data.import_took_ms;

			app.Data._onImportedFile(file_id, import_took_ms);
		});
		
		socket.on('errorMessage', function (data) {

			var content = data.error;

			var uniqueIdentifier = content.uniqueIdentifier;

			if (uniqueIdentifier) {
				
				// file error
				Wu.Mixin.Events.fire('processingError', {
					detail : content
				});

			} else {

				app.FeedbackPane.setError({
					title : content.title,
					description : content.description
				});
			}

		});

	},

	getSocket : function () {
		return this._socket;
	},	

	
});