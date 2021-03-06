
/* global cordova, plugin, CSSPrimitiveValue */
if (!cordova) {
  document.addEventListener("deviceready", function() {
    require('cordova/exec')(null, null, 'CordovaZenrinMaps', 'pause', []);
  }, {
    once: true
  });
} else {
  var common = require('./Common');
  // The pluginInit.js must execute before loading HTML is completed.
  require("./pluginInit")();

  cordova.addConstructor(function() {
    if (!window.Cordova) {
        window.Cordova = cordova;
    }
    window.plugin = window.plugin || {};
    window.plugin.google = window.plugin.google || {};
    window.plugin.google.maps = window.plugin.google.maps || module.exports;


    document.addEventListener("deviceready", function() {
      // workaround for issue on android-19: Cannot read property 'maps' of undefined
      if (!window.plugin) { console.warn('re-init window.plugin'); window.plugin = window.plugin || {}; }
      if (!window.plugin.google) { console.warn('re-init window.plugin.google'); window.plugin.google = window.plugin.google || {}; }
      if (!window.plugin.google.maps) { console.warn('re-init window.plugin.google.maps'); window.plugin.google.maps = window.plugin.google.maps || module.exports; }

      cordova.exec(null, function(message) {
          alert(message);
      }, 'Environment', 'isAvailable', ['']);
    }, {
      once: true
    });
  });

  var execCmd = require("./commandQueueExecutor");
  var CordovaZenrinMaps = new (require('./CordovaZenrinMaps'))(execCmd);

  (new Promise(function(resolve) {
    var wait = function() {
      if (document.body) {
        wait = undefined;
        CordovaZenrinMaps.trigger('start');
        resolve();
      } else {
        setTimeout(wait, 50);
      }
    };
    wait();

  })).then(function() {
    common.nextTick(function() {
      // If the developer needs to recalculate the DOM tree graph,
      // use `cordova.fireDocumentEvent('plugin_touch')`
      document.addEventListener("plugin_touch", CordovaZenrinMaps.invalidate.bind(CordovaZenrinMaps));

      // Repositioning 30 times when the device orientaion is changed.
      window.addEventListener("orientationchange", CordovaZenrinMaps.followMaps.bind(CordovaZenrinMaps, {
        target: document.body
      }));

      // If <body> is not ready yet, wait 25ms, then execute this function again.
      // if (!document.body || !document.body.firstChild) {
      //   common.nextTick(arguments.callee, 25);
      //   return;
      // }


      document.addEventListener("transitionstart", CordovaZenrinMaps.followMaps.bind(CordovaZenrinMaps), {capture: true});
      document.body.parentNode.addEventListener("transitionend", CordovaZenrinMaps.onTransitionEnd.bind(CordovaZenrinMaps), {capture: true});
      // document.body.addEventListener("transitionend", function(e) {
      //   if (!e.target.hasAttribute("__pluginDomId")) {
      //     return;
      //   }
      //   CordovaZenrinMaps.invalidateN(5);
      // }, true);

      // If the `scroll` event is ocurred on the observed element,
      // adjust the position and size of the map view
      document.body.parentNode.addEventListener("scroll", CordovaZenrinMaps.followMaps.bind(CordovaZenrinMaps), true);
      window.addEventListener("resize", function() {
        CordovaZenrinMaps.transforming = true;
        CordovaZenrinMaps.onTransitionFinish.call(CordovaZenrinMaps);
      }, true);

    });
  });

  /*****************************************************************************
   * Name space
   *****************************************************************************/

  module.exports = {
    event: require('./event'),
    Animation: {
        BOUNCE: 'BOUNCE',
        DROP: 'DROP'
    },

    BaseClass: require('./BaseClass'),
    BaseArrayClass: require('./BaseArrayClass'),
    Map: {
      getMap: CordovaZenrinMaps.getMap.bind(CordovaZenrinMaps)
    },
    StreetView: {
      getPanorama: CordovaZenrinMaps.getPanorama.bind(CordovaZenrinMaps),
      Source: {
        DEFAULT: 'DEFAULT',
        OUTDOOR: 'OUTDOOR'
      }
    },
    HtmlInfoWindow: require('./HtmlInfoWindow'),
    LatLng: require('./LatLng'),
    LatLngBounds: require('./LatLngBounds'),
    MapTypeId: require('./MapTypeId'),
    environment: require('./Environment'),
    Geocoder: require('./Geocoder')(execCmd),
    LocationService: require('./LocationService')(execCmd),
    geometry: {
        encoding: require('./encoding'),
        spherical: require('./spherical'),
        poly: require('./poly')
    }
  };
}
