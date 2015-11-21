// ==UserScript==
// @name        Mono
//
// @exclude     file://*
// @exclude     http://google.*/*
// @exclude     http://*.google.*/*
// @exclude     https://google.*/*
// @exclude     https://*.google.*/*
//
// ==/UserScript==

/**
 *
 * Created by Anton on 21.06.2014.
 *
 * Mono cross-browser engine.
 *
 **/

var mono = (typeof mono === 'undefined') ? undefined : mono;

(function( window, factory ) {
  if (mono) {
    return;
  }
  if (window) {
    return mono = factory();
  }
  exports.isFF = true;
  exports.isModule = true;
  exports.init = factory;
}(typeof window !== "undefined" ? window : undefined, function ( addon ) {
  var require;

  var mono = {};

  var checkCompatibility = function() {
    var vPos, vPosEnd;
    if (mono.isTM || mono.isChrome || mono.isVM) {
      vPos = navigator.userAgent.indexOf('Chrome/') + 7;
      if (vPos === 6) return;
      vPosEnd = navigator.userAgent.indexOf('.', vPos);
      if (vPosEnd === -1) {
        vPosEnd = navigator.userAgent.indexOf(' ', vPos);
      }
      var chromeVersion = parseInt(navigator.userAgent.substr(vPos, vPosEnd - vPos));
      if (isNaN(chromeVersion)) {
        return;
      }
      mono.isChromeVersion = chromeVersion;
      if (chromeVersion < 31) {
        mono.noMouseEnter = true;
        mono.noXhrJson = true;
      }
    } else
    if (mono.isSafari) {
      vPos = navigator.userAgent.indexOf('Version/') + 8;
      vPosEnd = navigator.userAgent.indexOf('.', vPos);
      if (vPosEnd === -1) {
        vPosEnd = navigator.userAgent.indexOf(' ', vPos);
      }
      var safariVersion = parseInt(navigator.userAgent.substr(vPos, vPosEnd - vPos));
      if (isNaN(safariVersion)) {
        return;
      }
      mono.isSafariVersion = safariVersion;
      if (safariVersion < 7) {
        mono.noMouseEnter = true;
        mono.noXhrJson = true;
        mono.badXhrHeadRedirect = true;
      }
    }
  };

  (function() {
    if (typeof window === 'undefined') {
      require = _require;
      mono.isModule = true;
      mono.isFF = true;
      mono.addon = addon;
      return;
    }

    window.mono = mono;
    if (typeof GM_getValue !== 'undefined') {
      mono.isGM = true;
      if (window.chrome !== undefined) {
        mono.isTM = true;
        checkCompatibility();
      } else
      if (navigator.userAgent.indexOf('Maxthon/') !== -1) {
        mono.isVM = true;
        checkCompatibility();
      }
      return;
    }

    if (window.chrome !== undefined) {
      mono.isChrome = true;
      if (chrome.app.getDetails === undefined) {
        mono.isChromeApp = true;
      } else {
        var details = chrome.app.getDetails();
        if (details && details.app !== undefined) {
          mono.isChromeWebApp = true;
        }
      }
      mono.isChromeInject = !chrome.hasOwnProperty('tabs');
      checkCompatibility();
      return;
    }

    if (window.safari !== undefined) {
      mono.isSafari = true;
      mono.isSafariPopup = safari.self.identifier === 'popup';
      mono.isSafariBgPage = safari.self.addEventListener === undefined;
      mono.isSafariInject = !mono.isSafariPopup && safari.application === undefined;
      mono.badXhrZeroResponse = true;
      checkCompatibility();
      return;
    }

    if (window.opera !== undefined) {
      mono.isOpera = true;
      mono.isOperaInject = opera.extension.broadcastMessage === undefined;
      mono.noMouseEnter = true;
      mono.badXhrRedirect = true;
      mono.badXhrZeroResponse = true;
      return;
    }

    mono.addon = window.addon || window.self;
    if (mono.addon !== undefined && mono.addon.port !== undefined) {
      mono.isFF = true;
      return;
    }
    if (navigator.userAgent.indexOf('Firefox') !== -1) {
      mono.isFF = true;
      mono.noAddon = true;
      return;
    }
    if (navigator.userAgent.indexOf('Safari/') !== -1) {
      mono.isSafari = true;
      return;
    }
    
    console.error('Mono: can\'t define browser!');
  })();

  mono.messageStack = 50;

  mono.cloneObj = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  var msgTools = {
    cbObj: {},
    cbStack: [],
    id: 0,
    idPrefix: Math.floor(Math.random()*1000)+'_',
    addCb: function(message, cb) {
      mono.onMessage.inited === undefined && mono.onMessage(function(){});

      if (msgTools.cbStack.length > mono.messageStack) {
        msgTools.clean();
      }
      var id = message.callbackId = msgTools.idPrefix+(++msgTools.id);
      msgTools.cbObj[id] = {fn: cb, time: Date.now()};
      msgTools.cbStack.push(id);
    },
    callCb: function(message) {
      var cb = msgTools.cbObj[message.responseId];
      if (cb === undefined) return;
      delete msgTools.cbObj[message.responseId];
      msgTools.cbStack.splice(msgTools.cbStack.indexOf(message.responseId), 1);
      cb.fn(message.data);
    },
    mkResponse: function(response, callbackId, responseMessage) {
      if (callbackId === undefined) return;

      responseMessage = {
        data: responseMessage,
        responseId: callbackId
      };
      response.call(this, responseMessage);
    },
    clearCbStack: function() {
      for (var item in msgTools.cbObj) {
        delete msgTools.cbObj[item];
      }
      msgTools.cbStack.splice(0);
    },
    removeCb: function(cbId) {
      var cb = msgTools.cbObj[cbId];
      if (cb === undefined) return;
      delete msgTools.cbObj[cbId];
      msgTools.cbStack.splice(msgTools.cbStack.indexOf(cbId), 1);
    },
    clean: function(aliveTime) {
      var now = Date.now();
      aliveTime = aliveTime || 120*1000;
      for (var item in msgTools.cbObj) {
        if (msgTools.cbObj[item].time + aliveTime < now) {
          delete msgTools.cbObj[item];
          msgTools.cbStack.splice(msgTools.cbStack.indexOf(item), 1);
        }
      }
    }
  };

  mono.msgClearStack = msgTools.clearCbStack;
  mono.msgRemoveCbById = msgTools.removeCb;
  mono.msgClean = msgTools.clean;

  mono.sendMessage = function(message, cb, hook) {
    message = {
      data: message,
      hook: hook
    };
    if (cb) {
      msgTools.addCb(message, cb.bind(this));
    }
    mono.sendMessage.send.call(this, message);

    return message.callbackId;
  };

  mono.sendMessageToActiveTab = function(message, cb, hook) {
    message = {
      data: message,
      hook: hook
    };
    if (cb) {
      msgTools.addCb(message, cb.bind(this));
    }
    mono.sendMessage.sendToActiveTab.call(this, message);

    return message.callbackId;
  };

  mono.sendHook = {};

  mono.onMessage = function(cb) {
    var _this = this;
    mono.onMessage.inited = 1;
    mono.onMessage.on.call(_this, function(message, response) {
      if (message.responseId !== undefined) {
        return msgTools.callCb(message);
      }
      var mResponse = msgTools.mkResponse.bind(_this, response, message.callbackId);
      if (message.hook !== undefined) {
        var hookFunc = mono.sendHook[message.hook];
        if (hookFunc !== undefined) {
          return hookFunc(message.data, mResponse);
        }
      }
      cb.call(_this, message.data, mResponse);
    });
  };

  mono.storage = undefined;

(function() {
  if (!mono.isChrome || !(chrome.hasOwnProperty('runtime') && chrome.runtime.onMessage)) return;

  var lowLevelHook = {};

  var chromeMsg = {
    cbList: [],
    mkResponse: function(sender) {
      if (sender.tab) {
        return function(message) {
          chromeMsg.sendTo(message, sender.tab.id);
        }
      }
      if (sender.monoDirect) {
        return function(message) {
          sender(mono.cloneObj(message), chromeMsg.onMessage);
        };
      }
      return function(message) {
        chromeMsg.send(message);
      }
    },
    sendTo: function(message, tabId) {
      chrome.tabs.sendMessage(tabId, message);
    },
    onMessage: function(message, sender, _response) {
      if (mono.isChromeBgPage === 1) {
        if (message.fromBgPage === 1) {
          return;
        }
      } else if (message.toBgPage === 1) {
        return;
      }

      if (message.hook !== undefined) {
        var hookFunc = lowLevelHook[message.hook];
        if (hookFunc !== undefined) {
          return hookFunc(message, sender, _response);
        }
      }

      var response = chromeMsg.mkResponse(sender);
      for (var i = 0, cb; cb = chromeMsg.cbList[i]; i++) {
        cb(message, response);
      }
    },
    on: function(cb) {
      chromeMsg.cbList.push(cb);
      if (chromeMsg.cbList.length !== 1) {
        return;
      }
      chrome.runtime.onMessage.addListener(chromeMsg.onMessage);
    },
    sendToActiveTab: function(message) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] === undefined || tabs[0].id < 0) {
          return;
        }
        chromeMsg.sendTo(message, tabs[0].id);
      });
    },
    send: function(message) {
      if (mono.isChromeBgPage) {
        message.fromBgPage = 1;
      } else {
        message.toBgPage = 1;
      }
      chrome.runtime.sendMessage(message);
    }
  };

  chromeMsg.on.lowLevelHook = lowLevelHook;

  (function() {
    if (!chrome.runtime.hasOwnProperty('getBackgroundPage')) return;

    mono.isChromeBgPage = location.href.indexOf('_generated_background_page.html') !== -1;

    chrome.runtime.getBackgroundPage(function(bgWin) {
      if (bgWin !== window) {
        delete mono.isChromeBgPage;
      } else {
        mono.isChromeBgPage = 1;
      }

      if (!mono.isChromeBgPage) {
        chromeMsg.onMessage.monoDirect = true;
        chromeMsg.send = mono.sendMessage.send = function(message) {
          bgWin.mono.chromeDirectOnMessage(mono.cloneObj(message), chromeMsg.onMessage);
        }
      } else
      if (mono.chromeDirectOnMessage === undefined ) {
        mono.chromeDirectOnMessage = function(message, sender) {
          chromeMsg.onMessage(message, sender);
        };
      }
    });
  })();

  mono.onMessage.on = chromeMsg.on;
  mono.sendMessage.send = chromeMsg.send;
  mono.sendMessage.sendToActiveTab = chromeMsg.sendToActiveTab;
})();

