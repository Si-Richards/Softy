/*!
 *  Copyright (c) 2016, Meetecho S.r.l.
 *  All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without modification,
 *  are permitted provided that the following conditions are met:
 *
 *  1. Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *
 *  2. Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 *  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 *  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 *  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
 *  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED
 *  OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 /*!
 *  Modified work Copyright (c) 2021, Tony Capobianco
 */

if(typeof jQuery === 'undefined') {
	throw new Error('Missing dependency: jQuery. Should be loaded before janus.js.');
}

/* global jQuery */
var Janus = {
	version: 0.9,
	useDefaultDependencies: true,
	debug: false,
	iceServers: [],
	// Those are strings, you can override them when using setI18N
	i18n: {
		'Initializing media sources': 'Initializing media sources',
		'WebRTC error: ': 'WebRTC error: '
	},
	noop: function() {}
};

Janus.init = function(options) {
	options = options || {};
	if(Janus.initDone === true) {
		// Already initialized
		if(options.callback !== undefined && options.callback !== null)
			options.callback();
		return;
	}
	Janus.initDone = true;
	Janus.options = options;
	Janus.useDefaultDependencies = (options.dependencies === undefined || options.dependencies === null) ? true : options.dependencies.useDefaultDependencies;
	if(options.debug !== undefined && options.debug !== null)
		Janus.debug = options.debug === "all" ? true : options.debug;
	Janus.promise = options.promise;
	if(options.callback !== undefined && options.callback !== null) {
		// This is a legacy usage: translate the callback in a Promise
		Janus.promise = new Promise(function(resolve, reject) {
			Janus.callback = function() {
				resolve();
			};
			Janus.error = function(cause) {
				reject(cause);
			};
		});
	}
	if(!options.promise) {
		Janus.promise = Promise.resolve();
	}
	Janus.i18n = Object.assign({}, Janus.i18n, options.i18n);
	if(Janus.useDefaultDependencies) {
		// Load all dependencies
		if(typeof webrtcAdapter === 'undefined') {
			var adapterUrl = 'https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/8.1.0/adapter.min.js';
			if(options.adapterjs !== undefined && options.adapterjs !== null) {
				// Use provided URL
				adapterUrl = options.adapterjs;
			}
			var script = document.createElement("script");
			script.type = "text/javascript";
			script.src = adapterUrl;
			document.head.appendChild(script);
		}
		if(!('WebSocket' in window)) {
			// Create the object (as members of the window namespace)
			// in a try-catch block, since some browsers will only allow
			// this if the user has explicitly enabled it.
			try {
				window.WebSocket = window.MozWebSocket || require('websocket').w3cwebsocket;
				if(!window.WebSocket) {
					Janus.error("No WebSockets support...");
					return;
				}
			} catch(e) {
				Janus.error("No WebSockets support...");
				return;
			}
		}
	} else {
		// Check dependencies
		if(typeof webrtcAdapter === 'undefined') {
			Janus.error("Missing dependency: webrtc-adapter.js");
			return;
		}
		if(!('WebSocket' in window)) {
			Janus.error("Missing dependency: WebSockets");
			return;
		}
	}
	Janus.mediaDevices = {
		// Those are strings, you can override them when using setI18N
		i18n: {
			'Initializing media sources': Janus.i18n['Initializing media sources'],
			'WebRTC error: ': Janus.i18n['WebRTC error: ']
		}
	};
	Janus.mediaDevices.init(options);
	Janus.log("Initialized Janus " + Janus.version + " with adapter.js " + webrtcAdapter.browserDetails.browser + " " + webrtcAdapter.browserDetails.version);
	// Attach console debuggers
	if(Janus.debug === true || Janus.debug === "all") {
		Janus.attachConsole();
	}
	if(options.callback !== undefined && options.callback !== null) {
		options.callback();
	}
	return Janus.promise;
};

