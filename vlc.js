/*global window, YUI, document */
/**
 * A util for control VLC.
 *
 * @module vlc
 * @requires node ,base
 */
YUI.add("vlc", function (Y) {

    var MODULE_ID = "Y.VLC",
        _log;

    _log = function (message, type, module) {
        type = type || "info";
        module = module || MODULE_ID;
        Y.log(message, type, module);
    };

    /**
     * An utility for VLC control.
     * The following is sample usage.
     *
     *     var vlc = new Y.VLC({
     *         container: "#foo"
     *         url: "http://dl.dropbox.com/u/10258402/GokKUqLcvD8.mp4",
     *     });
     *
     * @constructor
     * @class VLC
     * @param {Object} config attribute object
     */
    function VLC () {
        VLC.superclass.constructor.apply(this, arguments);
    }
    /**
     * The status code for VLC control.
     *
     * @property STATE
     */
    VLC.STATE =[
        "idle",
        "opening",
        "buffering",
        "playing",
        "paused",
        "stopped",
        "ended",
        "error"
    ];
    VLC.TYPE        = "application/x-vlc-plugin";
    VLC.VERSION     = "VideoLAN.VLCPlugin.2";
    VLC.CLASS_ID    = "clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921";
    VLC.PLUGIN_PAGE = "http://www.videolan.org";
    VLC.TEMPLATE = [
        '<object ',
        '    id="{id}" width="{width}" height="{height}" {type} >',
        '    <param name="autoplay" value="no">',
        '    <param name="autostart value="no">',
        '    <param name="src" value="">',
        '    <param name="wmode" value="window">',
        '</object>'
    ].join("");
    VLC.DEFAULT_WIDTH  = "1000px";
    VLC.DEFAULT_HEIGHT = "700px";
    VLC.CHECK_RETRY    = 3;
    VLC.CHECK_INTERVAL = 1000;
    VLC.POLL_INTERVAL  = 1000;
    VLC.ATTRS = {
        /**
         * The container to place object element.
         *
         * @attribute container
         * @type
         */
        "container": {
            value: null,
            writeOnce: true
        },
        /**
         * The object element.
         *
         * @attribute object
         * @type HTMLElement
         */
        "object": {
            value: null
        },
        /**
         * The video URL.
         *
         * @attribute url
         * @type String
         */
        "url" : {
            value : null
        },
        /**
         * The player's current state.
         *
         * @attribute state
         * @type String
         */
        "state" : {
            value: "idle",
            readOnly: true
        },
        /**
         * The VLC object is AutoPlay, reserve for develop.
         *
         * @attribute autoPlay
         * @type Boolean
         */
        "autoPlay" :{
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
         * The VLC object is installed in browser.
         *
         * @attribute installed
         * @type Boolean
         */
        "installed": {
            value: null,
            getter: function () {
                var vlcObj,
                    i, j,   // For iteration.
                    plugins,
                    plugin;

                if (window.ActiveXObject) {
                    try {
                        vlcObj = new window.ActiveXObject("VideoLAN.VLCPlugin.2");
                    } catch (e) {
                        return false;
                    }
                    if (!vlcObj) {
                        return false;
                    }
                    return true;
                }

                plugins = window.navigator.plugins;
                if (plugins && plugins.length) {
                    for (i = 0, j = plugins.length; i < j; i++) {
                        plugin = plugins[i];
                        if (plugin.name.indexOf("VLC") > -1) {
                            return true;
                        }
                    }
                }

                return false;
            }
        },
        /**
         * The VLC input object's position (current playing time in milli second) .
         *
         * @attribute position
         * @type Number
         */
        "position": {
            value: null,
            getter: function () {
                return this.get("object").input.time;
            },
            setter: function (value) {
                this.get("object").input.time = value;
                return value;
            },
            validator: Y.Lang.isNumber
        },
        /**
         * The video's total time in millionsecond.
         *
         * @attribute duration
         * @type Number
         */
        "duration": {
            value: null,
            getter: function (){
                return this.get("object").input.length;
            },
            readOnly: true
        },
        /**
        * the vlc input object's volume .
        * @attribute volume
        * @type number
        */
        "volume": {
            value: 100,
            getter: function () {
                return this.get("object").audio.volume;
            },
            setter: function (value) {
                this.get("object").audio.volume = value;
            }
        },
        /**
         * The object's size.
         *
         * @attribute size
         * @type Array
         */
        "size": {
            value: [VLC.DEFAULT_WIDTH, VLC.DEFAULT_HEIGHT],
            validator: Y.Lang.isArray
        },
        /**
         *
         *
         * @attribute mode
         * @type boolean
         */
        "fullscreen": {
            value: false,
            validator: Y.Lang.isBoolean,
            setter: function (value) {
                this.get("object").video.fullscreen = value;
                return value;
            }
        }
    };

    Y.extend(VLC, Y.Base, {
        _mute       : false,
        _paused     : false,
        _retryCount : 0,
        _playTimer  : null,
        /**
         * VLC often fails to play.
         */
        _checkState: function () {
            var that = this,
                state;
            _log("_checkState() is executed (" + that._retryCount + ").");
            try {
                // The following line might fails because VLC is not ready.
                state = VLC.STATE[that.get("object").input.state];
                if (that.get("state") !== state) {
                    that._set("state", state);
                    if (state === "opening") {
                        that._set("state", "play");
                        that.fire("play");
                        return;
                    }
                }
            } catch (err) {
                that.fire("error", {
                    code: "1",
                    message: "VLC fails to create. Try again later..."
                });
                that._set("state", "error");
                that.get("container").removeChild(that.get("object"));
                that._create();
            }
            if (that._retryCount > 0) {
                Y.later(VLC.CHECK_INTERVAL, that, that._checkState);
                that._retryCount = that._retryCount - 1;
            } else {
                _log("Retry too many times. Give up!", "error");
            }
        },
        _poll: function () {
            _log("_poll() is executed.");
            var that = this,
                input = that.get("object").input;

            if (
                (input.length > 0 && input.time > 0) &&
                (input.length === input.time)
            ) {
                that._playTimer.cancel();
                that._playTimer = null;
                that.fire("ended");
                that._set("state", "ended");
            } else {
                that.fire("playing", {
                    duration: input.length,
                    position: input.time
                });
                that._playTimer = Y.later(VLC.POLL_INTERVAL, that, that._poll);
                that._set("state", "playing");
            }
        },
        _defPlayFn: function () {
            _log("_defPlayFn() is executed");
            var that = this;
            that.fire("ready");
            that._playTimer = Y.later(VLC.POLL_INTERVAL, that, that._poll, null);
        },
        initializer : function (config) {
            _log("initializer() is executed");
            var that = this,
                url,
                container;

            config = config || {};

            // Set container.
            container = config.container || "body";
            container = Y.one(container);
            that._set("container", container);

            // Set Video URL.
            url = config.url || null;
            that._set("url", url);

            that.publish("error",{
                emitFacade: true
            });

            that.publish("play",{
                emitFacade: true,
                defaultFn: that._defPlayFn
            });

            that.publish("playing",{
                emitFacade: true
            });

            if (that.get("autoPlay")) {
                that.play();
            }
        },
        _create: function () {
            _log("_create() is executed.");
            var that = this,
                container = that.get("container"),
                html,
                token,
                size = that.get("size"),
                width = size[0],
                height = size[1],
                id = Y.guid(),
                node,
                object;

            token = {
                id     : id,
                width  : width,
                height : height
            };
            if (Y.UA.gecko) {
                token.type = "type=" + VLC.TYPE;
            }
            html = Y.substitute(VLC.TEMPLATE, token);
            container.append(html);

            object = document.getElementById(id);
            that._set("object", object);

            if (Y.UA.ie) {
                object.setAttribute("classid", VLC.CLASS_ID);
                object.setAttribute("pluginspage", VLC.PLUGIN_PAGE);
            } else {
                object.setAttribute("type", VLC.TYPE);
            }
            object.setAttribute("version", VLC.VERSION);
            object.playlist.playItem(object.playlist.add(that.get("url")));
        },
        play: function (url) {
            _log("play() is executed.");
            var that = this,
                object = that.get("object");

            url = url || that.get("url");
            if (!url) {
                _log("You must provide either url argument or url attribute.", "error");
            } else {
                that._set("url", url);
            }
            _log("play() - The video URL is " + url);

            that._create();
            that._retryCount = VLC.CHECK_RETRY;
            Y.later(VLC.CHECK_INTERVAL, that, that._checkState);
        },
        stop: function () {
            _log("stop() is executed.");
           var that = this,
               object = that.get("object");
           object.playlist.stop();
           that._playTimer.cancel();
           that._playTimer = null;
           that._set("state", "stopped");
           that.fire("stop");
        },
        pause: function () {
            _log("stop() is executed.");
            var that = this,
                object = that.get("object");
            if (that._paused) {
                Y.log("pause() - The player has already been paused.", "warn", MODULE_ID);
                return;
            }
            object.playlist.togglePause();
            that._playTimer.cancel();
            that._playTimer = null;
            that._paused = true;
            that._set("state", "paused");
            that.fire("pause");
        },
        resume: function () {
            _log("resume() is executed.");
            var that = this,
                object = that.get("object");
            if (!that._paused) {
                _log("resume() - The player isn't paused.");
                return;
            }
            object.playlist.togglePause();
            that._playTimer = Y.later(VLC.POLL_INTERVAL, that, that._poll, null, true);
            that.fire("resume");
            that._paused = false;
        },

        destructor: function () {
            _log("destructor() is executed.");
            var that = this,
                object = that.get("object");
            if (that.get("state") === "playing") {
                object.playlist.stop();
                that._playTimer.cancel();
                that._playTimer = null;
            }
            object.parentNode.removeChild(object);
            object = null;
        }
        //toggleMute: function () {
            //var that = this,
                //object = that.get("object");
            //object.audio.toggleMute();
        //},
    });
    Y.VLC = VLC;
}, "0.0.1", {"requires": ["base", "node", "substitute"]});
