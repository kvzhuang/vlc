/**
 * A util for control VLC.
 *
 * @module VLC
 * @requires node ,base
 *
 */

YUI.add("vlc", function (Y) {

    function VLC (){
        VLC.superclass.constructor.apply(this, arguments);
    }
    VLC.STATUS = {  0: "IDLE",
                    1: "OPENING",
                    2: "BUFFERING",
                    3: "PAUSED",
                    4: "STOPPING",
                    5: "ENDED",
                    6: "ERROR"
    };


    VLC.ATTRS = {
        "pluginId" :{
            value:null
        },
        "uri" : {
            value : null
        },
        "duration" : {
            value: null,
            readOnly: true
        },
        "status" : {
            value: 0,
            validator: function (value) {
                return (!(Y.Array.indexOf(VLC.STATUS, value) === -1));
            }
        },
        "autoPlay" :{
            value: true,
            validator: Y.Lang.isBoolean
        },
        "node": {
            value: null
        }
    };


    Y.extend(VLC, Y.Base, {
        _plugin : null,
        _node : null,
        _status : null,
        options : {},

        initializer : function (config) {
            var that = this;
            config.node = Y.one(config.node);

            var node = self.get("node"); // YUI
            node.get("id");

            that._plugin = Y.one("#"+config.pluginId);
            Y.log(that._plugin);
            if (!that._plugin) {
                //TODO Create div object
                Y.log("undefinded");
            }
            var el = that._node;
            that._node = that._plugin._node;
            Y.log(that._node.input.state);
            var playItem = el.playlist.add(config.uri, config.uri, that.options);
            //that._node.playItem(playItem);
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
        play: function () {
            var that = this;
            that._plugin._node.playlist.play();
            this.fire("onplay",{});


        },
        stop: function () {
           that._plugin._node.playlist.stop();
        },

        destructor: function () {

        }

    });

    Y.VLC = VLC;

}, "0.0.1", {
    "requires": ["base", "node-base"]
});

