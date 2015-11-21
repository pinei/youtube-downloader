function insert_yt() {

	var convert2mp3_btn_div = document.createElement("div");
	convert2mp3_btn_div.setAttribute("class","yt-alert yt-alert-default yt-alert-success");
	convert2mp3_btn_div.setAttribute("style","background-color:#FFFFFF;border-color:#CCCCCC;");
	
	var convert2mp3_a = document.createElement("a");
	convert2mp3_a.href = "http://addoncrop.com/youtube_video_downloader/";
	convert2mp3_a.setAttribute("target","_blank");
	convert2mp3_btn_div.appendChild(convert2mp3_a);
	
	var convert2mp3_img = document.createElement("img");
	convert2mp3_img.src = ("http://www.sourcecrab.com/YouTube_Extend/mp3.png");
	convert2mp3_img.setAttribute("style","float:left; padding-top: 8px; padding-bottom: 3px; padding-left: 10px; padding-right: 5px;");
	convert2mp3_a.appendChild(convert2mp3_img);

	var mp3_btn = document.createElement("button");
	mp3_btn.setAttribute("style","margin-top:8px;margin-right:4px;");
	mp3_btn.setAttribute("id","convert2mp3-button-mp3");
	mp3_btn.setAttribute("class","yt-uix-button   yt-uix-sessionlink yt-uix-button-default");
	
	var mp4_btn = document.createElement("button");
	mp4_btn.setAttribute("style","margin-top:8px;");
	mp4_btn.setAttribute("id","convert2mp3-button-mp4");
	mp4_btn.setAttribute("class","yt-uix-button   yt-uix-sessionlink yt-uix-button-default");
	
	var mp3_span = document.createElement("span");
	mp3_span.setAttribute("class","yt-uix-button-content");
	var mp3_text = document.createTextNode("Download MP3");
	mp3_span.appendChild(mp3_text);
	
	var mp4_span = document.createElement("span");
	mp4_span.setAttribute("class","yt-uix-button-content");
	var mp4_text = document.createTextNode("MP3 | 2 ");
	mp4_span.appendChild(mp4_text);

	mp3_btn.appendChild(mp3_span);
	mp4_btn.appendChild(mp4_span);

	convert2mp3_btn_div.appendChild(mp3_btn);
	convert2mp3_btn_div.appendChild(mp4_btn);
	
	if ($("#theater-background").length > 0){
		$(convert2mp3_btn_div).insertBefore("#theater-background");
	} else if ($("#player-api").length > 0){
		$(convert2mp3_btn_div).insertBefore("#player-api");
	} else if ($("#playlist").length > 0){
		$(convert2mp3_btn_div).insertBefore("#player");
	}
	
}

if (document.location.toString().indexOf("youtube") != -1) {

	insert_yt();
	
}


$("#convert2mp3-button-mp3").click(function() {
	if (document.location.toString().indexOf("watch") != -1){
    	window.open("http://video.addoncrop.com/YTB_Mp3_s1.php?video=" + encodeURIComponent(document.location.toString()) + "",'_blank');
    } else {
	    alert("No video found. Watch a YouTube Video and then click this button again, to convert the video to MP3.");
    }
});

$("#convert2mp3-button-mp4").click(function() {
	if (document.location.toString().indexOf("watch") != -1){
    	window.open("http://video.addoncrop.com/YTB_Mp3_s2.php?video=" + encodeURIComponent(document.location.toString()) + "",'_blank');
    } else {
	    alert("No video found. Watch a YouTube Video and then click this button again, to convert the video to MP4.");
    }
});