(function() {
  if (!mono.isFF) return;

  (function() {
    if (!mono.noAddon) return;

    var onCollector = [];
    mono.addon = {
      port: {
        emit: function(pageId, message) {
          var msg = '>'+JSON.stringify(message);
          window.postMessage(msg, "*");
        },
        on: function(pageId, onMessage) {
          onCollector.push(onMessage);
          if (onCollector.length > 1) {
            return;
          }
          window.addEventListener('monoMessage', function (e) {
            if (e.detail[0] !== '<') {
              return;
            }
            var data = e.detail.substr(1);
            var json = JSON.parse(data);
            for (var i = 0, cb; cb = onCollector[i]; i++) {
              cb(json);
            }
          });
        }
      }
    }
  })();

  var firefoxMsg = {
    cbList: [],
    mkResponse: function(pageId) {
      return function(message) {
        firefoxMsg.sendTo(message, pageId);
      }
    },
    on: function(cb) {
      firefoxMsg.cbList.push(cb);
      if (firefoxMsg.cbList.length !== 1) {
        return;
      }
      mono.addon.port.on('mono', function(msg) {
        var response = firefoxMsg.mkResponse(msg.from);
        for (var i = 0, cb; cb = firefoxMsg.cbList[i]; i++) {
          cb(msg, response);
        }
      });
    },
    send: function(message) {
      mono.addon.port.emit('mono', message);
    },
    sendTo: function(message, to) {
      message.to = to;
      mono.addon.port.emit('mono', message);
    },
    sendToActiveTab: function(message) {
      message.hook = 'activeTab';
      firefoxMsg.sendTo(message);
    }
  };

  mono.onMessage.on = firefoxMsg.on;
  mono.sendMessage.send = firefoxMsg.send;
  mono.sendMessage.sendToActiveTab = firefoxMsg.sendToActiveTab;
})();

