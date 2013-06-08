/**
 * Front-end/UI for SoundManager2, global progress events and animations
 *
 * COMPRESSION SETTINGS
 * http://closure-compiler.appspot.com/
 * Closure compiler, SIMPLE MODE, then append a semi-colon to the front to be careful
 *
 * PUBLIC-ISH FUNCTIONS
 * window.cashmusic.lightbox.injectIframe(url url)
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

(function() {
	'use strict';
	var cm = window.cashmusic;
	cm.soundplayer = false;

	// Thanks Kirupa Chinnathambi!
	// http://www.kirupa.com/html5/getting_mouse_click_position.htm
	cm.measure.getClickPosition = function(e) {
		var parentPosition = cm.measure.getPosition(e.currentTarget);
		var xPosition = e.clientX - parentPosition.x;
		var yPosition = e.clientY - parentPosition.y;
		return { x: xPosition, y: yPosition };
	};

	// Thanks Kirupa Chinnathambi!
	// http://www.kirupa.com/html5/getting_mouse_click_position.htm
	cm.measure.getPosition = function(element) {
		var xPosition = 0;
		var yPosition = 0;
		  
		while (element) {
			xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
			yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
			element = element.offsetParent;
		}
		return { x: xPosition, y: yPosition };
	};

	window.SM2_DEFER = true;
	cm.loadScript(cm.path+'lib/soundmanager/soundmanager2.js', function() {
		cm.soundplayer = {
			sound: false,
			player: soundManager
		};
		var self = cm.soundplayer;
		window.soundManager = new SoundManager();
		soundManager.setup({
			url: cm.path+'lib/soundmanager/swf/',
			flashVersion: 9,
			onready: function() {
				// soundManager.createSound() etc. here
				soundManager.createSound({
					url: 'http://s3.amazonaws.com/cash_users/throwingmuses/demos/Film_128.mp3',
					autoPlay: true
				});
			},
			ontimeout: function(status) {
				console.log('SM2 failed to start. Flash missing, blocked or security error?');
				console.log('Trying: ' + soundManager.url);
			},
			defaultOptions: {
				// set global default volume for all sound objects
				// onload: function() {
				//	self._doResume({id: this.id});
				// },
				// onstop: function() {
				//	self._doStop({id: this.id});
				// },
				onfinish: function() {
					self._doFinish({id: this.id});
				},
				onpause: function() {
					self._doPause({id: this.id});
				},
				onplay: function() {
					self._doPlay({id: this.id});
				},
				onresume: function() {
					self._doResume({id: this.id});
				},
				stream: true,
				usePolicyFile: true,
				volume: 100,
				whileloading: function() {
					self._doLoading({
						id: this.id,
						loaded: this.bytesLoaded,
						total: this.bytesTotal,
						percentage: Math.round((this.bytesLoaded / this.bytesTotal) * 1000) / 10
					});
				},
				whileplaying: function() {
					var p = Math.round((this.position / this.duration) * 1000) / 10;
					if (this.readyState = 1) {
						p = Math.round(p * (this.bytesLoaded / this.bytesTotal));
					}
					self._doPlaying({
						id: this.id,
						position: this.position,
						duration: this.duration,
						percentage: p
					});
				}
			}
		});
		soundManager.beginDelayedInit();





		self.nextSound = function() {

		};

		self.pauseSound = function() {

		};

		self.playSound = function() {

		};

		self.previousSound = function() {

		};





		self._doFinish = function(detail) {

		};

		self._doLoading = function(detail) {
			console.log('loading: ' + detail.percentage + '%');
		};

		self._doPause = function(detail) {

		};

		self._doPlay = function(detail) {

		};

		self._doPlaying = function(detail) {
			console.log('playing: ' + detail.percentage + '% / (' + detail.position + '/' + detail.duration + ')');
		};

		self._doResume = function(detail) {

		};





		self._updateTweens = function() {

		};
	});
}());