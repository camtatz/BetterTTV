/**
 * Copyright (c) 2013 NightDev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice, any copyright notices herein, and this permission
 * notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

BetterTTVEngine = function() {

	var betterttvVersion = "6.3.5",
		betterttvDebug = {
			log: function(string) { if(window.console && console.log) console.log("BTTV: "+string); },
			warn: function(string) { if(window.console && console.warn) console.warn("BTTV: "+string); },
			error: function(string) { if(window.console && console.error) console.error("BTTV: "+string); },
			info: function(string) { if(window.console && console.info) console.info("BTTV: "+string); }
		},
		currentViewers = [];
		liveChannels = [],
		blackChat = false,
		reloadViewers = false;

	/**
	 * Helper Functions
	 */
	replaceAll = function(m, s1, s2) {
		return m.split(s1).join(s2);
	}

	String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	}

	removeElement = function(e) {

		bttvJquery(e).each(function(e){ bttvJquery(this).hide(); });

	}

	displayElement = function(e) {

		bttvJquery(e).each(function(e){ bttvJquery(this).show(); });

	}

	escapeRegExp = function(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}

	calculateColorBackground = function(color) {
		color = String(color).replace(/[^0-9a-f]/gi, '');
		if (color.length < 6) {
			color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
		}

		var r = parseInt(color.substr(0,2),16);
		var g = parseInt(color.substr(2,2),16);
		var b = parseInt(color.substr(4,2),16);
		var yiq = ((r*299)+(g*587)+(b*114))/1000;
		return (yiq >= 128) ? "dark" : "light";
	}

	calculateColorReplacement = function(color, background) {
		// Modified from http://www.sitepoint.com/javascript-generate-lighter-darker-color/
		var rgb = "#", brightness, c, i;

		color = String(color).replace(/[^0-9a-f]/gi, '');
		if (color.length < 6) {
			color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
		}

		(background === "light") ? (brightness="0.5") : (brightness="-0.5");

		for (i = 0; i < 3; i++) {
			c = parseInt(color.substr(i*2,2), 16);
			c = Math.round(Math.min(Math.max(0, c + (c * brightness)), 255)).toString(16);
			rgb += ("00"+c).substr(c.length);
		}

		return rgb;
	}

	/**
	 * Core Functions
	 */
	clearAds = function() {

		betterttvDebug.log("Clearing Ads");

		var frontPageAd = document.getElementById("Twitch_FPopaBanner"),
			directoryPageAd = document.getElementById("Twitch_DiropaBanner");

		if(frontPageAd || directoryPageAd || bttvJquery(".takeover").length) {
			bttvJquery("body").removeClass("takeover");
			bttvJquery("body").css("background","url(\"../images/xarth/bg_noise.png\") repeat scroll 0% 0% rgb(38, 38, 38)");
			bttvJquery("#mantle_skin").css("background","none");
			window.addEventListener("click", null, false);
			window.removeEventListener("click", null, false);
			window.addEventListener("mouseover", null, false);
			window.removeEventListener("mouseover", null, false);
		}

		if(localStorage.getItem("showFeaturedChannels") !== "true") {
			removeElement('.sm_vids');
			removeElement('#nav_games');
			removeElement('#nav_streams');
			removeElement('.featured');
			removeElement('.related');
		}

		removeElement('#nav_other');
		removeElement('.hide_ad');
		removeElement('.fp_ad');
		removeElement('.advertisement');
		removeElement('.ad_contain');
		bttvJquery('#right_col').addClass('noads');

		if(localStorage.getItem("blockSubButton") === "true") {
			bttvJquery("#sub-details").css("display","none");
		}

	}

	channelReformat = function() {

		// Legacy Function
		// EOL; No more updates

		var player = document.getElementById("player_column"),
			teamPage = document.getElementById("team_member_list"),
			dashboard = document.getElementById("dashboard_title");

		if(!player || teamPage || dashboard) return;

		betterttvDebug.log("Reformatting Channel");

		bttvJquery(".main").css({
			background: "none",
			border: "none",
			boxShadow: "none",
			marginTop: "-20px",
			webkitBoxShadow: "none",
			MozBoxShadow: "none"
		});
		bttvJquery("#chat_column").css({
			background: "rgba(255, 255, 255, 0.9)",
			borderRadius: "5px",
			marginLeft: "-15px",
			marginTop: "16px",
			padding: "5px",
			webkitBorderRadius: "5px",
			MozBorderRadius: "5px"
		});
		bttvJquery("#live_site_player_flash").css({
			height: "395px",
			width: "640px"
		});
		bttvJquery("#player_column").css({
			background: "rgba(0, 0, 0, 0.6)",
			color: "#ffffff",
			marginLeft: "-25px",
			marginTop: "15px",
			padding: "5px",
			width: "640px"
		});
		bttvJquery("#standard_holder").css({
			height: "395px",
			width: "640px"
		});

		bttvJquery(".tabs").html('<li target="about" class="tab selected"><a href="#">&nbsp;Info&nbsp;</a></li><li target="archives" class="tab"><a href="/' + PP['channel'] + '/videos">&nbsp;Videos&nbsp;</a></li>');
		bttvJquery("#archives").html('');

		if(localStorage.getItem("narrowchat") === "no") {
			bttvJquery(".c12").css("width","1100px");
			bttvJquery("#chat_column").css("width", "410px");
		} else {
			bttvJquery(".c12").css("width","1000px");
			bttvJquery("#chat_column").css("width", "330px");
		}

		bttvJquery("#about").css("display", "inline");

		if(document.getElementById("player_column")) {
			if(document.getElementById("dash_main")) return;
			if(document.getElementById("team_member_list")) return;
			var channelCSS = document.createElement("style");
			channelCSS.setAttribute("type","text/css");
			channelCSS.innerHTML = "#live_channel_name {color:white;} #broadcast_meta #follow_and_filters a { color:#ffffff !important; } #status:focus { color:black !important; } #gameselector_input:focus { color:black !important; } #gameselector_input { color:white; }  #broadcast_meta_edit #status { color: #ffffff; } .gameselector_result_desc { color: #ffffff !important; } .main { background: none !important; } #about a {color:white;text-decoration:underline;} ul.tabs {border-bottom:thin solid #262626;padding-top:5px;padding-left:15px;} ul.tabs li.tab a {color: white; background-color:#262626; border-top-right-radius:5px; margin-left:-10px; margin-top:3px;} ul.tabs li.selected a { border-top-left-radius:5px;border-top-right-radius:5px;margin-left:0px;background-color:#787878;color: #ffffff; margin-top:0px; }";
			bttvJquery('body').append(channelCSS);
			if(document.getElementById("facebook_connect")) document.getElementById("facebook_connect").style.background = "none"; document.getElementById("facebook_connect").style.marginBottom = "5px"; document.getElementById("facebook_connect").style.padding = "0px"; document.getElementById("facebook_connect").innerHTML = "&nbsp;";
		}

		if(!document.getElementById("broadcast_meta")) return;
		if(!document.getElementById("vod_form") && document.getElementById("channel_viewer_count") && bttvJquery(".betabar").length === 0) {
			document.getElementById("channel_viewer_count").style.background = "url(http://cdn.betterttv.net/viewers.png) no-repeat";
			document.getElementById("channel_viewer_count").style.backgroundPosition = "0px -1px";
			document.getElementById("views_count").style.background = "url(http://cdn.betterttv.net/views.png) no-repeat";
			document.getElementById("views_count").style.backgroundPosition = "0px -1px";
			document.getElementById("followers_count").style.background = "url(http://cdn.betterttv.net/followers.png) no-repeat";
			document.getElementById("followers_count").style.backgroundPosition = "0px -1px";
		}

	}

	chatReformat = function() {

		var chat = document.getElementById("chat_lines"),
			channelHeader = document.getElementById("header_banner");

		if(!chat) return;

		betterttvDebug.log("Reformatting Chat");

		if(channelHeader) {
			channelHeader = 125;
		} else {
			channelHeader = 0;
		}

		if(PP['page_type'] === "channel" && bttvJquery(".betabar").length === 0) {
			bttvJquery("#chat_lines").css({
				fontFamily: "Helvetica, Arial, sans-serif",
				height: channelHeader+450 + "px",
				maxHeight: channelHeader+450 + "px",
				overflowX: "hidden",
				overflowY: "auto",
				width: "100%"
			});
		} else {
			bttvJquery("#chat_lines").css({
				fontFamily: "Helvetica, Arial, sans-serif",
			});
		}

		bttvJquery('#chat_loading_spinner').attr('src',"data:image/gif;base64,R0lGODlhFgAWAPMGANfX1wAAADc3N1tbW6Ojo39/f2tra8fHx9nZ2RsbG+np6SwsLEtLS4eHh7q6ugAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hoiQ3JlYXRlZCB3aXRoIENoaW1wbHkuY29tIgAh+QQJCgAGACwAAAAAFgAWAAAEbNCESY29OEvBRdDgFXReGI7dZ2oop65YWypIjSgGbSOW/CGAIICnEAIOPdLPSDQiNykDUNgUPn1SZs6ZjE6D1eBVmaVurV1XGXwWp0vfYfv4XpqLaKg6HqbrZzs4OjZ1MBlYhiJkiYWMfy+GEQAh+QQJCgAGACwAAAAAFgAWAAAEctDIKYO9NKe9lwlCKAQZlQzo4IEiWUpnuorjC6fqR7tvjM4tgwJBJN5kuqACwGQef8kQadkEPHMsqbBqNfiwu231CtRSm+Ro7ez04sprbjobH7uR9Kn8Ds2L0XxgSkVGgXA8JV+HNoZqiBocCYuMJX4vEQAh+QQJCgAAACwAAAAAFgAWAAAEcxDISWu4uNLEOwhCKASSGA5AMqxD8pkkIBR0gaqsC4rxXN+s1otXqtlSQR2s+EPmhqGeEfjcRZk06kpJlE2dW+gIe8SFrWNv0yxES9dJ8TsLbi/VdDb3ii/H3WRadl0+eX93hX5ViCaCe2kaKR0ccpGWlREAIfkECQoAAQAsAAAAABYAFgAABHUwyEmrvTisxHlmQigw2mAOiWSsaxMwRVyQy4mqRE64sEzbqYBBt3vJZqVTcKjjHX9KXNPoS5qWRGe1FhVmqTHoVZrThq0377R35o7VZTDSnWbG2XMguYgX1799aFhrT4J7ZnldLC1yfkEXICKOGRcbHY+UlBEAIfkECQoAAQAsAAAAABYAFgAABHIwyEmrvThrOoQXTFYYpFEEQ6EWgkS8rxMUMHGmaxsQR3/INNhtxXL5frPaMGf0AZUooo7nTAqjzN3xecWpplvra/lt9rhjbFlbDaa9RfZZbFPHqXN3HQ5uQ/lmSHpkdzVoe1IiJSZ2OhsTHR8hj5SVFREAIfkECQoAAQAsAAAAABYAFgAABGowyEmrvTjrzWczIJg5REk4QWMShoQAMKAExGEfRLq2QQzPtVtOZeL5ZLQbTleUHIHK4c7pgwqZJWM1eSVmqTGrTdrsbYNjLAv846a9a3PYvYRr5+j6NPDCR9U8FyQmKHYdHiEih4uMjRQRACH5BAkKAAEALAAAAAAWABYAAARkMMhJq7046807d0QYSkhZKoFiIqhzvAchATSNIjWABC4sBznALbfrvX7BYa0Ii81yShrT96xFdbwmEhrALbNUINcrBR+rti7R7BRb1V9jOwkvy38rVmrV0nokICI/f4SFhocSEQAh+QQJCgABACwAAAAAFgAWAAAEWjDISau9OOvNu7dIGCqBIiKkeUoH4AIk8gJIOR/sHM+1cuev3av3C7SCAdnQ9sIZdUke0+U8uoQuYhN4jS592ydSmZ0CqlAyzYweS8FUyQlVOqXmn7x+z+9bIgA7");

	}

	newChannelReformat = function() {
		
		if(bttvJquery(".betabar").length === 0) return;

		betterttvDebug.log("Reformatting Beta Channel Page");

		if(localStorage.getItem("chatWidth")) {
			if(localStorage.getItem("chatWidth") < 0) {
				localStorage.setItem("chatWidth", 0)
			}
		}

		bttvJquery('#right_col').append("<div class='resizer' onselectstart='return false;' title='Drag to enlarge chat =D'></vid>");
		bttvJquery("#right_col:before").css("margin-left","-1");

		bttvJquery(document).ready(function()
		{
			var resize = false;

			bttvJquery("#right_col .content .bottom #controls #control_buttons .primary_button").css("float","right");
			bttvJquery("#right_nav").css({'margin-left' : 'auto','margin-right' : 'auto','width' : '300px','float' : 'none','border' : 'none'});
			bttvJquery('#right_col .content .top').css('border-bottom', '1px solid rgba(0, 0, 0, 0.25)')

			bttvJquery("#right_close").unbind('click');

			bttvJquery("#left_close").click(function(a) {
				bttvJquery(window).trigger('resize');
			});

			bttvJquery(document).keydown(function(event){
				if(event.keyCode === 82 && event.altKey) {
					bttvJquery(window).trigger('resize');
				}
			});

			var handleResize = function() {
				betterttvDebug.log("Page resized");
				clearAds();

				var d = 0;
				if(bttvJquery("#large_nav").css("display") !== "none") {
					d += bttvJquery("#large_nav").width();
				}
				if(bttvJquery("#small_nav").css("display") !== "none") {
					d += bttvJquery("#small_nav").width();
				}
				if(chatWidth == 0) {
					bttvJquery("#right_col").css({
	            		display: "none"
			        });
			        bttvJquery("#right_close span").css({
			            "background-position": "0 0"
			        });
				}
				if(bttvJquery("#right_col").css("display") !== "none") {
					if(bttvJquery("#right_col").width() < 320) {
						chatWidth = 320;
						bttvJquery("#right_col").width(chatWidth);
						bttvJquery("#right_col .content #chat").width(chatWidth);
						bttvJquery("#right_col .content .top").width(chatWidth);
						bttvJquery("#chat_line_list").width(chatWidth);
						bttvJquery("#chat_lines").width(chatWidth);
						bttvJquery("#right_col").css("display","inherit");
						bttvJquery("#right_close span").css({
				            "background-position": "0 -18px"
				        });
				        handleResize();
				        return;
					} else {
						d += bttvJquery("#right_col").width();
					}
				}

	            bttvJquery("#main_col").css({
	                width: bttvJquery(window).width() - d + "px"
	            });

	            if(bttvJquery(".live_site_player_container").length) {
	            	var h = 0.5625 * bttvJquery("#main_col").width() - 4;
		            videoMargin = 0;
		            var calcH = bttvJquery(window).height() - bttvJquery("#broadcast_meta").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight()+45 - videoMargin - 10;
		            if(h > calcH) {
		            	bttvJquery(".live_site_player_container").css({ height: bttvJquery(window).height() - bttvJquery("#stats_and_actions").outerHeight()+45 - videoMargin - 10 + "px" });
		            	bttvJquery("#main_col .tse-scroll-content").animate({ scrollTop: bttvJquery('.live_site_player_container').position().top-10 }, 150, "swing");
		            } else {
		            	bttvJquery(".live_site_player_container").css({ height: h.toFixed(0) + "px" });
		            	bttvJquery("#main_col .tse-scroll-content").animate({ scrollTop: 0 }, 150, "swing");
		            }
	            } else if(bttvJquery(".archive_site_player_container").length) {
	            	var h = 0.5625 * bttvJquery("#main_col").width() - 4;
		            videoMargin = 0;
		            var calcH = bttvJquery(window).height() - bttvJquery("#broadcast_meta").outerHeight(true) - bttvJquery(".archive_info").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight()+45 - videoMargin - 10;
		            if(h > calcH) {
		            	bttvJquery(".archive_site_player_container").css({ height: bttvJquery(window).height() - bttvJquery(".archive_info").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight()+45 - videoMargin - 10 + "px" });
		            	bttvJquery("#main_col .tse-scroll-content").animate({ scrollTop: bttvJquery('.archive_site_player_container').position().top-10 }, 150, "swing");
		            } else {
		            	bttvJquery(".archive_site_player_container").css({ height: h.toFixed(0) + "px" });
		            	bttvJquery("#main_col .tse-scroll-content").animate({ scrollTop: 0 }, 150, "swing");
		            }
	            }
	            
				var d = bttvJquery("#broadcast_meta .info .title").width();
				bttvJquery("#broadcast_meta .info .title .real_title").width() > d ? bttvJquery("#broadcast_meta .info").addClass("long_title") : bttvJquery("#broadcast_meta .info").removeClass("long_title");
				bttvJquery("#channel_panels_contain").masonry("reload");
			}

			if(Twitch.storage.get("rightColClosed") === "true") {
				localStorage.setItem("chatWidth", 0);
				if(bttvJquery("#right_col").width() == "0") {
					bttvJquery("#right_col").width("320px");
				}
				Twitch.storage.set("rightColClosed","false");
			}

			if(localStorage.getItem("chatWidth")) {
				chatWidth = localStorage.getItem("chatWidth");

				if(chatWidth == 0) {
					bttvJquery("#right_col").css({
	            		display: "none"
			        });
			        bttvJquery("#right_close span").css({
			            "background-position": "0 0"
			        });
				} else {
					bttvJquery("#right_col").width(chatWidth);
					bttvJquery("#right_col .content #chat").width(chatWidth);
					bttvJquery("#right_col .content .top").width(chatWidth);

					bttvJquery("#chat_line_list").width(chatWidth);
					bttvJquery("#chat_lines").width(chatWidth);
				}

				handleResize();
			} else {
				if(bttvJquery("#right_col").width() == "0") {
					bttvJquery("#right_col").width("320px");
				}
				chatWidth = bttvJquery("#right_col").width();
				localStorage.setItem("chatWidth", bttvJquery("#right_col").width());
			}

			bttvJquery(document).mouseup(function(event)
			{
				if(resize === false) return;
				if(chatWidthStartingPoint) {
					if(chatWidthStartingPoint === event.pageX) {
						if(bttvJquery("#right_col").css("display") !== "none") {
							bttvJquery("#right_col").css({
			            		display: "none"
					        });
					        bttvJquery("#right_close span").css({
					            "background-position": "0 0"
					        });
					        chatWidth = 0;
						}
					} else {
						chatWidth = bttvJquery("#right_col").width();
					}
				} else {
					chatWidth = bttvJquery("#right_col").width();
				}
				localStorage.setItem("chatWidth", chatWidth);

				resize = false;
				handleResize();
			});

			bttvJquery("#right_close, #right_col .resizer").mousedown(function(event)
			{
				resize = event.pageX;
				chatWidthStartingPoint = event.pageX;
				bttvJquery("#chat_text_input").focus();
				if(bttvJquery("#right_col").css("display") === "none") {
			        bttvJquery("#right_col").css({
			            display: "inherit"
			        });
			        bttvJquery("#right_close span").css({
			            "background-position": "0 -18px"
			        });
					resize = false;
					if(bttvJquery("#right_col").width() < 320) {
						bttvJquery("#right_col").width(bttvJquery("#right_col .content .top").width());
					}
					chatWidth = bttvJquery("#right_col").width();
					localStorage.setItem("chatWidth", chatWidth);
			        handleResize();
				}
			});

			bttvJquery(document).mousemove(function(event)
			{

				if(resize)
				{
					bttvJquery("#chat_text_input").focus();
					if(chatWidth + resize - event.pageX < 320) {
						bttvJquery("#right_col").width(320);
						bttvJquery("#right_col .content #chat").width(320);
						bttvJquery("#right_col .content .top").width(320);
						bttvJquery("#chat_line_list").width(320);
						bttvJquery("#chat_lines").width(320);

						handleResize();
					} else if(chatWidth + resize - event.pageX > 541) {
						bttvJquery("#right_col").width(541);
						bttvJquery("#right_col .content #chat").width(541);
						bttvJquery("#right_col .content .top").width(541);
						bttvJquery("#chat_line_list").width(541);
						bttvJquery("#chat_lines").width(541);

						handleResize();
					} else {
						bttvJquery("#right_col").width(chatWidth + resize - event.pageX);
						bttvJquery("#right_col .content #chat").width(chatWidth + resize - event.pageX);
						bttvJquery("#right_col .content .top").width(chatWidth + resize - event.pageX);
						bttvJquery("#chat_line_list").width(chatWidth + resize - event.pageX);
						bttvJquery("#chat_lines").width(chatWidth + resize - event.pageX);

						handleResize();
					}
				}
			});

			var resizeTimeout = null;
			bttvJquery(window).off("fluid-resize").on("fluid-resize", function () {
				resizeTimeout = window.setTimeout(handleResize, 500);
			});
			bttvJquery(window).resize(function () {
				bttvJquery(window).trigger('fluid-resize');
			});
		});

	}

	brand = function() {

		betterttvDebug.log("Branding Twitch with BTTV logo");

		if(bttvJquery("#header_logo").length) {
			bttvJquery("#header_logo").html("<img alt=\"TwitchTV\" src=\"http://cdn.betterttv.net/newtwitchlogo.png\">");
			var watermark = document.createElement("div");
			watermark.style.marginTop = "-45px";
			watermark.style.marginLeft = "-8px";
			watermark.innerHTML = "Better";
			watermark.style.color = "#FF0000";
			watermark.style.fontWeight = "bold";
			watermark.style.fontSize = "15px";
			watermark.style.zIndex = "9000";
			watermark.style.opacity = "0.9";
			watermark.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
			watermark.style.textDecoration = "none";
			bttvJquery("#header_logo").append(watermark);
		}

		if(bttvJquery("#logo").length) {
			var watermark = document.createElement("div");
			watermark.style.marginTop = "-10px";
			watermark.style.marginLeft = "38px";
			watermark.innerHTML = "Better";
			watermark.style.color = "#FF0000";
			watermark.style.fontWeight = "bold";
			watermark.style.fontSize = "20px";
			watermark.style.textIndent = "0px";
			watermark.style.zIndex = "9000";
			watermark.style.opacity = "0.9";
			watermark.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
			watermark.style.textDecoration = "none";
			bttvJquery("#logo").append(watermark);
		}

		bttvJquery(".column .content #you").append('<a class="bttvSettingsIcon" href="#" onclick="betterttvAction(\'openSettings\'); return false;"></a>');

		var growlCSSInject = document.createElement("link");
		growlCSSInject.setAttribute("href","http://cdn.betterttv.net/jquery.gritter.css");
		growlCSSInject.setAttribute("type","text/css");
		growlCSSInject.setAttribute("rel","stylesheet");
		bttvJquery("head").append(growlCSSInject);

		var globalCSSInject = document.createElement("link");
		globalCSSInject.setAttribute("href","http://cdn.betterttv.net/betterttv.css");
		globalCSSInject.setAttribute("type","text/css");
		globalCSSInject.setAttribute("rel","stylesheet");
		bttvJquery("body").append(globalCSSInject);

		if(localStorage.getItem("showPurpleButtons") !== "true") {
			cssBlueButtons();
		}

		bttvJquery("#commercial_options .dropmenu_action[data-length=150]").html("2m 30s")

		bttvJquery("body#chat").css("overflow-y","hidden");

	}

	checkMessages = function(videopage) {

		betterttvDebug.log("Check for New Messages");

		if(Twitch.user.isLoggedIn() && window.FirebaseRootNamespaced) {
			PP['notificationsLoaded'] = false;
			PP['notifications'] = 0;
	        window.FirebaseRootNamespaced.child("users/" + Twitch.user.userId() + "/messages").on("value", function (f) {
	        	var f = f.val() || {}, j = f.unreadMessagesCount;
	            bttvJquery(".js-unread_message_count").html(j || "");
	            j ? bttvJquery(".js-unread_message_count").show() : bttvJquery(".js-unread_message_count").hide();
	            if(PP['notificationsLoaded'] === true && PP['notifications'] < j) {
	            	bttvJquery.get('http://www.twitch.tv/inbox', function(data) {
						var messageSender = /class="capital">(.*)<\/a>/i.exec(data);
						var messageSenderAvatar = /class="p30" src="(.*)"/i.exec(data);
						if(messageSender && messageSenderAvatar) {
							messageSender = messageSender[1].capitalize();
							messageSenderAvatar = messageSenderAvatar[1];
						} else {
							messageSender = "Someone";
							messageSenderAvatar = "";
						}
						bttvJquery.gritter.add({
					        title: 'Message Received',
					        class_name: 'gritter-light',
					        image: messageSenderAvatar,
					        text: messageSender+' just sent you a Twitch Message!<br /><br /><a style="color:black" href="http://www.twitch.tv/inbox">Click here to head to to your inbox</a>.',
					    });
					});
	            }
	            PP['notifications'] = j;
	            PP['notificationsLoaded'] = true;
	            if(PP['notifications'] > 0 && document.getElementById("header_logo")) {
					if(document.getElementById("messagescount")) {
						document.getElementById("messagescount").innerHTML = PP['notifications'];
					} else {
						messagesnum = document.createElement("a");
						header_following = document.getElementById("header_following");
						messagesnum.setAttribute("id","messagescont");
						messagesnum.setAttribute("href","/inbox");
						messagesnum.setAttribute("class","normal_button");
						messagesnum.setAttribute("style","margin-right: 10px;");
						messagesnum.innerHTML = "<span id='messagescount' style='padding-left:28px;background-image:url(http://cdn.betterttv.net/messages.png);background-position: 8px 4px;padding-top:-1px;background-repeat: no-repeat;color:black;'>" + PP['notifications'] + "</span>";
						header_following.parentNode.insertBefore(messagesnum, header_following);
					}
				} else {
					if(document.getElementById("messagescont")) document.getElementById("messagescont").remove();
				}
	        });
		}

	}

	cssBlueButtons = function() {

		betterttvDebug.log("Turning Purple to Blue");

		var globalCSSInject = document.createElement("style");
		globalCSSInject.setAttribute("type","text/css");
		globalCSSInject.setAttribute("id","bttvBlueButtons");
		globalCSSInject.innerHTML = ".game_filter.selected a{background-color:#374a9b!important;}#large_nav .game_filter.selected a {border: #000;background-color: #374a9b !important;}.primary_button:hover,.primary_button:focus {background: linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -o-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -moz-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -webkit-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -ms-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);}.primary_button {border-color: #000 !important;background: linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -o-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -moz-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -webkit-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -ms-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);}#team_member_list .page_links a {color: #374a9b !important;}#team_member_list .page_links a b.left {border-left-color: #374a9b !important;}#team_member_list .page_links a b.right {border-left-color: #374a9b !important;}";
		bttvJquery("body").append(globalCSSInject);

	}

	chatFunctions = function() {

		if(!document.getElementById("chat_lines")) return;

		betterttvDebug.log("Modifying Chat Functionality");

		CurrentChat.admin_message("<center><small>BetterTTV v"+ betterttvVersion +" Loaded.</small></center>");

		Chat.prototype.insert_chat_lineOld=Chat.prototype.insert_chat_line;
		Chat.prototype.insert_chat_line=function(info)
		{
			if(currentViewers && currentViewers.indexOf(info.nickname) === -1 && info.nickname !== "jtv") {
				currentViewers.push(info.nickname);
			}

			if(CurrentChat.currently_scrolling) {
				setTimeout(function(){ bttvJquery("#chat_lines").scrollTop(bttvJquery("#chat_lines")[0].scrollHeight); }, 1000);
			}

			var time = new Date().getTime() / 1000;
				CurrentChat.lastActivity = time;

			if(info.nickname == "nightbot" && info.message == "> Running a commercial in 15 seconds." && PP['login'] == PP['channel']) {
				bttvJquery.gritter.add({
			        title: 'Commercial Warning',
			        class_name: 'gritter-light',
			        time: 10000,
			        image: 'http://cdn.nightdev.com/img/nightboticon.png',
			        text: 'Nightbot will be running a commercial in 15 seconds.',
			    });
			}

			if(info.tagtype == "broadcaster") { info.tagname = "Host"; }

			var x=0;
			if(info.tagtype == "mod" || info.tagtype == "broadcaster" || info.tagtype == "admin") x=1;

			if(localStorage.getItem("showDefaultTags") == "true") {
				if(info.tagtype == "mod" || info.tagtype == "broadcaster" || info.tagtype == "admin" || info.tagtype == "staff") info.tagtype = "old"+info.tagtype;
			}

			var messageHighlighted = false;
			var highlightKeywords = [];

			if(localStorage.getItem("highlightKeywords")) {
				var extraKeywords = localStorage.getItem("highlightKeywords");
				extraKeywords = extraKeywords.split(" ");
				extraKeywords.forEach(function(keyword){
					highlightKeywords.push(keyword);
				});
			}
			if(localStorage.getItem("selfHighlights") !== "false") {
				highlightKeywords.push(PP['login']);
			}
			highlightKeywords.forEach(function(keyword){
				keyword = escapeRegExp(keyword);
				var wordRegex = new RegExp('\\b'+keyword+'\\b', 'i');
				var symbolRegex = new RegExp('\\B'+keyword+'\\B', 'i');
				var nickRegex = new RegExp('^'+keyword+'$', 'i');
				if(PP['login'] !== "" && (wordRegex.test(info.message) || symbolRegex.test(info.message) || nickRegex.test(info.nickname)) && PP['login'] !== info.nickname) {
					messageHighlighted = true;
				}
			});
			
			colorBackground = calculateColorBackground(info.color);
			if(((colorBackground === "light" && localStorage.getItem("darkenedMode") === "true") || (colorBackground === "dark" && localStorage.getItem("darkenedMode") !== "true")) && info.nickname !== PP['login']) {
				info.color = calculateColorReplacement(info.color, colorBackground);
			}

			if(blackChat === true && info.color === "#000000") {
				info.color = "#ffffff";
			}

			if(messageHighlighted === true && localStorage.getItem("darkenedMode") === "true") {
				info.color = "#ffffff";
				ich.templates["chat-line"] = ich.templates["chat-line-highlight"];
				ich.templates["chat-line-action"] = ich.templates["chat-line-action-highlight"];
			} else if(messageHighlighted === true && PP['login'] !== "") {
				info.color = "#000000";
				ich.templates["chat-line"] = ich.templates["chat-line-highlight"];
				ich.templates["chat-line-action"] = ich.templates["chat-line-action-highlight"];
			} else {
				ich.templates["chat-line"] = ich.templates["chat-line-old"];
				ich.templates["chat-line-action"] = ich.templates["chat-line-action-old"];
			}

			if((info.color == "#0000ff" || info.color == "#191971" || info.color == "#2626aa") && localStorage.getItem("darkenedMode") === "true" && info.nickname !== PP['login']) { info.color = "#3753ff"; }
			if((info.color == "black" || info.color == "#000000") && localStorage.getItem("darkenedMode") === "true" && info.nickname !== PP['login']) { info.color = "#D3D3D3" }

			if(info.nickname == "night" && x==1) { info.tagtype="orange"; info.tagname = "Creator"; }
			//Bots
			if(info.nickname == "moobot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "nightbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "nokzbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "sourbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "probot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "saucebot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "bullystopper" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "baconrobot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "mtgbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
			if(info.nickname == "tardisbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }

			//Donations
			if(info.nickname == "the_abysss") { info.tagtype="orange"; info.tagname = "god"; }
			if(info.nickname == "gspwar") { info.tagtype="admin"; info.tagname = "EH?"; }
			if(info.nickname == "xnightmare__") { info.tagtype="broadcaster"; info.tagname = "FaZe"; info.nickname="Nightmare"; }
			if(info.nickname == "striker035" && x==1) { info.tagtype="admin"; info.tagname = "MotherLover"; }
			if(info.nickname == "upd0g") { info.tagtype="orange"; info.tagname = "Smelly"; info.nickname="dog"; }
			if(info.nickname == "shadogazer" && x==1) { info.tagtype="purple"; info.tagname = "Daemon"; }
			if(info.nickname == "top_sgt" && x==1) { info.tagtype="mod"; info.tagname = "Soldier"; }
			if(info.nickname == "jruxdev" && x==1) { info.tagtype="bot"; info.tagname = "MuttonChops"; }
			if(info.nickname == "standofft_money" && x==1) { info.tagtype="broadcaster"; info.tagname = "iBad"; }
			if(info.nickname == "infemeth" && x==1) { info.tagtype="purple"; info.tagname = "Designer"; }
			if(info.nickname == "totally_cereal" && x==1) { info.tagtype="staff"; info.tagname = "Fruity"; }
			if(info.nickname == "tomyfreidz" && x==1) { info.tagtype="broadcaster"; info.tagname = "<span style='color:#00F2FF;'>Designer</span>"; }
			if(info.nickname == "virtz" && x==1) { info.tagtype="staff"; info.tagname = "Perv"; }
			if(info.nickname == "unleashedbeast" && x==1) { info.tagtype="admin"; info.tagname = "<span style='color:black;'>Surface</span>"; }
			if(info.nickname == "kona" && x==1) { info.tagtype="broadcaster"; info.tagname = "KK"; }
			if(info.nickname == "norfolk_en_clue" && x==1) { info.tagtype="broadcaster"; info.tagname = "Creamy"; }
			if(info.nickname == "onyxblade" && x==1) { info.tagtype="bot"; info.tagname = "Onyx"; }
			if(info.nickname == "aromaticyeti" && x==1) { info.tagtype="bot"; info.tagname = "Onyx"; }
			if(info.nickname == "leftyben" && x==1) { info.tagtype="lefty"; info.tagname = "&nbsp;"; }
			if(info.nickname == "maximusloopus" && x==1) { info.tagtype="admin"; info.tagname = "<span style='color:black;'>Hero</span>"; }
			if(info.nickname == "nokz" && x==1) { info.tagtype="staff"; info.tagname = "N47"; }
			if(info.nickname == "blindfolded" && x==1) { info.tagtype="broadcaster"; info.tagname = "iLag"; }
			if(info.nickname == "jjag72" && x==1) { info.tagtype="admin"; info.tagname = "Jag"; }
			if(info.nickname == "snorlaxitive" && x==1) { info.tagtype="purple"; info.tagname = "King"; }
			if(info.nickname == "excalibr" && x==1) { info.tagtype="staff"; info.tagname = "Boss"; }
			if(info.nickname == "chez_plastic" && x==1) { info.tagtype="staff"; info.tagname = "Frenchy"; }
			if(info.nickname == "frontiersman72" && x==1) { info.tagtype="admin"; info.tagname = "TMC"; }
			if(info.nickname == "dckay14" && x==1) { info.tagtype="admin"; info.tagname = "Ginger"; }
			if(info.nickname == "boogie_yellow" && x==1) { info.tagtype="orange"; info.tagname = "Yellow"; }
			if(info.nickname == "harksa" && x==1) { info.tagtype="orange"; info.tagname = "Feet"; }
			if(info.nickname == "lltherocksaysll" && x==1) { info.tagtype="broadcaster"; info.tagname = "BossKey"; }
			if(info.nickname == "melissa_loves_everyone" && x==1) { info.tagtype="purple"; info.tagname = "Chubby"; info.nickname="Bunny"; }
			if(info.nickname == "redvaloroso" && x==1) { info.tagtype="broadcaster"; info.tagname = "Dio"; }
			if(info.nickname == "slapage" && x==1) { info.tagtype="bot"; info.tagname = "I aM"; }
			if(info.nickname == "aclaz_92" && x==1) { info.tagtype="bot"; info.tagname = "412"; }
			if(info.nickname == "deano2518" && x==1) { info.tagtype="orange"; info.tagname = "<span style='color:black;'>WWFC</span>"; }
			if(info.nickname == "eternal_nightmare" && x==1) { info.tagtype="broadcaster"; info.tagname = "Spencer"; info.nickname = "Nickiforek"; }
			if(info.nickname == "iivii_beauty" && x==1) { info.tagtype="purple"; info.tagname = "Crave"; }
			if(info.nickname == "theefrenzy" && x==1) { info.tagtype="staff"; info.tagname = "Handsome"; }
			if(info.nickname == "ashardis" && x==1) { info.tagtype="staff"; info.tagname = "Dat Ash"; }
			if(info.nickname == "gennousuke69" && x==1) { info.tagtype="admin"; info.tagname = "Evil"; }
			if(info.nickname == "yorkyyork") { info.tagtype="broadcaster"; info.tagname = "<span style='color:red;'>FeaR</span>"; }
			if(info.nickname == "zebbazombies" && x==1) { info.tagtype="mod"; info.tagname = "Hugs"; }
			if(info.nickname == "uleet" && x==1) { info.nickname = "Taco"; }
			if(info.nickname == "nobama12345" && x==1) { info.tagtype="broadcaster"; info.tagname = "Señor"; }
			if(info.nickname == "mrimjustaminorthreat" && x==1) { info.tagtype="staff"; info.tagname = "<span style='color:pink;'>Major</span>"; info.nickname = "mrimjustamajorthreat" }
			if(info.nickname == "sournothardcore" && x==1) { info.tagname = info.tagname+"</span><span class='tag brown' style='margin-left:4px;color:#FFE600 !important;' original-title='Saucy'>Saucy</span><span>"; }
			//People
			if(info.nickname == "mac027" && x==1) { info.tagtype="admin"; info.tagname = "Hacks"; }
			if(info.nickname == "vaughnwhiskey" && x==1) { info.tagtype="admin"; info.tagname = "Bacon"; }
			if(info.nickname == "socaldesigner" && x==1) { info.tagtype="broadcaster"; info.tagname = "Legend"; }
			if(info.nickname == "perfectorzy" && x==1) { info.tagtype="mod"; info.tagname = "Jabroni Ave"; }
			if(info.nickname == "pantallideth1" && x==1) { info.tagtype="staff"; info.tagname = "Windmill"; }
			if(info.nickname == "mmmjc" && x==1) { info.tagtype="admin"; info.tagname = "m&m"; }
			if(info.nickname == "hawkeyye" && x==1) { info.tagtype="broadcaster"; info.tagname = "EnVy"; info.nickname="Hawkeye"; }
			if(info.nickname == "paterandreas" && x==1) { info.tagtype="admin"; info.tagname = "Uni-BB"; }
			if(info.nickname == "the_chopsticks" && x==1) { info.tagtype="admin"; info.tagname = "oZn"; }
			if(info.nickname == "whitesammy") { info.color = "white;text-shadow: 0 0 2px #000"; }
			if(info.nickname == "bacon_donut") { info.tagtype="bacon"; info.tagname = "&nbsp;"; info.nickname = "Donut" }
			//Xmas
			if(info.nickname == "r3lapse" && x==1) { info.tagtype="staff"; info.tagname = "Kershaw"; }
			if(info.nickname == "im_tony_" && x==1) { info.tagtype="admin"; info.tagname = "oZn"; }
			if(info.nickname == "tips_" && x==1) { info.tagtype="staff"; info.tagname = "241"; }
			if(info.nickname == "papa_dot" && x==1) { info.tagtype="mod"; info.tagname = "v8"; }
			if(info.nickname == "beccamay" && x==1) { info.tagtype="orange"; info.tagname = "British"; }
			if(info.nickname == "1danny1032" && x==1) { info.tagtype="admin"; info.tagname = "1Bar"; }
			if(info.nickname == "cvagts" && x==1) { info.tagtype="staff"; info.tagname = "SRL"; }
			if(info.nickname == "thesabe" && x==1) { info.tagtype="orange"; info.tagname = "<span style='color:blue;'>Sabey</span>"; }
			if(info.nickname == "kerviel_" && x==1) { info.tagtype="staff"; info.tagname = "Almighty"; }
			if(info.nickname == "ackleyman" && x==1) { info.tagtype="orange"; info.tagname = "Ack"; }

			//this.insert_chat_lineOld(info);
			if(info.message.substr(0,3).trim() === "/me") {
				info.message = info.message.substr(4);
			}

			function kappaBoom(info) {
				if(info.nickname === "night" || info.nickname === "sour") {
					return '<img src="http://cdn.betterttv.net/emotes/kappaboom.gif" style="vertical-align:baseline;" />';
				} else {
					return 'Nucleappa';
				}
			}

			if (!(CurrentChat.restarting && !CurrentChat.history_ended || CurrentChat.ignored[info.sender])) if ("jtv" === info.sender) CurrentChat.last_sender = info.sender, CurrentChat.admin_message(CurrentChat.format_message(info));
	        else if (!info.is_action && !messageHighlighted && CurrentChat.last_sender && CurrentChat.last_sender === info.sender && "jtv" !== CurrentChat.last_sender) CurrentChat.insert_with_lock("#chat_line_list li:last", '<p class="chat_line" style="display:block;">&raquo; ' + CurrentChat.format_message(info) + "</p>");
	        else {
	            CurrentChat.last_sender = info.sender;
	            var d = !! (PP.login === PP.channel || "true" === PP.is_admin || "true" === PP.is_subadmin || CurrentChat.staff[PP.login] || CurrentChat.admins[PP.login] || CurrentChat.moderators[PP.login]),
	                c = info.is_action ? "chat-line-action" : "chat-line",
	                b = !1,
	                f = unescape(info.nickname);
	            0 === f.indexOf("ign-") && (b = !0, f = f.substr(4));
	            if(CurrentChat.moderators[info.sender]) {
	            	if(PP.channel === PP.login) {
	            		var showThem = true;
	            	} else {
	            		var showThem = false;
	            	}
	            } else {
	            	var showThem = true
	            }
	            var h = "chat-line-" + Math.round(1E9 * Math.random()),
	                f = {
	                    id: h,
	                    showModButtons: d && "jtv" !== info.sender && info.sender !== PP.login && showThem,
	                    timestamp: CurrentChat.show_timestamps || !CurrentChat.history_ended ? info.timestamp : "",
	                    sender: info.sender,
	                    displayname: f,
	                    color: info.color
	                }, g = d = "";
	            info.tagtype && (d = '<span class="tag %tagtype" title="%tagname">%tagname</span>&nbsp;'.replace(/\%tagtype/g,
	                info.tagtype).replace(/\%tagname/g, info.tagname));
	            info.turbo && (d += '<span class="tag %tagtype" title="%tagname"><a href="/products/turbo?ref=chat_badge" target="_blank">%tagname</a></span> '.replace(/\%tagtype/g, "turbo").replace(/\%tagname/g, "Turbo"));
	            info.subscriber && (g = '<span class="tag %tagtype c%tagchannel" title="%tagname">' + ('<a href="/' + CurrentChat.channel + '/subscribe" target="_blank">%tagname</a>'), d += (g + "</span> ").replace(/\%tagtype/g, "subscriber").replace(/\%tagname/g, "Subscriber").replace(/\%tagchannel/g,CurrentChat.channel));
	            b && (d += '<span class="tag %tagtype" title="%tagname">%tagname</span>&nbsp;'.replace(/\%tagtype/g, "ign").replace(/\%tagname/g, "My IGN"));
	            c = ich[c](f)[0].outerHTML;
	            c = c.replace(/\@tag/g, d);
	            c = c.replace(/\@message/g, CurrentChat.format_message(info).replace("Nucleappa",kappaBoom(info)));
	            "jtv" !== info.sender ? CurrentChat.insert_with_lock("#chat_line_list", c, info, h) : CurrentChat.insert_with_lock("#chat_line_list", c)
	        }
		}

		ich.templates["chat-line-action"] = "<li class='chat_from_{{sender}} line' data-sender='{{sender}}'><p><span class='small'>{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class='nick' href='/{{sender}}' id='{{id}}' style='color:{{color}};'>{{displayname}}</a><span class='chat_line' style='color:{{color}};'> @message</span></p></li>";
		ich.templates["chat-line-action-highlight"] = "<li class='chat_from_{{sender}} line highlight' data-sender='{{sender}}'><p><span class='small'>{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class='nick' href='/{{sender}}' id='{{id}}' style='color:{{color}};'>{{displayname}}</a><span class='chat_line' style='color:{{color}};'> @message</span></p></li>";
		ich.templates["chat-line"] = "<li class='chat_from_{{sender}} line' data-sender='{{sender}}'><p><span class='small'>{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class='nick' href='/{{sender}}' id='{{id}}' style='color:{{color}};'>{{displayname}}</a>:&nbsp;<span class='chat_line'>@message</span></p></li>";
		ich.templates["chat-line-highlight"] = "<li class='chat_from_{{sender}} line highlight' data-sender='{{sender}}'><p><span class='small'>{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class='nick' href='/{{sender}}' id='{{id}}' style='color:{{color}};'>{{displayname}}</a>:&nbsp;<span class='chat_line'>@message</span></p></li>";
		ich.templates["chat-line-old"] = ich.templates["chat-line"];
		ich.templates["chat-line-action-old"] = ich.templates["chat-line-action"];

		var purge = '<span><a href="#" class="normal_button tooltip chat_menu_btn" onclick="javascript:CurrentChat.ghettoTimeout(1);" title="Purges Users Chat - 1 Second Timeout"><span class="glyph_only"><img src="http://cdn.betterttv.net/purge.png" /></span></a>&nbsp;</span>';
		bttvJquery(purge).insertBefore("#chat_menu_timeout");
		var tempBan = '<span>&nbsp;<a href="#" class="normal_button tooltip chat_menu_btn" onclick="javascript:CurrentChat.ghettoTimeout(28800);" title="Temporary 8 hour ban"><span class="glyph_only"><img src="http://cdn.betterttv.net/8hr.png" /></span></a></span><span>&nbsp;<a href="#" class="normal_button tooltip chat_menu_btn" onclick="javascript:CurrentChat.ghettoTimeout(86400);" title="Temporary 24 hour ban"><span class="glyph_only"><img src="http://cdn.betterttv.net/24hr.png" /></span></a></span>';
		bttvJquery(tempBan).insertAfter("#chat_menu_timeout");
		bttvJquery("#chat_menu_tools").insertAfter("#chat_menu_op_tools");

		CurrentChat.TMIFailedToJoin = true;
		CurrentChat.TMIFailedToJoinTries = 1;

		var checkJoinFail = {};

		CurrentChat.ghettoTimeout = function(time) {
			CurrentChat.say("/timeout "+bttvJquery("#user_info .nick").html()+" "+time);
		}

		CurrentChat.handlers.user_names_end = function() {
			clearTimeout(checkJoinFail);
			CurrentChat.TMIFailedToJoin = false;
			CurrentChat.retries = 10;
			CurrentChat.admin_message(i18n("Welcome to the "+PP['channel'].capitalize()+"'s chat room!"));
			$("chat_text_input").disabled = !1;
			CurrentChat.currently_scrolling = !0;
			CurrentChat.scroll_chat();
			CurrentChat.rooms();
		}

		CurrentChat.handlers.error = function() {
			CurrentChat.admin_message(i18n("BetterTTV: Chat encountered an error.."));
			CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
			CurrentChat.reconnect();
		}

		CurrentChat.handlers.debug = function(a) {
			CurrentChat.debug && CurrentChat.admin_message("DEBUG: " + a.message);
			if(a.message.match(/^Connecting to (.*):(80|443)$/)) {
				CurrentChat.currentServer = /^Connecting to (.*):(80|443)$/.exec(a.message)[1];
			}
			if(a.message.match(/^connected$/)) {
				CurrentChat.admin_message(i18n("Connected to the chat server."));
			}
			if(a.message === "Received irc message IRCMessage from 'null' to 'null', with command 'PING' and message 'null'") {
				var time = new Date().getTime() / 1000;
				CurrentChat.lastActivity = time;
				CurrentChat.monitorActivity = true;
				CurrentChat.globalBanAttempt = false;
			}
			if(a.message.match(/^Connection lost/)) {
				if(CurrentChat.silence && CurrentChat.silence === true) {
					CurrentChat.silence = false;
					return;
				}
				if(CurrentChat.last_sender === PP['login']) {
					if(CurrentChat.globalBanAttempt) {
						CurrentChat.admin_message(i18n("BetterTTV: You were disconnected from chat."));
						CurrentChat.admin_message(i18n("BetterTTV: It is very likely you are globally banned from chat for 8 hours."));
						CurrentChat.admin_message(i18n("BetterTTV: Reconnecting anyways.."));
					} else {
						CurrentChat.globalBanAttempt = true;
					}
				} else {
					CurrentChat.admin_message(i18n("BetterTTV: You were disconnected from chat."));
					CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
					bttvJquery.getJSON("http://23.29.121.109/api/report?type=chat&test1=true&server="+/^Connection lost to \((.*):(80|443)\)/.exec(a.message)[1]);
				}
			}
		}

		setInterval(function(){
			if(CurrentChat.monitorActivity) {
				var time = new Date().getTime() / 1000,
					timeDifference = time-CurrentChat.lastActivity;
				if(timeDifference >= 360) {
					CurrentChat.monitorActivity = false;
					CurrentChat.admin_message(i18n("BetterTTV: I suspect your chat froze.."));
					CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
					CurrentChat.reconnect();
				}
			}
		}, 5000)

		CurrentChat.rejoinChat = function() {

			if(!CurrentChat.currentServer) {
				var a = CurrentChat.ircSystem.cloneNode(!0);
				CurrentChat.ircSystem.parentNode.replaceChild(a, this.ircSystem);
				CurrentChat.ircSystem = a;
				CurrentChat.me.is_loaded = !1;
				CurrentChat.connect(CurrentChat.room)
				CurrentChat.silence = true;
				CurrentChat.admin_message(i18n("BetterTTV: Trying a different server"));
			}
			if(CurrentChat.TMIFailedToJoinTries <= 10) {
				CurrentChat.admin_message(i18n("BetterTTV: Attempting to join again.. ["+CurrentChat.TMIFailedToJoinTries+"/10]"));
				CurrentChat.ircSystem.join("#"+PP["channel"]);
				checkJoinFail = setTimeout(function(){
					if(CurrentChat.TMIFailedToJoin === true) {
						CurrentChat.admin_message(i18n("BetterTTV: Unable to join the chat room.."));
						CurrentChat.rejoinChat();
					}
				},10000);
				CurrentChat.TMIFailedToJoinTries++;
				bttvJquery.getJSON("http://23.29.121.109/api/report?type=chat&test2=true&server="+CurrentChat.currentServer);
			} else {
				CurrentChat.admin_message(i18n("BetterTTV: Looks like chat is broken.. I give up. :("));
			}

		}

		CurrentChat.handlers.connected = function() {
			checkJoinFail = setTimeout(function(){
				if(CurrentChat.TMIFailedToJoin === true) {
					CurrentChat.admin_message(i18n("BetterTTV: Unable to join the chat room.."));
					CurrentChat.rejoinChat();
				}
			},10000);
			CurrentChat.admin_message(i18n("Joining the chat room.."));
			CurrentChat.join_on_connect && CurrentChat.join(CurrentChat.join_on_connect);
	        CurrentChat.join_on_connect = null;
	        $("chat_line_list").innerHTML = "";
	        CurrentChat.line_count = 0;
	        $("chat_text_input").disabled = !1;
	        CurrentChat.debug && CurrentChat.ircSystem.debugOn();
		}

		CurrentChat.handlers.clear_chat = function(info) {
			var nickname = CurrentChat.real_username(info.user);
			if (info.target === "all") {
				CurrentChat.last_sender = "jtv";
				CurrentChat.insert_with_lock("#chat_line_list",'<li class="line fromjtv"><p class="content">Chat was cleared by a moderator (Prevented by BetterTTV)</p></li>');
			} else if (info.target === "user") {
				var nickname = CurrentChat.real_username(info.user);
				if(localStorage.getItem("showDeletedMessages") !== "true") {
					bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + ' .chat_line').each(function () {
						bttvJquery(this).html("<span style=\"color: #999\">&lt;message deleted&gt;</span>");
					});
				} else {
					bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + ' .chat_line').each(function () {
						bttvJquery("a", this).each(function () {
							var rawLink = "<span style=\"text-decoration: line-through;\">"+bttvJquery(this).attr("href")+"</span>";
							bttvJquery(this).replaceWith(rawLink);
						});
						bttvJquery(this).html("<span style=\"color: #999\">" + bttvJquery(this).html() + "</span>");
					});
				}
				CurrentChat.last_sender = "jtv";
				CurrentChat.insert_with_lock("#chat_line_list",'<li class="line fromjtv"><p class="content"><span style="text-transform:capitalize;">'+nickname+"</span> has been timed out."+"</p></li>");
			}
		}

		bttvJquery('#chat_text_input').live('keydown', function(e) {
		  var keyCode = e.keyCode || e.which;
		  if (keyCode === 9) {
		    e.preventDefault();
		    var sentence = bttvJquery('#chat_text_input').val().split(' ');
		    var partialMatch = sentence.pop().toLowerCase();
		    var users = currentViewers;
			var userIndex = 0;
			if(window.partialMatch === undefined) {
			  window.partialMatch = partialMatch;
			} else if(partialMatch.search(window.partialMatch) !== 0){
			  window.partialMatch = partialMatch;
			} else if(window.lastMatch !== bttvJquery('#chat_text_input').val()) {
			  window.partialMatch = partialMatch;
			} else {
			  if (sentence.length === 0) {
			    userIndex = users.indexOf(partialMatch.substr(0, partialMatch.length-1));
			  } else {
			    userIndex = users.indexOf(partialMatch);
			  }
			  if (e.shiftKey) {
			  	userIndex = userIndex-1;
			  }
			}
			for (var i=userIndex; i<users.length; i++) {
			  var user = users[i] || '';
			  if (window.partialMatch.length > 0 && user.search(window.partialMatch, "i") === 0) {
			    if(user === partialMatch || user === partialMatch.substr(0, partialMatch.length-1)){
			      continue;
			    }
			    sentence.push(user.capitalize());
			    if (sentence.length === 1) {
			      bttvJquery('#chat_text_input').val(sentence.join(' ')+":");
			      window.lastMatch = sentence.join(' ')+":";
			    } else {
			      bttvJquery('#chat_text_input').val(sentence.join(' '));
			      window.lastMatch = sentence.join(' ');
			    }
			    break;
			  }
			}
		  }
		});
		
		bttvJquery("#chat_lines").scroll(function(){
			var scrollHeight = bttvJquery("#chat_lines")[0].scrollHeight-bttvJquery("#chat_lines").height(),
				scrollTop = bttvJquery("#chat_lines").scrollTop(),
				distanceFromBottom = scrollHeight-scrollTop;

			if(distanceFromBottom >= 20) {
				CurrentChat.currently_scrolling = 0;
				CurrentChat.line_buffer = 9001;
			} else if(CurrentChat.currently_scrolling !== 1) {
				CurrentChat.currently_scrolling = 1;
				CurrentChat.line_buffer = 150;
			}
		});
		
		setTimeout(function(){updateViewerList()},5000);
		setInterval(function(){updateViewerList()},300000);
	}

	checkFollowing = function() {

		betterttvDebug.log("Check Following List");

		//Beta Channel Tracking
		bttvJquery(window).on("firebase:follow_online", function (b, f) {
			if(f.online === true) {
				Twitch.api.get("channels/"+f.name.toLowerCase()).done(function (d) {
					if(d.name) {
						bttvJquery.gritter.add({
					        title: d.display_name+' is Now Streaming',
					        image: d.logo,
					        text: d.display_name+' just started streaming '+d.game+'.<br /><br /><a style="color:white" href="http://www.twitch.tv/'+d.name+'">Click here to head to '+d.display_name+'\'s channel</a>.',
					    });
					}
				});
			}
		});

	}

	overrideEmotes = function() {

		if(!document.getElementById("chat_lines")) return;

		betterttvDebug.log("Overriding Twitch Emoticons");

		var betterttvEmotes = [
								{ url: "http://cdn.betterttv.net/emotes/trollface.png", width: 23, height: 19, regex: "(\\:trollface\\:|\\:tf\\:)" },
								{ url: "http://cdn.betterttv.net/emotes/mw.png", width: 20, height: 20, regex: "(\\:D|\\:d)" },
								{ url: "http://cdn.betterttv.net/emotes/cry.png", width: 19, height: 19, regex: "\\:'\\(" },
								{ url: "http://cdn.betterttv.net/emotes/puke.png", width: 19, height: 19, regex: "\\(puke\\)" },
								{ url: "http://cdn.betterttv.net/emotes/mooning.png", width: 19, height: 19, regex: "\\(mooning\\)" },
								{ url: "http://cdn.betterttv.net/emotes/poolparty.png", width: 19, height: 19, regex: "\\(poolparty\\)" },
								{ url: "http://cdn.betterttv.net/emotes/kona.png", width: 25, height: 34, regex: "KKona" },
								{ url: "http://cdn.betterttv.net/emotes/foreveralone.png", width: 29, height: 30, regex: "ForeverAlone" },
								{ url: "http://cdn.betterttv.net/emotes/chez.png", width: 32, height: 35, regex: "TwaT" },
								{ url: "http://cdn.betterttv.net/emotes/black.png", width: 26, height: 30, regex: "RebeccaBlack" },
								{ url: "http://cdn.betterttv.net/emotes/rage.png", width: 33, height: 30, regex: "RageFace" },
								{ url: "http://cdn.betterttv.net/emotes/striker.png", width: 44, height: 35, regex: "rStrike" },
								{ url: "http://cdn.betterttv.net/emotes/chaccept.png", width: 23, height: 34, regex: "CHAccepted" },
								{ url: "http://cdn.betterttv.net/emotes/fuckyea.png", width: 45, height: 34, regex: "FuckYea" },
								{ url: "http://cdn.betterttv.net/emotes/namja.png", width: 37, height: 40, regex: "ManlyScreams" },
								{ url: "http://cdn.betterttv.net/emotes/pancakemix.png", width: 22, height: 30, regex: "PancakeMix" },
								{ url: "http://cdn.betterttv.net/emotes/pedobear.png", width: 32, height: 30, regex: "PedoBear" },
								{ url: "http://cdn.betterttv.net/emotes/genie.png", width: 25, height: 35, regex: "WatChuSay" },
								{ url: "http://cdn.betterttv.net/emotes/pedonam.png", width: 37, height: 40, regex: "PedoNam" },
								{ url: "http://cdn.betterttv.net/emotes/nam.png", width: 38, height: 40, regex: "NaM" },
								{ url: "http://cdn.betterttv.net/emotes/luda.png", width: 36, height: 34, regex: "LLuda" },
								{ url: "http://cdn.betterttv.net/emotes/updog.png", width: 32, height: 32, regex: "iDog" },
								{ url: "http://cdn.betterttv.net/emotes/blackhawk.png", width: 33, height: 34, regex: "iAMbh" },
								{ url: "http://cdn.betterttv.net/emotes/sdaw.png", width: 24, height: 34, regex: "ShoopDaWhoop" },
								{ url: "http://cdn.betterttv.net/emotes/hydro.png", width: 22, height: 34, regex: "HHydro" },
								{ url: "http://cdn.betterttv.net/emotes/chanz.png", width: 37, height: 40, regex: "OhGodchanZ" },
								{ url: "http://cdn.betterttv.net/emotes/ohgod.png", width: 31, height: 34, regex: "OhGod" },
								{ url: "http://cdn.betterttv.net/emotes/fapmeme.png", width: 35, height: 35, regex: "FapFapFap" },
								{ url: "http://cdn.betterttv.net/emotes/socal.png", width: 100, height: 40, regex: "iamsocal" },
								{ url: "http://cdn.betterttv.net/emotes/herbert.png", width: 29, height: 34, regex: "HerbPerve" },
								{ url: "http://cdn.betterttv.net/emotes/panda.png", width: 36, height: 40, regex: "SexPanda" },
								{ url: "http://cdn.betterttv.net/emotes/mandm.png", width: 54, height: 45, regex: "M&Mjc" },
								{ url: "http://cdn.betterttv.net/emotes/jokko.png", width: 23, height: 35, regex: "SwedSwag" },
								{ url: "http://cdn.betterttv.net/emotes/adz.png", width: 21, height: 34, regex: "adZ" },
								{ url: "http://cdn.betterttv.net/emotes/pokerface.png", width: 23, height: 35, regex: "PokerFace" },
								{ url: "http://cdn.betterttv.net/emotes/jamontoast.png", width: 33, height: 30, regex: "ToasTy" },
								{ url: "http://cdn.betterttv.net/emotes/basedgod.png", width: 33, height: 34, regex: "BasedGod" },
								{ url: "http://cdn.betterttv.net/emotes/fishmoley.png", width: 56, height: 34, regex: "FishMoley" },
								{ url: "http://cdn.betterttv.net/emotes/angry.png", width: 27, height: 35, regex: "cabbag3" },
								{ url: "http://cdn.betterttv.net/emotes/bacon.gif", width: 33, height: 35, regex: "BaconTime" },
								{ url: "http://cdn.betterttv.net/emotes/snatchy.png", width: 21, height: 35, regex: "OhhhKee" },
								{ url: "http://cdn.betterttv.net/emotes/sourpls.gif", width: 40, height: 40, regex: "SourPls" },
								{ url: "http://cdn.betterttv.net/emotes/stray.png", width: 45, height: 35, regex: "She\'llBeRight" },
								{ url: "http://cdn.betterttv.net/emotes/bacondance.gif", width: 72, height: 35, regex: "AwwwYeah" },
								{ url: "http://cdn.betterttv.net/emotes/taxi.png", width: 87, height: 30, regex: "TaxiBro" }
							  ];

		if(localStorage.getItem("showDefaultEmotes") !== "true") {
			betterttvEmotes.push({ url: "http://cdn.betterttv.net/emotes/aww.png", width: 19, height: 19, regex: "D\\:" });
		}

		var oldEmotes = [
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ebf60cd72f7aa600-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-d570c4b3b8d8fc4d-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ae4e17f5b9624e2f-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-b9cbb6884788aa62-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-2cde79cfe74c6169-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-577ade91d46d7edc-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-374120835234cb29-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-cfaf6eac72fe4de6-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-e838e5e34d9f240c-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-3407bf911ad2fd4a-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-0536d670860bf733-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-8e128fa8dc1de29c-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-d31223e81104544a-24x18.png",
							"http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-9f2ac5d4b53913d7-24x18.png"
						];
		var newEmotes = [
							"http://www-cdn.jtvnw.net/images/emoticons/happy.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/sad.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/surprised.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/bored.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/cool.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/horny.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/skeptical.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/wink.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/raspberry.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/winkberry.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/pirate.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/drunk.gif",
							"http://www-cdn.jtvnw.net/images/emoticons/angry.gif",
							"http://cdn.betterttv.net/emotes/mw.png"
						];

		CurrentChat.emoticons = [];

		Twitch.api.get("chat/emoticons").done(function (a) {
			var d = 0;
            cssString = "";
            a.emoticons.forEach(function (a) {
                a.regex = RegExp(a.regex, "g");
                a.images.forEach(function (a) {
                    d += 1;
                    if(oldEmotes.indexOf(a.url) !== -1 && localStorage.getItem("showDefaultEmotes") !== "true") {
                    	a.url = newEmotes[oldEmotes.indexOf(a.url)];
                    	a.height = 22;
                    	a.width = 22;
                    }
                    a.html = ich["chat-emoticon"]({
                        id: d
                    }).prop("outerHTML");
                    cssString += CurrentChat.generate_emoticon_css(a, d);
                });
                CurrentChat.emoticons.push(a);
            });
            betterttvEmotes.forEach(function (b) {
            	var a = {};
            	a.regex = RegExp(b.regex, "g");
            	a.images = [];
            	a.images.push({emoticon_set:null,width:b.width,height:b.height,url:b.url});
            	a.images.forEach(function (a) {
                    d += 1;
                    a.html = ich["chat-emoticon"]({
                        id: d
                    }).prop("outerHTML");
                    cssString += CurrentChat.generate_emoticon_css(a, d);
                });
            	CurrentChat.emoticons.push(a);
            });
            cssString += ".emoticon { display: inline-block; }";
            var emoteCSS = document.createElement("style");
			emoteCSS.setAttribute("type","text/css");
			emoteCSS.innerHTML = cssString;
			bttvJquery('body').append(emoteCSS);
		});

	}

	updateViewerList = function() {

		betterttvDebug.log("Updating Viewer List");

        bttvJquery.ajax({
            url: "https://tmi.twitch.tv/group/user/" + PP['channel']+ "/chatters?update_num=" + Math.random() + "&callback=?",
            cache: !1,
            dataType: "jsonp",
            timeoutLength: 6E3
        }).done(function (d) {
        	if(d.data.chatters) {
            	currentViewers = [];
				["staff", "admins", "moderators", "viewers"].forEach(function (a) {
	                d.data.chatters[a].forEach(function (a) {
	                    currentViewers.push(a);
	                });
	            });
        	}
        });

	}

	handleBackground = function() {
		var g = bttvJquery("#custom_bg"),
		d = g[0];
		if(d && d.getContext) {
			var c = d.getContext("2d"),
			h = bttvJquery("#custom_bg").attr("image");
			if (!h) {
				bttvJquery(d).css("background-image", "");
				c.clearRect(0, 0, d.width, d.height);
			} else if(g.css({ width: "100%", "background-position": "center top" }), g.hasClass("tiled")) {
				g.css({ "background-image": 'url("' + h + '")' }).attr("width", 200).attr("height", 200);
				d = c.createLinearGradient(0, 0, 0, 200);
				if(localStorage.getItem("darkenedMode") === "true") {
					d.addColorStop(0, "rgba(20,20,20,0.4)");
					d.addColorStop(1, "rgba(20,20,20,1)");
				} else {
					d.addColorStop(0, "rgba(245,245,245,0.65)");
					d.addColorStop(1, "rgba(245,245,245,1)");
				}
				c.fillStyle = d;
				c.fillRect(0, 0, 200, 200);
			} else {
				var i = document.createElement("IMG");
				i.onload = function() {
					var a = this.width,
					d = this.height,
					h;
					g.attr("width", a).attr("height", d);
					c.drawImage(i, 0, 0);
					if(localStorage.getItem("darkenedMode") === "true") {
						d > a ? (h = c.createLinearGradient(0, 0, 0, a), h.addColorStop(0, "rgba(20,20,20,0.4)"), h.addColorStop(1, "rgba(20,20,20,1)"), c.fillStyle = h, c.fillRect(0, 0, a, a), c.fillStyle = "rgb(20,20,20)", c.fillRect(0, a, a, d - a)) : (h = c.createLinearGradient(0, 0, 0, d), h.addColorStop(0, "rgba(20,20,20,0.4)"), h.addColorStop(1, "rgba(20,20,20,1)"), c.fillStyle = h, c.fillRect(0, 0, a, d))
					} else {
						d > a ? (h = c.createLinearGradient(0, 0, 0, a), h.addColorStop(0, "rgba(245,245,245,0.65)"), h.addColorStop(1, "rgba(245,245,245,1)"), c.fillStyle = h, c.fillRect(0, 0, a, a), c.fillStyle = "rgb(245,245,245)", c.fillRect(0, a, a, d - a)) : (h = c.createLinearGradient(0, 0, 0, d), h.addColorStop(0, "rgba(245,245,245,0.65)"), h.addColorStop(1, "rgba(245,245,245,1)"), c.fillStyle = h, c.fillRect(0, 0, a, d))
					}
				};
				i.src = h;
			}
		}
	};

	darkenPage = function() {

		if(bttvJquery("body[data-page=\"directory#directory\"]").length || bttvJquery("body[data-page=\"chapter#show\"]").length || bttvJquery("body[data-page=\"archive#show\"]").length || PP['page_type'] === "channel" || (bttvJquery("#twitch_chat").length)) {

			if(localStorage.getItem("darkenedMode") === "true") {

				betterttvDebug.log("Darkening Page");

				var darkCSS = document.createElement("link");
				darkCSS.setAttribute("href","http://cdn.betterttv.net/betterttv-dark.css");
				darkCSS.setAttribute("type","text/css");
				darkCSS.setAttribute("rel","stylesheet");
				darkCSS.setAttribute("id","darkTwitch");
				bttvJquery('body').append(darkCSS);

				bttvJquery("#main_col .content #stats_and_actions #channel_stats #channel_viewer_count").css("display","none");
				setTimeout(handleBackground, 1000);
			}

		}

	}

	splitChat = function() {

		if(bttvJquery("#twitch_chat").length && localStorage.getItem("splitChat") !== "false") {

			betterttvDebug.log("Splitting Chat");

			var splitCSS = document.createElement("link");
			localStorage.getItem("darkenedMode") === "true" ? splitCSS.setAttribute("href","http://cdn.betterttv.net/betterttv-splitchat-dark.css") : splitCSS.setAttribute("href","http://cdn.betterttv.net/betterttv-splitchat.css");
			splitCSS.setAttribute("type","text/css");
			splitCSS.setAttribute("rel","stylesheet");
			splitCSS.setAttribute("id","splitChat");
			bttvJquery('body').append(splitCSS);
		}

	}

	flipDashboard = function() {

		if(bttvJquery("#dash_main").length && localStorage.getItem("flipDashboard") === "true") {

			betterttvDebug.log("Flipping Dashboard");

			bttvJquery("#controls_column, #player_column").css({
				float: "right",
				marginLeft: "500px"
			});
			bttvJquery("#chat").css({
				float: "left",
				left: "20px",
				right: ""
			});

		}

	}

	dashboardViewers = function() {

		if(bttvJquery("#dash_main").length) {

			betterttvDebug.log("Updating Dashboard Viewers");

			Twitch.api.get("streams/"+PP['channel']).done(function (a) {
				if(a.stream && a.stream.viewers) {
					bttvJquery("#channel_viewer_count").html(a.stream.viewers);
				} else {
					bttvJquery("#channel_viewer_count").html("Offline");
				}
				setTimeout(dashboardViewers,60000);
			});
		}

	}

	giveawayCompatibility = function() {

		if(bttvJquery("#dash_main").length) {

			betterttvDebug.log("Giveaway Plugin Dashboard Compatibility");

			bttvJquery(".tga_button").click(function() {
				if(localStorage.getItem("flipDashboard") === "true") {
					bttvJquery("#chat").width("330px");
					bttvJquery(".tga_modal").css("right","20px");
				} else {
					bttvJquery("#chat").width("330px");
					bttvJquery(".tga_modal").css("right","inherit");
				}
			});
			bttvJquery("button[data-action=\"close\"]").click(function() {
				bttvJquery("#chat").width("500px");
			});
		}

	}

	createSettingsMenu = function() {

		var settingsMenu = document.getElementById("chat_settings_dropmenu");
		if(!settingsMenu) return;

		betterttvDebug.log("Creating BetterTTV Settings Menu");

		bttvSettings = document.createElement("div");
		bttvSettings.setAttribute("align","left");
		bttvSettings.setAttribute("id","bttvsettings");
		bttvSettings.style.margin = "0px auto";

		bttvSettings.innerHTML = '<ul class="dropmenu_col inline_all"> \
							<li id="chat_section_chatroom" class="dropmenu_section"> \
							<br /> \
							&nbsp;&nbsp;&nbsp;&raquo;&nbsp;BetterTTV \
							<br /> \
							'+(bttvJquery("body#chat").length?'<a class="dropmenu_action g18_gear-FFFFFF80" href="#" id="blackChatLink" onclick="betterttvAction(\'toggleBlackChat\'); return false;">Black Chat (Chroma Key)</a>':'')+' \
							'+(bttvJquery("#dash_main").length?'<a class="dropmenu_action g18_gear-FFFFFF80" href="#" id="flipDashboard" onclick="betterttvAction(\'flipDashboard\'); return false;">'+(localStorage.getItem("flipDashboard") === "true"?'Unflip Dashboard':'Flip Dashboard')+'</a>':'')+' \
							<a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'setHighlightKeywords\'); return false;">Set Highlight Keywords</a> \
							<a class="dropmenu_action g18_trash-FFFFFF80" href="#" onclick="betterttvAction(\'clearChat\'); return false;">Clear My Chat</a> \
							<br /> \
							'+(!bttvJquery("body#chat").length?'<a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'openSettings\'); return false;">BetterTTV Settings</a>':'')+' \
							</li> \
							</ul> \
							';

		settingsMenu.appendChild(bttvSettings);

		settingsPanel = document.createElement("div");
		settingsPanel.setAttribute("id","bttvSettingsPanel");
		settingsPanel.style.display = "none";
		settingsPanel.innerHTML = '<div id="header"> \
									<span id="logo"><img height="45px" src="http://cdn.betterttv.net/bttvlogo.png" /></span> \
									<ul class="nav"> \
										<li class="active"><a href="#bttvSettings">Settings</a></li> \
										<li><a href="#bttvAbout">About</a></li> \
									</ul><span id="close">&times;</span> \
								   </div> \
								   <div id="bttvSettings" style="overflow-y:auto;height:425px;"> \
								    <h2 class="option"> Here you can manage the various Better TwitchTV options. Click On or Off to toggle settings.</h2> \
								    <div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Darken Twitch</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;A slick, grey theme which will make you love Twitch even more \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleDarkTwitch" value="false" id="darkenedModeFalse"> \
											<label for="darkenedModeFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleDarkTwitch" value="true" id="darkenedModeTrue" checked> \
											<label for="darkenedModeTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default Chat Tags</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV replaces the Twitch chat tags with the old JTV ones by default \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleDefaultTags" value="false" id="defaultTagsFalse"> \
											<label for="defaultTagsFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleDefaultTags" value="true" id="defaultTagsTrue" checked> \
											<label for="defaultTagsTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default Emoticons</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV replaces the Twitch emoticons with the old JTV monkey faces by default \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleDefaultEmotes" value="false" id="defaultEmotesFalse"> \
											<label for="defaultEmotesFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleDefaultEmotes" value="true" id="defaultEmotesTrue" checked> \
											<label for="defaultEmotesTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default Purple Buttons</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV replaces the Twitch buttons with blue ones by default \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="togglePurpleButtons" value="false" id="defaultPurpleButtonsFalse"> \
											<label for="defaultPurpleButtonsFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="togglePurpleButtons" value="true" id="defaultPurpleButtonsTrue" checked> \
											<label for="defaultPurpleButtonsTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Deleted Messages</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV hides deleted messages by default. Set this to On to show them. \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleDeletedMessages" value="false" id="showDeletedMessagesFalse"> \
											<label for="showDeletedMessagesFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleDeletedMessages" value="true" id="showDeletedMessagesTrue" checked> \
											<label for="showDeletedMessagesTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Featured Channels</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;The left sidebar is too cluttered, so BetterTTV removes featured channels by default \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleFeaturedChannels" value="false" id="featuredChannelsFalse"> \
											<label for="featuredChannelsFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleFeaturedChannels" value="true" id="featuredChannelsTrue" checked> \
											<label for="featuredChannelsTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Split Chat</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Easily distinguish between messages from different users in chat \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleSplitChat" value="false" id="splitChatFalse"> \
											<label for="splitChatFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleSplitChat" value="true" id="splitChatTrue" checked> \
											<label for="splitChatTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Subscribe Button</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Toggle this off to hide those pesky subscribe buttons \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleBlockSubButton" value="false" id="blockSubButtonFalse"> \
											<label for="blockSubButtonFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleBlockSubButton" value="true" id="blockSubButtonTrue" checked> \
											<label for="blockSubButtonTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	<span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Self Highlights</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Toggle this off to disable highlights on your own username \
										<div class="switch"> \
											<input type="radio" class="switch-input switch-off" name="toggleSelfHighlights" value="false" id="selfHighlightsFalse"> \
											<label for="selfHighlightsFalse" class="switch-label switch-label-off">Off</label> \
											<input type="radio" class="switch-input" name="toggleSelfHighlights" value="true" id="selfHighlightsTrue" checked> \
											<label for="selfHighlightsTrue" class="switch-label switch-label-on">On</label> \
											<span class="switch-selection"></span> \
										</div> \
									</div> \
									<div class="option"> \
								    	Think something is missing here? Send in a <a href="http://bugs.nightdev.com/projects/betterttv/issues/new?tracker_id=2" target="_blank">feature request</a>! \
									</div> \
								   </div> \
								   <div id="bttvAbout" style="display:none;"> \
							   		<div class="aboutHalf"> \
							   			<img class="bttvAboutIcon" src="http://cdn.betterttv.net/icon.png" /> \
							   			<h2>Better TwitchTV v'+betterttvVersion+'</h2> \
							   			<h2>from your friends at <a href="http://www.nightdev.com" target="_blank">NightDev</a></h2> \
							   			<br /> \
							   			<p>BetterTTV began in 2011 shortly after the launch of Twitch. The original Twitch site at launch was almost laughable at times with multiple failures in both site design (I can never forget the font Twitch originally used) and bugs (for example, at launch chat didn\'t scroll correctly). After BetterJTV\'s massive success and lack of support at the time for Twitch, multiple friends begged me to recreate it for Twitch. Since the beginning, BetterTTV has always promoted old JTV chat features over Twitch\'s, but has expanded to offer more customization and personalization over the years. Since 2011, BetterTTV has gone through multiple revisions to establish what it is today.</p> \
							   		</div> \
							   		<div class="aboutHalf"> \
							   			<h2>I\'m just gonna leave this right here..</h2><br /> \
							   			<form id="bttvTipJar" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank"> \
											<input type="hidden" name="cmd" value="_xclick"> \
											<input type="hidden" name="business" value="night@nightdev.com"> \
											<input type="hidden" name="lc" value="US"> \
											<input type="hidden" name="item_name" value="BetterTTV Tip Jar"> \
											<input type="hidden" name="item_number" value="'+PP['login']+'"> \
											<input type="hidden" name="amount" value=""> \
											<input type="hidden" name="currency_code" value="USD"> \
											<input type="hidden" name="button_subtype" value="services"> \
											<input type="hidden" name="no_note" value="0"> \
											<input type="hidden" name="cn" value="Leave a message:"> \
											<input type="hidden" name="no_shipping" value="1"> \
											<input type="hidden" name="bn" value="PP-BuyNowBF:btn_buynowCC_LG.gif:NonHosted"> \
											<h2><a href="#" onclick="document.getElementById(\'bttvTipJar\').submit();">BetterTTV Tip Jar</a></h2> \
										</form><br /><br /> \
							   			<img style="vertical-align:bottom;" src="http://static-cdn.jtvnw.net/jtv_user_pictures/panel-11785491-image-6b90c7f168932ac7-320.png" /><br /><small><small>BetterTTV is not endorsed nor affiliated with Kappa, Kappab</small></small> \
							   		</div> \
								   </div> \
								   <div id="footer"> \
									<span>BetterTTV &copy; <a href="http://www.nightdev.com" target="_blank">NightDev</a> 2013</span><span style="float:right;">For support, please <a href="http://www.nightdev.com/contact" target="_blank">click here</a>. To report a bug, <a href="http://bugs.nightdev.com/projects/betterttv/issues/new?tracker_id=1" target="_blank">click here</a>.</span> \
								   </div>';
		bttvJquery("body").append(settingsPanel);

		bttvJquery("#bttvSettingsPanel #close").click(function(e){
			bttvJquery("#bttvSettingsPanel").hide("slow");
		});

		bttvJquery("#bttvSettingsPanel .nav a").click(function(e){
			e.preventDefault();
			var tab = bttvJquery(this).attr("href");

			bttvJquery("#bttvSettingsPanel .nav a").each(function() {
				var currentTab = bttvJquery(this).attr("href");
				bttvJquery(currentTab).hide();
				bttvJquery(this).parent("li").removeClass("active");
			});

			bttvJquery(tab).fadeIn();
			bttvJquery(this).parent("li").addClass("active");
		});

		bttvJquery('.option input:radio').change(function(e){
			betterttvAction(e.target.name);
		});

		bttvJquery('.dropmenu_action').each(function(element) {
			bttvJquery(this).css("color","#ffffff");
		});

		localStorage.getItem("darkenedMode") === "true" ? bttvJquery('#darkenedModeTrue').prop('checked', true) : bttvJquery('#darkenedModeFalse').prop('checked', true)
		localStorage.getItem("showDefaultEmotes") === "true" ? bttvJquery('#defaultEmotesTrue').prop('checked', true) : bttvJquery('#defaultEmotesFalse').prop('checked', true);
		localStorage.getItem("showDefaultTags") === "true" ? bttvJquery('#defaultTagsTrue').prop('checked', true) : bttvJquery('#defaultTagsFalse').prop('checked', true);
		localStorage.getItem("showPurpleButtons") === "true" ? bttvJquery('#defaultPurpleButtonsTrue').prop('checked', true) : bttvJquery('#defaultPurpleButtonsFalse').prop('checked', true);
		localStorage.getItem("splitChat") === "false" ? bttvJquery('#splitChatFalse').prop('checked', true) : bttvJquery('#splitChatTrue').prop('checked', true);
		localStorage.getItem("blockSubButton") === "true" ? bttvJquery('#blockSubButtonFalse').prop('checked', true) : bttvJquery('#blockSubButtonTrue').prop('checked', true);
		localStorage.getItem("selfHighlights") !== "false" ? bttvJquery('#selfHighlightsTrue').prop('checked', true) : bttvJquery('#selfHighlightsFalse').prop('checked', true);
		localStorage.getItem("showFeaturedChannels") === "true" ? bttvJquery('#featuredChannelsTrue').prop('checked', true) : bttvJquery('#featuredChannelsFalse').prop('checked', true);
		localStorage.getItem("showDeletedMessages") === "true" ? bttvJquery('#showDeletedMessagesTrue').prop('checked', true) : bttvJquery('#showDeletedMessagesFalse').prop('checked', true);
	}

	betterttvAction = function(action) {
		if(action === "clearChat") {
			removeElement(".line");
			CurrentChat.admin_message("You cleared your own chat (BetterTTV)");
		}
		if(action === "openSettings") {
			bttvJquery('#chat_settings_dropmenu').hide();
			bttvJquery('#bttvSettingsPanel').show("slow");
		}
		if(action === "setHighlightKeywords") {
			var keywords = prompt("Type some highlight keywords. Messages containing keywords will turn red to get your attention. Use spaces in the field to specify multiple keywords.",localStorage.getItem("highlightKeywords"));
			if (keywords != null) {
				localStorage.setItem("highlightKeywords", keywords);
				var keywords = keywords.split(" ");

				if (localStorage.getItem("selfHighlights") !== "false") {
					keywords.unshift(PP['login']);
				}
				var keywordList = keywords.join(", ");

				CurrentChat.admin_message("Highlight Keywords are now set to: "+keywordList);
			}
		}
		if(action === "flipDashboard") {
			if(localStorage.getItem("flipDashboard") === "true") {
				localStorage.setItem("flipDashboard", false);
				bttvJquery("#flipDashboard").html("Flip Dashboard");
				bttvJquery("#controls_column, #player_column").css({
					float: "none",
					marginLeft: "0px"
				});
				bttvJquery("#chat").css({
					float: "right",
					left: "",
					right: "20px"
				});
			} else {
				localStorage.setItem("flipDashboard", true);
				bttvJquery("#flipDashboard").html("Unflip Dashboard");
				flipDashboard();
			}
		}
		if(action === "toggleDefaultEmotes") {
			if(localStorage.getItem("showDefaultEmotes") === "true") {
				localStorage.setItem("showDefaultEmotes", false);
			} else {
				localStorage.setItem("showDefaultEmotes", true);
			}
			overrideEmotes();
		}
		if(action === "toggleDefaultTags") {
			if(localStorage.getItem("showDefaultTags") === "true") {
				localStorage.setItem("showDefaultTags", false);
			} else {
				localStorage.setItem("showDefaultTags", true);
			}
		}
		if(action === "toggleDeletedMessages") {
			if(localStorage.getItem("showDeletedMessages") === "true") {
				localStorage.setItem("showDeletedMessages", false);
			} else {
				localStorage.setItem("showDeletedMessages", true);
			}
		}
		if(action === "togglePurpleButtons") {
			if(localStorage.getItem("showPurpleButtons") === "true") {
				localStorage.setItem("showPurpleButtons", false);
				cssBlueButtons();
			} else {
				localStorage.setItem("showPurpleButtons", true);
				bttvJquery("#bttvBlueButtons").remove();
			}
		}
		if(action === "toggleDarkTwitch") {
			if(localStorage.getItem("darkenedMode") === "true") {
				localStorage.setItem("darkenedMode", false);
				bttvJquery("#darkTwitch").remove();
				handleBackground();
				if(localStorage.getItem("splitChat") !== "false") {
					bttvJquery("#splitChat").remove();
					splitChat();
				}
			} else {
				localStorage.setItem("darkenedMode", true);
				darkenPage();
				if(localStorage.getItem("splitChat") !== "false") {
					bttvJquery("#splitChat").remove();
					splitChat();
				}
			}
		}
		if(action === "toggleSplitChat") {
			if(localStorage.getItem("splitChat") === "false") {
				localStorage.setItem("splitChat", true);
				splitChat();
			} else {
				localStorage.setItem("splitChat", false);
				bttvJquery("#splitChat").remove();
			}
		}
		if(action === "toggleBlackChat") {
			if(blackChat) {
				blackChat = false;
				bttvJquery("#blackChat").remove();
				darkenPage();
				splitChat();
				bttvJquery("#blackChatLink").html("Black Chat (Chroma Key)");
			} else {
				blackChat = true;
				bttvJquery("#darkTwitch").remove();
				bttvJquery("#splitChat").remove();
				var darkCSS = document.createElement("link");
				darkCSS.setAttribute("href","http://cdn.betterttv.net/betterttv-blackchat.css");
				darkCSS.setAttribute("type","text/css");
				darkCSS.setAttribute("rel","stylesheet");
				darkCSS.setAttribute("id","blackChat");
				darkCSS.innerHTML = '';
				bttvJquery('body').append(darkCSS);
				bttvJquery("#blackChatLink").html("Unblacken Chat");
			}
		}
		if(action === "toggleBlockSubButton") {
			if(localStorage.getItem("blockSubButton") === "true") {
				localStorage.setItem("blockSubButton", false);
				bttvJquery("#sub-details").css("display", "inline");
			} else {
				localStorage.setItem("blockSubButton", true);
				bttvJquery("#sub-details").css("display", "none");
			}
		}
		if (action === "toggleSelfHighlights") {
			if(localStorage.getItem("selfHighlights") !== "false") {
				localStorage.setItem("selfHighlights", false);
			} else {
				localStorage.setItem("selfHighlights", true);
			}
		}
		if(action === "toggleFeaturedChannels") {
			if(localStorage.getItem("showFeaturedChannels") === "true") {
				localStorage.setItem("showFeaturedChannels", false);
				removeElement('.sm_vids');
				removeElement('#nav_games');
				removeElement('#nav_streams');
				removeElement('.featured');
				removeElement('.related');
			} else {
				localStorage.setItem("showFeaturedChannels", true);
				displayElement('.sm_vids');
				displayElement('#nav_games');
				displayElement('#nav_streams');
				displayElement('.featured');
				displayElement('.related');
			}
		}
	}

	if(document.URL.indexOf("receiver.html") !== -1 || document.URL.indexOf("cbs_ad_local.html") !== -1) {
		betterttvDebug.log("HTML file called by Twitch.");
		return;
	}

	checkJquery = function() {
		if(typeof($j) === 'undefined') {
			betterttvDebug.log("jQuery is undefined.");
			setTimeout(checkJquery, 1000);
			return;
		} else {
			bttvJquery = $j;
			main();
		}
	}

	main = function() {
		bttvJquery(document).ready(function() {
			betterttvDebug.log("BTTV v"+betterttvVersion);
			betterttvDebug.log("CALL init "+document.URL);
			brand();
			clearAds();
			channelReformat();
			chatReformat();
			newChannelReformat();
			checkMessages();
			clearAds();
			checkFollowing();
			darkenPage();
			splitChat();
			flipDashboard();
			giveawayCompatibility();
			dashboardViewers();
			bttvJquery(window).trigger('resize');
			setTimeout(clearAds, 1000);
			setTimeout(clearAds, 5000);
			setTimeout(clearAds, 10000);
			setTimeout(chatFunctions, 1000);
			setTimeout(createSettingsMenu, 1000);
			setTimeout(overrideEmotes, 10000);

			(function(b){b.gritter={};b.gritter.options={position:"top-left",class_name:"",fade_in_speed:"medium",fade_out_speed:1000,time:6000};b.gritter.add=function(f){try{return a.add(f||{})}catch(d){var c="Gritter Error: "+d;(typeof(console)!="undefined"&&console.error)?console.error(c,f):alert(c)}};b.gritter.remove=function(d,c){a.removeSpecific(d,c||{})};b.gritter.removeAll=function(c){a.stop(c||{})};var a={position:"",fade_in_speed:"",fade_out_speed:"",time:"",_custom_timer:0,_item_count:0,_is_setup:0,_tpl_close:'<div class="gritter-close"></div>',_tpl_title:'<span class="gritter-title">[[title]]</span>',_tpl_item:'<div id="gritter-item-[[number]]" class="gritter-item-wrapper [[item_class]]" style="display:none"><div class="gritter-top"></div><div class="gritter-item">[[close]][[image]]<div class="[[class_name]]">[[title]]<p>[[text]]</p></div><div style="clear:both"></div></div><div class="gritter-bottom"></div></div>',_tpl_wrap:'<div id="gritter-notice-wrapper"></div>',add:function(g){if(typeof(g)=="string"){g={text:g}}if(!g.text){throw'You must supply "text" parameter.'}if(!this._is_setup){this._runSetup()}var k=g.title,n=g.text,e=g.image||"",l=g.sticky||false,m=g.class_name||b.gritter.options.class_name,j=b.gritter.options.position,d=g.time||"";this._verifyWrapper();this._item_count++;var f=this._item_count,i=this._tpl_item;b(["before_open","after_open","before_close","after_close"]).each(function(p,q){a["_"+q+"_"+f]=(b.isFunction(g[q]))?g[q]:function(){}});this._custom_timer=0;if(d){this._custom_timer=d}var c=(e!="")?'<img src="'+e+'" class="gritter-image" />':"",h=(e!="")?"gritter-with-image":"gritter-without-image";if(k){k=this._str_replace("[[title]]",k,this._tpl_title)}else{k=""}i=this._str_replace(["[[title]]","[[text]]","[[close]]","[[image]]","[[number]]","[[class_name]]","[[item_class]]"],[k,n,this._tpl_close,c,this._item_count,h,m],i);if(this["_before_open_"+f]()===false){return false}b("#gritter-notice-wrapper").addClass(j).append(i);var o=b("#gritter-item-"+this._item_count);o.fadeIn(this.fade_in_speed,function(){a["_after_open_"+f](b(this))});if(!l){this._setFadeTimer(o,f)}b(o).bind("mouseenter mouseleave",function(p){if(p.type=="mouseenter"){if(!l){a._restoreItemIfFading(b(this),f)}}else{if(!l){a._setFadeTimer(b(this),f)}}a._hoverState(b(this),p.type)});b(o).find(".gritter-close").click(function(){a.removeSpecific(f,{},null,true)});return f},_countRemoveWrapper:function(c,d,f){d.remove();this["_after_close_"+c](d,f);if(b(".gritter-item-wrapper").length==0){b("#gritter-notice-wrapper").remove()}},_fade:function(g,d,j,f){var j=j||{},i=(typeof(j.fade)!="undefined")?j.fade:true,c=j.speed||this.fade_out_speed,h=f;this["_before_close_"+d](g,h);if(f){g.unbind("mouseenter mouseleave")}if(i){g.animate({opacity:0},c,function(){g.animate({height:0},300,function(){a._countRemoveWrapper(d,g,h)})})}else{this._countRemoveWrapper(d,g)}},_hoverState:function(d,c){if(c=="mouseenter"){d.addClass("hover");d.find(".gritter-close").show()}else{d.removeClass("hover");d.find(".gritter-close").hide()}},removeSpecific:function(c,g,f,d){if(!f){var f=b("#gritter-item-"+c)}this._fade(f,c,g||{},d)},_restoreItemIfFading:function(d,c){clearTimeout(this["_int_id_"+c]);d.stop().css({opacity:"",height:""})},_runSetup:function(){for(opt in b.gritter.options){this[opt]=b.gritter.options[opt]}this._is_setup=1},_setFadeTimer:function(f,d){var c=(this._custom_timer)?this._custom_timer:this.time;this["_int_id_"+d]=setTimeout(function(){a._fade(f,d)},c)},stop:function(e){var c=(b.isFunction(e.before_close))?e.before_close:function(){};var f=(b.isFunction(e.after_close))?e.after_close:function(){};var d=b("#gritter-notice-wrapper");c(d);d.fadeOut(function(){b(this).remove();f()})},_str_replace:function(v,e,o,n){var k=0,h=0,t="",m="",g=0,q=0,l=[].concat(v),c=[].concat(e),u=o,d=c instanceof Array,p=u instanceof Array;u=[].concat(u);if(n){this.window[n]=0}for(k=0,g=u.length;k<g;k++){if(u[k]===""){continue}for(h=0,q=l.length;h<q;h++){t=u[k]+"";m=d?(c[h]!==undefined?c[h]:""):c[0];u[k]=(t).split(l[h]).join(m);if(n&&u[k]!==t){this.window[n]+=(t.length-u[k].length)/l[h].length}}}return p?u:u[0]},_verifyWrapper:function(){if(b("#gritter-notice-wrapper").length==0){b("body").append(this._tpl_wrap)}}}})(jQuery);
		
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

			ga('create', 'UA-39733925-4', 'betterttv.net');
			ga('send', 'pageview');
		});
	}

	try {
		if(BTTVLOADED==true) return;
	} catch(err) {
		betterttvDebug.log("BTTV LOADED "+document.URL);
		BTTVLOADED=true;
		checkJquery();
	}

}();