(function() {
  if (!mono.isChrome || (chrome.hasOwnProperty('runtime') && chrome.runtime.onMessage)) return;

  var lowLevelHook = {};

  var chromeMsg = {
    cbList: [],
    mkResponse: function(sender, _response) {
      if (sender.tab && sender.tab.id > -1) {
        return function(message) {
          chromeMsg.sendTo(message, sender.tab.id);
        }
      }

      return function(message) {
        _response(message);
      }
    },
    sendTo: function(message, tabId) {
      chrome.tabs.sendRequest(tabId, message, function(message) {
        if (message && message.responseId !== undefined) {
          return msgTools.callCb(message);
        }
      });
    },
    onMessage: function(message, sender, _response) {
      if (mono.isChromeBgPage === 1) {
        if (message.fromBgPage === 1) {
          return;
        }
      } else if (message.toBgPage === 1) {
        return;
      }

      if (message.hook !== undefined) {
        var hookFunc = lowLevelHook[message.hook];
        if (hookFunc !== undefined) {
          return hookFunc(message, sender, _response);
        }
      }

      var response = chromeMsg.mkResponse(sender, _response);
      for (var i = 0, cb; cb = chromeMsg.cbList[i]; i++) {
        cb(message, response);
      }
    },
    on: function(cb) {
      chromeMsg.cbList.push(cb);
      if (chromeMsg.cbList.length !== 1) {
        return;
      }
      chrome.extension.onRequest.addListener(chromeMsg.onMessage);
    },
    sendToActiveTab: function(message) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] === undefined || tabs[0].id < 0) {
          return;
        }
        chromeMsg.sendTo(message, tabs[0].id);
      });
    },
    send: function(message) {
      if (mono.isChromeBgPage) {
        message.fromBgPage = 1;
      } else {
        message.toBgPage = 1;
      }
      chrome.extension.sendRequest(message, function(message) {
        if (message && message.responseId !== undefined) {
          return msgTools.callCb(message);
        }
      });
    }
  };

  chromeMsg.on.lowLevelHook = lowLevelHook;

  (function() {
    try {
      if (chrome.runtime.getBackgroundPage === undefined) return;
    } catch (e) {
      return;
    }

    mono.isChromeBgPage = location.href.indexOf('_generated_background_page.html') !== -1;

    chrome.runtime.getBackgroundPage(function(bgWin) {
      if (bgWin !== window) {
        delete mono.isChromeBgPage;
      } else {
        mono.isChromeBgPage = 1;
      }
    });
  })();

  mono.onMessage.on = chromeMsg.on;
  mono.sendMessage.send = chromeMsg.send;
  mono.sendMessage.sendToActiveTab = chromeMsg.sendToActiveTab;
})();

(function() {
  if (!mono.isSafari) return;

  var localUrl, localUrlLen;
  if (mono.isSafariBgPage && window.location && window.location.href) {
    localUrl = window.location.href.substr(0, window.location.href.indexOf('/', 19));
    localUrlLen = localUrl.length;
  }

  var safariMsg = {
    cbList: [],
    mkResponse: !mono.isSafariBgPage ? function() {
      return function(message) {
        safariMsg.send(message);
      }
    } : function(source) {
      return function(message) {
        safariMsg.sendTo(message, source);
      }
    },
    sendTo: function(message, source) {
      if (!source.page || !source.page.dispatchMessage) {
        return;
      }
      source.page.dispatchMessage("message", message);
    },
    onMessage: function(event) {
      var message = event.message;
      var response = safariMsg.mkResponse(event.target);
      for (var i = 0, cb; cb = safariMsg.cbList[i]; i++) {
        cb(message, response);
      }
    },
    on: function(cb) {
      safariMsg.cbList.push(cb);
      if (safariMsg.cbList.length !== 1) {
        return;
      }
      if ( (mono.isSafariPopup || mono.isSafariBgPage) && mono.safariDirectOnMessage === undefined ) {
        mono.safariDirectOnMessage = safariMsg.onMessage;
      }
      if (mono.isSafariBgPage) {
        return safari.application.addEventListener("message", safariMsg.onMessage, false);
      }
      safari.self.addEventListener("message", safariMsg.onMessage, false);
    },
    sendToActiveTab: function(message) {
      var currentTab = safari.application.activeBrowserWindow.activeTab;
      safariMsg.sendTo(message, currentTab);
    },
    send: mono.isSafariPopup ? function(message) {
      safari.extension.globalPage.contentWindow.mono.safariDirectOnMessage({
        message: mono.cloneObj(message),
        target: {
          page: {
            dispatchMessage: function(name, message) {
              mono.safariDirectOnMessage({message: mono.cloneObj(message)});
            }
          }
        }
      });
    } : mono.isSafariBgPage ? function(message) {
      for (var p = 0, popup; popup = safari.extension.popovers[p]; p++) {
        popup.contentWindow.mono.safariDirectOnMessage({
          message: mono.cloneObj(message),
          target: {
            page: {
              dispatchMessage: function(name, message) {
                mono.safariDirectOnMessage({message: mono.cloneObj(message)});
              }
            }
          }
        });
      }
      for (var w = 0, window; window = safari.application.browserWindows[w]; w++) {
        for (var t = 0, tab; tab = window.tabs[t]; t++) {
          if (tab.url && tab.url.substr(0, localUrlLen) === localUrl) {
            safariMsg.sendTo(message, tab);
          }
        }
      }
    } : function(message) {
      safariMsg.sendTo(message, {page: safari.self.tab});
    }
  };

  mono.onMessage.on = safariMsg.on;
  mono.sendMessage.send = safariMsg.send;
  mono.sendMessage.sendToActiveTab = safariMsg.sendToActiveTab;
})();

(function() {
  if (!mono.isOpera) return;

  var inLocalScope = window.location && window.location.href && window.location.href.substr(0, 9) === 'widget://';

  var operaMsg = {
    cbList: [],
    mkResponse: function(source) {
      return function(message) {
        operaMsg.sendTo(message, source);
      }
    },
    sendTo: function(message, source) {
      try {
        source.postMessage(message);
      } catch (e) {}
    },
    on: function(cb) {
      operaMsg.cbList.push(cb);
      if (operaMsg.cbList.length !== 1) {
        return;
      }
      opera.extension.onmessage = function(event) {
        var message = event.data;
        if (message.toLocalScope === 1 && inLocalScope === false) return;
        var response = operaMsg.mkResponse(event.source);
        for (var i = 0, cb; cb = operaMsg.cbList[i]; i++) {
          cb(message, response);
        }
      }
    },
    sendToActiveTab: function(message) {
      var currentTab = opera.extension.tabs.getSelected();
      operaMsg.sendTo(message, currentTab);
    },
    send: mono.isOperaInject ? function(message) {
      operaMsg.sendTo(message, opera.extension);
    } : function(message) {
      message.toLocalScope = 1;
      opera.extension.broadcastMessage(message);
    }
  };

  mono.onMessage.on = operaMsg.on;
  mono.sendMessage.send = operaMsg.send;
  mono.sendMessage.sendToActiveTab = operaMsg.sendToActiveTab;
})();

(function() {
  if (!mono.isGM) return;

  var gmMsg = {
    cbList: [],
    onMessage: function(_message) {
      var message = mono.cloneObj(_message);
      var response = gmMsg.onMessage;
      for (var i = 0, cb; cb = gmMsg.cbList[i]; i++) {
        if (this.isBg === cb.isBg) {
          continue;
        }
        cb(message, response.bind({isBg: cb.isBg}));
      }
    },
    on: function(cb) {
      cb.isBg = this.isBg;
      gmMsg.cbList.push(cb);
    }
  };
  gmMsg.send = gmMsg.onMessage;

  mono.onMessage.on = gmMsg.on;
  mono.sendMessage.send = gmMsg.send;
  mono.sendMessage.sendToActiveTab = gmMsg.onMessage.bind({isBg: true});
})();