Janus.attachConsole = function() {
	Janus.log = function(msg) {
		console.info(msg);
	};
	Janus.warn = function(msg) {
		console.warn(msg);
	};
	Janus.error = function(msg) {
		console.error(msg);
	};
};

Janus.getId = function() {
	var s4 = function() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

Janus.randomString = function(len) {
	charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var randomString = '';
	for (var i = 0; i < len; i++) {
		var randomPoz = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(randomPoz,randomPoz+1);
	}
	return randomString;
}

Janus.useOldJanus = function(server, callbacks) {
	/*
	 * Checks whether the specified Janus URL refers to an older version
	 * of the Janus Gateway (pre-0.2.0). If that's the case, the
	 * onlegacy callback is triggered so that the user can be warned.
	 * In case we're not talking to a Janus Gateway, the onerror
	 * callback is triggered.
	 */
	var ws = new WebSocket(server, 'janus-protocol');
	ws.onerror = function() {
		callbacks.onerror(server);
	};
	ws.onopen = function() {
		ws.send(JSON.stringify({
			janus: "version"
		}));
	};
	ws.onmessage = function(event) {
		try {
			var json = JSON.parse(event.data);
			if(json["janus"] != "version") {
				callbacks.onerror(server);
				return;
			}
			var janus_version = parseInt(json["version"]);
			if(janus_version < 2) {
				callbacks.onlegacy(server);
			}
		} catch(e) {
			callbacks.onerror(server);
		}
		ws.close();
	};
};

Janus.longPoll = function(url, callbacks) {
	/*
	 * Performs a long poll to the Janus Gateway.
	 */
	callbacks = callbacks || {};
	var xhr = null;
	var poll = function() {
		xhr = $.ajax({
			url: url,
			async: true,
			cache: false,
			timeout: 60000, // FIXME
			dataType: 'json',
			success: function(json) {
				if(callbacks.success)
					callbacks.success(json);
				Janus.debug("Long poll returned " + JSON.stringify(json));
				poll();
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				if(textStatus !== "timeout") {
					Janus.error("Error contacting Janus: " + textStatus);
				}
				if(callbacks.error)
					callbacks.error(textStatus);
				// FIXME: Resetting the session when a communication error occurs is drastic, but
				// without that, the plugin is unusable. A better approach would be to keep
				// polling while the plugin is in a "reconnecting" state.
				// janus.destroy();
				setTimeout(function() {
					poll();
				}, 1000);
			}
		});
	};
	poll();
	return {
		abort: function() {
			if(xhr)
				xhr.abort();
			xhr = null;
		}
	};
};

Janus.useSIP = function(options) {
	options = options || {};
	options.plugin = "janus.plugin.sip";
	Janus.VideoCall = function(options) {
		Janus.PluginHandle.call(this, options);
		this.offerless = options.offerless;
		this.events = {};
		this.on = function(event, callback) {
			this.events[event] = callback;
			return this;
		};
		this.emit = function(event, data) {
			if (this.events[event]) {
				this.events[event](data);
			}
		};
		this.incoming = function(data) {
			this.emit('incoming', data);
		};
		this.accepted = function(data) {
			this.emit('accepted', data);
		};
		this.hangup = function(data) {
			this.emit('hangup', data);
		};
		this.update = function(data) {
			this.emit('update', data);
		};
		this.iceState = function(data) {
			this.emit('iceState', data);
		};
		this.mediaState = function(data) {
			this.emit('mediaState', data);
		};
		this.webrtcState = function(data) {
			this.emit('webrtcState', data);
		};
		this.slowLink = function(data) {
			this.emit('slowLink', data);
		};
		this.consentDialog = function(data) {
			this.emit('consentDialog', data);
		};
		this.ondataopen = function(data) {
			this.emit('dataopen', data);
		};
		this.ondata = function(data) {
			this.emit('data', data);
		};
		this.onremotestream = function(data) {
			this.emit('remotestream', data);
		};
		this.onlocalstream = function(data) {
			this.emit('localstream', data);
		};
		this.onmessage = function(data) {
			this.emit('message', data);
		};
		this.oncleanup = function(data) {
			this.emit('cleanup', data);
		};
		this.destroy = function(data) {
			this.emit('destroy', data);
		};
		this.register = function(username, display_name, secret, proxy, authtype, extraHeaders) {
			var sipUri = 'sip:' + username + '@' + proxy;
			var register = {
				request: "register",
				username: sipUri,
				display_name: display_name,
				authuser: username,
				secret: secret,
				proxy: 'sip:' + proxy,
				authtype: authtype,
				extraHeaders: extraHeaders
			};
			this.send({
				message: register,
				success: function() {
					Janus.log("SIP registration request sent for " + username + "@" + proxy);
				},
				error: function(error) {
					Janus.warn("Error sending SIP registration: " + error);
				}
			});
		};
		this.call = function(uri, extraHeaders) {
			var video = true;
			var audio = true;
			if (options.media && options.media.video === false) {
				video = false;
			}
			if (options.media && options.media.audio === false) {
				audio = false;
			}
			this.createOffer({
				media: {
					audioRecv: audio,
					videoRecv: video,
					audioSend: audio,
					videoSend: video
				},
				success: function(jsep) {
					Janus.debug("Got SDP " + jsep);
					var call = {
						request: "call",
						uri: uri,
						extraHeaders: extraHeaders
					};
					this.send({
						message: call,
						jsep: jsep,
						success: function() {
							Janus.log("Call " + uri + "...");
						},
						error: function(error) {
							Janus.warn("Error calling " + uri + ": " + error);
						}
					});
				},
				error: function(error) {
					Janus.error("WebRTC error:" + error);
				}
			});
		};
		this.transfer = function(uri) {
			var transfer = {
				request: "transfer",
				uri: uri
			};
			this.send({
				message: transfer,
				success: function() {
					Janus.log("Transfering to " + uri + "...");
				},
				error: function(error) {
					Janus.warn("Error transfering to " + uri + ": " + error);
				}
			});
		};
		this.sendDTMF = function(dtmf) {
			var dtmfMessage = {
				request: "dtmf",
				dtmf: dtmf
			};
			this.send({
				message: dtmfMessage,
				success: function() {
					Janus.log("Sending DTMF " + dtmf + "...");
				},
				error: function(error) {
					Janus.warn("Error sending DTMF " + dtmf + ": " + error);
				}
			});
		};
		this.accept = function(jsep) {
			if (jsep) {
				this.createAnswer({
					jsep: jsep,
					media: {
						audioRecv: true,
						videoRecv: true,
						audioSend: true,
						videoSend: true
					},
					success: function(jsep) {
						Janus.debug("Got SDP " + jsep);
						var accept = {
							request: "accept"
						};
						this.send({
							message: accept,
							jsep: jsep,
							success: function() {
								Janus.log("Accepting ...");
							},
							error: function(error) {
								Janus.warn("Error accepting: " + error);
							}
						});
					},
					error: function(error) {
						Janus.error("WebRTC error:" + error);
					}
				});
			} else {
				var accept = {
					request: "accept"
				};
				this.send({
					message: accept,
					success: function() {
						Janus.log("Accepting ...");
					},
					error: function(error) {
						Janus.warn("Error accepting: " + error);
					}
				});
			}
		};
		this.early = function(jsep) {
			if (jsep) {
				this.handleRemoteJsep({
					jsep: jsep,
					success: function() {
						Janus.log("Early ...");
					},
					error: function(error) {
						Janus.warn("Error early: " + error);
					}
				});
			} else {
				var early = {
					request: "early"
				};
				this.send({
					message: early,
					success: function() {
						Janus.log("Early ...");
					},
					error: function(error) {
						Janus.warn("Error early: " + error);
					}
				});
			}
		};
		this.update = function() {
			this.createOffer({
				media: {
					audioRecv: true,
					videoRecv: true,
					audioSend: true,
					videoSend: true
				},
				success: function(jsep) {
					Janus.debug("Got SDP " + jsep);
					var update = {
						request: "update"
					};
					this.send({
						message: update,
						jsep: jsep,
						success: function() {
							Janus.log("Updating ...");
						},
						error: function(error) {
							Janus.warn("Error updating: " + error);
						}
					});
				},
				error: function(error) {
					Janus.error("WebRTC error:" + error);
				}
			});
		};
		this.hold = function() {
			this.createOffer({
				media: {
					audioRecv: false,
					videoRecv: false,
					audioSend: false,
					videoSend: false
				},
				success: function(jsep) {
					Janus.debug("Got SDP " + jsep);
					var hold = {
						request: "hold"
					};
					this.send({
						message: hold,
						jsep: jsep,
						success: function() {
							Janus.log("Holding ...");
						},
						error: function(error) {
							Janus.warn("Error holding: " + error);
						}
					});
				},
				error: function(error) {
					Janus.error("WebRTC error:" + error);
				}
			});
		};
		this.unhold = function() {
			this.createOffer({
				media: {
					audioRecv: true,
					videoRecv: true,
					audioSend: true,
					videoSend: true
				},
				success: function(jsep) {
					Janus.debug("Got SDP " + jsep);
					var unhold = {
						request: "unhold"
					};
					this.send({
						message: unhold,
						jsep: jsep,
						success: function() {
							Janus.log("Unholding ...");
						},
						error: function(error) {
							Janus.warn("Error unholding: " + error);
						}
					});
				},
				error: function(error) {
					Janus.error("WebRTC error:" + error);
				}
			});
		};
		this.hangup = function(jsep) {
			var hangup = {
				request: "hangup"
			};
			this.send({
				message: hangup,
				jsep: jsep,
				success: function() {
					Janus.log("Hangup ...");
				},
				error: function(error) {
					Janus.warn("Error hangingup: " + error);
				}
			});
		};
		this.startDataChannel = function() {
			var startdc = {
				request: "startdc"
			};
			this.send({
				message: startdc,
				success: function() {
					Janus.log("Start Data Channel ...");
				},
				error: function(error) {
					Janus.warn("Error starting Data Channel: " + error);
				}
			});
		};
		this.sendData = function(data) {
			this.data({
				text: data
			});
		};
	};
	Janus.VideoCall.prototype = Object.create(Janus.PluginHandle.prototype);
	Janus.VideoCall.prototype.constructor = Janus.VideoCall;
	return Janus.VideoCall;
};

Janus.useAudioBridge = function(options) {
	options = options || {};
	options.plugin = "janus.plugin.audiobridge";
	Janus.AudioBridge = function(options) {
		Janus.PluginHandle.call(this, options);
		this.events = {};
		this.on = function(event, callback) {
			this.events[event] = callback;
			return this;
		};
		this.emit = function(event, data) {
			if (this.events[event]) {
				this.events[event](data);
			}
		};
		this.joined = function(data) {
			this.emit('joined', data);
		};
		this.destroyed = function(data) {
			this.emit('destroyed', data);
		};
		this.event = function(data) {
			this.emit('event', data);
		};
		this.iceState = function(data) {
			this.emit('iceState', data);
		};
		this.mediaState = function(data) {
			this.emit('mediaState', data);
		};
		this.webrtcState = function(data) {
			this.emit('webrtcState', data);
		};
		this.slowLink = function(data) {
			this.emit('slowLink', data);
		};
		this.consentDialog = function(data) {
			this.emit('consentDialog', data);
		};
		this.onremotestream = function(data) {
			this.emit('remotestream', data);
		};
		this.onlocalstream = function(data) {
			this.emit('localstream', data);
		};
		this.onmessage = function(data) {
			this.emit('message', data);
		};
		this.oncleanup = function(data) {
			this.emit('cleanup', data);
		};
		this.destroy = function(data) {
			this.emit('destroy', data);
		};
		this.create = function(id, description, secret, permanent) {
			var create = {
				request: "create",
				room: id,
				description: description,
				secret: secret,
				permanent: permanent
			};
			this.send({
				message: create,
				success: function(data) {
					Janus.log("Audio Bridge created: " + data);
				},
				error: function(error) {
					Janus.warn("Error creating Audio Bridge: " + error);
				}
			});
		};
		this.destroy = function(id, secret) {
			var destroy = {
				request: "destroy",
				room: id,
				secret: secret
			};
			this.send({
				message: destroy,
				success: function(data) {
					Janus.log("Audio Bridge destroyed: " + data);
				},
				error: function(error) {
					Janus.warn("Error destroying Audio Bridge: " + error);
				}
			});
		};
		this.join = function(id, muted) {
			var join = {
				request: "join",
				room: id,
				muted: muted
			};
			this.send({
				message: join,
				success: function(data) {
					Janus.log("Joined Audio Bridge: " + data);
				},
				error: function(error) {
					Janus.warn("Error joining Audio Bridge: " + error);
				}
			});
		};
		this.leave = function(id) {
			var leave = {
				request: "leave",
				room: id
			};
			this.send({
				message: leave,
				success: function(data) {
					Janus.log("Left Audio Bridge: " + data);
				},
				error: function(error) {
					Janus.warn("Error leaving Audio Bridge: " + error);
				}
			});
		};
		this.mute = function() {
			var mute = {
				request: "mute"
			};
			this.send({
				message: mute,
				success: function(data) {
					Janus.log("Mute: " + data);
				},
				error: function(error) {
					Janus.warn("Error muting: " + error);
				}
			});
		};
		this.unmute = function() {
			var unmute = {
				request: "unmute"
			};
			this.send({
				message: unmute,
				success: function(data) {
					Janus.log("Unmute: " + data);
				},
				error: function(error) {
					Janus.warn("Error unmuting: " + error);
				}
			});
		};
		this.listParticipants = function(id) {
			var list = {
				request: "listparticipants",
				room: id
			};
			this.send({
				message: list,
				success: function(data) {
					Janus.log("List participants: " + data);
				},
				error: function(error) {
					Janus.warn("Error listing participants: " + error);
				}
			});
		};
	};
	Janus.AudioBridge.prototype = Object.create(Janus.PluginHandle.prototype);
	Janus.AudioBridge.prototype.constructor = Janus.AudioBridge;
	return Janus.AudioBridge;
};

Janus.useStreaming = function(options) {
	options = options || {};
	options.plugin = "janus.plugin.streaming";
	Janus.Streaming = function(options) {
		Janus.PluginHandle.call(this, options);
		this.events = {};
		this.on = function(event, callback) {
			this.events[event] = callback;
			return this;
		};
		this.emit = function(event, data) {
			if (this.events[event]) {
				this.events[event](data);
			}
		};
		this.started = function(data) {
			this.emit('started', data);
		};
		this.stopped = function(data) {
			this.emit('stopped', data);
		};
		this.event = function(data) {
			this.emit('event', data);
		};
		this.iceState = function(data) {
			this.emit('iceState', data);
		};
		this.mediaState = function(data) {
			this.emit('mediaState', data);
		};
		this.webrtcState = function(data) {
			this.emit('webrtcState', data);
		};
		this.slowLink = function(data) {
			this.emit('slowLink', data);
		};
		this.consentDialog = function(data) {
			this.emit('consentDialog', data);
		};
		this.onremotestream = function(data) {
			this.emit('remotestream', data);
		};
		this.onlocalstream = function(data) {
			this.emit('localstream', data);
		};
		this.onmessage = function(data) {
			this.emit('message', data);
		};
		this.oncleanup = function(data) {
			this.emit('cleanup', data);
		};
		this.destroy = function(data) {
			this.emit('destroy', data);
		};
		this.create = function(id, name, description, metadata, is_private, permanent) {
			var create = {
				request: "create",
				id: id,
				name: name,
				description: description,
				metadata: metadata,
				is_private: is_private,
				permanent: permanent
			};
			this.send({
				message: create,
				success: function(data) {
					Janus.log("Streaming created: " + data);
				},
				error: function(error) {
					Janus.warn("Error creating Streaming: " + error);
				}
			});
		};
		this.destroy = function(id, secret) {
			var destroy = {
				request: "destroy",
				id: id,
				secret: secret
			};
			this.send({
				message: destroy,
				success: function(data) {
					Janus.log("Streaming destroyed: " + data);
				},
				error: function(error) {
					Janus.warn("Error destroying Streaming: " + error);
				}
			});
		};
		this.watch = function(id, muted) {
			var watch = {
				request: "watch",
				id: id,
				muted: muted
			};
			this.send({
				message: watch,
				success: function(data) {
					Janus.log("Watching Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error watching Streaming: " + error);
				}
			});
		};
		this.start = function() {
			var start = {
				request: "start"
			};
			this.send({
				message: start,
				success: function(data) {
					Janus.log("Start Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error starting Streaming: " + error);
				}
			});
		};
		this.pause = function() {
			var pause = {
				request: "pause"
			};
			this.send({
				message: pause,
				success: function(data) {
					Janus.log("Pause Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error pausing Streaming: " + error);
				}
			});
		};
		this.stop = function() {
			var stop = {
				request: "stop"
			};
			this.send({
				message: stop,
				success: function(data) {
					Janus.log("Stop Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error stopping Streaming: " + error);
				}
			});
		};
		this.switch = function(id) {
			var stop = {
				request: "switch",
				id: id
			};
			this.send({
				message: stop,
				success: function(data) {
					Janus.log("Switch Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error stopping Streaming: " + error);
				}
			});
		};
		this.list = function() {
			var list = {
				request: "list"
			};
			this.send({
				message: list,
				success: function(data) {
					Janus.log("List Streaming: " + data);
				},
				error: function(error) {
					Janus.warn("Error listing Streaming: " + error);
				}
			});
		};
	};
	Janus.Streaming.prototype = Object.create(Janus.PluginHandle.prototype);
	Janus.Streaming.prototype.constructor = Janus.Streaming;
	return Janus.Streaming;
};

Janus.useTextRoom = function(options) {
	options = options || {};
	options.plugin = "janus.plugin.textroom";
	Janus.TextRoom = function(options) {
		Janus.PluginHandle.call(this, options);
		this.events = {};
		this.on = function(event, callback) {
			this.events[event] = callback;
			return this;
		};
		this.emit = function(event, data) {
			if (this.events[event]) {
				this.events[event](data);
			}
		};
		this.joined = function(data) {
			this.emit('joined', data);
		};
		this.destroyed = function(data) {
			this.emit('destroyed', data);
		};
		this.event = function(data) {
			this.emit('event', data);
		};
		this.message = function(data) {
			this.emit('message', data);
		};
		this.iceState = function(data) {
			this.emit('iceState', data);
		};
		this.mediaState = function(data) {
			this.emit('mediaState', data);
		};
		this.webrtcState = function(data) {
			this.emit('webrtcState', data);
		};
		this.slowLink = function(data) {
			this.emit('slowLink', data);
		};
		this.consentDialog = function(data) {
			this.emit('consentDialog', data);
		};
		this.onremotestream = function(data) {
			this.emit('remotestream', data);
		};
		this.onlocalstream = function(data) {
			this.emit('localstream', data);
		};
		this.onmessage = function(data) {
			this.emit('message', data);
		};
		this.oncleanup = function(data) {
			this.emit('cleanup', data);
		};
		this.destroy = function(data) {
			this.emit('destroy', data);
		};
		this.create = function(room, description, secret, permanent) {
			var create = {
				request: "create",
				room: room,
				description: description,
				secret: secret,
				permanent: permanent
			};
			this.send({
				message: create,
				success: function(data) {
					Janus.log("Text Room created: " + data);
				},
				error: function(error) {
