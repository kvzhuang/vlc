/**
 * A util for control VLC.
 *
 * @module vlc
 * @requires node ,base
 */
YUI.add("vlc", function (Y) {
    /**
     * An utility for VLC control.
     * The following is sample usage.
     *
     *     var vlc = new Y.VLC({
     *         node: "#foo"
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
    VLC.STATE = {
        0: "idle",
        1: "opening",
        2: "buffering",
        3: "playing",
        4: "paused",
        5: "stopping",
        6: "ended",
        7: "error"
    };
    VLC.TYPE        = "application/x-vlc-plugin";
    VLC.VERSION     = "VideoLAN.VLCPlugin.2",
    VLC.CLASS_ID    = "clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921";
    VLC.PLUGIN_PAGE = "http://www.videolan.org";
    VLC.TEMPLATE = [
        '<object ',
        '     id="{id}" width="{width}" height="{height}" {type}>',
        '    <param name="src" value="">',
        '    <param name="wmode" value="window">',
        '</object>'
    ].join("");

    VLC.ATTRS = {
        /**
        * The VLC object node.
        * @attribute node
        * @type DOM Object
        */
        "node": {
            value: null
        },
        /**
         * The video url.
         *
         * @attribute url
         * @type String
         */
        "url" : {
            value : null
        },
        /**
        * The VLC object state.
        * @attribute state
        * @type VLC.STATE
        */
        "state" : {
            value: 0,
            getter: function (value){
                return VLC.STATE[value];
            }
        },
        /**
        * The VLC object is AutoPlay, reserve for develop.
        * TODO add to feature.
        * @attribute autoPlay
        * @type Boolean
        */
        "autoPlay" :{
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
        * The VLC object is installed in browser.
        * @attribute installed
        * @type Boolean
        */
        "installed": {
            value: null,
            getter: function () {

            if (window.ActiveXObject) {
                try {
                    var vlcObj = new ActiveXObject("VideoLAN.VLCPlugin.2");
                } catch (e) {
                }
                if (!vlcObj) {
                    return false;
                }
                return true;
            }
            if (navigator.plugins && navigator.plugins.length) {
                for (var i=0; i < navigator.plugins.length; i++ ) {
                    var item = navigator.plugins[i];
                    if (item.name.indexOf("VLC") > -1){
                    // && item.description.indexOf("1.1.11") > -1) {
                        return true;
                    }
                }
            }
            return false;

            }
        },
        /**
        * The VLC input object's position (current playing time in milli second) .
        * @attribute position
        * @type Number
        */
        "position": {
            value: null,
            getter: function () {
                return this.get("node")._node.input.time;
            },
            setter: function (newValue) {
                if( value !== null && value !== undefined){
                    this.get("node")._node.input.time = newValue;
                }
            },
            validator: Y.Lang.isNumber
        },
        /**
        * The VLC input object's total time (in milli second) .
        * @attribute duration
        * @type Number
        */
        "duration": {
            value: null,
            getter: function (){
                return this.get("node")._node.input.length;
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
            getter: function (){
                return this.get("node")._node.audio.volume;
            },
            setter: function (newVolume){
                this.get("node")._node.audio.volume = newVolume;
            }
        },
        /**
        * the vlc object's size.
        * @attribute size
        * @type array
        */
        "size": {
            value: null,
            validator: Y.Lang.isArray
        },
        /**
        * the vlc object's mode (fullscreen or not), reserved for future.
        * TODO add feature.
        * @attribute mode
        * @type boolean
        */
        "mode": {
            value: null,
            validator: Y.Lang.isBoolean
        }
    };

    Y.extend(VLC, Y.Base, {
        initializer : function (config) {
            var that = this,
                node,
                container,
                id, // The plugin ID.
                html,
                width,
                height,
                autoPlay,
                previousState,
                stateCheck,
                _objectCheck,
                _objectCheckCount = 3;


            config   = config || {};
            node     = config.node || null;
            autoPlay = Y.Lang.isUndefined(config.autoPlay) ? true : config.autoPlay;
            width    = config.width || "400px";
            height   = config.height || "333px";
            container   = config.container || "body";
            container = Y.one(container);

            node = that._create(node, container, id, width, height);


            objectCheck = function (){

                _objectCheckCount -= 1;
                var version = node._node.VersionInfo;

                if (!version) {
                    container.removeChild(node);
                    node = that._create(node, container, id, width, height);
                    return;
                }
                if ( version && _objectCheckCount == 0){
                    return;
                }

                Y.later(1000, this, objectCheck);
            };
            Y.later(1000, this, objectCheck);

            that._set("size", [width , height]);
            /**
             * It fires when a video starts to play.
            *
             * @event play
             */
            that.publish("fullscreen",{
                emitFacade: true
            });

            previousState = 0;
            stateCheck = function(){
                var currentState = that._getState();
                if( previousState !== currentState ){
                    that._set("state",currentState);
                    previousState = currentState;
                }
            };
            //setInterval(stateCheck,300);
        },
        _create: function ( node, container, id, width, height) {
            var html;
           id   = Y.guid();
            if( Y.UA.gecko ) {
                html = Y.substitute(VLC.TEMPLATE, {id: id, width: width, height: height, type: "type="+VLC.TYPE});
            } else {
                html = Y.substitute(VLC.TEMPLATE, {id: id, width: width, height: height});
            }
            container.append(html);
            node = Y.one("#"+id);
            this._set("node", node);
            if (Y.UA.ie) {
                node.set("classid", VLC.CLASS_ID);
                node.set("pluginspage", VLC.PLUGIN_PAGE);
            } else {
                node.set("type",VLC.TYPE);
            }
                node.set("version", VLC.VERSION);
            return node;
        },
        play: function (url) {
            var that = this,
                el,
                node = that.get("node");
            url = url || that.get("url");
            if (!url) {
                Y.log("You must provide either url argument or url attribute.", "error", "Y.VLC");
            }
            el = node._node;
            el.playlist.playItem(el.playlist.add(url));
            el.playlist.play();
            that._set("time",el.input.time);
        },
        stop: function () {
           var that = this,
               el,
               node = that.get("node");
           el = node._node;
           el.playlist.stop();
        },
        togglePause: function () {
           var that = this,
                el,
                node = that.get("node");
           el = node._node;
           el.playlist.togglePause();
        },
        toggleMute: function () {
           var that = this,
               el,
               node = that.get("node");
           el = node._node;
           el.audio.toggleMute();
        },
        setVolume: function (volume) {
            var that = this,
                el,
                node = that.get("node");
            el = node._node;
            var currentVolume = el.audio.volume;
            if( volume <200 && volume >0){
               el.audio.volume = volume ;
            }
        },
        toggleFullScreen: function () {
           var that = this,
               el,
               node = that.get("node");
           el = node._node;
           el.video.toggleFullscreen();
        },
        getLength: function (){
           var that = this,
               el,
               node = that.get("node");
           el = node._node;
           return el.input.length;
        },
        _getState: function (){
           var that = this,
               el,
               node = that.get("node");
           el = node._node;
           return el.input.state;

        },
        destructor: function () {

        }

    });

    Y.VLC = VLC;

}, "0.0.1", {
    "requires": ["base", "node", "substitute"]
});

