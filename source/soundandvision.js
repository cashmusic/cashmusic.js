/**
 * The core soundandvision.js file
 *
 * COMPRESSION SETTINGS
 * YUI compressor with "preserve unnecessary semi-colons" then append a semi-colon to the front to be careful
 *
 * @package soundandvision.org.cashmusic
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
	var soundandvision;
	if (window.soundandvision != null) {
		// if window.soundandvision exists, we just return the current instance
		soundandvision = window.soundandvision;
	} else {
		// no window.soundandvision, so we build and return an object
		soundandvision = {

			_init: function() {
				// load status
				this.hogan = false;
				this.soundmanager = false;
				this.soundplayer = false;

				// storage...basically just a namespace to use as a clipboard between scripts
				this.storage = {};

				// determine file location and path
				this.scriptElement = document.querySelector('script[src=$soundandvision.js');
				if (this.scriptElement) {
					this.path = this.scriptElement.src.replace('soundandvision.js','');
				}

				// links to video sites
				this.storage.embeddableLinks = document.querySelectorAll('a[href*=youtube.com],a[href*=vimeo.com]');
				if (this.storage.embeddableLinks.length > 0) {
					if (!this.hogan) {
						this.getScript(this.path+'/lib/hogan/hogan-2.0.0.min.js',function() {
							// make our nice overlays
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
			 * window.soundandvision.getXHR()
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
			 * window.soundandvision.fadeEffect (object)
			 * Object to provide tweened fades for DOM elements.
			 *
			 * window.soundandvision.fadeEffect.init(id, flag, target)
			 * window.soundandvision.fadeEffect.tween()
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
					this.si = setInterval(function(){window.soundandvision.fadeEffect.tween();}, 20);
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
			 * window.soundandvision.sendXHR(string url, string postString, function successCallback)
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
	soundandvision._init();
	return soundandvision;

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