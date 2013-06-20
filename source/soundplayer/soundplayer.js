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

	// Thanks Kirupa Chinnathambi!
	// http://www.kirupa.com/html5/getting_mouse_click_position.htm
	cm.measure.getClickPosition = function(e) {
		var parentPosition = cm.measure.getPosition(e.currentTarget);
		var xPosition = e.clientX - parentPosition.x;
		var yPosition = e.clientY - parentPosition.y;
		var percent = xPosition / e.currentTarget.clientWidth;
		return { x: xPosition, y: yPosition, percentage: percent };
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

	// we need indexOf for the sake of figuring out if an id is part of a 
	// larger playlist. IE8 is an asshole. so here goes.
	// http://stackoverflow.com/a/1181586/1964808
	if(!Array.prototype.indexOf) {
		Array.prototype.indexOf = function(needle) {
			for(var i = 0; i < this.length; i++) {
				if(this[i] === needle) {
					return i;
				}
			}
			return -1;
		};
	}

	cm.soundplayer = {
		playlist: false,
		playlists: {},
		sound: false,

		_init: function() {
			var self = cm.soundplayer;

			// build any actualy players, etc
			var playlistdivs = document.querySelectorAll('div.cashmusic.soundplayer.playlist');
			len = playlistdivs.length;
			if (len > 0) {
				for (var i=0;i<len;i++) {
					var d = playlistdivs[i];
					var pl = cm.getJSON(d.getAttribute('data-playlist'));
					pl = self._formatPlaylist(pl,d.id,i);
					d.id = d.id ? d.id : pl.id;

					var soundlinks = document.querySelectorAll(
						'#' + d.id + ' ' + 'a[href$=".mp3"],' +
						'#' + d.id + ' ' + 'a[href$=".MP3"],' +
						'#' + d.id + ' ' + 'a[href$=".ogg"],' +
						'#' + d.id + ' ' + 'a[href$=".OGG"],' +
						'#' + d.id + ' ' + 'a[href$=".m4a"],' +
						'#' + d.id + ' ' + 'a[href$=".M4A"],' +
						'#' + d.id + ' ' + 'a[href$=".wav"],' +
						'#' + d.id + ' ' + 'a[href$=".WAV"]'
					);
					var sllen = soundlinks.length;
					for (var n=0;n<sllen;n++) {
						var sl = soundlinks[n];
						pl.tracks.push(self._formatTrack(sl,pl.id));
						sl.parentNode.removeChild(sl);
					}

					var tlol = '<ol>';
					sllen = pl.tracks.length;
					for (var n=0;n<sllen;n++) {
						pl._index.push(pl.tracks[n].id);
						soundManager.createSound({
							id: pl.tracks[n].id,
							url: pl.tracks[n].url
						});
						tlol += ('<li class="cashmusic soundplayer changetrack" data-track="' + (n+1) + '">' + pl.tracks[n].title + '</li>');
					}
					tlol += '</ol>';
					
					self.playlists[pl.id] = pl;

					(function(container,playlist,ol) {
						cm.getTemplate('soundplayer',function(t) {
							t = t.replace(/data-playerid=\"/g,'data-playerid="' + playlist.id);
							t = t.replace(/onPlayer\":\"/g,'onPlayer":"' + playlist.id);
							container.innerHTML = t;
							container.style.visibility = 'visible';
							container.style.display = 'block';
							container.style.position = 'relative';

							// add the genrated <ol> from above
							var tl = document.querySelectorAll(
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.tracklist'
							);
							if (tl[0] !== 'undefined') {
								tl[0].innerHTML = ol;
							}

							// pull desired starter content from template, insert it
							var docontent = document.querySelectorAll(
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.nowplaying, ' + 
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.playtime, ' + 
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.toggletracklist'
							);
							var l = docontent.length;
							for (var li=0;li<l;li++) {
								docontent[li].innerHTML = docontent[li].getAttribute('data-content') + '';
							}

							// add controller events
							var controls = document.querySelectorAll(
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.controls *, ' +
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.toggletracklist, ' +
								'#' + container.id + ' li.cashmusic.soundplayer.changetrack'
							);
							var l = controls.length;
							for (var li=0;li<l;li++) {
								var el = controls[li];
								if (cm.styles.hasClass(el,'playpause')) {
									cm.events.add(el,'click',function(e) {
										self.togglePlaylist(playlist.id);
									});
								}
								if (cm.styles.hasClass(el,'nexttrack')) {
									cm.events.add(el,'click',function(e) {
										self.next(playlist.id,true);
									});
								}
								if (cm.styles.hasClass(el,'prevtrack')) {
									cm.events.add(el,'click',function(e) {
										self.previous(playlist.id);
									});
								}
								if (cm.styles.hasClass(el,'toggletracklist')) {
									cm.events.add(el,'click',function(e) {
										var tracklist = document.querySelectorAll(
											'#' + container.id + ' div.cashmusic.soundplayer.playlist.tracklist'
										);
										var style = tracklist[0].style;
										if (style !== 'undefined') {
											if (style.height !== 'auto') {
												style.height = 'auto';
											} else {
												style.height = '1px';
											}
										}
										el.blur();
									});
								}
								if (cm.styles.hasClass(el,'changetrack')) {
									cm.events.add(el,'click',function(e) {
										var track = e.currentTarget.getAttribute('data-track');
										self.playlistPlayTrack(playlist.id,track);
									});
								}
							}

							// add seekbar control
							controls = document.querySelectorAll(
								'#' + container.id + ' div.cashmusic.soundplayer.playlist.seekbar'
							);
							var l = controls.length;
							for (var li=0;li<l;li++) {
								cm.events.add(controls[li],'click',function(e) {
									self.seek(cm.measure.getClickPosition(e).percentage,playlist.id);
								});
							}
						});
					})(d,pl,tlol); // ha. closures look silly.
				}
			}

			// look for .cashmusic.soundplayer toggle/inline links
			var inlineLinks = document.querySelectorAll('*.cashmusic.soundplayer.playstop,a.cashmusic.soundplayer.inline');
			var len = inlineLinks.length;
			if (len > 0) {
				cm.styles.injectCSS(
					'a.cashmusic.soundplayer.inline.stopped:after{content: " [▸]";}' +
					'a.cashmusic.soundplayer.inline.playing:after{content: " [■]";}'
				);

				for (var i=0;i<len;i++) {
					var a = inlineLinks[i];
					soundManager.createSound({
						id: a.href,
						url: a.href
					});
					cm.styles.addClass(a,'stopped');
					cm.events.add(a,'click',function(e) {
						if (cm.styles.hasClass(a,'playstop')) {
							var s = soundManager.getSoundById(a.getAttribute('data-soundid'));
						} else {
							var s = soundManager.getSoundById(a.href);
						}
						if (s) {
							self.toggle(s.id,true);
							
							e.preventDefault();
							return false;
						}
					});
				}
			}

			// look for .cashmusic.soundplayer play/pause toggles
			var playpause = document.querySelectorAll('*.cashmusic.soundplayer.playpause');
			len = playpause.length;
			if (len > 0) {
				for (var i=0;i<len;i++) {
					var pp = playpause[i];

					cm.styles.addClass(pp,'paused');
					var soundid = pp.getAttribute('data-soundid');
					var playerid = pp.getAttribute('data-playerid');
					if (playerid) {
						cm.events.add(pp,'click',function(e) {
							self.togglePlaylist(playerid);
							e.preventDefault();
							return false;
						});
					} else {
						cm.events.add(pp,'click',function(e) {

							self.toggle(e.currentTarget.getAttribute('data-soundid'));
							e.preventDefault();
							return false;
						});
					}
				}
			}
			//*/
		}
	};

	window.SM2_DEFER = true;
	cm.loadScript(cm.path+'lib/soundmanager/soundmanager2.js', function() {
		var self = cm.soundplayer;
		window.soundManager = new SoundManager();
		soundManager.setup({
			url: cm.path+'lib/soundmanager/swf/',
			flashVersion: 9,
			flashLoadTimeout: 7500,
			flashPollingInterval:30,
			html5PollingInterval:30,
			useHighPerformance:true,
			onready: function() {
				self._init();
			},
			// ontimeout: function(status) {
			// 	console.log('SM2 failed to start. Flash missing, blocked or security error?');
			// 	console.log('Trying: ' + soundManager.url);
			// },
			defaultOptions: {
				onload: function() {
				 	self._doLoad({id: this.id});
				},
				onstop: function() {
					self._doStop({id: this.id});
				},
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
					var p = Math.round((this.position / this.duration) * 10000) / 100;
					//if (this.readyState = 1) {
						//p = Math.round(p * (this.bytesLoaded / this.bytesTotal));
					//}
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





		// All of the querySelectorAll calls seem excessive, but we should respect the idea of 
		// dynamic DOM injection, AJAX, etc. Also these are mostly user-initiated so not often on
		// a hundreds-per-second scale.
		self._doFinish = function(detail) {
			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'finish');
			self.next();
		};

		self._doLoad = function(detail) {
			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'load');
		};

		self._doLoading = function(detail) {
			//console.log('loading: ' + detail.percentage + '%');
			var tweens = document.querySelectorAll('*.cashmusic.tween');
			self._updateTweens(tweens,'load',detail.percentage);
		};

		self._doPause = function(detail) {
			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'pause');
		};

		self._doPlay = function(detail) {
			// deal with inline buttons
			var inlineLinks = document.querySelectorAll('a.cashmusic.soundplayer[href="' + self.sound.id + '"]');
			if (inlineLinks.length > 0) {
				var iLen = inlineLinks.length;
				for (var i=0;i<iLen;i++) {
					cm.styles.swapClasses(inlineLinks[i],'stopped','playing');
				}
			}

			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'play');
		};

		self._doPlaying = function(detail) {
			//console.log('playing: ' + detail.percentage + '% / (' + detail.position + '/' + detail.duration + ')');
			var tweens = document.querySelectorAll('*.cashmusic.tween');
			self._updateTweens(tweens,'play',detail.percentage);
			self._updateTimes(detail.percentage);
		};

		self._doResume = function(detail) {
			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'resume');
		};

		self._doStop = function(id) {
			// deal with inline buttons
			var inlineLinks = document.querySelectorAll('a.cashmusic.soundplayer[href="' + id + '"]');
			if (inlineLinks.length > 0) {
				var iLen = inlineLinks.length;
				for (var i=0;i<iLen;i++) {
					cm.styles.swapClasses(inlineLinks[i],'playing','stopped');
				}
			}

			var setstyles = document.querySelectorAll('*.cashmusic.setstyles');
			self._updateStyles(setstyles,'stop');
		};





		/*
			
		*/

		self.pause = function() {
			if (self.sound) {
				self.sound.pause();
			}
		};

		self.play = function() {
			if (self.sound) {
				self.sound.play();
			}
		};

		self.resume = function() {
			if (self.sound) {
				if (self.sound.paused) {
					self.sound.resume();
				}
			}
		};

		self.seek = function(position,playlistId) {
			if (playlistId) {
				if (!self.playlist) {
					return false;
				} else {
					if (playlistId !== self.playlist.id) return false;
				}
				self.sound.setPosition(Math.floor(position * self.sound.duration));
			}
		};

		self.stop = function() {
			if (self.sound) {
				self.pause();
				self.sound.setPosition(0);
				self._doStop(self.sound.id);
			}
		};

		// id is optional to also enable play...
		self.toggle = function(id,usestop) {
			var action = usestop ? self.stop : self.pause;
			if (self.sound.id !== id) {
				action();
				self.sound = soundManager.getSoundById(id);				
			}
			if (usestop && !self.sound.paused && self.sound.playState != 0) {
				self.stop();
			} else {
				self.sound.togglePause();
			}
			self._updateTitle();
		};



		self.next = function(playlistId,force) {
			self.loadPlaylist(playlistId);
			var next = false;
			var play = false;
			var pl = self.playlist;
			if (pl) {
				if (pl.current < pl.tracks.length) {
					next = parseInt(pl.current) + 1;
					play = true;
				} else {
					next = 1;
					if (force) play = true;
				}
				pl.current = next;
			}
			if (play) {

				self.playlistPlayTrack(pl.id,next);
			}
		};

		self.previous = function(playlistId) {
			self.loadPlaylist(playlistId);
			var next = false;
			var pl = self.playlist;
			if (pl) {
				if (pl.current > 1) {
					next = parseInt(pl.current) - 1;
				} else {
					next = pl.tracks.length;
				}
				pl.current = next;
				self.playlistPlayTrack(pl.id,next);
			}
		};

		self.togglePlaylist = function(id) {
			self.loadPlaylist(id);
			self.toggle(self.playlist.tracks[self.playlist.current - 1].id);
		};

		self.playlistPlayTrack = function(id,track) {
			self.loadPlaylist(id);
			self.stop();
			self.playlist.current = track;
			self.toggle(self.playlist.tracks[track - 1].id);
		};

		self.loadPlaylist = function(id) {
			if (self.sound && self.playlist) {
				if (self.playlist.id != id) self.pause();
			}
			if (self.sound && !self.playlist) self.stop();
			self.playlist = self.playlists[id];
		}




		self._checkIds = function(id,data) {
			var soundId = '';
			var playerId = '';
			// get any required sound/player ids
			if (typeof data.onSound !== 'undefined') soundId = data.onSound;
			if (typeof data.onPlayer !== 'undefined') playerId = data.onPlayer;
			
			if (soundId) {
				if (id.indexOf(soundId) === -1) return false;
			}
			if (playerId) {
				if (!self.inPlaylist(playerId,id)) return false;
			}

			return true;
		};

		/*
		fires on progress for: play, load 

		{
			"play":[
				{
					"name":"left",
					"startAt":0,
					"endAt":50,
					"startVal":0,
					"endVal":250,
					"units":"px",
					"onSound":"url",
					"onPlayer":"playerId"
				}
			],
			"load":[
				{
					"name":"left",
					"startAt":0,
					"endAt":50,
					"startVal":0,
					"endVal":250,
					"units":"px"
				}
			]
		}
		*/
		self._updateTweens = function(elements,type,percentage) {
			var eLen = elements.length;
			for (var i=0;i<eLen;i++) {
				var el = elements[i];
				var data = el.getAttribute('data-tween');
				data = cm.getJSON(data);
				if (data) {
					if (typeof data[type] !== 'undefined') {
						var dLen = data[type].length;
						var val = false;
						var step = false
						for (var n=0;n<dLen;n++) {
							step = data[type][n];
							if (self._checkIds(self.sound.id,step)) {
								if (percentage >= step.startAt && percentage <= step.endAt) {
									// starting value + ((total value range / total percentage span) * true percentage - startAt percentage)
									val = step.startVal + (((step.endVal - step.startVal) / (step.endAt - step.startAt)) * (percentage - step.startAt));
									if (step.units == 'px') {
										val = Math.floor(val); // round pixels to save CPU
									} else {
										val = val.toFixed(2); // percentage, etc need 2 points for better positioning
									}
									el.style[step.name] = val + step.units;
								}
							}
						}
					}
				}
			}
		};

		/*
		fires on events for: finish, pause, play, resume, stop

		{
			"stop":[
				{
					"name":"left",
					"val":250,
					"units":"px",
					"onSound":"url",
					"onPlayer":"playerId"
				}
			]
		}
		*/
		self._updateStyles = function(elements,type) {
			var eLen = elements.length;
			for (var i=0;i<eLen;i++) {
				var el = elements[i];
				var data = el.getAttribute('data-styles');
				data = JSON.parse(data);
				if (data) {
					if (typeof data[type] !== 'undefined') {
						var dLen = data[type].length;
						for (var n=0;n<dLen;n++) {
							if (self._checkIds(self.sound.id,data[type][n])) {
								el.style[data[type][n].name] = data[type][n].val + data[type][n].units;
							}
						}
					}
				}
			}
		};

		self._updateTimes = function(position) {
			if (self.playlist) {
				var times = document.querySelectorAll('div.cashmusic.soundplayer.playlist.playtime');
				var l = times.length;
				for (var n=0;n<l;n++) {
					if (times[n].getAttribute('data-playerid') == self.playlist.id) {
						var min = Math.floor(position/60);
						var sec = Math.floor(position - (min * 60));
						if (!isNaN(min) && !isNaN(sec)) {
							sec = (sec < 10 ? '0' : '') + sec; // zero pad the seconds
							times[n].innerHTML = min + ':' + sec;
						}
					}
				}
			}
		}

		self._updateTitle = function() {
			if (self.playlist) {
				var titles = document.querySelectorAll('div.cashmusic.soundplayer.playlist.nowplaying');
				var l = titles.length;
				for (var n=0;n<l;n++) {
					if (titles[n].getAttribute('data-playerid') == self.playlist.id) {
						titles[n].innerHTML = self.playlist.tracks[self.playlist.current - 1].title;
					}
				}
			}
		}





		/*
		playlist:
		{
			id: string,
			current: int (tracknumber) / null,
			artist: string / null,
			album: string / null,
			cover: url / null,
			url: url / null,
			options: null,
			tracks: [
				{
					id: string,
					url: url,
					title: string,
					artist: string,
					ISRC: string,
					album: string,
					label: string,
					cover: url,
					link: url,
					resolve: bool
				}
			]
		}
		*/
		self._formatPlaylist = function(playlist,useid,uniqueseed) {
			playlist = playlist ? playlist : {};
			if (!playlist.id) {
				playlist.id = useid ? useid : 'pl---' + uniqueseed; // the 'pl---' is unusual on purpose
			}
			playlist.current = 1;//int (tracknumber) / null
			playlist.tracks = playlist.tracks ? playlist.tracks : [];// []
			playlist._index = [];

			return playlist;
		};

		self._formatTrack = function(a,playlist) {
			var track = cm.getJSON(a.getAttribute('data-track'));
			track = track ? track : {};
			track.url = track.url ? track.url : a.href;
			track.title = track.title ? track.title : (a.innerText || a.textContent);
			track.id = playlist + track.url;

			return track;
		};

		self.inPlaylist = function(playlistid,soundid) {
			if (playlistid) {
				return (self.playlists[playlistid]._index.indexOf(soundid) > -1) ? true : false;
			} else {
				return false;
			}
		};
	});
}());