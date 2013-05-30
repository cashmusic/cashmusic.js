/**
 * The core cashmusic.js file
 *
 * COMPRESSION SETTINGS
 * YUI compressor with "preserve unnecessary semi-colons" then append a semi-colon to the front to be careful
 *
 * @package cashmusic.org.cashmusic
 * @author CASH Music
 * @link http://cashmusic.org/
 *
 * Copyright (c) 2013, CASH Music
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list
 * of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this
 * list of conditions and the following disclaimer in the documentation and/or other
 * materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 * OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 * OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 **/

;(function() {
	'use strict';
	var cashmusic;
	if (window.cashmusic != null) {
		// if window.cashmusic exists, we just return the current instance
		cashmusic = window.cashmusic;
	} else {
		// no window.cashmusic, so we build and return an object
		cashmusic = {

			_init: function() {
				// load status
				this.hogan = false;
				this.soundmanager = false;
				this.soundplayer = false;

				// storage...basically just a namespace to use as a clipboard between scripts
				this.storage = {};

				// determine file location and path
				this.scriptElement = document.querySelector('script[src=$cashmusic.js');
				if (this.scriptElement) {
					this.path = this.scriptElement.src.replace('cashmusic.js','');
				}

				// look for links to video sites
				this.storage.embeddableLinks = document.querySelectorAll('a[href*=youtube.com],a[href*=vimeo.com]');
				if (this.storage.embeddableLinks.length > 0) {
					if (!this.hogan) {
						this.getScript(this.path+'/lib/hogan/hogan-2.0.0.min.js',function() {
							// make our nice overlays
						});
					}
				}

				// look for .cashmusic.soundplayer divs
			},

			/*
			 * window.cashmusic.embed(string publicURL, string elementId, bool lightboxed, bool lightboxTxt)
			 * Generates the embed iFrame code for embedding a given element.
			 * Optional third and fourth parameters allow the element to be 
			 * embedded with a lightbox and to customize the text of lightbox
			 * opener link. (default: 'open element')
			 *
			 * The iFrame is embedded at 1px high and sends a postMessage back 
			 * to this parent window with its proper height. 
			 */
			embed: function(publicURL, elementId, targetNode, lightboxed, lightboxTxt) {
				var randomId = 'cashmusic_embed' + Math.floor((Math.random()*1000000)+1);
				var embedURL = publicURL + '/request/embed/' + elementId + '/location/' + encodeURIComponent(window.location.href.replace(/\//g,'!slash!'));
				if (targetNode) {
					// for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
					var currentNode = document.querySelector(targetNode);
				} else {
					// if used non-AJAX we just grab the current place in the doc
					var allScripts = document.querySelectorAll('script[src="' + publicURL + 'cashmusic.js' + '"]');
					var currentNode = allScripts[allScripts.length - 1];
				}
				// be nice neighbors. if we can't find currentNode, don't do the rest or pitch errors. silently fail.
				if (currentNode) {
					// create a div to contain the link/iframe
					var embedNode = document.createElement('div');
					embedNode.className = 'cashmusic_embed';
					if (lightboxed) {
						// open in a lightbox with a link in the target div
						if (!lightboxTxt) {lightboxTxt = 'open element';}
						var overlayId = 'cashmusic_embed' + Math.floor((Math.random()*1000000)+1);
						embedNode.innerHTML = '<a id="' + randomId + '" href="' + embedURL + '" target="_blank">' + lightboxTxt + '</a><div id="' + overlayId + '" class="cashmusic_embed_overlay" style="position:fixed;overflow:auto;top:0;left:0;width:100%;height:100%;background-color:rgba(80,80,80,0.85);opacity:0;display:none;z-index:654321;"><div style="position:absolute;top:80px;left:50%;margin-left:-260px;z-index:10;background-color:#fff;padding:10px;"><iframe src="' + embedURL + '" scrolling="auto" width="500" height="400" frameborder="0"></iframe></div></div>';
						currentNode.parentNode.insertBefore(embedNode,currentNode);
						document.getElementById(randomId).addEventListener('click', function(e) {
							window.cashmusic.fadeEffect.init(overlayId, 1, 100);
							e.preventDefault();
						}, false);

						window.addEventListener("keyup", function(e) { 
							if (e.keyCode == 27) {
								// get all overlay divs and hide them
								var matches = document.querySelectorAll('div.cashmusic_embed_overlay');
								for (var i = 0; i < matches.length; ++i) {
									// have to use for not foreach (matches is a nodeList not an array)
									var d = matches[i];
									d.style.opacity = 0;
									d.style.filter = 'alpha(opacity=0)';
									d.style.display = 'none';
								}
							} 
						}, false);
					} else {
						var embedMarkup = '<iframe id="' + randomId + '" src="' + embedURL + '" scrolling="auto" width="100%" height="1" frameborder="0"></iframe>' +
										  '<!--[if lte IE 7]><script type="text/javascript">var iframeEmbed=document.getElementById("' + randomId + '");iframeEmbed.height = "400px";</script><![endif]-->';
						embedNode.innerHTML = embedMarkup;
						currentNode.parentNode.insertBefore(embedNode,currentNode);
						var iframeEmbed = document.getElementById(randomId);
						
						// using messages passed between the request and this script to resize the iframe
						var onmessage = function(e) {
							// look for cashmusic_embed...if not then we don't care
							if (e.data.substring(0,15) == 'cashmusic_embed') {
								var a = e.data.split('_');
								// double-check that we're going with the correct element embed a[2] is the id
								if (a[2] == elementId) {
									if (embedURL.indexOf(e.origin) !== -1) {
										// a[3] is the height
										iframeEmbed.height = a[3] + 'px';
									}
								}
							}
						};
						if (window.addEventListener) {
							window.addEventListener('message', onmessage, false);
						} else if (window.attachEvent) {
							window.attachEvent('onmessage', onmessage);
						}
					}
				}
			},

			/*
			 * window.cashmusic.encodeForm(object form)
			 * Takes a form object returned by a document.getElementBy... call
			 * and turns it into a querystring to be used with a GET or POST call.
			 */
			encodeForm: function(form) {
				if (typeof form !== 'object') {
					return false;
				}
				var querystring = '';
				form = form.elements || form; //double check for elements node-list
				for (var i=0;i<form.length;i++) {
					if (form[i].type === 'checkbox' || form[i].type === 'radio') {
						if (form[i].checked) {
							querystring += (querystring.length ? '&' : '') + form[i].name + '=' + form[i].value;
						}
						continue;
					}
					querystring += (querystring.length ? '&' : '') + form[i].name +'='+ form[i].value; 
				}
				return encodeURI(querystring);
			},

			getPath: function() {
				return this.path;
			},

			getScriptElement: function() {
				return this.scriptElement;
			},

			// stolen from jQuery
			getScript: function(url,success) {
				var head = document.getElementsByTagName("head")[0] || document.documentElement;
				var script = document.createElement("script");
				script.src = url;

				// Handle Script loading
				var done = false;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function() {
					if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
						done = true;
						success();
						
						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;
						if (head && script.parentNode) {head.removeChild(script);}
					}
				};
				head.insertBefore( script, head.firstChild );
			}

			/*
			 * window.cashmusic.getXHR()
			 * Tests for the proper XHR object type and returns the appropriate
			 * object type for the current browser using a try/catch block. If 
			 * no viable objects are found it returns false. But we should make
			 * fun of that browser, because it sucks.
			 */
			getXHR: function() {
				try	{
					return new XMLHttpRequest();
				} catch(e) {
					try {
						return new ActiveXObject('Msxml2.XMLHTTP');
					} catch(er) {
						try {
							return new ActiveXObject('Microsoft.XMLHTTP');
						} catch(err) {
							return false;
						}
					}
				}
			},

			/*
			 * window.cashmusic.fadeEffect (object)
			 * Object to provide tweened fades for DOM elements.
			 *
			 * window.cashmusic.fadeEffect.init(id, flag, target)
			 * window.cashmusic.fadeEffect.tween()
			 */
			fadeEffect: {
				init: function(id,flag,target) {
					this.elem = document.getElementById(id);
					clearInterval(this.elem.si);
					this.target = target ? target : flag ? 100 : 0;
					this.flag = flag || -1;
					this.alpha = this.elem.style.opacity ? parseFloat(this.elem.style.opacity) * 100 : 0;
					if (this.alpha == 0 && target > 0) {
						this.elem.style.display = 'block';
					}
					this.si = setInterval(function(){window.cashmusic.fadeEffect.tween();}, 20);
				},
				tween: function() {
					if(this.alpha == this.target) {
						clearInterval(this.elem.si);
					}else{
						var value = Math.round(this.alpha + ((this.target - this.alpha) * 0.05)) + (this.flag);
						this.elem.style.opacity = value / 100;
						this.elem.style.filter = 'alpha(opacity=' + value + ')';
						if (value == 0) {
							this.elem.style.display = 'none';
						}
						this.alpha = value;
					}
				}
			},

			// http://ejohn.org/blog/flexible-javascript-events/
			addEvent: function(obj,type,fn) {
				if (obj.attachEvent) {
					obj['e'+type+fn] = fn;
					obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
					obj.attachEvent( 'on'+type, obj[type+fn] );
				} else {
					obj.addEventListener( type, fn, false );
				}
			}

			// http://ejohn.org/blog/flexible-javascript-events/
			removeEvent: function(obj,type,fn) {
				if (obj.detachEvent) {
					obj.detachEvent( 'on'+type, obj[type+fn] );
					obj[type+fn] = null;
				} else {
					obj.removeEventListener( type, fn, false );
				}
			}

			fireEvent: function (obj,type,data){
				if (document.dispatchEvent){
					// standard
					var e = new CustomEvent(type, true, true, {'detail':data}); // type,bubbling,cancelable,detail
					obj.dispatchEvent(e);
				} else {
					// dispatch for IE < 9
					var e = document.createEventObject();
					e.detail = data;
					obj.fireEvent('on'+type,e);
				}
			}

			/*
			 * window.cashmusic.sendXHR(string url, string postString, function successCallback)
			 * Do a POST or GET request via XHR/AJAX. Passing a postString will 
			 * force a POST request, whereas passing false will send a GET.
			 */
			sendXHR: function(url,postString,successCallback) {
				var method = 'POST';
				if (!postString) {
					method = 'GET';
					postString = null;
				}
				var ajax = this.getXHR();
				if (ajax) {
					ajax.open(method,url,true);
					ajax.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					if (method == 'POST') {
						ajax.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');		
					}
					if (typeof successCallback == 'function') {
						ajax.onreadystatechange = function() {
							if (ajax.readyState === 4 && ajax.status === 200) {
								successCallback(ajax.responseText);
							}
						};
					}
					ajax.send(postString);
				}
			}
		};
	}
	cashmusic._init();
	return cashmusic;

	/*
	document.getElementById('cashmusicshowvoterreg').addEventListener('click', function(e) {
		fadeEffect.init('cashmusicvoterregoverlay', 1, 100);
		e.preventDefault();
	}, false);

	document.getElementById('cashmusichidevoterreg').addEventListener('click', function(e) {
		fadeEffect.init('cashmusicvoterregoverlay', 0);
		e.preventDefault();
	}, false);

	window.addEventListener("keyup", function(e) { 
		if (e.keyCode == 27) {
			fadeEffect.init('cashmusicvoterregoverlay', 0);
		} 
	}, false);
	*/

}());