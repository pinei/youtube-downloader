// ==UserScript==
// @name legacy components
//
// @exclude     file://*
// @exclude     http://google.*/*
// @exclude     http://*.google.*/*
// @exclude     https://google.*/*
// @exclude     https://*.google.*/*
//
// ==/UserScript==

var SaveFrom_Utils = {
  downloadParam: 'sfh--download',

  trim: function(str)
  {
    return str.replace(/^\s+|\s+$/g, '');
  },


  nextSibling: function(obj)
  {
    var next = obj;
    do
    {
      next = next.nextSibling;
      if(next)
      {
        if(next.nodeType == 1)
          return next;

        if(next.nodeType == 9)
          break;
      }
    }
    while(next);

    return null;
  },


  setStyle: function(node, style)
  {
    if(!node || !style)
      return;

    for(var i in style)
      node.style[i] = style[i];
  },


  getStyle: function(node, property)
  {
    var s = undefined;
    if(!node)
      return undefined;

    if(node.currentStyle)
    {
      property = property.replace(/-(w)/g, function(s, m){return m.toUpperCase()});
      return node.currentStyle[property];
    }

    if(window.getComputedStyle)
      return window.getComputedStyle(node, null).getPropertyValue(property);

    return undefined;
  },

  addStyleRules: function(selector, rules, className)
  {
    var style = className ? document.querySelector('#savefrom-styles.'+className) : document.getElementById('savefrom-styles');
    if(!style)
    {
      style = document.createElement('style')
      style.id = 'savefrom-styles';
      if (className) {
        style.classList.add(className);
      }
      // maybe need for safari
      //style.appendChild(document.createTextNode(""));
      var s = document.querySelector('head style');
      if(s)
      // allow to override our styles
        s.parentNode.insertBefore(style, s);
      else
        document.querySelector('head').appendChild(style);
    }

    if(typeof(rules) == 'object') {
      var r = [];
      for(var i in rules)
        r.push(i + ':' + rules[i]);

      rules = r.join(';');
    }

    style.textContent += selector + '{' + rules + '}';
  },

  getPosition: function(node, parent)
  {
    var box = node.getBoundingClientRect();

    if (parent) {
      var parent_pos = parent.getBoundingClientRect();
      return {
        top: Math.round(box.top - parent_pos.top),
        left: Math.round(box.left - parent_pos.left),
        width: box.width,
        height: box.height
      }
    }
    return {
      top: Math.round(box.top + window.pageYOffset),
      left: Math.round(box.left + window.pageXOffset),
      width: box.width,
      height: box.height
    }
  },

  getSize: function(node)
  {
    return {width: node.offsetWidth, height: node.offsetHeight};
  },

  getMatchFirst: function(str, re)
  {
    var m = str.match(re);
    if(m && m.length > 1)
      return m[1];

    return '';
  },


  getElementByIds: function(ids)
  {
    for(var i = 0; i < ids.length; i++)
    {
      var node = document.getElementById(ids[i]);
      if(node)
        return node;
    }

    return null;
  },


  hasClass: function(node, name)
  {
    if(!node || !node.className || !node.className.search || name == '')
      return false;

    if(node.className == name)
      return true;

    var re = new RegExp("(^|\\s+)" + name + "(\\s+|$)");
    if(node.className.search(re) != -1)
      return true;

    return false;
  },


  addClass: function(node, name)
  {
    if(!this.hasClass(node, name))
    {
      var c = node.className;
      if(c)
        node.className = c + ' ' + name;
      else
        node.className = name;
    }
  },


  removeClass: function(node, name)
  {
    if(!this.hasClass(node, name))
      return;

    var re = new RegExp("(^|\\s+)" + name + "(\\s+|$)");
    node.className = node.className.replace(re, function(t, s1, s2){
      if(s1 && s2)
        return ' ';

      return '';
    });
  },


  matchesSelector: function(node, selector)
  {
    if(node.matches) {
      return node.matches(selector);
    }

    if(node.matchesSelector) {
      return node.matchesSelector(selector);
    }

    if(node.webkitMatchesSelector) {
      return node.webkitMatchesSelector(selector);
    }

    if(node.oMatchesSelector) {
      return node.oMatchesSelector(selector);
    }

    var nodes = node.parentNode.querySelectorAll(selector);
    for(var i = 0, el; el = nodes[i]; i++) {
      if(el === node) {
        return true;
      }
    }

    return false;
  },


  getParentByClass: function(node, name)
  {
    if(!node || name == '')
      return false;

    if(typeof(name) == 'object' && name.length > 0)
    {
      for(var parent = node; parent; parent = parent.parentNode)
      {
        for(var i = 0; i < name.length; i++)
        {
          if(this.hasClass(parent, name[i]))
            return parent;
        }
      }
    }
    else
    {
      for(var parent = node; parent; parent = parent.parentNode)
      {
        if(this.hasClass(parent, name))
          return parent;
      }
    }

    return null;
  },

  getParentById: function(node, id) {
    if(!node || id == '') {
      return false;
    }

    for(var parent = node; parent; parent = parent.parentNode)
    {
      if(parent.id === id) {
        return parent;
      }
      if (parent === document.body) {
        return null;
      }
    }

    return null;
  },

  getParentByTagName: function(node, tagName) {
    if(!node || tagName == '') {
      return false;
    }

    for(var parent = node; parent; parent = parent.parentNode)
    {
      if(parent.tagName === tagName) {
        return parent;
      }
      if (parent === document.body) {
        return null;
      }
    }

    return null;
  },

  hasChildrenTagName: function(node, tagName) {
    for (var i = 0, item; item = node.childNodes[i]; i++) {
      if (item.tagName === tagName) {
        return true;
      }
    }
    return false;
  },


  isParent: function(node, testParent)
  {
    for(var parent = node; parent; parent = parent.parentNode)
    {
      if (parent === testParent) {
        return true;
      }
    }

    return false;
  },


  emptyNode: function(node)
  {
    while(node.firstChild)
      node.removeChild(node.firstChild);
  },

  initFrameDownloadListener: function() {
    if (SaveFrom_Utils.initFrameDownloadListener.enable === 1) {
      return;
    }
    SaveFrom_Utils.initFrameDownloadListener.enable = 1;
    window.addEventListener("message", function listener(e) {
      if (e.data.substr(0, 6) !== 'killMe') {
        return;
      }
      var src = e.data.substr(7);
      var frameList = document.querySelectorAll('iframe.sf-dl-frame');
      var frameListLen = frameList.length;
      for (var f = 0, el; el = frameList[f]; f++) {
        if (el.src === src) {
          el.parentNode.removeChild(el);
          frameListLen--;
          break;
        }
      }
      if (frameListLen === 0) {
        SaveFrom_Utils.initFrameDownloadListener.enable = 0;
        window.removeEventListener("message", listener);
      }
    });
  },

  download: function(filename, url, requestOptions, callback, options)
  {
    if(!url)
      return false;

    filename = filename || this.getFileName(url);
    if(!filename)
      return false;

    options = options || {};

    if (!mono.global.preference.downloads) {
      if (options.useFrame && this.downloadCheckProtocol(url)) {
        SaveFrom_Utils.initFrameDownloadListener();
        var src = this.getMatchFirst(url, /(^https?:\/\/[^\/]+)/);

        if(src == location.protocol + '//' + location.host) {
          var a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          setTimeout(function() {
            mono.trigger(a, 'click', {
              cancelable: true
            });
            setTimeout(function(){
              a.parentNode.removeChild(a);
            }, 100);
          });
        }
        else {
          var params = {url: url, filename: filename};
          params = encodeURIComponent(JSON.stringify(params));

          src += '/404?#' + this.downloadParam + '=' + params;

          var f = document.createElement('iframe');
          f.src = src;
          f.classList.add('sf-dl-frame');
          f.style.display = 'none';

          document.body.appendChild(f);
        }

        return true;
      }

      return false;
    }

    var params = requestOptions || {};
    params.url = url;
    params.filename = filename;

    var request = {
      action: 'downloadFile',
      options: params
    };

    callback = callback || undefined;

    mono.sendMessage(request, callback);
    return true;
  },

  downloadList: {
    showDownloadWarningPopup: function(onContinue, type) {
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', type: type}, function(icon) {
        template.icon.style.backgroundImage = 'url(' + icon + ')';
      });

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: mono.global.language.warningPopupTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.warningPopupDesc+' ',
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            },
            append: mono.create('a', {
              href: (mono.global.language.lang === 'ru' || mono.global.language.lang === 'uk')?'http://vk.com/page-55689929_49003549':'http://vk.com/page-55689929_49004259',
              text: mono.global.language.readMore,
              target: '_blank',
              style: {
                color: '#4A90E2'
              }
            })
          }),
          mono.create('p', {
            style: {
              marginBottom: '13px'
            },
            append: [
              mono.create('label', {
                style: {
                  color: '#868686',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '19px'
                },
                append: [
                  mono.create('input', {
                    type: 'checkbox',
                    style: {
                      cssFloat: 'left',
                      marginLeft: '0px'
                    },
                    on: ['click', function() {
                      mono.sendMessage({action: 'hideDownloadWarning', set: this.checked?1:0});
                    }]
                  }),
                  mono.global.language.noWarning
                ]
              })
            ]
          })
        ]
      });

      var cancelBtn = undefined;
      var continueBtn = undefined;
      mono.create(template.buttonContainer, {
        append: [
          cancelBtn = mono.create('button', {
            text: mono.global.language.cancel,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '4px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          }),
          continueBtn = mono.create('button', {
            text: mono.global.language.continue,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      cancelBtn.addEventListener('click', function(e) {
        var popup = template.body.parentNode;
        mono.trigger(popup.lastChild, 'click');
      });

      continueBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        onContinue();
        mono.trigger(cancelBtn, 'click');
      });

      SaveFrom_Utils.popupDiv(template.body, 'dl_warning_box_popup');
    },
    startChromeDownloadList: function(options, hideDialog) {
      var folderName = options.folderName;
      var linkList = options.list;
      var dataType = options.type;

      if (folderName) {
        folderName += '/';
      }

      var itemIndex = 0;
      var pause = false;
      var timeout = 500;

      var focusEl = document.body;

      focusEl.focus();

      if (!hideDialog) {
        focusEl.onblur = function () {
          pause = true;
        };
      }

      var nextOneFile = function() {
        var item = linkList[itemIndex];
        itemIndex++;

        if (item === undefined) {
          return;
        }

        if (mono.global.preference.downloads) {
          SaveFrom_Utils.download(folderName+item.filename, item.url);
        } else {
          mono.trigger(mono.create('a', {
            download: item.filename,
            href: item.url,
            on: ['click', function(e) {
              SaveFrom_Utils.downloadOnClick(e, null, {
                useFrame: true
              });
            }]
          }), 'click', {
            cancelable: true
          });
        }

        if (pause) {
          SaveFrom_Utils.downloadList.showDownloadWarningPopup(function() {
            pause = false;
            focusEl.focus();
            nextOneFile();
          }, dataType);
        } else {
          if (itemIndex > 5 && timeout) {
            timeout = undefined;
            focusEl.onblur = undefined;
            pause = false;
            if (mono.global.preference.downloads) {
              mono.sendMessage({action: 'downloadList', fileList: linkList.slice(itemIndex), path: folderName});
              return;
            }
          }

          setTimeout(function() {
            nextOneFile();
          }, timeout);
        }
      };

      nextOneFile();
    },
    startFfDownloadList: function(linkList, folderName) {
      mono.sendMessage({action: 'getPath', folder: folderName}, function (path) {
        mono.sendMessage({action: 'downloadList', fileList: linkList, path: path}, undefined, "service");
      }, "service");
    },
    startDownload: function(options) {
      options.list.forEach(function(item) {
        item.filename = mono.fileName.modify(item.filename);
      });

      options.folderName =  mono.fileName.modify(options.folderName);

      if (mono.isFF) {
        return SaveFrom_Utils.downloadList.startFfDownloadList(options.list, options.folderName);
      }

      if (mono.isChrome || mono.isGM) {
        return mono.sendMessage({action: 'hideDownloadWarning'}, function(state) {
          SaveFrom_Utils.downloadList.startChromeDownloadList(options, state);
        });
      }
    },
    showBeforeDownloadPopup: function(list, options) {
      options.list = list;
      var type = options.type;
      var folderName = options.folderName;
      var onContinue = options.onContinue || SaveFrom_Utils.downloadList.startDownload;
      var onShowList = options.onShowList || SaveFrom_Utils.playlist.popupFilelist;
      var count = options.count || list.length;
      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', color: '#00CCFF', type: type}, function(icon) {
        template.icon.style.backgroundImage = 'url('+icon+')';
      });

      var showListLink = [];
      if (onShowList) {
        showListLink = [' (',mono.create('a', {href: '#', text: mono.global.language.vkListOfLinks.toLowerCase()}),')'];
        showListLink[1].addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          onShowList(options.list);
          mono.trigger(cancelBtn, 'click');
        });
      }

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: folderName || mono.global.language.playlistTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.vkFoundFiles.replace('%d', count),
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            },
            append: showListLink
          }),
          mono.create('p', {
            text: mono.global.language.beforeDownloadPopupWarn,
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          })
        ]
      });

      var cancelBtn = undefined;
      var dlBtn = undefined;
      mono.create(template.buttonContainer, {
        append: [
          cancelBtn = mono.create('button', {
            text: mono.global.language.cancel,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '4px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          }),
          dlBtn = mono.create('button', {
            text: mono.global.language.continue,
            style: {
              height: '27px',
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      cancelBtn.addEventListener('click', function(e) {
        var popup = template.body.parentNode;
        mono.trigger(popup.lastChild, 'click');
      });

      dlBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        onContinue(options);
        mono.trigger(cancelBtn, 'click');
      });

      SaveFrom_Utils.popupDiv(template.body, 'dl_confirm_box_popup');
    }
  },


  downloadCheckProtocol: function(url) {
    if(location.protocol == 'http:') {
      return true;
    }

    if(!url) {
      return false;
    }

    url = url.toLowerCase();

    if(location.protocol == url.substr(0, location.protocol.length)) {
      return true;
    }

    return false;
  },


  downloadLink: function(a, callback, options)
  {
    if(!a.href)
      return false;

    var filename = a.getAttribute('download');

    return this.download(filename, a.href, null, callback, options);
  },


  downloadOnClick: function(event, callback, options)
  {
    options = options || {};
    var _this = SaveFrom_Utils;

    var node = options.el || event.target;
    if(node.tagName !== 'A') {
      node = node.parentNode;
    }

    if ( !mono.global.preference.downloads &&
      !(mono.global.preference.iframeDownload && options.useFrame && node.href && _this.downloadCheckProtocol(node.href)) ) {
      return;
    }

    if(event.button === 2) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    _this.downloadLink(node, callback, options);
  },


  click: function(node, ctrlKey, altKey, shiftKey, button)
  {
    console.log('This function is deprecated!');

    if(!node)
      return;

    if(!ctrlKey)
      ctrlKey = false;

    if(!altKey)
      altKey = false;

    if(!shiftKey)
      shiftKey = false;

    if(!button)
      button = 0;

    mono.trigger(node, 'MouseEvents', {
      cancelable: true,
      canBubble: true,
      view: window,
      detail: 0,
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: ctrlKey,
      altKey: altKey,
      shiftKey: shiftKey,
      metaKey: false,
      button: button,
      relatedTarget: null
    });
  },


  parseQuery: function(query)
  {
    var k = new Array();
    var re = /[?&]?([^=]+)(?:=([^&]*))?/g;
    while(m = re.exec(query))
    {
      if(m[1] && m[2])
        k[m[1]] = m[2];
      else if(m[1])
        k[m[1]] = '';
    };
    return k;
  },


  getQueryString: function(query, key_prefix, key_suffix)
  {
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

        str += SaveFrom_Utils.getQueryString(query[key], key_prefix + key + "[", "]" + key_suffix);
      }
      else
        str += key_prefix + escape(key) + key_suffix + '=' + escape(query[key]);
    }

    return str;
  },


  md5: function(str)
  {
    // http://kevin.vanzonneveld.net
    // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
    // + namespaced by: Michael White (http://getsprink.com)
    // +    tweaked by: Jack
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // -    depends on: utf8_encode
    // *     example 1: md5('Kevin van Zonneveld');
    // *     returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'
    var xl;

    var rotateLeft = function (lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    };

    var addUnsigned = function (lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    };

    var _F = function (x, y, z) {
      return (x & y) | ((~x) & z);
    };
    var _G = function (x, y, z) {
      return (x & z) | (y & (~z));
    };
    var _H = function (x, y, z) {
      return (x ^ y ^ z);
    };
    var _I = function (x, y, z) {
      return (y ^ (x | (~z)));
    };

    var _FF = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _GG = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _HH = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var _II = function (a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    var convertToWordArray = function (str) {
      var lWordCount;
      var lMessageLength = str.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = new Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    };

    var wordToHex = function (lValue) {
      var wordToHexValue = "",
        wordToHexValue_temp = "",
        lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = "0" + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    };

    var x = [],
      k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
      S12 = 12,
      S13 = 17,
      S14 = 22,
      S21 = 5,
      S22 = 9,
      S23 = 14,
      S24 = 20,
      S31 = 4,
      S32 = 11,
      S33 = 16,
      S34 = 23,
      S41 = 6,
      S42 = 10,
      S43 = 15,
      S44 = 21;

    //str = this.utf8_encode(str);
    x = convertToWordArray(str);
    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;

    xl = x.length;
    for (k = 0; k < xl; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

    return temp.toLowerCase();
  },


  decodeUnicodeEscapeSequence: function(text)
  {
    return text.replace(/\\u([0-9a-f]{4})/g, function(s, m){
      m = parseInt(m, 16);
      if(!isNaN(m))
      {
        return String.fromCharCode(m);
      }
    });
  },


  getFileExtension: function(str, def)
  {
    var ext = this.getMatchFirst(str, /\.([a-z0-9]{3,4})(\?|$)/i);
    if(ext)
      return ext.toLowerCase();

    return (def ? def : '');
  },


  getFileName: function(url)
  {
    var filename = this.getMatchFirst(url, /\/([^\?#\/]+\.[a-z\d]{2,6})(?:\?|#|$)/i);
    if(!filename)
      return filename;

    return mono.fileName.modify(filename);
  },


  getTopLevelDomain: function(domain)
  {
    if(!domain)
      return '';

    if(!domain.match(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}/))
      return domain;

    var a = domain.split('.');
    var l = a.length;

    if(l == 2)
      return domain;

    return (a[l - 2] + '.' + a[l - 1]);
  },


  dateToObj: function(ts, leadingZero)
  {
    var d = (ts === null || ts === undefined) ? new Date() : new Date(ts);

    if(leadingZero === undefined)
      leadingZero = true;

    var res = {
      year: d.getFullYear(),
      month: (d.getMonth() + 1),
      day: d.getDate(),
      hour: d.getHours(),
      min: d.getMinutes(),
      sec: d.getSeconds()
    };

    if(leadingZero)
    {
      for(var i in res)
      {
        if(res[i].toString().length == 1)
          res[i] = '0' + res[i];
      }
    }

    return res;
  },


  utf8Encode: function(str)
  {
    str = str.replace(/\r\n/g,"\n");
    var res = "";

    for (var n = 0; n < str.length; n++)
    {
      var c = str.charCodeAt(n);

      if (c < 128)
        res += String.fromCharCode(c);
      else if((c > 127) && (c < 2048))
      {
        res += String.fromCharCode((c >> 6) | 192);
        res += String.fromCharCode((c & 63) | 128);
      }
      else
      {
        res += String.fromCharCode((c >> 12) | 224);
        res += String.fromCharCode(((c >> 6) & 63) | 128);
        res += String.fromCharCode((c & 63) | 128);
      }

    }

    return res;
  },


  utf8ToWindows1251: function(str)
  {
    var res = '', i = 0, c = c1 = c2 = 0;

    var a = {
      208: {
        160: 208, 144: 192, 145: 193, 146: 194,
        147: 195, 148: 196, 149: 197, 129: 168,
        150: 198, 151: 199, 152: 200, 153: 201,
        154: 202, 155: 203, 156: 204, 157: 205,
        158: 206, 159: 207, 161: 209, 162: 210,
        163: 211, 164: 212, 165: 213, 166: 214,
        167: 215, 168: 216, 169: 217, 170: 218,
        171: 219, 172: 220, 173: 221, 174: 222,
        175: 223, 176: 224, 177: 225, 178: 226,
        179: 227, 180: 228, 181: 229, 182: 230,
        183: 231, 184: 232, 185: 233, 186: 234,
        187: 235, 188: 236, 189: 237, 190: 238,
        191: 239
      },

      209: {
        145: 184, 128: 240, 129: 241, 130: 242,
        131: 243, 132: 244, 133: 245, 134: 246,
        135: 247, 136: 248, 137: 249, 138: 250,
        139: 251, 140: 252, 141: 253, 142: 254,
        143: 255
      }
    };

    while(i < str.length)
    {
      c = str.charCodeAt(i);

      if(c < 128)
      {
        res += String.fromCharCode(c);
        i++;
      }
      else if((c > 191) && (c < 224))
      {
        if(c == 208 || c == 209)
        {
          c2 = str.charCodeAt(i + 1);
          if(a[c][c2])
            res += String.fromCharCode(a[c][c2]);
          else
            res += '?';
        }
        else
          res += '?';

        i += 2;
      }
      else
      {
        res += '?';
        i += 3;
      }
    }

    return res;
  },


  base64_encode: function(str)
  {
    var res = '';
    var c1, c2, c3, e1, e2, e3, e4;
    var key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var i = 0;

    while(i < str.length)
    {
      c1 = str.charCodeAt(i++);
      c2 = str.charCodeAt(i++);
      c3 = str.charCodeAt(i++);

      e1 = c1 >> 2;
      e2 = ((c1 & 3) << 4) | (c2 >> 4);
      e3 = ((c2 & 15) << 2) | (c3 >> 6);
      e4 = c3 & 63;

      if(isNaN(c2))
      {
        e3 = e4 = 64;
      }
      else if(isNaN(c3))
      {
        e4 = 64;
      }

      res += key.charAt(e1) + key.charAt(e2) + key.charAt(e3) + key.charAt(e4);
    }

    return res;
  },


  sizeHuman: function(size, round)
  {
    if(round == undefined || round == null)
      round = 2;

    var s = size, count = 0, sign = '', unite_spec = [
      mono.global.language.vkFileSizeByte,
      mono.global.language.vkFileSizeKByte,
      mono.global.language.vkFileSizeMByte,
      mono.global.language.vkFileSizeGByte,
      mono.global.language.vkFileSizeTByte
    ];

    if(s < 0)
    {
      sign = '-';
      s = Math.abs(s);
    }

    while(s >= 1000)
    {
      count++;
      s /= 1024;
    }

    if(round >= 0)
    {
      var m = round * 10;
      s = Math.round(s * m) / m;
    }

    if(count < unite_spec.length)
      return sign + s + ' ' + unite_spec[count];

    return size;
  },


  sendRequest: function(url, callback, method, referer, post, cookie,
                        userAgent, header)
  {
    var req = new window.XMLHttpRequest();
    if (!req)
      return;

    method = method ? method : ((post) ? 'POST' : 'GET');
    //userAgent = userAgent ? userAgent : window.navigator.userAgent;

    req.open(method, url, true);

    //req.setRequestHeader('User-Agent', userAgent);
    if(referer)
    {
      req.setRequestHeader('Referer', referer);
    }
    if(cookie)
    {
      req.setRequestHeader('Cookie', cookie);
    }
    if (post)
    {
      req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      req.setRequestHeader("Content-Length", post.length);
    }
    if(header)
    {
      for(var i = 0; i < header.length; i++)
      {
        req.setRequestHeader(header[i][0], header[i][1]);
      }
    }

    req.onreadystatechange = function ()
    {
      if (req.readyState != 4)
        return;

      callback(req);
    };

    if (req.readyState == 4)
    {
      return;
    }

    if(post)
      req.send(post);
    else
      req.send();
  },


  secondsToDuration: function(seconds)
  {
    if(!seconds || isNaN(seconds))
      return '';

    function zfill(time)
    {
      if(time < 10)
        return '0' + time;

      return time.toString();
    }

    var hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    var minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if(hours > 0)
      return hours + ":" + zfill(minutes) + ":" + zfill(seconds);

    return minutes + ":" + zfill(seconds);
  },

  svg: {
    icon: {
      download: 'M 4,0 4,8 0,8 8,16 16,8 12,8 12,0 4,0 z',
      info: 'M 8,1.55 C 11.6,1.55 14.4,4.44 14.4,8 14.4,11.6 11.6,14.4 8,14.4 4.44,14.4 1.55,11.6 1.55,8 1.55,4.44 4.44,1.55 8,1.55 M 8,0 C 3.58,0 0,3.58 0,8 0,12.4 3.58,16 8,16 12.4,16 16,12.4 16,8 16,3.58 12.4,0 8,0 L 8,0 z M 9.16,12.3 H 6.92 V 7.01 H 9.16 V 12.3 z M 8.04,5.91 C 7.36,5.91 6.81,5.36 6.81,4.68 6.81,4 7.36,3.45 8.04,3.45 8.72,3.45 9.27,4 9.27,4.68 9.27,5.36 8.72,5.91 8.04,5.91 z',
      noSound: 'M 11.4,5.05 13,6.65 14.6,5.05 16,6.35 14.4,7.95 16,9.55 14.6,11 13,9.35 11.4,11 10,9.55 11.6,7.95 10,6.35 z M 8,1.75 8,14.3 4,10.5 l -4,0 0,-4.75 4,0 z'
    },

    cache: {},

    getSrc: function(icon, color)
    {
      if(!this.icon[icon])
        return '';

      if(!this.cache[icon])
        this.cache[icon] = {};

      if(!this.cache[icon][color])
      {
        this.cache[icon][color] = window.btoa(
            '<?xml version="1.0" encoding="UTF-8"?>' +
            '<svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" width="16" height="16" viewBox="0 0 16 16" id="svg2" xml:space="preserve">' +
            '<path d="' + this.icon[icon] + '" fill="' + color + '" /></svg>'
        );
      }

      if(this.cache[icon][color])
        return 'data:image/svg+xml;base64,' + this.cache[icon][color];

      return '';
    }
  },


  appendDownloadInfo: function(parent, color, boxStyle, btnStyle)
  {
    if(!color)
      color = '#a0a0a0';

    var info = document.createElement('span');
    info.appendChild(document.createTextNode(mono.global.language.downloadTitle));
    this.setStyle(info, {
      display: 'inline-block',
      position: 'relative',
      border: '1px solid ' + color,
      borderRadius: '5px',
      fontSize: '13px',
      lineHeight: '17px',
      padding: '2px 19px 2px 5px',
      marginTop: '5px',
      opacity: 0.9
    });

    if(boxStyle)
      this.setStyle(info, boxStyle);

    var close = document.createElement('span');
    close.textContent = String.fromCharCode(215);
    this.setStyle(close, {
      color: color,
      width: '14px',
      height: '14px',
      fontSize: '14px',
      fontWeight: 'bold',
      lineHeight: '14px',
      position: 'absolute',
      top: 0,
      right: 0,
      overflow: 'hidden',
      cursor: 'pointer'
    });

    if(btnStyle)
      this.setStyle(close, btnStyle);

    close.addEventListener('click', function(){
      info.parentNode.removeChild(info);
      mono.sendMessage({action: 'updateOption', key: 'moduleShowDownloadInfo', value: 0});
    }, false);

    info.appendChild(close);
    parent.appendChild(info);
  },


  appendFileSizeIcon: function(link, iconStyle, textStyle, error, noBrackets, container)
  {
    var iconColor = '#333333';
    if(error)
      iconColor = '#ff0000';
    else if(iconStyle && iconStyle.color)
      iconColor = iconStyle.color;

    var s = document.createElement('img');
    s.src = SaveFrom_Utils.svg.getSrc('info', iconColor);
    s.title = mono.global.language[error ? 'getFileSizeFailTitle' : 'getFileSizeTitle'];

    var defIconStyle = {
      width: '14px',
      height: '14px',
      marginLeft: '3px',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-1px',
      cursor: 'pointer'
    };

    var defTextStyle = {
      fontSize: '75%',
      fontWeight: 'normal',
      marginLeft: '3px',
      whiteSpace: 'nowrap'
    };

    var _this = this;

    this.setStyle(s, defIconStyle);
    if(iconStyle && typeof(iconStyle) == 'object')
      this.setStyle(s, iconStyle);

    if (container) {
      container.appendChild(s);
    } else
    if(link.nextSibling == null) {
      link.parentNode.appendChild(s);
    } else
    {
      link.parentNode.insertBefore(s, link.nextSibling);
    }

    s.addEventListener("click", function(event){
      event.preventDefault();
      event.stopPropagation();

      var node = document.createElement('span');
      node.textContent = '...';
      _this.setStyle(node, defTextStyle);
      if(textStyle && typeof(textStyle) == 'object')
        _this.setStyle(node, textStyle);

      s.parentNode.replaceChild(node, s);

      var request = {
        action: 'getFileSize',
        url: link.href
      };

      mono.sendMessage(request, function(response){
        if(response.fileSize == 0)
        {
          node.parentNode.removeChild(node);
          _this.appendFileSizeIcon(link, iconStyle, textStyle, true, noBrackets, container);
        }
        else
        {
          if(response.fileType.search(/^audio\//i) > -1)
          {
            var seconds = link.getAttribute('data-savefrom-helper-duration');
            if(seconds)
            {
              seconds = parseInt(seconds);
              if(!isNaN(seconds))
              {
                var size = _this.sizeHuman(response.fileSize, 2);
                var bitrate = Math.floor((response.fileSize / seconds) / 125) + ' ' +
                  mono.global.language.kbps;

                if (noBrackets) {
                  node.textContent = size + ' ~ ' + bitrate;
                } else {
                  node.textContent = '(' + size + ' ~ ' + bitrate + ')';
                }
                return;
              }
            }
          }

          if (noBrackets) {
            node.textContent = _this.sizeHuman(response.fileSize, 2);
          } else {
            node.textContent = '(' + _this.sizeHuman(response.fileSize, 2) + ')';
          }
          node.title = response.fileType ? response.fileType : '';
        }
      });
    }, false);

    return s;
  },

  appendNoSoundIcon: function(link, iconStyle)
  {
    var noSoundIconColor = '#ff0000';
    if(iconStyle && iconStyle.color)
      noSoundIconColor = iconStyle.color;
    var s = document.createElement('img');
    s.src = SaveFrom_Utils.svg.getSrc('noSound', noSoundIconColor);
    s.title = mono.global.language.withoutAudio;

    var defIconStyle = {
      width: '14px',
      height: '14px',
      marginLeft: '3px',
      verticalAlign: 'middle',
      position: 'relative',
      top: '-1px',
      cursor: 'pointer'
    };
    SaveFrom_Utils.setStyle(s, defIconStyle);
    if(iconStyle && typeof(iconStyle) == 'object')
      SaveFrom_Utils.setStyle(s, iconStyle);

    if(link.nextSibling == null) {
      if (link.parentNode === null) {
        link.appendChild(s);
      } else {
        link.parentNode.appendChild(s);
      }
    } else
    {
      link.parentNode.insertBefore(s, link.nextSibling);
    }
  },

  video: {
    dataAttr: 'data-savefrom-video-visible',

    yt: {
      inited: false,

      show3D: false,
      showMP4NoAudio: false,

      showFormat: {
        'FLV': true,
        'MP4': true,
        'WebM': false,
        '3GP': false,
        'Audio AAC': false,
        'Audio OGG': false,
        'Audio Opus': false
      },

      format: {
        'FLV': {
          '5': {quality: '240'},
          '6': {quality: '270'},
          '34': {quality: '360'},
          '35': {quality: '480'}
        },

        'MP4': {
          '18': {quality: '360'},
          '22': {quality: '720'},
          '37': {quality: '1080'},
          '38': {quality: '8k'},
          '82': {quality: '360', '3d': true},
          '83': {quality: '240', '3d': true},
          '84': {quality: '720', '3d': true},
          '85': {quality: '1080', '3d': true},
          '160': {quality: '144', 'noAudio': true},
          '133': {quality: '240', 'noAudio': true},
          '134': {quality: '360', 'noAudio': true},
          '135': {quality: '480', 'noAudio': true},
          '136': {quality: '720', 'noAudio': true},
          '137': {quality: '1080', 'noAudio': true},
          '264': {quality: '1440', 'noAudio': true},
          '138': {quality: '8k', 'noAudio': true},
          '298': {quality: '720', 'noAudio': true, sFps: true},
          '299': {quality: '1080', 'noAudio': true, sFps: true},
          '266': {quality: '4k', 'noAudio': true}
        },

        'WebM': {
          '43': {quality: '360'},
          '44': {quality: '480'},
          '45': {quality: '720'},
          '46': {quality: '1080'},
          '167': {quality: '360', 'noAudio': true},
          '168': {quality: '480', 'noAudio': true},
          '169': {quality: '720', 'noAudio': true},
          '170': {quality: '1080', 'noAudio': true},
          '218': {quality: '480', 'noAudio': true},
          '219': {quality: '480', 'noAudio': true},
          '242': {quality: '240', 'noAudio': true},
          '243': {quality: '360', 'noAudio': true},
          '244': {quality: '480 low', 'noAudio': true},
          '245': {quality: '480 med', 'noAudio': true},
          '246': {quality: '480 high', 'noAudio': true},
          '247': {quality: '720', 'noAudio': true},
          '248': {quality: '1080', 'noAudio': true},
          '271': {quality: '1440', 'noAudio': true},
          '272': {quality: '8k', 'noAudio': true},
          '278': {quality: '144', 'noAudio': true},
          '100': {quality: '360', '3d': true},
          '101': {quality: '480', '3d': true},
          '102': {quality: '720', '3d': true},
          '302': {quality: '720', 'noAudio': true, sFps: true},
          '303': {quality: '1080', 'noAudio': true, sFps: true},
          '308': {quality: '1440', 'noAudio': true, sFps: true},
          '313': {quality: '4k', 'noAudio': true},
          '315': {quality: '4k', 'noAudio': true, sFps: true}
        },

        '3GP': {
          '17': {quality: '144'},
          '36': {quality: '240'}
        },

        'Audio AAC': {
          '139': {quality: '48', ext: 'aac', noVideo: true},
          '140': {quality: '128', ext: 'aac', noVideo: true},
          '141': {quality: '256', ext: 'aac', noVideo: true},
          '256': {quality: '192', ext: 'aac', noVideo: true},
          '258': {quality: '384', ext: 'aac', noVideo: true}
        },

        'Audio OGG': {
          '171': {quality: '128', ext: 'ogg', noVideo: true},
          '172': {quality: '192', ext: 'ogg', noVideo: true}
        },

        'Audio Opus': {
          '249': {quality: '48', ext: 'opus', noVideo: true},
          '250': {quality: '128', ext: 'opus', noVideo: true},
          '251': {quality: '256', ext: 'opus', noVideo: true}
        }
      },

      excludeItag: {
        // hide left itag if exist right!
        // MP4
        '134': ['18'], // 360
        '136': ['22'],       // 720
        '137': ['37'],       // 1080
        '138': ['38'],       // 8k
        // WebM
        '243': ['167', '43'],// 360
        '167': ['43'], // 360

        '244': ['44'],        // 480 low
        '245': ['44'],        // 480 med
        '246': ['44'],        // 480 high

        '168': ['218', '219', '44'], // 480
        '218': ['219', '44'], // 480
        '219': ['44'],        // 480

        '247': ['45', '169'], // 720
        '169': ['45'],        // 720

        '248': ['170', '46'], // 1080,
        '170': ['46'],        // 1080,
        // Opus
        '249': ['139'],
        '250': ['140'],
        '251': ['141']
      },


      init: function()
      {
        if ( SaveFrom_Utils.video.yt.inited ) {
          return;
        }

        ['Audio AAC', 'Audio OGG', 'Audio Opus'].forEach(function(item) {
          var formatType = SaveFrom_Utils.video.yt.format[item];
          for (var qualityValue in formatType) {
            formatType[qualityValue].quality += ' ' + mono.global.language.kbps;
          }
        });

        SaveFrom_Utils.video.yt.show3D = mono.global.preference.ytHide3D == '0';
        SaveFrom_Utils.video.yt.showMP4NoAudio = mono.global.preference.ytHideMP4NoAudio == '0';

        var show = false;
        var showAudio = false;
        for(var i in SaveFrom_Utils.video.yt.showFormat)
        {
          var prefName = 'ytHide' + i.replace(' ', '_');
          if (prefName === 'ytHideAudio_AAC') {
            prefName = 'ytHideAudio_MP4';
          }
          var value = mono.global.preference[prefName] == '0';
          if (i === 'Audio AAC') {
            showAudio = value;
          }
          SaveFrom_Utils.video.yt.showFormat[i] = value;
          if(value) {
            show = true;
          }
        }

        SaveFrom_Utils.video.yt.showFormat['Audio OGG'] = showAudio;
        SaveFrom_Utils.video.yt.showFormat['Audio Opus'] = showAudio;

        if(!show) {
          SaveFrom_Utils.video.yt.showFormat.FLV = true;
        }

        SaveFrom_Utils.video.yt.inited = true;
      },


      filterLinks: function(links)
      {
        for(var i in this.excludeItag)
        {
          if(links[i] && this.excludeItag[i].length > 0)
          {
            for(var j = 0; j < this.excludeItag[i].length; j++)
            {
              var itag = this.excludeItag[i][j];
              if(links[itag])
              {
                delete links[i];
                break;
              }
            }
          }
        }
      },


      show: function(links, parent, showDownloadInfo, style, videoTitle)
      {
        SaveFrom_Utils.video.yt.filterLinks(links);
        style = style || {};

        var content = document.createElement('div');
        SaveFrom_Utils.setStyle(content, {
          display: 'inline-block',
          margin: '0 auto'
        });
        parent.appendChild(content);

        var box = document.createElement('div');
        SaveFrom_Utils.setStyle(box, {
          display: 'inline-block',
          padding: '0 90px 0 0',
          position: 'relative'
        });
        content.appendChild(box);

        var tbl = document.createElement('table');
        SaveFrom_Utils.setStyle(tbl, {
          emptyCells: 'show',
          borderCollapse: 'collapse',
          margin: '0 auto',
          padding: '0',
          width: 'auto'
        });
        box.appendChild(tbl);

        var hidden = false;

        for(var i in SaveFrom_Utils.video.yt.format)
        {
          if(SaveFrom_Utils.video.yt.append(links, i,
            SaveFrom_Utils.video.yt.format[i], tbl, style, videoTitle))
          {
            hidden = true;
          }
        }

        for(var i in links)
        {
          if (i === 'ummy' || i === 'ummyAudio' || i === 'meta') {
            continue;
          }
          if(SaveFrom_Utils.video.yt.append(links, '', null, tbl, style, videoTitle))
          {
            hidden = true;
          }

          break;
        }

        if (!tbl.firstChild) {
          parent.textContent = mono.global.language.noLinksFound;
          return;
        }

        if(!hidden)
          return;

        var more = document.createElement('span');
        more.textContent = mono.global.language.more + ' ' + String.fromCharCode(187);
        SaveFrom_Utils.setStyle(more, {
          color: '#555',
          border: '1px solid #a0a0a0',
          borderRadius: '3px',
          display: 'block',
          fontFamily: 'Arial',
          fontSize: '15px',
          lineHeight: '17px',
          padding: '1px 5px',
          position: 'absolute',
          bottom: '3px',
          right: '0',
          cursor: 'pointer'
        });

        if(style.btn && typeof(style.btn) == 'object')
          SaveFrom_Utils.setStyle(more, style.btn);

        box.appendChild(more);

        more.addEventListener('click', function(event){
          event.preventDefault();
          event.stopPropagation();

          var e = parent.querySelectorAll('*[' + SaveFrom_Utils.video.dataAttr + ']');
          for(var i = 0; i < e.length; i++)
          {
            var visible = e[i].getAttribute(SaveFrom_Utils.video.dataAttr);
            var display = 'none', symbol = String.fromCharCode(187);
            if(visible == '0')
            {
              visible = '1';
              display = '';
              symbol = String.fromCharCode(171);
            }
            else
              visible = '0';

            e[i].style.display = display;
            e[i].setAttribute(SaveFrom_Utils.video.dataAttr, visible);
            this.textContent = mono.global.language.more + ' ' + symbol;
          }

          return false;
        }, false);


        if(showDownloadInfo === 1)
        {
          var color = '#a0a0a0', a = tbl.querySelector('td a');

          content.appendChild(document.createElement('br'));
          SaveFrom_Utils.appendDownloadInfo(content, color, null, {
            width: '16px',
            height: '16px',
            fontSize: '16px',
            lineHeight: '16px'
          });
        }
      },


      append: function(links, title, format, parent, style, videoTitle)
      {
        var hidden = false;

        var aStyle = {
          whiteSpace: 'nowrap'
        };

        var sStyle = {
          fontSize: '75%',
          fontWeight: 'normal',
          marginLeft: '3px',
          whiteSpace: 'nowrap'
        };

        var tr = document.createElement('tr');

        var td = document.createElement('td');
        td.appendChild(document.createTextNode(title ? title : '???'));

        if(!title || !SaveFrom_Utils.video.yt.showFormat[title])
        {
          tr.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
          tr.style.display = 'none';
          hidden = true;
        }

        SaveFrom_Utils.setStyle(td, {
          border: 'none',
          padding: '3px 15px 3px 0',
          textAlign: 'left',
          verticalAlign: 'middle'
        });

        tr.appendChild(td);

        td = document.createElement('td');
        SaveFrom_Utils.setStyle(td, {
          border: 'none',
          padding: '3px 0',
          textAlign: 'left',
          verticalAlign: 'middle',
          lineHeight: '17px'
        });
        tr.appendChild(td);

        if (!links.meta) {
          links.meta = {};
        }

        var sep = false;
        if(format)
        {
          for(var i in format)
          {
            if(links[i])
            {
              if(sep)
              {
                td.lastChild.style.marginRight = '15px';
                td.appendChild(document.createTextNode(' '));
              }

              var span = document.createElement('span');
              span.style.whiteSpace = 'nowrap';

              var a = document.createElement('a');
              a.href = links[i];
              a.title = mono.global.language.downloadTitle;
              if (format[i]['3d']) {
                a.textContent = '3D';
              } else {
                a.textContent = format[i].quality
              }
              if (format[i].sFps) {
                a.textContent += ' ' + (links.meta[i] && links.meta[i].fps ? links.meta[i].fps : '60');
              }
              if(videoTitle)
              {
                var ext = format[i]['ext'];
                if(!ext)
                  ext = title.toLowerCase();

                a.setAttribute('download', mono.fileName.modify(videoTitle + '.' + ext) );

                if(format[i].noVideo || format[i].noAudio)
                {
                  a.addEventListener('click', function(event){
                    SaveFrom_Utils.downloadOnClick(event, null, {
                      useFrame: true
                    });
                  }, false);
                }
              }
              SaveFrom_Utils.setStyle(a, aStyle);
              if(style.link && typeof(style.link) == 'object')
                SaveFrom_Utils.setStyle(a, style.link);

              span.appendChild(a);
              SaveFrom_Utils.appendFileSizeIcon(a, style.fsIcon, style.fsText);

              if(format[i]['3d'])
              {
                if(!SaveFrom_Utils.video.yt.show3D)
                {
                  hidden = true;
                  span.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
                  span.style.display = 'none';
                }

                var s = document.createElement('span');
                s.textContent = format[i].quality;
                SaveFrom_Utils.setStyle(s, sStyle);
                if(style.text && typeof(style.text) == 'object')
                  SaveFrom_Utils.setStyle(s, style.text);

                a.appendChild(s);
              }

              if(format[i]['noAudio'])
              {
                if(!SaveFrom_Utils.video.yt.showMP4NoAudio)
                {
                  hidden = true;
                  span.setAttribute(SaveFrom_Utils.video.dataAttr, '0');
                  span.style.display = 'none';
                }

                SaveFrom_Utils.appendNoSoundIcon(a, style ? style.noSoundIcon : false);
              }

              td.appendChild(span);

              sep = true;

              delete links[i];
            }
          }
        }
        else
        {
          for(var i in links)
          {
            if(sep)
            {
              td.lastChild.style.marginRight = '15px';
              td.appendChild(document.createTextNode(' '));
            }

            var span = document.createElement('span');
            span.style.whiteSpace = 'nowrap';

            var a = document.createElement('a');
            a.href = links[i];
            a.title = mono.global.language.downloadTitle;
            a.textContent = i;
            SaveFrom_Utils.setStyle(a, aStyle);
            if(style.link && typeof(style.link) == 'object')
              SaveFrom_Utils.setStyle(a, style.link);

            span.appendChild(a);
            SaveFrom_Utils.appendFileSizeIcon(a, style.fsIcon, style.fsText);
            td.appendChild(span);

            sep = true;

            delete links[i];
          }
        }

        if (sep === false) {
          return;
        }
        parent.appendChild(tr);

        return hidden;
      }
    }
  }, // video


  playlist: {
    btnStyle: {
      display: 'block',
      fontWeight: 'bold',
      border: 'none',
      textDecoration: 'underline'
    },


    getFilelistHtml: function(links)
    {
      if(!links || links.length == 0)
        return;

      var rows = 0;
      var list = '';

      for(var i = 0; i < links.length; i++)
      {
        if(links[i].url)
        {
          list += links[i].url + '\r\n';
          rows++;
        }
      }

      if(list)
      {
        if(rows < 5) {
          rows = 5;
        } else
        if(rows > 14) {
          rows = 14;
        }

        return mono.create(document.createDocumentFragment(), {
          append: [
            mono.create('p', {
              text: mono.global.language.filelistTitle,
              style: {
                color: '#0D0D0D',
                fontSize: '20px',
                marginBottom: '11px',
                marginTop: '5px'
              }
            }),
            mono.create('p', {
              style: {
                marginBottom: '11px'
              },
              append: mono.parseTemplate(mono.global.language.filelistInstruction)
            }),
            mono.create('p', {
              text: mono.global.language.vkFoundFiles.replace('%d', links.length),
              style: {
                color: '#000',
                marginBottom: '11px'
              },
              append: mono.create('a', {
                text: mono.global.language.playlist,
                href: '#',
                class: 'sf__playlist',
                style: {
                  display: 'none',
                  cssFloat: 'right'
                }
              })
            }),
            mono.create('textarea', {
              text: list,
              rows: rows,
              cols: 60,
              style: {
                width: '100%',
                whiteSpace: 'nowrap'
              }
            }),
            (!mono.isChrome && !mono.isFF)? undefined : mono.create('button', {
              text: mono.global.language.copy,
              style: {
                height: '27px',
                backgroundColor: '#ffffff',
                border: '1px solid #9e9e9e',
                marginTop: '6px',
                paddingLeft: '10px',
                paddingRight: '10px',
                borderRadius: '5px',
                fontSize: '14px',
                cursor: 'pointer',
                cssFloat: 'right'
              },
              on: ['click', function(e) {
                var _this = this;
                _this.disabled = true;
                mono.sendMessage({action: 'addToClipboard', text: list});
                setTimeout(function() {
                  _this.disabled = false;
                }, 1000);
              }],
              append: mono.create('style', {
                text: '#savefrom_popup_box button:hover:not(:disabled){' +
                  'background-color: #597A9E !important;' +
                  'border-color: #597A9E !important;' +
                  'color: #fff;' +
                  '}' +
                  '#savefrom_popup_box button:active{' +
                  'opacity: 0.9;' +
                  '}'
              })
            })
          ]
        });
      }

      return;
    },


    popupFilelist: function(links, title, playlist, id)
    {
      var content = SaveFrom_Utils.playlist.getFilelistHtml(links);
      if(!content)
        return;

      var popup = SaveFrom_Utils.popupDiv(content, id);
      if(playlist)
      {
        var a = popup.querySelector('a.sf__playlist');
        if(a)
        {
          a.addEventListener('click', function(event){
            setTimeout(function(){
              SaveFrom_Utils.playlist.popupPlaylist(links, title, true, id);
            }, 100);
            event.preventDefault();
            return false;
          }, false);

          SaveFrom_Utils.setStyle(a, SaveFrom_Utils.playlist.btnStyle);
        }
      }
    },

    getInfoPopupTemplate: function() {
      var popupContainer = mono.create('div', {
        class: 'sf-infoPopupTemplate',
        style: {
          width: '400px',
          minHeight: '40px'
        }
      });

      var mediaIcon = mono.create('div', {
        style: {
          backgroundSize: '48px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          display: 'inline-block',
          width: '60px',
          height: '60px',
          cssFloat: 'left',
          marginTop: '16px',
          marginRight: '10px'
        }
      });

      var textContent = mono.create('div', {
        style: {
          display: 'inline-block',
          width: '330px'
        }
      });

      var buttonWrap = mono.create('div', {
        style: {
          textAlign: 'right'
        },
        append: mono.create('style', {
          text: '.sf-infoPopupTemplate a.sf-button {' +
            'padding: 1px 6px;' +
            'display: inline-block;' +
            'text-align: center;' +
            'height: 23px;' +
            'line-height: 23px;' +
            'text-decoration: none;' +
            '}' +
            '.sf-infoPopupTemplate button:hover,' +
            '.sf-infoPopupTemplate a.sf-button:hover{' +
            'background-color: #597A9E !important;' +
            'border-color: #597A9E !important;' +
            'color: #fff;' +
            '}'
        })
      });

      popupContainer.appendChild(mediaIcon);
      popupContainer.appendChild(textContent);
      popupContainer.appendChild(buttonWrap);
      return {
        icon: mediaIcon,
        buttonContainer: buttonWrap,
        textContainer: textContent,
        body: popupContainer
      }
    },

    getM3U: function(links)
    {
      var text = '#EXTM3U\r\n';

      for(var i = 0; i < links.length; i++)
      {
        if(!links[i].duration)
          links[i].duration = '-1';

        if(links[i].title || links[i].duration)
        {
          text += '#EXTINF:' + links[i].duration + ',' +
            links[i].title + '\r\n';
        }

        text += links[i].url + '\r\n';
      }

      return text;
    },


    getPlaylistHtml: function(links, fileTitle)
    {
      if(!links || links.length == 0)
        return;

      var links_len = links.length;

      var d = SaveFrom_Utils.dateToObj();
      var dateStr = d.year + '-' + d.month + '-' + d.day + ' ' +
        d.hour + '-' + d.min;

      // M3U
      var m3uList = SaveFrom_Utils.playlist.getM3U(links);
      m3uList = m3uList.replace(/\r\n/g, '\n');

      var m3uUrl;
      if (typeof URL !== 'undefined' && typeof Blob !== "undefined" && !mono.isSafari) {
        var m3uBlob = new Blob([m3uList], {encoding: "UTF-8", type: 'audio/x-mpegurl'});
        m3uUrl = URL.createObjectURL(m3uBlob);
      } else {
        var m3uUTF8 = SaveFrom_Utils.utf8Encode(m3uList);
        m3uUrl = 'data:audio/x-mpegurl;charset=utf-8;base64,' + encodeURIComponent(SaveFrom_Utils.base64_encode(m3uUTF8))
      }

      var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();

      mono.sendMessage({action: 'getWarningIcon', color: '#00CCFF', type: 'playlist'}, function(icon) {
        template.icon.style.backgroundImage = 'url('+icon+')';
      });

      mono.create(template.textContainer, {
        append: [
          mono.create('p', {
            text: fileTitle || mono.global.language.playlistTitle,
            style: {
              color: '#0D0D0D',
              fontSize: '20px',
              marginBottom: '11px',
              marginTop: '13px'
            }
          }),
          mono.create('p', {
            text: mono.global.language.playlistInstruction,
            style: {
              color: '#868686',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          }),
          mono.create('a', {
            text: mono.global.language.filelist + ' ('+links_len+')',
            href: '#',
            class: 'sf__playlist',
            style: {
              display: 'none',
              fontSize: '14px',
              marginBottom: '13px',
              lineHeight: '24px',
              marginTop: '0px'
            }
          })
        ]
      });

      if(!fileTitle) {
        fileTitle = 'playlist';
      }
      fileTitle += ' ' + dateStr;

      mono.create(template.buttonContainer, {
        append: [
          mono.create('a', {
            text:  mono.global.language.download,
            href: m3uUrl,
            download: mono.fileName.modify(fileTitle + '.m3u'),
            class: 'sf-button',
            style: {
              width: '118px',
              backgroundColor: '#ffffff',
              border: '1px solid #9e9e9e',
              margin: '12px',
              marginBottom: '11px',
              marginRight: '8px',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer'
            }
          })
        ]
      });

      return template.body;
    },


    popupPlaylist: function(links, title, filelist, id)
    {
      var content = SaveFrom_Utils.playlist.getPlaylistHtml(links, title);
      if(!content)
        return;

      var popup = SaveFrom_Utils.popupDiv(content, id);
      if(filelist)
      {
        var a = popup.querySelector('a.sf__playlist');
        if(a)
        {
          a.addEventListener('click', function(event){
            setTimeout(function(){
              SaveFrom_Utils.playlist.popupFilelist(links, title, true, id);
            }, 100);
            event.preventDefault();
            return false;
          }, false);

          a.style.display = 'inline';
          a = null;
        }
      }
      var dl_links = popup.querySelectorAll('a[download]');
      for (var i = 0, el; el = dl_links[i]; i++) {
        el.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
      }
    }
  },

  popupCloseBtn: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAWUlEQVQ4y2NgGHHAH4j1sYjrQ+WIAvFA/B+I36MZpg8V+w9VQ9Al/5EwzDBkQ2AYr8uwaXiPQ0yfkKuwGUayIYQMI8kQqhlEFa9RLbCpFv1US5BUzSLDBAAARN9OlWGGF8kAAAAASUVORK5CYII=',

  popupDiv: function(content, id, maxWidth, maxHeight, onClose)
  {
    if(!id)
      id = 'savefrom_popup_box';

    if(!maxWidth)
      maxWidth = 580;

    if(!maxHeight)
      maxHeight = 520;

    var d = document.getElementById(id);
    if(d)
      d.parentNode.removeChild(d);

    d = document.createElement('div');
    d.id = id;

    SaveFrom_Utils.setStyle(d, {
      zIndex: '9999',
      display: 'block',
      cssFloat: 'none',
      position: 'fixed',
      margin: '0',
      padding: '0',
      visibility: 'hidden',
      color: '#000',
      background: '#fff',
      border: '3px solid #c0cad5',
      borderRadius: '7px',
      overflow: 'auto'
    });

    var cnt = document.createElement('div');
    SaveFrom_Utils.setStyle(cnt, {
      display: 'block',
      cssFloat: 'none',
      position: 'relative',
      overflow: 'auto',
      margin: '0',
      padding: '10px 15px'
    });
    if (typeof content === 'function') {
      content(cnt);
    } else {
      cnt.appendChild(content);
    }

    var btn = document.createElement('img');
    btn.src = SaveFrom_Utils.popupCloseBtn;
    btn.alt = 'x';
    btn.width = 18;
    btn.height = 18;
    SaveFrom_Utils.setStyle(btn, {
      position: 'absolute',
      top: '10px',
      right: '15px',
      opacity: '0.5',
      cursor: 'pointer'
    });

    mono.on(btn, 'mouseenter', function() {
      this.style.opacity = '0.9';
    });

    mono.on(btn, 'mouseleave', function(){
      this.style.opacity = '0.5';
    });

    btn.addEventListener('click', function(){
      if (d.parentNode) {
        d.parentNode.removeChild(d);
      }
      if (onClose) {
        onClose();
      }
      return false;
    }, false);

    cnt.appendChild(btn);
    d.appendChild(cnt);
    document.body.appendChild(d);

    if(d.offsetWidth > maxWidth)
      d.style.width = maxWidth + 'px';

    if(d.offsetHeight > maxHeight)
    {
      d.style.height = maxHeight + 'px';
      d.style.width = (maxWidth + 20) + 'px';
    }

    setTimeout(function() {
      var l = Math.floor((window.innerWidth - d.offsetWidth) / 2.0);
      var t = Math.floor((window.innerHeight - d.offsetHeight) / 2.0);
      SaveFrom_Utils.setStyle(d, {
        top: t + 'px',
        left: l + 'px',
        visibility: 'visible'
      });
    });

    var onDocClose = function(event){
      var node = event.target;
      if(node !== d && !SaveFrom_Utils.isParent(node, d))
      {
        if(d.parentNode){
          d.parentNode.removeChild(d);
        }
        document.removeEventListener('click', onDocClose, false);
        if (onClose) {
          onClose();
        }
      }
    };

    setTimeout(function() {
      document.addEventListener('click', onDocClose, false);
    }, 100);

    d.addEventListener('close', function() {
      if(d.parentNode){
        d.parentNode.removeChild(d);
      }
      document.removeEventListener('click', onDocClose, false);
      if (onClose) {
        onClose();
      }
    });

    d.addEventListener('kill', function() {
      if(d.parentNode){
        d.parentNode.removeChild(d);
      }
      document.removeEventListener('click', onDocClose, false);
    });

    return d;
  },

  // row - used for hide tooltip on mouseout
  // because node can dissaper from DOM before mouseout raised
  showTooltip: function(node, text, row, style)
  {
    if(!node)
      return;

    var tooltip = document.querySelector('.savefrom-tooltip');
    if(!tooltip)
    {
      tooltip = document.createElement('div');
      tooltip.className = 'savefrom-tooltip';
      SaveFrom_Utils.setStyle(tooltip, {
        'position': 'absolute',
        'opacity': 0,
        'zIndex': -1
      });
      if (style) {
        SaveFrom_Utils.setStyle(tooltip, style);
      }
    }

    tooltip.textContent = text;

    if(tooltip.lastNode && tooltip.lastNode === node)
    {
      fixPosition();
      return;
    }

    if(tooltip.lastNode)
    {
      mono.off(tooltip.lastNode, 'mouseleave', hide);
      mono.off(tooltip.lastNode, 'mousemove', fixPosition);
      tooltip.lastRow && mono.off(tooltip.lastRow, 'mouseleave', hide);
    }

    tooltip.lastNode = node;
    row && (tooltip.lastRow = row);

    mono.on(node, 'mouseleave', hide);
    mono.on(node, 'mousemove', fixPosition, false);
    row && mono.on(row, 'mouseleave', hide);

    document.body.appendChild(tooltip);
    fixPosition();

    function fixPosition(e) {
      if (e !== undefined) {
        e.stopPropagation();
      }
      var p = SaveFrom_Utils.getPosition(node),
        s = SaveFrom_Utils.getSize(tooltip);

      if(p.top == 0 && p.left == 0)
        return;

      p.top = p.top - s.height - 10;
      p.left = p.left - s.width / 2 + SaveFrom_Utils.getSize(node).width / 2;

      p.left = Math.min(p.left, document.body.clientWidth + document.body.scrollLeft - s.width);
      if(p.top < document.body.scrollTop)
        p.top = p.top + s.height + SaveFrom_Utils.getSize(node).height + 20;

      p.top += 'px';
      p.left += 'px';

      // show
      p.zIndex = 9999;
      p.opacity = 1;

      SaveFrom_Utils.setStyle(tooltip, p);
    }

    function hide() {
      if(tooltip.parentNode)
        document.body.removeChild(tooltip);

      tooltip.lastNode = null;
      tooltip.lastRow = null;
      SaveFrom_Utils.setStyle(tooltip, {
        zIndex: -1,
        opacity: 0
      });
      mono.off(node, 'mouseleave', hide);
      mono.off(node, 'mousemove', fixPosition);
      row && mono.off(row, 'mouseleave', hide);
    }
  },


  embedDownloader: {
    dataAttr: 'data-savefrom-get-links',
    dataIdAttr: 'data-savefrom-container-id',
    containerClass: 'savefrom-links-container',
    linkClass: 'savefrom-link',
    panel: null,
    lastLink: null,
    style: null,

    hostings: {
      'youtube': {
        re: [
          /^https?:\/\/(?:[a-z]+\.)?youtube\.com\/(?:#!?\/)?watch\?.*v=([\w\-]+)/i,
          /^https?:\/\/(?:[a-z0-9]+\.)?youtube\.com\/(?:embed|v)\/([\w\-]+)/i,
          /^https?:\/\/(?:[a-z]+\.)?youtu\.be\/([\w\-]+)/i
        ],
        action: 'getYoutubeLinks',
        prepareLinks: function(links) {
          var ret = [],
            format = SaveFrom_Utils.video.yt.format;

          if (!links.meta) {
            links.meta = {};
          }

          for(var i in format)
          {
            for(var n in format[i])
            {
              if(links[n])
              {
                var type = i;
                if(format[i][n].ext)
                  type = format[i][n].ext;

                ret.push({
                  name: i + ' ' + format[i][n].quality + (format[i][n].sFps ? ' ' + (links.meta[n] && links.meta[n].fps ? links.meta[n].fps : '60') : '') + (format[i][n]['3d'] ? ' (3d)' : ''),
                  type: type,
                  url: links[n],
                  noSound: format[i][n].noAudio
                });
              }
            }
          }

          return ret;
        }
      },

      'vimeo': {
        re: [
          /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/(?:\w+\#)?(\d+)/i,
          /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
          /^https?:\/\/(?:[\w\-]+\.)?vimeo\.com\/channels\/(?:[^\/]+)\/(\d+)$/i
        ],
        action: 'getVimeoLinks',
        prepareLinks: function(links) {
          return links.map(function(link) {
            var ext = link.ext;
            if(!ext)
            {
              ext = 'MP4';
              if(link.url.search(/\.flv($|\?)/i) != -1)
                ext = 'FLV';
            }

            link.name = link.name ? link.name : ext;
            link.type = link.type ? link.type : ext;
            link.ext = ext;

            return link;
          });
        }
      },

      'vk': {
        re: [
          /^https?:\/\/(?:[\w\-]+\.)?(?:vk\.com|vkontakte\.ru)\/(?:[^\/]+\/)*(?:[\w\-]+\?.*z=)?(video-?\d+_-?\d+\?list=[0-9a-z]+|video-?\d+_-?\d+)/i,
          /^https?:\/\/(?:[\w\-]+\.)?(?:vk\.com|vkontakte\.ru)\/video_ext\.php\?(.+)/i
        ],
        action: 'getVKLinks'
      },

      'dailymotion': {
        re: [
          /^http:\/\/dai\.ly\/([a-z0-9]+)_?/i,
          /^https?:\/\/(?:[\w]+\.)?dailymotion\.com(?:\/embed|\/swf)?\/video\/([a-z0-9]+)_?/i
        ],
        action: 'getDailymotionLinks'
      },

      'facebook': {
        re: [
          /^https?:\/\/(?:[\w]+\.)?facebook\.com(?:\/video)?\/video.php.*[?&]{1}v=([0-9]+).*/i
        ],
        action: 'getFacebookLinks'
      }
    },


    init: function(style)
    {
      this.style = style;

      if(this.panel) {
        SaveFrom_Utils.popupMenu.removePanel();
      }

      this.panel = null;
      this.lastLink = null;

      var links = document.querySelectorAll('a[' + this.dataAttr + ']'),
        i, l = links.length;

      for(i = 0; i < l; i++)
      {
        if(['savefrom.net', 'sf-addon.com'].indexOf(
          SaveFrom_Utils.getTopLevelDomain(links[i].hostname)) > -1)
        {
          links[i].removeEventListener('click', this.onClick, false);
          links[i].addEventListener('click', this.onClick, false);
        }
      }

      // hide menu on click outside them
      // process dinamically added links
      if (document.body) {
        document.body.removeEventListener('click', this.onBodyClick, true);
        document.body.addEventListener('click', this.onBodyClick, true);
      }
    },


    checkUrl: function(url)
    {
      for(var h in this.hostings)
      {
        var params = this.hostings[h],
          l = params.re.length;

        for(var i = 0; i < l; i++)
        {
          var match = url.match(params.re[i]);
          if(match)
          {
            return {
              hosting: h,
              action: params.action,
              extVideoId: match[1]
            };
          }
        }
      }

      return null;
    },

    reMapHosting: function(action) {
      var map = {
        'getYoutubeLinks': 'youtube',
        'getVimeoLinks': 'vimeo',
        'getDailymotionLinks': 'dailymotion',
        'getFacebookLinks': 'facebook'
      };

      return map[action];
    },


    onClick: function(event, a)
    {
      var _this = SaveFrom_Utils.embedDownloader;

      if(!a)
      {
        a = event.target;
        while(a.parentNode) {
          if(a.nodeName === 'A')
            break;
          a = a.parentNode;
        }

        if(!a)
          return;
      }

      var href = a.getAttribute('data-savefrom-get-links');
      if(!href)
        return;

      if(event.button !== 0 || event.ctrlKey || event.shiftKey)
        return;

      if(_this.lastLink === a && _this.panel && _this.panel.style.display != 'none')
      {
        _this.lastLink = null;
        _this.panel.style.display = 'none';

        event.preventDefault();
        event.stopPropagation();
        return;
      }

      _this.lastLink = a;
      var data = _this.checkUrl(href);
      if(!data)
        return;

      event.preventDefault();
      event.stopPropagation();

      var request = {
        action: data.action,
        extVideoId: data.extVideoId
      };

      _this.showLinks(mono.global.language.download + ' ...', null, a);

      mono.sendMessage(request, function(response) {
        var hosting = data.hosting;

        if(response.action != request.action)
        {
          hosting = _this.reMapHosting(response.action);
        }

        if(response.links)
          _this.showLinks(response.links, response.title, a, hosting, true);
        else
          _this.showLinks(mono.global.language.noLinksFound, null, a, undefined, true);
      });

      return false;
    },


    onBodyClick: function(event)
    {
      var _this = SaveFrom_Utils.embedDownloader;

      if(!_this.panel || _this.panel.style.display == 'none')
      {
        var node = event.target;
        while(node.parentNode) {
          if(node.tagName === 'A')
            break;
          node = node.parentNode;
        }

        // dinamic links
        if(node.nodeName === 'A' && node.hasAttribute(_this.dataAttr) &&
          ['savefrom.net', 'sf-addon.com'].indexOf(SaveFrom_Utils.getTopLevelDomain(node.hostname)) > -1)
        {
          return _this.onClick(event, node);
        }

        return;
      }

      node = event.target;
      while(node.parentNode) {
        if(node === _this.panel)
          return;
        node = node.parentNode;
      }

      _this.lastLink = null;
      _this.panel.style.display = 'none';
    },

    hidePanel: function()
    {
      if (this.panel) {
        this.panel.style.display = 'none';
      }
    },

    createMenu: function(links, title, a, hname, update) {
      var menuLinks = mono.global.language.noLinksFound;
      if (typeof links === 'string') {
        menuLinks = links;
      } else
      if (SaveFrom_Utils.popupMenu.prepareLinks[hname] !== undefined && links) {
        menuLinks = SaveFrom_Utils.popupMenu.prepareLinks[hname](links, title, SaveFrom_Utils);
      }
      var options = {
        links: menuLinks,
        button: a,
        popupId: undefined,
        showFileSize: true,
        containerClass: this.containerClass,
        linkClass: this.linkClass,
        style: {
          popup: (this.style)?this.style.container:undefined,
          item: (this.style)?this.style.link:undefined
        },
        isUpdate: update
      };
      if (update && this.panel) {
        SaveFrom_Utils.popupMenu.update(this.panel, options)
      } else {
        this.panel = SaveFrom_Utils.popupMenu.create(options);
      }
    },

    showLinks: function(links, title, a, hname, update)
    {
      var panel, id = a.getAttribute(this.dataIdAttr);
      if(id)
        panel = document.getElementById(id);

      if(!panel)
      {
        this.createMenu(links, title, a, hname, update);

        return;
      }
      else if(this.panel)
      {
        this.panel.style.display = 'none';
      }

      if(typeof(links) == 'string')
      {
        panel.textContent = links;
      }
      else if(!links || links.length == 0)
      {
        panel.textContent = mono.global.language.noLinksFound;
      }
      else
      {
        // append links
        if(hname && this.hostings[hname] && this.hostings[hname].prepareLinks)
          links = this.hostings[hname].prepareLinks(links);

        panel.textAlign = '';

        for(var i = 0; i < links.length; i++)
        {
          if(links[i].url && links[i].name)
          {
            var a = document.createElement('a');
            a.href = links[i].url;
            a.title = mono.global.language.downloadTitle;
            a.appendChild(document.createTextNode(links[i].name));
            var span = document.createElement('span');
            span.className = this.linkClass;

            span.appendChild(a);
            panel.appendChild(span);

            SaveFrom_Utils.appendFileSizeIcon(a);
            if(links[i].noSound)
              SaveFrom_Utils.appendNoSoundIcon(a);

            if(title && !links[i].noTitle && links[i].type)
            {
              a.setAttribute('download', mono.fileName.modify(
                  title + '.' + links[i].type.toLowerCase()));

              a.addEventListener('click', SaveFrom_Utils.downloadOnClick, false);
            }
          }
        }
      }
    }
  },

  createUmmyInfo: function(id) {
    var oldContainers = document.querySelectorAll('.sf-ummy-info-popup-container');
    for (var i = 0, item; item = oldContainers[i]; i++) {
      item.parentNode.removeChild(item);
    }
    oldContainers = null;
    item = null;

    var infoContainer = document.createElement('div');
    infoContainer.classList.add('sf-ummy-info-popup-container');
    infoContainer.style.position = 'absolute';
    infoContainer.style.zIndex = 9999;

    var info = document.createElement('div');

    var corner = document.createElement('span');
    var corner2 = document.createElement('span');
    corner.style.display = 'inline-block';
    corner2.style.display = 'inline-block';

    SaveFrom_Utils.setStyle(corner, {
      border: '8px solid transparent',
      borderRight: '10px solid rgb(192, 187, 187)',
      borderLeft: 0,
      width: 0,
      top: '8px',
      left: '11px',
      position: 'absolute'
    });
    SaveFrom_Utils.setStyle(corner2, {
      border: '8px solid transparent',
      borderRight: '10px solid #fff',
      borderLeft: 0,
      width: 0,
      top: '8px',
      left: '12px',
      position: 'absolute'
    });

    infoContainer.appendChild(corner);
    infoContainer.appendChild(corner2);

    corner = null;
    corner2 = null;

    info.classList.add('sf-ummy-info-popup');
    info.style.backgroundColor = '#fff';
    info.style.border = '1px solid #ccc';
    info.style.marginLeft = '21px';
    info.style.padding = '6px 5px';
    info.style.textAlign = 'center';
    info.style.maxWidth = '240px';
    info.style.lineHeight = '16px';
    info.style.fontSize = '12px';
    info.style.fontFamily = 'font-family: arial, sans-serif';
    info.appendChild(mono.parseTemplate(mono.global.language.ummyMenuInfo.replace('{url}', 'http://videodownloader.ummy.net/?'+mono.param({
      VID: 111,
      ID: id
    }))));
    info.appendChild(mono.create('style', {text: '' +
        '.sf-ummy-info-popup > p > .green-btn-2.arrow {' +
        'color: #fff;' +
        'background: #84bd07;' +
        'border-radius: 5px;' +
        'display: inline-block;' +
        'position: relative;' +
        'line-height: 1;' +
        'padding: 8px 34px 8px 10px;' +
        'text-decoration: none;' +
        '}' +
        '.sf-ummy-info-popup > p > .green-btn-2.arrow:hover {' +
        'color: #fff;' +
        'opacity: .8;' +
        '}' +
        '.sf-ummy-info-popup > p {' +
        'margin: 0 0 .8em 0;' +
        '}' +
        '.sf-ummy-info-popup > p.center {' +
        'text-align: center;' +
        '}' +
        '.sf-ummy-info-popup > p > .green-btn-2.arrow:after {' +
        'background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAYAAAAmL5yKAAAAjklEQVQoke3RsRGCQBCF4YuJsQDoQMpjKMImtAjth9xMEj4DF4c5QDH3n7lk773b3XsJNzTpR9DglrwYcUG9w1iHdoTpgYkBJ5QrxkPcDXNDQm/JHR2KOF3UcvoUgnZL8KFBi2I+Yrk2YsZjsaIsBVQ4i08KxqhVu1OYBLji+E/hzTKFlV13pfAVGynkPAFtrlNTMRczMgAAAABJRU5ErkJggg==) 0 0 no-repeat;' +
        'content: "";' +
        'display: block;' +
        'position: absolute;' +
        'width: 16px;' +
        'height: 14px;' +
        'top: 50%;' +
        'right: 10px;' +
        'margin-top: -7px;' +
        '}'})
    );
    infoContainer.appendChild(info);
    mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
      var icon = info.querySelector('img');
      icon.src = dataImg;
    });


    mono.on(infoContainer, 'mouseclick', function(e) {
      e.stopPropagation();
    });
    mono.on(infoContainer, 'mousedown', function(e) {
      e.stopPropagation();
    });

    return infoContainer;
  },
  bindUmmyInfo: function(container, id) {
    var infoPopup;
    var infoPopupOver = 0;
    var infoPopupShowTimes;
    mono.on(container, 'mouseenter', function() {
      var el = container;
      var position;
      var size;

      if (infoPopup && infoPopup.parentNode === null) {
        document.body.appendChild(infoPopup);
      }

      if (!infoPopup) {
        var oldElList = document.querySelectorAll('.sf-ummy-info-popup-cont');
        for (var n = 0, oldEl; oldEl = oldElList[n]; n++) {
          oldEl.parentNode.removeChild(oldEl);
        }

        infoPopup = SaveFrom_Utils.createUmmyInfo(id);

        position = SaveFrom_Utils.getPosition(el);
        size = SaveFrom_Utils.getSize(el);
        infoPopup.style.top = (position.top - 4) + 'px';
        infoPopup.style.left = (size.width + position.left - 21) + 'px';

        mono.on(infoPopup, 'mouseenter', function() {
          clearTimeout(infoPopupShowTimes);
          infoPopupOver = 1;
        });
        mono.on(infoPopup, 'mouseleave', function() {
          infoPopupShowTimes = setTimeout(function() {
            infoPopupOver = 0;
            infoPopup.style.display = 'none';
          }, 50);
        });

        document.body.appendChild(infoPopup);
      } else {
        infoPopup.style.display = 'block';
        position = SaveFrom_Utils.getPosition(el);
        infoPopup.style.top = (position.top - 4) + 'px';
      }

      el = null;
    });
    mono.on(container, 'mouseleave', function() {
      setTimeout(function() {
        if (!infoPopup || infoPopupOver === 1) {
          return;
        }
        infoPopup.style.display = 'none';
      }, 50);
    });
  },

  popupMenu: {
    popupId: 'sf_popupMenu',
    popup: undefined,
    popupStyle: undefined,
    dataArrtVisible: 'data-isVisible',
    extStyleCache: undefined,

    badgeQualityList: ['8k', '4k', '1440', '1080', '720', 'ummy'],
    createBadge: function(qulity, options) {
      var container = document.createElement('div');

      SaveFrom_Utils.setStyle(container, {
        display: 'inline-block',
        lineHeight: '18px',
        width: '19px',
        height: '17px',
        color: '#fff',
        fontSize: '12px',
        borderRadius: '2px',
        verticalAlign: 'middle',
        textAlign: 'center',
        paddingRight: '2px',
        fontWeight: 'bold',
        marginLeft: '3px'
      });

      if (qulity === '1080' || qulity === '1440' || qulity === '720') {
        container.textContent = 'HD';
        container.style.backgroundColor = '#505050';
        container.style.paddingRight = '1px';
      } else
      if (qulity === '8k' || qulity === '4k') {
        container.textContent = 'HD';
        container.style.paddingRight = '1px';
        container.style.backgroundColor = 'rgb(247, 180, 6)';
      } else
      if (qulity === 'mp3') {
        container.textContent = 'MP3';
        container.style.width = '26px';
        container.style.paddingRight = '1px';
        container.style.backgroundColor = '#505050';
      } else
      if (qulity === 'ummy') {
        mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
          container.style.background = 'url('+dataImg+') center center no-repeat';
        });
      }
      return container;
    },

    createPopupItem: function(listItem, options) {
      var _this = SaveFrom_Utils.popupMenu;

      var href;
      if (typeof listItem === 'string') {
        href = listItem;
      } else {
        href = listItem.href;
      }

      if (href === '-') {
        var line = document.createElement('div');
        SaveFrom_Utils.setStyle(line, {
          display: 'block',
          margin: '1px 0',
          borderTop: '1px solid rgb(214, 214, 214)'
        });
        return {el: line};
      }

      var itemContainer = document.createElement( (href === '-text-') ? 'div' : 'a' );
      if (options.linkClass) {
        itemContainer.classList.add(options.linkClass);
      }
      var itemContainerStyle = {
        display: 'block',
        padding: '0 5px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      };
      if (listItem.isHidden) {
        itemContainer.setAttribute(_this.dataArrtVisible, '0');
        itemContainerStyle.display = 'none';
      }
      SaveFrom_Utils.setStyle(itemContainer, itemContainerStyle);

      if (href === '-text-') {
        itemContainer.style.lineHeight = '22px';
        return {el: itemContainer};
      }

      itemContainer.href = href;

      if (href === '#') {
        return {el: itemContainer};
      }

      if (mono.isGM || mono.isOpera || mono.isSafari) {
        if (listItem.quality !== 'ummy') {
          itemContainer.title = mono.global.language.downloadTitle;
        }
      }

      var onClickData = {
        itag: listItem.itag || (listItem.isSubtitle ? listItem.langCode : ''),
        quality: listItem.quality || '',
        format: listItem.format || '???',
        '3d': listItem['3d'] ? '3D' : '',
        sFps: listItem.sFps ? 'fps' + (listItem.fps || '60') : '',
        noAudio: listItem.noAudio ? 'no audio' : '',
        uIsAudio: listItem.uIsAudio ? 'audio' : ''
      };

      if (listItem.title && listItem.format) {
        var ext = listItem.ext;
        if(!ext) {
          ext = listItem.format.toLowerCase();
        }
        itemContainer.setAttribute('download', mono.fileName.modify(listItem.title + '.' + ext) );
        if (listItem.forceDownload) {
          itemContainer.addEventListener('click', function(event) {
            options.onItemClick && options.onItemClick(onClickData);
            SaveFrom_Utils.downloadOnClick(event, null, {
              useFrame: listItem.useIframe || false,
              el: this
            });
          }, false);
        } else
        if (options.onItemClick !== undefined) {
          itemContainer.addEventListener('click', function() {
            options.onItemClick(onClickData);
          }, false);
        }
      } else
      if (options.onItemClick !== undefined) {
        itemContainer.addEventListener('click', function() {
          options.onItemClick(onClickData);
        }, false);
      }
      if (listItem.func !== undefined) {
        itemContainer.addEventListener('click', listItem.func, false);
      }
      if (listItem.isBank !== undefined) {
        itemContainer.setAttribute('target', 'blank');
      }

      var titleContainer = document.createElement('span');
      SaveFrom_Utils.setStyle(titleContainer, {
        cssFloat: 'left'
      });

      if ( listItem.quality === 'ummy' ) {
        // yammy hook
        titleContainer.appendChild(mono.parseTemplate(mono.global.language.ummyMenuItem));
        var uSpan = titleContainer.querySelector('span');
        var badge;
        if (listItem.uQuality !== -1) {
          badge = _this.createBadge(listItem.uIsAudio ? 'mp3' : listItem.uQuality, options);
        } else {
          badge = document.createDocumentFragment();
        }
        titleContainer.replaceChild(badge, uSpan);
      } else
      if (listItem.itemText) {
        titleContainer.textContent = listItem.itemText;
      } else {
        var titleQuality = listItem.quality?' '+listItem.quality:'';
        var titleFormat = listItem.format ? listItem.format : '???';
        var title3D = listItem['3d'] ? '3D ' : '';
        var titleFps = listItem.sFps ? ' ' + (listItem.fps || '60') : '';
        titleContainer.textContent = title3D + titleFormat + titleQuality + titleFps;
      }

      if (_this.badgeQualityList.indexOf( String(listItem.quality) ) !== -1) {
        titleContainer.appendChild(_this.createBadge( String(listItem.quality), options));
      }

      itemContainer.appendChild(titleContainer);
      titleContainer = null;

      var infoConteiner = document.createElement('span');
      SaveFrom_Utils.setStyle(infoConteiner, {
        cssFloat: 'right',
        lineHeight: '22px',
        height: '22px'
      });
      var sizeIconStyle = {
        top: '5px',
        verticalAlign: 'top'
      };
      var sizeIconTextStyle = {
        marginLeft: 0
      };

      if (listItem.noAudio) {
        SaveFrom_Utils.appendNoSoundIcon(infoConteiner, sizeIconStyle);
      }

      if (!listItem.noSize) {
        infoConteiner.addEventListener('click', function onClick(e) {
          if (infoConteiner.firstChild.tagName === 'IMG') {
            e.preventDefault();
            e.stopPropagation();
            mono.trigger(infoConteiner.firstChild, 'click', {cancelable: true});
          }
          this.removeEventListener('click', onClick);
        });
        SaveFrom_Utils.appendFileSizeIcon(itemContainer, sizeIconStyle, sizeIconTextStyle, undefined, true, infoConteiner);
      }

      itemContainer.appendChild(infoConteiner);

      if (mono.global.preference.showUmmyInfo && listItem.quality === 'ummy') {
        SaveFrom_Utils.bindUmmyInfo(itemContainer, listItem.id);
      }

      return {el: itemContainer, sizeIcon: infoConteiner.lastChild, prop: listItem, onClickData: onClickData};
    },

    sortMenuItems: function(list, options) {
      if (options === undefined) {
        options = {};
      }
      var formatPriority = ['ummy','Audio Opus','Audio OGG','Audio AAC','3GP','WebM','FLV','MP4'];
      var strQuality = {
        Mobile: 280,
        SD: 360,
        HD: 720,
        '480 low': 478,
        '480 med': 479,
        '480 high': 480,
        'ummy': 1
      };
      var sizePriority = {};
      var bitratePriority = [];
      var defList = [];
      var audioList = [];
      var subtitleList = [];
      var mute60List = [];
      var muteList = [];
      var _3dList = [];
      var unkList = [];

      list.forEach(function(item) {
        var prop = item.prop;
        if (options.noProp) {
          prop = item;
        }
        if (!prop.format) {
          unkList.push(item);
          return 1;
        }
        if (prop.isSubtitle) {
          subtitleList.push(item);
        } else
        if (!prop.noVideo) {
          var size = strQuality[prop.quality] || -1;
          if (size === -1) {
            if (String(prop.quality).substr(-1) === 'k') {
              size = parseInt(prop.quality) * 1000;
            } else {
              size = parseInt(prop.quality);
            }
          }
          if (options.maxSize && size > options.maxSize) {
            return 1;
          }
          if (options.minSize && size < options.minSize) {
            return 1;
          }
          sizePriority[prop.quality] = size;
          if (prop.noAudio) {
            if (prop.sFps) {
              mute60List.push(item);
            } else {
              muteList.push(item);
            }
          } else
          if (prop['3d']) {
            _3dList.push(item);
          } else {
            defList.push(item);
          }
        } else {
          bitratePriority[prop.quality] = parseInt(prop.quality);
          audioList.push(item);
        }
      });
      var sizeCompare = function(a, b) {
        return sizePriority[a.quality] > sizePriority[b.quality]? -1 : sizePriority[a.quality] === sizePriority[b.quality]? 0 : 1;
      };
      var bitrateCompare = function(a, b) {
        return bitratePriority[a.quality] > bitratePriority[b.quality]? -1 : (bitratePriority[a.quality] === bitratePriority[b.quality])? 0 : 1;
      };
      var formatCompare = function(a, b) {
        if (a.noVideo && b.noVideo) {
          return bitrateCompare(a, b);
        }
        if (a.noVideo) {
          return 1;
        }
        if (b.noVideo) {
          return -1;
        }
        return formatPriority.indexOf(a.format) > formatPriority.indexOf(b.format)? -1 : formatPriority.indexOf(a.format) === formatPriority.indexOf(b.format)? 0 : 1;
      };

      var compare = function(aa, bb) {
        var a = aa.prop;
        var b = bb.prop;
        if (options.noProp) {
          a = aa;
          b = bb;
        }

        var size = sizeCompare(a, b);
        if (size !== 0) {
          return size;
        }
        return formatCompare(a, b);
      };
      defList.sort(compare);
      _3dList.sort(compare);
      audioList.sort(compare);
      mute60List.sort(compare);
      muteList.sort(compare);

      if (options.typeList) {
        var resList = [];
        if (options.typeList.indexOf('video') !== -1) {
          resList = resList.concat(defList);
        }
        if (options.typeList.indexOf('3d') !== -1) {
          resList = resList.concat(_3dList);
        }
        if (options.typeList.indexOf('audio') !== -1) {
          resList = resList.concat(audioList);
        }
        if (options.typeList.indexOf('mute') !== -1) {
          resList = resList.concat(muteList);
        }
        if (options.typeList.indexOf('mute60') !== -1) {
          resList = resList.concat(mute60List);
        }
        if (options.typeList.indexOf('subtitles') !== -1) {
          resList = resList.concat(subtitleList);
        }
        if (options.typeList.indexOf('other') !== -1) {
          resList = resList.concat(unkList);
        }
        return resList;
      }
      return defList.concat(_3dList, audioList, subtitleList, mute60List, muteList, unkList);
    },

    removePanel: function() {
      if (this.popup.parentNode !== null) {
        this.popup.parentNode.removeChild(this.popup);
      }
      if (this.popupStyle !== undefined && this.popupStyle.parentNode !== null) {
        this.popupStyle.parentNode.removeChild(this.popupStyle);
      }
      this.popup = undefined;
      this.popupStyle = undefined;
    },

    getContent: function(options) {
      var _this = this;
      var links = options.links;

      var content = document.createDocumentFragment();

      var sizeIconList = [];

      if(typeof(links) === 'string') {
        var loadingItem = _this.createPopupItem('-text-', options).el;
        loadingItem.textContent = links;
        content.appendChild( loadingItem );
      } else {

        var items = [];
        links.forEach(function(link) {
          items.push(_this.createPopupItem(link, options));
        });

        if (items.length === 0) {
          var emptyItem = _this.createPopupItem('-text-', options).el;
          emptyItem.textContent = mono.global.language.noLinksFound;
          content.appendChild( emptyItem );
        }

        var hiddenList = [];

        items = _this.sortMenuItems(items);

        var hasBest = false;
        items.forEach(function(item) {
          if (item.prop.isHidden) {
            hiddenList.push(item.el);
            return 1;
          }
          if (hasBest === false) {
            item.onClickData.isBest = hasBest = true;
          }
          content.appendChild(item.el);

          if (options.showFileSize && !item.prop.noSize) {
            sizeIconList.push(item.sizeIcon);
          }
        });

        if (hiddenList.length > 0) {

          var scrollListItemCount = 8;
          if (hiddenList.length > scrollListItemCount) {
            var scrollContainer = document.createElement('div');
            scrollContainer.setAttribute(_this.dataArrtVisible, 0);

            scrollContainer.addEventListener('wheel', function(e) {
              if (e.wheelDeltaY > 0 && this.scrollTop === 0) {
                e.preventDefault();
              } else
              if (e.wheelDeltaY < 0 && this.scrollHeight - (this.offsetHeight + this.scrollTop) <= 0) {
                e.preventDefault();
              }
            });

            var hasTopShadow = false;
            scrollContainer.addEventListener('scroll', function(e) {
              if (this.scrollTop !== 0) {
                if (hasTopShadow) {
                  return;
                }
                hasTopShadow = true;
                this.style.boxShadow = 'rgba(0, 0, 0, 0.40) -2px 1px 2px 0px inset';
              } else {
                if (!hasTopShadow) {
                  return;
                }
                hasTopShadow = false;
                this.style.boxShadow = '';
              }
            });

            SaveFrom_Utils.setStyle(scrollContainer, {
              maxHeight: (scrollListItemCount * 24)+'px',
              overflowY: 'scroll',
              display: 'none'
            });
            hiddenList.forEach(function (item) {
              scrollContainer.appendChild(item);
            });
            content.appendChild(scrollContainer);
          } else {
            hiddenList.forEach(function (item) {
              content.appendChild(item);
            });
          }

          var moreItem = _this.createPopupItem('#', options).el;
          moreItem.textContent = mono.global.language.more + ' ' + String.fromCharCode(187);//171 //160 - space
          moreItem.setAttribute('data-visible', 0);
          moreItem.addEventListener('click', function(e) {
            e.preventDefault();
            var state = this.getAttribute('data-visible');
            var symbol;
            if (state > 0) {
              state--;
              symbol = 187;
            } else {
              state++;
              symbol = 171;
            }
            this.textContent = mono.global.language.more + ' ' + String.fromCharCode(symbol);
            moreItem.setAttribute('data-visible', state);
            var itemList = this.parentNode.querySelectorAll('*[' + _this.dataArrtVisible + ']');
            for (var i = 0, item; item = itemList[i]; i++) {
              if (state === 1) {
                item.style.display = 'block';
              } else {
                item.style.display = 'none';
              }
              item.setAttribute( _this.dataArrtVisible, state);
            }
          });
          var separator = _this.createPopupItem('-', options).el;
          content.appendChild(separator);
          content.appendChild(moreItem);
        }

      }

      return {sizeIconList: sizeIconList, content: content};
    },

    create: function(options) {
      var button = options.button;
      var _this = SaveFrom_Utils.popupMenu;

      options.offsetRight = options.offsetRight || 0;

      options.parent = options.parent || document.body;

      if (options.isUpdate && (_this.popup === undefined || _this.popup.style.display === 'none')) {
        return;
      }

      if(_this.popup) {
        _this.removePanel();
      }

      var popupContainer = _this.popup = document.createElement('div');
      var containerSelector = '#'+_this.popupId;
      if (options.popupId) {
        containerSelector = '#'+options.popupId;
        popupContainer.id = options.popupId;
      } else
      if (options.containerClass) {
        containerSelector = '.'+options.containerClass;
        popupContainer.classList.add(options.containerClass);
      } else {
        popupContainer.id = _this.popupId;
      }

      var popupContainerStyle = {
        display: 'block',
        position: 'absolute',
        minHeight: '24px',
        cursor: 'default',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        fontFamily: 'arial, sans-serif'
      };
      if (options.extStyle) {
        delete popupContainerStyle.display;
      }

      var pos = SaveFrom_Utils.getPosition(button, options.parent),
        size = SaveFrom_Utils.getSize(button);

      popupContainerStyle.top = (pos.top + size.height) + 'px';
      popupContainerStyle.left = (pos.left + options.offsetRight) + 'px';
      SaveFrom_Utils.setStyle(popupContainer, popupContainerStyle);

      var popupCustomContainerStyle = {
        'background-color': '#fff',
        'z-index': '9999',
        'box-shadow': '0 2px 10px 0 rgba(0,0,0,0.2)',
        border: '1px solid #ccc',
        'border-radius': '4px',
        'font-size': '12px',
        'font-weight': 'bold',
        'min-width': '190px'
      };

      if (options.style && options.style.popup) {
        for (var key in options.style.popup) {
          var value = options.style.popup[key];
          popupCustomContainerStyle[key] = value;
        }
      }

      SaveFrom_Utils.addStyleRules(containerSelector, popupCustomContainerStyle);

      var itemCustomStyle = {
        'line-height': '24px',
        color: '#3D3D3D'
      };

      if (options.style && options.style.item) {
        for (var key in options.style.item) {
          var value = options.style.item[key];
          itemCustomStyle[key] = value;
        }
      }

      SaveFrom_Utils.addStyleRules(containerSelector+' '+( (options.linkClass)?'.'+options.linkClass:'a' ), itemCustomStyle);

      popupContainer.addEventListener('click', function(e) {
        e.stopPropagation();
      });
      popupContainer.addEventListener('mouseover', function(e) {
        e.stopPropagation();
      });
      popupContainer.addEventListener('mouseup', function(e) {
        e.stopPropagation();
      });
      popupContainer.addEventListener('mousedown', function(e) {
        e.stopPropagation();
      });
      popupContainer.addEventListener('mouseout', function(e) {
        e.stopPropagation();
      });



      while (popupContainer.firstChild !== null) {
        popupContainer.removeChild(popupContainer.firstChild);
      }

      var menuContent = _this.getContent.call(_this, options);
      var sizeIconList = menuContent.sizeIconList;
      menuContent = menuContent.content;
      popupContainer.appendChild(menuContent);


      var hoverBgColor = '#2F8AFF';
      var hoverTextColor = '#fff';
      if (options.style && options.style.hover) {
        hoverBgColor = options.style.hover.backgroundColor || hoverBgColor;
        hoverTextColor = options.style.hover.color || hoverTextColor;
      }
      var styleEl = _this.popupStyle = document.createElement('style');
      styleEl.textContent = containerSelector + ' a:hover'+
        '{'+
        'background-color: '+hoverBgColor+';'+
        'color: '+hoverTextColor+';'+
        '}'+
        containerSelector + ' > a:first-child'+
        '{'+
        'border-top-left-radius: 4px;'+
        'border-top-right-radius: 4px;'+
        '}'+
        containerSelector + ' > a:last-child'+
        '{'+
        'border-bottom-left-radius: 4px;'+
        'border-bottom-right-radius: 4px;'+
        '}';

      options.parent.appendChild(styleEl);
      options.parent.appendChild(popupContainer);
      if (options.extStyle) {
        if (SaveFrom_Utils.popupMenu.extStyleCache !== undefined && SaveFrom_Utils.popupMenu.extStyleCache.parentNode !== null) {
          SaveFrom_Utils.popupMenu.extStyleCache.parentNode.removeChild(SaveFrom_Utils.popupMenu.extStyleCache);
        }

        var extElClassName = 'sf-extElStyle_'+containerSelector.substr(1);
        var extBodyClassName = 'sf-extBodyStyle_'+containerSelector.substr(1);
        var extBodyStyle = document.querySelector('style.'+extBodyClassName);
        if (extBodyStyle === null) {
          document.body.appendChild( mono.create('style', {
            class: extBodyClassName,
            text: containerSelector+' {' +
              'display: none;' +
              '}'
          }) );
        }
        SaveFrom_Utils.popupMenu.extStyleCache = options.extStyle.appendChild(mono.create('style', {
          class: extElClassName,
          text: 'body ' + containerSelector + ' {' +
            'display: block;' +
            '}'
        }));
      }

      setTimeout(function() {
        sizeIconList.forEach(function(icon) {
          mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
        });
      });

      return popupContainer;
    },

    update: function(popupContainer, options) {
      var _this = SaveFrom_Utils.popupMenu;

      while (popupContainer.firstChild !== null) {
        popupContainer.removeChild(popupContainer.firstChild);
      }

      var menuContent = _this.getContent.call(_this, options);
      var sizeIconList = menuContent.sizeIconList;
      menuContent = menuContent.content;
      popupContainer.appendChild(menuContent);

      setTimeout(function() {
        sizeIconList.forEach(function(icon) {
          mono.trigger(icon, 'click', {bubbles: false, cancelable: true});
        });
      });
    },

    prepareLinks: {
      youtube: function(links, title, subtitles) {
        subtitles = subtitles || [];
        links = mono.extend({}, links);
        var sfUtilsYt = SaveFrom_Utils.video.yt;
        sfUtilsYt.init();
        /*
        var titleAttr = '';
        if (title) {
          titleAttr = '&title=' + encodeURIComponent(title);
          for (var key in links) {
            links[key] += titleAttr;
          }
        }
        */
        sfUtilsYt.filterLinks(links);

        var menuLinks = [];
        var popupLink;
        var ummyQuality = -1;
        var ummyHasAudio = false;
        for (var format in sfUtilsYt.format) {
          var formatList = sfUtilsYt.format[format];
          for (var itag in formatList) {
            if (links[itag] === undefined) {
              continue;
            }

            var prop = formatList[itag];
            var isHidden = false;
            if (!sfUtilsYt.showFormat[format]) {
              isHidden = true;
            }
            if (prop['3d'] && !sfUtilsYt.show3D) {
              isHidden = true;
            }
            if (prop.noAudio && !sfUtilsYt.showMP4NoAudio) {
              isHidden = true;
            }

            popupLink = { href: links[itag], isHidden: isHidden, title: title, format: format, itag: itag };

            for (var pItem in prop) {
              popupLink[pItem] = prop[pItem];
            }

            if (links.meta && links.meta[itag] && links.meta[itag].fps) {
              popupLink.fps = links.meta[itag].fps;
            }

            if(prop.noVideo || prop.noAudio) {
              if (!prop.noAudio) {
                ummyHasAudio = true;
              }
              popupLink.forceDownload = true;
              popupLink.useIframe = true;
            }

            var qIndex = SaveFrom_Utils.popupMenu.badgeQualityList.indexOf(popupLink.quality);
            if (qIndex !== -1 && (ummyQuality === -1 || qIndex < ummyQuality) ) {
              ummyQuality = qIndex;
            }

            menuLinks.push(popupLink);
            delete links[itag];
          }
        }
        if (ummyQuality !== -1) {
          if (ummyQuality === 0) {
            ummyQuality = 1;
          }
          ummyQuality = SaveFrom_Utils.popupMenu.badgeQualityList[ummyQuality];
        }
        var ummyLinkParam = mono.parseUrlParams(links.ummy || links.ummyAudio || '');
        for (var itag in links) {
          if (itag === 'meta') {
            continue;
          }
          if (itag === 'ummy') {
            popupLink = { href: links[itag], quality: 'ummy', noSize: true, format: 'ummy', itag: 'ummy', uQuality: ummyQuality, id: ummyLinkParam.v };
          } else
          if (itag === 'ummyAudio') {
            popupLink = { href: links[itag], quality: 'ummy', noSize: true, format: 'ummy', itag: 'ummyAudio', uIsAudio: true, id: ummyLinkParam.v };
          } else {
            popupLink = { href: links[itag], isHidden: true, title: title, quality: itag, itag: itag };
          }
          menuLinks.push(popupLink);
          delete links[itag];
        }
        for (var i = 0, item; item = subtitles[i]; i++) {
          popupLink = { href: item.url, isHidden: true, quality: 'SRT' + (item.isAuto ? 'A' : ''), itemText: mono.global.language.subtitles + ' (' + item.lang + ')', title: title + '-' + item.langCode, ext: 'srt', format: 'SRT', isSubtitle: true, forceDownload: true, langCode: item.langCode };
          menuLinks.push(popupLink);
        }

        return menuLinks;
      },
      vimeo: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.ext;
          if(!ext)
          {
            ext = 'MP4';
            if(link.url.search(/\.flv($|\?)/i) != -1)
              ext = 'FLV';
          }
          var quality = link.name ? link.name : ext;
          var format = link.type ? link.type : ext;
          format = format.toUpperCase();
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true, useIframe: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      vk: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.name|| link.ext;
          var format = (ext)?ext.toUpperCase():'';
          var quality = (link.subname)?link.subname:'';
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true, useIframe: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      dailymotion: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var format = link.ext;
          var quality = (link.height)?link.height:'';
          popupLink = { href: link.url, title: title, ext: format, format: format, quality: quality, forceDownload: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      },
      facebook: function(links, title) {
        var menuLinks = [];
        var popupLink;
        links.forEach(function(link) {
          var ext = link.ext;
          var format = (ext)?ext.toUpperCase():'';
          var quality = link.name;
          popupLink = { href: link.url, title: title, ext: ext, format: format, quality: quality, forceDownload: true };
          menuLinks.push(popupLink);
        });
        return menuLinks;
      }
    },

    quickInsert: function(target, links, id, args) {
      if (args === undefined) {
        args = {};
      }
      var out = {};
      var hideMenu = function() {
        menu.style.display = 'none';
        mono.off(document, 'mousedown', hideMenu);
        out.isShow = false;
        args.onHide && args.onHide(menu);
      };

      var options = {
        links: links,
        button: target,
        popupId: id,
        showFileSize: true,
        parent: args.parent,
        extStyle: args.extStyle,
        offsetRight: args.offsetRight
      };

      var menu = SaveFrom_Utils.popupMenu.create(options);

      args.onShow && args.onShow(menu);

      mono.off(document, 'mousedown', hideMenu);
      mono.on(document, 'mousedown', hideMenu);

      return out = {
        isShow: true,
        tag: args.tag,
        el: menu,
        hide: hideMenu,
        update: function(links) {
          options.links = links;
          SaveFrom_Utils.popupMenu.update(menu, options)
        }
      }
    }
  },

  mobileLightBox: {
    id: 'sf-lightbox',
    clear: function() {
      var el = document.getElementById(SaveFrom_Utils.mobileLightBox.id);
      if (el === null) {
        return;
      }
      el.parentNode.removeChild(el);
    },
    getTitle: function(item) {
      var title = [];

      title.push(item.format || '???');
      if (item.quality) {
        title.push(item.quality + (item.sFps ? ' ' + (item.fps || '60') : ''));
      }
      if (item['3d']) {
        title.push('3D');
      }
      if (item.noAudio) {
        title.push(mono.global.language.withoutAudio);
      }

      return title.join(' ');
    },
    createItem: function(listItem) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      var button = mono.create('a', {
        style: {
          display: 'block',
          marginBottom: '6px',
          border: 'solid 1px #d3d3d3',
          lineHeight: '36px',
          minHeight: '36px',
          background: '#f8f8f8',
          verticalAlign: 'middle',
          fontSize: '15px',
          textAlign: 'center',
          color: '#333',
          borderRadius: '2px',
          overflow: 'hidden'
        }
      });

      if (typeof listItem === 'string') {
        button.textContent = listItem;
        return button;
      } else {
        button.href = listItem.href;
        button.download = listItem.title;
        button.textContent = mobileLightBox.getTitle(listItem);
      }

      if (listItem.isHidden) {
        button.classList.add('isOptional');
        button.style.display = 'none';
      }

      var sizeIconStyle = {
        verticalAlign: 'middle',
        cssFloat: 'right',
        lineHeight: '36px',
        minHeight: '36px',
        paddingRight: '15px',
        width: '18px'
      };
      var sizeIconTextStyle = {
        cssFloat: 'right',
        paddingRight: '5px'
      };
      SaveFrom_Utils.appendFileSizeIcon(button, sizeIconStyle, sizeIconTextStyle, undefined, true, button);

      return button;
    },
    getItems: function(itemList) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      if (typeof itemList === 'string') {
        return [mobileLightBox.createItem(itemList)];
      }

      var list = [];
      for (var i = 0, item; item = itemList[i]; i++) {
        if (item.quality === 'ummy') {
          continue;
        }
        list.push({el: mobileLightBox.createItem(item), prop: item});
      }
      list = SaveFrom_Utils.popupMenu.sortMenuItems(list);
      var elList = [];
      var hiddenElList = [];
      for (i = 0, item; item = list[i]; i++) {
        if (item.prop.isHidden) {
          hiddenElList.push(item.el);
        } else {
          elList.push(item.el);
        }
      }
      return elList.concat(hiddenElList);
    },
    show: function(itemList) {
      var mobileLightBox = SaveFrom_Utils.mobileLightBox;

      var winHeight = window.innerHeight;
      var mTop = parseInt(winHeight / 100 * 15);
      var btnBox = undefined;

      var exLb = document.getElementById(mobileLightBox.id);
      if (exLb !== null) {
        exLb.parentNode.removeChild(exLb);
      }


      var lbWidth = window.innerWidth;
      if (lbWidth <= 250) {
        lbWidth = '90%';
      } else {
        lbWidth = '70%';
      }

      var lightbox = mono.create('div', {
        id: mobileLightBox.id,
        style: {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 9000,
          height: document.body.scrollHeight,
          background: 'rgba(0,0,0,0.85)',
          textAlign: 'center'
        },
        on: [
          ['touchmove', function(e) {e.preventDefault()}],
          ['click', function(e) {
            e.preventDefault();
            close();
          }]
        ],
        append: mono.create('div', {
          style: {
            display: 'inline-block',
            width: lbWidth,
            backgroundColor: '#eee',
            height: (winHeight - mTop*2)+'px',
            marginTop: mTop+'px',
            borderRadius: '4px',
            padding: '8px',
            position: 'relative'
          },
          append: [
            btnBox = mono.create('div', {
              style: {
                height: (winHeight - 46*2 - mTop*2)+'px',
                overflowY: 'auto',
                marginBottom: '6px'
              },
              append: mobileLightBox.getItems(itemList),
              on: ['touchmove', function(e) {
                e.stopPropagation();
              }]
            }),
            mono.create(mobileLightBox.createItem(mono.global.language.more + ' ' + String.fromCharCode(187)), {
              on: ['click', function(e) {
                e.preventDefault();
                var state = 'none';
                var elList = this.parentNode.querySelectorAll('.isOptional');
                if (this.dataset.state !== 'open') {
                  this.dataset.state = 'open';
                  this.textContent = mono.global.language.more + ' ' + String.fromCharCode(171);
                  state = 'block';
                } else {
                  this.dataset.state = 'close';
                  this.textContent = mono.global.language.more + ' ' + String.fromCharCode(187);
                }
                for (var i = 0, el; el = elList[i]; i++) {
                  el.style.display = state;
                }
              }]
            }),
            mono.create(mobileLightBox.createItem(mono.global.language.close), {
              on: ['click', function(e) {
                e.preventDefault();
                close();
              }]
            })
          ],
          on: ['click', function(e) {
            e.stopPropagation();
          }]
        })
      });
      document.body.appendChild(lightbox);

      var topPos = document.body.scrollTop;
      var close = function() {
        document.body.scrollTop = topPos;
        lightbox.parentNode.removeChild(lightbox);
        lightbox = null;
      };

      return {
        update: function(itemList) {
          if (lightbox === null || lightbox.parentNode === null) {
            return;
          }
          btnBox.textContent = '';
          mono.create(btnBox, {
            append: mobileLightBox.getItems(itemList)
          })
        },
        close: close
      }
    }
  },

  showNotification: function(message, id, onClose) {
    if (!id) {
      id = 'savefrom_popup_panel';
    }
    var panel = document.getElementById(id);
    if(panel)
      panel.parentNode.removeChild(panel);

    panel = document.createElement('div');
    panel.id = id;
    SaveFrom_Utils.setStyle(panel, {
      color: '#000',
      backgroundColor: '#feefae',
      backgroundImage: '-webkit-linear-gradient(top, #feefae, #fbe792)',
      cssFloat: 'none',
      borderBottom: '1px solid #aaaaab',
      display: 'block',
      position: 'fixed',
      zIndex: 2147483647,
      top: 0,
      left: 0,
      right: 0,
      margin: 0,
      padding: 0
    });
    panel.setAttribute('style', panel.style.cssText + ';background-image: linear-gradient(to bottom, #feefae, #fbe792)');

    panel.addEventListener('click', function(e) {
      if (e.target.tagName !== 'A') {
        return;
      }
      panel.parentNode.removeChild(panel);
      if (onClose) {
        onClose(id);
      }
    }, false);

    var content = document.createElement('div');
    SaveFrom_Utils.setStyle(content, {
      color: '#000',
      display: 'block',
      position: 'relative',
      margin: '0 auto',
      paddingLeft: '10px',
      paddingRight: '10px',
      height: '35px',
      fontSize: '16px',
      lineHeight: '35px',
      maxWidth: '960px',
      overflow: 'hidden',
      textAlign: 'center'
    });
    content.textContent = message;

    var btn = document.createElement('div');
    SaveFrom_Utils.setStyle(btn, {
      background: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAOCAYAAABU4P48AAADEUlEQVR42q2WX0hTYRjGdyXIoYuupAsvuuvKi+gm4hCjkrwKwXI1tbH8QyhqOTbPmafhH5zhXKNsmVRg1E1BEEhWBJ3CuslNR6FmlmLqjqWeKLr16zxfO6fvnB1X0D544f2e93nYT/fubA5Hns6T6lLu5ckK8U29V061NKko9NAwy5ktcnCPineIr/bukZOHDqgo9NAwc+T7yK4KfrK5UVmK9pOVyzFTQcMMHrvs4+Kd/IRzv7LpF8h3qctU0DCDJ2+w41UuflYStlavxEiuggdeE+zuXfwHV+WWFdRa8MBrC1BXV3fwX7Tfa1DNpdpaFR1q/cH9LFBWgxcZmi0p4qbKjig61M+bI1mgrAYvMiYAt9td2tDQQGpra9t0DT00zKzAr+u94nIsQlYHY+TznRGCs/78Gb2j0ONghju8yNA12lcibgaCFObr0A3q+zE6ZgCix8GMrofmRcbKUFBeXj6gQ+uw0DCzmifbWuS0BoJaiIRJ4nqcvsiGBrqRgYWGme5DBtlk2VFZh/siXCDJkdsGtA4LDTPdh4zdO21A54LFeSe1q+mrGkimFgb+QBuwmsZ6kEF2tvKUyr79LLQdLAoZ2z32eDwBHRj9dh+46VDQBIxaezpmvCh66xwZZOfcp9Wsp8LDUSOL3jpHJguCXQN2PeyAUx1+OR3XQDK1IWfWYDhOi66HprEeZJB9e7xKZmHYNWDXg/UgYwKoqak5bFkDYz0wswJPBM6Lq4MDRNFAlHt3DdjFaJiWDo0ZPPAig2zi2AlRFUIURB2+ZVoDdj0wox7Ni4yVodDpdHotO1uQ0Qqz/sM+HzfdE1KUazEyf7GLvJDayeKlMMEdhR4aZrjDiwzNao+3+TNN9LG24g+S8Z5e086ih4YZ7vCmMo/E/zoJQeA/9vdu6ZDbFTzwmv5g11l+uTnw1y8OeODN27ddQpL4933dSjoeJWtDMVNBwwwe28+B5xy/0BhQvgU7s0ChYQZP3n9PpPp93FR3pzjT1yPPRcIqCj00zHJmq33cTL0gfmrqkJdaJRWFHhpmrPcXrCMIfexnEK4AAAAASUVORK5CYII=) 0 0 no-repeat',
      position: 'absolute',
      right: '8px',
      top: '50%',
      marginTop: '-7px',
      width: '14px',
      height: '14px',
      overflow: 'hidden',
      cursor: 'pointer'
    });

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      panel.parentNode.removeChild(panel);
      if (onClose) {
        onClose(id);
      }
    }, false);

    mono.on(btn, 'mouseenter', function(){
      this.style.backgroundPosition = '-15px 0';
    });

    mono.on(btn, 'mouseleave', function(){
      this.style.backgroundPosition = '0 0';
    });

    panel.appendChild(content);
    panel.appendChild(btn);
    document.body.appendChild(panel);
  },

  updatePopup: function() {
    var id = 'savefrom_updatePanel';
    mono.sendMessage({action: 'popupShow', id: id}, function() {
      SaveFrom_Utils.showNotification('Please update me!', id, function(id) {
        mono.sendMessage({action: 'popupClose', id: id});
      });
    });
  },

  bridge: {
    state: false,
    waitList: {},
    init: function() {
      var bridge = SaveFrom_Utils.bridge;
      if (bridge.state) {
        return;
      }
      bridge.state = true;
      var script = document.createElement('script');
      var injectScript = function() {
        window.addEventListener('sf-bridge', function(e) {
          /* fix */
          var data = e.detail;
          var value = undefined;

          var pos = data.indexOf(':');
          var action = data.substr(0, pos);
          var msg = data.substr(pos+1);
          var args = JSON.parse(msg);

          if (action === 'getYtPlayerConfig') {
            data = undefined;
            if (window.ytplayer && window.ytplayer.config) {
              data = {
                args: window.ytplayer.config.args,
                sts: window.ytplayer.config.sts,
                assets: window.ytplayer.config.assets
              };
            }
            value = msg + ':' + JSON.stringify(data);
          }

          if (action === 'get-data') {
            var className = args[0];
            var el = document.getElementsByClassName(className)[0];
            el.classList.remove(className);
            var $data = jQuery(el).data();
            if ($data && $data.item) {
              value = $data.item.url;
            }
            value = msg + ':' + JSON.stringify(value);
          }

          if (action === 'getFromStorage') {
            var itemList = args;
            var stData = {};
            for (var i = 0, item; item = itemList[i]; i++) {
              stData[item] = localStorage[item];
            }
            if (typeof cur !== 'undefined') {
              stData.defaultTrack = cur.defaultTrack;
            }
            if (typeof audioPlayer !== "undefined") {
              stData.lastSong = audioPlayer.lastSong;
            }
            value = msg + ':' + JSON.stringify(stData);
          }

          if (action === 'getHtml5video') {
            data = undefined;
            if (window.html5video && window.html5video.vars) {
              data = window.html5video.vars;
            }
            value = msg + ':' + JSON.stringify(data);
          }

          var event = new CustomEvent('sf-cb-bridge', {detail: action+':'+value});
          window.dispatchEvent(event);
        });
      };
      injectScript = injectScript.toString();
      if (mono.isSafari) {
        var safariFix = function() {
          if (typeof CustomEvent === 'undefined') {
            CustomEvent = function (event, params) {
              params = params || { bubbles: false, cancelable: false };
              var evt = document.createEvent('CustomEvent');
              evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
              return evt;
            };
            CustomEvent.prototype = window.Event.prototype;
          }
        };
        injectScript = injectScript.replace('/* fix */', '('+safariFix.toString()+')();');
      } else
      if (mono.isOpera) {
        injectScript = injectScript.replace('/* fix */', 'var CustomEvent = window.CustomEvent;');
      }
      script.textContent = '('+injectScript+')()';
      document.body.appendChild(script);

      window.addEventListener('sf-cb-bridge', function(e) {
        var data = e.detail;
        var pos = data.indexOf(':');
        var action = data.substr(0, pos);
        var msg = data.substr(pos+1);
        var key = undefined;
        var value = undefined;
        if (['getYtPlayerConfig', 'get-data', 'getFromStorage', 'getHtml5video'].indexOf(action) !== -1) {
          pos = msg.indexOf(':');
          key = action+':'+msg.substr(0, pos);
          try {
            value = JSON.parse(msg.substr(pos + 1));
          } catch (e) {}
        }
        if (bridge.waitList[key]) {
          bridge.waitList[key](value);
          delete bridge.waitList[key];
        }
      });
    },
    send: function(action, detail, cb) {
      var bridge = SaveFrom_Utils.bridge;
      detail = JSON.stringify(detail);
      bridge.waitList[action+':'+detail] = cb;
      mono.trigger(window, 'sf-bridge', {
        detail: action+':'+detail
      });
      if (this.timeout) {
        setTimeout(function() {
          if (!bridge.waitList[action+':'+detail]) return;
          bridge.waitList[action+':'+detail](null);
          delete bridge.waitList[action+':'+detail];
        }, this.timeout);
      }
    }
  }
};SaveFrom_Utils.tutorialTooltip = {
  tooltipEl: null,
  styleEl: null,
  layerEl: null,
  tooltip: function() {
    return mono.create('div', {
      id: 'sf-tooltip',
      append: [
        mono.create('span', {
          style: {
            display: 'inline-block',
            border: '8px solid transparent',
            borderRight: '10px solid #4D4D4D',
            borderLeft: 0,
            width: 0,
            top: '8px',
            left: '0px',
            position: 'absolute'
          }
        }),
        mono.create('span', {
          append: [
            mono.create('p', {
              style: {
                margin: 0
              },
              append: mono.parseTemplate(mono.global.language.tutorialTooltip)
            }),
            mono.create('a', {
              class: 'sf-button',
              text: mono.global.language.tutorialTooltipOk,
              style: {
                display: 'inline-block',
                textAlign: 'center',
                textDecoration: 'none',
                padding: '0 10px',
                cssFloat: 'right',

                marginTop: '5px',
                lineHeight: '20px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#fff',
                fontWeight: 'bolder',
                backgroundColor: '#167AC6'
              },
              on: ['click', (function(e) {
                e.preventDefault();
                this.hide();
              }).bind(this)]
            }),
            mono.create('style', {
              text: '#sf-tooltip .sf-button:hover {' +
              'background-color: #126db3 !important;' +
              '}' +
              '#sf-tooltip .sf-button:active{' +
              'opacity: 0.9;' +
              '}'
            })
          ],
          style: {
            display: 'inline-block',
            backgroundColor: '#4D4D4D',
            marginLeft: '10px',
            padding: '10px 10px',
            maxWidth: '220px',
            lineHeight: '16px',
            fontSize: '14px',
            fontFamily: 'font-family: arial, sans-serif',
            color: '#fff'
          }
        })
      ],
      on: ['mouseup', function(e) {
        e.stopPropagation();
      }]
    });
  },
  setToolTipPosFunc: null,
  hide: function() {
    if (!this.styleEl) return;

    window.removeEventListener('resize', this.setToolTipPosFunc);
    this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    this.styleEl.parentNode.removeChild(this.styleEl);
    this.styleEl = null;
    this.tooltipEl = null;

    this.hide.onHide && this.hide.onHide();
  },
  run: function(btn, options) {
    if (this.tooltipEl) return;

    var _this = this;
    options = options || {};
    this.hide.onHide = options.onHide;


    var btnTopOffset = -3;
    var btnLeftOffset = 0;

    btn.scrollIntoView();
    window.scrollTo(window.scrollX, parseInt(window.scrollY - (window.outerHeight / 2)));

    if (!this.styleEl) {
      var zIndex = 1000;
      var top = document.getElementById('masthead-positioner');
      if (top) {
        var cStyle = window.getComputedStyle(top, null);
        if (cStyle) {
          zIndex = parseInt(cStyle.getPropertyValue('z-index')) + 1;
        }
      }
      cStyle = null;
      top = null;

      var btnZIndex = zIndex+2;

      mono.create(document.body, {
        append: this.styleEl = mono.create('style', {
          text: '#sf-tooltip {' +
          'position: absolute;' +
          'z-index: '+btnZIndex+';' +
          '}'
        })
      });
    }

    (options.tooltipContainer || document.body).appendChild(this.tooltipEl = this.tooltip());

    btn.addEventListener('mouseup', function hideTooltip() {
      this.removeEventListener('mouseup', hideTooltip);
      _this.hide();
    });

    document.body.addEventListener('mouseup', function hideTooltip() {
      this.removeEventListener('mouseup', hideTooltip);
      _this.hide();
    });

    this.setToolTipPosFunc = mono.throttle((function(btn) {
      if (btn.offsetParent === null) {
        return this.hide();
      }
      var btnPos = SaveFrom_Utils.getPosition(btn, options.tooltipContainer);
      var top = btnPos.top + btnTopOffset;
      var left = btnPos.left + btnPos.width + btnLeftOffset;
      this.tooltipEl.style.top = top + 'px';
      this.tooltipEl.style.left = left + 'px';
    }).bind(this, btn), 500);
    window.addEventListener('resize', this.setToolTipPosFunc);
    this.setToolTipPosFunc();

    btn = null;
  }
};
