var PageEvents; 

(function($){
PageEvents = {
	closeCaptionSuggester: function()
		{
		var player = jwplayer(); 

		if(player.getState() == "paused") player.pause(); // unpause if paused

		var clientId = $$('.captionAnchor.calloutAnchor')[0].get("clientid");
		$(clientId + "_caption_LinkButton").focus(); 
		},

	suggestPodcastEvent: function()
		{
		var clientId = $$('.captionAnchor.calloutAnchor')[0].get("clientid");

		var player = jwplayer(); 

		var grabCaption = function()
			{
			if(player.getState() == "playing") player.pause(); 

			var cc = player.getDisplayedCaptions();

			var beginString = String.format("{0:N3}", cc.cue.startTime); 
			var beginDecimal = beginString.substring(beginString.length - 4);

			var endString = String.format("{0:N3}", cc.cue.endTime); 
			var endDecimal = endString.substring(endString.length - 4);

			$(clientId + '_caption_file').set('value', player.getConfig().playlist[0].tracks[0].file.replace(/http.*(\/podcasts)/i,'$1')); 
			$(clientId + '_caption_start_time').set('value',player.utils.timeFormat(cc.cue.startTime) + beginDecimal); 
			$(clientId + '_caption_end_time').set('value',player.utils.timeFormat(cc.cue.endTime) + endDecimal); 

			$(clientId + '_caption_index').set('value',cc.index); 

			$(clientId + '_caption_current').set('value', cc.cue.text);
			$(clientId + '_caption_suggestion').set('value', cc.cue.text);
			};

		var grabButton = $("grab_caption"); 
		if(grabButton) 
			{
			grabButton.addEvent("click", grabCaption);
			grabCaption(); 
			}

		$(clientId + "_reportCaption_Panel").focus(); 
		},

	afterLike: function()
		{
		$("like_LinkButton").focus(); 
		},

	closeReportPanel: function()
		{
		var clientId = $$('.reportProblemAnchor.calloutAnchor')[0].get("clientid");

		$(clientId + "_problem_LinkButton").focus(); 
		},

	attachChangeEvent: function()
		{
		var clientId = $$('.reportProblemAnchor.calloutAnchor')[0].get("clientid");

		var dropdown = $(clientId + '_problem_DropDownList');
		var hiderItem = $('problemOtherItem');

		var toggle = function()
			{
			if(dropdown.get("value") == "other")
				{
				hiderItem.show();
				}
			else
				{
				hiderItem.hide();
				}
			};

		dropdown.addEvent("change", toggle);
		toggle();
		$(clientId + "_reportProblem_Panel").focus(); 
		}
	}; 

window.addEvent("domready", function()
	{
	var dlLink = $$('a.DownloadLink')[0];

	if(dlLink)
		{
		if(Browser.platform == 'ios')
			{
			dlLink.getParent("li").dispose();
			}
		else
			{
			dlLink.addEvent('click', function(e)
				{
				var tip = $('subscribeTip');
				tip.addClass('activated');

				(function()
					{
					tip.fade('out');
					(function()
						{
						tip.removeClass('activated');
						tip.set('style','');
						}).delay(2000);
					}).delay(7000);
				});
			}
		}
	});
})(document.id);
