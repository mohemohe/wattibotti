/*
 * Almight AVG Engine
 * Mobile Only API
 */


/***** BGM ******/
var soundObj = {};
var soundTimer = {};


// サウンドオブジェクトを生成する
callback1 = function(option){
	soundObj[option.name] = null;
	soundObj[option.name] = Titanium.Media.createSound({
		allowBackground: false,
		looping: false,
		volume: 1
	});
	soundTimer[option.name] = null;
};

// サウンドを再生する
callback2 = function(option) {
	soundObj[option.name].reset();
	soundObj[option.name].release();
	if(option.loop) {
		soundObj[option.name].setLooping(true);
	} else {
		soundObj[option.name].setLooping(false);
	}
	option.src = option.src.replace('.ogg', '.m4a');
	soundObj[option.name].url = Titanium.App.playDir + option.src;
	soundObj[option.name].play();

	if(soundTimer[option.name] !== null) clearTimeout(soundTimer[option.name]);

	if(soundObj[option.name].isLooping() === false) {
		var name = option.name;
		var time = soundObj[option.name].getDuration();

		soundTimer[name] = setTimeout(function(){
			if(name.indexOf('se') !== -1) {
				var buf = name.replace('se', '');
				webView.evalJS('almight.se[' +buf+ '].typeViewer.playend.call(almight.se[' +buf+ ']);');
			} else {
				webView.evalJS('almight["' +name+ '"].typeViewer.playend.call(almight["' +name+ '"]);');
			}
		}, (Titanium.Platform.osname === 'android' ? time : parseInt(time * 1000, 10)) );
	}
};

// サウンドを停止する
callback3 = function(option){
	soundObj[option.name].reset();
	if(soundTimer[option.name] !== null) clearTimeout(soundTimer[option.name]);
	soundObj[option.name].release();
};

// サウンドのボリュームを設定する
callback4 = function(option){
	if(option.volume >= 0 && option.volume <= 1) {
		soundObj[option.name].setVolume(option.volume);
	}
};

// キーを取得する
callback5 = function(){
	webView.evalJS('almight.getKey("' + Titanium.App.cryptKey + '")');
};

// ゲームを終了する
callback6 = function(){
	for(var i in soundObj) {
		soundObj[i].stop();
		soundObj[i].release();
	}

	soundObj = null;
	Titanium.App.removeEventListener('createSound',callback1);
	Titanium.App.removeEventListener('setPlaySound',callback2);
	Titanium.App.removeEventListener('setStopSound',callback3);
	Titanium.App.removeEventListener('setVolumeSound',callback4);
	Titanium.App.removeEventListener('getKey',callback5);
	Titanium.App.removeEventListener('setExit',callback6);

	if(Titanium.Platform.osname === 'android') {
		Titanium.UI.currentWindow.orientationModes = [Titanium.UI.PORTRAIT];
		var activity = Titanium.Android.currentActivity;
		activity.finish();
	} else {
		Titanium.UI.currentWindow.close({
			transition: Ti.UI.iPhone.AnimationStyle.FLIP_FROM_LEFT
		});
	}
};

Titanium.App.addEventListener('createSound',callback1);
Titanium.App.addEventListener('setPlaySound',callback2);
Titanium.App.addEventListener('setStopSound',callback3);
Titanium.App.addEventListener('setVolumeSound',callback4);
Titanium.App.addEventListener('getKey',callback5);
Titanium.App.addEventListener('setExit',callback6);

Titanium.API.info('Almight API Loaded : ' + Ti.App.playDir);