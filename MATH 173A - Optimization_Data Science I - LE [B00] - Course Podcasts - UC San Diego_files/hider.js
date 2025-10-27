var contentHider;
window.addEvent("domready", function()
	{
	var contentHiders = [];

	contentHider = function(container, button, content)
		{
		if(!button) return;

		button.addEvent("click", function()
			{
			if(container.hasClass("activated"))
				button.fireEvent('deactivate');
			else
				button.fireEvent('activate');
			});

		button.addEvent('deactivate', function()
			{
			container.removeClass("activated");
			button.removeClass("primary");
			button.addClass("secondary");
			});

		button.addEvent('activate', function()
			{
			container.addClass("activated");
			button.addClass("primary");
			button.removeClass("secondary");

			content.focus(); 
			});

		button.hiderActive = function()
			{
			return container.hasClass('activated');
			};

		button.hiderContainer = container;

		contentHiders.push(button); 
		}; 
	
	window.addEvent('click', function(e)
		{
		contentHiders.each(function(hider) 
			{ 
			if(!hider.hiderActive()) 
				return; 

			if(!(hider.hiderContainer.contains(e.target)))
				{
				hider.fireEvent('deactivate'); 
				}
			});
		});
	});
