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

;window.cashmusic = (function() {
	'use strict';
	var cashmusic;
	if (window.cashmusic != null) {
		// if window.cashmusic exists, we just return the current instance
		cashmusic = window.cashmusic;
	} else {
		// no window.cashmusic, so we build and return an object
		cashmusic = {
			loaded: false,
			hogan: false,
			soundmanager: false,
			soundplayer: false,
			overlay: false,
			templates: {},
			storage: {}, // basically just a namespace to use as a clipboard between scripts

			_init: function() {
				var self = window.cashmusic;

				// determine file location and path
				this.scriptElement = document.querySelector('script[src$="cashmusic.js"]');
				if (this.scriptElement) {
					this.path = this.scriptElement.src.replace('cashmusic.js','');
				}

				// look for links to video sites
				this.storage.embeddableLinks = document.querySelectorAll('a[href*="youtube.com"],a[href*="vimeo.com"]');
				if (this.storage.embeddableLinks.length > 0) {
					//alert(this.storage.embeddableLinks.length);
					if (!this.hogan) {
						if (window.Hogan != null) {
							this.hogan = window.Hogan;
							// run search through links
						} else {

							this.loadScript(this.path+'/lib/hogan/hogan-2.0.0.min.js',function() {
								self.hogan = window.Hogan; // Hogan in the global scope
								self.getTemplate('overlay',function(t) {
									var tmpDiv = document.createElement('div');
									tmpDiv.innerHTML = t;
									self.overlay = tmpDiv.firstChild;
									self.overlay.style.display = 'none';
									document.body.appendChild(window.cashmusic.overlay);
									tmpDiv = null;
									self.events.add(window,'keyup', function(e) { 
										if (e.keyCode == 27) {
											if (self.overlay.style.display = 'block') {
												// hide all the overlays if they're visible
												self.fader.hide(self.overlay);
												var divs = self.overlay.getElementsByTagName('div');
												divs[0].innerHTML = '';
											}
										} 
									});
									self.events.add(self.overlay,'click', function(e) { 
										if(e.target === this) {
											self.fader.hide(self.overlay);
											var divs = self.overlay.getElementsByTagName('div');
											divs[0].innerHTML = '';
										}
									});
								});

								for (var i = 0; i < self.storage.embeddableLinks.length; ++i) {
									self.events.add(self.storage.embeddableLinks[i],'click', function(e) { 
										// do the overlay thing
										var url = e.currentTarget.href;
										self.fader.init(self.overlay, 100, function() {self.embeds.injectIframe(url)});

										e.preventDefault();
										return false;
									});
								}
							});
						}
					}
				}
				//*/

				// look for .cashmusic.soundplayer divs

				// we're loaded
				this.loaded = true;
			},

			/*
			 * contentloaded.js by Diego Perini (diego.perini at gmail.com)
			 * http://javascript.nwbox.com/ContentLoaded/
			 * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
			 *
			 * modified a little because you know
			 */
			contentLoaded: function(fn) {
				var done = false, top = true,
				doc = window.document, root = doc.documentElement,

				init = function(e) {
					if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
					cashmusic.events.remove((e.type == 'load' ? window : doc),e.type,init);
					if (!done && (done = true)) fn.call(window, e.type || e);
				},

				poll = function() {
					try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
					init('poll');
				};

				if (doc.readyState == 'complete') fn.call(window, 'lazy');
				else {
					if (doc.createEventObject && root.doScroll) {
						try { top = !window.frameElement; } catch(e) { }
						if (top) poll();
					}
					this.events.add(doc,'DOMContentLoaded', init);
					this.events.add(doc,'readystatechange', init);
					this.events.add(doc,'load', init);
				}
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
			 *
			 * This is called in a script inline as a piece of blocking script — calling it before
			 * contentLoaded because the partial load tells us where to embed each chunk — we find the
			 * last script node and inject the content by it. For dynamic calls you need to specify 
			 * a targetNode to serve as the anchor — with the embed chucked immediately after that 
			 * element in the DOM.
			 */
			embed: function(publicURL, elementId, lightboxed, lightboxTxt, targetNode) {
				var randomId = 'cashmusic_embed' + Math.floor((Math.random()*1000000)+1);
				var embedURL = publicURL.replace(/\/$/, '') + '/request/embed/' + elementId + '/location/' + encodeURIComponent(window.location.href.replace(/\//g,'!slash!'));
				if (targetNode) {
					// for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
					var currentNode = document.querySelector(targetNode);
				} else {
					// if used non-AJAX we just grab the current place in the doc
					var allScripts = document.querySelectorAll('script[src$="cashmusic.js"]');
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
						this.events.add(embedNode,'click',function(e) {
							window.cashmusic.fader.init(overlayId, 1, 100);
							e.preventDefault();
						}, false);

						this.events.add(window,'keyup', function(e) { 
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
						});
					} else {
						var embedMarkup = '<iframe id="' + randomId + '" src="' + embedURL + '" scrolling="auto" width="100%" height="1" frameborder="0"></iframe>' +
										  '<!--[if lte IE 7]><script type="text/javascript">var iframeEmbed=document.getElementById("' + randomId + '");iframeEmbed.height = "400px";</script><![endif]-->';
						embedNode.innerHTML = embedMarkup;
						currentNode.parentNode.insertBefore(embedNode,currentNode);
						var iframeEmbed = document.getElementById(randomId);

						// using messages passed between the request and this script to resize the iframe
						this.events.add(window,'message',function(e) {
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
						});
					}
				}
			},

			getPath: function() {
				return this.path;
			},

			getScriptElement: function() {
				return this.scriptElement;
			},

			getTemplate: function(templateName,successCallback) {
				if (window.cashmusic.templates[templateName] !== undefined) {
					successCallback(window.cashmusic.templates[templateName]);
				} else {
					this.ajax.send(
						this.path + 'templates/' + templateName + '.mustache',
						false,
						function(msg) {
							window.cashmusic.templates[templateName] = msg;
							successCallback(window.cashmusic.templates[templateName]);
						}
					);
				}
			},

			// stolen from jQuery
			loadScript: function(url,success) {
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
			},

			

			/***************************************************************************************
			 *
			 * window.cashmusic.ajax (object)
			 * Object wrapping XHR calls cross-browser and providing form encoding for POST
			 *
			 * PUBLIC-ISH FUNCTIONS
			 * window.cashmusic.ajax.send(string url, string postString, function successCallback)
			 * window.cashmusic.ajax.encodeForm(object form)
			 *
			 ***************************************************************************************/
			ajax: {
				/*
				 * window.cashmusic.ajax.getXHR()
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
				 * window.cashmusic.ajax.send(string url, string postString, function successCallback)
				 * Do a POST or GET request via XHR/AJAX. Passing a postString will 
				 * force a POST request, whereas passing false will send a GET.
				 */
				send: function(url,postString,successCallback,failureCallback) {
					var method = 'POST';
					if (!postString) {
						method = 'GET';
						postString = null;
					}
					var xhr = this.getXHR();
					if (xhr) {
						xhr.open(method,url,true);
						xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
						if (method == 'POST') {
							xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');		
						}
						if (typeof successCallback == 'function') {
							xhr.onreadystatechange = function() {
								if (xhr.readyState === 4) {
									if (xhr.status === 200) {
										successCallback(xhr.responseText);
									} else {
										if (typeof failureCallback === 'function') {
											failureCallback(xhr.responseText);
										}
									}
								}
							};
						}
						xhr.send(postString);
					}
				},

				/*
				 * window.cashmusic.ajax.encodeForm(object form)
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
				}
			},

			embeds: {

				injectIframe: function(url) {
					var cm = window.cashmusic;
					var self = cm.embeds;
					var divs = cm.overlay.getElementsByTagName('div');
					var overlaycontent = divs[0];
					
					var vp = cm.measure.viewport();
					var parsedUrl = self.parseVideoURL(url);

					if (vp.x > vp.y && (vp.y * (16/9)) < vp.x) {
						var iframePadding = vp.y / 10;
						var iFrameWidth = Math.ceil((vp.y - (iframePadding * 2)) * (16/9));
					} else {
						var iFrameWidth = Math.ceil((vp.x / 12) * 10);
						var iframePadding = (vp.y / 2) - ((iFrameWidth * 0.5625) /2);
					}

					overlaycontent.style.top = iframePadding + 'px';
					overlaycontent.style.width = iFrameWidth + 'px';
					overlaycontent.style.marginLeft = (0 - (iFrameWidth) / 2) + 'px';
					overlaycontent.style.left = '50%';

					var wrapper = document.createElement('div');
					wrapper.style.position = 'relative';
					wrapper.style.paddingBottom = '56.25%';
					wrapper.style.height = 0;
					wrapper.style.backgroundColor = '#000';

					wrapper.innerHTML = '<iframe src="' + parsedUrl + '" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';

					overlaycontent.appendChild(wrapper);
				},

				parseVideoURL: function(url) {
					/*
					Function parseVideoURL(string url)
					Accepts a URL, checks for validity youtube/vimeo, and returns a direct URL for 
					the embeddable URL. Returns false if no known format is found.
					*/
					var parsed = 'what';
					if (url.toLowerCase().indexOf('youtube.com/watch?v=') !== -1) {
						parsed = url.replace('watch?v=','embed/');
						parsed = parsed.replace('http:','https:');
						if (parsed.indexOf('&') > -1) {parsed = parsed.substr(0,parsed.indexOf('&'));}
						parsed += '?autoplay=1&autohide=1&rel=0';
					} else if (url.toLowerCase().indexOf('vimeo.com/') !== -1) {
						parsed = url.replace('www.','');
						parsed = parsed.replace('vimeo.com/','player.vimeo.com/video/');
						parsed += '?title=1&byline=1&portrait=1&autoplay=1';
					} 
					return parsed;
				}
			},

			/***************************************************************************************
			 *
			 * window.cashmusic.events (object)
			 * Add, remove, and fire events
			 *
			 * PUBLIC-ISH FUNCTIONS
			 * window.cashmusic.events.add(object obj, string type, function fn)
			 * window.cashmusic.events.remove(object obj, string type, function fn)
			 * window.cashmusic.events.fire(object obj, string type, object/any data)
			 *
			 ***************************************************************************************/
			events: {
				// Thanks, John Resig!
				// http://ejohn.org/blog/flexible-javascript-events/
				add: function(obj,type,fn) {
					if (obj.attachEvent) {
						obj['e'+type+fn] = fn;
						obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
						obj.attachEvent( 'on'+type, obj[type+fn] );
					} else {
						obj.addEventListener( type, fn, false );
					}
				},

				// Thanks, John Resig!
				// http://ejohn.org/blog/flexible-javascript-events/
				remove: function(obj,type,fn) {
					if (obj.detachEvent) {
						obj.detachEvent( 'on'+type, obj[type+fn] );
						obj[type+fn] = null;
					} else {
						obj.removeEventListener( type, fn, false );
					}
				},

				fire: function (obj,type,data){
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
			},

			/***************************************************************************************
			 *
			 * window.cashmusic.fader (object)
			 * Object to provide tweened fades for DOM elements.
			 *
			 * PUBLIC-ISH FUNCTIONS
			 * window.cashmusic.fader.init(string or object id, integer target, function callback)
			 * window.cashmusic.fader.hide(string or object id)
			 * window.cashmusic.fader.show(string or object id) 
			 *
			 ***************************************************************************************/
			fader: {
				elem: false,
				flag: false,
				alpha: false,
				target: false,
				init: function(id,target,callback) {
					var self = window.cashmusic.fader;
					self.setElement(id);
					clearInterval(self.si);
					self.alpha = self.elem.style.opacity ? parseFloat(self.elem.style.opacity) * 100 : 0;
					if (self.alpha > target) {
						self.flag = -1; // down to lower opacity
					} else {
						self.flag = 1; // up to raise opacity
					}
					self.target = target;
					if (self.alpha == 0 && target > 0) {
						self.elem.style.opacity = 0;
						self.elem.style.display = 'block';
					}
					self.si = setInterval(function(){self.tween(callback);}, 10);
				},
				tween: function(callback) {
					var self = window.cashmusic.fader;
					if(self.alpha == self.target) {
						// all done
						clearInterval(self.si);
						if (typeof callback == 'function') {
							callback();
						}
					}else{
						var value = Math.round(self.alpha + ((self.target - self.alpha) * 0.05)) + (self.flag);
						self.elem.style.opacity = value / 100;
						self.elem.style.filter = 'alpha(opacity=' + value + ')';
						if (value == 0) {
							self.elem.style.display = 'none';
						}
						self.alpha = value;
					}
				},
				hide: function(id) {
					var self = window.cashmusic.fader;
					self.setElement(id);
					self.elem.style.opacity = 0;
					self.elem.style.display = 'none';
				},
				show: function(id) {
					var self = window.cashmusic.fader;
					self.setElement(id);
					self.elem.style.opacity = 100;
					self.elem.style.display = 'block';
				},
				setElement: function(id) {
					var self = window.cashmusic.fader;
					if (typeof id === 'string') {
						self.elem = document.getElementById(id);
					} else {
						self.elem = id;
					}
				}
			},

			measure: {
				viewport: function() {
					return {
						x: document.body.offsetWidth || window.innerWidth || 0,
						y: document.body.offsetHeight || window.innerHeight || 0
					};
				},

				// Thanks Kirupa Chinnathambi!
				// http://www.kirupa.com/html5/getting_mouse_click_position.htm
				getClickPosition: function(e) {
					var parentPosition = window.cashmusic.measure.getPosition(e.currentTarget);
					var xPosition = e.clientX - parentPosition.x;
					var yPosition = e.clientY - parentPosition.y;
					return { x: xPosition, y: yPosition };
				},
				 
				 // Thanks Kirupa Chinnathambi!
				// http://www.kirupa.com/html5/getting_mouse_click_position.htm
				getPosition: function(element) {
					var xPosition = 0;
					var yPosition = 0;
					  
					while (element) {
						xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
						yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
						element = element.offsetParent;
					}
					return { x: xPosition, y: yPosition };
				}
			}
		};

		/*
		 *	Post-definition (runtime) calls. For the _init() function to "auto" load...
		 */
		var init = function(){cashmusic._init(cashmusic);}; // function traps cashmusic in a closure
		cashmusic.contentLoaded(init);
	}

	/*
	 *	return the main object in case it's called into a different scope
	 */
	return cashmusic;

}());