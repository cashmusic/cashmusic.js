/**
 * The core cashmusic.js file
 *
 * COMPRESSION SETTINGS
 * http://closure-compiler.appspot.com/
 * Closure compiler, SIMPLE MODE, then append a semi-colon to the front to be careful
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
			embeds: [],
			loaded: false,
			soundplayer: false,
			lightbox: false,
			options:'',
			path:'',
			templates: {},

			_init: function() {
				var self = window.cashmusic;

				// determine file location and path
				self.scriptElement = document.querySelector('script[src$="cashmusic.js"]');
				if (self.scriptElement) {
					// chop off last 12 characters for 'cashmusic.js' -- not just a replace in case
					// a directory is actually named 'cashmusic.js'
					self.path = self.scriptElement.src.substr(0,self.scriptElement.src.length-12); 
				}
				self.options = String(self.scriptElement.getAttribute('data-options'));

				/*
				 // commented out the alternative json_parse library
				if (typeof JSON.parse !== 'function') {
					self.loadScript(self.path+'lib/json_parse.js');
				}
				*/

				// check lightbox options
				if (this.options.indexOf('lightboxvideo') !== -1) {
					// load lightbox.js
					self.loadScript(self.path+'lightbox/lightbox.js');
				}
				
				// look for .cashmusic.soundplayer divs/links
				var soundTest = document.querySelectorAll('a.cashmusic.soundplayer,div.cashmusic.soundplayer');
				if (soundTest.length > 0) {
					self.loadScript(self.path+'soundplayer/soundplayer.js');
				}

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
			 * window.cashmusic.embed(string endPoint, string/int elementId, bool lightboxed, bool lightboxTxt)
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
			embed: function(endPoint, elementId, lightboxed, lightboxTxt, position, targetNode, cssOveride) {
				// Allow for a single object to be passed instead of all arguments
				// object properties should be lowercase versions of the standard arguments, any order
				if (typeof endPoint === 'object') {
					elementId   = endPoint.elementid ? endPoint.elementid : false;
					lightboxed  = endPoint.lightboxed ? endPoint.lightboxed : false;
					lightboxTxt = endPoint.lightboxtxt ? endPoint.lightboxtxt : false;
					position    = endPoint.position ? endPoint.position : false;
					targetNode  = endPoint.targetnode ? endPoint.targetnode : false;
					cssOveride  = endPoint.cssoveride ? endPoint.cssoveride : false;
					endPoint   = endPoint.endpoint;
				}
				var cm = window.cashmusic;
				var embedURL = endPoint.replace(/\/$/, '') + '/request/embed/' + elementId + '/location/' + encodeURIComponent(window.location.href.replace(/\//g,'!slash!'));
				var iframe = document.createElement('iframe');
					iframe.src = embedURL;
					iframe.style.width = '100%';
					//iframe.style.height = '1px';
					iframe.style.border = '0';
					iframe.style.overflow = 'hidden'; // important for overlays, which flicker scrollbars on open
				if (targetNode) {
					// for AJAX, specify target node: '#id', '#id .class', etc. NEEDS to be specific
					var currentNode = document.querySelector(targetNode);
				} else {
					// if used non-AJAX we just grab the current place in the doc
					// because we're running as the document is loading in a blocking fashion, the 
					// last script element will be the current script asset. 
					var allScripts = document.querySelectorAll('script');
					var currentNode = allScripts[allScripts.length - 1];
				}
				// be nice neighbors. if we can't find currentNode, don't do the rest or pitch errors. silently fail.
				if (currentNode) {
					if (lightboxed) {
						// create a div to contain the link/iframe
						var embedNode = document.createElement('span');
						embedNode.className = 'cashmusic embed';
						embedNode.style.position = 'relative';
						cm.contentLoaded(function() {
							// open in a lightbox with a link in the target div
							if (!lightboxTxt) {lightboxTxt = 'open element';}
							cm.overlay.create(function() {
								var a = document.createElement('a');
									a.href = embedURL;
									a.target = '_blank';
									a.innerHTML = lightboxTxt;
								embedNode.appendChild(a);
								currentNode.parentNode.insertBefore(embedNode,currentNode);
								(function(position) {
									if (typeof position !== 'object') {
										position = {
											'top':'40px',
											'left':'30%',
											'width':'40%',
											'marginLeft':'0'
										}
									}
									cm.events.add(a,'click',function(e) {
										// top, left, width, marginLeft
										cm.overlay.resize(position.top,position.left,position.width,position.marginLeft);
										cm.overlay.content.appendChild(iframe);
										window.cashmusic.fader.init(cm.overlay.bg, 100);
										e.preventDefault();
										return false;
									});
								})(position);
							});
						});
					} else {
						// create a div to contain the link/iframe
						var embedNode = document.createElement('div');
						embedNode.className = 'cashmusic embed';
						embedNode.style.position = 'relative';
						embedNode.appendChild(iframe);
						currentNode.parentNode.insertBefore(embedNode,currentNode);
					}

					cm.embeds.push({el:iframe,id:elementId});

					if (cm.embeds.length === 1) {
					//cm.contentLoaded(function() {
						// using messages passed between the request and this script to resize the iframe
						cm.events.add(window,'message',function(e) {
							// look for cashmusic_embed...if not then we don't care
							if (e.data.substring(0,15) == 'cashmusic_embed') {
								var a = e.data.split('_');
								// run through embeds and match the id
								for (var i=0;i<cm.embeds.length;i++) {
									if (cm.embeds[i].id == a[2]) {
										cm.embeds[i].el.height = a[3];
										cm.embeds[i].el.style.height = a[3] + 'px';
									}
								}
							}
						});
					//});
					}
				}
			},

			getJSON: function(txt) {
				/*
				 // commented out the alternative json_parse library
				var obj;
				if (typeof JSON.parse === 'function') {
					obj = JSON.parse(txt);
				} else {
					obj = json_parse(txt);
				}
				return obj;
				*/
				return JSON.parse(txt);
			},

			getTemplate: function(templateName,successCallback) {
				var cm = window.cashmusic;
				var templates = cm.templates;
				if (templates[templateName] !== undefined) {
					successCallback(templates[templateName]);
				} else {
					this.ajax.send(
						cm.path + 'templates/' + templateName + '.html',
						false,
						function(msg) {
							templates[templateName] = msg;
							successCallback(msg);
						}
					);
					this.ajax.send(
						// look for matching CSS file and add that to the head if found
						// this *only happens once* on purpose — callback won't happen if
						// we get a 404, so this is an easy test for file existence
						cm.path + 'templates/' + templateName + '.css',
						false,
						function(msg) {
							cm.styles.injectCSS(msg);
						}
					)
				}
			},

			// stolen from jQuery
			loadScript: function(url,callback) {
				var test = document.querySelectorAll('a[src="' + url + '"]');
				if (test.length > 0) {
					if (typeof callback === 'function') {
						callback();
					}
				} else {
					var head = document.getElementsByTagName('head')[0] || document.documentElement;
					var script = document.createElement('script');
					script.src = url;

					// Handle Script loading
					var done = false;

					// Attach handlers for all browsers
					script.onload = script.onreadystatechange = function() {
						if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
							done = true;
							if (typeof callback === 'function') {
								callback();
							}
							
							// Handle memory leak in IE
							script.onload = script.onreadystatechange = null;
							if (head && script.parentNode) {head.removeChild(script);}
						}
					};
					head.insertBefore( script, head.firstChild );
				}
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

				jsonp: function(url,variable) {
					var s = document.createElement('script');
					s.src = url;
					document.getElementsByTagName('head')[0].appendChild(s);
					return variable;
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

			/***************************************************************************************
			 *
			 * window.cashmusic.measure (object)
			 * Basic window/element measurements
			 *
			 * PUBLIC-ISH FUNCTIONS
			 * window.cashmusic.measure.viewport()
			 * window.cashmusic.measure.getClickPosition(event e)
			 *
			 ***************************************************************************************/
			measure: {
				viewport: function() {
					return {
						x: document.body.offsetWidth || window.innerWidth || 0,
						y: document.body.offsetHeight || window.innerHeight || 0
					};
				}
			},

			/***************************************************************************************
			 *
			 * window.cashmusic.overlay (object)
			 * Building the actual lightbox bits
			 *
			 * PUBLIC-ISH FUNCTIONS
			 * window.cashmusic.overlay.create(function callback)
			 * window.cashmusic.overlay.resize(string top,string left,string width,string marginLeft)
			 *
			 ***************************************************************************************/
			overlay: {
				bg: false,
				content: false,
				total: 0,
				callbacks: [],

				create: function(callback) {
					var cm = window.cashmusic;
					var self = cm.overlay;
					if (self.bg === false) {
						self.total++;
						if (typeof callback === 'function') {
							self.callbacks.push(callback);
						}
						if (self.total == 1) {
							cm.getTemplate('overlay',function(t) {
								var tmpDiv = document.createElement('div');
								tmpDiv.innerHTML = t;
								self.bg = tmpDiv.firstChild;
								self.bg.style.display = 'none';
								document.body.appendChild(self.bg);
								tmpDiv = null;
								var divs = self.bg.getElementsByTagName('div');
								self.content = divs[0];
								cm.events.add(window,'keyup', function(e) { 
									if (e.keyCode == 27) {
										if (self.bg.style.display = 'block') {
											// hide all the overlays if they're visible
											cm.fader.hide(self.bg);
											self.content.innerHTML = '';
										}
									} 
								});
								cm.events.add(self.bg,'click', function(e) { 
									if(e.target === this) {
										cm.fader.hide(self.bg);
										self.content.innerHTML = '';
									}
								});
								for (var i = 0; i < self.callbacks.length; i++) {
									self.callbacks[i]();
								};
							});
						}
					} else {
						callback();
					}
				},

				resize: function(top,left,width,marginLeft) {
					var cs = window.cashmusic.overlay.content.style;
					cs.top = top;
					cs.left = left;
					cs.width = width;
					cs.marginLeft = marginLeft;
				}
			},

			styles: {
				addClass: function(el,classname) {
					el.className = el.className + ' ' + classname;
				},

				hasClass: function(el,classname) {
					// borrowed the idea from http://stackoverflow.com/a/5898748/1964808
    				return (' ' + el.className + ' ').indexOf(' ' + classname + ' ') > -1;
				},

				injectCSS: function(css) {
					var head = document.getElementsByTagName('head')[0] || document.documentElement;
					var el = document.createElement('style');
					el.type = 'text/css';
					el.innerHTML = css;

					// by injecting the css BEFORE any other style elements it means all
					// styles can be manually overridden with ease — no !important or similar,
					// no external files, etc...
					head.insertBefore(el, head.firstChild);
				},

				swapClasses: function(el,oldclass,newclass) {
					// add spaces to ensure we're not doing a partial find/replace, 
					// trim off extra spaces before setting
					el.className = ((' ' + el.className + ' ').replace(' ' + oldclass + ' ',' ' + newclass + ' ')).replace(/^\s+/, '').replace(/\s+$/, '');
				}
			}
		};

		/*
		 *	Post-definition (runtime) calls. For the _init() function to "auto" load...
		 */
		var init = function(){cashmusic._init(cashmusic);}; // function traps cashmusic in a closure
		cashmusic.contentLoaded(init); // loads only after the page is complete
	}

	/*
	 *	return the main object in case it's called into a different scope
	 */
	return cashmusic;

}());