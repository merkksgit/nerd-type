(function (cjs, an) {
  var p; // shortcut to reference prototypes
  var lib = {};
  var ss = {};
  var img = {};
  lib.ssMetadata = [
    {
      name: "nt_animation_atlas_1",
      frames: [
        [0, 0, 168, 168],
        [0, 170, 168, 168],
        [0, 340, 168, 168],
        [170, 0, 168, 168],
        [170, 170, 168, 168],
        [170, 340, 168, 168],
      ],
    },
  ];

  (lib.AnMovieClip = function () {
    this.actionFrames = [];
    this.ignorePause = false;
    this.gotoAndPlay = function (positionOrLabel) {
      cjs.MovieClip.prototype.gotoAndPlay.call(this, positionOrLabel);
    };
    this.play = function () {
      cjs.MovieClip.prototype.play.call(this);
    };
    this.gotoAndStop = function (positionOrLabel) {
      cjs.MovieClip.prototype.gotoAndStop.call(this, positionOrLabel);
    };
    this.stop = function () {
      cjs.MovieClip.prototype.stop.call(this);
    };
  }).prototype = p = new cjs.MovieClip();
  // symbols:

  (lib.ntman1 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(0);
  }).prototype = p = new cjs.Sprite();

  (lib.ntman2 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(1);
  }).prototype = p = new cjs.Sprite();

  (lib.ntman3 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(2);
  }).prototype = p = new cjs.Sprite();

  (lib.ntman4 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(3);
  }).prototype = p = new cjs.Sprite();

  (lib.ntman5 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(4);
  }).prototype = p = new cjs.Sprite();

  (lib.ntman6 = function () {
    this.initialize(ss["nt_animation_atlas_1"]);
    this.gotoAndStop(5);
  }).prototype = p = new cjs.Sprite();

  // stage content:
  (lib.Untitled1 = function (mode, startPosition, loop, reversed) {
    if (loop == null) {
      loop = false;
    }
    if (reversed == null) {
      reversed = false;
    }
    var props = new Object();
    props.mode = mode;
    props.startPosition = startPosition;
    props.labels = {};
    props.loop = loop;
    props.reversed = reversed;
    cjs.MovieClip.apply(this, [props]);

    // running
    this.instance = new lib.ntman2();
    this.instance.setTransform(0, 7);

    this.instance_1 = new lib.ntman3();
    this.instance_1.setTransform(0, 7);
    this.instance_1._off = true;

    this.instance_2 = new lib.ntman4();
    this.instance_2.setTransform(0, 7);
    this.instance_2._off = true;

    this.timeline.addTween(
      cjs.Tween.get(this.instance)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(34),
    );
    this.timeline.addTween(
      cjs.Tween.get(this.instance_1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(33),
    );
    this.timeline.addTween(
      cjs.Tween.get(this.instance_2)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(2)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(32),
    );

    // talking
    this.instance_3 = new lib.ntman1();

    this.instance_4 = new lib.ntman5();
    this.instance_4._off = true;

    this.instance_5 = new lib.ntman6();
    this.instance_5._off = true;

    this.timeline.addTween(
      cjs.Tween.get({})
        .to({ state: [] })
        .to({ state: [{ t: this.instance_3 }] }, 18)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .to({ state: [{ t: this.instance_5 }] }, 1)
        .to({ state: [{ t: this.instance_4 }] }, 1)
        .wait(1),
    );
    this.timeline.addTween(
      cjs.Tween.get(this.instance_4)
        .wait(19)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .wait(1),
    );
    this.timeline.addTween(
      cjs.Tween.get(this.instance_5)
        .wait(20)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1)
        .to({ _off: false }, 0)
        .to({ _off: true }, 1)
        .wait(1),
    );

    this._renderFirstFrame();
  }).prototype = p = new lib.AnMovieClip();
  p.nominalBounds = new cjs.Rectangle(84, 87.5, 84, 87.5);
  // library properties:
  lib.properties = {
    id: "27AB6166938E7B41B16669CB563394BB",
    width: 168,
    height: 175,
    fps: 9,
    color: "#FFFFFF",
    opacity: 1.0,
    manifest: [
      { src: "../images/nt_animation_atlas_1.png", id: "nt_animation_atlas_1" },
    ],
    preloads: [],
  };

  // bootstrap callback support:

  (lib.Stage = function (canvas) {
    createjs.Stage.call(this, canvas);
  }).prototype = p = new createjs.Stage();

  p.setAutoPlay = function (autoPlay) {
    this.tickEnabled = autoPlay;
  };
  p.play = function () {
    this.tickEnabled = true;
    this.getChildAt(0).gotoAndPlay(this.getTimelinePosition());
  };
  p.stop = function (ms) {
    if (ms) this.seek(ms);
    this.tickEnabled = false;
  };
  p.seek = function (ms) {
    this.tickEnabled = true;
    this.getChildAt(0).gotoAndStop((lib.properties.fps * ms) / 1000);
  };
  p.getDuration = function () {
    return (this.getChildAt(0).totalFrames / lib.properties.fps) * 1000;
  };

  p.getTimelinePosition = function () {
    return (this.getChildAt(0).currentFrame / lib.properties.fps) * 1000;
  };

  an.bootcompsLoaded = an.bootcompsLoaded || [];
  if (!an.bootstrapListeners) {
    an.bootstrapListeners = [];
  }

  an.bootstrapCallback = function (fnCallback) {
    an.bootstrapListeners.push(fnCallback);
    if (an.bootcompsLoaded.length > 0) {
      for (var i = 0; i < an.bootcompsLoaded.length; ++i) {
        fnCallback(an.bootcompsLoaded[i]);
      }
    }
  };

  an.compositions = an.compositions || {};
  an.compositions["27AB6166938E7B41B16669CB563394BB"] = {
    getStage: function () {
      return exportRoot.stage;
    },
    getLibrary: function () {
      return lib;
    },
    getSpriteSheet: function () {
      return ss;
    },
    getImages: function () {
      return img;
    },
  };

  an.compositionLoaded = function (id) {
    an.bootcompsLoaded.push(id);
    for (var j = 0; j < an.bootstrapListeners.length; j++) {
      an.bootstrapListeners[j](id);
    }
  };

  an.getComposition = function (id) {
    return an.compositions[id];
  };

  an.makeResponsive = function (
    isResp,
    respDim,
    isScale,
    scaleType,
    domContainers,
  ) {
    var lastW,
      lastH,
      lastS = 1;
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    function resizeCanvas() {
      var w = lib.properties.width,
        h = lib.properties.height;
      var iw = window.innerWidth,
        ih = window.innerHeight;
      var pRatio = window.devicePixelRatio || 1,
        xRatio = iw / w,
        yRatio = ih / h,
        sRatio = 1;
      if (isResp) {
        if (
          (respDim == "width" && lastW == iw) ||
          (respDim == "height" && lastH == ih)
        ) {
          sRatio = lastS;
        } else if (!isScale) {
          if (iw < w || ih < h) sRatio = Math.min(xRatio, yRatio);
        } else if (scaleType == 1) {
          sRatio = Math.min(xRatio, yRatio);
        } else if (scaleType == 2) {
          sRatio = Math.max(xRatio, yRatio);
        }
      }
      domContainers[0].width = w * pRatio * sRatio;
      domContainers[0].height = h * pRatio * sRatio;
      domContainers.forEach(function (container) {
        container.style.width = w * sRatio + "px";
        container.style.height = h * sRatio + "px";
      });
      stage.scaleX = pRatio * sRatio;
      stage.scaleY = pRatio * sRatio;
      lastW = iw;
      lastH = ih;
      lastS = sRatio;
      stage.tickOnUpdate = false;
      stage.update();
      stage.tickOnUpdate = true;
    }
  };
  an.handleSoundStreamOnTick = function (event) {
    if (!event.paused) {
      var stageChild = stage.getChildAt(0);
      if (!stageChild.paused || stageChild.ignorePause) {
        stageChild.syncStreamSounds();
      }
    }
  };
  an.handleFilterCache = function (event) {
    if (!event.paused) {
      var target = event.target;
      if (target) {
        if (target.filterCacheList) {
          for (var index = 0; index < target.filterCacheList.length; index++) {
            var cacheInst = target.filterCacheList[index];
            if (
              cacheInst.startFrame <= target.currentFrame &&
              target.currentFrame <= cacheInst.endFrame
            ) {
              cacheInst.instance.cache(
                cacheInst.x,
                cacheInst.y,
                cacheInst.w,
                cacheInst.h,
              );
            }
          }
        }
      }
    }
  };
})((createjs = createjs || {}), (AdobeAn = AdobeAn || {}));
var createjs, AdobeAn;
