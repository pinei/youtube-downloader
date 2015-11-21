var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-53619899-1']);
      _gaq.push(['_trackPageview']);
      _gaq.push(['account2._setAccount', 'UA-57384941-1']);
      _gaq.push(['account2._trackPageview']);

      (function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();



if ((localStorage["firstrun"]!="false") && (localStorage["firstrun"]!=false)){
		chrome.tabs.create({url: "http://www.youtube.com/watch?v=neKpRbljK-w", selected:true})
		chrome.tabs.create({url: "http://addoncrop.com/yvd-installed-successfully", selected:true})
		localStorage["firstrun"] = false;
}

if (chrome.runtime.setUninstallURL) {
    chrome.runtime.setUninstallURL("http://addoncrop.com/yvd_successfully_uninstalled/");
}