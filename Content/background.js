(function() {
  if (typeof window !== 'undefined') return;
  var _window = require('sdk/window/utils').getMostRecentBrowserWindow();
  window = {
    navigator: _window.navigator,
    URL: _window.URL
  };
  if (window.URL && !window.URL.prototype.hasOwnProperty('hostname')) {
    window.URL = undefined;
  }
  _window = null;
  var self = require('sdk/self');
  mono = require('toolkit/loader').main(require('toolkit/loader').Loader({
    paths: {
      'data/': self.data.url('js/')
    },
    name: self.name,
    prefixURI: self.data.url().match(/([^:]+:\/\/[^/]+\/)/)[1],
    globals: {
      console: console,
      _require: function(path) {
        switch (path) {
          case 'sdk/simple-storage':
            return require('sdk/simple-storage');
          case 'sdk/net/xhr':
            return require('sdk/net/xhr');
          case 'sdk/tabs':
            return require('sdk/tabs');
          default:
            console.log('Module not found!', path);
        }
      }
    }
  }), "data/mono");
  self = null;
})();

var engine = (function() {
  var var_cache = {
    // helper name
    helperName: undefined,
    // extension version
    version: undefined,
    // engine ready state
    isReady: false,
    // cache userjsdetected state
    userjsDetected: undefined,
    // trackTime for userTrack
    trackTime: undefined,
    // uuid cache
    uuid: undefined,
    isEnable: 1,
    opButton: null,
    //current language from navigator
    language: undefined,
    langList: ['de', 'en', 'ru', 'tr', 'uk', 'es', 'fr', 'id'],
    // user country
    country: undefined,
    // init fail count
    initRetry: 0,
    fromId: undefined,
    metaRetry: 0,
    hasSovetnik: false,
    hasAdvisor: false
  };

  var defaultPreferences = {
    version: '0',
    enable: 1,
    button: 1,
    lmFileHosting: 1,
    lmMediaHosting: 1,
    moduleYoutube: 1,
    moduleDailymotion: 1,
    moduleVimeo: 1,
    moduleFacebook: 1,
    moduleSoundcloud: 1,
    moduleVkontakte: 1,
    moduleOdnoklassniki: 1,
    moduleMailru: 1,
    moduleShowDownloadInfo: 1,
    ytHideFLV: 0,
    ytHideMP4: 0,
    ytHideWebM: 1,
    ytHide3GP: 1,
    ytHide3D: 1,
    ytHideMP4NoAudio: 1,
    ytHideAudio_MP4: 1,
    vkShowBitrate: 0,
    sovetnikEnabled: 1,
    showUmmyInfo: 1,
    gmNativeDownload: 0,
    expIndex: 0
  };

  var preferences = {};

  var preferenceMap = {
    youtube: 'moduleYoutube',
    dailymotion: 'moduleDailymotion',
    vimeo: 'moduleVimeo',
    facebook: 'moduleFacebook',
    soundcloud: 'moduleSoundcloud',
    vk: 'moduleVkontakte',
    odnoklassniki: 'moduleOdnoklassniki',
    mailru: 'moduleMailru'
  };

  var onOptionChange = {
    enable: function() {
      setButtonParams();
      if (mono.isGM) {
        _menu.setEnabled(preferences.enable);
        registerMenuCommands(_moduleName, preferences.enable);
      }
      tabListener.start();
    },
    button: function(enabled) {
      if (mono.isOpera) {
        operaShowButton(enabled);
      } else
      if (mono.isGM) {
        gmShowButton(enabled);
      }
    },
    sovetnikEnabled: function() {
      tabListener.start();
    },
    lmFileHosting: function() {
      tabListener.start();
    },
    lmMediaHosting: function() {
      tabListener.start();
    },
    gmNativeDownload: !mono.isGM ? undefined : function(value) {
      preferences.downloads = !!value;
      if (mono.global.preference) {
        // GM only!
        mono.global.preference.downloads = preferences.downloads;
      }
    }
  };

  var msgAction = {
    getLanguage: function(message, cb) {
      cb(language);
    },
    getNavigatorLanguage: function(msg, cb) {
      cb(var_cache.language);
    },
    getPreference: function(message, cb) {
      var pref = preferences;
      if (mono.isSafari || mono.isGM) {
        pref = mono.extend({}, preferences);
      }
      cb(pref);

      userTrack();

      mono.msgClean();
    },
    getVersion: function(message, cb) {
      cb(var_cache.version);
    },
    updateOption: function(message, cb) {
      preferences[message.key] = message.value;
      var obj = {};
      obj[message.key] = message.value;
      mono.storage.set(obj);
      if (onOptionChange[message.key] !== undefined) {
        onOptionChange[message.key](message.value);
      }
    },
    enableExtension: function() {
      preferences.enable = (preferences.enable)?0:1;
      mono.storage.set({enable: preferences.enable});
      onOptionChange.enable();
    },
    downloadFromCurrentPage: function() {},
    openPoll: function() {},
    reportBug: function() {},
    viaMenu_updateLinks: function() {
      mono.sendMessageToActiveTab({action: 'updateLinks'});
    },
    viaMenu_downloadMP3Files: function() {
      mono.sendMessageToActiveTab({action: 'downloadMP3Files'});
    },
    viaMenu_downloadPlaylist: function() {
      mono.sendMessageToActiveTab({action: 'downloadPlaylist'});
    },
    viaMenu_downloadPhotos: function() {
      mono.sendMessageToActiveTab({action: 'downloadPhotos'});
    },
    viaMenu_changeState: function(msg) {
      if (Array.isArray(msg.prefKey)) {
        for (var i = 0, key; key = msg.prefKey[i]; i++) {
          msgAction.updateOption({key: key, value: msg.state});
        }
      } else {
        msgAction.updateOption({key: msg.prefKey, value: msg.state});
      }

      if (msg.state && msg.moduleName === 'lm' && msg.needInclude) {
        tabListener.injectLmInActiveTab();
        return;
      }
      mono.sendMessageToActiveTab({action: 'changeState', state: msg.state});
    },
    showOptions: mono.isGM ? function() {
      _options.show();
    } : function() {
      var url = 'options.html';
      if (mono.isFF) {
        url = require('sdk/self').data.url(url);
      } else
      if (mono.isSafari) {
        url = safari.extension.baseURI + url;
      }
      mono.openTab(url, true);
    },
    getActiveTabModuleInfo: function(msg, cb) {
      mono.sendMessageToActiveTab({action: 'getModuleInfo', url: msg.url}, function(moduleInfo) {
        cb(moduleInfo);
      });
    },
    getActiveTabUrl: function(message, cb) {
      mono.getCurrentPageUrl(cb);
    },
    getActiveTabInfo: function(msg, cb) {
      mono.getCurrentPageUrl(function(url) {
        if (url.indexOf('http') !== 0) {
          return cb({});
        }
        var hostname = mono.getDomain(url);
        var hostList = {
          dailymotion: [/.?dailymotion\.*/],
          facebook: [/.?facebook\.com$/],
          mailru: [/^my\.mail\.ru$/],
          odnoklassniki: [/.?ok\.ru$/, /.?odnoklassniki\.ru$/],
          savefrom: [/.?savefrom\.net$/],
          soundcloud: [/.?soundcloud\.com$/],
          vimeo: [/.?vimeo\.com$/],
          vk: [/.?vk\.com$/, /.?vkontakte\.ru$/],
          youtube: [/.?youtube\.com$/]
        };
        if (!hostname) {
          return cb({});
        }
        var moduleName = 'lm';
        var prefKey;
        var state;
        var found = 0;
        for (var key in hostList) {
          var regList = hostList[key];
          for (var i = 0, reg; reg = regList[i]; i++) {
            if (reg.test(hostname)) {
              moduleName = key;
              prefKey = preferenceMap[moduleName];
              state = preferences[prefKey];
              found = 1;
              break;
            }
          }
          if (found === 1) {
            break;
          }
        }
        if (moduleName === 'lm') {
          prefKey = ['lmFileHosting', 'lmMediaHosting'];
          state = preferences.lmFileHosting || preferences.lmMediaHosting;
        }
        cb({moduleName: moduleName, prefKey: prefKey, url: url, state: state});
      });
    },
    popupResize: mono.isSafari ? function(message) {
      safari.extension.popovers[0].height = message.height;
    } : mono.isOpera ? function(message) {
      if (var_cache.opButton === null) {
        return;
      }
      var_cache.opButton.popup.height = message.height;
      var_cache.opButton.popup.width = message.width;
    } : function() {},
    userjsDetected: function(message, cb) {},
    hasSovetnik: function(message, cb) {
      cb(var_cache.hasSovetnik || var_cache.hasAdvisor);
    },
    getBrowser: function(message, cb) {
      cb(var_cache.helperName);
    },
    hideDownloadWarning: function(message, cb) {
      if (message.set !== undefined) {
        return mono.storage.set({hideDownloadWarning: message.set});
      }
      mono.storage.get('hideDownloadWarning', function(storage) {
        cb(storage.hideDownloadWarning);
      });
    },
    storage: function(message, cb) {
      if (message.subaction === 'clear') {
        return;
      }
      mono.storage[message.subaction](message.data, cb);
    },
    trackEvent: function(message) {
      if (message.label === '%domain%') {
        return mono.getCurrentPageUrl(function(cUrl) {
          message.label = mono.getDomain(cUrl);
          trackEvent(message.category, message.event, message.label);
        });
      }
      trackEvent(message.category, message.event, message.label);
    },
    trackSocial: function(message) {
      trackSocial(message.target, message.event, message.network);
    },
    trackCohort: function(message) {
      if (!preferences.inCohort) {
        return;
      }
      if (message.label === '%domain%') {
        return mono.getCurrentPageUrl(function(cUrl) {
          message.label = mono.getDomain(cUrl);
          userInCohort.track.event(message.category, message.event, message.label);
        });
      }
      userInCohort.track.event(message.category, message.event, message.label);
    },
    addToClipboard: mono.isFF ? function(message) {
      var clipboard = require("sdk/clipboard");
      clipboard.set(message.text);
    } : mono.isChrome ? function(message) {
      var text = message.text;
      var textArea;
      document.body.appendChild(textArea = mono.create('textarea', {
        text: text
      }));
      textArea.select();
      setTimeout(function() {
        document.execCommand("copy", false, null);
        textArea.parentNode.removeChild(textArea);
      });
    } : function() {}
  };

  var msgWaitList = [];

  var onMessage = function(message, cb) {
    if (var_cache.isReady === false) {
      msgWaitList.push(arguments);
      return;
    }
    var action = message.action || message;
    if (msgAction[action] !== undefined) {
      return msgAction[action](message, cb);
    }
    for (var moduleName in engine.modules) {
      var module = engine.modules[moduleName];
      if (module[action] !== undefined) {
        return module[action](message, cb);
      }
    }
    if (utils[action] !== undefined) {
      return utils[action](message, cb);
    }
  };

  var requestCountry = function() {
    var xh = preferences.helper+' '+var_cache.version;
    mono.ajax({
      type: 'POST',
      url: '',
      data: {
        sig: xh.length
      },
      headers: {
        'X-Helper': xh
      },
      success: function(data) {
        if (!data) {
          return;
        }
        data = data.toLowerCase().substr(0, 2);
        mono.storage.set({
          country: data,
          countryExpire: String(parseInt( Date.now() / 1000 ) + 259200)
        });
      }
    });
  };

  var langIsInList = function(lang, langList) {
    lang = String(lang || '').toLowerCase().substr(0, 2);

    if (langList.indexOf(lang) !== -1) {
      return true;
    }

    if (!var_cache.country ||
      !var_cache.countryExpire ||
      var_cache.countryExpire < parseInt(Date.now() / 1000)) {
      requestCountry();
    }

    if (langList.indexOf(var_cache.country) !== -1) {
      return true;
    }

    return false;
  };

  var hasSovetnik = function() {
    if (!mono.isFF && !mono.isChrome && !mono.isGM && !mono.isOpera) {
      return false;
    }
    if (mono.isFF && !var_cache.ffButton) {
      return false;
    }
    return true;
  };

  var loadSettings = function(cb) {
    var keys = [];
    for (var key in defaultPreferences) {
      keys.push(key);
    }

    keys.push('fromId');
    keys.push('meta');
    keys.push('metaRetry');
    keys.push('ytDechipList');
    keys.push('country');
    keys.push('countryExpire');
    keys.push('uuid');


    mono.storage.get(keys, function(storage) {
      for (var key in defaultPreferences) {
        var defaultValue = defaultPreferences[key];
        if (storage[key] === undefined) {
          storage[key] = defaultValue;
        } else
        if (typeof storage[key] === 'string' && typeof defaultValue === 'number') {
          var tValue = parseInt(storage[key]);
          if (!isNaN(tValue)) {
            storage[key] = tValue;
          }
        }
        preferences[key] = storage[key];
      }

      var_cache.fromId = storage.fromId;
      var_cache.meta = storage.meta || {};
      var_cache.metaRetry = storage.metaRetry || 0;
      var_cache.country = storage.country;
      var_cache.countryExpire = storage.countryExpire;
      var_cache.uuid = storage.uuid;
      engine.ytDechipList = storage.ytDechipList || {};

      if (mono.isChrome) {
        if (mono.isChromeVersion < 31) {
          preferences.downloads = false;
          preferences.moduleShowDownloadInfo = 0;
          preferences.iframeDownload = false;
        } else {
          preferences.downloads = chrome.downloads !== undefined;
          if (preferences.downloads) {
            preferences.moduleShowDownloadInfo = 0;
            preferences.iframeDownload = false;
          } else {
            preferences.iframeDownload = true;
          }
        }
      } else {
        preferences.moduleShowDownloadInfo = 0;
      }
      if (mono.isGM) {
        if (mono.isTM) {
          preferences.iframeDownload = true;
        }
        preferences.downloads = false;
        if ( typeof GM_download !== 'undefined' && (preferences.gmNativeDownload || GM_info.downloadMode === 'browser') ) {
          preferences.gmNativeDownload = 1;
          preferences.downloads = true;
        }
      }
      if (mono.isFF && var_cache.ffButton) {
        preferences.downloads = true;
      }
      if (cb !== undefined) {
        cb();
      }
    });
  };

  var language = {};

  var loadLanguage = function(cb, forceLocale) {
    var locale, lang;
    var currentLanguage = var_cache.language.substr(0,2);
    var availableLang = var_cache.langList.indexOf(currentLanguage) !== -1 ? currentLanguage : 'en';
    var url = '_locales/{locale}/messages.json';
    if (mono.isChrome) {
      locale = chrome.i18n.getMessage('lang');
      url = url.replace('{locale}', forceLocale || locale);
    } else
    if (mono.isFF) {
      locale = require("sdk/l10n").get('lang');
      if (locale === 'lang') {
        locale = availableLang;
      }
      url = url.replace('{locale}', forceLocale || locale);
      try {
        lang = require('sdk/self').data.load(url);
        lang = JSON.parse(lang);
      } catch (e) {
        if (forceLocale !== undefined) {
          return cb();
        }
        return loadLanguage(cb, 'en');
      }
      for (var key in lang) {
        language[key] = lang[key].message;
      }
      return cb();
    } else
    if (mono.isSafari || mono.isOpera) {
      url = url.replace('{locale}', forceLocale || availableLang);
    } else
    if (mono.isGM) {
      lang = _languageList[currentLanguage] || _languageList['en'];
      for (var key in lang) {
        language[key] = lang[key].message;
      }
      return cb();
    }
    mono.ajax({
      mimeType: "application/json",
      dataType: 'json',
      url: url,
      success: function(lang) {
        for (var key in lang) {
          language[key] = lang[key].message;
        }
        cb();
      },
      error: function() {
        if (forceLocale !== undefined) {
          return cb();
        }
        loadLanguage(cb, 'en');
      }
    });
  };

  var getBrowserName = function() {
    var browser = '';
    if(navigator && navigator.userAgent) {
      //console.log(navigator.userAgent);
      if(navigator.userAgent.indexOf('YaBrowser\/') !== -1) {
        browser = 'yabrowser';
      } else
      if(navigator.userAgent.indexOf('Maxthon\/') !== -1) {
        browser = 'maxthon';
      } else
      if(navigator.userAgent.indexOf('OPR\/') !== -1) {
        browser = 'opera-chromium';
      } else
      if(navigator.userAgent.indexOf('Opera\/') !== -1) {
        browser = 'opera';
      } else
      if(navigator.userAgent.indexOf('Firefox\/') !== -1) {
        browser = 'firefox';
      } else
      if(navigator.userAgent.indexOf('Chrome\/') !== -1) {
        browser = 'chrome';
      } else
      if(navigator.userAgent.indexOf('Safari\/') !== -1) {
        browser = 'safari';
      }
    }
    return browser;
  };

  var getHelperName = function() {
    if (mono.isChrome) {
      var browser = getBrowserName();
      if (browser) {
        return browser;
      }
      return 'chrome';
    }
    if (mono.isFF) {
      if (!var_cache.ffButton) {
        return 'firefox-mobile';
      }
      if (engine.ffNoStore) {
        return 'firefox-sf';
      }
      return 'firefox';
    }
    if (mono.isSafari) {
      return 'safari';
    }
    if (mono.isOpera) {
      return 'opera';
    }
    if (mono.isGM) {
      return 'userjs-' + getBrowserName();
    }

    return 'undefined';
  };

  var setButtonParams = function() {
    if (preferences.enable === var_cache.isEnable) {
      return;
    }
    var_cache.isEnable = preferences.enable;
    if (mono.isGM) {
      return;
    }
    if (mono.isChrome) {
      var icon = {path: 'img/icon_18.png'};
      var title = {title: language.titleDefault};

      if (!preferences.enable) {
        title.title = language.titleDesabled;
        icon.path = 'img/icon_disabled_18.png';
      }

      chrome.browserAction.setIcon(icon);
      chrome.browserAction.setTitle(title);
    }
    if (mono.isFF) {
      var self = require('sdk/self');
      if (!var_cache.ffButton) {
        return;
      }
      if (preferences.enable) {
        var_cache.ffButton.icon = {
          '16': self.data.url('img/icon_16.png'),
          '32': self.data.url('img/icon_32.png'),
          '64': self.data.url('img/icon_64.png')
        };
        var_cache.ffButton.label = language.titleDefault;
      } else {
        var_cache.ffButton.icon = {
          '16': self.data.url('img/icon_disabled_16.png'),
          '32': self.data.url('img/icon_disabled_18.png'),
          '64': self.data.url('img/icon_disabled_18.png')
        };
        var_cache.ffButton.label = language.titleDesabled;
      }
      if (var_cache.ffButton.update) {
        var_cache.ffButton.update(var_cache.ffButton);
      }
    }
    if (mono.isSafari) {
      var prefix = '';
      if (window.devicePixelRatio > 1) {
        prefix = '@2x';
      }
      if (preferences.enable) {
        safari.extension.toolbarItems[0].image = safari.extension.baseURI + 'Icon-16'+prefix+'.png';
        safari.extension.toolbarItems[0].toolTip = language.titleDefault;
      } else {
        safari.extension.toolbarItems[0].image = safari.extension.baseURI + 'Icon-16-disabled'+prefix+'.png';
        safari.extension.toolbarItems[0].toolTip = language.titleDesabled;
      }
    }
    if (mono.isOpera && var_cache.opButton !== null) {
      if (preferences.enable) {
        var_cache.opButton.title = language.titleDefault;
        var_cache.opButton.icon = 'img/icon_18.png';
      } else {
        var_cache.opButton.title = language.titleDesabled;
        var_cache.opButton.icon = 'img/icon_disabled_18.png';
      }
    }
  };

  var getHelperVersion = function(cb) {
    if (mono.isChrome) {
      cb(chrome.app.getDetails().version);
    } else
    if (mono.isFF) {
      cb(require('sdk/self').version);
    }
    if (mono.isSafari) {
      mono.ajax({
        url: safari.extension.baseURI + 'Info.plist',
        success: function(data, xhr) {
          var parser=new DOMParser();
          var xmlDoc=parser.parseFromString(xhr.responseText,"text/xml");
          var elList = xmlDoc.getElementsByTagName('key');
          for (var i = 0, el; el = elList[i]; i++) {
            if (el.textContent === 'CFBundleShortVersionString') {
              return cb(el.nextElementSibling.textContent);
            }
          }
        },
        error: function() {
          cb('unknown');
        }
      });
    }
    if (mono.isOpera) {
      cb(widget.version);
    }
    if (mono.isGM) {
      var version = 'undefined';
      if(GM_info.script) {
        version = GM_info.script.version;
      }
      cb(version);
    }
  };

  var gmShowButton = function(enabled) {
    if (enabled) {
      _menu.setTitle(language.extName, var_cache.version);
      mono.storage.get('gmIconTop', function(storage) {
        if (storage.gmIconTop === 0 || storage.gmIconTop) {
          _menu.style.menu.initial.top = storage.gmIconTop + 'px';
        }
        _menu.create(preferences.enable);
      });
    } else {
      _menu.hide();
    }
  };

  var operaShowButton = function(enabled) {
    if (var_cache.opButton !== null) {
      opera.contexts.toolbar.removeItem(var_cache.opButton);
      var_cache.opButton = null;
    }
    if (!enabled) {
      return;
    }
    var_cache.opButton = opera.contexts.toolbar.createItem({});
    var_cache.isEnable = 1;
    setButtonParams();
    opera.contexts.toolbar.addItem(var_cache.opButton);
  };

  var langNormalization = function(lang) {
    lang = String(lang || '').toLowerCase();
    var m = lang.match(/\(([^)]+)\)/);
    if (m && m.length > 1) {
      lang = m[1];
    }
    var tPos = lang.indexOf('-');
    if (tPos !== -1) {
      var left = lang.substr(0, tPos);
      var right = lang.substr(tPos + 1);
      if (left === right) {
        lang = left;
      } else {
        lang = left + '-' + right.toUpperCase();
      }
    }
    return lang;
  };

  var expGetExpIndex = function(type) {
    if (type === 'firstRun') {
      var value = mono.getRandomInt(0, 100);

      for (var index in engine.expList) {
        var item = engine.expList[index];
        if (value < item.percent) {
          return parseInt(index);
        }

        value -= item.percent;
      }
    }

    return 0;
  };

  var expDisable = function() {
    if (preferences.expIndex > 0) {
      msgAction.updateOption({key: 'expIndex', value: 0});
    }
  };

  var expRun = function(expIndex) {
    if (!engine.expList.hasOwnProperty(expIndex)) {
      expDisable();
      return;
    }
    engine.expList[expIndex](preferences, var_cache);
  };

  var expInitList = function(cb) {
    if (mono.isEmptyObject(engine.expList)) {
      expDisable();
      return cb();
    }

    if (!var_cache.metaRetry && preferences.version !== '0' && preferences.version === var_cache.version) {
      // just run
      expRun(preferences.expIndex);
      return cb();
    }

    var onError = function() {
      if (var_cache.meta.exp === undefined || var_cache.metaRetry > 4) {
        var_cache.metaRetry && mono.storage.set({metaRetry: 0});
        expDisable();
      } else {
        expRun(preferences.expIndex);
        var_cache.metaRetry++;
        mono.storage.set({metaRetry: var_cache.metaRetry});
      }
      return cb();
    };

    mono.ajax({
      url: '',
      timeout: 1000,
      dataType: 'JSON',
      success: function(meta) {
        var_cache.metaRetry && mono.storage.set({metaRetry: 0});
        var_cache.meta = meta = meta || {};
        mono.storage.set({meta: meta});
        var metaExpList = meta.exp || {};
        for (var index in engine.expList) {
          var item = metaExpList[index];
          if (!item || !item.enable) {
            delete engine.expList[index];
            continue;
          }
          engine.expList[index].percent = item.percent || 0;
        }

        var expIndex;
        if (preferences.version === '0') {} else
        if (preferences.version !== var_cache.version) {}

        expRun(preferences.expIndex);

        return cb();
      },
      onTimeout: onError,
      error: onError
    });
  };

  var prepare = function(cb) {
    var t = 0;
    var rCount = 3;
    var ready = function() {
      t++;
      if (t === rCount) {
        return expInitList(cb);
      }
    };

    var_cache.helperName = getHelperName();
    var_cache.language = langNormalization(mono.isFF ? window.navigator.language : navigator.language);

    loadLanguage(function() {
      ready();
    });

    localStorageMigrate(function() {
      loadSettings(function() {
        if (hasSovetnik()) {
          var_cache.hasSovetnik = langIsInList(var_cache.language, [
            'be', 'kk', 'ru', 'uk',
            'hy', 'ro', 'az', 'ka',
            'uz', 'lv', 'lt', 'et',
            'tg', 'sv', 'tk'
          ]);
        }
        ready();
      });
    });

    getHelperVersion(function(version) {
      var_cache.version = version;
      ready();
    });
  };

  var init = function(addon, button, monoLib) {
    if (addon !== undefined) {
      var_cache.monoLib = monoLib;
      mono = mono.init(addon);
      engine.modules.vimeo = require('./vimeo_com_embed.js').init(mono);
      engine.modules.dailymotion = require('./dailymotion_com_embed.js').init(mono);
      engine.modules.youtube = require('./youtube_com_embed.js').init(mono, engine, {platform: window.navigator.platform});
      engine.modules.soundcloud = require('./soundcloud_com_embed.js').init(mono);
      engine.modules.vkontakte = require('./vkontakte_ru_embed.js').init(mono, engine);
      engine.modules.odnoklassniki = require('./odnoklassniki_ru_embed.js').init(mono);
      engine.modules.facebook = require('./facebook_com_embed.js').init(mono);
      engine.modules.mail_ru = require('./mail_ru_embed.js').init(mono, engine.modules.odnoklassniki);
      utils = require('./utils.js').init(mono);
      var_cache.ffButton = button;
    }

    mono.pageId = 'bg';

    mono.onMessage.call({
      isBg: true
    }, function (message, response) {
      if (Array.isArray(message)) {
        var countWait = message.length;
        var countReady = 0;
        var resultList = {};
        var ready = function (key, data) {
          countReady += 1;
          resultList[key] = data;
          if (countWait === countReady) {
            response(resultList);
          }
        };
        message.forEach(function (msg) {
          onMessage(msg, function (data) {
            ready(msg.action || msg, data);
          });
        });
        return;
      }
      onMessage(message, response);
    });

    prepare(function(){
      if (mono.isFF && !engine.ffNoStore && var_cache.hasSovetnik) {
        engine.sovetnikModule = require('./sovetnik.lib.js');
        engine.sovetnikModule.initSf(msgAction.updateOption, preferences);
      }

      preferences.country = var_cache.country;
      preferences.helper = var_cache.helperName;
      if (preferences.helper === 'firefox-sf') {
        preferences.helper = 'ff-sf';
      } else
      if (preferences.helper === 'firefox-mobile') {
        preferences.helper = 'ff-mobile';
      } else
      if (preferences.helper === 'firefox') {
        preferences.helper = 'ff';
      }

      setButtonParams();

      checkVersion();

      userInCohort.run();

      var_cache.isReady = true;
      msgWaitList.forEach(function(args) {
        onMessage.apply(null, args);
      });
      msgWaitList = [];

      if (mono.isGM && !mono.isIframe()) {
        registerMenuCommands(_moduleName, preferences.enable);

        if (preferences.button && preferences[preferenceMap[_moduleName]] || _moduleName === 'savefrom') {
          gmShowButton(1);
        }
      }

      if (mono.isOpera) {
        operaShowButton(preferences.button);
      }

      tabListener.start();
    });

    if (mono.isSafari) {
      safari.extension.settings.addEventListener('change', function(event){
        if (event.key !== 'show_options') {
          return;
        }
        var window = safari.application.activeBrowserWindow;
        var tab = window.openTab();
        tab.url = safari.extension.baseURI + 'options.html';
        tab.activate();
      });
    }
  };

  var tabListener = {
    listen: false,
    state: false,
    chMessageSender: undefined,
    rHostname: /:\/\/(?:[^@\/?#]+@)?([^\/?:#]+)/,
    excludeList: [
      "*.google.*",
      "*.acidtests.org",

      "*.savefrom.net",
      "*.youtube.com",
      "*.vimeo.com",
      "*.dailymotion.*",
      "*.vk.com",
      "*.vkontakte.ru",
      "*.odnoklassniki.ru",
      "my.mail.ru",
      "*.ok.ru",
      "*.soundcloud.com",
      "*.facebook.com"
    ],
    matchCache: undefined,
    createMatchCache: function() {
      var rList = [];
      for (var i = 0, item; item = tabListener.excludeList[i]; i++) {
        var regexp = item.replace(/\./g, '\\.').replace(/\*\\\./, '\\.?').replace(/\.\*/g, '..?');
        if (item.substr(item.length-1, 1) !== '*') {
          regexp += '$';
        }
        if (item[0] !== '*') {
          regexp = '^'+regexp;
        }
        rList.push(regexp);
      }
      tabListener.matchCache = new RegExp(rList.join('|'), 'i');
    },
    checkUrl: typeof window.URL === 'function' ? function(url) {
      if (url.substr(0, 4) !== 'http') {
        return;
      }
      var hostname = (new window.URL(url)).hostname;
      if (!hostname || tabListener.matchCache.test(hostname)) {
        return;
      }
      return hostname;
    } : function(url) {
      if (url.substr(0, 4) !== 'http') {
        return;
      }

      var hostname = url.match(tabListener.rHostname);
      if (hostname === null) {
        return;
      }
      hostname = hostname[1];
      if (tabListener.matchCache.test(hostname)) {
        return;
      }
      return hostname;
    },
    onChange: mono.isChrome ? function(tab, tabId, noSovetnik) {
      chrome.tabs.executeScript(tabId, { file: 'js/mono.js', runAt: 'document_end' }, function() {
        if (preferences.lmFileHosting || preferences.lmMediaHosting) {
          chrome.tabs.executeScript(tabId, { file: 'includes/components.js', runAt: 'document_end' }, function() {
            chrome.tabs.executeScript(tabId, { file: 'includes/link_modifier.js', runAt: 'document_end' });
          });
        }
        if (!noSovetnik && preferences.sovetnikEnabled) {
          if (var_cache.hasSovetnik) {
            chrome.tabs.executeScript(tabId, {file: 'includes/sovetnik-sf.js'});
          } else
          if (var_cache.hasAdvisor) {
            chrome.tabs.executeScript(tabId, {file: 'includes/advisor-sf.js'});
          }
        }
      });
    } : mono.isFF ? function(tab, hostname, noSovetnik) {
      var self = require('sdk/self');
      var list = [self.data.url('js/mono.js')];

      if (preferences.lmFileHosting || preferences.lmMediaHosting) {
        list.push(self.data.url('includes/components.js'));
        list.push(self.data.url('includes/link_modifier.js'));
      }

      var options = {
        contentScriptFile: list
      };

      var setPort = false;
      if (!noSovetnik && preferences.sovetnikEnabled) {
        if (engine.ffNoStore) {
          if (var_cache.hasSovetnik) {
            list.push(self.data.url('includes/sovetnik-sf.js'));
          } else
          if (var_cache.hasAdvisor) {
            list.push(self.data.url('includes/advisor-sf.js'));
          }
        } else
        if (!engine.sovetnikModule.isDenyURL(tab.url, hostname)) {
          setPort = true;
          options.contentScript = engine.sovetnikModule.getContentScript();
        }
      }

      var worker = tab.attach(options);
      if (setPort) {
        engine.sovetnikModule.setPort(worker);
      }
      var_cache.monoLib.addPage(worker);
    } : function() {},
    start: function() {
      if (!mono.isChrome && !mono.isFF) {
        return;
      }

      if (!preferences.enable ||
        (!preferences.sovetnikEnabled && !preferences.lmFileHosting && !preferences.lmMediaHosting)) {
        tabListener.state = false;
        return;
      }

      if (tabListener.state) {
        return;
      }
      tabListener.state = true;

      if (tabListener.listen) {
        return;
      }
      if (mono.isChrome) {
        if (chrome.runtime && chrome.runtime.onMessage) {
          tabListener.chMessageSender = chrome.tabs.sendMessage;
        } else {
          tabListener.chMessageSender = chrome.tabs.sendRequest;
        }
      }

      tabListener.createMatchCache();
      if (mono.isChrome) {
        chrome.tabs.onUpdated.addListener(function chListener(tabId, changeInfo, tab) {
          if (tabListener.state === false) {
            chrome.tabs.onUpdated.removeListener(chListener);
            tabListener.listen = false;
            return;
          }
          if (changeInfo.status !== 'loading') { // complete or loading
            return;
          }
          if (tabListener.checkUrl(tab.url) === undefined) {
            return;
          }

          tabListener.chMessageSender(tabId, {hook: 'hasInject', url: tab.url}, function(r) {
            if (r !== undefined && r !== null) {
              return;
            }
            tabListener.onChange(tab, tabId);
          });
        });
      } else
      if (mono.isFF) {
        var ffTabs = require("sdk/tabs");
        ffTabs.on('ready', function ffListener(tab) {
          if (tabListener.state === false) {
            ffTabs.removeListener('ready', ffListener);
            tabListener.listen = false;
            return;
          }
          var hostname = tabListener.checkUrl(tab.url);
          if (hostname === undefined) {
            return;
          }
          tabListener.onChange(tab, hostname);
        });
      }
      tabListener.listen = true;
    },
    injectLmInActiveTab: mono.isChrome ? function() {
      chrome.tabs.getSelected(null, function (tab) {
        if (tabListener.checkUrl(tab.url) === undefined) {
          return;
        }
        tabListener.onChange(tab, tab.id, 1);
      });
    } : mono.isFF ? function() {
      var tabs = require("sdk/tabs");
      var tab = tabs.activeTab;
      var hostname = tabListener.checkUrl(tab.url);
      if (hostname === undefined) {
        return;
      }
      tabListener.onChange(tab, hostname, 1);
    } : function() {}
  };

  function dblTrackCheck(cb) {
    if (!mono.isGM) {
      return cb();
    }
    mono.storage.get('dblTrack', function(storage) {
      var dblTrack = storage.dblTrack;
      var dataList = (dblTrack)?dblTrack.split(','):'';
      var now = Date.now();
      if (dataList && dataList[1] > now) {
        return cb(1);
      }
      var uuid = generateUuid();
      var expire = now + 60000;
      mono.storage.set({dblTrack: uuid+','+expire});

      setTimeout(function() {
        mono.storage.get('dblTrack', function(storage) {
          var dblTrack = storage.dblTrack;
          var dataList = (dblTrack)?dblTrack.split(','):'';
          if (dataList[0] !== uuid) {
            return cb(1);
          }
          cb();
        });
      }, 5000);
    });
  }

  function userTrack() {
    if (userTrack.lock) return;

    userTrack.lock = true;
    var checkTrackTime = function(currentTime) {
      var now = Date.now();
      if (currentTime > now) {
        userTrack.lock = false;
        return;
      }
      dblTrackCheck(function(isFail) {
        if (isFail) {
          userTrack.lock = false;
          return;
        }
        sendScreenViewStats('init', function(isReady) {
          userTrack.lock = false;

          var saveTrackTime = function() {
            var_cache.initRetry = 0;
            if (preferences.expIndex) {
              if (preferences.expIndex === 1) {
                var_cache.trackTime = now + 6 * 60 * 60 * 1000;
              } else {
                var_cache.trackTime = now + 4 * 60 * 60 * 1000;
              }
            } else {
              var_cache.trackTime = now + 12 * 60 * 60 * 1000;// (24 - (new Date()).getHours()) * 60 * 60 * 1000;
            }
            mono.storage.set({ trackTime: String(var_cache.trackTime) });
          };

          if (var_cache.initRetry > 10) {
            saveTrackTime();
            return;
          }

          if (!isReady) {
            var_cache.initRetry++;
            return;
          }

          saveTrackTime();

          if (preferences.inCohort) {
            userInCohort.track.sendScreenViewStats('init');
          }
          if ([5,6].indexOf(preferences.expIndex) !== -1) {
            sendScreenViewStats.call({fromExp: 1}, 'init');
          }
          if (var_cache.hasSovetnik) {
            trackEvent('metabar', 'state', (preferences.enable && preferences.sovetnikEnabled) ? 'true' : 'false');
          }
          if (var_cache.hasAdvisor) {
            trackEvent('dealply', 'state', (preferences.enable && preferences.sovetnikEnabled) ? 'true' : 'false');
          }
        });
      });
    };

    if (var_cache.trackTime !== undefined) {
      return checkTrackTime(var_cache.trackTime);
    }

    mono.storage.get('trackTime', function(storage) {
      var_cache.trackTime = storage.trackTime;
      return checkTrackTime(var_cache.trackTime);
    });
  }

  function sendScreenViewStats(screenName, cb) {
    var params = {
      an: 'helper',
      aid: var_cache.helperName,
      av: var_cache.version,
      t: 'screenview',
      cd: screenName
    };

    if (preferences.expIndex) {
      params.sc = 'start';
    }

    if (this.fromExp === 1) {}

    sendStatsInfo(params, cb);
  }

  function trackSocial(target, action, network) {
    var params = {
      st: target, // /home
      sa: action, // like
      sn: network, // facebook
      t: 'social'
    };

    sendStatsInfo(params);
  }

  function trackEvent(category, action, label) {
    var params = {
      ec: category, // share-button
      ea: action, // click
      el: label, // vk
      t: 'event'
    };

    if ([5,6].indexOf(preferences.expIndex) !== -1) {}

    sendStatsInfo(params);
  }

  function sendStatsInfo(params, cb) {
    if(!params.t) {
      return;
    }
    getUuid(function(uuid) {
      var def = {};

      var getParams = mono.param({
        z: Date.now()
      });

      if (preferences.expIndex) {
        def.cd1 = 'test_' + preferences.expIndex;
      }

      def.cd2 = var_cache.fromId || undefined;

      if (getParams.length > 0) {
        getParams = '?' + getParams;
      }

      for (var i in def) {
        if(!params[i])
          params[i] = def[i];
      }

      mono.ajax({});
    });
  }

  function getUuid(cb) {
    if (typeof var_cache.uuid === 'string' && var_cache.uuid.length === 36) {
      return cb(var_cache.uuid);
    }

    var storage = {};
    var_cache.uuid = storage.uuid = generateUuid();
    mono.storage.set(storage);
    cb(var_cache.uuid);
  }

  function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  }

  var getFromInstallId = function() {};

  var checkVersion = function () {
    var url, needSaveVersion;

    if(preferences.version === '0') {} else
    if(preferences.version !== var_cache.version) {}

    if (needSaveVersion) {
      msgAction.updateOption({key: 'version', value: var_cache.version});
    }

    if (mono.isGM) {
      return;
    }

    if(url !== undefined) {
      checkUrlsOfOpenTabs([/https?:\/\/([\w\-]+\.)?savefrom\.net\/(update-helper|userjs-setup)\.php/i],
      function(foundUrls) {
        if(foundUrls.length > 0) {
          return;
        }

        checkUrlsOfOpenTabs([/https?:\/\/legal\.yandex\.(ru|com\.tr)\//i], function(foundUrls){
          var active = foundUrls.length === 0;
          mono.openTab(url, active, active);
        });
      });
    }
  };

  var checkUrlsOfOpenTabs = function(regExpList, callback) {
    checkUrlsOfOpenTabs.getUrlList(function(urlList) {
      var foundUrlList = [];
      urlList.forEach(function(url) {
        regExpList.forEach(function(regexp) {
          if (url.search(regexp) !== -1 ) {
            foundUrlList.push(url);
          }
        });
      });
      callback(foundUrlList);
    });
  };

  checkUrlsOfOpenTabs.getUrlList = mono.isGM ? function(cb) {
    cb([location.href]);
  } : mono.isChrome ? function(cb) {
    var urlList = [];
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach(function (tab) {
        urlList.push(tab.url);
      });
      cb(urlList);
    });
  } : mono.isFF ? function(cb) {
    var urlList = [];
    var ffTabs = require("sdk/tabs");
    for (var tab in ffTabs) {
      urlList.push(ffTabs[tab].url);
    }
    cb(urlList);
  } : mono.isOpera ? function(cb) {
    var urlList = [];
    var oTabs = opera.extension.tabs.getAll();
    oTabs.forEach(function(tab) {
      urlList.push(tab.url);
    });
    cb(urlList);
  } : mono.isSafari ? function(cb) {
    var urlList = [];
    safari.application.activeBrowserWindow.tabs.forEach(function(tab) {
      if (!tab.url) {
        return 1;
      }
      urlList.push(tab.url);
    });
    cb(urlList);
  } : function(cb) {cb([])};

  var localStorageMigrate = function(cb) {
    var lStorage;
    if (mono.isOpera) {
      lStorage = widget.preferences;
    } else {
      if (typeof localStorage === 'undefined') {
        return cb();
      }
      lStorage = localStorage;
    }
    if (lStorage.length === 0) {
      return cb();
    }
    mono.storage.get('migrated', function(storage) {
      if (storage.migrated !== undefined) {
        return cb();
      }
      var obj = {migrated: 1};
      var copyDP = mono.extend({}, defaultPreferences);
      copyDP.helper = '';
      copyDP.uuid = '';
      copyDP.trackTime = '';
      copyDP.dblTrack = '';
      for (var key in copyDP) {
        var value = lStorage[key];
        if (!value) {
          continue;
        }
        if (typeof copyDP[key] === 'number') {
          obj[key] = parseInt(value);
          if (isNaN(obj[key])) {
            obj[key] = copyDP[key];
          }
        } else {
          obj[key] = value;
        }
      }
      mono.storage.set(obj, function() {
        cb();
      });
    });
  };

  var registerMenuCommands = (function () {
    var menuCommands = [
      {
        id: 'downloadFromCurrentPage',
        command: function() {
          msgAction.downloadFromCurrentPage();
        },
        always: true
      }, {
        id: 'updateLinks',
        notify: 'updateLinksNotification',
        modules: ['vk', 'odnoklassniki', 'facebook', 'lm', 'youtube', 'dailymotion']
      }, {
        id: 'downloadMP3Files',
        modules: ['vk', 'mailru']
      }, {
        id: 'downloadPlaylist',
        modules: ['vk', 'mailru']
      }, {
        id: 'downloadPhotos',
        modules: ['vk']
      }, {
        id: 'showOptions',
        command: function() {
          _options.show();
        },
        always: true
      }, {
        id: 'reportBug',
        command: function() {
          msgAction.reportBug();
        },
        always: true
      }, {
        id: 'enableDisableModule',
        command: function() {
          msgAction.getActiveTabInfo(undefined, function(tabInfo) {
            var state = tabInfo.state ? 0 : 1;
            msgAction.viaMenu_changeState({state: state, prefKey: tabInfo.prefKey, moduleName: tabInfo.moduleName});
            if (state) {
              if (preferences.button === 1) {
                gmShowButton(1);
              } else {
                gmShowButton(0);
              }
            } else {
              gmShowButton(0);
            }
          });
        },
        always: true
      }, {
        id: 'showHideButton',
        command: function() {
          var hiddenBtn = _menu.menu === null;
          if (hiddenBtn) {
            msgAction.updateOption({action: 'updateOption', key: 'button', value: 1});
          } else {
            msgAction.updateOption({action: 'updateOption', key: 'button', value: 0});
          }
        },
        always: true
      }, {
        id: 'disable',
        command: function() {
          msgAction.enableExtension();
        },
        always: true
      }
    ];

    var registerModuleMenuCommand = function (params, enabled) {
      var strId = params.id;
      if(!enabled && params.id === 'disable') {
        strId = 'menuEnable';
      }

      var name = language[strId];

      if(params.command) {
        return GM_registerMenuCommand(name, params.command);
      }

      var fn = function() {
        onMessage({action: ( params.modules !== undefined ? 'viaMenu_' : '' ) + params.id});

        if(params.notify) {
          GM_notification(language[params.notify], null, null, null, 3000);
        }
      };

      return GM_registerMenuCommand(name, fn);
    };

    return function (moduleName, enabled) {
      var hasRmFunc = typeof GM_unregisterMenuCommand !== "undefined";
      for (var i = 0, item; item = menuCommands[i]; i++) {
        if (hasRmFunc) {
          if (item.gmId) {
            GM_unregisterMenuCommand(item.gmId);
          }
        } else
        if (item.hasOwnProperty("gmId")) {
          continue;
        }

        if (enabled || item.always) {
          if (!item.modules || item.modules.indexOf(moduleName) > -1) {
            item.gmId = registerModuleMenuCommand(item, enabled);
          }
        }
      }
    }
  }());







  var userInCohort = {
    index: 3,
    data: undefined,
    onGetData: function(data, cb, first) {
      if (!first && (!data.cohort || !data.cohort.inExp)) {
        return;
      }
      cb(data);
    },
    getData: function(cb, first) {
      if (userInCohort.data !== undefined) {
        return userInCohort.onGetData(userInCohort.data, cb, first);
      }
      mono.storage.get('cohort', function(data) {
        userInCohort.data = data;
        userInCohort.onGetData(data, cb, first);
      });
    },
    getRandomInt: function (min, max) {
      return Math.floor(Math.random() * (max - min)) + min;
    },
    userInExp: function(data) {
      if (data.cohort.inExp !== undefined) {
        return data.cohort.inExp;
      }
      if (!userInCohort.isAllow(userInCohort.index)) {
        return;
      }
      if (userInCohort.index === 3) {
        data.cohort.inExp = 1;
        // cohort index
        data.cohort.index = userInCohort.index;
      } else {
        data.cohort.inExp = 0;
      }
      mono.storage.set(data);
      return data.cohort.inExp;
    },
    isAllow: function(index) {
      if (index === 1) {
        return mono.isGM || preferences.helper === 'ff-sf' || mono.isSafari || mono.isOpera || mono.isChrome;
      }
      return false;
    },
    setCohortPrefs: function(index) {
      preferences.inCohort = true;
      preferences.cohortIndex = index;
    },
    firstRun: function() {
      userInCohort.getData(function(data) {
        if (!data.cohort) {
          data.cohort = {};
        }
        if (!userInCohort.userInExp(data)) {
          return;
        }
        userInCohort.setCohortPrefs(data.cohort.index);
      }, 1);
    },
    run: function() {
      if (preferences.inCohort === true) {
        return;
      }
      userInCohort.getData(function(data) {
        if (data.cohort.index === 3) {
          // TODO: remove me!
          mono.storage.remove('cohort');
          return;
        }
        if (!userInCohort.isAllow(data.cohort.index)) {
          return;
        }
        userInCohort.setCohortPrefs(data.cohort.index);
      });
    },
    track: {
      event: function(category, action, label) {
        var params = {
          ec: category, // share-button
          ea: action, // click
          el: label, // vk
          t: 'event'
        };

        userInCohort.track.sendStatsInfo(params);
      },
      sendScreenViewStats: function(screenName) {
        var params = {
          an: 'helper',
          aid: var_cache.helperName,
          av: var_cache.version,
          t: 'screenview',
          cd: screenName
        };

        userInCohort.track.sendStatsInfo(params);
      },
      sendStatsInfo: function(params) {
        if (!userInCohort.isAllow(preferences.cohortIndex)) {
          return;
        }
        if(!params.t) {
          return;
        }
        var tid = {};
        getUuid(function(uuid) {
          var def = {
            v: 1,
            ul: var_cache.language,
            tid: tid[preferences.cohortIndex],
            cid: uuid
          };

          for (var i in def) {
            if(!params[i]) {
              params[i] = def[i];
            }
          }

          if (def.tid === undefined) {
            return;
          }

          mono.ajax({});
        });
      }
    }
  };

  return {
    init: init,
    modules: {},
    language: language,
    onMessage: onMessage,
    trackEvent: trackEvent,
    loadLanguage: loadLanguage,
    langList: var_cache.langList,
    actionList: msgAction,
    tabListener: tabListener,
    sendScreenViewStats: sendScreenViewStats,
    getUuid: getUuid,
    expList: {}
  }
})();

