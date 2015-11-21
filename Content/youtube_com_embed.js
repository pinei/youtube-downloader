// ==UserScript==
// @exclude *
// ==/UserScript==

var youtube_com_embed = {
  lastSts: [16510, [["swap",19],["swap",35],["reverse",null],["splice",2],["reverse",null],["splice",1],["swap",64],["splice",2],["swap",53]]],
  prepare: function() {
    youtube_com_embed.prepare.ready = true;
    if (engine.ytDechipList) {
      for (var sts in engine.ytDechipList) {
        youtube_com_embed.lastSts = [sts, engine.ytDechipList[sts]];
      }
    }
    engine.ytDechipList = undefined;
  },
  getYoutubeLinks: function (request, callback)
  {
    function callback_links(links, title, subtitles, duration)
    {
      youtube_com_embed.addUmmyLinks(links, request.extVideoId);

      var response = {
        action: request.action,
        extVideoId: request.extVideoId,
        links: links,
        title: title,
        subtitles: subtitles,
        duration: duration,
        checkLinks: null
      };

      if(request.checkLinks && links)
      {
        youtube_com_embed.checkYoutubeLinks(links, function(checkUrl, isValid, status){
          response.checkLinks = isValid;
          callback(response);
        });
        return;
      }

      callback(response);
    }

    youtube_com_embed._getYoutubeLinks(request.url, request.extVideoId, request.checkSubtitles, callback_links, request.noDash);
  },

  _getYoutubeLinks: function (eurl, videoId, checkSubtitles, callback_, noDash) {
    if (youtube_com_embed.prepare.ready === undefined) {
      youtube_com_embed.prepare();
    }
    var links = null, title = '', duration = '';
    if (!eurl) {
      eurl = 'http://www.youtube.com/watch?v='+videoId;
    }
    eurl = encodeURIComponent(eurl);
    var url = 'http://www.youtube.com/get_video_info?video_id=' + videoId +
      '&asv=3&eurl=' + eurl + '&el=info&sts=' + youtube_com_embed.lastSts[0];

    var embed = true;
    var callback = function(links, title, subtitles, duration) {
      if(links || !embed)
      {
        callback_(links, title, subtitles, duration);
      }
      else
      {
        embed = false;
        url = 'http://www.youtube.com/watch?v=' + videoId;
        mono.ajax({
          url: url,
          success: getYoutubeLinks_,
          error: getYoutubeLinks_
        });
      }
    };

    mono.ajax({
      url: url,
      success: getYoutubeLinks_,
      error: getYoutubeLinks_
    });

    function getYoutubeLinks_(r, xhr) {
      if (xhr !== undefined) {
        r = xhr;
      }
      var cb = function() {
        if(checkSubtitles)
        {
          youtube_com_embed.getYoutubeSubtitles({extVideoId: videoId}, function(subtitles){
            callback(links, title, subtitles, duration);
          });
        }
        else
          callback(links, title, null, duration);
      };

      if (r.status !== 200 || !r.responseText) {
        return cb();
      }

      var dashUrl;
      try {

        var baseUrl = '',
          adaptiveFmts = youtube_com_embed._getYtParam(r.responseText, embed, 'adaptive_fmts'),
          title = youtube_com_embed._getYtParam(r.responseText, embed, 'title'),
          length_seconds = youtube_com_embed._getYtParam(r.responseText, embed, 'length_seconds', true),
          fmtMap = youtube_com_embed._getYtParam(r.responseText, embed, '(?:fmt_url_map|url_encoded_fmt_stream_map)');

        dashUrl = youtube_com_embed._getYtParam(r.responseText, embed, 'dashmpd');

        if(!embed)
          fmtMap = fmtMap.split('\\u0026').join('&');

        if(fmtMap.search(/url%3dhttp/i) > -1)
          fmtMap = decodeURIComponent(fmtMap);

        var titleParam = '';
        if(title)
        {
          title = title.replace(/\+/g, '%20');

          title = mono.decodeUnicodeEscapeSequence(title);

          titleParam = '&title=' + encodeURIComponent( mono.fileName.modify(title) );
        }

        if(length_seconds)
          duration = length_seconds;

        var lks = youtube_com_embed.parseYoutubeFmtMap(fmtMap, titleParam, baseUrl);
        if(adaptiveFmts)
        {
          var adaptive_links = youtube_com_embed.parseYoutubeFmtMap(adaptiveFmts, titleParam, baseUrl);

          for (var i in adaptive_links) {
            if(!lks[i])
              lks[i] = adaptive_links[i];
          }
        }

        if(lks)
          links = lks;
      }
      finally {
        if (noDash) {
          cb();
        } else {
          youtube_com_embed.getYouTubeDashLinks(links, dashUrl, function(_links) {
            if (_links) {
              links = _links;
            }
            cb();
          });
        }
      }
    }
  },
  addUmmyLinks: function(links, videoId) {},

  _getYtParam: function(str, embed, param, number) {
    var re = new RegExp('(?:^|&)' + param + '=([^\\s\\&\\"]+)', 'i');
    if(!embed)
    {
      re = new RegExp('\\"' + param + '\\"\\s*:\\s*\\"([^\\"]+)\\"', 'i');
      if(number)
        re = new RegExp('\\"' + param + '\\"\\s*:\\s*\\"?(\\d+)', 'i');
    }

    var m = str.match(re);
    if(m && m.length > 1)
    {
      if(embed)
        return decodeURIComponent(m[1]);

      if (m[1] && m[1].substr(m[1].length - 1) === '\\') {
        m[1] += '\\';
      }

      var json = '{"v": "' + m[1] + '"}';
      var obj;

      try {
        obj = JSON.parse(json);
      } catch (e) {}

      if(obj && obj.v)
        return obj.v;
    }

    return '';
  },

  checkYoutubeLinks: function (links, callback)
  {
    var checkItags = ['18', '34', '35'], checkUrl = '';
    for(var i = 0; i < checkItags.length; i++)
    {
      if(links[checkItags[i]])
      {
        checkUrl = links[checkItags[i]];
        break;
      }
    }

    if(checkUrl)
    {
      mono.ajax({
        type: 'HEAD',
        url: checkUrl,
        success: function(data, xhr) {
          callback(checkUrl, true, xhr.status);
        },
        error: function(xhr) {
          callback(checkUrl, false, xhr.status);
        }
      });
      return;
    }

    callback();
  },

  getYoutubeSubtitles: function(message, cb) {
    var videoId = message.extVideoId;
    var baseUrl = 'http://video.google.com/timedtext';
    mono.ajax({
      url: baseUrl + '?hl='+engine.language.lang+'&v=' + videoId + '&type=list&tlangs=1',
      mimeType: 'text/xml',
      success: function(data, xhr) {
        if (!xhr.responseXML) {
          return cb();
        }
        var track = xhr.responseXML.querySelectorAll('track');
        var target = xhr.responseXML.querySelectorAll('target');
        var list = [];
        var trackList = {};
        var targetList = {};
        var origTrack = undefined;
        var langCode, param;
        for (var i = 0, item; item = track[i]; i++) {
          langCode = item.getAttribute('lang_code');
          param = {
            lang: langCode,
            v: videoId,
            fmt: 'srt',
            name: item.getAttribute('name') || undefined
          };
          trackList[langCode] = {
            lang: item.getAttribute('lang_translated'),
            langCode: langCode,
            url: baseUrl + '?' + mono.param(param),
            name: param.name
          };
          list.push(trackList[langCode]);
          if (!origTrack && item.getAttribute('cantran')) {
            origTrack = param;
          }
        }

        if (origTrack) {
          for (i = 0, item; item = target[i]; i++) {
            langCode = item.getAttribute('lang_code');
            param = {
              lang: origTrack.lang,
              v: videoId,
              tlang: langCode,
              fmt: 'srt',
              name: origTrack.name
            };
            targetList[langCode] = {
              lang: item.getAttribute('lang_translated'),
              langCode: langCode,
              url: baseUrl + '?' + mono.param(param),
              isAuto: true
            };
          }
        }

        engine.actionList.getNavigatorLanguage(undefined, function(langCode) {
          langCode = langCode.toLocaleLowerCase();
          if (langCode.indexOf('zh-hant') === 0) {
            langCode = 'zh-Hant';
          } else
          if (langCode.indexOf('zh-hans') === 0) {
            langCode = 'zh-Hans';
          }
          var localeList = [langCode];
          if (localeList[0] === 'uk') {
            localeList.push('ru');
          }
          for (i = 0, item; item = localeList[i]; i++) {
            if (!trackList[item] && targetList[item]) {
              list.push(targetList[item]);
            }
          }

          return cb(list);
        });
      },
      error: function() {
        cb();
      }
    });
  },

  parseYoutubeFmtMap: function (fmtMap, titleParam, baseUrl, dechiper)
  {
    if(!fmtMap)
      return;

    var l = {};

    fmtMap = fmtMap.split(',');
    for(var i = 0; i < fmtMap.length; ++i)
    {
      var query = mono.parseUrlParams(fmtMap[i], {
        argsOnly: 1,
        forceSep: '&'
      });
      if (query.stream !== undefined) {
        if (!l.meta) {
          l.meta = {};
        }
        l.meta.hasStream = 1;
      }
      if(query.url)
      {
        query.url = decodeURIComponent(query.url);
        if(query.url.search(/(\?|&)sig(nature)?=/i) == -1)
        {
          if(query.sig)
            query.url += '&signature=' + query.sig;
          else if(query.signature)
            query.url += '&signature=' + query.signature;
          else if(query.s) {
            query.url += '&signature=' + (dechiper ? dechiper(query.s) : youtube_com_embed.youtubeSignatureDecipher(query.s));
          }
        }

        if(query.url.search(/(\?|&)itag=/i) == -1)
        {
          if(query.itag)
            query.url += '&itag=' + query.itag;
        }

        var fmt = query.url.match(/(?:\?|&)itag=(\d+)/i);
        if(fmt && fmt.length > 1)
        {
          fmt = fmt[1];

          query.url = query.url.replace(/(\?|&)sig=/i, '$1signature=').
            replace(/\\u0026/ig, '&').replace(/\\\//g, '/');

          l[fmt] = query.url;

          if(titleParam)
            l[fmt] += titleParam;

          if(!baseUrl)
          {
            var m = query.url.match(/^(https?:\/\/[^\?]+\?)/);
            if(m && m.length > 1)
              baseUrl = m[1];
          }
        }
      }
    }

    return l;
  },

  getYouTubeDashLinks: function(links, dashmpd, cb, dechiper) {
    if (!dashmpd) {
      return cb();
    }
    if (dashmpd.indexOf('yt_live_broadcast') !== -1) {
      return cb();
    }
    var signature_pos = dashmpd.indexOf('/signature/');
    if (signature_pos === -1) {
      signature_pos = dashmpd.indexOf('/sig/');
    }
    if (signature_pos === -1) {
      var s_pos = dashmpd.indexOf('/s/');
      if (s_pos === -1) {
        return cb();
      }
      s_pos += 3;
      var s_end = dashmpd.indexOf('/', s_pos);
      if (s_end === -1) {
        s_end = dashmpd.length;
      }
      var s = dashmpd.substr( s_pos, s_end - s_pos );
      var signature = dechiper ? dechiper(s) : youtube_com_embed.youtubeSignatureDecipher(s);
      if (signature === s) {
        return cb();
      }
      dashmpd = dashmpd.substr(0, s_pos - 2) + 'signature/' + signature + dashmpd.substr(s_end);
    }
    mono.ajax({
      url: dashmpd,
      mimeType: 'text/xml',
      success: function(data, xhr) {
        if (!xhr.responseXML) {
          return cb();
        }
        youtube_com_embed.parseDash( xhr.responseXML, links, cb);
      },
      error: function() {
        cb();
      }
    });
  },

  parseDash: function(xml, links, cb) {
    var elList = xml.querySelectorAll('Representation');
    if (!links) {
      links = {};
    }
    if (!links.meta) {
      links.meta = {};
    }
    for (var i = 0, el; el = elList[i]; i++) {
      var meta = {};
      var itag = el.getAttribute('id');
      meta.fps = el.getAttribute('frameRate');
      if (links[itag] !== undefined) {
        links.meta[itag] = meta;
        continue;
      }
      var baseurl = el.querySelector('BaseURL');
      if (baseurl === null) {
        continue;
      }
      var url = baseurl.textContent;
      links[itag] = url;
      links.meta[itag] = meta;
    }
    cb(links);
  },

  youtubeSignatureDecipher: function (sig) {
    return youtube_com_embed.ytRunActList(youtube_com_embed.lastSts[1], sig);
  },

  getYoutubeIdListFromPlaylist: function(request, cb) {
    youtube_com_embed.getIdListFromList(request.baseUrl || 'http://www.youtube.com', request.listId, cb);
  },

  getIdListFromList: (function() {
    var getNextPage = function(baseUrl, url, pageList, cb) {
      if (!pageList) {
        pageList = [];
      }
      mono.ajax({
        url: baseUrl + url,
        dataType: 'JSON',
        success: function(data) {
          if (!data) {
            return cb(pageList);
          }
          pageList.push(data.content_html);
          var nextPageUrl = getNextPageUrl(data.load_more_widget_html);
          if (nextPageUrl === undefined) {
            return cb(pageList);
          }
          getNextPage(baseUrl, nextPageUrl, pageList, cb);
        },
        error: function() {
          cb(pageList);
        }
      });
    };
    var getTitleFromPage = function(data) {
      var title = data.match(/<h1[^>]+>([^<]+)<\/h1>/);
      if (!title) {
        return undefined;
      }
      return title[1].replace(/\r?\n/g, " ").trim();
    };
    var getNextPageUrl = function(data) {
      if (!data) {
        return undefined;
      }
      var nextUrl = data.match(/data-uix-load-more-href="([^"]+)"/);
      if (nextUrl) {
        nextUrl = nextUrl[1];
      }
      return nextUrl || undefined;
    };
    var readLinksFromPages = function(listId, pageList, cb) {
      var title = getTitleFromPage(pageList[0]);
      var idObj = {};
      var idList = [];
      var pattern = /href="\/watch\?([^"]+)"/g;
      var maxIndex = 0;
      for (var i = 0, len = pageList.length; i < len; i++) {
        var content = pageList[i];
        content.replace(pattern, function(string, args) {
          var url = mono.parseUrlParams(args, {argsOnly: 1});
          if (url.list !== listId) {
            return;
          }
          url.index = parseInt(url.index);
          idObj[url.index] = url.v;
          if (url.index > maxIndex) {
            maxIndex = url.index;
          }
        });
      }
      for (i = 0; i <= maxIndex; i++) {
        if (idObj[i] === undefined) {
          continue;
        }
        if (idList.indexOf(idObj[i]) === -1) {
          idList.push(idObj[i]);
        }
      }
      cb({idList: idList, title: title});
    };
    return function getLinksFromList(baseUrl, listId, cb) {
      mono.ajax({
        url: baseUrl + '/playlist?list=' + listId,
        success: function(data) {
          var nextPageUrl = getNextPageUrl(data);
          if (!nextPageUrl) {
            return readLinksFromPages(listId, [data], cb);
          }
          getNextPage(baseUrl, nextPageUrl, [data], function(pageList) {
            readLinksFromPages(listId, pageList, cb);
          });
        },
        error: function() {
          cb();
        }
      });
    };
  })(),

  getYoutubeLinksFromConfig: function(message, _cb) {
    var getYtLinks = function() {
      youtube_com_embed.getYoutubeLinks(message, _cb);
    };
    var cb = function(obj) {
      if (obj && obj.links) {
        youtube_com_embed.addUmmyLinks(obj.links, message.extVideoId);
      }
      _cb(obj);
    };
    var config = message.config;
    if (!config) {
      return getYtLinks();
    }
    if (config.args.video_id !== message.extVideoId) {
      return getYtLinks();
    }
    var adaptiveFmts = config.args.adaptive_fmts;
    var title = config.args.title;
    var fmtMap = config.args.fmt_url_map || config.args.url_encoded_fmt_stream_map;
    var dashUrl = (message.noDash) ? undefined : config.args.dashmpd;
    var sts = config.sts;
    var playerUrl = config.assets ? config.assets.js : undefined;
    if (playerUrl && playerUrl.substr(0, 2) === '//') {
      playerUrl = 'http:' + playerUrl;
    }

    title = mono.decodeUnicodeEscapeSequence(title);

    var titleParam = '&title=' + encodeURIComponent( mono.fileName.modify(title) );

    var getLinks = function(fmtMap, titleParam, adaptiveFmts, dechiper) {
      var links = youtube_com_embed.parseYoutubeFmtMap(fmtMap, titleParam, '', dechiper) || {};
      if (adaptiveFmts) {
        var adaptive_links = youtube_com_embed.parseYoutubeFmtMap(adaptiveFmts, titleParam, '', dechiper);
        for (var i in adaptive_links) {
          if (links[i]) continue;
          links[i] = adaptive_links[i];
        }
      }
      return links;
    };

    var needDechier = false;
    var links = getLinks(fmtMap, titleParam, adaptiveFmts, function() {
      needDechier = true;
    });
    if (!needDechier) {
      youtube_com_embed.getYouTubeDashLinks(links, dashUrl, function(_links) {
        cb({links: _links || links, title: title, isQuick: 1, noChiped: 1});
      });
      return;
    }
    if (!playerUrl) {
      return getYtLinks();
    }
    var sigUrl = playerUrl.match(/\/html5player-([^\/]+)\//);
    if (sigUrl) {
      sigUrl = sigUrl[1];
    }
    youtube_com_embed.ytHtml5SignatureDecipher.dechip({sts: sts, url: playerUrl}, function(actList, trust) {
      if (!actList) {
        sigUrl && sts && engine.trackEvent('youtube', 'pError', sts+' '+sigUrl);
        return getYtLinks();
      }
      var sigList = [];
      var dechiper = (function(actList, s) {
        var sig = youtube_com_embed.ytRunActList(actList, s);
        sigList.indexOf(sig) === -1 && sigList.push(sig);
        return sig;
      }).bind(this, actList);
      links = getLinks(fmtMap, titleParam, adaptiveFmts, dechiper);
      youtube_com_embed.getYouTubeDashLinks(links, dashUrl, function(_links) {
        links = _links || links;
        if (trust) {
          return cb({links: links, title: title, isQuick: 1});
        }
        var checkUrl = undefined;
        for (var i in links) {
          if (checkUrl) break;
          for (var n = 0, item; item = sigList[n]; n++) {
            if (links[i].indexOf(item) !== -1) {
              checkUrl = links[i];
            }
          }
        }
        youtube_com_embed.ytHtml5SignatureDecipher.checkActList(sts, actList, checkUrl, function(isWork) {
          if (!isWork) {
            // sigUrl && sts && engine.trackEvent('youtube', 'cError', sts+' '+sigUrl+' '+message.extVideoId);
            return getYtLinks();
          }
          return cb({links: links, title: title, isQuick: 1});
        });
      }, dechiper);
    });
  },

  ytRunActList: function(list, a) {
    var actionList = {
      slice:function(a,b){a.slice(b)},
      splice:function(a,b){a.splice(0,b)},
      reverse:function(a){a.reverse()},
      swap:function(a,b){var c=a[0];a[0]=a[b%a.length];a[b]=c}
    };
    a = a.split("");
    for (var i = 0, item; item = list[i]; i++) {
      actionList[item[0]](a, item[1]);
    }
    return a.join("");
  },

  ytHtml5SignatureDecipher: {
    readObfFunc: function(func, data) {
      var vList = func.match(/\[(\w+)\]/g);
      if (!vList) {
        return;
      }
      for (var i = 0, v; v = vList[i]; i++) {
        var vv = data.match(new RegExp('[, ]{1}'+ v.slice(1, -1) +'="(\\w+)"'));
        if (vv) {
          func = func.replace(v, '.'+vv[1]);
        }
      }
      var arr = func.split(';');
      var actList = [];
      for (var i = 0, item; item = arr[i]; i++) {
        if (item.indexOf('.split(') !== -1 || item.indexOf('.join(') !== -1) {
          continue;
        }
        if (item.indexOf('reverse') !== -1) {
          actList.push(['reverse', null]);
          continue;
        }
        var m = item.match(/splice\((\d+)\)/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['splice', m]);
          continue;
        }
        var m = item.match(/slice\((\d+)\)/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['slice', m]);
          continue;
        }
        var m = item.match(/\[(\d+)%\w+\.length/);
        if (m) {
          m = parseInt(m[1]);
          if (isNaN(m)) return;
          actList.push(['swap', m]);
        }
      }
      return actList;
    },
    getChip: function(data, cb) {
      var actList = [];
      var funcName = data.match(/\.sig\|\|([$_a-zA-Z0-9]+)\(/);
      if (!funcName) {
        return cb();
      }
      funcName = funcName[1];
      funcName = funcName.replace(/\$/g, '\\$');
      var func = data.match(new RegExp("(function "+funcName+"\\(([\\w$]+)\\){[^}]*});"));
      if (!func) {
        return cb();
      }
      var vName = func[2];
      func = func[1];
      var regexp = new RegExp("[\\w$]+\\.[\\w$]+\\("+vName+"[^)]*\\)", 'g');
      var sFuncList = func.match(regexp);
      if (!sFuncList) {
        actList = this.readObfFunc(func, data);
        if (actList && actList.length > 0) {
          return cb(actList);
        }
        return;
      }
      var objName = '';
      var objElList = [];
      for (var i = 0, item; item = sFuncList[i]; i++) {
        var m = item.match(/([\w$]+)\.([\w$]+)\([\w$]+,?([\w$]+)?\)/);
        if (m) {
          objName = m[1];
          objElList.push({name: m[2], arg: parseInt(m[3])});
        }
      }
      var sPos = data.indexOf('var '+objName+'={');
      if (sPos === -1) {
        sPos = data.indexOf(','+objName+'={');
      }
      if (sPos === -1) {
        sPos = data.indexOf(objName+'={');
      }
      var place = data.substr(sPos, 300);
      for (i = 0, item; item = objElList[i]; i++) {
        var vName = item.name;
        regexp = new RegExp(vName+":(function\\([$\\w,]+\\){[^}]+})");
        var sF = place.match(regexp);
        if (!sF) {
          return cb();
        }
        sF = sF[1];
        if (sF.indexOf('splice') !== -1) {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['splice', item.arg]);
        } else
        if (sF.indexOf('slice') !== -1) {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['slice', item.arg]);
        } else
        if (sF.indexOf('reverse') !== -1) {
          item.arg = null;
          actList.push(['reverse', item.arg]);
        } else {
          if (isNaN(item.arg)) {
            return cb();
          }
          actList.push(['swap', item.arg]);
        }
      }
      cb(actList);
    },
    getPlayer: function(message, cb) {
      var _this = this;
      mono.ajax({
        url: message.url,
        success: function(data) {
          if (!data) {
            return cb();
          }
          return _this.getChip(data, cb);
        },
        error: function() {
          return cb();
        }
      })
    },
    checkActList: function(sts, actList, url, cb) {
      var _this = this;
      mono.ajax({
        type: 'HEAD',
        url: url,
        success: function() {
          _this.addDechipList(sts, actList);
          cb(1);
        },
        error: function() {
          cb(0);
        }
      });
    },
    getDechipList: function(cb) {
      var _this = this;
      if (_this.getDechipList.data !== undefined) {
        return cb(_this.getDechipList.data);
      }
      mono.storage.get('ytDechipList', function(data) {
        if (!data.ytDechipList) {
          data.ytDechipList = {};
        }
        _this.getDechipList.data = data;
        cb(data);
      });
    },
    addDechipList: function(sts, actList) {
      if (!sts) return;
      this.getDechipList.data.ytDechipList[sts] = actList;
      mono.storage.set(this.getDechipList.data);

      youtube_com_embed.prepare.ready = true;
      youtube_com_embed.lastSts = [sts, actList];
    },
    dechip: function(message, cb) {
      var _this = this;
      _this.getDechipList(function(data) {
        if (!message.sts) {
          return cb();
        }
        var actList = data.ytDechipList[message.sts];
        if (actList) {
          return cb(actList, 1);
        }
        _this.getPlayer(message, function(actList) {
          if (actList && actList.length > 0) {
            return cb(actList);
          }
          cb();
        });
      });
    }
  }
};

if (typeof window === 'undefined') {
  exports.init = function(_mono, _engine, _navigator) {
    mono = _mono;
    engine = _engine;
    navigator = _navigator;
    return youtube_com_embed;
  };
} else {
  engine.modules.youtube = youtube_com_embed;
}