(function($) {
	$(document).ready(function() {
	$.ajax({
		url: "https://a4.ucsd.edu/tritON/resources/bugscript.jsp?target=https%3A%2F%2Fwww.ucsd.edu&jsoncallback=?",
		dataType: 'jsonp',
		jsonpCallback: 'a4sso',
		success: function(data) {
			if (data.eduUcsdActLoggedin) {
				var url = "<div id=\"tdr_login_content\">You are logged in to Single Sign-On | <a href=\"/Shibboleth.sso/Logout?return=\/logout\/\">Log Out</a><iframe src=\"https://" + document.location.hostname + "/login/transparent.gif\" width=\"0\" height=\"0\"></iframe></div>";
				$("#tdr_login").empty();
				$("#tdr_login").append(url);
				$("#tdr_login").attr("style", "display:block");
			}
		},
		error: function(jqXHR, textStatus) {
			console.log("error trying to communicate with a4 sso: " + textStatus);
		}
	});
	});
})(jQuery);

