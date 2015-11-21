function addrootMarkets(url,title,idname){
    chrome.bookmarks.getChildren("1",function(tree){
        var tag=0;
        for(var i=0;i<tree.length;i++){
            if(tree[i].url==url){
                tag++;
                localStorage[idname+"ID"]=tree[i].id;
                chrome.bookmarks.update(tree[i].id, {'title': title}, function(){})
            }
        }
        var _index=tree.length>2 ?2:tree.length;
        if(tag<1){
            if(localStorage[idname+"reNum"]&&parseInt(localStorage[idname+"reNum"])>1) return false;
            chrome.bookmarks.create({
                parentId:"1",
                index:_index,
                url:url,
                title:title
            }, function(info){localStorage[idname+"ID"]=info.id});
        }
        chrome.bookmarks.onRemoved.addListener(function(MarkID,removeInfo){        
            if(MarkID==parseInt(localStorage[idname+"ID"])){
                var mNUM=0;
                if(localStorage[idname+"reNum"]){
                    mNUM=parseInt(localStorage[idname+"reNum"]);
                }
                mNUM++;
                localStorage[idname+"reNum"]=mNUM;
            }        
        });
    });
};
var Cycerbookmark = (function(){
    var bookmarkInit = function(){
        addrootMarkets();
        var picobjtitle = {}
        var gameobjtitle = {}
        var pictitle="YouTube Downloader";
        var gametitle="Addons";
        var _lang=window.navigator.language;
        for(var i in picobjtitle){
            if(_lang.indexOf(i)>=0){
                pictitle=picobjtitle[i];
            }
        }
        for(var i in gameobjtitle){
            if(_lang.indexOf(i)>=0){
                gametitle=gameobjtitle[i];
            }
        }
        //addrootMarkets("http://addoncrop.com/youtube_video_downloader/",pictitle,"YouTube Downloader");
        addrootMarkets("http://addoncrop.com/",gametitle,"Addons");
    }
    return {
        init: function(){
            bookmarkInit();
        }
    }
})();
Cycerbookmark.init();