(function() {
  if (!mono.isChrome || !chrome.hasOwnProperty('storage')) return;

  var chStorage = function(mode) {
    return chrome.storage[mode];
  };

  mono.storage = chStorage('local');
  mono.storage.local = mono.storage;
  mono.storage.sync = chStorage('sync');
})();

(function() {
  if (!mono.isFF || !mono.isModule) return;

  var ffSimpleStorage = function() {
    var ss = require('sdk/simple-storage');
    return {
      get: function (src, cb) {
        var key, obj = {};
        if (src === undefined || src === null) {
          for (key in ss.storage) {
            if (!ss.storage.hasOwnProperty(key)) {
              continue;
            }
            obj[key] = ss.storage[key];
          }
          return cb(obj);
        }
        if (typeof src === 'string') {
          src = [src];
        }
        if (Array.isArray(src) === true) {
          for (var i = 0, len = src.length; i < len; i++) {
            key = src[i];
            if (!ss.storage.hasOwnProperty(key)) {
              continue;
            }
            obj[key] = ss.storage[key];
          }
        } else {
          for (key in src) {
            if (!ss.storage.hasOwnProperty(key)) {
              continue;
            }
            obj[key] = ss.storage[key];
          }
        }
        cb(obj);
      },
      set: function (obj, cb) {
        for (var key in obj) {
          ss.storage[key] = obj[key];
        }
        cb && cb();
      },
      remove: function (obj, cb) {
        if (Array.isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            var key = obj[i];
            delete ss.storage[key];
          }
        } else {
          delete ss.storage[obj];
        }
        cb && cb();
      },
      clear: function (cb) {
        for (var key in ss.storage) {
          delete ss.storage[key];
        }
        cb && cb();
      }
    }
  };

  mono.storage = ffSimpleStorage();
  mono.storage.local = mono.storage.sync = mono.storage;
})();

(function() {
  if (!mono.isGM) return;

  var storage = {
    get: function (src, cb) {
      var key, value, obj = {};
      if (src === undefined || src === null) {
        var nameList = GM_listValues();
        for (key in nameList) {
          obj[key] = GM_getValue(key);
        }
        return cb(obj);
      }
      if (typeof src === 'string') {
        src = [src];
      }
      if (Array.isArray(src) === true) {
        for (var i = 0, len = src.length; i < len; i++) {
          key = src[i];
          value = GM_getValue(key);
          if (value !== undefined) {
            obj[key] = value;
          }
        }
      } else {
        for (key in src) {
          value = GM_getValue(key);
          if (value !== undefined) {
            obj[key] = value;
          }
        }
      }
      cb(obj);
    },
    set: function (obj, cb) {
      for (var key in obj) {
        GM_setValue(key, obj[key]);
      }
      cb && cb();
    },
    remove: function (obj, cb) {
      if (Array.isArray(obj)) {
        for (var i = 0, len = obj.length; i < len; i++) {
          var key = obj[i];
          if (storage.hasDeleteValue) {
            GM_deleteValue(key);
          } else {
            GM_setValue(key, undefined);
          }
        }
      } else {
        if (storage.hasDeleteValue) {
          GM_deleteValue(obj);
        } else {
          GM_setValue(obj, undefined);
        }
      }
      cb && cb();
    },
    clear: function (cb) {
      var key;
      var nameList = GM_listValues();
      for (key in nameList) {
        if (storage.hasDeleteValue) {
          GM_deleteValue(key);
        } else {
          GM_setValue(key, undefined);
        }
      }
      cb && cb();
    }
  };
  storage.hasDeleteValue = typeof GM_deleteValue !== 'undefined';

  mono.storage = storage;
  mono.storage.local = mono.storage.sync = mono.storage;
})();

