(function($){
TimeManager = new Class({
	Binds: ['addTimePies', 'debug', 'savePlayTime', 'saveJWPlayTime', 'saveKalturaPlayTime'],
	Implements: Options,
	options: {
		debug: 0,
		player: null,
		fileBase: null,
		duration: 0
		},

	initialSeekDone: false,
	speedInitialized: false,
	lastSaved: 0,

	initialize: function(options)
		{
		this.setOptions(options); 
		window.addEvent('domready', this.addTimePies);
		},

	playFaster: function() {},
	playSlower: function() {},
	setRate: function(rate) {},
	setSpeedControlFeedback: function() {},
	initSpeedControl: function()
		{
		if(this.speedInitialized) return;
		this.speedInitialized = true; 

		var tags = ['video','audio'];
		var media = null; 
		tags.each(function(tag)
			{
			var candidates = $$(tag); 
			if(candidates.length > 0)
				{
				candidate = candidates[0]; 
				if(candidate.playbackRate) { media = candidate; }
				}
			});

		if(media && (typeof media.playbackRate !== 'undefined') &&
			// Detect Chrome on Android to prevent the non-functioning rate controls from being added
			!(Browser.platform == "android" && Browser.name == "chrome")) 
			{
			var controller = $('speedcontrol');

			var slowButton = $('slower');
			var fastButton = $('faster');
			var feedback = $('currentSpeed');

			this.setSpeedControlFeedback = function()
				{
				var status = 'Normal - 1x'; 
				if(media.playbackRate != 1)
					status = media.playbackRate + "x"; 

				feedback.set('text', status);
				window.fireEvent("playbackRateChanged", player, media.playbackRate); 
				};

			this.setRate = (function(rate)
				{
				this.player.setPlaybackRate(Math.round(20*rate)/20);

				this.setSpeedControlFeedback();
				}).bind(this);

			this.playSlower = (function(e)
				{
				e.stop();
				var rate = media.playbackRate; 

				if(rate > 0)
					{
					var newRate = media.playbackRate - 0.10;
					if(e.shift)
						newRate = media.playbackRate / 2;
						
					this.setRate(newRate);
					}
				}).bind(this); 

			this.playFaster = (function(e)
				{
				e.stop();

				var newRate = media.playbackRate + 0.10;
				if(e.shift)
					newRate = media.playbackRate * 2;

				this.setRate(newRate);
				}).bind(this);

			slowButton.addEvent('click', this.playSlower); 
			fastButton.addEvent('click', this.playFaster); 

			controller.setStyle('display','block');
			}
		},
	debug: function(message, level=1)
		{
		if(this.options.debug >= level)
			console.log(message);
		},
	addTimePies: function()
		{
		var pies = $$('span.timePie');  
		for(var i = 0; i < pies.length; i++)
			{
			pie = pies[i];
			this.debug("pie:");
			this.debug(pie);
			var file = pie.get("forfile"); 
			this.debug("forfile:");
			this.debug(file);
			var value = null;
			var percent = null;
			// previous: this.fileBase = this.player.getPlaylistItem().file.replace(/^.*\/([^-]+\/[^-]+)/, "$1"); 

			if(file)
				{
				parameters = $.jStorage.get(file);
				this.debug("Parameters:");
				this.debug(parameters);

				if(parameters)
					{
					value = parameters["Piechart"]; 
					percent = parameters["Percent"]; 
					}
				}

			if(value)
				{
				pie.set("text", value); 
				var Pie = new PiePeity(pie, { diameter: 16 }); 
				}
			else
				{
				pie.hide();
				}

			if(percent)
				{
				pie.getParent().set("title", "Viewed: " + percent + "%");
				}
			};
		},
	//jwPlayer only
	onPlay: function(e)
		{
		// Check if a hash was added to the URL for the start time
		var startTime = this.checkStartHash();

		// Otherwise, check if a time was stored. 
		if(startTime < 0)
			{
			startTime = this.retrievePlayTime(); 

			if(this.options.duration > 0 && startTime >= (this.options.duration - 30))
				startTime = 0; 
			}

		if(startTime < 0)
			{
			startTime = 0; 
			}

		player.seek(startTime);
		player.on('time', this.savePlayTime);

		this.initSpeedControl(); 
		},

	saveJWPlayTime: function(e)
		{
		var position = e.position; 
		},
	saveKalturaPlayTime: function(time)
		{
		this.debug("Save time: " + time);

		// this isn't generally read until play so check if it's been set
		if(this.options.duration == 0)
			{
			var duration = this.options.player.evaluate("{duration}");
			this.debug("Getting duration");
			this.debug(duration);
			this.options.duration = duration;

			/*
			This throws an error - maybe becuase of cross-domain access privileges?
			this.debug("Getting mediaProxy entry");
			var entry = player.evaluate("{video.mediaProxy.entry}");

			this.debug(entry);
			*/
			}
		this.savePlayTime(time);
		},
	savePlayTime: function(position)
		{
		var now = Date.now();

		this.debug(now);
		this.debug(this.lastSaved);
		this.debug(now - this.lastSaved);
		if(now - this.lastSaved < 1000) return;

		if(null != this.options.fileBase && this.options.duration > 0) 
			{
			var savePosition = position;

			if(this.options.duration - savePosition < 30)
				savePosition = this.options.duration - 30; 

			var posRound = Math.floor(position * 100)/ 100;
			var outofRound = Math.floor(this.options.duration * 100) / 100;
			var percent = Math.floor(100 * posRound / outofRound); 

			var values = { 
				"position": savePosition,
				"Piechart": posRound + "/"+outofRound,
				"Percent": percent, 
				"TS": now
				};

			this.debug("Saving time for: " + this.options.fileBase);
			this.debug(values);

			$.jStorage.set(this.options.fileBase, values);

			this.lastSaved = now;
			}
		},

	retrievePlayTime: function()
		{
		for(var key in $.jStorage.storageObj())
			{
			var to_delete = false;

			// Delete old-style data, and expired new-style 
			if(key.match(/(Piechart|Percent)$/))
				{
				to_delete = true;
				}
			else if(key.match(/mp[34]/))
				{
				var stored = $.jStorage.get(key);
				if((typeof stored) == "object")
					{
					// Delete old keys after about a year
					if(Date.now() - stored.TS > 31557600000)
						{
						to_delete = true;
						}
					}
				else
					{
					to_delete = true;
					}
				}

			if(to_delete)
				$.jStorage.deleteKey(key);
			}

		parameters = $.jStorage.get(this.options.fileBase, null);

		if(parameters == null) return 0;

		return parameters.position;
		},

	checkStartHash: function()
		{
		var uri = new URI();
		var hash = uri.get("fragment");

		var timecode = 0;
		if(hash.match(/(\d+:)*\d+(\:\d+)?/))
			{
			var timeMuls = [1, 60, 3600, 86400]; 
			var times = hash.split(":").reverse(); 

			var parts = times.length;
			for(var i = 0; i < parts; i++)
				{
				timecode += timeMuls[i] * times[i];
				}

			return timecode;
			}

		return -1; 
		}
	});

})(document.id);