engine.expList[1] = function(preferences) {
  var translate = {
    de: 'Download von dieser Webseite',
    en: 'Download from this website',
    ru: 'Скачать с этого сайта',
    tr: 'Bu web sitesinden indir',
    uk: 'Завантажити з цього сайту'
  };
  engine.language.downloadFromCurrentPage = translate[engine.language.lang] || translate['en'];
  engine.actionList.downloadFromCurrentPage = function() {};
};
engine.expList[2] = function(preferences) {
  preferences = null;
  var translate = {
    openPoll: {
      de: 'Verwendung',
      en: 'Show how to use',
      ru: 'Как пользоватся',
      tr: 'Nasıl kullanılacağını göster',
      uk: 'Як користуватися'
    },
    menuOpenPoll: {
      de: 'Tipps und Tricks für die Verwendung von "SaveFrom.net Helper"',
      en: 'Tips and tricks for using "SaveFrom.net Helper"',
      ru: 'Подсказки и инструкции по использованию "SaveFrom.net помощник"',
      tr: 'SaveFrom.net Helper kullanımı için ipuçları ve püf noktaları',
      uk: 'Підказки та інструкції з використання "SaveFrom.net помічник"'
    }
  };
  engine.language.openPoll = translate.openPoll[engine.language.lang] || translate.openPoll['en'];
  engine.language.menuOpenPoll = translate.menuOpenPoll[engine.language.lang] || translate.menuOpenPoll['en'];
  engine.actionList.openPoll = function(meg, response) {
    var linkList = {};
    var lang = engine.language.lang;
    var onReady = function(moduleName) {};
    engine.actionList.getActiveTabInfo(undefined, function(tabInfo) {
      onReady(tabInfo.moduleName);
    });
  }
};
engine.expList[3] = function() {};
engine.expList[4] = function(preferences) {
  preferences = null;
  var translate = {
    openPoll: {
      de: 'Verwendung',
      en: 'Show how to use',
      ru: 'Как пользоватся',
      tr: 'Nasıl kullanılacağını göster',
      uk: 'Як користуватися'
    },
    menuOpenPoll: {
      de: 'Tipps und Tricks für die Verwendung von "SaveFrom.net Helper"',
      en: 'Tips and tricks for using "SaveFrom.net Helper"',
      ru: 'Подсказки и инструкции по использованию "SaveFrom.net помощник"',
      tr: 'SaveFrom.net Helper kullanımı için ipuçları ve püf noktaları',
      uk: 'Підказки та інструкції з використання "SaveFrom.net помічник"'
    },
    tutorialTooltip: {
      de: "['Klicken Sie zum ',{b: {text: 'Download'}},', einfach auf die Schaltfläche']",
      en: "['Just click the button to ',{b: {text: 'download'}}]",
      ru: "['Что бы ',{b: {text: 'скачать'}},', просто кликните по кнопке']",
      tr: "[{b: {text: 'İndirmek'}}, ' için sadece butona tıklayın']",
      uk: "['Щоб ',{b: {text: 'скачати'}},', просто клікніть по кнопці']"
    },
    tutorialTooltipOk: {
      de: "OK",
      en: "OK",
      ru: "OK",
      tr: "OK",
      uk: "OK"
    }
  };
  engine.language.openPoll = translate.openPoll[engine.language.lang] || translate.openPoll['en'];
  engine.language.menuOpenPoll = translate.menuOpenPoll[engine.language.lang] || translate.menuOpenPoll['en'];
  engine.language.tutorialTooltip = translate.tutorialTooltip[engine.language.lang] || translate.tutorialTooltip['en'];
  engine.language.tutorialTooltipOk = translate.tutorialTooltipOk[engine.language.lang] || translate.tutorialTooltipOk['en'];


  engine.actionList.openPoll = function() {
    engine.actionList.getActiveTabInfo(undefined, function(tabInfo) {
      if (['vk', 'youtube'].indexOf(tabInfo.moduleName) !== -1) {
        return mono.sendMessageToActiveTab({action: 'howUse'});
      }

      engine.actionList.trackEvent({action: 'trackEvent', category: 'howUse', event: 'error', label: '%domain%'});
    });
  }
};
engine.hasAdvisor = true;
engine.expList[5] = function(preferences, var_cache) {
  var hasAdvisor = function() {
    if (!engine.hasAdvisor) {
      return false;
    }
    if (mono.isFF && !var_cache.ffButton) {
      return false;
    }
    return true;
  };

  if (!var_cache.hasSovetnik && hasAdvisor()) {
    var_cache.hasAdvisor = true;

    preferences.dealplyType = 1;
  }
};
engine.expList[6] = function(preferences, var_cache) {
  var hasAdvisor = function() {
    if (!engine.hasAdvisor) {
      return false;
    }
    if (mono.isFF && !var_cache.ffButton) {
      return false;
    }
    return true;
  };

  if (!var_cache.hasSovetnik && hasAdvisor()) {
    var_cache.hasAdvisor = true;

    preferences.dealplyType = 0;
  }
};
//@insert

if (mono.isModule) {
  exports.init = engine.init;
} else
if (!mono.isGM) {
  engine.init();
}