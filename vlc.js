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
        0: "IDLE",
        1: "OPENING",
        2: "BUFFERING",
        3: "PAUSED",
        4: "STOPPING",
        5: "ENDED",
        6: "ERROR"
    };
    VLC.TYPE        = "application/x-vlc-plugin";
    VLC.VERSION     = "VideoLAN.VLCPlugin.2",
    VLC.CLASS_ID    = "clsid:9BE31822-FDAD-461B-AD51-BE1D1C15992";
    VLC.PLUGIN_PAGE = "http://www.videolan.org";
    VLC.TEMPLATE = [
        '<object ',
        'version="' + VLC.VERSION + '"',
        '        codebase="http://download.videolan.org/pub/videolan/vlc/last/win32/axvlc.cab"',
        '        width="{width}" height="{height}" id="{id}">',
        '    <param name="src" value="">',
        '    <param name="wmode" value="window">',
        '</object>'
    ].join("");

    VLC.INSTALL_PLUGIN_TAG = [
        '<p> Please install VLC plugin.',
        '<br/> <a href="http://www.videolan.org/vlc/"> Download website </a>',
        '</p>'
    ].join("");

    VLC.ATTRS = {
        "node": {
            value: null
        },
        /**
         * The video uri.
         *
         * @attribute uri
         * @type String
         */
        "uri" : {
            value : null
        },
        "duration" : {
            value: null,
            readOnly: true
        },
        "state" : {
            value: 0,
            validator: function (value) {
                return (!(Y.Array.indexOf(VLC.STATE, value) === -1));
            }
        },
        "autoPlay" :{
            value: true,
            validator: Y.Lang.isBoolean
        },
        "node": {
            value: null
        },
        "installed": {
            value: null
        }
    };

    Y.extend(VLC, Y.Base, {
        initializer : function (config) {
            var that = this,
                node,
                id, // The plugin ID.
                html,
                width,
                height,
                autoPlay;

            config   = config || {};
            node     = config.node || null;
            autoPlay = config.autoPlay ;
            width    = config.width || "400px";
            height   = config.height || "333px";



            if ( !node) {
                id   = Y.guid();
                html = Y.substitute(VLC.TEMPLATE, {id: id, width: width, height: height});
                Y.one("body").append(html);
                that._set("node", Y.one("#" + id));
                node = that.get("node");
                if (Y.UA.ie) {
                    node.set("classid", VLC.CLASS_ID);
                    node.set("pluginspage", VLC.PLUGIN_PAGE);
                } else {
                    node.set("type", VLC.TYPE);
                }
            }
            if( !node._node.VersionInfo) {
                Y.log("no VLC plugin" , "error", "Y.VLC");
                Y.one("body").append(VLC.INSTALL_PLUGIN_TAG);
            } else {

            }


            if( autoPlay === undefined) {
                that._set("autoPlay",true);
            }else{
                that._set("autoPlay",autoPlay);
            }

            if( autoPlay === true) {
                that.play();

            }
            /**
             * It fires when a video starts to play.
             *
             * @event play
             */
            that.publish("onplay",{
                emitFacade: true
            });
            that.publish("onstop",{
                emitFacade: true
            });
            that.publish("onpause",{
                emitFacade: true
            });
            that.publish("fullscreen",{
                emitFacade: true
            });
            that.publish("statusChange",{
                emitFacade: true
            });
            that.publish("volumnChange",{
                emitFacade: true
            });
        },
        play: function (uri) {
            var that = this,
                el,
                node = that.get("node");
            uri = uri || that.get("uri");
            if (!uri) {
                Y.log("You must provide either uri argument or uri attribute.", "error", "Y.VLC");
            }
            el = node._node;
            el.playlist.playItem(el.playlist.add(uri));
            el.playlist.play();
        },
        stop: function () {
           that._plugin._node.playlist.stop();
        },

        destructor: function () {

        }

    });

    Y.VLC = VLC;

}, "0.0.1", {
    "requires": ["base", "node", "substitute"]
});

