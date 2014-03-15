/*!
 * AlmightJS HTML5 Novel Game Engine
 * http://almight.jp
 * Copyright 2013 EISYS, Inc.
 */

(function(window){
	/**
	* Almight全体で共通して利用するグローバル関数です
	*
	* @class Almight
	*/
	window.Almight = {
		/**
		 * **AlmightJSのバージョン**
		 *
		 * @property version 
		 * @type String
		 **/
		version: '4.0.0',

		/**
		 * **対応している言語**
		 *
		 * @property lang 
		 * @type Array
		 * @default ['ja']
		 **/
		lang: ['ja'],

		/**
		 * **現在利用している言語**
		 *
		 * @property nowlang 
		 * @type Number
		 * @default 0
		 **/
		nowlang: 0,

		/**
		 * **ゲームリソースディレクトリへのパス**
		 *
		 * @property resourcePath 
		 * @type String
		 * @default '../game/'
		 **/
		resourcePath: '../game/',

		/**
		 * **ファイルパス紐付けデータ**
		 *
		 * @property filePath 
		 * @type Object
		 * @default null
		 **/
		filePath: null,

		/**
		* **JavaScriptを実行する**
		*
		* @method exec
		* @params {String} js JavaScriptコード
		* @params {Boolean} global trueならコードをグローバルスコープで実行する
		* @return {Object} globalがfalseなら結果を返す
		*/
		exec: function(js, global) {
			// NOTE: voidをundefinedに置換しているが要注意
			// js = String(js).replace('void', 'undefined');

			try {
				if(global) {
					$.globalEval(js);
				} else {
					exp = eval(js);
					return exp;
				}
			} catch(e) {
				console.error(e.message);
				console.groupCollapsed('↓↓↓↓↓ Error Code ↓↓↓↓↓');
				console.log(js);
				console.warn(String(e.stack).replace(new RegExp(location.origin, 'ig'), '~'));
				console.groupEnd('↓↓↓↓↓ Error Code ↓↓↓↓↓');
				//throw e;
				return true;
			}
		},

		warn: function(msg) {
			if(window.console && console.warn) {
				console.warn('AlmightJS warning: ' + msg);
			}
		},

		error: function() {
			// エラーコードが辞書にあった場合は置き換え
			var args = Array.prototype.slice.call(arguments);
			var msg = args.shift();
			var lang = this.lang[this.nowlang] || 'en' || 'ja';
			if(msg in Almight.i18n[lang]) {
				msg = Almight.i18n[lang][msg];
				msg = msg.replace(/\{(\d+)\}/g, function() {
					return args[arguments[1]] || '';
				});
			}

			// 画面にエラー表示を追加
			if($('.almight-error').length === 0) {
				$('body').append('<div class="almight-error"><span>' +Almight.i18n[lang].onError+ '</span></div>');
				// 強制的に続行
				$('.almight-error a').on('click', function(){
					$('.almight-error').fadeOut('fast', function(){
						$(this).remove();
						try {
							almight.script.dequeue();
						} catch(e) {}
					});
				});
			}

			// エラーを投げる
			throw new Error(msg);
		}
	};

	// 言語設定
	Almight.i18n = {
		ja: {
			'onError': 'エラーが発生しました<br/>ゲームを再起動しても直らない場合はお問い合せください<br/><a href="#">強制的に続行する</a>',
			'containerNotFound': 'コンテナは1つだけ指定してください',
			'tagNotFound': '[{0}] タグが見つかりません'
		}
	};

	Almight.Platform = {
		/**
		 * タッチデバイスかどうか
		 * （クリックイベントとタッチイベントを判断する際にはこれを利用します）
		 */
		touch: (function() {
			if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
				return true;
			} else {
				return false;
			}
		})(),

		/**
		 * モバイルデバイスかどうか
		 * （スペック関連で機能を切り替える際にはこれを利用します）
		 */
		mobile: (function(){
			if(navigator.userAgent.match(/iphone|ipod|ipad|android/i)) {
				return true;
			} else {
				return false;
			}
		})(),

		/**
		 * Almight Viewerかどうか
		 */
		viewer: (function(){
			if(typeof Titanium === 'object') {
				return true;
			} else {
				return false;
			}
		})(),

		/**
		 * WebAudio APIが使用可能か
		 */
		webAudio: (function(){
			return (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined' ? true : false);
		})()
	};

	// ユーティリティ関数
	Almight.Util = {
		/**
		 * ファイル名から、ファイルパスを返します
		 * @method getPath
		 * @params {String} ファイル名 または ファイルパス
		 * @return {String} ファイルパス
		 */
		getPath: function(path) {
			if(path === undefined) return '';

			path = String(path).toLowerCase();
			var filename = path.replace(/\.([a-zA-Z0-9\_\-]+)$/, '');
			var ext = path.match(/\.([a-zA-Z0-9\_\-]+)$/);

			if(path.indexOf(Almight.resourcePath) === 0) {
				return path;
			}

			if(path.indexOf('/') !== -1) {
				return Almight.resourcePath + path;
			}

			if(Almight.filePath !== null && path in Almight.filePath) {
				// filepathファイルから検索
				return Almight.resourcePath + Almight.filePath[path];
			}

			if(Almight.filePath !== null && filename in Almight.filePath) {
				// filenameから検索
				return Almight.resourcePath + Almight.filePath[filename];
			}

			// 拡張子フォルダから検索
			if(Almight.filePath !== null || ext === null) {
				return Almight.resourcePath + path;
			} else {
				return Almight.resourcePath + ext[1] +'/'+ path;
			}
		},

		/**
		* **カラーコードのRGBA変換**
		*
		* カラーコードをrgba形式にして返します
		*
		* @method rgba
		* @params {String} color \#000, #000000, 0x000000 形式の色コード
		* @params {Number} [opacity] 不透明度
		* @return {String} rgba(0,0,0,1) 形式の色コード
		*/
		rgba: function(color, opacity) {
			if(color === undefined) return '';
			if(opacity === undefined) opacity = 1;

			// 0xから始まるコード
			if(/^0x/.test(color)) {
				color = color.replace(/^0x/, '');
				color = color.split('');
			}

			// #から始まるコード
			if(/^#/.test(color)) {
				color = color.replace(/^#/, '');
				color = color.split('');
			}

			// 色コードが省略形なら展開
			if(color.length === 3) {
				color = {
					'r': parseInt(color[0]+color[0], 16),
					'g': parseInt(color[1]+color[1], 16),
					'b': parseInt(color[2]+color[2], 16)
				};
			} else {
				color = {
					'r': parseInt(color[0]+color[1], 16),
					'g': parseInt(color[2]+color[3], 16),
					'b': parseInt(color[4]+color[5], 16)
				};
			}

			return 'rgba('+color.r+', '+color.g+', '+color.b+', '+opacity+')';
		}
	};
})(window);

// ===== KAG function =====

function int(num) {
	return parseInt(num, 10);
}

function intrandom(min, max) {
	max = (max === undefined ? 0 : max);
	if(min > max) {
		max = min;
		min = 0;
	}
	return parseInt((Math.random() * (max-min+1)) + min, 10);
}

/*
スマートフォンブラウザで開いた時に、アドレスバーを非表示にする

The hideAddressBar
http://blog.phantom4.org/archives/90
*/

(function () {
	var RETRY_INTERVAL= 500,
		defaultInnerHeight,
		timer = 0,
		retryCount = 0;

	/**
	 * スマートフォンのアドレスバーを非表示にする
	 */
	function hideAddressBar () {
		defaultInnerHeight = window.innerHeight;
		document.body.style.minHeight = '3000px'; //ダミーの高さを設定
		retryCount = 0;

		setTimeout(function () {
			setbodyHeight();
			if(timer) {
				clearInterval(timer);
			}
			timer = setInterval(setbodyHeight, RETRY_INTERVAL);
		}, 100);
	}

	/**
	 * アドレスバーの非表示
	 */
	function setbodyHeight () {
		window.scrollTo(0, 1); //アドレスバーを隠す

		setTimeout(function () {
			var scrollTop = document.body.scrollTop;
			if(scrollTop > 0 || window.innerHeight > defaultInnerHeight) {
				document.body.style.minHeight = window.innerHeight + 'px';
				clearInterval(timer);
				timer = null;
			}
		}, 0);
	}

	if(window.addEventListener && navigator.userAgent.match(/iphone|ipod|android/i)) {
		window.addEventListener('load', hideAddressBar);
		window.addEventListener('orientationchange', hideAddressBar);
	}
}());



/**
 * jQuery outerHTML
 * By Eric Elliott
 * http://ericleads.com/
 * 
 * Copyright (c) Eric Elliott 2012
 * MIT License
 * Adds outerHTML support to jQuery.
 */

(function($) {
	'use strict';
	var ns = 'outerHTML';
	if (!$.fn[ns]) {
		$.fn[ns] = function outerHTML(replacement) {
				var $this = $(this),
					content;
				if($this.length <= 0) return false;
				// Replace is already baked into jQuery
				// This is here for consistency with .html()
				if (replacement) {
					content = $this.replaceWith(replacement);
					// Fall back to native if it's supported
				} else if (typeof $this[0].outerHTML !== 'undefined') {
					content = $this[0].outerHTML;
					// Fake it 'till you make it!
				} else {
					// Don't use clone because of textarea bug?
					content = $this.wrap('<div>').parent().html();
					$this.unwrap();
				}
				return content;
		};
	}
}(jQuery)); 

(function(){
'use strict';


/**
* プラグインを管理します
*
* @class Plugin
*/

	Almight.Plugin = function() {
		// コンストラクタを実行
		return this.initialize.apply(this, arguments);
	};

	Almight.Plugin.prototype = {
		initialize: function(src) {
			var self = this;
			var df = $.Deferred();


			$.ajax({
				url: 'plugin/' + src,
				type: 'GET',
				dataType: 'text'

			}).done(function(data){

				if(/\.js$/.test(src)) {
					// JavaScriptファイルの場合
					$.globalEval(data);

					// コールバック
					df.resolve();

				} else {
					// HTMLテンプレートの場合
					$.each($.parseHTML(data, true), function(i){
						// data-append属性の要素を探す
						var elem = [];

						if($(this).is('[data-append="yes"]')) {
							elem = $(this);
						} else {
							if($(this).find('[data-append="yes"]:first').length !== 0) {
								elem = $(this).find('[data-append="yes"]:first');
							}
						}

						// タグ別に処理を分ける
						if(elem.length === 1) {
							var type = elem.prop('tagName').toLowerCase();

							switch(type) {
							case 'style':
								$(self).queue('addStyle', function(){
									$('head').append(elem);
									$(self).dequeue('addStyle');
								});
							break;

							case 'script':
								$(self).queue('addScript', function(){
									$.globalEval(elem.text());
									$(self).dequeue('addScript');
								});
							break;

							default:
								$(self).queue('addDom', function(){
									var selector;

									// モバイル環境ならdata-mobile-selectorから、それ以外ならdata-selectorからDOMの追加先を決定
									// 指定されていない場合はbodyに追加
									selector = $(elem).attr('data-selector');

									if(Almight.Platform.mobile && $(elem).attr('data-mobile-selector') !== undefined) {
										selector = $(elem).attr('data-mobile-selector');
									}

									if(selector === undefined) selector = 'body';

									$(selector).append(elem);
									$(self).dequeue('addDom');
								});
							break;
							}
						}
					});

					// style追加、dom追加、script実行の順で処理
					$(self).dequeue('addStyle').dequeue('addDom').dequeue('addScript');

					// コールバック
					df.resolve();
				}

			}).fail(function(xhr, status, error){
				df.reject(error);
			});

			return df.promise();
		}
	};
})();

(function(){
'use strict';

/**
* ゲーム画面を描画するステージを生成します
*
* @class Stage
*/

	/**
	 * Stage Classのコンストラクタ。
	 * ステージには複数のレイヤーを配置出来ます。
	 * @constructor
	 * @param {Object} config
	 * @param {Number} config.width ステージの横幅
	 * @param {Number} config.height ステージの縦幅
	 * @param {String|DomElement} config.container コンテナのidか、DOM Element
	 */
	Almight.Stage = function() {
		this.container = '';
		this.width =  1136;
		this.height = 640;
		this.stageWidth =  1136;
		this.stageHeight = 640;
		this.stageTop = 0;
		this.stageLeft = 0;

		this.zoomRatio = 1;
		this.pixelRatio = 1;

		this.stageZoom = false;

		// トランジションパラメータ
		this.trans = {};
		this.transElement = null;
		this.transitioning = false;

		// locateパラメータ
		this.locate = {
			x: 0,
			y: 0
		};

		this.element = null;
		this.backElement = null;
		this.back = {
			base: null,
			layers: [],
			messages: []
		};
		this.fore = {
			base: null,
			layers: [],
			messages: []
		};

		// カレントメッセージレイヤー
		this.current = null;
		this.currentNum = 0;
		this.currentPage = 'fore';

		this.canClick = true; // クリックを可能にするかどうか
		this.clickWaiting = false; // クリック待ちか
		this.textAnimating = false; // 文字表示アニメーション中か
		this.skipping = false; // スキップ実行中か
		this.skipTimer = null; // スキップ実行中のタイマー
		this.autoMode = false; // オートモード実行中か
		this.autoDelay = 1000; // オートモードの遅延時間

		// メッセージ履歴
		this.historyOutput = true; // メッセージ履歴に文字を出力するか
		this.historyEnabled = true; // メッセージ履歴を表示できるか

		// コンストラクタを実行
		this.initialize.apply(this, arguments);
	};

	Almight.Stage.prototype = {
		initialize: function(container, width, height) {
			var contaienr = container;
			this.width = width;
			this.height = height;
			this.stageWidth = width;
			this.stageHeight = height;

			// コンテナが存在するかチェック
			this.container = $('#' + container);
			if(this.container.length !== 1) {
				Almight.error('containerNotFound');

			} else {
				this.container = this.container[0];
			}

			// pixelRatioを計算
			var canvas = document.createElement('canvas'),
				context = canvas.getContext('2d'),
				devicePixelRatio = window.devicePixelRatio || 1, backingStoreRatio = context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || context.backingStorePixelRatio || 1,
				_pixelRatio = devicePixelRatio / backingStoreRatio;
			canvas = null;
			context = null;

			// NOTE: pixelRatioの値を小さくすると、トランジションの画質が荒くなりスムーズになる
			this.pixelRatio = _pixelRatio;

			// バックステージを追加
			this.backElement = $('<div/>')
			.attr({
				id: container + '-back-stage',
				class: 'almight-back-stage'
			})
			.css({
				width: this.width,
				height: this.height
			}).appendTo(this.container)[0];

			// ステージを追加
			this.element = $('<div/>')
			.attr({
				id: container + '-stage',
				class: 'almight-stage'
			})
			.css({
				width: this.width,
				height: this.height
			}).appendTo(this.container)[0];

			// トランジションステージを追加
			this.transElement = $('<div/>')
			.attr({
				id: container + '-trans-stage',
				class: 'almight-trans-stage'
			})
			.css({
				width: this.width,
				height: this.height
			}).appendTo(this.container)[0];

			// クリック待ちなど、ステージイベントの設定
			this._stageEventSetting();
		},

		/**
		 * ステージで発生するイベントを発火する設定
		 * @method _stageEventSetting
		 */
		_stageEventSetting: function() {
			// タッチデバイスなら
			if(Almight.Platform.touch) {
				$([this.element, this.transElement]).on({
					// ステージがタップされた時に
					tap: function() {
						$(Almight).triggerHandler('stageclick');
					},

					// touchmove無効化
					touchmove: function() {
						event.preventDefault();
						// NOTE: return falseだとバブリングまで止まってしまう
					}
				});

				// スワイプの設定
				var swipeOptions = {
					// 下にスワイプ操作した時メッセージレイヤーを非表示にする
					// direction:操作した方向　"up", "down", "left " , "right"の4方向.
					// distance:距離を取得できます。
					swipeDown: function(event,direction,distance){
						$(Almight).one('stageclick', function(){
							$(almight.stage.element).find('.almight-message-layer').animate({
								top: '-='+almight.config.height
							},
							{
								duration: "fast",
								easing: "linear",
								complete: function(){
									self.almight.stage.canClick = true;
								}
							});
						});

						almight.stage.canClick = false;

						$(almight.stage.element).find('.almight-message-layer').animate(
							{top: '+='+almight.config.height},
							{duration: "fast", easing: "linear"}
						);
					},
					//指定したピクセル以上、スワイプ操作をしないとコールバックされません
					threshold:50,
				};
				$(".almight-stage").swipe(swipeOptions);

			} else {
			// タッチデバイスでないなら
				$([this.element, this.transElement]).on({
					// ステージがクリックされた時に
					click: function() {
						$(Almight).triggerHandler('stageclick');
					},

					mousewheel: function(event, delta, deltaX, deltaY){
						if(deltaY < 0) {
							$(Almight).triggerHandler('stageclick');
						}
						if(almight.stage.canClick) {
							return false;
						}
					}
				});

				// キーボード操作
				$(window).on({
					keydown: function(e) {
						// Enter
						if(e.keyCode === 13 || e.keyCode === 32) {
							$(Almight).triggerHandler('stageclick');
						}
					},
					mousewheel: function() {
						if(almight.stage.canClick) {
							return false;
						}
					}
				});
			}
		},

		/**
		 * ステージにレイヤーを追加します
		 * @method add
		 * @params {Object} layer AlmightLayer
		 * @params {String} page "fore", "back"
		 * @params {Number/String} type [0-9], "base", "message[0-9]"
		 * @return {String} AlmightLayer
		 */
		add: function(layer, page, type) {
			page = (page === undefined ? 'fore' : page);
			layer.parent = this;

			if(type === 'base') {
				this[page].base = layer;

			} else if(typeof type === 'number') {
				this[page].layers[type] = layer;

			} else if(/^message[0-9]+$/.test(type)){
				type = Number(type.replace('message', ''));
				this[page].messages[type] = layer;

			} else {
				Almight.error('引数が無効です');
			}

			if(page === 'fore') {
				$(this.element).append(layer.element);
			} else {
				$(this.backElement).append(layer.element);
			}

			return this;
		},

		/**
		 * ステージからレイヤーを削除します
		 * @method remove
		 * @params {String} page "fore", "back"
		 * @params {Number/String} type [0-9], "base", "message[0-9]"
		 * @return {String} AlmightLayer
		 */
		remove: function(page, type) {
			page = (page === undefined ? 'fore' : page);

			if(type === 'base') {
				$(this[page].base.element).remove();
				this[page].base.children = null;
				this[page].base = null;

			} else if(typeof type === 'number') {
				$(this[page].layers[type].element).remove();
				this[page].layers[type].children = null;
				this[page].layers.splice(type, 1);

			} else if(/^message[0-9]+$/.test(type)){
				type = Number(type.replace('message', ''));
				$(this[page].messages[type].element).remove();
				this[page].messages[type].children = null;
				this[page].messages.splice(type, 1);

			} else {
				Almight.error('引数が無効です');
			}
		},

		/**
		 * タグオブジェクトに指定されているpageとlayer属性から、
		 * 該当するレイヤーを返します
		 * @method getLayerFromParams
		 * @params {Object} タグオブジェクト
		 * @return {String} AlmightLayer
		 */
		getLayerFromParams: function(params) {
			if(params.layer === undefined) Almight.error('layer属性がありません');

			// baseを取得
			var base = (params.page === 'back') ? this.back : this.fore;
			var layer;

			// baseレイヤーを返す
			if(params.layer === 'base') return base.base;

			// カレントメッセージレイヤーを返す
			if(params.layer === 'message') return this.current;

			// メッセージレイヤーを返す
			if(/^message[0-9]+$/.test(params.layer)) {
				return base.messages[Number(params.layer.replace('message', ''))];
			}

			// 前景レイヤーを返す
			return base.layers[Number(params.layer)];
		},

		/**
		 * タグオブジェクトに指定されているlayer属性から、
		 * 指定されたページの該当するレイヤーを返します
		 * params.layerがundefinedの場合はbaseレイヤーを返します
		 * @method getLayerPageFromParams
		 * @params {Object} タグオブジェクト
		 * @params {String} "fore" / "back"
		 * @return {String} AlmightLayer
		 */
		getLayerPageFromParams: function(params, page) {
			if(params.layer === undefined) Almight.error('layer属性がありません');

			// baseを取得
			var base = (page === 'back') ? this.back : this.fore;
			var layer;

			// baseレイヤーを返す
			if(params.layer === 'base' || params.layer === undefined) return base.base;

			// メッセージレイヤーを返す
			if(/^message[0-9]+$/.test(params.layer)) {
				return base.messages[Number(params.layer.replace('message', ''))];
			}

			// 前景レイヤーを返す
			return base.layers[Number(params.layer)];
		},

		/**
		 * タグオブジェクトに指定されているpageとlayer属性から、
		 * 指定されたページの該当するメッセージレイヤーを返します
		 * @method getMessageLayerObjectFromParams
		 * @params {Object} タグオブジェクト
		 * @return {String} AlmightLayer
		 */
		getMessageLayerObjectFromParams: function(params) {
			var page = params.page;
			var layer = params.layer;
			var base;

			// 両方指定されていない場合はカレントメッセージレイヤーを返す
			if(page === undefined && layer === undefined) {
				return this.current;
			}

			// page属性が指定されていない場合はcurrentPage
			if(page === undefined) {
				base = this[this.currentPage];
			} else {
				base = (page === 'back') ? this.back : this.fore;
			}

			// layer属性が指定されていない、または"message"の場合はcurrentNum
			if(layer === undefined || layer === 'message') {
				return base.messages[this.currentNum];
			}

			// メッセージレイヤーを返す
			if(/^message[0-9]+$/.test(params.layer)) {
				return base.messages[Number(params.layer.replace('message', ''))];

			} else {
				Almight.error('layer属性に指定できない値です');
			}
		},

		/**
		 * カレントメッセージレイヤーを設定する
		 * @method setCurrentMessageLayer
		 * @param {Object} params
		 * @param {String} params.page "fore", "back"
		 * @param {String} params.layer "message[0-9]+"
		 */
		setCurrentMessageLayer: function(params) {
			this.currentPage = (params.page === 'back') ? 'back' : 'fore';
			this.currentNum = (/^message[0-9]+$/.test(params.layer) ? Number(params.layer.replace('message', '')) : this.currentNum);
			this.current = this[this.currentPage].messages[this.currentNum];
		},

		/**
		 * ウィンドウリサイズ時の処理
		 * window.resizeにaddEventListenerする
		 * @method resizeStage
		 */
		resizeStage: function() {
			// ウィンドウサイズを取得
			var width = window.innerWidth ? window.innerWidth : $(window).width(),
			height = window.innerHeight ? window.innerHeight : $(window).height();

			// ズーム率を計算
			var zoomWidth = width / this.width,
			zoomHeight = height / this.height;

			// 比率が小さい方を計算式に利用
			var ratio = zoomWidth > zoomHeight ? zoomHeight : zoomWidth;

			if(ratio > 1) ratio = 1;

			if(this.stageZoom === false && !Almight.Platform.mobile) ratio = 1;

			this.stageWidth = ~~(ratio * this.width);
			this.stageHeight = ~~(ratio * this.height);
			this.stageTop = ~~((height / 2) - (this.stageHeight / 2));
			this.stageLeft = ~~((width / 2) - (this.stageWidth / 2));
			this.zoomRatio = ratio;

			if(this.stageZoom === false) {
				this.stageTop = this.stageTop < 0 ? 0 : this.stageTop;
				this.stageLeft = this.stageLeft < 0 ? 0 : this.stageLeft;
			}

			// センタリング用座標を計算
			$(this.container).css({
				'left': this.stageLeft,
				'top': this.stageTop,
				width: this.stageWidth,
				height: this.stageHeight
			});

			if(this.zoomRatio !== 1) $([this.backElement, this.element, this.transElement]).css('zoom', this.zoomRatio);
			else $([this.backElement, this.element, this.transElement]).css('zoom', '');
		},

		/**
		 * スキップモードの設定を行う
		 * @method setSkipmode
		 * @params {Boolean} skip スキップモードのオン・オフ。デフォルトでtrue
		 * @params {Mumber} time スキップ速度をmsで設定。デフォルトで100
		 * @params {Boolean} release 入力で解除するか。デフォルトでtrue
		 */
		setSkipmode: function(skip, time, release) {
			skip = (typeof skip === 'boolean' ? skip : true);
			time = (typeof time === 'number' ? time : 100);
			release = (typeof release === 'boolean' ? release : true);

			// すでにスキップモード中ならキャンセル
			if(this.skipping && skip) {
				return false;
			}

			if(!skip) {
				clearInterval(this.skipTimer);
				this.skipping = false;
				$(Almight).off('.skiprelease');
			} else {
				if(release) {
					var self = this;
					// クリックでスキップを解除する
					$(Almight).off('.skiprelease').on('stageclick.skiprelease', function(e, data) {
						if(data === undefined) {
							$(Almight).off('.skiprelease');
							clearInterval(self.skipTimer);
							self.skipping = false;
						}
					});
				}

				this.skipping = true;

				this.skipTimer = setInterval(function(){
					$(Almight).triggerHandler('stageclick', 'skip');
				}, time);
			}
		},

		/**
		 * スキップモードの設定をトグルする
		 * @method toggleSkipmode
		 * @params {Mumber} time スキップ速度をmsで設定。デフォルトで100
		 * @params {Boolean} release 入力で解除するか。デフォルトでtrue
		 */
		toggleSkipmode: function(time, release) {
			if(this.skipping) {
				this.setSkipmode(false, time, release);
			} else {
				this.setSkipmode(true, time, release);
			}
		},

		/**
		 * オートモードの設定を行う
		 * @method setAutomode
		 * @params {Boolean} auto オートモードのオン・オフ。デフォルトでtrue
		 * @params {Mumber} delay 遅延速度をmsで設定。デフォルトで1000
		 * @params {Boolean} release 入力で解除するか。デフォルトでtrue
		 */
		setAutomode: function(auto, delay, release) {
			auto = (typeof auto === 'boolean' ? auto : true);
			delay = (typeof delay === 'number' ? delay : 1000);
			release = (typeof release === 'boolean' ? release : true);

			// すでにオートモード中ならキャンセル
			if(this.autoMode && auto) {
				return false;
			}

			if(!auto) {
				$(Almight).off('.autorelease');
				this.autoMode = false;
			} else {
				if(release) {
					var self = this;
					// クリックでスキップを解除する
					$(Almight).off('.autorelease').on('stageclick.autorelease', function(e, data) {
						if(data === undefined) {
							$(Almight).off('.autorelease');
							self.autoMode = false;
						}
					});
				}

				this.autoMode = true;
				this.autoDelay = delay;

				$(Almight).on('autoclick.autorelease', function(){
					$(Almight).triggerHandler('stageclick', 'auto');
				});

				setTimeout(function(){
					$(Almight).triggerHandler('stageclick', 'auto');
				}, 1000);
			}
		},

		/**
		 * オートモードの設定をトグルする
		 * @method toggleAutomode
		 * @params {Mumber} delay 遅延速度をmsで設定。デフォルトで1000
		 * @params {Boolean} release 入力で解除するか。デフォルトでtrue
		 */
		toggleAutomode: function(delay, release) {
			if(this.autoMode) {
				this.setAutomode(false, delay, release);
			} else {
				this.setAutomode(true, delay, release);
			}
		},

		/**
		 * すべてのレイヤーを指定されたページ側に向かってコピーする
		 * @method layerCopy
		 * @params {String} page "fore"を指定すると、裏から表へ。"back"を指定すると、表から裏へレイヤーをコピーする
		 */
		layerCopy: function(page) {
			page = (page === undefined ? 'fore' : page);
			var origin = (page === 'fore' ? 'back' : 'fore');
			var i = 0;

			// ベースレイヤーをコピー
			this.layerCopyTo(this[origin].base, this[page].base, page, 1);

			// 前景レイヤーをコピー
			for(i=0;i<this.fore.layers.length;i++) {
				this.layerCopyTo(this[origin].layers[i], this[page].layers[i], page, 10 + i);
			}

			// メッセージレイヤーをコピー
			for(i=0;i<this.fore.messages.length;i++) {
				this.layerCopyTo(this[origin].messages[i], this[page].messages[i], page, 100 + i);
			}

			// リンク機能のあるものがトランスしたら、リンクを有効にする。
			almight.buttonsEvent();
		},

		/**
		 * 指定されたレイヤーをコピーする
		 * @method layerCopyTo
		 * @params {AlmightLayer} origin コピー元となるAlmightLayer
		 * @params {AlmightLayer} to コピー先となるAlmightLayer
		 * @params {String} page コピー先となるページを "fore"か"back"で指定
		 */
		layerCopyTo: function(origin, to, page, zIndex) {
			if(page === 'fore') page = this.element;
			else page = this.backElement;

			// レイヤーの子要素をクローン
			var children = [];
			for(var i=0;i<origin.children.length;i++) {
				children.push($(origin.children[i]).clone()[0]);
				// NOTE: childrenにはdata属性でx, yを指定しているためコピーする
				$(children[i]).data($.extend(true, {}, $(origin.children[i]).data()));
			}

			to.children = children;
			to.parent = origin.parent;
			to.prop = $.extend(true, {}, origin.prop);
			$(to.element).remove();
			to.element = $(origin.element).clone().appendTo(page)[0];
			// $(to.element).css('z-index', zIndex);

			// メッセージレイヤーなら要素を再セット
			if(origin.type === 'message') {
				to.bgElement = $(to.element).find('.almight-layer-msgbg')[0];
				to.msgElement = $(to.element).find('.almight-layer-message')[0];
				to.lineLayer = $(to.element).find('.almight-layer-line:last')[0];
			}
		},

		// ステージをcanvas化
		toCanvas: function(page) {
			var p = page;
			if(page === 'fore') page = this.element;
			else page = this.backElement;

			var df = $.Deferred();
			var self = this;
			// console.time('createCanvas - '+p);

			// html2canvasを利用してステージをcanvas化
			html2canvas(page, {
				// background: '#000',
				width: this.width*2,
				height: this.height*2,
				onrendered: function(stage) {
					// 取得したスクリーンショットを縮小
					var canvas = $('<canvas/>').attr({
						width: self.width,
						height: self.height
					}).css({
						width: self.width,
						height: self.height
					})[0];

					var context = canvas.getContext('2d');

					// 黒で塗りつぶし
					context.fillStyle = '#000000';
					context.fillRect(0, 0, self.width, self.height);

					context.drawImage(stage, 0, 0, self.width, self.height);
					// console.timeEnd('createCanvas - ' + p);

					df.resolve(canvas);
				}
			});

			return df.promise();
		},

		beginTransition: function(params) {
			// 念のためタイマーを停止
			clearInterval(this.trans.timer);

			this.trans = {
				df: $.Deferred(),
				dfwt: $.Deferred(),
				rule: null,
				stime: 0,
				timer: null,
				usecross: false,
				forectx: null,
				backelem: null,
				x: 0,
				duration: 300
			};

			this.transitioning = true;

			var self = this;

			// ユニバーサルトランジションならルール画像をロード
			if(params.method === 'universal') {
				var storage = params.rule;

				var imageLoader = $('<img/>').on({
					// ルール画像をロード完了
					'load': function() {
						self.trans.rule = this;
						self.readyTransition(params);
					},

					// ルール画像のロード失敗
					'error': function(e) {
						self.trans.df.reject(e);
					}

				// ルール画像をロード開始
				}).attr('src', storage);

			// クロスフェードなら
			} else if(params.method === 'crossfade' || params.method === undefined){
				this.trans.usecross = true;
				this.readyTransition(params);
			}

			return this.trans.df.promise();
		},

		readyTransition: function (params) {
			var self = this;

			// ステージを取得してバッファに描画
			$.when(this.toCanvas('fore'), this.toCanvas('back')).done(function(fore, back){

				self.trans.forectx = fore;
				self.trans.backelem = back;

				// トランジションルールを設定
				if(self.trans.usecross) {
					self.trans.rule = null;
					$(self.trans.backelem).css('z-index', 1);
					$(self.transElement).append(self.trans.backelem).show();
				} else {
					// self.trans.rule = new Almight.Rule(self.trans.rule, self.stageWidth * self.pixelRatio, self.stageHeight * self.pixelRatio);
					self.trans.rule = new Almight.Rule(self.trans.rule, self.width, self.height);
				}

				self.trans.duration = params.time * 1.3;

				// トランジション用canvasを追加
				$(self.transElement).append(self.trans.forectx).show();

				// バックステージを表にクローン
				self.layerCopy('fore');
				self.trans.stime = (+new Date());
				self.trans.x = 0;

				// $(self.element).css('scale', 0.5);

				if(self.trans.usecross) {
					// CSS3トランジション実行
					$(self.trans.forectx).transition({
						duration: self.trans.duration,
						opacity: 0,
						easing: 'linear',
						complete: function(){
							// alert('cp');
							self.onTransitionCompleted();
						}
					});
				} else {
					// ユニバーサルトランジション実行
					self.trans.forectx = self.trans.forectx.getContext('2d');
					self.trans.timer = setInterval(function() {
						self.applyTransition();
					}, 1000 / 30);
				}

				// console.time('TRANS実時間');

				// Transタグ処理完了
				setTimeout(function(){
					self.trans.df.resolve();
				}, 0);
			});
		},

		// トランジション中
		applyTransition: function() {
			// クロスフェードするかルール画像を使うか
			if(this.trans.usecross) this.crossfade(this.trans.forectx, this.trans.x);
			else this.trans.rule.applyRule(this.trans.forectx, this.trans.x);

			this.trans.forectx.globalCompositeOperation = 'destination-over';
			this.trans.forectx.drawImage(this.trans.backelem, 0, 0);
			this.trans.x = (+new Date() - this.trans.stime) / this.trans.duration;

			if(this.trans.x >= 0.75) {
				this.onTransitionCompleted();
			}
		},

		// トランジション完了
		onTransitionCompleted: function() {
			var self = this;

			if(!this.transitioning) {
				return false;
			}

			this.transitioning = false;

			// $(this.element).css('scale', 1);

			// $(self.transElement).hide();
			// $('#almight-container-stage').css('z-index', 1000);

			if(self.trans.usecross) {
				$(this.trans.forectx).transitionStop(true, true);
			} else {
				// インターバルを停止
				clearInterval(this.trans.timer);
			}

			// console.timeEnd('TRANS実時間');

			// トランジションレイヤーを削除
			/*
			$(this.transElement).fadeOut(100, function(){
				$(this).empty();

				setTimeout(function(){
					// トランジション完了をresolve
					self.trans.dfwt.resolve();
				}, 0);
			});
			*/

			this.trans.forectx = null;
			this.trans.backelem = null;

			$(this.transElement).hide().empty();

			setTimeout(function(){
				self.trans.dfwt.resolve();
			}, 50);
		},

		// クロスフェード
		crossfade: function(ctx, ratio) {
			// xorでアルファ適用
			ctx.globalCompositeOperation = 'xor';
			ctx.fillStyle = 'rgba(0, 0, 0, ' + ratio / 3 + ')';
			ctx.fillRect(0, 0, this.stageWidth * this.pixelRatio, this.stageHeight * this.pixelRatio);
		}
	};
})();

(function(){

	/**
	 * サウンドの管理を行います
	 *
	 * @class Sound
	 */

	Almight.Sound = function() {
		this.type = 'bgm';
		this.method = 'typeAudio';
		this.element = null; // DOM Element

		this.src = ''; // 音声ファイル名
		this.playing = false; // 再生中か
		this.fading = false; // フェード中か
		this.loop = false; // ループ再生するか
		this._loop = false; // ループデフォルト値
		this.mute = false; // ミュート状態か
		this.volume = 1; // ボリューム
		this.gvolume = 1; // グローバルボリューム（ユーザーが設定できるボリューム）

		// コンストラクタを実行
		this.initialize.apply(this, arguments);
	};

	Almight.Sound.prototype = {
		initialize: function(type) {
			this.type = type;

			// BGMならデフォルトでループする
			if(type === 'bgm') {
				this._loop = true;
				//this.volume = 0.5;
			}

			// 音量を復元
			if(window.sf['alm_' +type+ 'vol'] >= 0 && window.sf['alm_' +type+ 'vol'] <= 1) {
				this.gvolume = window.sf['alm_' +type+ 'vol'];
			} else {
				window.sf['alm_' +type+ 'vol'] = this.gvolume;
			}

			// 再生ロジックに何を利用するか（typeAudio, typeViewer）
			if(Almight.Platform.viewer) {
				this.method = 'typeViewer';
			} else {
				this.method = 'typeAudio';
			}

			this[this.method].initialize.apply(this, arguments);
		},

		/**
		* **サウンドを再生する**
		*
		* サウンドを再生します
		* 再生開始されるとデキューされます
		*
		* @method setPlay
		* @param src {String} ファイルパス
		* @param [loop] {Boolean} ループするか。省略するとfalse
		*/
		setPlay: function() {
			return this[this.method].play.apply(this, arguments);
		},

		// ポーズ
		setPause: function() {
			this[this.method].pause.apply(this, arguments);
		},

		// ストップ
		setStop: function() {
			this[this.method].stop.apply(this, arguments);
		},

		// ミュートのトグル
		toggleMute: function() {
			this[this.method].mute.apply(this, arguments);
		},

		// ボリュームを指定します
		setVolume: function() {
			this[this.method].volume.apply(this, arguments);
		},

		// グローバルボリュームを指定します
		setGvolume: function(val) {
			if(val >= 0 && 1 >= val) {
				this.gvolume = val;
				window.sf['alm_' +this.type+ 'vol'] = val;
				this[this.method].volume.apply(this);
			}
		},

		// パラメータからオプションを設定します
		setOptions: function(params) {
			if(typeof params.volume === 'number') this[this.method].volume.call(this, params.volume);
			if(typeof params.gvolume === 'number') this.setGvolume(params.gvolume);
		},

		/**
		* **サウンドをフェード処理する**
		*
		* fromからtoまでtimeミリ秒でフェードします
		* どちらか片方にnullを指定すると、現在の音量とみなします
		*
		* @method fadeTo
		* @param from {Number} フェードする前の音量 / null
		* @param to {Number} フェードする音量 / null
		* @param time {Number} フェードする時間をミリ秒で指定
		*/
		fadeTo: function() {
			return this[this.method].fade.apply(this, arguments);
		},

		// フェードをスキップ
		fadeSkip: function() {
			this[this.method].fadeskip.apply(this, arguments);
		},

		// ===== Audio タグ =====
		typeAudio: {
			// 初期化
			initialize: function() {
				var self = this;

				this.element = new Audio('');
				this.element.autoplay = false;
				this.element.volume = this.volume * this.gvolume;
				this.fade_element =  $.extend($('<div/>')[0], { volume: this.volume * this.gvolume });

				$(this.element).on('ended', function(){
					self.playing = false;
					$(self).triggerHandler('ended');
				});
			},

			// サウンド再生
			play: function(params) {
				var df = $.Deferred();
				var loop = (params.loop === undefined ? this._loop : params.loop);

				$(this.fade_element).stop(true, true);

				$(this.element).one('play', function(){
					$(this).off('error');
					df.resolve();
				});

				// .one('error', function(){
				// df.reject('BGMファイルの読み込みに失敗しました: ' + params.storage);
				// });

				this.loop = loop;
				this.src = params.storage;
				this.playing = true;

				this.element.load(); // 初期化

				// 再生
				this.element.loop = this.loop;
				this.element.src = this.src;

				this.element.play();

				return df.promise();
			},

			// ポーズ
			pause: function() {
				$(this.fade_element).stop(true, true);
				this.playing = false;
				this.element.pause();
			},

			// ストップ
			stop: function() {
				$(this.fade_element).stop(true, true);
				this.playing = false;
				try {
					this.element.pause();
				} catch(e){}
			},

			// ミュート
			mute: function() {
				this.mute = !this.mute;
				this.element.muted = this.mute;
			},

			// ボリューム
			volume: function(volume) {
				$(this.element).stop(true, true);
				if(volume === null || volume === undefined) volume = this.volume;
				this.volume = volume;
				this.fade_element.volume = volume * this.gvolume;
				this.element.volume = volume * this.gvolume;
			},

			// フェード
			fade: function(from, to, time) {
				var df = $.Deferred();
				var self = this;

				from = (typeof from !== 'number' ? this.volume * this.gvolume : from);
				to = (typeof to !== 'number' ? this.volume * this.gvolume : to);

				this.element.volume = from;
				this.fade_element.volume = from;

				this.fading = true;

				// フェードを行う
				$(this.fade_element).stop(true, true).animate({ volume: to }, {
					easing: 'linear',
					duration: time,
					step: function() {
						// stepを使ってvolumeを調整
						self.element.volume = this.volume;
					},
					complete: function() {
						self.element.volume = this.volume;
						self.fading = false;

						// 音量を戻す
						self.setVolume(null);

						df.resolve();
					}
				});

				return df.promise();
			},

			// フェードをスキップする
			fadeskip: function(){
				$(this.fade_element).stop(true, true);
			}
		},

		// ===== Viewer API =====
		typeViewer: {
			// 初期化
			initialize: function() {
				this.fade_element =  $.extend($('<div/>')[0], { volume: this.volume * this.gvolume });
				Titanium.App.fireEvent('createSound', { name: this.type });
				var self = this;
				setTimeout(function(){
					self.setVolume();
				}, 100);
			},

			play: function(params) {
				var df = $.Deferred();
				var loop = (params.loop === undefined ? this._loop : params.loop);

				$(this.fade_element).stop(true, true);

				this.loop = loop;
				this.src = params.storage;
				this.playing = true;

				Titanium.App.fireEvent('setPlaySound', {
					name: this.type,
					loop: this.loop,
					src: this.src
				});

				setTimeout(function(){
					df.resolve();
				}, 0);

				return df.promise();
			},

			// 再生終了後
			playend: function() {
				this.playing = false;
				$(this).triggerHandler('ended');
			},

			// ポーズ
			pause: function() {
				$(this.fade_element).stop(true, true);
				this.playing = false;
				Titanium.App.fireEvent('setStopSound', { name: this.type });
			},

			// ストップ
			stop: function() {
				$(this.fade_element).stop(true, true);
				this.playing = false;
				try {
					Titanium.App.fireEvent('setStopSound', { name: this.type });
				} catch(e){}
			},

			// ミュート
			mute: function() {
				this.mute = !this.mute;
				// TODO: mute対応
			},

			// ボリューム
			volume: function(volume) {
				if(volume === null || volume === undefined) volume = this.volume;
				this.volume = volume;
				this.fade_element.volume = volume * this.gvolume;
				Titanium.App.fireEvent('setVolumeSound', { name: this.type, volume: volume * this.gvolume });
			},

			// フェード
			fade: function(from, to, time) {
				var df = $.Deferred();
				var self = this;

				from = (typeof from !== 'number' ? this.volume * this.gvolume : from * this.gvolume);
				to = (typeof to !== 'number' ? this.volume * this.gvolume : to * this.gvolume);

				this.fade_element.volume = from;

				this.fading = true;

				// フェードを行う
				$(this.fade_element).stop(true, true).animate({ volume: to }, {
					easing: 'linear',
					duration: time,
					step: function() {
						// stepを使ってvolumeを調整
						Titanium.App.fireEvent('setVolumeSound', { name: self.type, volume: this.volume });
					},
					complete: function() {
						self.fading = false;

						// 音量を戻す
						self.setVolume(null);

						df.resolve();
					}
				});

				return df.promise();
			}
		}
	};
})();

(function(){
'use strict';

/**
* 標準レイヤーを生成します  
* 前景レイヤー、ベースレイヤーの裏表を担当します  
* 
* @class Layer
* @constructor
*/

	Almight.Layer = function() {
		this.type = 'layer';

		this.element = null; // DOM Element
		this.children = [];
		this.parent = null; // 親

		this.prop = {
			top: 0,
			left: 0,
			width: 1136,
			height: 640,
			opacity: 1,
			visible: false
		};

		this.initialize.apply(this, arguments);
	};

	Almight.Layer.prototype = {
		initialize: function(width, height, zIndex) {
			this.element = $('<div/>').addClass('almight-layer').css({
				width: width,
				height: height,
				top: 0,
				left: 0,
				// zIndex: zIndex
			})[0];

			this.prop.width = width;
			this.prop.height = height;
		},

		/**
		 * 画像を読み込みます
		 * @method loadImage
		 */
		loadImages: function(storage, freeimage, cls) {
			var df = $.Deferred();
			var self = this;
			var image = null;

			if(cls !== undefined) {
				image = $(this.element).find('.'+ cls);
				if(image.length === 0) image = null;
			}

			if(image === null) {
				image = $('<img/>');
			}

			image.addClass('almight-layer-image').on({
				'load': function() {
					// NOTE: ここでfreeimageしないと、一旦画像が削除されてから
					// 非同期で画像がロードされ挿入されるまでの間は画像が表示されていないのでチラつきとなる
					if(freeimage) self.freeImage();

					$(this).attr({
						width: this.width,
						height: this.height
					}).css({
						width: this.width,
						height: this.height
					}).data({
						type: 'image',
						storage: storage,
						dx: 0,
						dy: 0
					});

					if(cls !== undefined) $(this).addClass(cls);

					self.children.push(this);

					df.resolve(this);
				},

				'error': function(e) {
					df.reject(e);
				}

			// 読み込み開始
			}).attr('src', storage);

			return df.promise();
		},

		/**
		 * レイヤーをクリアします
		 * @method freeImage
		 */
		freeImage: function() {
			for(var i=0;i<this.children.length;i++) {
				if(this.children[i].tagName === 'IMG') {
					$(this.children[i]).attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
				}
				$(this.children[i]).remove();
				this.children[i] = null;
			}

			this.children = [];
			$(this.element).empty();

			return this;
		},

		/**
		 * パラメータに従ってレイヤーのオプションを設定
		 * @method setOptions
		 */
		setOptions: function(params) {
			if(params.visible !== undefined && this.type !== 'base') this.setVisible(params.visible);
			if(params.left !== undefined && this.type !== 'base') this.setLeft(params.left);
			if(params.top !== undefined && this.type !== 'base') this.setTop(params.top);
			if(params.opacity !== undefined) this.setOpacity(params.opacity / 255);

			//setOptions
		},

		/**
		 * レイヤーの左端位置を設定します
		 * @method setLeft
		 * @params {Number} 左端位置px
		 */
		setLeft: function(left) {
			this.prop.left = left;
			$(this.element).css('left', left);
		},

		/**
		 * レイヤーの左端位置を取得します
		 * @method getLeft
		 * @return {Number} 左端位置px
		 */
		getLeft: function() {
			return this.prop.left;
		},

		/**
		 * レイヤーの上端位置を設定します
		 * @method setTop
		 * @params {Number} 上端位置px
		 */
		setTop: function(top) {
			this.prop.top = top;
			$(this.element).css('top', top);
		},

		/**
		 * レイヤーの位置を設定します
		 * @method setPos
		 * @params {Number} left 左端位置px
		 * @params {Number} top 上端位置px
		 */
		setPos: function(left, top) {
			this.setLeft(left);
			this.setTop(top);
		},

		/**
		 * レイヤーの上端位置を取得します
		 * @method getTop
		 * @return {Number} 上端位置px
		 */
		getTop: function() {
			return this.prop.top;
		},

		/**
		 * レイヤーの横幅を設定します
		 * @method setWidth
		 * @params {Number} 横幅px
		 */
		setWidth: function(width) {
			this.prop.width = width;
			$(this.element).css('width', width);
		},

		/**
		 * レイヤーの左端位置を取得します
		 * @method getWidth
		 * @return {Number} 横幅px
		 */
		getWidth: function() {
			return this.prop.width;
		},

		/**
		 * レイヤーの縦幅を設定します　
		 * @method setHeight
		 * @params {Number} 縦幅px
		 */
		setHeight: function(height) {
			this.prop.height = height;
			$(this.element).css('height', height);
		},

		/**
		 * レイヤーの縦幅を取得します
		 * @method getHeight
		 * @return {Number} 縦幅px
		 */
		getHeight: function() {
			return this.prop.height;
		},

		/**
		 * レイヤーの不透明度を0から1の範囲で設定します
		 * @method setOpacity
		 * @params {Number} 0から1の範囲の小数
		 */
		setOpacity: function(opacity) {
			if(opacity >= 0 && 1 >= opacity) {
				this.prop.opacity = opacity;
				$(this.element).css('opacity', opacity);
			}
		},

		/**
		 * レイヤーの不透明度を取得します
		 * @method getOpacity
		 * @return {Number} 0から1の範囲の小数
		 */
		getOpacity: function() {
			return this.prop.opacity;
		},

		/**
		 * レイヤーの可視状態を設定します
		 * @method setVisible
		 * @params {Boolean} 可視状態
		 */
		setVisible: function(visible) {
			if(visible) {
				this.prop.visible = true;
				$(this.element).show();
			} else {
				this.prop.visible = false;
				$(this.element).hide();
			}
		},

		/**
		 * レイヤーの可視状態を取得します
		 * @method getVisible
		 * @return {Boolean} 可視状態
		 */
		getVisible: function() {
			return this.prop.visible;
		},

		/**
		 * レイヤーに読み込まれている画像ファイル名を取得します
		 * @method getStorage
		 * @params {Number} children番号
		 * @return {String} 画像ファイル名
		 */
		getStorage: function(num) {
			return this.children[num] === undefined ? undefined : this.children[num].src.match(/\/([^/]+)$/)[1];
		},

		/**
		 * レイヤーをアニメーションさせます
		 * @method animate
		 * @return {Object} jQuery Object
		 */
		animateQueue: function(params) {
			var self = this;
			params = $.extend(true, {}, params);

			$(this.element).queue('animate', function(){
				var x = self.prop.left;
				var y = self.prop.top;

				// パラメータを補正
				if(params.time !== undefined) params.duration = params.time;
				if(params.left !== undefined) params.x = params.left;
				if(params.top !== undefined) params.y = params.top;

				// 位置オプションを更新
				if(params.x !== undefined) self.prop.left = parseInt(params.x, 10);
				if(params.y !== undefined) self.prop.top = parseInt(params.y, 10);
				if(params.opacity !== undefined) self.prop.opacity = Number(params.opacity);

				// イージングを設定
				if(params.easing === undefined) params.easing = 'in-out';

				// xとyを補正
				if(params.x !== undefined) params.x -= x;
				if(params.y !== undefined) params.y -= y;

				// ブラウザバグ対策
				if(params.delay === undefined || params.delay <= 0 ) params.delay = 1;

				// 許可されたプロパティのみ通す
				var prop = ['easing', 'duration', 'x', 'y', 'opacity', 'translate', 'rotate', 'rotateX', 'rotateY', 'rotate3d', 'scale', 'perspective', 'skewX', 'skewY', 'delay'];
				for(var i in params) {
					if(prop.indexOf(i) === -1) delete params[i];
				}

				// アニメーション完了
				params.complete = function() {
					// transformをtop, leftに戻す
					if(params.x !== undefined) {
						$(self.element).css({
							x: 0,
							left: self.prop.left
						});
					}
					if(params.y !== undefined) {
						$(self.element).css({
							y: 0,
							top: self.prop.top
						});
					}

					// キューがあれば続行、なければイベントを発火
					var _self = this;
					setTimeout(function(){
						if($(_self).queue('animate').length === 0) {
							$(_self).triggerHandler('animateEnd');
						} else {
							$(_self).dequeue('animate');
						}
					}, 0);
				};

				// トランジションを実行
				$(self.element).transition(params);
			});

			return self;
		},

		animateStart: function() {
			$(this.element).dequeue('animate');
		},

		// レイヤー表示サイズを画像サイズに合わせる
		setSizeToImageSize: function() {
			// TODO: 子要素のimgから最大のものをレイヤーサイズにする
		},

		/**
		 * レイヤーを塗りつぶします
		 * @method fillRect
		 */
		fillRect: function(params) {
			var color, opacity, rgba;
			if(params.rgba === undefined) {
				color = (params.color === undefined ? '#ffffff' : params.color);
				opacity = (params.opacity === undefined ? 1 : (params.opacity / 255));
				rgba = Almight.Util.rgba(color, opacity);
			} else {
				rgba = params.rgba;
			}
			var top = (params.top === undefined ? 0 : params.top);
			var left = (params.left === undefined ? 0 : params.left);
			var width = (params.width === undefined ? 100 : params.width);
			var height = (params.height === undefined ? 100 : params.height);
			var zIndex = (params.zIndex === undefined ? this.children.length : params.zIndex);

			var div = $('<div/>').css({
				'position': 'absolute',
				'top': top,
				'left': left,
				'width': width,
				'height': height,
				'background-color': rgba,
				'z-index': zIndex
			}).data({
				type: 'fill',
				left: left,
				top: top,
				width: width,
				height: height,
				rgba: rgba,
				zIndex: zIndex
			});
			this.children.push(div);
			$(this.element).append(div);
		}
	};
})();

(function(){
'use strict';

/**
* 標準グラフィックレイヤーを生成します  
* 前景レイヤー、ベースレイヤーの裏表を担当します
*
* @class GraphicLayer
* @extends Layer
*/

	Almight.GraphicLayer = function(core) {
		// スーパークラスのコンストラクタを実行
		if(this._super === undefined) this._super = {};
		this._super = Almight.Layer;
		this._super.apply(this, arguments);
		this._super = this._super.prototype;
		this.graphicLayerInitialize.apply(this, arguments);
	};

	Almight.GraphicLayer.prototype = {
		graphicLayerInitialize: function(){
			// コンストラクタ
			this.type = 'graphic';
			//this.animLoadParams = {}; // 読み込み時に指定されたパラメータ
			//this.animPartialImageInfo = {}; // 追加画像読み込み情報
		},

		// loadImagesをオーバーライドする
		loadImages: function(params, freeimage) {
			var df = $.Deferred();
			var self = this;
			var storage = params.storage;
			var zIndex = (params.zIndex === undefined ? this.children.length : params.zIndex);
			if(freeimage) {
				zIndex = -1;
			}

			// パラメータが空ならレイヤーをクリア
			if($.isEmptyObject(params)) {
				this.freeImage();
				return true;
			}

			// パラメータを退避
			//this.animLoadParams = $.extend(true, {}, params);

			// アニメーション情報をクリアする
			//this.clearAnim();

			// 追加画像読み込み情報をクリア
			//this.animPartialImageInfo = null;

			// 画像を非同期で読み込む
			self._super.loadImages.call(self, storage, freeimage, params.id)

			// 画像の読み込みに成功
			.then(function(elem){
				// FIXME: 画像のクリッピングはここで行う

				// 位置
				if(self.type !== 'base') {
					if(params.pos !== undefined) {
						// pos属性から位置を決定
						if(params.pos in almight.config.position) {
							var left = almight.config.position[params.pos];
							left -= elem.naturalWidth / 2;
							self.setLeft(left);
							self.setTop(almight.config.height - elem.naturalHeight);

						} else {
							Almight.error('pos属性に指定されている位置情報が見つかりません');
						}
					} else {
						// left, topから位置を決定
						if(typeof params.left === 'number') self.setLeft(params.left);
						if(typeof params.top === 'number') self.setTop(params.top);
					}
				}

				// zIndexを設定
				$(elem).css('z-index', zIndex).data('zIndex', zIndex);

				// 可視状態
				if(typeof params.visible === 'boolean' && self.type !== 'base') self.setVisible(params.visible);

				// 不透明度
				if(typeof params.opacity === 'number') self.setOpacity(params.opacity / 255);


				// カラコレを行う
				self.applyColorCorrection(elem, params);

				// レイヤーに追加
				$(self.element).append(elem);

				// コールバックを実行
				df.resolve();

			},
			// 画像の読み込みに失敗
			function(e){
				df.reject('画像の読み込みに失敗しました: ' + storage);
			});

			return df.promise();
		},

		loadPartialImage: function(params) {
			// 部分追加読み込みを行う
			var df = $.Deferred();
			var self = this;
			var storage = params.storage;
			var zIndex = (params.zIndex === undefined ? this.children.length : params.zIndex);

			// 画像を非同期で読み込む
			self._super.loadImages.call(self, storage, params.key, params.id)

			// 画像の読み込みに成功
			.then(function(elem){
				var dx = typeof params.dx === 'number' ? params.dx : 0;
				var dy = typeof params.dy === 'number' ? params.dy : 0;

				// 不透明度
				if(typeof params.opacity === 'number') $(elem).css('opacity', params.opacity / 255);

				// 位置を指定
				$(elem).css({
					left: dx,
					top: dy,
					bottom: 'auto',
					zIndex: zIndex
				}).data({
					type: 'pimage',
					dx: dx,
					dy: dy,
					opacity: params.opacity,
					zIndex: zIndex
				});

				// レイヤーに追加
				$(self.element).append(elem);

				// コールバックを実行
				df.resolve();
			},
			// 画像の読み込みに失敗
			function(e){
				df.reject('画像の読み込みに失敗しました: ' + storage);
			});

			return df.promise();

		},

		// カラコレを行う
		applyColorCorrection: function(elem, params) {
			var filter = '';

			// グレースケールにする
			if(params.grayscale === true || (typeof params.grayscale === 'number' && params.grayscale >= 0 && params.grayscale <= 1)) {
				filter += ' grayscale(' + (params.grayscale === true ? 1 : params.grayscale) + ')';
			}

			// ブラーをかける
			if(typeof params.blur === 'number') {
				filter += ' blur(' +params.blur+ 'px)';
			}

			// シャドウをかける
			if(typeof params.shadow === 'string') {
				filter += ' drop-shadow(' +params.shadow+ ')';
			}

			if(filter !== '') {
				$(elem).css('-webkit-filter', filter);
			}
		},

		// レイヤーの情報をダンプ出力する
		dump: function(){
			var json = $.extend(true, {}, {
				prop: this.prop,
				children: []
			});

			for(var i=0;i<this.children.length;i++) {
				json.children[i] = $(this.children[i]).data();
			}

			return json;
		},

		// レイヤーの情報をリストアする
		restore: function(json){
			this.prop = $.extend(true, {}, json.prop);

			this.freeImage();

			for(var i=0;i<json.children.length;i++) {
				if(json.children[i].type === 'image') {
					this.loadImages(json.children[i]);
				}
				if(json.children[i].type === 'pimage') {
					this.loadPartialImage(json.children[i]);
				}
				if(json.children[i].type === 'fill') {
					this.fillRect(json.children[i]);
				}
			}

			this.setLeft(this.prop.left);
			this.setTop(this.prop.top);
			this.setWidth(this.prop.width);
			this.setHeight(this.prop.height);
			this.setVisible(this.prop.visible);
		}
	};

	// Almight.Layerクラスを継承する
	Almight.GraphicLayer.prototype = $.extend({}, Almight.Layer.prototype, Almight.GraphicLayer.prototype);
})();

(function(){
'use strict';

/**
* メッセージレイヤーを生成します  
* メッセージレイヤーの裏表を担当します  
* 
* @class MessageLayer
* @extends Layer
*/

	Almight.MessageLayer = function(core) {
		// スーパークラスのコンストラクタを実行
		if(this._super === undefined) this._super = {};
		this._super = Almight.Layer;
		this._super.apply(this, arguments);
		this._super = this._super.prototype;
		this.messageLayerInitialize.apply(this, arguments);
	};

	Almight.MessageLayer.prototype = {
		messageLayerInitialize: function(width, height, zIndex, config){
			this.type = 'message';

			$(this.element).attr('class', 'almight-message-layer');

			// プロパティを設定
			$.extend(true, this.prop, {
				frameGraphic: '',
				frameColor: '#000000',
				frameOpacity: 128,
				marginl: 8,
				margint: 8,
				marginr: 8,
				marginb: 8,
				left: 16, // 左端位置
				top: 16, // 上端位置
				font: {},
				style: {},
				deffont: {},
				defstyle: {},
				animateBegin: {
					opacity: 0
				},
				animateEnd: {
					opacity: 1
				},
				animateTime: 100,
				animateMobile: false
			}, config);

			// デフォルトフォントを設定
			$.extend(true, this.prop.deffont, {
				size: 24,
				face: 'serif',
				color: '#ffffff',
				bold: true,
				italic: false,
				shadowcolor: '#000000',
				shadowpos: '2px 2px 5px',
				shadow: true
			}, config.deffont);

			// デフォルトスタイルを設定
			$.extend(true, this.prop.defstyle, {
				lineheight: 6,
				pitch: 0,
				align: 'left'
			}, config.defstyle);

			// 背景エレメントを追加
			this.bgElement = $('<div/>').addClass('almight-layer-msgbg').css({
				width: width,
				height: height,
				left: 0,
				top: 0
			})[0];
			$(this.element).append(this.bgElement);

			// メッセージエレメントを追加
			this.msgElement = $('<div/>').addClass('almight-layer-message').css({
				left: 0,
				top: 0
			})[0];
			$(this.element).append(this.msgElement);

			// テキスト状態
			this.linking = false;

			// メッセージボックスの位置を設定
			this.setTop(this.prop.top);
			this.setLeft(this.prop.left);
			this.setMessageFrame();

			this.setSizeToImageSize();

			// レイヤーを初期化
			this.clear();
		},

		// ラインレイヤーを作成
		initLineLayer: function() {
			// text-alignがleft以外の時にはインライン要素にしない
			var displayStr = (this.prop.defstyle.align === 'left') ? 'inline' : 'block';
			if(this.prop.style.align !== 'left' && this.prop.style.align !== undefined) displayStr = 'block';
			// デフォルトとなるスタイルをラインレイヤーに設定する
			this.lineLayer = $('<div/>').addClass('almight-layer-line').css({
				fontSize: this.prop.deffont.size,
				fontFamily: this.prop.deffont.face,
				color: this.prop.deffont.color,
				fontWeight: this.prop.deffont.bold ? 'bold' : '',
				fontStyle: this.prop.deffont.italic ? 'italic' : '',
				textShadow: this.prop.deffont.shadow ? this.prop.deffont.shadowpos +' '+ this.prop.deffont.shadowcolor : '',
				lineHeight: ((this.prop.style.lineheight || this.prop.defstyle.lineheight) + (this.prop.font.size || this.prop.deffont.size)) + 'px',
				letterSpacing: (this.prop.style.pitch || this.prop.defstyle.pitch) + 'px',
				textAlign: this.prop.style.align || this.prop.defstyle.align,
				display: displayStr
			});
			$(this.msgElement).append(this.lineLayer);
		},

		// メッセージレイヤーをクリアする
		clear: function() {
			$(this.element).find('.almight-button').remove();
			this.resetFonts();
			this.resetStyles();
			this.clearLayer();
		},

		// メッセージをクリアする
		clearLayer: function() {
			$(this.msgElement).empty();
			this.initLineLayer();
		},

		setMessageFrame: function() {
			// メッセージボックスの位置とサイズを設定
			$(this.msgElement).css({
				left: this.prop.marginl,
				top: this.prop.margint,
				right: this.prop.marginr,
				bottom: this.prop.marginb
			});

			// メッセージレイヤーの位置とサイズを設定
			this.setLeft(this.prop.left);
			this.setTop(this.prop.top);
			this.setWidth(this.prop.width);
			this.setHeight(this.prop.height);
			this.setVisible(this.prop.visible);

			// メッセージレイヤーの背景を設定
			var bgProp = {
				height: this.prop.height,
				width: this.prop.width
			};

			// 背景画像がなければ単色
			if(this.prop.frameGraphic === '') {
				$.extend(bgProp, {
					backgroundColor: Almight.Util.rgba(this.prop.frameColor, this.prop.frameOpacity / 256),
					backgroundImage: ''
				});
				$(this.bgElement).empty();
			} else {
			// 背景画像があれば画像を設定
				$.extend(bgProp, {
					backgroundColor: '',
					backgroundImage: ''
					// backgroundImage: 'url(' +Almight.Util.getPath(this.prop.frameGraphic)+ ')'
				});
				$(this.bgElement).empty().append('<img src="'+Almight.Util.getPath(this.prop.frameGraphic)+'"/>');
			}

			$(this.bgElement).css(bgProp);
		},

		// positionタグで設定できる内容はここ
		setPosition: function(params) {
			if(typeof params.left === 'number') this.prop.left = params.left;
			if(typeof params.top === 'number') this.prop.top = params.top;
			if(typeof params.width === 'number') this.prop.width = params.width;
			if(typeof params.height === 'number') this.prop.height = params.height;
			this.setSizeToImageSize();

			if(typeof params.frame === 'string') this.prop.frameGraphic = params.frame;
			// this.prop.frameKey = elm.framekey if elm.framekey !== void;
			if(typeof params.color === 'string') this.prop.frameColor = params.color;
			if(typeof params.opacity === 'number') this.prop.frameOpacity = params.opacity;
			// this.prop.imageModified = true; // 強制的にメッセージレイヤをクリアするために
			if(typeof params.marginl === 'number') this.prop.marginl = params.marginl;
			if(typeof params.margint === 'number') this.prop.margint = params.margint;
			if(typeof params.marginr === 'number') this.prop.marginr = params.marginr;
			if(typeof params.marginb === 'number') this.prop.marginb = params.marginb;
			if(typeof params.vertical === 'boolean') this.prop.vertical = params.vertical;
			// this.prop.draggable = +elm.draggable if elm.draggable !== void;
			if(typeof params.visible === 'boolean') this.prop.visible = params.visible;

			this.setMessageFrame();
			this.clear();
		},

		/**
		* **スタイルを設定する**
		*
		* @method setStyles
		* @params {String} [params.align] left(左寄せ) / right(右寄せ) / center(中央揃え) / justify(均等割付)
		* @params {Number} [params.lineheight] 行間を設定
		* @params {Number} [params.pitch] 文字間を設定
		*/
		setStyles: function(params) {
			if(params.align !== undefined) this.prop.style.align = params.align;
			if(params.lineheight !== undefined) this.prop.style.lineheight = params.lineheight;
			if(params.pitch !== undefined) this.prop.style.pitch = params.pitch;

			// defaultが指定されていれば戻す
			if(params.align === 'default') delete this.prop.style.align;
			if(params.lineheight === 'default') delete this.prop.style.lineheight;
			if(params.pitch === 'default') delete this.prop.style.pitch;

			this.initLineLayer();
		},

		/**
		* **フォントを設定する**
		*
		* @method setFonts
		* @params {Object} params パラメータオブジェクト
		*/
		setFonts: function(params) {
			// 文字属性を設定
			if(params.size !== undefined) this.prop.font.fontSize = params.size;
			if(params.face !== undefined) this.prop.font.fontFamily = params.face;
			if(params.color !== undefined) this.prop.font.color = Almight.Util.rgba(params.color);
			if(params.shadowcolor !== undefined && params.shadowcolor !=='default') this.prop.font.shadowcolor =  Almight.Util.rgba(params.shadowcolor);
			if(params.shadowpos !== undefined && params.shadowpos !=='default') this.prop.font.shadowpos = params.shadowpos;
			if(params.shadow === undefined) params.shadow = this.prop.deffont.shadow;
			if((params.shadow === true || params.shadow === 'default') && (params.shadowcolor !== undefined || params.shadowpos !== undefined)) {
				this.prop.font.textShadow = (this.prop.font.shadowpos !== undefined ? this.prop.font.shadowpos : this.prop.deffont.shadowpos);
				this.prop.font.textShadow += ' ' + (this.prop.font.shadowcolor !== undefined ? this.prop.font.shadowcolor : this.prop.deffont.shadowcolor);
			}
			if(params.shadow === false) {
				this.prop.font.textShadow = 'none';
			}
			if(params.bold !== undefined) this.prop.font.fontWeight = params.bold ? 'bold' : '';
			// if(params.rubysize !== undefined) this.prop.font.rubysize = params.rubysize;
			// if(params.rubyoffset !== undefined) this.prop.font.rubyoffset = params.rubyoffset;
			// if(params.edge === undefined) this.prop.font.edge = params.edge;
			// if(params.edgecolor !== undefined) this.prop.font.edgecolor = params.edgecolor;

			// defaultが指定されていれば戻す
			if(params.size === 'default') delete this.prop.font.fontSize;
			if(params.face === 'default') delete this.prop.font.fontFamily;
			if(params.color === 'default') delete this.prop.font.color;
			if(params.shadow === 'default' && this.prop.deffont.shadow === false) this.prop.font.textShadow = 'none';
			if(params.shadowcolor === 'default') delete this.prop.font.shadowcolor;
			if(params.shadowpos === 'default') delete this.prop.font.shadowpos;
			if(params.bold === 'default') delete this.prop.font.fontWeight;
			// if(params.rubysize === 'default') delete this.prop.font.rubysize;
			// if(params.rubyoffset === 'default') delete this.prop.font.rubyoffset;
			// if(params.edge === 'default') delete this.prop.font.edge;
			// if(params.edgecolor === 'default') delete this.prop.font.edgecolor;
		},

		/**
		* **デフォルトスタイルを設定する**
		*
		* @method setDefStyles
		* @params {String} [params.align] left(左寄せ) / right(右寄せ) / center(中央揃え) / justify(均等割付)
		* @params {Number} [params.lineheight] 行間を設定
		* @params {Number} [params.pitch] 文字間を設定
		*/
		setDefStyles: function(params) {
			if(params.align !== undefined) this.prop.defstyle.align = params.align;
			if(params.lineheight !== undefined) this.prop.defstyle.lineheight = params.lineheight;
			if(params.pitch !== undefined) this.prop.defstyle.pitch = params.pitch;
		},

		/**
		* **デフォルトフォントを設定する**
		*
		* @method setDefFonts
		* @params {Object} params パラメータオブジェクト
		*/
		setDefFonts: function(params) {
			if(params.size !== undefined) this.prop.deffont.size = params.size;
			if(params.face !== undefined) this.prop.deffont.face = params.face;
			if(params.color !== undefined) this.prop.deffont.color = Almight.Util.rgba(params.color);
			if(params.shadowcolor !== undefined) this.prop.deffont.shadowcolor =  Almight.Util.rgba(params.shadowcolor);
			if(params.shadowpos !== undefined) this.prop.deffont.shadowpos = params.shadowpos;
			if(params.shadow !== undefined) this.prop.deffont.shadow = params.shadow;
			if(params.bold !== undefined) this.prop.deffont.bold = params.bold;
		},

		/**
		* **フォントをリセットする**
		*
		* @method resetFonts
		*/
		resetFonts: function() {
			this.prop.font = {};
			//this.initLineLayer();
		},

		resetStyles: function() {
			this.prop.style = {};
			this.initLineLayer();
		},

		processCh: function(texts, skip) {
			var ch = [];
			var end = [];

			// 文字spanを作成
			for(var i=0;i<texts.length;i++) {
				var text = texts.charAt(i);
				if(text === ' ') {
					text = '&nbsp;';
				}

				ch[i] = $('<span class="almight-ch">' +text+ '</span>').css(this.prop.font);

				if(this.linking) {
					ch[i].addClass('almight-linking');
				}

				if(this.prop.animateMobile && !skip) {
					// 文字表示アニメーションあり
					ch[i].css(this.prop.animateBegin).appendTo(this.lineLayer);
					end[i] = $.extend(true, {}, this.prop.animateEnd, { duration: this.prop.animateTime });
					//$(this.lineLayer).append(ch[i]);
					(function(i){
						setTimeout(function() {
							// 文字表示とアニメート
							ch[i].transition(end[i]);
							ch[i] = null; end[i] = null;
						}, 0);
					})(i);

				} else {
					// 文字表示アニメーションなし（高速）
					ch[i].appendTo(this.lineLayer);
				}
			}
		},

		// レイヤーの情報をダンプ出力する
		dump: function() {
			var dom = $(this.element).clone();
			// dom.find('.almight-ch').contents().unwrap();
			dom = dom.html();

			var json = $.extend(true, {}, {
				prop: this.prop,
				dom: dom
			});

			return json;
		},

		// リストアする
		restore: function(json) {
			this.prop = $.extend(true, {}, json.prop);
			this.clear();
			$(this.element).html(json.dom);

			this.bgElement = $(this.element).find('.almight-layer-msgbg')[0];
			this.msgElement = $(this.element).find('.almight-layer-message')[0];

			this.setMessageFrame();

			this.lineLayer = $(this.element).find('.almight-layer-line:last')[0];
		}
	};

	// Almight.Layerクラスを継承する
	Almight.MessageLayer.prototype = $.extend({}, Almight.Layer.prototype, Almight.MessageLayer.prototype);
})();

/*
* トランジションルール画像の生成
* 
* based: http://jsdo.it/popkirby/1KMr
* Copyright (c) popkirby
* License: MIT License
*
* @class Rule
*/

(function(){
'use strict';

	/**
	* トランジションのルールを画像から生成します
	* @param img {Image} ルール画像
	* @param w {Number} ルール画像の横幅
	* @param h {Number} ルール画像の縦幅
	* @constructor
	*/
	Almight.Rule = function(img, w, h) {
		this.img = img;
		this.width = w;
		this.height = h;

		this._tmpcA = document.createElement('canvas');
		this._ca = this._tmpcA.getContext('2d');
		this._tmpcA.width = w;
		this._tmpcA.height = h;

		var _tmpcB = this._tmpcB = document.createElement('canvas');
		var cb = this._cb = _tmpcB.getContext('2d');
		_tmpcB.width = w;
		_tmpcB.height = h;

		var al1 = this._alpha1 = document.createElement('canvas');
		var cal = al1.getContext('2d');

		var al2 = this._alpha2 = document.createElement('canvas');
		var cal2 = al2.getContext('2d');
		al1.width = w;
		al1.height = h;
		al2.width = w;
		al2.height = h;

		// 白黒画像をアルファに変換する作業
		cal.drawImage( img, 0, 0, w, h );

		var data = cal.getImageData( 0, 0, w, h );

		// 先頭に0を一個突っ込んでBをAにずらす
		Array.prototype.unshift.call( data.data, 0 );
		Array.prototype.pop.call( data.data );

		cal.putImageData( data, 0, 0 );

		// xorでアルファを反転
		cal2.fillStyle = '#000000';
		cal2.globalCompositeOperation = 'xor';
		cal2.fillRect( 0,0,w,h );
		cal2.drawImage( al1, 0, 0, w, h );
	};

	Almight.Rule.prototype = {
		/**
		* ratioに対するルール演算を行なって返します
		* @method makeRule
		* @param ratio {Number} ルール演算の比率
		* @return {Canvas}
		*/
		makeRule: function(ratio){
			var ca = this._ca, cb = this._cb;
			this._tmpcA.width = this._tmpcA.width;
			this._tmpcB.width = this._tmpcB.width;

			if ( ratio <= 0.5 ){
				cb.drawImage( this._alpha1, 0, 0 );
				cb.globalCompositeOperation = 'lighter';
				cb.fillStyle = 'rgba(0,0,0,' + ( 1 - ratio * 2 ) + ')';
				cb.fillRect( 0, 0, this.width, this.height );
				ca.fillStyle = '#000000';
				ca.fillRect( 0, 0, this.width, this.height );
				ca.globalCompositeOperation = 'xor';
				ca.drawImage( this._tmpcB, 0, 0, this.width, this.height );

			} else if( ratio > 0.5 ){
				// lighter を使ってアルファを加算
				ca.drawImage( this._alpha2, 0, 0, this.width, this.height );
				ca.globalCompositeOperation = 'lighter';
				ca.fillStyle = 'rgba(0,0,0,' + ( ratio - 0.5 ).toFixed(5) * 2 + ')';
				ca.fillRect( 0, 0, this.width, this.height );
			}

			return this._tmpcA;
		},

		applyRule: function(ctx, ratio){
			// ctx.save();
			ctx.globalCompositeOperation = 'xor'; // xorでアルファ適用
			ctx.drawImage( this.makeRule( ratio ), 0, 0 );
			// ctx.restore();

			return ctx;
		}
	};
})();

(function(){
'use strict';

/**
* **Almightで使用出来るタグを管理します**
*
* +  0 : シナリオの処理を停止
* +  1 : シナリオの処理を続行
* +  2 : シナリオの処理を続行（非同期処理で処理が完了するとdequeueされる）
*
* 通常、直接呼び出すことはありません。
* タグを実行する場合はScriptクラスのcommandメソッドを利用してください
*
* @class Tag
*/

Almight.Tag = function(core) {
	this.almight = core;
	this.stage = core.stage;
	this.hactexp = null;
};

Almight.Tag.prototype = {
	/**
	* **タグを実行しない**
	*
	* cond属性でfalseになったため、タグを実行しなかったことをコンソールに出力します
	*
	* @method _void_
	* @private
	* @return {Number} 1
	*/
	_void_: function() {
		return 1;
	},

	/**
	* **マクロ再生終了**
	*
	* マクロの再生が終了したことをコンソールに出力します
	*
	* @method _endmacro_
	* @private
	* @params {String} name 再生が終了したマクロ名
	* @return {Number} 1
	*/
	_endmacro_: function(params) {
		var macro = this.almight.script.macrostack.pop();

		if(this.almight.script.macrostack.length === 0) window.mp = {};
		else window.mp = this.almight.script.macrostack[0].attr;

		if(this.almight.debug) console.groupEnd('[' +macro.name+ ']');

		params = null;
		return 1;
	},

	/**
	* **ラベルの通過**
	*
	* ラベルを通過したことをコンソールに出力します
	*
	* @method _label_
	* @private
	* @params {String} id ラベル名
	* @params {String} name ラベルの見出し
	* @return {Number} 1
	*/
	_label_: function(params) {
		if(this.almight.debug) {
			console.log('ラベルを通過: ' + params.id + ' ' + params.name);
		}
		return 1;
	},

	/* **テキストの描画**
	*
	* テキストをメッセージレイヤーにアニメーション描画します
	* またメッセージ履歴にテキストを出力します
	*
	* @method _text_
	* @private
	* @params {String} text 描画するテキスト
	* @return {Number} アニメーション描画が有効なら2、無効なら1
	*/
	_text_: function(params) {
		var text = String(params.text || '');
		var chspeed = this.almight.config.chspeed;

		if(this.almight.debug) console.log(text);

		var speed = chspeed.nowaiting ? 0 : chspeed[chspeed.actual];
		var self = this;

		// メッセージ履歴を出力
		// if(this.stage.historyOutput) {
		// 	$('#almight-history-box p:last').append('<span>' + text + '</span>');
		// }

		// スキップモードの場合は一文字表示しない
		if(this.stage.skipping) speed = 0;

		if(speed > 0) { // speedが0以上の場合
			var textAnimate = text.split('');
			var textAnimateTimer;
			this.almight.stage.textAnimating = true;

			// 1文字表示アニメーションの終了処理
			$(Almight).off('.animateEnd').one('stageclick.animateEnd', function() {
				clearInterval(textAnimateTimer);

				if(textAnimate.length > 0) {
					// 残りのテキストを一気に描画
					self.almight.config.chspeed.nowaiting = true;
					$(Almight).one('userwait.nowaiting', function() {
						// userwait状態までノーウェイトでテキストを描画させる
						self.almight.config.chspeed.nowaiting = false;
					});
					self.ch({text: textAnimate.join('')});
				}

				// 文字表示アニメーションの終了待ち
				if(self.almight.config.messages.animateMobile) {
					setTimeout(function(){
						self.almight.stage.textAnimating = false;
						self.almight.script.dequeue();
					}, self.almight.config.messages.animateTime);
				} else {
					self.almight.stage.textAnimating = false;
					self.almight.script.dequeue();
				}

			});

			// 1文字表示アニメーション
			textAnimateTimer = setInterval(function() {
				self.ch({text: textAnimate[0]});
				textAnimate.shift();
				if(textAnimate.length <= 0) {
					// アニメーション終了
					$(Almight).triggerHandler('stageclick.animateEnd');
				}
			}, speed);

			return 2;

		} else {
			this.ch({text: text});

			return 1;
		}

	},


/** ====================
 * システム操作
    ==================== */

	/**
	* **システム変数をリセットする**
	*
	* システム変数を全てリセットします
	*
	* @method clearsysvar
	* @return {Number} 1
	*/
	clearsysvar: function() {
		window.sf = {};

		return 1;
	},

	/**
	* **ゲームウィンドウを閉じる**
	*
	* ゲームウィンドウを閉じます
	* ブラウザで実行中、タブを閉じられない場合はページが白紙になります
	* 確認ダイアログを表示し、キャンセルされた場合は処理が続行されるため、[close]の後は[s]などでシナリオを停止してください
	*
	* @method close
	* @params {Boolean} [ask=true] true(デフォルト)なら終了確認ダイアログを表示、falseなら確認せずに終了
	* @return {Number} 0
	*/
	close: function(params) {
		var self = this;

		if(params.ask === false) {
			window.close();
			location.href = 'about:blank';

		} else {
			almight.UI.dialog({
				text: 'ゲームを終了しますか？',
				button: [{
					text: 'キャンセル',
					callback: function(){
						self.almight.script.dequeue();
					}
				}, {
					text: 'OK',
					type: 'done',
					callback: function(){
						self.almight.exit();
					}
				}]
			});
		}

		return 0;
	},

	/**
	* **メッセージレイヤーを非表示**
	*
	* メッセージレイヤーを非表示にします
	* 非表示状態の時にクリックされると、再度表示されます
	*
	* @method hidemessage
	* @return {Number} 1
	*/
	hidemessage: function() {
		var self = this;

		$(Almight).off('.hidemessage').one('stageclick.hidemessage', function(){
			$(self.almight.stage.element).find('.almight-message-layer').css('visibility', '');

			setTimeout(function(){
				self.almight.stage.canClick = true;
			}, 0);
		});
		
		$(Almight).one('hideSidebar', function(){
			self.almight.stage.canClick = false;
		});

		$(this.almight.stage.element).find('.almight-message-layer').css('visibility', 'hidden');

		return 1;
	},

/**
* **JavaScriptの読み込み**
*
* JavaScriptファイルを読み込みます
*
* @method loadjs
* @params {String} src JavaScriptファイルへのパス
* @return {Number} 1
*/
	loadjs: function(params) {

		if(params.src !== undefined) {
			var self =this;

			$.ajax({
				url: Almight.Util.getPath(params.src),
				dataType: 'script'

			}).done(function() {
				self.almight.script.dequeue();

			}).fail(function(e) {
				console.error(e.message);
				Almight.error('[loadjs] JavaScriptファイルを読み込めませんでした');
			});

			return 2;
		} else {
			return 1;
		}
	},

	/**
	* **画面を揺らす**
	*
	* ウィンドウを揺らします
	* パラメータには0を指定することが可能で、縦揺れ・横揺れの表現が出来ます
	* 揺れの終了は[wq]で待ってください
	*
	* @method quake
	* @params {Number} time 揺れ時間をミリ秒で指定
	* @params {Number} [hmax=10] 揺れの最大ピクセル数
	* @params {Number} [vmax=10] 縦揺れの最大ピクセル数
	* @params {Number} [interval=30] 揺れを発生させるインターバルをミリ秒で指定（20以下は指定しないようにしてください）
	* @params {String/Number} [layer=ステージ] 0以上の整数(前景レイヤー) / message(currentで指定したレイヤー) / message[0-9](メッセージレイヤー)
	* @return {Number} 1
	*/
	quake: function(params) {
		if(params.time === undefined) Almight.error('[quake] にはtime属性が必須です');
		var hmax = (params.hmax !== undefined) ? params.hmax : 10;
		var vmax = (params.vmax !== undefined) ? params.vmax : 10;
		var interval = (params.interval !== undefined) ? params.interval : 30;

		var self = this;
		var target;

		// ターゲットレイヤーを選択
		if(params.layer === undefined) {
			target = $(this.almight.stage.container);
		} else {
			target = $(this.stage.getLayerFromParams(params).element);
		}

		// 揺らしタイマーを起動
		var quakeTimer = setInterval(function(){
			target.css({
				x: (parseInt(Math.random() * (hmax * 2), 10) - hmax),
				y: (parseInt(Math.random() * (vmax * 2), 10) - vmax)
			});
		}, interval);

		// 揺れを止める
		target.one('quakeEnd', function() {
			clearTimeout(clearTimer);
			clearInterval(quakeTimer);
			$(Almight).off('.quakeskip');
			target.css({ x:0, y:0 }).data('quaking', false).triggerHandler('quakeEnded');

		}).data('quaking', true);

		// 揺れを止めるタイマー
		var clearTimer = setTimeout(function(){
			target.triggerHandler('quakeEnd');
		}, params.time);

		return 1;
	},


	/**
	* **画面揺らしの実行を中止**
	*
	* 画面を揺らしている最中の場合、画面揺らしの実行を停止します
	*
	* @method stopquake
	* @params {String/Number} [layer=ステージ] 0以上の整数(前景レイヤー) / message(currentで指定したレイヤー) / message[0-9](メッセージレイヤー)
	* @return {Number} 1
	*/
	stopquake: function(params){
		var target;

		// ターゲットレイヤーを選択
		if(params.layer === undefined) {
			target = $(this.almight.stage.container);
		} else {
			target = $(this.stage.getLayerFromParams(params).element);
		}

		target.triggerHandler('quakeEnd');

		return 1;
	},

	/**
	* **画面揺らしの終了待ち**
	*
	* 画面揺らしの終了を待ちます
	*
	* @method wq
	* @params {boolean} [canskip=false] スキップ可能にするか
	* @params {String/Number} [layer=ステージ] 0以上の整数(前景レイヤー) / message(currentで指定したレイヤー) / message[0-9](メッセージレイヤー)
	* @return {Number} 2
	*/
	wq: function(params) {
		var canskip = (params.canskip === undefined ? false : params.canskip);
		var target;

		// ターゲットレイヤーを選択
		if(params.layer === undefined) {
			target = $(this.almight.stage.container);
		} else {
			target = $(this.stage.getLayerFromParams(params).element);
		}

		// 揺れていなければそのまま続行する
		if(target.data('quaking') !== true) {
			return 1;
		}

		// 揺れが止まった時に呼び出される
		target.one('quakeEnded', function(){
			$(Almight).off('.quakeskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.quakeskip').one('stageclick.quakeskip', function() {
				target.triggerHandler('quakeEnd');
			});
		}

		return 2;
	},

	/**
	* **シナリオを停止**
	*
	* シナリオ処理を停止します
	*
	* @method s
	* @return {Number} 0
	*/
	s: function() {
		return 0; // 停止
	},

	/**
	* **ゲームのタイトルを設定**
	*
	* ゲームウィンドウのタイトルを設定します
	*
	* @method title
	* @params {String} name ゲームタイトル名
	* @return {Number} 1
	*/
	title: function(params) {
		if(params.name === undefined) Almight.error('[title] にはname属性が必須です');

		this.almight.config.title = String(params.name || '');
		document.title = this.almight.config.title;

		return 1;
	},

	/**
	* **ウェイトを入れる**
	*
	* 指定された秒数だけ待ちます
	*
	* @method wait
	* @params {String} time シナリオ処理の待ち時間をミリ秒で指定
	* @params {Boolean} [canskip=true] クリックでスキップ可能にするかどうか。デフォルトでtrue
	* @return {Number} 2
	*/
	wait: function(params) {
		if(typeof params.time !== 'number') Almight.error('[wait] にはnumber型のtime属性が必須です');
		var canskip = (typeof params.canskip === 'boolean' ? params.canskip : true);

		var self = this;

		var waitTimer = setTimeout(function() {
			$(Almight).off('.waitskip');
			self.almight.script.dequeue();

		}, params.time);

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.waitskip').one('stageclick.waitskip', function() {
				clearTimeout(waitTimer);
				self.almight.script.dequeue();
			});
		}

		return 2;
	},

	/**
	* **クリックを待つ**
	*
	* このタグで待っているときはクリック待ち記号が表示されません。
	* また、スキップ状態が解除され、オートモードでも進みません。
	*
	* @method waitclick
	* @return {Number} 0
	*/
	waitclick: function(){
		// クリック待ち
		this._clickwait_('wait');

		// スキップ解除
		if(this.stage.skipping) {
			this.stage.setSkipmode(false);
		}

		return 0; // 停止
	},


/** ====================
 * マクロ操作
    ==================== */

	/**
	* **マクロの記録**
	*
	* マクロを記録開始します
	* 必ず[endmacro]タグで記録を終了してください
	* マクロ名は大文字小文字を区別しません
	*
	* マクロ内のタグの属性には % を頭につけた値を指定できます
	* % 以降にはマクロに渡された属性名を指定しておくと、マクロに渡された属性の値をその属性の値とすることができます
	* また、その値のあとに | を書いて省略値を指定することもできます
	* 属性の代わりに * を書くと、マクロに渡されたすべての属性をそのタグに渡すことができます
	*
	* @method macro
	* @params {String} name マクロ名
	* @params {String} [alias] マクロ名のエイリアス
	* @return {Number} 1
	*/
	macro: function(params) {
		if(name === undefined) Almight.error('[macro] にはname属性が必須です');
		var macroName = String(params.name).toLowerCase();

		// マクロ領域を初期化
		this.almight.script.macro[macroName] = [];

		// endmacroまでのマクロを記録
		var macroRecord = true;
		while (macroRecord) {
			this.almight.script.line++;
			var line = this.almight.script.scenario[this.almight.script.scenario_name][this.almight.script.line];

			if (line._type_ === 'endmacro') macroRecord = false;
			else this.almight.script.macro[macroName].push(line);
		}

		// エイリアスを作成
		if(params.alias !== undefined) {
			var alias = String(params.alias).toLowerCase();
			this.almight.script.macro[alias] = this.almight.script.macro[macroName];
		}

		if(this.almight.debug) console.info('[' + macroName + ']をマクロとして記録しました');

		return 1;
	},

	/**
	* **記録したマクロの削除**
	*
	* 記録されているマクロを削除します
	*
	* @method erasemacro
	* @params {String} name マクロ名
	* @return {Number} 1
	*/
	erasemacro: function(params) {
		if(params.name === undefined) Almight.error('[erasemacro] にはmacro属性が必須です');
		var macroName = String(params.name).toLowerCase();

		delete this.almight.script.macro[macroName];

		return 1;
	},

	/**
	* **マクロの記録の終了**
	*
	* [macro]タグで記録中のマクロの記録を終了します
	*
	* @method endmacro
	* @return {Number} 1
	*/
	endmacro: function() {
		console.warn('endmacroタグが重複して記述されている可能性があります');

		return 1;
	},

/** ====================
 * メッセージ操作
    ==================== */

	/**
	* **スキップモードを解除**
	*
	* このタグを通過したときにスキップモードになっていれば解除します
	*
	* @method cancelskip
	* @return {Number} 1
	*/
	cancelskip: function() {
		if(this.stage.skipping) {
			this.stage.setSkipmode(false);
		}

		return 1;
	},

	/**
	* **オートモードを解除**
	*
	* このタグを通過したときにオートモードになっていれば解除します
	*
	* @method cancelauto
	* @return {Number} 1
	*/
	cancelauto: function() {
		if(this.stage.autoMode) {
			this.stage.setAutomode(false);
		}

		return 1;
	},

	/**
	* **メッセージレイヤーの文字をクリア**
	*
	* 現在選択されているメッセージレイヤーの文字をクリアし、文字属性とスタイルをリセットします
	*
	* @method er
	* @return {Number} 1
	*/
	er: function() {
		this.stage.current.clear();

		return 1;
	},

	/**
	* **メッセージレイヤーのクリア**
	*
	* 全てのメッセージレイヤーをクリアします
	*
	* @method cm
	* @return {Number} 1
	*/
	cm: function() {
		for(var i=0;i<this.stage.fore.messages.length;i++) {
			this.stage.fore.messages[i].clear();
			this.stage.back.messages[i].clear();
		}

		return 1;
	},

	/**
	* **メッセージレイヤーのリセット**
	*
	* 全てのメッセージレイヤーをクリアして、カレントメッセージレイヤーを初期化します(fore の message0)
	*
	* @method ct
	* @return {Number} 1
	*/
	ct: function() {
		for(var i=0;i<this.stage.fore.messages.length;i++) {
			this.stage.fore.messages[i].clear();
			this.stage.back.messages[i].clear();
		}

		this.stage.setCurrentMessageLayer({
			page: 'fore',
			layer: 'message0'
		});

		return 1;
	},

	/**
	* **文字の描画**
	*
	* 文字を現在指定されているメッセージレイヤーに描画します
	* 通常タグとしては利用しません。
	*
	* @method ch
	* @params {String} text 描画する文字
	* @return {Number} 1
	*/
	ch: function(params) {

		if(params.text === undefined || params.text === null) params.text = '';

		// メッセージ履歴を出力
		if(this.stage.historyOutput) {
			$('#almight-history-box p:last').append('<span>' + params.text + '</span>');
		}

		this.stage.current.processCh(params.text, this.stage.skipping);

		return 1;
	},

	/**
	* **操作対象のメッセージレイヤーを指定**
	*
	* 捜査対象となるメッセージレイヤーを指定します
	*
	* @method current
	* @params {String} [layer=currentLayer] message0, message1, message2… 省略すると[current]で指定されたレイヤーが選択されます
	* @params {String} [page=fore] "fore"または"back"
	* @return {Number} 1
	*/
	current: function(params) {
		this.stage.setCurrentMessageLayer(params);

		return 1;
	},

	/**
	* **メッセージレイヤーのフォントを設定**
	*
	* [current]タグで指定されたメッセージレイヤーのフォント属性を設定します
	*
	* @method font
	* @params {Number} [size] フォントサイズをピクセル単位で指定
	* @params {String} [face] フォント名を指定。CSSのfont-familyに準拠
	* @params {String} [color] レイヤーの背景に指定する色を[0xRRGGBB]か[#RRGGBB]か[#RGB]形式で指定
	* @params {Boolean} [shadow] 文字を影付きにするかどうか
	* @params {String} [shadowcolor] 文字を影付きにする場合、色を[0xRRGGBB]か[#RRGGBB]か[#RGB]形式で指定
	* @params {String} [shadowpos] 文字の影設定
	* @params {Boolean} [bold] 太字にするかどうか
	* @return {Number} 1
	*/
	font: function(params) {
		this.stage.current.setFonts(params);

		return 1;
	},

	/**
	* **メッセージレイヤーのスタイルを設定**
	*
	* [current]タグで指定されたメッセージレイヤーのスタイルを設定します
	*
	* @method style
	* @params {String} [align] left(左寄せ) / right(右寄せ) / center(中央揃え) / justify(均等割付)
	* @params {Number} [lineheight] 行間を設定
	* @params {Number} [pitch] 文字間を設定
	* @return {Number} 1
	*/
	style: function(params) {
		this.stage.current.setStyles(params);

		return 1;
	},

	/**
	* **メッセージレイヤーのデフォルトフォントを設定**
	*
	* [current]タグで指定されたメッセージレイヤーのデフォルトフォント属性を設定します
	* ここで変更されるのはデフォルトのパラメータのみです
	* 実際に反映させるには[resetfont]を使用してください
	*
	* @method deffont
	* @return {Number} 1
	*/
	deffont: function(params) {
		this.stage.current.setDefFonts(params);

		return 1;
	},

	/**
	* **メッセージレイヤーのデフォルトスタイルを設定**
	*
	* [current]タグで指定されたメッセージレイヤーのデフォルトスタイルを設定します
	* ここで変更されるのはデフォルトのパラメータのみです
	* 実際に反映させるには[resetstyle]を使用してください
	*
	* @method defstyle
	* @return {Number} 1
	*/
	defstyle: function(params) {
		this.stage.current.setDefStyles(params);

		return 1;
	},

	/**
	* **メッセージレイヤーのフォントをリセット**
	*
	* [font]タグで指定されたフォント属性をリセットします
	*
	* @method resetfont
	* @return {Number} 1
	*/
	resetfont: function() {
		this.stage.current.resetFonts();

		return 1;
	},

	/**
	* **メッセージレイヤーのスタイルをリセット**
	*
	* [style]タグで指定されたスタイルをリセットします
	*
	* @method resetstyle
	* @return {Number} 1
	*/
	resetstyle: function() {
		this.stage.current.resetStyles();

		return 1;
	},

	chanimbegin: function(params) {

		return 1;
	},

	chanimend: function() {

	},

	chanimtime: function() {

	},

	/**
	* **メッセージ中に画像を表示**
	*
	* メッセージレイヤーのテキスト描画位置に画像をインラインで表示します
	*
	* @method graph
	* @params {String} storage 画像のパスを指定
	* @return {Number} 1
	*/
	graph: function(params) {
		var storage;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			storage = Almight.Util.getPath(params.storage);
		}

		var graph = $('<img/>').addClass('almight-graph').attr('src', storage);
		$(this.almight.stage.current.msgElement).find('.almight-layer-line:last').append(graph);
		graph = null;

		return 1;
	},

	/**
	* **文字表示をノーウェイトにする**
	*
	* 文字表示をノーウェイトにします
	* 終了するには[endnowait]タグを使用します
	*
	* @method nowait
	* @return {Number} 1
	*/
	nowait: function() {
		this.almight.config.chspeed.tmp = this.almight.config.chspeed.actual;
		this.almight.config.chspeed.actual = 'nowait';

		return 1;
	},

	/**
	* **文字のノーウェイト表示を解除**
	*
	* [nowait]で指定されていた文字のノーウェイト表示を解除します
	*
	* @method endnowait
	* @return {Number} 1
	*/
	endnowait: function() {
		this.almight.config.chspeed.actual = this.almight.config.chspeed.tmp;

		return 1;
	},

	/**
	* **文字の表示アニメーション速度を設定**
	*
	* 文字のアニメーション表示の速度を設定します
	*
	* @method delay
	* @params {Number} speed 文字のアニメーション速度をミリ秒で指定
	* @return {Number} 1
	*/
	delay: function(params) {
		if(params.speed === undefined) Almight.error('[delay] にはspeed属性が必須です');

		if(typeof params.speed === 'number') {
			this.almight.config.chspeed.tmp = this.almight.config.chspeed.actual;
			this.almight.config.chspeed.actual = 'delay';
			this.almight.config.chspeed.delay = params.speed;

		} else if(params.speed === 'user') {
			this.almight.config.chspeed.actual = this.almight.config.chspeed.tmp;

		} else if(params.speed === 'nowait') {
			this.almight.config.chspeed.tmp = this.almight.config.chspeed.actual;
			this.almight.config.chspeed.actual = 'nowait';
		}

		return 1;
	},


	/**
	* **行末クリック待ち**
	*
	* 行末記号を表示してクリックを待ちます
	*
	* @method l
	* @return {Number} 0
	*/
	l: function() {
		// クリック待ち
		this._clickwait_('line');

		// メッセージ履歴を改行
		//if(this.stage.historyOutput) {
		//	$('#almight-history-box').append('<p/>');
		//}

		return 0;
	},

	/**
	* **改ページクリック待ち**
	*
	* 改ページ記号を表示してクリックを待ちます
	*
	* @method p
	* @return {Number} 0
	*/
	p: function() {
		// クリック待ち
		this._clickwait_('page');

		if(this.stage.historyOutput) {
			$('#almight-history-box p:last').append('<br>');
		}

		return 0;
	},

	/**
	* **改行する**
	*
	* 改行を挿入します
	*
	* @method r
	* @return {Number} 1
	*/
	r: function() {
		$(this.almight.stage.current.lineLayer).append('<br/>');

		if(this.stage.historyOutput) {
			$('#almight-history-box p:last').append('<br/>');
		}

		return 1;
	},

	/**
	 * ステージクリック待ち状態にする
	 */
	_clickwait_: function(type) {
		var self = this;
		var breaker;
		this.almight.stage.clickWaiting = type;

		$(this.almight.stage.current.msgElement).find('.almight-breaker').remove();

		if(type === 'page' || type === 'line') {
			// クリック待ち記号を表示
			breaker = $('<span/>').addClass('almight-breaker').addClass('almight-break-' + type)[0];
			$(this.almight.stage.current.lineLayer).append(breaker);
		}

		$(Almight).off('.clickwait').on('stageclick.clickwait', function() {
			// クリック可能状態なら進む
			if(self.almight.stage.canClick) {
				$(Almight).off('.clickwait');
				$(breaker).remove();
				breaker = null;
				self.almight.stage.clickWaiting = '';
				self.almight.script.dequeue();
			}
		});

		// オートモードがオンなら指定秒数後に発火
		if(this.almight.stage.autoMode && type !== 'wait') {
			setTimeout(function(){
				$(Almight).triggerHandler('autoclick');
			}, this.almight.stage.autoDelay);
		}
	},

	/**
	* **メッセージレイヤーの属性設定**
	*
	* 指定されたメッセージレイヤーに属性を設定します
	*
	* @method position
	* @params {String} [layer=currentLayer] message0, message1, message2… 省略すると[current]で指定されたレイヤーが選択されます
	* @params {String} [page=currentPage] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @params {Number} [left] 左からの配置位置（距離）をピクセル単位で指定
	* @params {Number} [top] 上からの配置位置（距離）をピクセル単位で指定
	* @params {Number} [marginl] 左からのマージン（余白）をピクセル単位で指定
	* @params {Number} [margint] 上からのマージン（余白）をピクセル単位で指定
	* @params {Number} [marginr] 右からのマージン（余白）をピクセル単位で指定
	* @params {Number} [marginb] 下からのマージン（余白）をピクセル単位で指定
	* @params {Number} [width] 幅を設定
	* @params {Number} [height] 高さを設定
	* @params {Boolean} [vertical] 縦書きにするか
	* @params {String} [visible] 可視状態を指定。trueで可視になり、falseで不可視になります
	* @params {String} [frame] レイヤーの背景に指定する画像のファイルパスを指定。使わないときは""を指定すると、color, opacity属性で指定した単色が表示されます
	* @params {String} [color] レイヤーの背景に指定する色を[0xRRGGBB]か[#RRGGBB]か[#RGB]形式で指定。frame属性が""のときに有効
	* @params {Number} [opacity] r
	* @return {Number} 1
	*/
	position: function(params) {
		this.stage.getMessageLayerObjectFromParams(params).setPosition(params);

		return 1;
	},

/** ====================
 * メッセージ履歴操作
    ==================== */

	/**
	* **メッセージ履歴にアクションを設定する**
	*
	* [hact]から[endhact]までに囲まれた部分は、メッセージ履歴上でクリックできるようになります。
	* クリックした時に、exp属性で指定されていたJS式が実行されます。
	*
	* @method hact
	* @params {String} exp JS式
	* @return {Number} 1
	*/
	hact: function(params) {
		if(!this.stage.historyOutput) return 1;

		// hactlinkのための区切り
		$('#almight-history-box p:last').append('<p/>');
		$('#almight-history-box p:last').wrap('<em/>');


		this.hactexp = params.exp;

		return 1;
	},

	/**
	* **メッセージ履歴アクションの終了**
	*
	* @method endhact
	* @return {Number} 1
	*/
	endhact: function() {
		if(!this.stage.historyOutput) return 1;

		if(this.hactexp !== null && this.hactexp !== undefined) {
			$.data($('#almight-history-box em:last')[0], 'hact', this.hactexp);
			$('#almight-history-box em:last').addClass('hactlink').on('tap', function() {
				Almight.exec($.data(this, 'hact'), true);
			});
			// hactlinkのための区切り
			$('#almight-history-box').append('<p/>');
		}

		this.hactexp = null;

		return 1;
	},

	/**
	* **メッセージ履歴の設定**
	*
	* メッセージ履歴の設定を行います
	*
	* @method history
	* @params {Boolean} [output] メッセージ履歴にテキストを出力するか指定する
	* @params {Boolean} [enabled] メッセージ履歴を表示可能か指定する
	* @return {Number} 1
	*/
	history: function(params) {
		if(typeof params.output === 'boolean') this.stage.historyOutput = params.output;
		if(typeof params.enabled === 'boolean') this.stage.historyEnabled = params.enabled;

		return 1;
	},

	/**
	* **メッセージ履歴への文字描画**
	*
	* メッセージ履歴でだけ文字を描画します
	*
	* @method historytext
	* @params {String} text 描画する文字
	* @return {Number} 1
	*/
	historytext: function(params){
		if(this.stage.historyOutput) {
			$('#almight-history-box p:last').append('<span>' + params.text + '</span>');
		}

		return 1;
	},

	/**
	 * hr ( メッセージ履歴の改行 )
	 */
	hr: function(params) {
		if(this.stage.historyOutput) {
			$('#almight-history-box p:last').append('<br/>');
		}
		
		return 1;
	},

/** ====================
 * ラベル・シナリオ操作
    ==================== */

	/**
	* **グラフィカルボタン**
	*
	* 画像を用いたボタンを生成します
	*
	* @method button
	* @params {String} graphic ボタンにする画像のファイル名
	* @params {String} [storage] 呼び出したいシナリオファイル名。省略すると現在のシナリオファイルとみなします
	* @params {String} [target] 呼び出したいラベル名。省略するとシナリオファイルの先頭とみなします
	* @params {String} [exp] クリックした時に実行されるJS式
	* @return {Number} 1
	*/
	button: function(params) {
		var self = this;
		var graphic = '';

		// ファイルの実パスを取得
		if(params.graphic !== undefined) graphic = Almight.Util.getPath(params.graphic);
		if(params.storage !== undefined) params.storage = Almight.Util.getPath(params.storage);
		if(params.enterse !== undefined) params.enterse = Almight.Util.getPath(params.enterse);
		if(params.leavese !== undefined) params.leavese = Almight.Util.getPath(params.leavese);
		if(params.clickse !== undefined) params.clickse = Almight.Util.getPath(params.clickse);

		// コンテナを取得
		var container = (this.almight.stage.currentPage === 'fore' ? this.almight.stage.element : this.almight.stage.backElement);
		container = this.almight.stage.current.element;

		var btnimg = $('<img/>').on('load', function(){
			var width = this.width;
			var height = this.height;

			var btn = $('<div/>').addClass('almight-button')
			.css({
				'width': (width / 3),
				'height': height,
				'top': self.almight.stage.locate.y,
				'left': self.almight.stage.locate.x,
				'background-image': 'url(' + graphic + ')'

			}).attr({
				'data-width': width / 3,
				'data-storage': params.storage,
				'data-target': params.target,
				'data-exp': params.exp,
				'data-onenter': params.onenter,
				'data-onleave': params.onleave,
				'data-clickse': params.clickse,
				'data-clicksebuf': params.clicksebuf,
				'data-enterse': params.enterse,
				'data-entersebuf': params.entersebuf,
				'data-leavese': params.leavese,
				'data-leavesebuf': params.leavesebuf
			});

			// almight.message[almight.message.currentPage][almight.message.currentLayer]
			$(container).append(btn);
			self.almight.buttonsEvent();

			$(this).remove();

			self.almight.script.dequeue();

		}).on('error', function(){
			Almight.error('[button] ボタン画像の読み込みに失敗しました');

		}).attr('src', graphic);

		return 2;
	},

	/**
	* **グラフィカルボタン表示位置の設定**
	*
	* グラフィカルボタンを描画する位置を設定します
	*
	* @method locate
	* @params {Number} [x=0] 横方向の位置をピクセル単位で指定
	* @params {Number} [y=0] 縦方向の位置をピクセル単位で指定
	* @return {Number} 1
	*/
	locate: function(params) {
		this.stage.current.initLineLayer();

		this.almight.stage.locate = {
			x: (typeof params.x === 'number' ? params.x + this.stage.current.prop.marginl : 0),
			y: (typeof params.y === 'number' ? params.y + this.stage.current.prop.margint : 0)
		};

		$(this.stage.current.lineLayer).css({
			position: 'absolute',
			left: params.x,
			top: params.y,
			width: '100%'
		});

		return 1;
	},

	/**
	* **サブルーチンのコール**
	*
	* サブルーチンを呼び出します
	* サブルーチンをcallした場合は、必ずreturnタグで元の場所か指定した場所に戻す必要があります
	*
	* @method call
	* @params {String} [storage] 呼び出したいシナリオファイル名。省略すると現在のシナリオファイルとみなします
	* @params {String} [target] 呼び出したいラベル名。省略するとシナリオファイルの先頭とみなします
	* @return {Number} 1
	*/
	'call': function(params) {
		// コールスタックに追加
		this.almight.script.callstack.push({
			'storage': this.almight.script.scenario_name,
			'line': this.almight.script.line
		});

		return this.jump(params);
	},

	/**
	* **サブルーチンから戻る**
	*
	* 呼び出されているサブルーチンから戻ります
	* サブルーチンをcallした場合は、必ずreturnタグで元の場所か指定した場所に戻す必要があります
	* storage属性とtarget属性の両方を省略すると、サブルーチンを呼び出したcallタグの場所に戻ります
	*
	* @method return
	* @params {String} [storage] 呼び出したいシナリオファイル名。target属性を省略すると現在のシナリオファイルとみなします
	* @params {String} [target] 呼び出したいラベル名。storage属性を省略するとシナリオファイルの先頭とみなします
	* @return {Number} 1
	*/
	'return': function(params) {
		if(this.almight.script.callstack.length <= 0) Almight.error('[return] call元が見つかりません。callとreturnのバランスが崩れている可能性があります');

		// コールスタックをpop
		var call = this.almight.script.callstack.pop();

		if(params.storage === undefined && params.target === undefined) {
			// call位置に戻る
			params.storage = call.storage;
			params.line =　(params.storage === this.almight.script.scenario_name) ? call.line : call.line + 1;
		}

		return this.jump(params);
	},

	/**
	* **選択肢を表示する**
	*
	* 選択肢を表示します
	* text1, text2, text3... とパラメータを追加して、複数の選択肢を表示することができます
	* 既に選択肢が表示されている状態であればエラーを返します
	*
	* どれかを選択すると、選択肢は非表示になります
	* targetとstorageは省略可能ですが、textは省略できません
	*
	* @method choices
	* @params {String} text1 選択肢に表示する文字列
	* @params {String} [target1] 選択したときにジャンブするラベル名。jumpタグと同じ
	* @params {String} [storage1] 選択した時にジャンプするシナリオファイル名。jumpタグとを同じ
	* @params {String} [exp1] 選択した時に実行されるJS式
	* @params {String} [cond1] 選択肢を表示するかどうか判断するJS式
	* @return {Number} 0
	*/
	choices: function(params) {
		if($('#almight-choices').size() !== 0) {
			Almight.error('[choices] 既に選択肢が表示されています');
		}

		$(this.stage.element).append('<div id="almight-choices-window"><div class="almight-choices-box"></div></div>');

		var i = 1;
		var choice = [];

		// パラメータから選択肢オブジェクトを配列にプッシュ
		while (params['text' + i] !== undefined) {
			var cond = true;
			if(params['cond' + i] !== undefined) {
				if(!Almight.exec(params['cond' + i])) {
					cond = false;
				}
			}

			if(cond) {
				choice.push({
					text: params['text' + i],
					target: params['target' + i],
					exp: params['exp' + i],
					onenter: params['onenter' + i],
					onleave: params['onleave' + i],
					storage: params['storage' + i],
					enterse: params['enterse' + i],
					leavese: params['leavese' + i],
					clickse: params['clickse' + i],
					entersebuf: params['entersebuf' + i],
					leavesebuf: params['leavesebuf' + i],
					clicksebuf: params['clicksebuf' + i]
				});
			}
			i++;
		}

		if(choice.length === 0) return 1;

		// 選択肢を生成してappend
		for (i = 0; i < choice.length; i++) {
			var btn = $('<div/>')
			.addClass('ui-choices')
			.addClass('almight-choices')
			.hide()
			.html(choice[i].text);

			// ファイルのパスを取得
			if(choice[i].enterse !== undefined) choice[i].enterse = Almight.Util.getPath(choice[i].enterse);
			if(choice[i].leavese !== undefined) choice[i].leavese = Almight.Util.getPath(choice[i].leavese);
			if(choice[i].clickse !== undefined) choice[i].clickse = Almight.Util.getPath(choice[i].clickse);

			if(choice[i].target !== undefined) btn.attr('data-target', choice[i].target);
			if(choice[i].storage !== undefined) btn.attr('data-storage', choice[i].storage);
			if(choice[i].exp !== undefined) btn.attr('data-exp', choice[i].exp);
			if(choice[i].onenter !== undefined) btn.attr('data-onenter', choice[i].onenter);
			if(choice[i].onleave !== undefined) btn.attr('data-onleave', choice[i].onleave);
			if(choice[i].enterse !== undefined) btn.attr('data-enterse', choice[i].enterse);
			if(choice[i].leavese !== undefined) btn.attr('data-leavese', choice[i].leavese);
			if(choice[i].clickse !== undefined) btn.attr('data-clickse', choice[i].clickse);
			if(choice[i].entersebuf !== undefined) btn.attr('data-entersebuf', choice[i].entersebuf);
			if(choice[i].leavesebuf !== undefined) btn.attr('data-leavesebuf', choice[i].leavesebuf);
			if(choice[i].clicksebuf !== undefined) btn.attr('data-clicksebuf', choice[i].clicksebuf);

			$('#almight-choices-window .almight-choices-box').append(btn);
			btn = null;
		}

		// 選択肢を表示
		$('#almight-choices-window').fadeIn(200, function(){
			$(this).css('display', 'table').find('.ui-choices').show();
		});

		this.almight.buttonsEvent();

		return 0;
	},

	/**
	* **リンクを設定**
	*
	* [link]と[endlink]で囲われた文字を、ハイパーリンクとします
	* exp属性を指定すると、クリックされた時にJavaScriptを実行することが出来ます
	*
	* @method link
	* @params {String} [storage] クリックされたときに呼び出したいシナリオファイル名。省略すると現在のシナリオファイルとみなします
	* @params {String} [target] クリックされたときに呼び出したいラベル名。省略するとシナリオファイルの先頭とみなします
	* @params {String} [exp] クリックされたときに実行するJavaScript
	* @return {Number} 1
	*/
	link: function(params) {
		this.stage.current.linking = true;

		var a = $('<a class="almight-link"/>');
		var self = this;

		// ファイルのパスを取得
		if(params.enterse !== undefined) params.enterse = Almight.Util.getPath(params.enterse);
		if(params.leavese !== undefined) params.leavese = Almight.Util.getPath(params.leavese);
		if(params.clickse !== undefined) params.clickse = Almight.Util.getPath(params.clickse);

		if(params.storage !== undefined) a.attr('data-storage', params.storage);
		if(params.target !== undefined) a.attr('data-target', params.target);
		if(params.exp !== undefined) a.attr('data-exp', params.exp);
		if(params.onenter !== undefined) a.attr('data-onenter', params.onenter);
		if(params.onleave !== undefined) a.attr('data-onleave', params.onleave);
		if(params.enterse !== undefined) a.attr('data-enterse', params.enterse);
		if(params.leavese !== undefined) a.attr('data-leavese', params.leavese);
		if(params.clickse !== undefined) a.attr('data-clickse', params.clickse);
		if(params.entersebuf !== undefined) a.attr('data-entersebuf', params.entersebuf);
		if(params.leavesebuf !== undefined) a.attr('data-leavesebuf', params.leavesebuf);
		if(params.clicksebuf !== undefined) a.attr('data-clicksebuf', params.clicksebuf);

		$(this.stage.current.lineLayer).one('endlink', function() {
			self.stage.current.linking = false;
			$(this).find('.almight-linking').removeClass('almight-linking').wrapAll(a);
			self.almight.buttonsEvent();
			//self.stage.current.initLineLayer();
		});

		return 1;
	},

	/**
	* **リンク設定の閉じタグ**
	*
	* [link]と[endlink]で囲われた文字を、ハイパーリンクとします
	*
	* @method endlink
	* @return {Number} 1
	*/
	endlink: function() {
		$(this.stage.current.lineLayer).triggerHandler('endlink');

		return 1;
	},

	/**
	* **シナリオのジャンプ**
	*
	* 指定された場所にシナリオをジャンプします
	* storage属性は、ks拡張子を省略出来ます
	*
	* @method jump
	* @params {String} [storage] 呼び出したいシナリオファイル名。省略すると現在のシナリオファイルとみなします
	* @params {String} [target] 呼び出したいラベル名。省略するとシナリオファイルの先頭とみなします
	* @return {Number} 1
	*/
	jump: function(params) {
		var self = this;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		var storage = '', target = '';
		var target_jump = function() {
			// ターゲットが指定されている
			if(/^\*/.test(params.target)) {
				// 位置を移動
				target = params.target.replace(/^\*/, '');
				if(target in self.almight.script.label[self.almight.script.scenario_name]) {
					var label = self.almight.script.label[self.almight.script.scenario_name][target];
					self.almight.script.line = label.line;
				} else {
					Almight.error('[jump] 指定されているラベル名は存在していません');
				}
			} else {
				self.almight.script.line = 0;
			}

			target_jump = null;
		};

		// ジャンプ先のファイルと現在ファイルが同じならスルー
		if(params.storage !== undefined) {
			if(params.storage === this.almight.script.scenario_name) params.storage = undefined;
		}


		// ラベルのみのジャンプなら続行
		if(params.storage === undefined) {
			target_jump(params);

			// 同一ファイル内で target の指定がない時は二行目から読み込むため line を -1 に。
			if(self.almight.script.line === 0) this.almight.script.line = -1;

			if(params.line !== undefined) this.almight.script.line = params.line;

			return 1;

		} else {
			// シナリオファイル名が指定されていればロードしてcallback
			this.almight.script.load(params.storage).then(
				// ロード成功
				function() {
					target_jump(params);
					if(params.line !== undefined) self.almight.script.line = params.line;
					setTimeout(function() {
						self.almight.script.dequeue();
					}, 0);

				}, function(xhr, status){
					// ロード失敗
					Almight.error('[jump] シナリオファイルのロードに失敗しました: ' + status);
				}
			);

			return 2;
		}
	},

/** ====================
 * レイヤー操作
    ==================== */

	/**
	* **表レイヤーを裏レイヤーにコピーする**
	*
	* 指定したレイヤー、もしくは全ての表レイヤーを裏レイヤーにコピーします
	* transタグは裏レイヤーを表レイヤーに書き換えてトランジションするため、
	* transタグを使う前にはbacklayタグで表レイヤーを裏レイヤーにコピーして初期化する必要があります
	*
	* @method backlay
	* @params {String/Number} [layer] base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @return {Number} 1
	*/
	backlay: function(params) {
		if(params.layer !== undefined) {
			this.stage.layerCopyTo(
				this.stage.getLayerPageFromParams(params, 'fore'),
				this.stage.getLayerPageFromParams(params, 'back'),
				'back'
			);
		} else {
			// 指定が無いので全レイヤーをコピー
			this.stage.layerCopy('back');
		}

		return 1;
	},

	/**
	* **裏レイヤーを表レイヤーにコピーする**
	*
	* 指定したレイヤー、もしくは全ての裏レイヤーを表レイヤーにコピーします
	*
	* @method forelay
	* @params {String/Number} [layer] base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @return {Number} 1
	*/
	forelay: function(params) {
		if(params.layer !== undefined) {
			this.stage.layerCopyTo(
				this.stage.getLayerPageFromParams(params, 'back'),
				this.stage.getLayerPageFromParams(params, 'fore'),
				'fore'
			);
		} else {
			// 指定が無いので全レイヤーをコピー
			this.stage.layerCopy('fore');
		}

		// リンク機能のあるものがトランスしたら、リンクを有効にする。
		almight.buttonsEvent();

		return 1;
	},

	/**
	* **レイヤーのコピー**
	*
	* 指定したレイヤーを指定されたレイヤーにコピーします
	*
	* @method copylay
	* @params {String/Number} srclayer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)	* @params {String/Number} srclayer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @params {String/Number} destlayer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @params {String} [srcpage] コピー元のpageを指定します。デフォルトでforeになります
	* @params {String} [destpage] コピー先のpageを指定します。デフォルトでforeになります
	* @return {Number} 1
	*/
	copylay: function(params) {
		var from = (params.srcpage === undefined ? 'fore' : params.srcpage);
		var to = (params.destpage === undefined ? 'fore' : params.destpage);
		var src = this.stage.getLayerPageFromParams({
				layer: params.srclayer
			}, from);
		var dest = this.stage.getLayerPageFromParams({
				layer: params.destlayer
			}, to);

		if(src.type !== dest.type) {
			Almight.error('[copylay] srclayerとdestlayerのレイヤータイプが一致していないためコピー出来ません');
		} else {
			var zIndex = 1;
			if(/^message[0-9]+$/.test(params.destlayer)) {
				zIndex = Number(params.destlayer.replace('message', ''));
				zIndex += 1000;
			} else if(typeof params.destlayer === 'number') {
				zIndex = params.destlayer;
				zIndex += 10;
			}
			this.stage.layerCopyTo(src, dest, to, zIndex);
		}

		// リンク機能のあるものがトランスしたら、リンクを有効にする。
		almight.buttonsEvent();

		return 1;
	},

	/**
	* **レイヤー画像の開放**
	*
	* 指定されたレイヤーの画像を開放します
	*
	* @method freeimage
	* @params {String/Number} [layer] base(背景レイヤー) / 0以上の整数(前景レイヤー)
	* @params {String} [page] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @params {String} [all] "no"または"layer"（全ての前景レイヤー画像）または"all"/true（全ての前景レイヤー画像+baseレイヤー）をクリアします
	* @return {Number} 1
	*/
	freeimage: function(params) {
		var page = (params.page === undefined ? this.stage.currentPage : params.page);

		if(params.all === 'all') {
			this.stage[page].base.freeImage();
		}
		if(params.all === 'layer' || params.all === 'all' || params.all === true) {
			for(var i=0;i<this.stage[page].layers.length;i++) {
				almight.stage[page].layers[i].freeImage();
			}
		} else {
			this.stage.getLayerFromParams(params).freeImage();
		}

		return 1;
	},

	/**
	* **画像の読み込み**
	*
	* 指定されたレイヤーに画像を読み込みます。
	* タグを[img]と書いて省略形に出来ます。
	*
	* @method image
	* @params {String} storage 画像ファイル名
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー)
	* @params {String} [page] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @params {Boolean} [visible] レイヤーの表示状態を設定する
	* @params {Number} [top] レイヤーの上端位置を設定する
	* @params {Number} [left] レイヤーの左端を設定する
	* @params {Number} [opacity] レイヤーの不透明度を設定する
	* @return {Number} 2
	*/
	image: function(params) {
		var self = this;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		if(this.almight.debug) console.time(params.storage + 'の読み込み時間'); // 画像の読み込み時間を計測

		this.stage.getLayerFromParams(params).loadImages(params, true).then(function(){
			if(self.almight.debug) console.timeEnd(params.storage + 'の読み込み時間'); // 画像の読み込み時間を計測
			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // 画像の読み込みに失敗
		});

		return 2;
	},

	/**
	* **単色矩形の描画**
	*
	* 指定されたレイヤーに単色の矩形を描画します。
	*
	* @method fillrect
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー)
	* @params {String} [page] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @params {Number} [top] 描画上端位置。デフォルトで0
	* @params {Number} [left] 描画左端位置。デフォルトで0
	* @params {Number} [width] 横幅。デフォルトで100
	* @params {Number} [height] 縦幅。デフォルトで100
	* @params {String} [color] 塗りつぶす色。デフォルトで0xffffff
	* @params {Number} [opacity] 0〜255で不透明度を設定する。デフォルトで255
	*/
	fillrect: function(params) {
		this.stage.getLayerFromParams(params).fillRect(params);

		return 1;
	},

	/**
	* **画像の追加読み込み**
	*
	* 指定されたレイヤーに画像を追加読み込みします
	*
	* @method pimage
	* @params {String} storage 画像ファイル名
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー)
	* @params {Number} dy 重ねる画像の上端を対象のレイヤー上端から相対座標で指定します
	* @params {Number} dx 重ねる画像の左端を対象のレイヤー左端から相対座標で指定します
	* @params {String} [page] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @return {Number} 2
	*/
	pimage: function(params) {
		var self = this;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		if(this.almight.debug) console.time(params.storage + 'の読み込み時間'); // 画像の読み込み時間を計測

		this.stage.getLayerFromParams(params).loadPartialImage(params).then(function(){
			if(self.almight.debug) console.timeEnd(params.storage + 'の読み込み時間'); // 画像の読み込み時間を計測
			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // 画像の読み込みに失敗
		});

		return 2;
	},

	/**
	* **レイヤーの属性**
	*
	* 指定されたレイヤーの属性を設定します
	*
	* @method layopt
	* @params {String/Number} layer 0以上の整数(前景レイヤー) / message(currentで指定したレイヤー) / message[0-9](メッセージレイヤー)
	* @params {String} [page] "fore"または"back" 省略すると[current]で指定されたページが選択されます
	* @params {Boolean} [visible] レイヤーの表示状態を設定する
	* @params {Number} [top] レイヤーの上端位置を設定する
	* @params {Number} [left] レイヤーの左端を設定する
	* @params {Number} [opacity] レイヤーの不透明度を設定する。デフォルトは255(不透明)です
	* @return {Number} 1
	*/
	layopt: function(params) {
		this.stage.getLayerFromParams(params).setOptions(params);

		return 1;
	},

	/**
	* **レイヤー枚数を変更**
	*
	* メッセージレイヤー、前景レイヤーの枚数を変更します
	*
	* @method laycount
	* @params {Number} [layers] 前景レイヤーの数
	* @params {Number} [messages] メッセージレイヤーの数
	* @return {Number} 1
	*/
	laycount: function(params) {
		if(typeof params.layers === 'number') {
			this.almight.allocateLayers(params.layers);
		}
		if(typeof params.messages === 'number') {
			this.almight.allocateMessageLayers(params.messages);
		}

		return 1;
	},

	/**
	* **トランジションの実行**
	*
	* ステージをトランジションします
	*
	* @method trans
	* @params {Number} time トランジションする時間をミリ秒で指定します
	* @params {String} [method] "universal"(デフォルト)もしくは"crossfade"
	* @params {String} [rule] ユニバーサルトランジションに利用するルール画像のファイル名
	* @return {Number} 1
	* @example
		// ev001.jpgをベースレイヤーに読み込み、1秒かけてクロスフェードします
		[backlay]
		[image storage="ev000.jpg" layer="base" page="back"]
		[trans method="crossfade" time=1000]
		[wt]
	*/
	trans: function(params) {
		var self = this;

		if(this.stage.skipping || params.time <= 10) {
			// バックステージを表にクローン
			this.stage.layerCopy('fore');

			return 1;

		} else {
			if(params.rule !== undefined) {
				params.rule = Almight.Util.getPath(params.rule);
			}

			this.almight.stage.beginTransition(params).then(function(){
				self.almight.script.dequeue();

			}, function(e){
				throw e;
			});

			return 2;
		}
	},

	/**
	* **トランジションの終了を待つ**
	*
	* トランジションの終了を待ちます
	*
	* @method wt
	* @params {Boolean} [canskip=true] クリックでスキップ可能にするかどうか。デフォルトでtrue
	* @return {Number} 2
	*/
	wt: function(params) {
		var self = this;
		var canskip = (typeof params.canskip === 'boolean' ? params.canskip : true);

		// トランジション中でなければスルー
		if(!this.almight.stage.transitioning) {
			return 1;
		}

		this.almight.stage.trans.dfwt.then(function(){
			$(Almight).off('.transskip');
			self.almight.script.dequeue();

		}, function(e){
			throw e;
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.transskip').one('stageclick.transskip', function() {
				self.almight.stage.onTransitionCompleted();
			});
		}

		return 2;
	},

	/**
	* **トランジションの実行停止**
	*
	* トランジション中の場合、トランジションの実行を強制停止します
	*
	* @method stoptrans
	* @return {Number} 1
	*/
	stoptrans: function() {
		this.almight.stage.onTransitionCompleted();

		return 1;
	},

	/**
	* **レイヤーの移動アニメーション**
	*
	* 指定されたレイヤーをアニメーションで移動します
	* 移動アニメーションの終了は[wm]で待ってください
	*
	* @method move
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @params {String} [page] "fore"または"back" 省略するとforeが選択されます
	* @params {Number} time 時間をミリ秒で指定
	* @return {Number} 1
	*/
	move: function(params)  {
		var easing = 'linear';
		var layer = this.stage.getLayerFromParams(params);

		if(typeof params.accel === 'number') {
			if(params.accel === 1) easing = 'easeInSine';
			if(params.accel === 2) easing = 'easeInQuad';
			if(params.accel === 3) easing = 'easeInQuart';
			if(params.accel === 4) easing = 'easeInQuint';
			if(params.accel >= 5) easing = 'easeInExpo';
			if(params.accel === -1) easing = 'easeOutSine';
			if(params.accel === -2) easing = 'easeOutQuad';
			if(params.accel === -3) easing = 'easeOutQuart';
			if(params.accel === -4) easing = 'easeOutQuint';
			if(params.accel <= -5) easing = 'easeOutExpo';
		}

		// パスを計算
		var path_regexp = /\(\s*([\-0-9]+)\s*,\s*([\-0-9]+)\s*,\s*([\-0-9]+)\s*\)/;
		var b_path = $.trim(params.path);
		var path = [];
		var result;

		if(path_regexp.test(b_path)) {
			while(path_regexp.test(b_path)) {
				result = b_path.match(path_regexp);
				if(result.length === 4) {
					path.push([parseInt(result[1], 10), parseInt(result[2], 10), result[3] / 255]);
					b_path = b_path.replace(result[0], '');
				} else {
					Almight.error('[move] path属性の値が正しい形式になっていません');
				}
			}
		} else {
			Almight.error('[move] path属性の値が正しい形式になっていません');
		}

		for(var i=0;i<path.length;i++) {
			layer.animateQueue({
				x: path[i][0],
				y: path[i][1],
				opacity: path[i][2],
				easing: easing,
				duration: params.time
			});
		}

		layer.animateStart();

		return 1;
	},

	/**
	* **レイヤーのアニメーションを設定**
	*
	* 指定されたレイヤーに対してアニメーションを設定します
	* アニメーションは[animstart]で実行しない限り、開始されません
	* また、このタグを複数並べると前のアニメーションが完了後に連続で実行されます
	* アニメーションの終了は[wm]で待ってください
	*
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @method anim
	*/
	anim: function(params) {
		this.stage.getLayerFromParams(params).animateQueue(params);

		return 1;
	},

	/**
	* レイヤーのアニメーションを実行する
	*
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @method animstart
	*/
	animstart: function(params) {
		this.stage.getLayerFromParams(params).animateStart();

		return 1;
	},

	/**
	* レイヤーの移動・アニメーションの終了を待ちます
	*
	* @params {String/Number} layer base(背景レイヤー) / 0以上の整数(前景レイヤー) / message[0-9](指定したメッセージレイヤー)
	* @method wm
	*/
	wm: function(params) {
		if(params.layer === undefined) Almight.error('[wm] layer属性は必須です');

		if($(this.stage.getLayerFromParams(params).element).queue('fx').length === 0) return 1;

		var self = this;
		var canskip = (params.canskip === undefined ? false : params.canskip);

		$(this.stage.getLayerFromParams(params).element).one('animateEnd', function(){
			$(Almight).off('.animskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.animskip').one('stageclick.animskip', function() {
				$(self.stage.getLayerFromParams(params).element).transitionStop(true, true);
			});
		}

		return 2;
	},

/** ====================
 * BGM・SE操作
    ==================== */

	/**
	* **BGMの設定**
	*
	* BGMに関する設定を行います
	*
	* @method bgmopt
	* @params {Number} [volume] BGMの音量を0〜100で指定します。初期状態で100です
	* @return {Number} 1
	*/
	bgmopt: function(params) {
		if(typeof params.volume === 'number') params.volume /= 100;
		if(typeof params.gvolume === 'number') params.gvolume /= 100;

		this.almight.bgm.setOptions(params);

		return 1;
	},

	/**
	* **BGMの再生**
	*
	* BGMファイルを再生します
	*
	* @method playbgm
	* @params {String} storage BGMファイル名を指定します
	* @params {boolean} [loop] BGMをループするか指定します。省略するとtrueになります
	* @return {Number} 2
	*/
	playbgm: function(params) {
		var self = this;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		this.almight.bgm.setPlay(params).then(function(){
			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // BGMファイルの読み込みに失敗
		});

		return 2;
	},

	/**
	* **BGMの再生待ち**
	*
	* BGMの再生を最後まで待ちます
	* loopがtrueになっていたときは待ちません
	* スキップするとBGMは即時停止します
	*
	* @method wl
	* @params {Boolean} [canskip] クリックでスキップ可能にするかどうか。デフォルトでfalse
	* @return {Number} 2
	*/
	wl: function(params) {
		var canskip = (params.canskip === undefined ? false : params.canskip);

		// 再生していなければそのまま続行する
		if(!this.almight.bgm.playing) {
			return 1;
		}

		if(this.almight.bgm.loop) {
			return 1;
		}

		$(this.almight.bgm).one('ended', function(){
			$(Almight).off('.wlskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.wlskip').one('stageclick.wlskip', function() {
				self.almight.bgm.setStop();
				$(self.almight.bgm).triggerHandler('ended');
			});
		}

		return 2;
	},

	/**
	* **BGMの停止**
	*
	* 再生中のBGMを停止します
	*
	* @method stopbgm
	* @return {Number} 1
	*/
	stopbgm: function() {
		this.almight.bgm.setStop();

		return 1;
	},

	/**
	* **BGMのフェードイン再生**
	*
	* BGMファイルを無音状態からフェードインで再生します
	* フェードの終了はwbタグで待ってください
	*
	* @method fadeinbgm
	* @params {String} storage BGMファイル名を指定します
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @params {boolean} [loop] BGMをループするか指定します。省略するとtrueになります
	* @return {Number} 2
	*/
	fadeinbgm: function(params) {
		if(typeof params.time !== 'number') Almight.error('[fadeinbgm] time属性はNumberで必須です');

		var self = this;

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		this.almight.bgm.setPlay(params).then(function(){
			self.almight.bgm.fadeTo(0, null, params.time).done(function(){
				$(self.almight.bgm).off('fadeBgmSkip').triggerHandler('fadeBgmEnd');
			});

			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // BGMファイルの読み込みに失敗
		});

		// スキップ用処理
		$(this.almight.bgm).one('fadeBgmSkip', function() {
			self.almight.bgm.fadeSkip();
		});

		return 2;
	},

	/**
	* **BGMのフェードアウト停止**
	*
	* BGMをフェードアウトして停止します
	* フェードの終了はwbタグで待ってください
	*
	* @method fadeoutbgm
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @return {Number} 1
	*/
	fadeoutbgm: function(params) {
		var self = this;

		this.almight.bgm.fadeTo(null, 0, params.time).done(function(){
			self.almight.bgm.setStop();
			$(self.almight.bgm).off('fadeBgmSkip').triggerHandler('fadeBgmEnd');
		});

		// スキップ用処理
		$(this.almight.bgm).one('fadeBgmSkip', function() {
			self.almight.bgm.fadeSkip();
		});

		return 1;
	},

	/**
	* **BGMのフェード**
	*
	* 再生中のBGMを指定音量までフェードさせます
	* フェードの終了はwbタグで待ってください
	*
	* @method fadebgm
	* @params {Number} volume BGMの音量を0〜100で指定します。初期状態で100です
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @return {Number} 1
	*/
	fadebgm: function(params) {
		if(params.volume > 100 || 0 > params.volume) Almight.error('[fadebgm] volume属性は0〜100で必須です');
		if(typeof params.time !== 'number') Almight.error('[fadebgm] time属性はNumberで必須です');

		var volume = params.volume / 100;

		// フェードする
		this.almight.bgm.fadeTo(null, volume, params.time).done(function(){
			self.almight.bgm.setVolume(volume);
			$(self.almight.bgm).off('fadeBgmSkip').triggerHandler('fadeBgmEnd');
		});

		// スキップ用処理
		$(this.almight.bgm).one('fadeBgmSkip', function() {
			self.almight.bgm.fadeSkip();
		});

		return 1;
	},

	/**
	* **BGMのフェード待ち**
	*
	* BGMのフェード処理を最後まで待ちます
	*
	* @method wb
	* @params {Boolean} [canskip] クリックでスキップ可能にするかどうか。デフォルトでfalse
	* @return {Number} 2
	*/
	wb: function(params) {
		var self = this;
		var canskip = (typeof params.canskip === 'boolean' ? params.canskip : false);

		if(!this.almight.bgm.fading) {
			return 1;
		}

		$(this.almight.bgm).one('fadeBgmEnd', function() {
			$(Almight).off('.wbskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.wbskip').one('stageclick.wbskip', function() {
				self.almight.bgm.fadeSkip();
				$(self.almight.bgm).triggerHandler('fadeBgmSkip');
			});
		}

		return 2;
	},

	/**
	* **SEの設定**
	*
	* SEに関する設定を行います
	*
	* @method seopt
	* @params {Number} [volume] BGMの音量を0〜100で指定します。初期状態で100です
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 1
	*/
	seopt: function(params) {
		var buf = (typeof params.buf === 'number' ? params.buf: 0);
		if(typeof params.volume === 'number') params.volume /= 100;
		if(typeof params.gvolume === 'number') params.gvolume /= 100;

		this.almight.se[buf].setOptions(params);

		return 1;
	},

	/**
	* **SEの再生**
	*
	* SEファイルを再生します
	*
	* @method playse
	* @params {String} storage SEファイル名を指定します
	* @params {boolean} [loop] SEをループするか指定します。省略するとtrueになります
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 2
	*/
	playse: function(params) {
		var self = this;
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		this.almight.se[buf].setPlay(params).then(function(){
			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // SEファイルの読み込みに失敗
		});

		return 2;
	},

	/**
	* **SEの再生待ち**
	*
	* SEの再生を最後まで待ちます
	*
	* @method ws
	* @params {Boolean} [canskip] クリックでスキップ可能にするかどうか。デフォルトでfalse
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 2
	*/
	ws: function(params) {
		var canskip = (params.canskip === undefined ? false : params.canskip);
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		// 再生していなければそのまま続行する
		if(!this.almight.se[buf].playing) {
			return 1;
		}

		if(this.almight.se[buf].loop) {
			return 1;
		}

		$(this.almight.se[buf]).one('ended', function() {
			$(Almight).off('.wsskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.wsskip').one('stageclick.wsskip', function() {
				self.almight.se[buf].setStop();
				$(self.almight.se[buf]).triggerHandler('ended');
			});
		}

		return 2;
	},

	/**
	* **SEの停止**
	*
	* 再生中のSEを停止します
	*
	* @method stopse
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @params {String} [all] 全てのseを停止します。all=true,all="all",buf="all"
	* @return {Number} 1
	*/
	stopse: function(params) {
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		if(params.buf === 'all' || params.all === 'all' || params.all === true) {
			for(var i=0; i<almight.config.sound.seCount; i++) this.almight.se[i].setStop();
		}else{
			this.almight.se[buf].setStop();
		}

		return 1;
	},

	/**
	* **SEのフェードイン再生**
	*
	* SEファイルを無音状態からフェードインで再生します
	* フェードの終了はwfタグで待ってください
	*
	* @method fadeinse
	* @params {String} storage SEファイル名を指定します
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @params {boolean} [loop] SEをループするか指定します。省略するとtrueになります
	* @return {Number} 2
	*/
	fadeinse: function(params) {
		if(typeof params.time !== 'number') Almight.error('[fadeinse] time属性はNumberで必須です');

		var self = this;
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		// ファイルの実パスを取得
		if(params.storage !== undefined) {
			params.storage = Almight.Util.getPath(params.storage);
		}

		this.almight.se[buf].setPlay(params).then(function(){
			self.almight.se[buf].fadeTo(0, null, params.time).done(function(){
				$(self.almight.se[buf]).off('fadeSeSkip').triggerHandler('fadeSeEnd');
			});

			self.almight.script.dequeue();

		}, function(e){
			Almight.error(e); // SEファイルの読み込みに失敗
		});

		// スキップ用処理
		$(this.almight.se[buf]).one('fadeSeSkip', function() {
			self.almight.se[buf].fadeSkip();
		});

		return 2;
	},

	/**
	* **SEのフェードアウト停止**
	*
	* SEをフェードアウトして停止します
	* フェードの終了はwfタグで待ってください
	*
	* @method fadeoutse
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 1
	*/
	fadeoutse: function(params) {
		var self = this;
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		this.almight.se[buf].fadeTo(null, 0, params.time).done(function(){
			self.almight.se[buf].setStop();
			$(self.almight.se[buf]).off('fadeSeSkip').triggerHandler('fadeSeEnd');
		});

		// スキップ用処理
		$(this.almight.se[buf]).one('fadeSeSkip', function() {
			self.almight.se[buf].fadeSkip();
		});

		return 1;
	},

	/**
	* **SEのフェード**
	*
	* 再生中のSEを指定音量までフェードさせます
	* フェードの終了はwfタグで待ってください
	*
	* @method fadese
	* @params {Number} volume SEの音量を0〜100で指定します。初期状態で100です
	* @params {Number} time フェードする時間をミリ秒で指定します
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 1
	*/
	fadese: function(params) {
		if(params.volume > 100 || 0 > params.volume) Almight.error('[fadese] volume属性は0〜100で必須です');
		if(typeof params.time !== 'number') Almight.error('[fadese] time属性はNumberで必須です');

		var buf = (typeof params.buf === 'number' ? params.buf: 0);
		var volume = params.volume / 100;

		// フェードする
		this.almight.se[buf].fadeTo(null, volume, params.time).done(function(){
			self.almight.se[buf].setVolume(volume);
			$(self.almight.se[buf]).off('fadeSeSkip').triggerHandler('fadeSeEnd');
		});

		// スキップ用処理
		$(this.almight.se[buf]).one('fadeSeSkip', function() {
			self.almight.se[buf].fadeSkip();
		});

		return 1;
	},

	/**
	* **SEのフェード待ち**
	*
	* SEのフェード処理を最後まで待ちます
	*
	* @method wf
	* @params {Boolean} [canskip] クリックでスキップ可能にするかどうか。デフォルトでfalse
	* @params {Number} [buf] SEのバッファ番号を指定します。省略すると0とみなします
	* @return {Number} 0
	*/
	wf: function(params) {
		var self = this;
		var canskip = (typeof params.canskip === 'boolean' ? params.canskip : false);
		var buf = (typeof params.buf === 'number' ? params.buf: 0);

		if(!this.almight.se[buf].fading) {
			return 1;
		}

		$(this.almight.se[buf]).one('fadeSeEnd', function() {
			$(Almight).off('.wfskip');
			self.almight.script.dequeue();
		});

		// クリックでスキップするか
		if(canskip) {
			$(Almight).off('.wfskip').one('stageclick.wfskip', function() {
				self.almight.se[buf].fadeSkip();
				$(self.almight.se[buf]).triggerHandler('ended');
			});
		}

		return 2;
	},

/** ====================
 * レイヤー操作
    ==================== */

	/**
	* **if文の開始**
	*
	* if文を開始します
	* 式を評価して、trueならばelsifタグ、elseタグ、endifタグのいずれかまでシナリオを無視します
	*
	* @method if
	* @params {String} exp JavaScript
	* @return {Number} 1
	*/
	'if': function(params) {
		if(params.exp === undefined) Almight.error('[if] exp属性は必須です');

		var exp;

		if(this.almight.script.ifstate === true && this.almight.script.ifstack.indexOf(false) !== -1) {
			exp = false;
		} else {
			exp = (Almight.exec(params.exp) ? true : false);
		}
		this.almight.script.ifstack.unshift(exp);
		this.almight.script.ifstate = true;

		return 1;
	},

	/**
	* **ifの中身が実行されなかったときに実行**
	*
	* ifと対にして使います
	*
	* @method else
	* @return {Number} 1
	*/
	'else': function() {
		if(this.almight.script.ifstate === true && this.almight.script.ifstack.indexOf(false) !== -1) {
			this.almight.script.ifstack[0] = !this.almight.script.ifstack[0];
		} else {
			this.almight.script.ifstack[0] = null;
		}

		return 1;
	},

	/**
	* **elsif**
	*
	* ifと対にして使います
	*
	* @method elsif
	* @return {Number} 1
	*/
	'elsif': function(params) {
		if(params.exp === undefined) Almight.error('[elsif] exp属性は必須です');

		var exp;

		if(this.almight.script.ifstate === true && this.almight.script.ifstack.indexOf(false) !== -1) {
			exp = (Almight.exec(params.exp) ? true : false);
			this.almight.script.ifstack[0] = exp;
		} else {
			this.almight.script.ifstack[0] = null;
		}

		return 1;
	},

	/**
	* **if文の終了**
	*
	* if文を終了します
	*
	* @method endif
	* @return {Number} 1
	*/
	endif: function(params) {
		this.almight.script.ifstack.shift();

		if(this.almight.script.ifstack.length === 0) {
			this.almight.script.ifstate = false;
		}

		return 1;
	},

	/**
	* **ignore文の開始**
	*
	* ignore文を開始します
	* 式を評価して、trueならばendignoreタグのいずれかまでシナリオを無視します
	*
	* @method ignore
	* @params {String} exp JavaScript
	* @return {Number} 1
	*/
	ignore: function(params) {
		if(params.exp === undefined) Almight.error('[ignore] exp属性は必須です');

		var exp;

		exp = (Almight.exec(params.exp) ? true : false);

		this.almight.script.ifstack.unshift(!exp);
		this.almight.script.ifstate = true;

		return 1;
	},

	/**
	* **ignore文の終了**
	*
	* ignore文を終了します
	*
	* @method endignore
	* @return {Number} 1
	*/
	endignore: function(params) {
		this.almight.script.ifstack.shift();

		if(this.almight.script.ifstack.length === 0) {
			this.almight.script.ifstate = false;
		}

		return 1;
	},

	/**
	* **JavaScriptの評価**
	*
	* JavaScriptを評価(実行)します
	*
	* @method eval
	* @params {String} exp JavaScript
	* @return {Number} 1
	*/
	'eval': function(params) {
		Almight.exec(params.exp, true);

		return 1;
	},

	/**
	* **iscript文の開始**
	*
	* iscriptタグからendscriptまでの間を、JS式として評価します
	*
	* @method iscript
	* @return {Number} 1
	*/
	iscript: function(params) {
		Almight.exec(params.exp, true);

		return 1;
	},

	/**
	* **変数の表示**
	*
	* 変数をテキストとして表示します
	*
	* @method emb
	* @params {String} [exp] 表示させたい変数名
	* @return {Number} 1
	*/
	emb: function(params) {
		if(params.exp === undefined) Almight.error('[emb] exp属性は必須です');
		params.text = Almight.exec(params.exp);

		if(params.text === undefined || params.text === null) {
			params.text = '';
		} else {
			params.text = String(params.text);
		}

		return this._text_(params);
	},

	/**
	* **ゲーム変数をクリアする**
	*
	* ゲーム変数を全てクリアします
	* （f.〜〜 で始まる変数）
	*
	* @method clearvar
	* @return {Number} 1
	*/
	clearvar: function() {
		window.f = {};

		return 1;
	},

/** ====================
 * デバッグ
    ==================== */

	/**
	* **[デバッグ] コンソールにログを出力する**
	*
	* exp値を評価してコンソールにログとして出力します
	*
	* @method trace
	* @params {String} exp JavaScript
	* @return {Number} 1
	*/
	trace: function(params) {
		console.warn('[trace] : ' + Almight.exec(params.exp));

		return 1;
	},

	/**
	* **[デバッグ] ブレークポイントを設定する**
	*
	* このタグが呼び出された時、デバッガーはゲームの動作をブレークします
	*
	* @method debugger
	* @return {Number} 1
	*/
	'debugger': function() {
		debugger;

		return 1;
	}

};

	/**
	 * エイリアス
	 */

	// imageタグをimgでも利用可能に
	Almight.Tag.prototype.img = Almight.Tag.prototype.image;

	// elsifタグをelseifでも利用可能に
	Almight.Tag.prototype.elseif= Almight.Tag.prototype.elsif;
})();


(function(){
'use strict';

/**
* シナリオ関連の管理を行います  
* タグを実行したり、Almightタグオブジェクトの実行を行ないます
* 
* @class Script
*/

	Almight.Script = function(core) {
		this.scenario = {}; // 全てのシナリオ
		this.label = {}; // 全てのラベル
		this.scenario_name = ''; // 現在実行中のシナリオ名
		this.line = 0; // 現在実行中の行数
		this.stack = []; // 実行中のスタック
		this.callstack = []; // コールスタック
		this.macro = {}; // 記録されたマクロ
		this.macrostack = []; // マクロコールスタック
		this.ifstack = []; // if文スタック
		this.ifstate = false;

		this.almight = core;
		this.tag = this.almight.tag;
	};

	Almight.Script.prototype = {
		/**
		* コマンドラインからタグを実行出来ます。
		* JS式でタグを実行したり、デバッグに利用出来ます。
		* 複数のタグを指定しても、1つめのタグのみが実行されます。
		* @method command
		* @params {String} タグ
		* @params {Boolean} タグの結果に応じてシナリオを進行するかどうか
		* @return {Number} 0（停止） / 1（続行） / 2（非同期処理からの呼び出し） のステータス値を返します
		*/
		command: function(sce, dequeue) {
			sce = this.parser(sce);

			var ret = this.exec(sce[0]);
			if(ret === 1 && dequeue !== false) this.dequeue();
			return ret;
		},

		/**
		* スクリプトキューに追加
		* キューに追加されたタグオブジェクトは、dequeueされた時に優先して実行されます。
		* キューが空になると、通常のシナリオをロードします。
		* 通常は使用しません。
		* @method queue
		* @params {Object} タグオブジェクト
		*/
		queue: function(params) {
			this.stack.push(params);
		},

		/**
		* 現在のシナリオの実行を開始します。
		* 現在のシナリオは、this.scenario[this.scenario_name] になります。
		* scenarioプロパティにタグオブジェクト配列が入っていない場合などは、エラーになります。
		* また、stackプロパティにタグオブジェクトが入っていれば優先して実行されます。
		* （マクロを実行するとstackに展開されます。）
		* タグを実行して停止するか、シナリオの終端に達するとシナリオの実行が停止します。
		* @method dequeue
		*/
		dequeue: function() {
			// シナリオが存在しない場合はエラーをスロー
			if(this.scenario[this.scenario_name] === undefined) {
				throw 'この名前のシナリオデータはありません';
			}

			$(Almight).triggerHandler('exec');

			var continues = 0; // 続行フラグ
			this.almight.userwait = false;

			// スタックにタグオブジェクトが入っていれば優先して実行
			if(this.stack.length !== 0) {
				continues = this.exec(this.stack.shift());

			// 通常シナリオ実行
			} else if(this.line < this.scenario[this.scenario_name].length) {
				if(this.line < 0) this.line = 0;
				continues = this.exec(this.scenario[this.scenario_name][this.line]);
				this.line++;

			// シナリオの終端
			} else {
				continues = 0;
			}

			// 非同期処理を待つ
			if(continues === 2) {
				// async

			// 処理を続行する
			} else if(continues === 1) {
				this.dequeue();

			// 安定状態（Stable）になって停止
			} else if(continues === 0) {
				this.userWait();
			}
		},

		/**
		* シナリオの実行が停止（安定状態）になった時に呼び出されます。
		* @method userWait
		*/
		userWait: function() {
			this.almight.userwait = true;
			$(Almight).triggerHandler('userwait');
		},

		/**
		* タグオブジェクトを実行します。
		* ifブロックの処理やマクロの展開などの処理も行います。
		* @method exec
		* @params {Object} タグオブジェクト
		* @return {Number} 0（停止） / 1（続行） / 2（非同期処理からの呼び出し） のステータス値を返します
		*/
		exec: function(params) {
			var tag = $.extend(true, {}, params);
			var i;

			// ifブロックの状態を確認して実行
			if(this.ifstate === true && (this.ifstack.indexOf(false) !== -1 || this.ifstack.indexOf(null) !== -1)) {
				// if系特殊タグの場合は実行
				if(tag._type_ === 'if' || tag._type_ === 'else' || tag._type_ === 'elsif' || tag._type_ === 'endif' || tag._type_ === 'endignore') {
					return this.tag[tag._type_](tag);

				// if系特殊タグではなければスルー
				} else {
					return 1;
				}
			}

			// ignoretagにタグが登録されていたらそのタグを無視する
			if($.inArray(tag._type_, almight.config.ignoretag) !== -1) {
				if(this.almight.debug === 1) console.log('ignoretag ['+ tag._type_ +']',tag);
				return 1;
			}

			// 通常タグとしてタグオブジェクトを実行
			if(typeof this.tag[tag._type_] === 'function') {
				// スクリプトの属性値をチェック
				tag = this.replace(tag);

				// デバッグモードならログを出力
				if(this.almight.debug === 1 && tag._type_.charAt(0) !== '_' && tag._type_ !== 'trace') {
					console.log('['+ tag._type_ +']', tag);
				}

				// 実行して返す
				return this.tag[tag._type_](tag);

			// マクロとしてタグオブジェクトを実行
			} else if(typeof this.macro[tag._type_] === 'object') {
				// スクリプトの属性値をチェック
				tag = this.replace(tag);

				// マクロの実行がcondでスルーされたらそのまま戻す
				if(tag._type_ === '_void_') return 1;

				// マクロコールスタックに属性をpush
				this.macrostack.push({attr: tag, name: tag._type_});
				window.mp = tag;

				// マクロ情報をコンソールに出力
				if(this.almight.debug) {
					if(this.almight.debug >= 2) console.group('['+ tag._type_ +']');
					else console.groupCollapsed('['+ tag._type_ +']');
					console.log('['+ tag._type_ +']', tag);
				}

				this.stack.unshift({'_type_': '_endmacro_', 'name': tag._type_});

				for(i = this.macro[tag._type_].length - 1; i >= 0; i--) {
					this.stack.unshift(this.macro[tag._type_][i]);
				}

				return 1;

			// 存在しないタグ
			} else {
				//Almight.error('tagNotFound', tag._type_);
				console.error('tagNotFound', tag._type_);

				return 1;
			}
		},

		/**
		* タグオブジェクトの属性値を処理します。
		* cond属性があった場合、属性値に%や&があった場合、属性値にデフォルト設定（|）があれば展開します。
		* @method replace
		* @params {Object} タグオブジェクト
		* @return {Object} 正規化されたタグオブジェクト
		*/
		replace: function(params) {
			// _all_ 属性があれば全ての属性値を追加
			if(params._all_ === true) {
				params = $.extend(this.macrostack[0].attr, params);
			}

			var js = '';

			// cond属性の検査
			if(params.cond !== undefined) {
				if(!Almight.exec(params.cond)) {
					params._origin_ = params._type_;
					params._type_ = '_void_';
				}
			}

			// 属性値の検査
			for (var attr in params) {
				if(attr !== 'exp') {
					// 属性値に%があればマクロへ
					if(/^\%/.test(params[attr])) {
						params['%'+attr] = params[attr];
						js = String(params[attr]).replace(/^\%/, '&mp.');
						params[attr] = js;
					}

					// 省略形（｜）があれば
					if(/\|/.test(params[attr])) {
						js = params[attr];
						params['_'+attr] = js;

						// 分割してプロパティの存在確認
						js = js.split('|');
						if(js[0].charAt(0) === '&') js[0] = js[0].substring(1);

						try {
							js[0] = Almight.exec(js[0]);
						} catch(e) { js[0] = null; }

						// 存在しない
						if(js[0] === undefined || js[0] === null) {
							js = js[1];
							if(/^[\-\+]?[0-9\.]+$/.test(js) && !/^0[0-9]+./.test(js)) js = Number(js);
							else if(js === 'true') js = true;
							else if(js === 'false') js = false;

						} else {
							js = js[0];
						}
						params[attr] = js;
					}
				}

					// 属性値に&があれば置き換え
					if(/^\&/.test(params[attr])) {
						params['&'+attr] = params[attr];
						js = String(params[attr]).replace(/^\&/, '');
						params[attr] = Almight.exec(js);
					}

			}

			if('_all_' in params) delete params._all_;

			return params;
		},

		/**
		* スクリプトをパースして、タグオブジェクトを配列に格納して返します
		* @method perser
		* @params {String} スクリプトファイル
		* @return {Array} タグオブジェクトが格納された配列
		*/
		parser: function(sce) {
			var token = []; // トークン
			var iscript = []; // スクリプトを退避
			var html = []; // スクリプトを退避

			// コメントを削除（複数行）
			sce = sce.replace(/\/\*([\s\S]*?)\*\//ig, '');

			// スクリプト抽出で誤作動するので、コメントアウトされた iscript と endscript を削除
			sce = sce.replace(/(\/*|;*)[^\s\s](@iscript|\[iscript)/ig, '//');
			sce = sce.replace(/(\/*|;*)[^\s\s](@endscript|\[endscript)/ig, '//');

			// スクリプトだけ先に抽出しておく
			while (/(@iscript|\[iscript).*$([\s\S]+?)(@endscript|\[endscript).*$/m.test(sce)) {
				iscript.push(/(@iscript|\[iscript).*$([\s\S]+?)(@endscript|\[endscript).*$/m.exec(sce)[2]);
				sce = sce.replace(/(@iscript|\[iscript).*$[\s\S]+?(@endscript|\[endscript).*$/m, '@_script_ exp=' + (iscript.length - 1));
			}

			// HTMLだけ先に抽出しておく
			while (/(@html|\[html).*$([\s\S]+?)(@endhtml|\[endhtml).*$/m.test(sce)) {
				html.push(/(@html|\[html).*$([\s\S]+?)(@endhtml|\[endhtml).*$/m.exec(sce)[2]);
				sce = sce.replace(/(@html|\[html).*$[\s\S]+?(@endhtml|\[endhtml).*$/m, '@_html_ exp=' + (html.length - 1));
			}

			// 単一行に分割
			sce = sce.split(/[\n\r]/g);

			for (var i = 0; i < sce.length; i++) {
				// 行末の\を置換
				sce[i] = sce[i].replace(/\\$/, '');

				// ホワイトスペースをトリム
				//sce[i] = $.trim(sce[i]);
				sce[i] = sce[i].replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, ''); // 全角スペースはトリムしない

				// コメントを削除（空白文字を除く先頭に ; が存在する）
				if(/^\s*;|^\s*\/\//.test(sce[i])) {
					sce[i] = '';
				}

				// コメントを削除（//）
				// sce[i] = sce[i].replace(/\/\/(.*?)$/ig, ''); // http://とかも削除しちゃうので

				// 一行タグを正規化
				if(/^\s*@/.test(sce[i])) {
					sce[i] = '[' + $.trim(sce[i].replace(/^\s*@/, '')) + ']';
				}

				// ラベル検出
				if(/^\s*\*/.test(sce[i])) {
					var label = $.trim(sce[i]).substring(1).split('|');
					var id = label[0];
						// ラベル名がなければnullを代入
						if (label.length > 1) {
							label = label[1];
						} else {
							label = null;
						}
					if(id !== '' && (label !== null || label !== '')) {
						token.push({_type_: '_label_', id: id, name: label });
					}

					sce[i] = '';
				} // ラベル終了

				// この単一業にタグが存在するか検索
				var tags = true;

				do { // タグがあるか検出して、処理を繰り返す
					var search = sce[i].search(/\[/); // タグ検索
					var obj = {};

					// タグが存在すれば
					if(search !== -1) {
						// 行頭にタグがなければ、行頭からタグまでテキストとして処理
						if(search !== 0) {
							token.push({_type_: '_text_', text: sce[i].substring(0, search)});
							sce[i] = sce[i].substring(search);
						}

						// タグオブジェクト定義
						var _type_ = /^\[ *(.*?)[ \]]/.exec(sce[i])[1];
						sce[i] = sce[i].replace(/^\[(.*?)([ \]])/, function(str, p1, p2) {
							if (p2 === ']') return ']';
							else return '';
							});

						// タグ名はlowercaseにする
						obj._type_ = _type_.toLowerCase();
						var at = true;
						var val = '';

						// 属性検索
						while (at) {
							// アスタリスクは _all_ = true に置換
							if(/^\*/.test(sce[i])) {
								sce[i] = '_all_=true ' + sce[i].replace(/^\*/, '');
							}

						var attr = /^([_a-zA-Z0-9一-龠ぁ-んァ-ヴー]+)/.exec(sce[i]);
							// 属性はなし
							if (attr === null) {
							sce[i] = sce[i].replace(/(.*?)\]/, '');
							break;
							} else {
							// 属性発見
							attr = attr[1];

							sce[i] = sce[i].replace(/^[_a-zA-Z0-9一-龠ぁ-んァ-ヴー]+ *= */, '');

							// 値抽出
							val = /^"(((\\")|[^"])*?)"/.exec(sce[i]);
								if (val === null) {
								val = /^(.*?)[ \]]/.exec(sce[i]);
								sce[i] = sce[i].replace(val[1], '').replace(/^ */, '');
								} else {
								sce[i] = sce[i].replace(/^"(.*?)" */, '');
								}
							val = val[1];
							}

						// 属性を追加
						obj[attr] = val;
							if (sce[i].charAt(0) === ']') {
							sce[i] = sce[i].substring(1);
							at = false;
							}
						}

						// トークンにタグを追加
						token.push(obj);
						} else {
						// タグがなかったら残りは標準テキストにして終了
							if (sce[i] !== '' && sce[i] !== '\\') token.push({_type_: '_text_', text: sce[i]});
						tags = false;
						}

						// 空行なら終了
						if (sce[i] === '') {
						tags = false;
						}

					} while (tags);
			} // 単一行ここまで

			for (i = 0; i < token.length; i++) {
				// パラメータのキャスト
				$.each(token[i], function(key, val) {
					if (key !== '_type_' && key !== 'text' && key !== 'exp') {
						// 値をキャスト
						if(/^[\-\+]?[0-9\.]+$/.test(val) && !/^0[0-9]+./.test(val)) token[i][key] = Number(val);
						else if(val === 'true') token[i][key] = true;
						else if(val === 'false') token[i][key] = false;
					}
				});

				// 退避していたスクリプトを戻す
				if(token[i]._type_ === '_script_') {
					token[i].exp = iscript[token[i].exp];
					token[i]._type_ = 'iscript';
				}

				// 退避していたHTMLを戻す
				if(token[i]._type_ === '_html_') {
					token[i].exp = html[token[i].exp];
					token[i]._type_ = 'html';
				}
			}

			return token;
		},

		/**
		 * タグオブジェクト配列からラベルオブジェクトを生成して返します
		 * @method parseLabel
		 * @params {Array} タグオブジェクト配列
		 * @return {Object} ラベルオブジェクト
		 */
		parseLabel: function(token) {
			var label = {}, i;

			for (i = 0; i < token.length; i++) {
				// ラベル発見
				if (token[i]._type_ === '_label_') {
					label[String(token[i].id)] = {
					line: i,
					name: token[i].name
					};
				}
			}

			return label;
		},

		/**
		* スクリプトをロードします。
		* 既に読み込まれていた場合はキャッシュから読み込みます。
		* @method load
		* @params {String} スクリプトファイルのパスまたはファイル名
		*/
		load: function(src) {
			var df = $.Deferred();
			this.scenario_name = src;
			this.line = 0;

			// シナリオファイルがロード（パース済）か
			if(this.scenario_name in this.scenario) { 
				var self = this;
				setTimeout(function(){
					if(self.almight.debug) console.log('============================\nシナリオをロード: '+ self.scenario_name + ' (cache)\n============================');
					self = null;
					return df.resolve();
				}, 0);

				return df.promise();


			// シナリオファイルをロードしてパースする
			} else {
				var self = this;

				$.ajax({
					url: src,
					type: 'GET',
					dataType: 'text',
					cache: !this.almight.debug // デバッグモードならキャッシュからロードしない

				// リクエスト成功
				}).done(function(sce) {
					if(self.almight.debug) console.time('シナリオ解析時間');
					self.scenario[self.scenario_name] = self.parser(sce); // スクリプトをパース
					self.label[self.scenario_name] = self.parseLabel(self.scenario[self.scenario_name]); // ラベルをパース
					if(self.almight.debug) {
						console.log('============================\nシナリオをロード: '+self.scenario_name + '\n============================');
						console.timeEnd('シナリオ解析時間');
					}

					df.resolve();

				// リクエスト失敗
				}).fail(function(xhr, status) {
					df.reject(xhr, status);
				});

				return df.promise();
			}
		},

		// ダンプ出力する
		dump: function(){
			var json = $.extend(true, {}, {
				scenario_name: this.scenario_name,
				line: this.line,
				stack: this.stack,
				callstack: this.callstack,
				macrostack: this.macrostack,
				ifstack: this.ifstack,
				ifstate: this.ifstate
			});

			return json;
		},

		// リストアする
		restore: function(json){
			var self = this;

			this.load(json.scenario_name).done(function(){
				self.line = json.line;
				self.stack = json.stack;
				self.callstack = json.callstack;
				self.macrostack = json.macrostack;
				self.ifstack = json.ifstack;
				self.ifstate = json.ifstate;
			});
		}
	};
})();

(function(){
'use strict';

	Almight.Core = function() {
		this._slot = [];

		// レイヤー群
		this._back = {
			base: null,
			layers: [],
			messages: []
		};

		this._fore = {
			base: null,
			layers: [],
			messages: []
		};

		this.bgm = null;
		this.se = [];

		this.plugin = {};

		// AlmightStageクラス
		this.stage = null;

		this.userwait = false;

		// デバッグ
		this.debug = 0;

		// config拡張
		this.config = {
			fx: true,
			linkHoverColor: 'rgba(200, 200, 0, 0.4)',
			chspeed: {
				nowait: 0,
				nowaiting: false,
				actual: 'normal',
				tmp: 'normal'
			}
		};

		this.initialize.apply(this, arguments);
	};

	Almight.Core.prototype = {
		/**
		 * ### Almightのベース機能を扱うクラス
		 *
		 * Almightを初期化し、セーブ・ロード機能などのベース部分を扱います
		 * 
		 * @class Core
		 * @constructor
		 * @param {Object} config Almightコンフィグ（almight.config.jsを参照）
		 * @return {Deferred Object} Deferred’s Promise object
		 */
		initialize: function(config) {
			this.init = $.Deferred();
			var self = this;
			var i = 0;

			// 設定を上書き
			$.extend(true, this.config, config);
			this.debug = this.config.debug;

			// グローバル変数を作成
			window.f = {}, window.sf = {}, window.tf = {}, window.mp = {};

			// セーブデータ読み込み
			for(i=0;i<this.config.bookmarkCount;i++) {
				this._slot[i] = this.read('save' + i);
				if(typeof this._slot[i] === 'string') {
					var json = Base64.decode(this._slot[i]);
					json = decodeURIComponent(json);
					this._slot[i] = JSON.parse(json);
				}
			}

			this.systemLoad();

			// ゲームウィンドウのタイトルを設定
			document.title = this.config.title;

			// グローバルコンフィグを設定
			Almight.lang = this.config.language;
			Almight.resourcePath = this.config.resourcePath;

			// PCなら文字表示アニメーションをオン
			if(this.config.messages.animateTime <= 0) {
				this.config.messages.animateMobile = false;
			} else if(!Almight.Platform.mobile) {
				this.config.messages.animateMobile = true;
			}

			// ステージを作成
			this.stage = new Almight.Stage(this.config.container, this.config.width, this.config.height);

			// レイヤーを作成
			this.allocateBaseLayer();
			this.allocateLayers(this.config.layerCount);
			this.allocateMessageLayers(this.config.messageLayerCount);

			// カレントメッセージレイヤーを設定
			this.stage.setCurrentMessageLayer({ page:'fore' });

			// 初期状態でメッセージレイヤを表示するかどうか
			if(this.config.initialMessageLayerVisible) {
				this.stage.back.messages[0].setVisible(true);
				this.stage.fore.messages[0].setVisible(true);
			}

			// サウンド管理
			this.bgm = new Almight.Sound('bgm');

			for(i=0;i<this.config.sound.seCount;i++) {
				this.se[i] = new Almight.Sound('se' + i);
			}

			// タグハンドラを作成
			this.tag = new Almight.Tag(this);

			// スクリプト処理
			this.script = new Almight.Script(this);

			// node での終了処理
			if(typeof require === 'function') {
				var gui = require('nw.gui');
				gui.Window.get().on('close', function() {
					self.systemSave();
					this.close(true);
				});
			}

			$(window).on('beforeunload.systemSave', function(){
				self.systemSave();
			});

			// リサイズイベントに対応
			$(window).on('resize.resizeStage', function(){
				self.stage.resizeStage();
			}).trigger('resize');

			// プラグインを順番に読み込み
			var promises = [];
			var plugin_promise = $.Deferred();

			for(i=0;i<this.config.plugin.length;i++) {
				(function(i){
					$(Almight).queue('loadplugin', function() {
						self.plugin[self.config.plugin[i]] = new Almight.Plugin(self.config.plugin[i]);
						self.plugin[self.config.plugin[i]].done(function(){
							$(Almight).dequeue('loadplugin');
						}).fail(function(e){
							plugin_promise.reject(e);
						});
					});
				})(i);
			}

			$(Almight).queue('loadplugin', function() {
				plugin_promise.resolve();
			});

			promises.push(plugin_promise);

			// ファイルパスファイルを使うか
			if(this.config.filepath) {
				promises.push((function() {
					return $.ajax({
						url: Almight.resourcePath + '6a2a431fe8b621037ea949531c28551d',
						type: 'GET',
						dataType: 'text'

					}).done(function(filepath){
						if(filepath.charAt(0) !== '{') filepath = Base64.decode(filepath);
						Almight.filePath = JSON.parse(filepath);
					});
				})());
			}

			this.path = function() {
				return Almight.Util.getPath.apply(this, arguments);
			};

			// 初回ロード処理をまとめる
			$.when.apply($, promises).done(function(){
				self.init.resolve();

			}).fail(function(e){
				self.init.reject(e);
			});

			$(Almight).dequeue('loadplugin');

			// 10秒間隔でシステムセーブを走らせる
			var systemSaveTimer = setInterval(function(){
				self.systemSave();
			},10000);

			return this.init.promise();
		},

		/**
		 * **ゲームを終了します**
		 */
		exit: function() {
			// 一応システムセーブを行う
			this.systemSave();
			
			// ダイアログを表示せずに終了
			if(Almight.Platform.viewer) {
				Titanium.App.fireEvent('setExit');
			} else {
				window.close();
				location.href = 'about:blank';
			}
		},

		/**
		 * **ベースレイヤーを確保します**
		 *
		 * ベースレイヤーを表・裏生成してステージに追加します
		 * 
		 * @method allocateBaseLayer
		 */
		allocateBaseLayer: function() {
			this._fore.base = new Almight.GraphicLayer(this.config.width, this.config.height, 1 + 1);
			this._fore.base.setVisible(true);
			this._fore.base.type = 'base';
			this.stage.add(this._fore.base, 'fore', 'base');

			this._back.base = new Almight.GraphicLayer(this.config.width, this.config.height, 1);
			this._back.base.setVisible(true);
			this._back.base.type = 'base';
			this.stage.add(this._back.base, 'back', 'base');
		},

		/**
		 * **標準レイヤーを確保します**
		 *
		 * 標準レイヤーを枚数分、表・裏生成してステージに追加します
		 *
		 * @method allocateLayers
		 * @params {Number} count レイヤーの枚数
		 */
		allocateLayers: function(count) {
			var i = 0;

			if(this._fore.layers.length === count) {
				return false;
			}

			if(this._fore.layers.length > count) {
				// レイヤーを減らす
				for(i=(this._fore.layers.length-1);i>=count;i--) {
					this.stage.remove('fore', i);
					this._fore.layers[i] = null;
					this._fore.layers.splice(i, 1);
					this.stage.remove('back', i);
					this._back.layers[i] = null;
					this._back.layers.splice(i, 1);
				}
			} else {
				// レイヤーを増やす
				for(i=this._fore.layers.length;i<count;i++) {
					this._fore.layers[i] = new Almight.GraphicLayer(this.config.width, this.config.height, 10 + i + 1);
					this.stage.add(this._fore.layers[i], 'fore', i);
					this._back.layers[i] = new Almight.GraphicLayer(this.config.width, this.config.height, 10 + i);
					this.stage.add(this._back.layers[i], 'back', i);
				}
			}
		},

		/**
		 * **標準メッセージレイヤーを確保します**
		 *
		 * 標準メッセージレイヤーを枚数分、表・裏生成してステージに追加します
		 *
		 * @method allocateMessageLayers
		 * @params {Number} count レイヤーの枚数
		 */
		allocateMessageLayers: function(count) {
			var i = 0;
			if(this._fore.messages.length === count) {
				return false;
			}

			if(this._fore.messages.length > count) {
				// レイヤーを減らす
				for(i=(this._fore.messages.length-1);i>=count;i--) {
					this.stage.remove('fore', 'message' + i);
					this._fore.messages[i] = null;
					this._fore.messages.splice(i, 1);
					this.stage.remove('back', 'message' + i);
					this._back.messages[i] = null;
					this._back.messages.splice(i, 1);
				}

			} else {
				// レイヤーを増やす
				for(i=this._fore.messages.length;i<count;i++) {
					this._fore.messages[i] = new Almight.MessageLayer(this.config.width, this.config.height, 100 + i + 1, this.config.messages);
					this.stage.add(this._fore.messages[i], 'fore', 'message' + i);
					this._back.messages[i] = new Almight.MessageLayer(this.config.width, this.config.height, 100 + i, this.config.messages);
					this.stage.add(this._back.messages[i], 'back', 'message' + i);
				}
			}
		},

		/**
		 * **リンクにイベントをバインドする**
		 *
		 * [link] [button] [choices] タグで生成されたリンク群にイベントをバインドさせます
		 *
		 * @method buttonsEvent
		 */
		buttonsEvent: function() {
			$('.almight-link, .almight-button, .almight-choices').off('mouseover mouseout mousedown mouseup click tap');
			var self = this;

			$('.almight-link, .almight-button, .almight-choices').each(function(){
				$(this).on('mouseover', function(){
					// マウスオーバー時
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '-' + $(this).attr('data-width') * 2 + 'px 0');
					}
					if($(this).hasClass('almight-link')) {
						$(this).css('background-color', self.config.linkHoverColor);
					}

					if($(this).attr('data-enterse') !== undefined) {
						var buf = ($(this).attr('data-entersebuf') === undefined ? 0 : parseInt($(this).attr('data-entersebuf'), 10));
						self.se[buf].setPlay({storage: $(this).attr('data-enterse'), loop: false});
					}

					if($(this).attr('data-onenter') !== undefined) {
						$.globalEval($(this).attr('data-onenter'));
					}
					return false;

				}).on('mouseout', function(){
					// マウスアウト時
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '0 0');
					}
					if($(this).hasClass('almight-link')) {
						$(this).css('background-color', '');
					}

					if($(this).attr('data-leavese') !== undefined) {
						var buf = ($(this).attr('data-leavesebuf') === undefined ? 0 : parseInt($(this).attr('data-leavesebuf'), 10));
						self.se[buf].setPlay({storage: $(this).attr('data-leavese'), loop: false});
					}

					if($(this).attr('data-onleave') !== undefined) {
						$.globalEval($(this).attr('data-onleave'));
					}
					return false;

				}).on('mousedown', function(){
					// マウスダウン時
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '-' + $(this).attr('data-width') + 'px 0');
					}

					if($(this).attr('data-clickse') !== undefined) {
						var buf = ($(this).attr('data-clicksebuf') === undefined ? 0 : parseInt($(this).attr('data-clicksebuf'), 10));
						self.se[buf].setPlay({storage: $(this).attr('data-clickse'), loop: false});
					}
					return false;

				}).on('mouseup', function(){
					$(this).css('background-position', '0 0');
					return false;

				}).on('touchstart', function(){
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '-' + $(this).attr('data-width') + 'px 0');
					}
					if($(this).hasClass('almight-link')) {
						$(this).css('background-color', self.config.linkHoverColor);
					}
					if($(this).attr('data-clickse') !== undefined) {
						var buf = ($(this).attr('data-clicksebuf') === undefined ? 0 : parseInt($(this).attr('data-clicksebuf'), 10));
						self.se[buf].setPlay({storage: $(this).attr('data-clickse'), loop: false});
					}

				}).on('touchend', function(){
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '0 0');
					}
					if($(this).hasClass('almight-link')) {
						$(this).css('background-color', '');
					}

				}).on('click tap', function(){
					if($(this).attr('data-exp') !== undefined) {
						$.globalEval($(this).attr('data-exp'));
					}
					if($(this).hasClass('almight-button')) {
						$(this).css('background-position', '0 0');
					}
					if($(this).hasClass('almight-link')) {
						$(this).css('background-color', '');
					}

					var storage = $(this).attr('data-storage');
					var target = $(this).attr('data-target');

					// storage と target が指定されていない場合は、何度でもクリック可能
					if(storage !==undefined || target !== undefined){
						$('.almight-link, .almight-button, .almight-choices').off('mouseover mouseout mousedown mouseup click');
					}

					// choicesなら削除してからジャンプ
					if($(this).hasClass('ui-choices')) {
						$('#almight-choices-window').fadeOut('fast', function(){
							$('#almight-choices-window').remove();

							if(storage !== undefined || target !== undefined) {
								var jump = self.tag.jump({
									'storage': storage,
									'target': target
								});
								if(jump === 1) self.script.dequeue();
							}else{
								self.script.dequeue();
							}
						});

						return false;
					}

					// すぐジャンプ
					if(storage !== undefined || target !== undefined) {
						var jump = self.tag.jump({
							'storage': storage,
							'target': target
						});
						if(jump === 1) self.script.dequeue();
					}

					return false;
				});
			});
		},

		/**
		 * **セーブした日時を取得**
		 *
		 * セーブデータから、セーブした日時を取得します
		 *
		 * @method getBookmarkDate
		 * @param {Number} slot セーブスロット番号
		 * @return {String} セーブデータがあれば日時を、なければ空文字を返す
		 */
		getBookmarkDate: function(slot) {
			return (typeof this._slot[slot] === 'object' ? this._slot[slot].time : '');
		},

		/**
		 * **セーブした名前を取得**
		 *
		 * セーブデータから、セーブした名前を取得します
		 *
		 * @method getBookmarkName
		 * @param {Number} slot セーブスロット番号
		 * @return {String} セーブデータがあれば名前を、なければ空文字を返す
		 */
		getBookmarkName: function(slot) {
			return (typeof this._slot[slot] === 'object' ? this._slot[slot].name : '');
		},

		/**
		 * **セーブしたスクリーンショットを取得**
		 *
		 * セーブデータから、セーブしたスクリーンショットを取得します
		 *
		 * @method getBookmarkScreenshot
		 * @param {Number} slot セーブスロット番号
		 * @return {String} セーブデータがあればスクリーンショットをData URIで、なければ空文字を返す
		 */
		getBookmarkScreenshot: function(slot) {
			return (typeof this._slot[slot] === 'object' ? this._slot[slot].screenshot : '');
		},

		/**
		 * **セーブデータを取得**
		 *
		 * セーブデータを取得します
		 *
		 * @method getBookmark
		 * @param {Number} slot セーブスロット番号
		 * @return {Object} セーブデータがあればセーブデータオブジェクトを、なければnullを返す
		 */
		getBookmark: function(slot) {
			return (typeof this._slot[slot] === 'object' ? this._slot[slot] : null);
		},

		/**
		 * **セーブデータが存在するか確認する**
		 *
		 * セーブデータの存在確認をします
		 *
		 * @method getBookmarkExist
		 * @param {Number} slot セーブスロット番号
		 * @return {Boolean} セーブデータがあればtrueを、なければfalseを返す
		 */
		getBookmarkExist: function(slot){
			return (typeof this._slot[slot] === 'object' ? true : false);
		},

		/**
		 * **セーブを行う**
		 *
		 * 現在の状況をセーブします。ゲームがクリック待ちの状態になっていないと失敗します
		 *
		 * @method getBookmark
		 * @param {Number} slot セーブスロット番号
		 * @return {Boolean} 成功すればtrueを、失敗すればfalseを返す
		 */
		saveBookmark: function(slot) {
			// 念のためシステムセーブを走らせておく
			this.systemSave();

			// セーブ可能状態にないならfalse
			if(typeof slot !== 'number' || !this.userwait || this.config.bookmarkCount < slot) return false;

			var df = $.Deferred();
			var self = this;

			var name = $('.almight-message-layer').text().substring(0, 30);
			var i = 0;

			// 日付
			var date = new Date();
			var time = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes());

			var json = {
				f: $.extend(true, {}, window.f),
				name: name,
				time: time,
				screenshot: '',
				core: {
					clickWaiting: this.stage.clickWaiting,
					historyOutput: this.stage.historyOutput,
					historyEnabled: this.stage.historyEnabled,
					config: this.config
				},
				script: almight.script.dump(),
				base: {
					fore: null,
					back: null
				},
				layers: {
					fore: [],
					back: []
				},
				messages: {
					currentNum: this.stage.currentNum,
					currentPage: this.stage.currentPage,
					fore: [],
					back: []
				},
				bgm: {
					playing: this.bgm.playing,
					volume: this.bgm.volume,
					loop: this.bgm.loop,
					src: this.bgm.src
				},
				se: []
			};

			json.base.fore = this.stage.fore.base.dump();
			json.base.back = this.stage.back.base.dump();

			for(i=0;i<this.stage.fore.layers.length;i++) {
				json.layers.fore[i] = this.stage.fore.layers[i].dump();
				json.layers.back[i] = this.stage.back.layers[i].dump();
			}

			for(i=0;i<this.stage.fore.messages.length;i++) {
				json.messages.fore[i] = this.stage.fore.messages[i].dump();
				json.messages.back[i] = this.stage.back.messages[i].dump();
			}

			for(i=0;i<this.se.length;i++) {
				json.se[i] = {
					playing: this.se[i].playing,
					volume: this.se[i].volume,
					loop: this.se[i].loop,
					src: this.se[i].src
				};
			}

			json.stageWindow = $('#almight-choices-window').outerHTML();

			// html2canvasを利用してステージをcanvas化
			html2canvas(this.stage.element, {
				background: '#000',
				width: this.stage.width * 2,
				height: this.stage.height * 2,
				onrendered: function(stage) {
					var width = self.config.thumbMaxWidth;
					var height = ~~((self.config.thumbMaxWidth / self.stage.width) * self.stage.height);

					// 取得したスクリーンショットを縮小
					var canvas = $('<canvas/>').attr({
						width: width,
						height: height
					})[0];

					var context = canvas.getContext('2d');

					// 黒で塗りつぶし
					context.fillStyle = '#000000';
					context.fillRect(0, 0, width, height);

					context.drawImage(stage, 0, 0, width, height);

					df.resolve(canvas);
				}
			});

			// スクリーンショット取得完了
			df.done(function(canvas){
				json.screenshot = canvas.toDataURL();
				self._slot[slot] = json;
				json = JSON.stringify(json);
				json = encodeURIComponent(json);
				json = Base64.encode(json);

				// ストレージに書き込み
				self.write('save' + slot, json);
			});

			return df.promise();
		},

		/**
		 * **ロードを行う**
		 *
		 * セーブデータをロードします。ゲームがクリック待ちの状態になっていないと失敗します
		 *
		 * @method loadBookmark
		 * @param {Number} slot セーブスロット番号
		 * @return {Boolean} 成功すればtrueを、失敗すればfalseを返す
		 */
		loadBookmark: function(slot) {
			if(!this.userwait || this.config.bookmarkCount < slot) return false;

			// 読み込み
			var json = $.extend(true, {}, this._slot[slot]);

			// データがない
			if(json === undefined || Object.keys(json).length === 0) return false;

			//var json = JSON.parse(data);
			var i = 0;
			var self = this;

			$(Almight).triggerHandler('exec');

			$(this.stage.container).transition({opacity:0, duration:500, complete:function(){
				// BGM, SEを停止
				self.bgm.setStop();
				for(i=0;i<self.se.length;i++) {
					self.se[i].setStop();
				}

				// 選択肢を削除
				$(self.stage.element).children('div').not('.almight-layer, .almight-message-layer').hide();
				$('#almight-choices-window').remove();

				// クリック待ちを解除
				$(Almight).off('.clickwait');
				self.stage.clickWaiting = '';

				// 変数をリセット
				window.f = $.extend(true, {}, json.f);

				// コンフィグ
				self.config = $.extend(true, {}, json.core.config);

				// メッセージ履歴の設定を復元
				self.stage.historyOutput = json.core.historyOutput;
				self.stage.historyEnabled = json.core.historyEnabled;

				// レイヤーを初期化
				self.allocateLayers(0);
				self.allocateMessageLayers(0);

				self.allocateLayers(json.layers.fore.length);
				self.allocateMessageLayers(json.messages.fore.length);

				self.stage.fore.base.restore(json.base.fore);
				self.stage.back.base.restore(json.base.back);

				// 前景レイヤーを復元
				for(i=0;i<json.layers.fore.length;i++) {
					self.stage.fore.layers[i].restore(json.layers.fore[i]);
					self.stage.back.layers[i].restore(json.layers.back[i]);
				}

				// メッセージレイヤーを復元
				for(i=0;i<json.messages.fore.length;i++) {
					self.stage.fore.messages[i].restore(json.messages.fore[i]);
					self.stage.back.messages[i].restore(json.messages.back[i]);
				}

				// カレントメッセージレイヤーを設定
				self.stage.setCurrentMessageLayer({
					page: json.messages.currentPage,
					layer: 'message' + json.messages.currentNum
				});

				// BGMロード
				self.bgm.setVolume(json.bgm.volume);
				if(json.bgm.playing) {
					self.bgm.setPlay({
						storage: json.bgm.src,
						loop: json.bgm.loop
					});
				}

				// SEロード
				for(i=0;i<json.se.length;i++) {
					self.se[i].playing = json.se[i].playing;
					self.se[i].volume = json.se[i].volume;
					self.se[i].loop = json.se[i].loop;
					self.se[i].src = json.se[i].src;
					if(json.se[i].playing) {
						self.se[i].setPlay({
							storage: json.se[i].src,
							loop: json.se[i].loop
						});
					}
				}

				if(json.stageWindow !== undefined && json.stageWindow !== '') {
					$(self.stage.element).append(json.stageWindow);
				}

				// クリック待ち
				if(json.core.clickWaiting !== '' && json.core.clickWaiting !== false) {
					self.tag._clickwait_(json.core.clickWaiting);
				}

				// スクリプトをロード
				self.script.restore(json.script);

				// ボタン系イベントをとりなおし
				self.buttonsEvent();

				$(Almight).triggerHandler('loaded');

				$(self.stage.container).transition({opacity:1, duration:500});
			}});
		},

		/**
		 * **システムセーブを行う**
		 *
		 * システムデータをセーブします
		 *
		 * @method systemSave
		 */
		systemSave: function() {
			var json = JSON.stringify(window.sf);
			json = encodeURIComponent(json);
			json = Base64.encode(json);

			// ストレージに書き込み
			this.write('systemsave', json);
		},

		/**
		 * **システムロードを行う**
		 *
		 * システムデータをロードします
		 *
		 * @method systemLoad
		 */
		systemLoad: function() {
			var json = this.read('systemsave');

			// データがない
			if(json === undefined) {
				window.sf = {};

			} else {
				json = Base64.decode(json);
				json = decodeURIComponent(json);
				json = JSON.parse(json);
				window.sf = $.extend({}, json, true);
			}
		},

		/**
		 * **ファイルに書き込む**
		 *
		 * データをファイルに書き込みます
		 *
		 * @method write
		 * @param {String} key キー
		 * @param {String} value 値
		 */
		write: function(key, value) {
			localStorage[this.config.id +'_'+ key] = value;
		},

		/**
		 * **ファイルを読み込む**
		 *
		 * データをファイルから読み込みます
		 *
		 * @method read
		 * @param {String} key キー
		 * @return {String} value 値
		 */
		read: function(key) {
			var data = localStorage[this.config.id +'_'+ key];

			return data;
		}
	};
})();
