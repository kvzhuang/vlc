VLC with YUI plugin
===================

We design this utility to help some VLC web plugin's leak.
The player's state change detection. The old version crash issue (still improve).
The browser's compatibility (IE, FireFox and Chrome should work).

How to use.
-------

1. First thing, you might include YUI 3 seed in your html file and this vlc.js.
<pre><code>
    &lt;script type="text/javascript" src="http://yui.yahooapis.com/3.4.1/build/yui/yui-min.js"&gt;&lt;/script&gt;
    &lt;script type="text/javascript" src="vlc.js"&gt;&lt;//script&gt;
</code></pre>
2. Use this vlc plugin by the following code.
<pre><code>
YUI().use("vlc","node-event-delegate", function (Y) {});
</code></pre>

3. Create variable and its config.
<pre><code>
         var    vlc, config;
         config       = {
             "container": "#vlc",
             "url": "http://dl.dropbox.com/u/10258402/GokKUqLcvD8.mp4"
         };
         vlc          = new Y.VLC(config);
</code></pre>

4. Config has many setting attributes, and it still in developing.
<pre><code>
    container : You can settup where your vlc plugin to show.
    url       : The streaming url you will play.
    autoPlay  : Will vlc player autoplay this streaming?
    size      : Array to control vlc player's width and height,
                [0] is width, [1] is height.
</pre></code>

5. You also can access some attributes by using YUI ATTRS access method.
   Just access like sample code:  vlc.get("installed");
<pre><code>
    installed  : Is your browser install vlc web plugin?
    state      : The state of current vlc player state
                ("idle", "opening", "buffering", "playing", "paused",
                 "stopped", "ended", "error")
    positin    : The video current playing time.
    duration   : The video total playing length.
    volume     : The volume setting (0-200)
    size       : The player's width and height (using array).
    fullscrren : Set player fullscreen.
</pre></code>

6. State detection - thank god the YUI ATTR has change enevt,
   so even origin vla web plugin state change event is not working.
   We can still detect its state.
<pre><code>
    vlc.on("buffering", function(e){ //when play is buffering
        Y.log("VLC buffering");
    });
    vlc.on("ready", function(e){    //when vlc is ready
        Y.log("VLC ready");
    });
    /*
     * When vlc is playing, e.duration and e.postion can be access
     * for timeline purpose.
     */
    vlc.on("playing", function(e){
        Y.log("playing - duration = " + e.duration + "/ position = " + e.position);
    });
    /*
     * When vlc state change, YUI can detech the state change event.
     */
    vlc.after("stateChange", function(e){
        Y.log("State change from "+e.prevVal +" to "+e.newVal );
    });
</code></pre>
7. Some issue
    The auto play attribute still has some problem, we are try to figure it out.

