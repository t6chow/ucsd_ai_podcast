(function($){
ResizePlayer = new Class({
	Binds: ['debug', 'getCurrentTime', 'getDuration', 'getVolume', 'handleKeys', 'jump', 'onPause', 'onPlay', 'pause', 'resizePlayer', 'seek', 'setCaptionLayout', 'setVolume'
	],
	Implements: Options,
	options: {
		debug: 0,
		playbackRate: 1.0,
		first_play: true,
		playing: false,
		caption_layout: false,
		caption_parameters: {
			maxSpace: 80,
			slope: 2.0 / 30,
			offset: 5
			}
		},
	player: null,
	initialize: function(options)
		{
		this.setOptions(options); 
		window.addEvent("resize", this.resizePlayer);
		window.addEvent("keydown", this.handleKeys);

		// When the Tips button is clicked, load the current time into the URL
		var updateTime = function() 
			{ 
			var timecode = 0;
			var displaytime = "0";
			try {
				timecode = this.getCurrentTime().toFixed(1);

				var tchours = timecode / 3600;
				var tcmin = (tchours % 1) * 60; 
				var tcsec = (tcmin % 1) * 60; 

				tchours = Math.floor(tchours).toString().padStart(2, "0");
				tcmin = Math.floor(tcmin).toString().padStart(2, "0");
				tcsec = tcsec.toFixed(1).toString().padStart(2, "0");
				
				displaytime = `${tchours}:${tcmin}:${tcsec}`;
				}
			catch (exception)
				{
				console.log(exception);
				}

			$('currentTime').set("href", $('currentTime').get('base_href').replace(/(#.*)?$/, '#' + timecode)); 
			$('currentTime').set("text", "Link to start at " + displaytime); 
			}.bind(this);

		if($('helpButton'))
			$('helpButton').addEvent("click", updateTime); 
		if($('updateCurrentTime'))
			$('updateCurrentTime').addEvent("click", updateTime); 
		}, 
	debug: function(message, level=1)
		{
		if(this.options.debug >= level)
			console.log(message);
		},
	getCurrentTime: function()
		{
		return this.options.player.evaluate("{video.player.currentTime}");
		},
	getDuration: function()
		{
		return this.options.player.evaluate("{duration}");
		},
	getVolume: function()
		{
		return this.options.player.evaluate("{video.volume}");
		},
	handleKeys: function(e)
		{
		var player = $(this.options.player).fireEvent(e);

		if(e.target.nodeName == "INPUT" || e.target.nodeName == "SELECT") return; 
		if(e.meta == true || e.control == true) return;

		if(e.key == 'left' || e.key == 'j')
			{
			if(e.shift) this.jump(-60); 
			else this.jump(-15); 
			}
		else if(e.key == 'right' || e.key == 'l')
			{
			if(e.shift) this.jump(60); 
			else this.jump(15); 
			}
		else if(e.key == 'k')
			{
			this.pause();
			}
		else if(e.key == '[' && e.code == 219)
			{
			if(e.shift)
				this.options.playbackRate = this.options.playbackRate / 2;
			else
				this.options.playbackRate -= 0.1;

			this.setPlaybackRate(this.options.playbackRate);
			}
		else if(e.key == ']')
			{
			if(e.shift)
				this.options.playbackRate = this.options.playbackRate * 2;
			else
				this.options.playbackRate += 0.1;
			this.setPlaybackRate(this.options.playbackRate);
			}
		else if(e.key >= '0' && e.key <= '9')
			{
			var duration = this.getDuration(); 

			if(duration > 0)
				{
				var seekTime = (e.key / 10.0) * duration; 
				this.seek(seekTime);
				}
			}
		else if(!e.target.hasClass('jwplayer'))
			{
			// Page-wide controls that duplicate JWPlayer controls
			if(e.key == 'space')
				{
				this.pause();
				}
			else if(e.key == 'up')
				{
				var volume = this.getVolume(); 
				volume = Math.min(volume + 0.1, 1); 
				this.setVolume(volume); 
				}
			else if(e.key == 'down')
				{
				var volume = this.getVolume(); 
				volume = Math.max(volume - 0.1, 0); 
				this.setVolume(volume); 
				}
			}

		e.stop(); 
		},
	jump: function(offset)
		{
		var position = this.getCurrentTime();
		this.seek(position + offset);
		},
	onPause: function()
		{
		this.options.playing = false;
		},
	onPlay: function()
		{
		this.options.playing = true;

		if(this.options.first_play == true)
			{
			if(this.getVolume() < 0.1) 
				this.setVolume(0.1);
			this.options.first_play = false;
			}
		// because clicking play takes keyboard focus away from the wrapper
		window.focus();
		},
	pause: function(e)
		{
		if(this.options.playing)
			this.options.player.sendNotification("doPause");
		else
			this.options.player.sendNotification("doPlay");
		},
	resizePlayer: function(e)
		{
		this.debug(e);
		var player = $(this.options.player);
		var spacer = $(this.options.spacer);

		var media_height = this.options.media_height * 1.0;
		var media_width = this.options.media_width * 1.0;

		this.debug("Height: " + media_height);
		this.debug("Width: " + media_width);

		var player_aspect = media_height / media_width;
		this.debug("Aspect: " + player_aspect);

		var mediaSize = player.getSize(); 
		var mediaHeight = mediaSize.x * player_aspect;
		var mediaWidth = mediaSize.x;
		this.debug("Media Height: " + mediaHeight);

		var caption_allowance = 0;
		if(this.options.caption_layout)
			{
			this.debug(this.options.caption_layout);

			let display = this.options.caption_layout.displayCaptions;
			let layout = this.options.caption_layout.layout;

			if(display == true && (layout == "above" || layout == "below"))
				{
				caption_allowance = 
					this.options.caption_parameters.offset + 
					Math.min(
						this.options.caption_parameters.maxSpace, 
						mediaWidth * this.options.caption_parameters.slope);

				// The value of 0.245 was determined experimentally, but varies based on font size
				this.debug("Caption Allowance: " + caption_allowance);
				}
			}

		var player_height = mediaHeight + caption_allowance;
		this.debug("Player Height: " + player_height);

		player.setStyle('aspect-ratio', 'auto ' + mediaSize.x + ' / ' + player_height);

		/*
		// set the spacer
		var spacer_aspect = (100.0 * player_height / mediaSize.x).toFixed(4);
		spacer.setStyle("margin-top", spacer_aspect + '%');
		*/
		},
	seek: function(position)
		{
		this.options.player.sendNotification("doSeek", position);
		},
	setCaptionLayout: function(e) {
		this.debug('Updating caption layout');
		this.options.caption_layout = $(this.options.player).evaluate("{closedCaptions}");
		this.debug(this.options.caption_layout.displayCaptions);
		this.debug(this.options.caption_layout.layout);
		this.resizePlayer();
		},
	setPlaybackRate: function(rate)
		{
		let rate_rounded = Math.round(20*rate)/20;
		this.options.player.sendNotification("playbackRateChangeSpeed", rate_rounded);
		// Adjusting the playback rate changes the focus of the player
		window.focus();
		},
	setVolume: function(volume)
		{
		this.debug("Setting volume: " + volume);
		this.options.player.sendNotification("changeVolume", volume);
		}
	});
})(document.id);
