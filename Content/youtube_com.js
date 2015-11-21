// ==UserScript==
// @name        YouTube downloader
//
// @include     http://youtube.com/*
// @include     http://*.youtube.com/*
// @include     https://youtube.com/*
// @include     https://*.youtube.com/*
// ==/UserScript==

mono.onReady('youtube', function(moduleName) {
  if (mono.isSafari) {
    if (!mono.checkUrl(document.URL, [
      'http://youtube.com/*',
      'http://*.youtube.com/*',
      'https://youtube.com/*',
      'https://*.youtube.com/*'
    ])) {
      return;
    }
  }

  var language = {};
  var preference = {};
  var allowDownloadMode = 0;
  var moduleState = 0;

  var init = function () {
    mono.pageId = moduleName;
    mono.onMessage(function(message, cb){
      if (message.action === 'getModuleInfo') {
        if (message.url !== location.href) return;
        return cb({state: moduleState, moduleName: moduleName});
      }
      if (message.action === 'changeState') {
        return youtube.changeState(message.state);
      }
      if (!moduleState) {
        return;
      }
      if (message.action === 'updateLinks') {
        var vId = youtube.getIdFromLocation();
        if (vId) {
          getPlayerConfig(function(config) {
            if (config && config.args && config.args.video_id === vId) {
              var oldBtn = document.getElementById(youtube.buttonId);
              if (oldBtn !== null) {
                oldBtn.parentNode.removeChild(oldBtn);
              }
              youtube.links = {};
              youtube.subtitles = {};
              youtube.video_id = config.args.video_id;
              var container = document.getElementById('watch7-subscription-container');
              youtube.appendDownloadButton(container);
            }
          });
        }
      }
      if (message.action === 'downloadPlaylist') {
        youtube.downloadPlaylist();
      }
      if (message.action === 'howUse') {
        youtube.howUse();
      }
    });

    allowDownloadMode = mono.isChrome || mono.isFF || (mono.isGM && mono.isTM);

    mono.initGlobal(function(response) {
      language = mono.global.language;
      preference = mono.global.preference;
      if (!preference.enable || !preference.moduleYoutube) {
        return;
      }
      youtube.run();
    });
  };

  var iframe = mono.isIframe();

  var youtube = {
    swfargs: null,
    token: '',
    video_id: '',
    sts: '',
    needDecipher: false,
    newInterface: false,

    panelId: 'savefrom__yt_links',
    buttonId: 'savefrom__yt_btn',
    panelParent: null,
    panelInsertBefore: null,
    timer: null,

    btnBox: null,
    links: {},
    subtitles: {},
    isMobile: false,

    run: function() {
      moduleState = 1;
      if (iframe) {
        var m = location.href.match(/\/embed\/([\w\-]+)/i);

        if(!m || m.length < 2) {
          iframe = false;
          if (!youtube.getIdFromLocation(location.href)) {
            return;
          }
        }
      }

      if (location.host.indexOf('m.') === 0) {
        youtube.isMobile = true;
        mono.onUrlChange(function(url) {
          SaveFrom_Utils.mobileLightBox.clear();
          var vid = youtube.getIdFromLocation(url);
          if (!vid) {
            youtube.waitBtnContainer.stop();
            return;
          }
          youtube.waitBtnContainer.start(function() {
            return youtube.getMobileContainer();
          }, function(container) {
            youtube.appendMobileButton(vid, container);
          });
        }, 1);
        return;
      }

      if(iframe) {
        youtube.isVideoPage();
        youtube.video_id = youtube.swfargs.video_id;
        youtube.appendIframeButtons();
        return;
      }

      var lastWaitChange = undefined;
      mono.onUrlChange(function(url) {
        if (lastWaitChange) {
          lastWaitChange.abort();
        }
        if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
          youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
        }
        youtube.videoFeed.onUrlUpdate(url);

        var vId = youtube.getIdFromLocation(url);
        if (vId) {
          lastWaitChange = youtube.waitChange(function onCheck(cb) {
            getPlayerConfig(function(config) {
              if (config && config.args && config.args.video_id === vId) {
                return cb(config);
              }
              cb();
            });
          }, function onDune(config) {
            if (!config) return;

            youtube.video_id = config.args.video_id;

            lastWaitChange = youtube.waitChange(function onCheck(cb) {
              cb(document.getElementById('watch7-subscription-container'));
            },function onDune(container) {
              if (!container) {
                return;
              }

              var btnVid = youtube.video_id;
              youtube.appendDownloadButton(container);

              lastWaitChange = youtube.waitChange(function onCheck(cb) {
                if (btnVid !== youtube.video_id) {
                  return cb();
                }
                if (document.contains(container)) {
                  return cb();
                }
                cb(document.getElementById('watch7-subscription-container'));
              }, function onDune(container) {
                if (!container) {
                  return;
                }
                youtube.appendDownloadButton(container);
              }, {
                count: 1,
                timer: 8*1000,
                repeat: 1
              });
            });

          });
        }
      }, 1);
    },

    changeState: function(state) {
      moduleState = state;
      if (iframe || youtube.isMobile) {
        return;
      }
      mono.clearUrlChange();
      if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
        youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
      }
      if (youtube.videoFeed.currentMenu !== undefined) {
        youtube.videoFeed.currentMenu.hide();
        youtube.videoFeed.currentMenu = undefined;
      }
      youtube.videoFeed.disable();
      youtube.videoFeed.rmBtn();
      var btn = document.getElementById(youtube.buttonId);
      if (btn) {
        btn.parentNode.removeChild(btn);
      }
      if (state) {
        youtube.run();
      }
    },

    howUse: function() {
      var dlBtn = document.getElementById(youtube.buttonId);
      if (dlBtn) {
        SaveFrom_Utils.tutorialTooltip.run(dlBtn);
        mono.sendMessage({action: 'trackEvent', category: 'howUse', event: 'show', label: 'ytBtnUnderVideo'});
        return;
      }

      mono.sendMessage({action: 'trackEvent', category: 'howUse', event: 'error', label: '%domain%'});
    },

    waitChange: function(onCheck, cb, options) {
      options = options || {
        repeat: 0
      };
      var abort = false;
      var n = options.count || 12;
      var onCb = function(data) {
        cb(data);
        if (options.repeat > 0) {
          options.repeat--;
          n = options.count || 12;
          wait();
        }
      };
      var wait = function() {
        if (abort) return;

        n--;
        setTimeout(function() {
          if (abort) return;
          if (n < 0) {
            return onCb();
          }

          onCheck(function(data) {
            if (abort) return;

            if (data) {
              return onCb(data);
            }
            wait();
          });
        }, options.timer || 500);
      };
      if (options.now) {
        onCheck(function(data) {
          if (abort) return;

          if (data) {
            return onCb(data);
          }
          wait();
        });
      } else {
        wait();
      }
      return {
        abort: function() {
          abort = true;
        }
      }
    },

    waitBtnContainer: {
      count: undefined,
      timer: undefined,
      check: function(getContainer, onReady) {
        var container = getContainer();
        if (container !== null && container.dataset.sfSkip === undefined) {
          if (container.dataset.sfFound !== undefined) {
            container.dataset.sfSkip = 1;
          } else {
            if (container.dataset.sfCondidate === undefined) {
              container.dataset.sfCondidate = 1;
            } else {
              container.dataset.sfFound = 1;
              onReady(container);
              return 1;
            }
          }
        }

        return undefined;
      },
      start: function(getContainer, onReady) {
        var _this = youtube.waitBtnContainer;

        _this.stop();

        if (_this.check(getContainer, onReady) !== undefined) {
          return;
        }

        _this.timer = setInterval(function() {
          _this.count--;
          if (_this.check(getContainer, onReady) !== undefined || _this.count <= 0) {
            clearInterval(_this.timer);
          }
        }, 250);
      },
      stop: function() {
        var _this = youtube.waitBtnContainer;

        clearInterval(_this.timer);
        _this.count = 20;
      }
    },


    getIdFromLocation: function(loc)
    {
      if(!loc)
        loc = document.location.href;

      var m = loc.match(/\/watch\?(?:.+&)?v=([\w\-]+)/i);
      if(m && m.length > 1)
        return m[1];

      return null;
    },


    isVideoPage: function()
    {
      var swfargs = youtube.getSwfArgs();
      if(!swfargs)
        return false;

      youtube.swfargs = swfargs;

      var token = swfargs.t ? swfargs.t : swfargs.token;
      if(!token)
        return false;

      youtube.token = token;

      var video_id = swfargs.video_id;
      if(!video_id)
        video_id = youtube.getIdFromLocation();

      if(!video_id)
        return false;

      youtube.video_id = video_id;

      youtube.sts = SaveFrom_Utils.getMatchFirst(document.body.innerHTML,
      /[\"']sts[\"']\s*:\s*[\"']?(\d+)/i);

      return true;
    },

    getSwfArgs: function()
    {
      var html = document.body.innerHTML;

      var t = html.match(/[\"\'](?:swf_)?args[\"\']\s*:\s*(\{[^\}]+\})/i);
      if(t && t.length > 1)
      {
        if(t[1].search(/:\s*\"[^\"]+\s*\}$/) > -1)
          t[1] = t[1].replace(/\s*\}$/i, '"}');

        try
        {
          return JSON.parse(t[1]);
        }
        catch(err){
          t = html.match(/ytplayer.config\s*=\s*(\{.*?\});?<\/script>/i);
          if(t && t.length > 1) {
            try
            {
              return JSON.parse(t[1]);
            }
            catch(err){}
          }
        }
      }
      else
      {
        t = html.match(/flashvars\s*=\s*\\?[\"']?([^\"']+)/i);
        if(t && t.length > 1)
        {
          t = t[1];
          if(t.indexOf(/&/) == -1)
            t = t.replace(/(?:\\u0026|%26|%2526|&)amp;/ig, '&');

          t = mono.parseUrlParams(t, {
            argsOnly: 1,
            forceSep: '&'
          });
          for(var i in t)
            t[i] = decodeURIComponent(t[i]);

          return t;
        }
      }

      var e = document.getElementsByTagName('embed');
      for(var i = 0; i < e.length; i++)
      {
        var f = e[i].getAttribute('flashvars');
        if(f && f.search(/fmt_map=/i) != -1)
        {
          return mono.parseUrlParams(f, {argsOnly: 1});
        }
      }

      return null;
    },

    getMobileContainer: function() {
      var elList = document.querySelectorAll('a[onclick][href="#"] span[id]');
      var elCount = 0;
      var fEl = undefined;
      for (var i = 0, el; el=elList[i];i++) {
        if (!el.id || el.id.substr(0, 10) !== 'koya_elem_') {
          continue;
        }
        elCount++;
        fEl = el;
      }
      if (elCount < 3) {
        return null;
      }
      var parent = fEl.parentNode.parentNode.parentNode;
      if (parent === null) {
        return null;
      }
      return parent.parentNode;
    },

    appendMobileButton: function(vid, container) {
      container.appendChild(mono.create('div', {
        data: {
          id: vid
        },
        style: {
          display: 'inline-block',
          height: '28px',
          width: '18px',
          marginRight: '20px',
          background: 'url('+SaveFrom_Utils.svg.getSrc('download', '#ADADAD')+') center no-repeat',
          cssFloat: 'right'
        },
        on: ['click', function() {
          var title = youtube.getTitle();
          if(title) {
            title = modifyTitle(title);
          }

          var vid = this.dataset.id;

          if (youtube.links[vid]) {
            var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(youtube.links[vid], title);
            return SaveFrom_Utils.mobileLightBox.show(menuLinks);
          }

          var request = {
            action: 'getYoutubeLinks',
            extVideoId: vid,
            url: location.href
          };

          var LightBox = SaveFrom_Utils.mobileLightBox.show(language.download + ' ...');

          mono.sendMessage(request, function(response){
            var menuLinks = undefined;
            if (response.links) {
              youtube.links[vid] = response.links;
              menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, title);
            }
            if (!menuLinks) {
              menuLinks = language.noLinksFound;
            }
            LightBox.update(menuLinks);
          });

          LightBox.update(language.download + ' ...');
        }]
      }))
    },

    appendDownloadButton: function(parent)
    {
      if(document.getElementById(youtube.buttonId)) {
        return;
      }

      // var b = document.createElement('button');
      // b.id = youtube.buttonId;
      var selectBtn = undefined;
      var buttonContainer = mono.create('div', {
        id: youtube.buttonId,
        style: {
          display: 'inline-block',
          marginLeft: '10px',
          verticalAlign: 'middle'
        },
        append: [
          mono.create('a', {
            class: 'sf-quick-dl-btn',
            style: {
              display: 'inline-block',
              fontSize: 'inherit',
              height: '22px',
              border: '1px solid #00B75A',
              borderRadius: '3px',
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              paddingRight: '12px',
              paddingLeft: '28px',
              cursor: 'pointer',
              verticalAlign: 'middle',
              position: 'relative',
              href: '#',
              lineHeight: '22px',
              textDecoration: 'none',
              zIndex: 1,
              color: '#fff'
            },
            append: [
              mono.create('i', {
                style: {
                  position: 'absolute',
                  display: 'inline-block',
                  left: '6px',
                  top: '3px',
                  backgroundImage: 'url('+SaveFrom_Utils.svg.getSrc('download', '#ffffff')+')',
                  backgroundSize: '12px',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  width: '16px',
                  height: '16px'
                }
              }),
              language.download
            ]
          }),
          mono.create('style', {text: '' +
            '#' + youtube.buttonId + ' .sf-quick-dl-btn {' +
            'background-color: #00B75A;' +
            '}' +
            '#' + youtube.buttonId + ' .sf-quick-dl-btn:hover {' +
            'background-color: rgb(0, 163, 80);' +
            '}' +
            '#' + youtube.buttonId + ' .sf-quick-dl-btn:active {' +
            'background-color: rgb(0, 151, 74);' +
            '}' +
          ''}),
          selectBtn = mono.create('button', {
            style: {
              position: 'relative',
              display: 'inline-block',
              marginLeft: '-2px',
              fontSize: 'inherit',
              height: '24px',
              paddingRight: '21px',
              backgroundColor: '#F8F8F8',
              border: '1px solid #CCCCCC',
              borderRadius: '3px',
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              cursor: 'pointer',
              color: '#9B9B9B',
              zIndex: 0,
              verticalAlign: 'middle'
            },
            on: ['mousedown', youtube.getLinks],
            append: [
              mono.create('i', {
                style: {
                  position: 'absolute',
                  display: 'inline-block',
                  top: '9px',
                  right: '6px',
                  border: '5px solid #868282',
                  borderBottomColor: 'transparent',
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent'
                }
              })
            ]
          })
        ]
      });
      youtube.setButtonValue(selectBtn);

      parent.appendChild(buttonContainer);
    },


    updateWmode: function(p)
    {
      var e = p.querySelector('embed');
      if(!e) // html5
        return;

      // check wmode
      var m = e.getAttribute('wmode');
      if(m != 'opaque' && m != 'transparent')
      {
        // update wmode
        e.setAttribute('wmode', 'opaque');
        p.removeChild(e);
        p.appendChild(e);
      }
    },

    appendIframeButtons: function()
    {
      var p = document.getElementById('player'),
        b = document.createElement('div'),
        a = document.createElement('a'),
        panel = document.createElement('div');

      setTimeout(function() {
        youtube.updateWmode(p);
      }, 50);

      a.href = '#';
      a.textContent = language.download.toLowerCase();
      SaveFrom_Utils.setStyle(a, {
        display: 'inline-block',
        color: 'rgba(255,255,255,.9)',
        textDecoration: 'none',
        padding: '5px 10px'
      });
      b.appendChild(a);

      SaveFrom_Utils.setStyle(b, {
        background: 'rgba(0, 0, 0, .4)',
        border: '1px solid rgba(255,255,255,.5)',
        borderRadius: '4px',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        lineHeight: 'normal',
        position: 'absolute',
        top: '30px',
        right: '5px',
        padding: 0,
        margin: 0,
        zIndex: 99999
      });

      panel.id = youtube.panelId;
      SaveFrom_Utils.setStyle(panel, {
        color: '#fff',
        background: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
        border: 0,
        display: 'none',
        fontFamily: 'Arial,Helvetica,sans-serif',
        fontSize: '13px',
        fontWeight: 'normal',
        lineHeight: 'normal',
        position: 'absolute',
        top: '25px',
        left: 0,
        right: 0,
        margin: 0,
        padding: '3px',
        zIndex: 99990
      });

      if(document.body.scrollWidth <= 400)
      {
        panel.style.paddingTop = '28px';
      }

      youtube.btnBox = document.createElement('div');
      youtube.btnBox.style.display = 'none';
      youtube.btnBox.appendChild(b);
      youtube.btnBox.appendChild(panel);

      mono.off(document, 'mouseenter', youtube.onExtPlayerOver, false);
      mono.off(document, 'mouseleave', youtube.onExtPlayerOver, false);
      mono.on(document, 'mouseenter', youtube.onExtPlayerOver, false);
      mono.on(document, 'mouseleave', youtube.onExtPlayerOver, false);

      a.addEventListener('click', youtube.fetchIframeLinks, false);
      a.addEventListener('click', youtube.toggleIframePanel, false);

      document.body.appendChild(youtube.btnBox);
    },


    fetchIframeLinks: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var button = e.target;

      var vid = youtube.video_id;

      var request = {
        action: 'getYoutubeLinks',
        extVideoId: vid,
        url: location.href
      };

      mono.sendMessage(request, function(response){
        if(response.links)
        {
          youtube.links[vid] = response.links;
        }
        youtube.appendIframeLinks(response.links, button);
      });

      youtube.appendIframeLinks(language.download + ' ...', button);
    },


    appendIframeLinks: function(links, button)
    {
      var panel = document.getElementById(youtube.panelId);
      if (!links || links.length === 0) {
        links = language.noLinksFound;
      }
      if(typeof(links) == 'object')
      {
        var title = youtube.getTitle(), titleAttr = '';
        if(title)
        {
          title = modifyTitle(title);
          /*
          titleAttr = '&title=' + encodeURIComponent(title);
          for(var i in links) {
            links[i] += titleAttr;
          }
          */
        }

        panel.textContent = '';
        SaveFrom_Utils.video.yt.init();
        SaveFrom_Utils.video.yt.show(links, panel, preference.moduleShowDownloadInfo, {
          link: {color: '#fff', borderBottom: '1px solid #808080',
            whiteSpace: 'nowrap', textDecoration: 'none'},
          text: {color: '#d0d0d0'},
          btn: {color: '#d0d0d0'},
          fsIcon: {color: '#ffffff', opacity: '.5'},
          fsText: {color: '#d0d0d0'}
        }, title);

        button.removeEventListener('click', youtube.fetchIframeLinks, false);
      }
      else if(typeof(links) == 'string')
      {
        panel.textContent = links;
      }
    },


    toggleIframePanel: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var panel = document.getElementById(youtube.panelId);
      if(panel)
      {
        var isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? '' : 'none';

        if (isHidden && preference.inCohort && [1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-iframe'});
        }
      }
    },


    onExtPlayerOver: function(event)
    {
      if(youtube.btnBox)
      {
        if(event.type == 'mouseenter')
        {
          if(youtube.btnBox.style.display == 'none')
            youtube.btnBox.style.display = 'block';
        }
        else if(event.type == 'mouseleave')
        {
          youtube.btnBox.style.display = 'none';
        }
      }
    },


    getTitle: function()
    {
      var t = document.getElementById('watch-headline-title');
      if(t)
        return t.textContent;

      var meta = document.getElementsByTagName('meta');
      for(var i = 0; i < meta.length; i++)
      {
        var name = meta[i].getAttribute('name');
        if(name && name.toLowerCase() == 'title')
          return meta[i].getAttribute('content');
      }

      if(iframe || youtube.isMobile)
        return document.title.replace(/ - YouTube$/, '');

      return '';
    },

    onPopupMenuItemClick: function(button, data) {
      var isBest = data.isBest ? 'yes' : 'no';

      var quality = data.quality || '';
      if (quality) {
        quality = quality.replace(' ' + mono.global.language.kbps, '');
      }
      var label = [
        data.format, quality
      ];
      if (data.sFps) {
        label.push(data.sFps);
      }
      if (data['3d']) {
        label.push(data['3d']);
      }
      if (data.noAudio) {
        label.push(data.noAudio);
      }
      label.push(data.itag);
      if (data.quality === 'ummy') {
        label = [data.format];
        if (data.uIsAudio) {
          label.push(data.uIsAudio);
        }
      }

      label = label.join(' ');

      mono.sendMessage({action: 'trackEvent', category: 'youtube', event: 'download', label: label});

      if (data.format === '???') {
        mono.sendMessage({action: 'trackEvent', category: 'youtube', event: 'new_format', label: data.itag+' '+youtube.video_id});
      }

      var itag = data.itag;
      mono.storage.set({ytLastITag: itag}, function() {
        if (data.noUpdate) {
          return;
        }
        youtube.setButtonValue(button);
      });
    },

    showLinks: function(links, button, subtitles)
    {
      var _button = document.getElementById(youtube.buttonId);
      // _button = is container,
      // button - select btn

      if (youtube.tmpExMenu && youtube.tmpExMenu.parentNode) {
        youtube.tmpExMenu.parentNode.removeChild(youtube.tmpExMenu);
      }
      if (typeof links === 'string') {
        youtube.tmpExMenu = SaveFrom_Utils.popupMenu.create({
          links: links,
          button: _button || button,
          popupId: youtube.panelId
        });
      } else {
        var title = youtube.getTitle();
        if(title) {
          title = modifyTitle(title);
        }

        var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(links, title, subtitles);

        youtube.tmpExMenu = SaveFrom_Utils.popupMenu.create({
          links: menuLinks,
          button: _button || button,
          popupId: youtube.panelId,
          showFileSize: true,
          onItemClick: function(data) {
            youtube.onPopupMenuItemClick(button, data);
          }
        });
      }

      // button.classList.add('yt-uix-button-toggled');

      button.removeEventListener('mousedown', youtube.getLinks, false);
      button.removeEventListener('mousedown', youtube.togglePanel, false);
      button.addEventListener('mousedown', youtube.togglePanel, false);

      document.removeEventListener('mousedown', youtube.closePopup, false);
      document.addEventListener('mousedown', youtube.closePopup, false);

      SaveFrom_Utils.popupMenu.popup = undefined;
    },

    closePopup: function () {
      youtube.togglePanel();
      document.removeEventListener('mousedown', youtube.closePopup);
    },

    togglePanel: function(event)
    {

      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      var e = document.getElementById(youtube.panelId);
      if(e)
      {
        if(e.style.display == 'none')
        {
          e.style.display = '';

          document.addEventListener('mousedown', youtube.closePopup, false);

          var button = document.getElementById(youtube.buttonId);
          if (button !== null) {
            var pos = SaveFrom_Utils.getPosition(button);
            var size = SaveFrom_Utils.getSize(button);

            e.style.top = (pos.top + size.height) + 'px';
            e.style.left = pos.left + 'px';
          }
        }
        else
        {
          e.style.display = 'none';

          document.removeEventListener('mousedown', youtube.closePopup, false);
        }
      }
    },

    onDlBtnClick: function(e, listItem, button) {
      if (!listItem) {
        e.preventDefault();
        e.stopPropagation();
        mono.trigger(this.parentNode.lastChild, 'mousedown');
        return;
      }

      if (preference.inCohort && [1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-single'});
      }

      var data = {
        itag: listItem.itag || '',
        quality: listItem.quality || '',
        format: listItem.format || '???',
        '3d': listItem['3d'] ? '3D' : '',
        sFps: listItem.sFps ? 'fps' + (listItem.fps || '60') : '',
        noAudio: listItem.noAudio ? 'no audio' : '',
        isBest: !!listItem.isBest,
        uIsAudio: listItem.uIsAudio ? 'audio' : '',
        noUpdate: 1
      };
      youtube.onPopupMenuItemClick(button, data);

      if (listItem.quality === 'ummy') {
        return;
      }

      if (listItem.forceDownload) {
        SaveFrom_Utils.downloadOnClick(e, null, {
          useFrame: listItem.useIframe || false
        });
      }
    },

    setButtonValue: (function() {
      var bindDlBtn = function(selectBtn, dlBtn, listItem) {
        var eIndex = dlBtn.dataset.eventInedx || 0;
        dlBtn.dataset.eventInedx = ++eIndex;
        dlBtn.addEventListener('click', function onClick(e){
          e.stopPropagation();
          if (parseInt(this.dataset.eventInedx) !== eIndex) {
            this.removeEventListener('click', onClick);
            return;
          }
          youtube.onDlBtnClick.call(this, e, listItem, selectBtn);
        });

        dlBtn.removeAttribute('download');
        dlBtn.removeAttribute('title');

        if (!listItem) {
          return;
        }

        var title;
        if (listItem.quality === 'ummy') {
          mono.sendMessage({action: 'getUmmyIcon'}, function(dataImg) {
            selectBtn.insertBefore(mono.create('span', {
              style: {
                width: '16px',
                height: '16px',
                backgroundImage: 'url('+dataImg+')',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                marginLeft: '6px',
                display: 'inline-block',
                verticalAlign: 'top'
              }
            }), selectBtn.lastChild);
          });
          title = mono.capitalize(listItem.quality);
        } else {
          var btnText = listItem.quality;
          if (!listItem.noVideo) {
            btnText = parseInt(btnText);
          }
          if (listItem['3d']) {
            btnText = '3D ' + btnText;
          }
          if (listItem.sFps) {
            btnText += ' ' + (listItem.fps || '60');
          }
          title = [listItem.format, btnText];
          if (listItem.noAudio) {
            title.push(language.withoutAudio);
          }
          title = title.join(' ');
          selectBtn.insertBefore(mono.create('span', {
            text: btnText,
            style: {
              marginLeft: '6px',
              verticalAlign: 'bottom'
            }
          }), selectBtn.lastChild);
        }

        dlBtn.title = title;
        dlBtn.href = listItem.href;

        if (listItem.title && listItem.format) {
          var ext = listItem.ext;
          if(!ext) {
            ext = listItem.format.toLowerCase();
          }
          dlBtn.setAttribute('download', mono.fileName.modify(listItem.title + '.' + ext) );
        }
      };

      var getBestItem = function(menuLinks) {
        var sList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.prop.noAudio || item.prop.noVideo) {
            continue;
          }
          if (item.prop.format === 'ummy') {
            continue;
          }
          if (!item.prop.isHidden) {
            sList.push(item.prop);
          }
        }
        menuLinks = sList;
        if (menuLinks.length > 0) {
          return menuLinks[0];
        }
        return undefined;
      };

      var prepMenuLinks = function(links, title) {
        var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(links, title);
        var ummyLinks = {};

        var linkList = [];
        for (var i = 0, item; item = menuLinks[i]; i++) {
          if (item.quality === 'ummy') {
            ummyLinks[item.itag] = item;
          }
          linkList.push({prop: item});
        }
        menuLinks = SaveFrom_Utils.popupMenu.sortMenuItems(linkList);
        var hasBest = false;
        menuLinks.forEach(function(item) {
          if (item.prop.isHidden) {
            return 1;
          }
          if (hasBest === false) {
            item.prop.isBest = hasBest = true;
            return 0;
          }
          return 0;
        });

        return {mL: menuLinks, uM: ummyLinks};
      };

      var onGetLinks = function(selectBtn, dlBtn, links) {
        if (!links || links.length === 0) {
          return bindDlBtn(selectBtn, dlBtn);
        }

        mono.storage.get('ytLastITag', function(storage) {
          var iTagLast = storage.ytLastITag;
          var title = youtube.getTitle();
          if(title) {
            title = modifyTitle(title);
          }

          var menuLinks = prepMenuLinks(links, title);
          var ummyLinks = menuLinks.uM;
          menuLinks = menuLinks.mL;

          if (selectBtn.firstChild.tagName !== 'I') {
            selectBtn.removeChild(selectBtn.firstChild);
          }

          if (iTagLast === 'ummyAudio') {
            iTagLast = 'ummy';
          }

          if (iTagLast === 'ummy' && ummyLinks[iTagLast]) {
            bindDlBtn(selectBtn, dlBtn, ummyLinks[iTagLast]);
          } else {
            bindDlBtn(selectBtn, dlBtn, getBestItem(menuLinks));
          }
        });
      };

      return function(selectBtn) {
        var dlBtn = selectBtn.parentNode.firstChild;
        var vid = youtube.video_id;

        if(youtube.links[vid]) {
          return onGetLinks(selectBtn, dlBtn, youtube.links[vid]);
        }

        if(!vid) {
          return onGetLinks(selectBtn, dlBtn, []);
        }

        bindDlBtn(selectBtn, dlBtn);

        /*
        var request = {
          action: 'getYoutubeLinks',
          extVideoId: vid,
          url: location.href
        };

        mono.sendMessage(request, function(response){
          if (response.links) {
            youtube.links[vid] = response.links;
          }
          return onGetLinks(selectBtn, dlBtn, response.links || []);
        });
        */

        getPlayerConfig(function(config) {
          mono.sendMessage({
            action: 'getYoutubeLinksFromConfig',
            config: config,
            extVideoId: vid,
            url: location.href,
            noDash: true
          }, function(response) {
            if (!response) {
              response = {};
            }
            if (response.isQuick) {
              dlBtn.dataset.isQuick = '1';
            }
            if (response.noChiped) {
              dlBtn.dataset.noChiped = '1';
            }
            return onGetLinks(selectBtn, dlBtn, response.links || []);
          });
        });
      }
    })(),

    getLinks: function(event)
    {
      event.preventDefault();
      event.stopPropagation();
      var vid = youtube.video_id;

      var button = this;

      var d = button;
      while(d && d != document.body)
      {
        if(d.style.display == 'none')
          d.style.display = '';

        if(d.style.visibility == 'hidden')
          d.style.visibility = 'visible';

        d.style.zOrder = '9999';

        d = d.parentNode;
      }

      if (preference.inCohort && [1].indexOf(preference.cohortIndex) !== -1) {
        mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-single'});
      }

      if(youtube.links[vid]) {
        youtube.showLinks(youtube.links[vid], button, youtube.subtitles[vid]);
        return;
      }

      if(!vid)
        return;


      var request = {
        action: 'getYoutubeLinks',
        extVideoId: vid,
        url: location.href,
        checkSubtitles: true
      };

      youtube.showLinks(language.download +
      ' ...', button);

      mono.sendMessage(request, function(response) {
        if (response.links) {
          youtube.links[vid] = response.links;
          youtube.subtitles[vid] = response.subtitles;
        }
        youtube.showLinks(response.links || [], button, response.subtitles);
      });
    },

    videoFeed: {
      state: false,
      currentMenu: undefined,
      injectedStyle: undefined,
      imgIdPattern: /vi[^\/]{0,}\/([^\/]+)/,
      onUrlUpdate: function(url) {
        if (youtube.videoFeed.currentMenu !== undefined) {
          youtube.videoFeed.currentMenu.hide();
          youtube.videoFeed.currentMenu = undefined;
        }
        var isPlaylist = false;
        if (url.indexOf('/playlist?') !== -1) {
          isPlaylist = true;
        } else {
          var matched = url.match(/(user|channel)\/[^\/]+(\/feed|\/featured|\/videos|$)/i);
          if (!matched) {
            matched = url.match(/\/(feed)\/(subscriptions|history)/i);
          }
          if (!matched || matched.length < 3) {
            isPlaylist = false;
          } else {
            isPlaylist = true;
          }
        }
        if (isPlaylist) {
          this.enable();
        } else {
          this.disable();
        }
      },
      disable: function() {
        if (!this.state) {
          return;
        }
        this.state = false;

        mono.off(document, 'mouseenter', this.onVideoImgHover, true);
        if (this.injectedStyle && this.injectedStyle.parentNode) {
          this.injectedStyle.parentNode.removeChild(this.injectedStyle);
          this.injectedStyle = undefined;
        }
      },
      enable: function() {
        if (iframe) {
          return;
        }
        if (this.state) {
          return;
        }
        this.state = true;

        mono.off(document, 'mouseenter', this.onVideoImgHover, true);
        mono.on(document, 'mouseenter', this.onVideoImgHover, true);

        if (this.injectedStyle === undefined) {
          this.injectedStyle = mono.create('style', {
            text: "a > .sf-feed-dl-btn," +
            "span > .sf-feed-dl-btn {" +
            'display: none;' +
            'border: 1px solid #d3d3d3;' +
            'width: 20px;' +
            'height: 20px;' +
            'padding: 0;' +
            'position: absolute;' +
            'right: 26px;' +
            'bottom: 2px;' +
            'border-radius: 2px;' +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#777777') + ') center no-repeat #f8f8f8;' +
            'background-size: 12px;' +
            "}" +
            "a > .sf-feed-dl-btn:hover," +
            "span > .sf-feed-dl-btn:hover {" +
            'background: url(' + SaveFrom_Utils.svg.getSrc('download', '#00B75A') + ') center no-repeat #f8f8f8;' +
            'background-size: 12px;' +
            "}" +
            "a > .sf-feed-dl-btn:active," +
            "span > .sf-feed-dl-btn:active {" +
            "outline: 0;" +
            "box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.125);" +
            "}" +
            "a:hover > .sf-feed-dl-btn," +
            "span:hover > .sf-feed-dl-btn {display: block;}"
          });

          document.body.appendChild(this.injectedStyle);
        }
      },

      rmBtn: function() {
        var btnList = document.querySelectorAll('.sf-feed-dl-btn');
        for (var i = 0, item; item = btnList[i]; i++) {
          item.parentNode.removeChild(item);
        }
        var dataAttr = mono.dataAttr2Selector('sfBtn');
        var datasetList = document.querySelectorAll('*['+dataAttr+']');
        for (i = 0, item; item = datasetList[i]; i++) {
          item.removeAttribute(dataAttr);
        }
      },

      onVideoImgHover: function(e) {
        if (e.target.tagName !== 'IMG') {
          return;
        }

        youtube.videoFeed.onImgHover.call(e.target, e);
      },

      onImgHover: function(e) {
        var parent = this.parentNode;
        var vid = parent.dataset.vid;
        if (!vid) {
          if (!this.src) {
            return;
          }
          vid = this.src.match(youtube.videoFeed.imgIdPattern);
          if (!vid) {
            return;
          }
          vid = vid[1];
          if (parent.classList.contains('yt-thumb-clip') || parent.classList.contains('video-thumb')) {
            parent = SaveFrom_Utils.getParentByTagName(this, 'A');
          }
          if (!parent) {
            return;
          }
          parent = parent.parentNode;
          if (!SaveFrom_Utils.hasChildrenTagName(parent, 'BUTTON')) {
            return;
          }
        }
        var hasBtn = parent.dataset.sfBtn;
        if (hasBtn) {
          return;
        }
        parent.dataset.sfBtn = '1';

        parent.appendChild(mono.create('i', {
          class: "sf-feed-dl-btn",
          append: [
            !mono.isOpera ? undefined : mono.create('img', {
              src: SaveFrom_Utils.svg.getSrc('download', '#777777'),
              style: {
                width: '12px',
                height: '12px',
                margin: '4px'
              }
            })
          ],
          on: ['click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (youtube.videoFeed.currentMenu !== undefined) {
              youtube.videoFeed.currentMenu.hide();
              youtube.videoFeed.currentMenu = undefined;
            }

            var _this = this;
            var menu = youtube.videoFeed.currentMenu = SaveFrom_Utils.popupMenu.quickInsert(_this, language.download + ' ...', 'sf-popupMenu');

            mono.sendMessage({
              action: 'getYoutubeLinks',
              extVideoId: vid,
              url: location.href,
              checkSubtitles: true
            }, function(response){
              if(response.links) {
                var menuLinks = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title, response.subtitles);
                menu.update(menuLinks);
                return;
              }
              menu.update(language.noLinksFound);
            });

            if (preference.inCohort && [1].indexOf(preference.cohortIndex) !== -1) {
              mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-playlist'});
            }
          }]
        }));
      }
    },

    downloadPlaylist: function() {
      var getIdListFromPage = function(container) {
        var idList = [];
        var imgList = container.querySelectorAll('img[src]');
        var pattern = youtube.videoFeed.imgIdPattern;
        for (var i = 0, el; el = imgList[i]; i++) {
          var matched = el.src.match(pattern);
          if (!matched) {
            continue;
          }
          if (idList.indexOf(matched[1]) === -1) {
            idList.push(matched[1]);
          }
        }

        var dataElList = container.querySelectorAll('*[data-video-id]');
        for (i = 0, el; el = dataElList[i]; i++) {
          var id = el.dataset.videoId;
          if (idList.indexOf(id) === -1) {
            idList.push(id);
          }
        }
        return idList;
      };
      var getIdLinks = function(cb) {
        var container = document;
        var url = mono.parseUrlParams(location.href);
        if (url.list !== undefined) {
          return mono.sendMessage({action: 'getYoutubeIdListFromPlaylist', listId: url.list, baseUrl: location.protocol + '//' + location.host}, function(response) {
            if (!response) {
              return cb();
            }
            if (!response.idList || response.idList.length === 0) {
              var container = document.querySelector(".playlist-videos-container > .playlist-videos-list");
              if (container !== null) {
                response.idList = getIdListFromPage(container);
              }
              if (!response.title) {
                var title = document.querySelector(".playlist-info > .playlist-title");
                if (title !== null) {
                  response.title = title.textContent.replace(/\r?\n/g, " ").trim();
                }
              }
            }
            cb(response.idList, response.title);
          });
        }
        var idList = getIdListFromPage(container);
        cb(idList, youtube.getTitle());
      };
      var getVideoLink = function(vid, maxSize, typeList, cb) {
        var useDash = typeList.indexOf('audio') !== -1;
        mono.sendMessage({action: 'getYoutubeLinks', extVideoId: vid, noDash: useDash}, function(response) {
          var links = undefined;
          if(response.links) {
            links = SaveFrom_Utils.popupMenu.prepareLinks.youtube(response.links, response.title);
            links = SaveFrom_Utils.popupMenu.sortMenuItems(links, {
              noProp: true,
              maxSize: maxSize,
              minSize: 2,
              typeList: typeList
            });
          }
          cb(links);
        });
      };
      var getVideoLinks = function(idList, maxSize, onProgress, onReady) {
        var abort = false;
        var linkList = {};
        var index = 0;
        var inProgress = 0;
        var listLen = idList.length;

        var typeList = undefined;
        if (maxSize === 'audio') {
          typeList = ['audio'];
          maxSize = undefined;
        } else {
          typeList = ['video'];
          maxSize = parseInt(maxSize) || undefined;
        }

        var getNextOneId = function() {
          if (abort) {
            return;
          }
          var id = idList[index];
          if (id === undefined) {
            if (inProgress === 0) {
              return onReady(linkList);
            } else {
              return;
            }
          }
          index++;
          inProgress++;
          getVideoLink(id, maxSize, typeList, function(links) {
            var firstLink = links ? links[0] : undefined;
            if (firstLink) {
              var ext = firstLink.ext;
              if(!ext) {
                ext = firstLink.format.toLowerCase();
              }

              var filename = mono.fileName.modify(firstLink.title + '.' + ext);
              linkList[id] = {url: firstLink.href, title: firstLink.title, filename: filename};
            }
            onProgress(index, listLen);
            inProgress--;
            getNextOneId();
          });
        };
        getNextOneId();
        getNextOneId();
        return {
          abort: function () {
            abort = true;
          }
        }
      };
      var getPopup = function(onClose) {
        var template = SaveFrom_Utils.playlist.getInfoPopupTemplate();
        var progressEl;
        var qualitySelectBox;
        var qualitySelect;

        mono.sendMessage({action: 'getWarningIcon', type: 'playlist', color: '#77D1FA'}, function(icon) {
          template.icon.style.backgroundImage = 'url('+icon+')';
        });

        mono.create(template.textContainer, {
          append: [
            mono.create('p', {
              text: language.playlist,
              style: {
                color: '#0D0D0D',
                fontSize: '20px',
                marginBottom: '11px',
                marginTop: '13px'
              }
            }),
            qualitySelectBox = mono.create('div', {
              append: [
                mono.create('p', {
                  text: language.quality+":",
                  style: {
                    color: '#000000',
                    fontSize: '14px',
                    marginBottom: '13px',
                    lineHeight: '24px'
                  },
                  append: [
                    qualitySelect = mono.create('select', {
                      style: {
                        width: '75px',
                        marginLeft: '5px'
                      },
                      append: [
                        mono.create('option', {
                          text: '720',
                          value: '720'
                        }),
                        mono.create('option', {
                          text: '480',
                          value: '480'
                        }),
                        mono.create('option', {
                          text: '360',
                          value: '360'
                        }),
                        mono.create('option', {
                          text: '240',
                          value: '240'
                        }),
                        mono.create('option', {
                          text: 'Audio',
                          value: 'audio'
                        })
                      ]
                    })
                  ]
                }),
                mono.create('p', {
                  text: language.qualityNote,
                  style: {
                    color: '#868686',
                    fontSize: '14px',
                    lineHeight: '24px'
                  }
                })
              ]
            }),
            progressEl = mono.create('p', {
              text: '',
              style: {
                color: '#868686',
                fontSize: '14px',
                lineHeight: '24px'
              }
            })
          ]
        });

        var continueBtn, cancelBtn;
        mono.create(template.buttonContainer, {
          append: [
            cancelBtn = mono.create('button', {
              text: language.cancel,
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
              text: language.continue,
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

        var popupEl = SaveFrom_Utils.popupDiv(template.body, 'pl_progress_popup', undefined, undefined, onClose);
        return {
          qualitySelect: function(cb) {
            progressEl.style.display = 'none';
            template.buttonContainer.style.display = 'block';
            qualitySelectBox.style.display = 'block';
            continueBtn.addEventListener('click', function() {
              cb(qualitySelect.value);
            });
            cancelBtn.addEventListener('click', function() {
              mono.trigger(popupEl, 'kill');
            });
          },
          onPrepare: function(text) {
            progressEl.style.display = 'block';
            template.buttonContainer.style.display = 'none';
            qualitySelectBox.style.display = 'none';
            progressEl.textContent = text;
          },
          onProgress: function(count, max) {
            progressEl.textContent = language.vkFoundFiles.replace('%d', count) + ' ' + language.vkFoundOf + ' ' + max;
          },
          onReady: function(list, title) {
            mono.trigger(popupEl, 'kill');
            if (allowDownloadMode) {
              SaveFrom_Utils.downloadList.showBeforeDownloadPopup(list, {
                type: 'playlist',
                folderName: title
              });
            } else {
              SaveFrom_Utils.playlist.popupPlaylist(list, title, true, undefined, 'video');
            }
          },
          onError: function(text) {
            mono.sendMessage({action: 'getWarningIcon', type: 'playlist', color: '#AAAAAA'}, function(icon) {
              template.icon.style.backgroundImage = 'url('+icon+')';
            });

            progressEl.style.display = 'block';
            template.buttonContainer.style.display = 'none';
            qualitySelectBox.style.display = 'none';
            progressEl.textContent = text;
          }
        }
      };
      return function() {
        var abort = false;
        var gettingLink = undefined;
        var popup = getPopup(function onClose() {
          abort = true;
          if (gettingLink) {
            gettingLink.abort();
          }
        });
        popup.qualitySelect(function(maxSize) {
          popup.onPrepare(language.download+' ...');
          getIdLinks(function(idList, title) {
            if (abort) {
              return;
            }
            if (!idList || idList.length === 0) {
              popup.onError(language.noLinksFound);
              return;
            }

            gettingLink = getVideoLinks(idList, maxSize, popup.onProgress, function onReady(linkList) {
              var links = [];
              for (var id in linkList) {
                links.push(linkList[id]);
              }

              var folderName = mono.fileName.modify(title);
              popup.onReady(links, folderName);
            });
          });
        });
        if (preference.inCohort && [1].indexOf(preference.cohortIndex) !== -1) {
          mono.sendMessage({action: 'trackCohort', category: 'youtube', event: 'click', label: 'video-menu'});
        }
      }
    }()
  };


  function modifyTitle(t)
  {
    t = t.replace(/[\x2F\x5C\x3A\x7C]/g, '-');
    t = t.replace(/[\x2A\x3F]/g, '');
    t = t.replace(/\x22/g, '\'');
    t = t.replace(/\x3C/g, '(');
    t = t.replace(/\x3E/g, ')');
    t = t.replace(/(?:^\s+)|(?:\s+$)/g, '');
    return t;
  }

  var getPlayerConfig = function(cb) {
    var bridge = SaveFrom_Utils.bridge;
    bridge.init();
    bridge.send.call({timeout: 300}, 'getYtPlayerConfig', [], function(data) {
      if (data && data.args && !data.sts) {
        data.sts = SaveFrom_Utils.getMatchFirst(document.body.innerHTML, /["']{1}sts["']{1}\s*:\s*["']?(\d+)/i);
      }
      cb(data);
    });
  };

  init();
});