(function() {
  if (mono.storage) return;

  var getLocalStorage = function(localStorage) {
    var localStorageMode = {
      getObj: function(key) {
        var index = 0;
        var keyPrefix = localStorageMode.chunkPrefix + key;
        var chunk = localStorage[keyPrefix + index];
        var data = '';
        while (chunk !== undefined) {
          data += chunk;
          index++;
          chunk = localStorage[keyPrefix + index];
        }
        var value = undefined;
        try {
          value = JSON.parse(data);
        } catch (e) {
        }
        return value;
      },
      setObj: function(key, value) {
        value = JSON.stringify(value);
        var keyPrefix = localStorageMode.chunkPrefix + key;
        var chunkLen = 1024 - keyPrefix.length - 3;
        if (localStorageMode.regexp === undefined) {
          localStorageMode.regexp = new RegExp('.{1,' + chunkLen + '}', 'g');
        }
        var valueLen = value.length;
        var number_of_part = Math.floor(valueLen / chunkLen);
        if (number_of_part >= 512) {
          console.log('monoLog:', 'localStorage', 'Can\'t save item', key, ', very big!');
          return;
        }
        var dataList = value.match(localStorageMode.regexp);
        var dataListLen = dataList.length;
        for (var i = 0, item; i < dataListLen; i++) {
          item = dataList[i];
          localStorage[keyPrefix + i] = item;
        }
        localStorage[key] = localStorageMode.chunkItem;

        localStorageMode.rmObj(key, dataListLen);
      },
      rmObj: function(key, index) {
        var keyPrefix = localStorageMode.chunkPrefix + key;
        if (index === undefined) {
          index = 0;
        }
        var data = localStorage[keyPrefix + index];
        while (data !== undefined) {
          delete localStorage[keyPrefix + index];
          index++;
          data = localStorage[keyPrefix + index];
        }
      },
      readValue: function(key, value) {
        if (value === localStorageMode.chunkItem) {
          value = localStorageMode.getObj(key)
        } else if (value !== undefined) {
          var type = localStorage['_keyType_'+key];
          if (type === 'boolean') {
            value = value === 'true';
          } else
          if (type !== 'string') {
            value = parseFloat(value);
          }
        }
        return value;
      },
      get: function(src, cb) {
        var key, obj = {};
        if (src === undefined || src === null) {
          for (key in localStorage) {
            if (!localStorage.hasOwnProperty(key) || key === 'length') {
              continue;
            }
            if (key.substr(0, localStorageMode.chunkLen) === localStorageMode.chunkPrefix) {
              continue;
            }
            if (key.substr(0, 9) === '_keyType_') {
              continue;
            }
            obj[key] = localStorageMode.readValue(key, localStorage[key]);
          }
          return cb(obj);
        }
        if (typeof src === 'string') {
          src = [src];
        }
        if (Array.isArray(src) === true) {
          for (var i = 0, len = src.length; i < len; i++) {
            key = src[i];
            if (!localStorage.hasOwnProperty(key)) {
              continue;
            }
            obj[key] = localStorageMode.readValue(key, localStorage[key]);
          }
        } else {
          for (key in src) {
            if (!localStorage.hasOwnProperty(key)) {
              continue;
            }
            obj[key] = localStorageMode.readValue(key, localStorage[key]);
          }
        }
        cb(obj);
      },
      set: function(obj, cb) {
        var key;
        for (key in obj) {
          var value = obj[key];
          if (value === undefined) {
            localStorageMode.remove(key);
          } else if (typeof value === 'object') {
            localStorageMode.setObj(key, value);
          } else {
            if (typeof value === 'boolean') {
              localStorage['_keyType_'+key] = 'boolean';
            } else
            if (typeof value !== 'number') {
              localStorage['_keyType_'+key] = 'string';
            } else {
              delete localStorage['_keyType_'+key];
            }
            localStorage[key] = value;
          }
        }
        cb && cb();
      },
      remove: function(obj, cb) {
        if (Array.isArray(obj)) {
          for (var i = 0, len = obj.length; i < len; i++) {
            var key = obj[i];
            if (localStorage[key] === localStorageMode.chunkItem) {
              localStorageMode.rmObj(key);
            }
            delete localStorage[key];
          }
        } else {
          if (localStorage[obj] === localStorageMode.chunkItem) {
            localStorageMode.rmObj(obj);
          }
          delete localStorage[obj];
        }
        cb && cb();
      },
      clear: function(cb) {
        localStorage.clear();
        cb && cb();
      }
    };
    localStorageMode.chunkPrefix = 'mCh_';
    localStorageMode.chunkLen = localStorageMode.chunkPrefix.length;
    localStorageMode.chunkItem = 'monoChunk';
    return localStorageMode;
  };

  var externalStorage = {
    get: function(obj, cb) {
      mono.sendMessage({action: 'get', data: obj}, cb, 'monoStorage');
    },
    set: function(obj, cb) {
      mono.sendMessage({action: 'set', data: obj}, cb, 'monoStorage');
    },
    remove: function(obj, cb) {
      mono.sendMessage({action: 'remove', data: obj}, cb, 'monoStorage');
    },
    clear: function(cb) {
      mono.sendMessage({action: 'clear'}, cb, 'monoStorage');
    }
  };

  var externalStorageHook = function(message, response) {
    if (message.action === 'get') {
      return mono.storage.get(message.data, response);
    } else
    if (message.action === 'set') {
      return mono.storage.set(message.data, response);
    } else
    if (message.action === 'remove') {
      return mono.storage.remove(message.data, response);
    } else
    if (message.action === 'clear') {
      return mono.storage.clear(response);
    }
  };


  if (mono.isOpera && typeof widget !== 'undefined') {
    mono.storage = getLocalStorage(widget.preferences);
    mono.storage.local = mono.storage.sync = mono.storage;
    return;
  }
  if (mono.isFF || mono.isChromeInject || mono.isOperaInject || mono.isSafariInject) {
    mono.storage = externalStorage;
    mono.storage.local = mono.storage.sync = mono.storage;
    return;
  }
  if (window.localStorage) {
    mono.storage = getLocalStorage(window.localStorage);
    mono.storage.local = mono.storage.sync = mono.storage;
    if (mono.isChrome || mono.isSafari || mono.isOpera) {
      mono.sendHook.monoStorage = externalStorageHook;
    }
    return;
  }
  console.error('Can\'t detect storage!');
})();

  //> utils
  if (mono.isChrome) {
    mono.onMessage.on.lowLevelHook.hasInject = function(message, sender, response) {
      if (location.href !== message.url) {
        return setTimeout(function() {response(null);}, 1000);
      }
      response(true);
    }
  }

  mono.parseXhrHeader = function(head) {
    head = head.replace(/\r?\n/g, '\n').split('\n');
    var obj = {
      monoParsed: 1
    };
    for (var i = 0, len = head.length; i < len; i++) {
      var keyValue = head[i].split(':');
      if (keyValue.length < 2) {
        continue;
      }
      var key = keyValue[0].trim().toLowerCase();
      obj[key] = keyValue[1].trim();
    }
    return obj;
  };

  mono.ajax = function(obj) {
    var url = obj.url;

    var method = obj.type || 'GET';
    method = method.toUpperCase();

    var data = obj.data;

    if (data && typeof data !== "string") {
      data = mono.param(data);
    }

    if (data && method === 'GET') {
      url += ( (url.indexOf('?') === -1)?'?':'&' ) + data;
      data = undefined;
    }

    if (obj.cache === false && ['GET','HEAD'].indexOf(method) !== -1) {
      var nc = '_=' + Date.now();
      url += ( (url.indexOf('?') === -1)?'?':'&' ) + nc;
    }

    var xhr;
    if (obj.localXHR === undefined && mono.isGM) {
      xhr = {};
      xhr.method = method;
      xhr.url = url;
      xhr.data = data;
    } else {
      xhr = new (mono.isModule ? require('sdk/net/xhr').XMLHttpRequest : XMLHttpRequest)();
      xhr.open(method, url, true);
    }

    if (obj.timeout !== undefined) {
      xhr.timeout = obj.timeout;
    }

    if (obj.dataType) {
      obj.dataType = obj.dataType.toLowerCase();

      if (!(mono.noXhrJson && obj.dataType === 'json')) {
        xhr.responseType = obj.dataType;
      }
    }

    if (!obj.headers) {
      obj.headers = {};
    }

    if (obj.contentType) {
      obj.headers["Content-Type"] = obj.contentType;
    }

    if (data && !obj.headers["Content-Type"]) {
      obj.headers["Content-Type"] = 'application/x-www-form-urlencoded; charset=UTF-8';
    }

    if (obj.localXHR === undefined && mono.isGM) {
      xhr.overrideMimeType = obj.mimeType;
      xhr.headers = obj.headers;
      xhr.onload = function(_xhr) {
        var xhr = mono.extend({}, _xhr);
        if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
          var response = xhr.responseText;
          if (obj.dataType === 'json') {
            if (typeof xhr.response === 'string' && xhr.responseText) {
              try {
                response = JSON.parse(xhr.responseText);
              } catch (e) {}
            } else {
              response = xhr.response;
            }
          }
          if (obj.mimeType === 'text/xml') {
            var parser=new DOMParser();
            if (typeof xhr.response === 'string') {
              xhr.responseXML = parser.parseFromString(xhr.responseText, obj.mimeType);
            }
          }
          var responseHeaders = undefined;
          xhr.getResponseHeader = function(name) {
            name = name.toLowerCase();
            if (responseHeaders === undefined) {
              responseHeaders = mono.parseXhrHeader(xhr.responseHeaders);
            }
            return responseHeaders[name];
          };
          return obj.success && obj.success(response, xhr);
        }
        obj.error && obj.error(xhr);
      };
      xhr.onerror = function(response) {
        obj.error && obj.error(response);
      };
      return GM_xmlhttpRequest(xhr);
    }

    if (obj.withCredentials) {
      xhr.withCredentials = true;
    }

    if (obj.mimeType && !(mono.isOpera && obj.mimeType === 'application/json')) {
      xhr.overrideMimeType(obj.mimeType);
    }
    if (obj.headers) {
      for (var key in obj.headers) {
        xhr.setRequestHeader(key, obj.headers[key]);
      }
    }

    if (mono.isOpera || mono.isSafari) {
      xhr.onreadystatechange = function () {
        if (mono.badXhrRedirect && xhr.readyState > 1 && (xhr.status === 302 || xhr.status === 0)) {
          // Opera xhr redirect
          if (obj.noRedirect === undefined) {
            obj.noRedirect = 0;
          }
          var location = xhr.getResponseHeader('Location');
          if (location && obj.noRedirect < 5) {
            obj.noRedirect++;
            var _obj = mono.extend({}, obj);
            _obj.url = location;
            delete obj.success;
            delete obj.error;
            var _xhr = mono.ajax(_obj);
            xhr.abort = _xhr.abort;
          }
        }
        if (mono.badXhrHeadRedirect && xhr.readyState > 1 && method === 'HEAD') {
          // Safari on HEAD 302 redirect fix
          obj.success && obj.success(undefined, xhr);
          delete obj.success;
          delete obj.error;
          xhr.abort();
        }
      };
    }
    if (obj.onTimeout !== undefined) {
      xhr.ontimeout = function() {
        obj.onTimeout();
      };
    }

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304 ||
        ( mono.badXhrZeroResponse && xhr.status === 0 && xhr.response) ) {
        var response = (obj.dataType) ? xhr.response : xhr.responseText;
        if (obj.dataType === 'json' && typeof response !== 'object' && xhr.responseText) {
          try {
            response = JSON.parse(xhr.responseText);
          } catch (e) {}
        }
        return obj.success && obj.success(response, xhr);
      }
      obj.error && obj.error(xhr);
    };
    xhr.onerror = function(e) {
      obj.error && obj.error(xhr);
    };
    try {
      xhr.send(data);
    } catch (e) {
      // NS_ERROR_FILE_NOT_FOUND
      obj.error && obj.error({});
    }

    return xhr;
  };

  mono.extend = function() {
    var obj = arguments[0];
    for (var i = 1, len = arguments.length; i < len; i++) {
      var item = arguments[i];
      for (var key in item) {
        obj[key] = item[key];
      }
    }
    return obj;
  };

  mono.param = function(obj) {
    if (typeof obj === 'string') {
      return obj;
    }
    var itemsList = [];
    for (var key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }
      if (obj[key] === undefined) {
        obj[key] = '';
      }
      itemsList.push(encodeURIComponent(key)+'='+encodeURIComponent(obj[key]));
    }
    return itemsList.join('&');
  };

  mono.capitalize = function(word) {
    return word.charAt(0).toUpperCase() + word.substr(1);
  };

  mono.create = (function() {
    var createHook = {
      text: function(el, value) {
        el.textContent = value;
      },
      data: function(el, value) {
        for (var item in value) {
          el.dataset[item] = value[item];
        }
      },
      class: function(el, value) {
        if (typeof value !== 'string') {
          for (var i = 0, len = value.length; i < len; i++) {
            var className = value[i];
            el.classList.add(className);
          }
          return;
        }
        el.setAttribute('class', value);
      },
      style: function(el, value) {
        if (typeof value !== 'string') {
          for (var item in value) {
            el.style[item] = value[item];
          }
          return;
        }
        el.setAttribute('style', value);
      },
      append: function(el, value) {
        if (Array.isArray(value)) {
          for (var i = 0, len = value.length; i < len; i++) {
            var subEl = value[i];
            if (!subEl) {
              continue;
            }
            if (typeof (subEl) === 'string') {
              subEl = document.createTextNode(subEl);
            }
            el.appendChild(subEl);
          }
          return;
        }
        el.appendChild(value);
      },
      on: function(el, args) {
        if (typeof args[0] !== 'string') {
          for (var i = 0, len = args.length; i < len; i++) {
            var subArgs = args[i];
            mono.on(el, subArgs[0], subArgs[1], subArgs[2]);
          }
          return;
        }
        //type, onEvent, useCapture
        mono.on(el, args[0], args[1], args[2]);
      },
      onCreate: function(el, value) {
        value(el);
      }
    };

    return function(tagName, obj) {
      var el;
      if ( typeof tagName === 'string') {
        el = document.createElement(tagName);
      } else {
        el = tagName;
      }
      if (obj !== undefined) {
        for (var attr in obj) {
          var value = obj[attr];
          if (createHook[attr]) {
            createHook[attr](el, value);
            continue;
          }
          el[attr] = value;
        }
      }
      return el;
    }
  })();

  mono.parseTemplate = function(list, fragment) {
    if (typeof list === "string") {
      list = list.replace(/"/g, '\\"').replace(/\\'/g, '\\u0027').replace(/'/g, '"').replace(/([{,]{1})\s*([a-zA-Z0-9]+):/g, '$1"$2":');
      try {
        list = JSON.parse(list);
      } catch (e) {
        return document.createTextNode(list);
      }
    }
    fragment = fragment || document.createDocumentFragment();
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (typeof item === 'object') {
        for (var tagName in item) {
          var el = item[tagName];
          var append = el.append;
          delete el.append;
          var dEl;
          fragment.appendChild(dEl = mono.create(tagName, el));
          if (append !== undefined) {
            mono.parseTemplate(append, dEl);
          }
        }
      } else {
        fragment.appendChild(document.createTextNode(item));
      }
    }
    return fragment;
  };

  mono.trigger = function(el, type, data) {
    if (data === undefined) {
      data = {};
    }
    if (data.bubbles === undefined) {
      data.bubbles = false;
    }
    if (data.cancelable === undefined) {
      data.cancelable = false;
    }
    var event = new CustomEvent(type, data);
    el.dispatchEvent(event);
  };

  mono.str2regexp = function(s) {
    return new RegExp('^' + s.replace(/\./g, '\\.').replace(/\*/g, '.*?') + '$');
  };

  mono.checkUrl = function(url, rules) {
    return rules.some(function(rule){
      if (typeof rule === 'string') {
        rule = mono.str2regexp(rule);
      }
      return rule.test(url)
    });
  };

  mono.isIframe = function() {
    if (mono.isFF) {
      return window.parent !== window;
    } else {
      return window.top !== window.self;
    }
  };

  mono.uniFix = function() {
    if (mono.isOpera) {
      if (typeof location === 'undefined') {
        location = document.location;
      }
      if (typeof navigator === 'undefined') {
        navigator = window.navigator;
      }
      if (typeof localStorage === 'undefined') {
        localStorage = window.localStorage;
      }
      if (typeof CustomEvent === 'undefined') {
        CustomEvent = window.CustomEvent;
      }
      if (typeof XMLHttpRequest === 'undefined') {
        XMLHttpRequest = window.XMLHttpRequest;
      }
    }
    if (mono.isSafari && typeof CustomEvent === 'undefined') {
      CustomEvent = function (event, params) {
        params = params || { bubbles: false, cancelable: false };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
      };
      CustomEvent.prototype = window.Event.prototype;
    }
  };

  mono.userJsCheck = function() {
    try {
      if(window.sessionStorage && window.sessionStorage['savefrom-helper-userjs'] === '1') {
        mono.sendMessage({action: 'userjsDetected'});
      }
    } catch (e) {}
  };

  mono.onReady = function(moduleName, cb) {
    if (mono.isGM) {
      _modules[moduleName] = function() { cb(moduleName); };
      return;
    }

    if (mono.onReady.moduleList === undefined) {
      mono.onReady.moduleList = [];
    }
    if (mono.onReady.moduleList.indexOf(moduleName) !== -1) {
      return;
    }
    mono.onReady.moduleList.push(moduleName);

    mono.uniFix();

    if (window.sessionStorage) {
      try {
        window.sessionStorage['savefrom-helper-extension'] = '1';
      } catch (e) {}
    }

    if (mono.isChrome || mono.isFF || document.readyState === 'complete') {
      return setTimeout(function() {
        cb(moduleName);
        mono.userJsCheck();
      });
    }

    var complete = function() {
      document.removeEventListener( "DOMContentLoaded", complete, false );
      window.removeEventListener( "load", complete, false );
      cb(moduleName);
    };
    document.addEventListener('DOMContentLoaded', complete, false);
    window.addEventListener('load', complete, false);
  };

  mono.openTab = function(url, select, active) {
    select = (select === undefined)?true:!!select;
    if (mono.isChrome) {
      var options = {url: url, selected: select};
      if (active) {
        options.active = !!active;
      }
      chrome.tabs.create(options);
    }
    if (mono.isFF) {
      var tabs = require("sdk/tabs");
      tabs.open(url);
    }
    if (mono.isSafari) {
      var window = safari.application.activeBrowserWindow;
      var tab = window.openTab();
      tab.url = url;
      if (select) {
        tab.activate();
      }
    }
    if (mono.isOpera) {
      opera.extension.tabs.create({ url: url, focused: select });
    }
    if (mono.isGM) {
      GM_openInTab(url, {
        active: select,
        insert: true
      });
    }
  };
  mono.getCurrentPageUrl = function(cb) {
    if (mono.isChrome) {
      chrome.tabs.getSelected(null, function (tab) {
        cb(tab.url);
      });
    } else
    if (mono.isFF) {
      var tabs = require("sdk/tabs");
      cb(tabs.activeTab.url);
    } else
    if (mono.isSafari) {
      cb(safari.application.activeBrowserWindow.activeTab.url);
    } else
    if (mono.isOpera) {
      var tab = opera.extension.tabs.getFocused();
      cb(tab.url);
    } else
    if (mono.isGM) {
      cb(location.href);
    }
  };
  (function() {
    var newEvent = function (origType, _onEvent) {
      return function (e) {
        var event = {
          type: origType,
          target: e.target,
          stopPropagation: e.stopPropagation,
          preventDefault: e.preventDefault,
          stopImmediatePropagation: e.stopImmediatePropagation
        };
        _onEvent.call(this, event);
      };
    };

    var functionMap = {
      eventIndex: 0,
      replaceList: {}
    };

    mono.on = function(el, type, onEvent, useCapture) {
      if (type === 'mouseenter' || type === 'mouseleave') {
        if ((mono.isFF || (mono.isGM && !mono.isTM ) || mono.isSafari) && el === document && !useCapture) {
          el = document.body;
        }

        if (mono.noMouseEnter) {
          var cacheEventKey = 'eventIndex_';
          var _onEvent = onEvent;

          var origType = type;
          if (type === 'mouseenter') {
            type = 'mouseover';
            cacheEventKey += 1;
          } else
          if (type === 'mouseleave') {
            type = 'mouseout';
            cacheEventKey += 0;
          }

          if (_onEvent[cacheEventKey] === undefined) {
            var eventIndex = functionMap.eventIndex;
            _onEvent[cacheEventKey] = eventIndex;

            onEvent = newEvent(origType, _onEvent);

            functionMap.replaceList[eventIndex] = onEvent;
            functionMap.eventIndex++;
          } else {
            onEvent = functionMap.replaceList[_onEvent[cacheEventKey]];
          }
        }
      }

      el.addEventListener(type, onEvent, useCapture);
    };

    mono.off = function(el, type, onEvent, useCapture) {
      if (type === 'mouseenter' || type === 'mouseleave') {
        if ((mono.isFF || (mono.isGM && !mono.isTM ) || mono.isSafari) && el === document && !useCapture) {
          el = document.body;
        }

        if (mono.noMouseEnter) {
          var cacheEventKey = 'eventIndex_';
          if (type === 'mouseenter') {
            type = 'mouseover';
            cacheEventKey += 1;
          } else
          if (type === 'mouseleave') {
            type = 'mouseout';
            cacheEventKey += 0;
          }

          var eventIndex = onEvent[cacheEventKey];
          if (eventIndex !== undefined) {
            onEvent = functionMap.replaceList[eventIndex];
          }
        }
      }

      el.removeEventListener(type, onEvent, useCapture);
    };
  }());

  (function() {
    var vars = {
      lastUrl: undefined,
      timer: undefined,
      eventList: []
    };

    var checkUrlChange = function() {
      var url = document.location.href;

      if (vars.lastUrl === url) {
        return;
      }

      var oldUrl = vars.lastUrl;
      vars.lastUrl = url;

      for (var i = 0, len = vars.eventList.length; i < len; i++) {
        vars.eventList[i](vars.lastUrl, oldUrl);
      }
    };

    mono.onUrlChange = function(cb, now) {
      if (vars.eventList.indexOf(cb) !== -1) {
        return;
      }

      var currentUrl = window.location.href;

      vars.eventList.push(cb);

      now && cb(currentUrl);

      if (vars.eventList.length > 1) {
        return;
      }

      vars.lastUrl = currentUrl;

      vars.timer = setInterval(checkUrlChange, 1000);

      // window.addEventListener('popstate', onUrlChangeListener);
    };

    mono.offUrlChange = function(cb) {
      var pos = vars.eventList.indexOf(cb);
      if (pos === -1) {
        return;
      }
      vars.eventList.splice(pos, 1);

      if (vars.eventList.length === 0) {
        clearInterval(vars.timer);
        // window.removeEventListener('popstate', onUrlChangeListener);
      }
    };

    mono.clearUrlChange = function() {
      vars.eventList.splice(0);
      clearInterval(vars.timer);
    };
  }());

  mono.global = {};

  mono.initGlobal = function(cb, args) {
    args = args || [];
    if (mono.global.language && mono.global.preference && args.length === 0) {
      return cb({getLanguage: mono.global.language, getPreference: mono.global.preference});
    }
    mono.sendMessage(['getLanguage', 'getPreference'].concat(args), function(response) {
      mono.global.language = response.getLanguage;
      mono.global.preference = response.getPreference;
      cb(response);
    });
  };

  mono.getParentByClass = function(el, classList) {
    if (typeof classList === 'string') {
      classList = [classList];
    }

    for(var parent = el; parent; parent = parent.parentNode) {
      if (parent.nodeType !== 1) {
        return null;
      }
      for (var i = 0, className; className = classList[i]; i++) {
        if (parent.classList.contains(className)) {
          return parent;
        }
      }
    }

    return null;
  };

  mono.parseUrlParams = function(url, options) {
    options = options || {};
    var startFrom = url.indexOf('?');
    var query = url;
    if (!options.argsOnly && startFrom !== -1) {
      query = url.substr(startFrom + 1);
    }
    var sep = options.forceSep || '&';
    if (!options.forceSep && query.indexOf('&amp;') !== -1) {
      sep = '&amp;';
    }
    var dblParamList = query.split(sep);
    var params = {};
    for (var i = 0, len = dblParamList.length; i < len; i++) {
      var item = dblParamList[i];
      var ab = item.split('=');
      if (options.useDecode) {
        params[ab[0]] = decodeURIComponent(ab[1] || '');
      } else {
        params[ab[0]] = ab[1] || '';
      }

    }
    return params;
  };

  mono.throttle = function(fn, threshhold, scope) {
    threshhold = threshhold || 250;
    var last;
    var deferTimer;
    return function () {
      var context = scope || this;

      var now = Date.now();
      var args = arguments;
      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  mono.debounce = function(fn, delay) {
    var timer = null;
    return function () {
      var context = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  };

  mono.getDomain = function(url) {
    var m = url.match(/:\/\/(?:[^\/?#]*@)?([^:\/?#]+)/);
    if (m) {
      return m[1];
    }
  };

  // legacy

  mono.getQueryString = function(query, key_prefix, key_suffix) {
    if(!query || typeof(query) != 'object')
      return '';

    if(key_prefix === undefined)
      key_prefix = '';

    if(key_suffix === undefined)
      key_suffix = '';

    var str = '';
    for(key in query)
    {
      if(str.length)
        str += '&';

      if(query[key] instanceof Object)
      {
        if(!key_prefix)
          key_prefix = '';

        if(!key_suffix)
          key_suffix = '';

        str += mono.getQueryString(query[key], key_prefix + key + "[", "]" + key_suffix);
      }
      else
        str += key_prefix + escape(key) + key_suffix + '=' + escape(query[key]);
    }

    return str;
  };

  mono.decodeUnicodeEscapeSequence = function(text) {
    return JSON.parse(JSON.stringify(text)
      .replace(mono.decodeUnicodeEscapeSequence.re, '$1'));
  };
  mono.decodeUnicodeEscapeSequence.re = /\\(\\u[0-9a-f]{4})/g;

  mono.fileName = {
    maxLength: 80,

    rtrim: /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

    illegalRe: /[\/\?<>\\:\*\|":]/g,

    controlRe: /[\x00-\x1f\x80-\x9f]/g,

    reservedRe: /^\.+$/,

    trim: function(text) {
      return text.replace(this.rtrim);
    },

    partsRe: /^(.+)\.([a-z0-9]{1,4})$/i,

    getParts: function (name) {
      return name.match(this.partsRe);
    },

    specialChars: ('nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2' +
    ',sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml' +
    ',Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml' +
    ',times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil' +
    ',egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash' +
    ',ugrave,uacute,ucirc,uuml,yacute,thorn,yuml').split(','),
    specialCharsList: [['amp','quot','lt','gt'], [38,34,60,62]],

    specialCharsRe: /&([^;]{2,6});/g,

    decodeSpecialChars: function(text) {
      var _this = this;
      return text.replace(this.specialCharsRe, function(text, word) {
        var code;
        if (word[0] === '#') {
          code = parseInt(word.substr(1));
          if (isNaN(code)) return '';
          return String.fromCharCode(code);
        }
        var pos = _this.specialCharsList[0].indexOf(word);
        if (pos !== -1) {
          code = _this.specialCharsList[1][pos];
        }
        pos = _this.specialChars.indexOf(word);
        if (pos !== -1) {
          code = pos + 160;
        }
        if (code !== undefined) {
          return String.fromCharCode(code);
        }
        return '';
      });
    },

    rnRe: /\r?\n/g,

    re1: /[\*\?"]/g,

    re2: /</g,

    re3: />/g,

    spaceRe: /[\s\t\uFEFF\xA0]+/g,

    dblRe: /(\.|\!|\?|_|,|\-|\:|\+){2,}/g,

    re4: /[\.,:;\/\-_\+=']$/g,

    modify: function (name) {
      if (!name) {
        return '';
      }

      name = mono.decodeUnicodeEscapeSequence(name);

      try {
        name = decodeURIComponent(name);
      } catch (err) {
        name = unescape(name);
      }

      name = this.decodeSpecialChars(name);

      name = name.replace(this.rnRe, ' ');

      name = this.trim(name);

      name = name.replace(this.re1, '')
        .replace(this.re2, '(')
        .replace(this.re3, ')')
        .replace(this.spaceRe, ' ')
        .replace(this.dblRe, '$1')
        .replace(this.illegalRe, '_')
        .replace(this.controlRe, '')
        .replace(this.reservedRe, '')
        .replace(this.re4, '');

      if (name.length <= this.maxLength) {
        return name;
      }

      var parts = this.getParts(name);
      if (parts && parts.length == 3) {
        parts[1] = parts[1].substr(0, this.maxLength);
        return parts[1] + '.' + parts[2];
      }

      return name;
    }
  };
  mono.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  };
  mono.dataAttr2Selector = function(dataName) {
    return 'data-'+dataName.replace(/[A-Z]/g, function(char) {
        return '-'+char.toLowerCase();
      });
  };
  mono.isEmptyObject = function(obj) {
    for (var item in obj) {
      return false;
    }
    return true;
  };
  //<utils

  return mono;
}));