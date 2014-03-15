/**
 * ゲームの基本設定
 */
var almight = {
	// ゲームID（セーブデータの識別に必要なので、必ずオリジナルのIDを設定してください）
	id: 'jp.almight.template',

	// ゲームタイトル
	title: 'Almight Game Engine',

	// ゲームの幅
	width: 1024,

	// ゲームの縦幅
	height: 768,

	// 前景レイヤーの枚数
	layerCount: 8,

	// メッセージレイヤーの枚数
	messageLayerCount: 2,

	// 初期状態でメッセージレイヤを表示するかどうか
	initialMessageLayerVisible: true,

	// 言語設定
	language: ['ja'],

	// デバッグモードの切り替え
	debug: 1,

	// Almightプラグイン
	plugin: [
		'blue-ui.html', // ナビゲーションバーや各種UI部品を追加（青テーマ）
		'history.html', // メッセージ履歴機能を追加
		'save.html', // セーブ画面を追加
		'load.html', // ロード画面を追加
		'setting.html', // 環境設定画面を追加
		//'title.html', // タイトル画面を追加
		//'cgmode.html', // CGモードを追加
		//'scene.html', // 回想モードを追加
		'sidebar.html' // サイドバー機能を追加
	],

	// 無視するタグ
	ignoretag: [],

	// 利用可能なセーブスロット数
	bookmarkCount: 12,

	// サムネイルの保存サイズ。横幅を基準に縦幅は同じ縦横比で計算されます
	thumbMaxWidth: 200,

	// filepathファイルを使うか
	filepath: false,

	// コンテナ
	container: 'almight-container'
};

/**
 * 前景レイヤー設定
 */

almight.position = {
	// 前景レイヤの左右中心位置指定
	left: almight.width / 4,
	right: (almight.width / 2) + (almight.width / 4),
	center: almight.width / 2,
	left_center: (almight.width / 4) + 100,
	right_center: ((almight.width / 2) + (almight.width / 4)) - 100
};

// 前景レイヤの左右中心位置指定のショートカット
almight.position.l = almight.position.left;
almight.position.r = almight.position.right;
almight.position.c = almight.position.center;
almight.position.lc = almight.position.left_center;
almight.position.rc = almight.position.right_center;

/**
 * メッセージレイヤー設定
 */
almight.messages = {
	// メッセージ枠用の画像
	// '' を指定するとメッセージ枠の画像を使用しません
	frameGraphic: '',

	// メッセージレイヤの色と不透明度
	// メッセージ枠用の画像が指定されている場合は無効になります
	frameColor: '#000000', // position タグの color 属性に相当
	frameOpacity: 128, // position タグの opacity 属性に相当

	// 左右上下マージン
	// position タグの marginl, maringt, marginr, marginb 属性に対応します
	marginl: 24,
	margint: 20,
	marginr: 6,
	marginb: 24,

	// 初期位置
	left: 60, // 左端位置
	top: 600-128-64, // 上端位置
	width: 800-60,
	height: 240,

	deffont: {
		// フォントサイズ
		size: 20, // deffont タグの size 属性に相当

		// フォント
		face: '"Hiragino Kaku Gothic ProN", Meiryo, sans-serif', // deffont タグの face 属性に相当

		// フォントカラー
		color: '#ffffff', // deffont タグの color 属性に相当

		// 文字をボールドにするか
		bold: false, // deffont タグの bold 属性に相当

		// 影の色
		shadowcolor: '#000000', // deffont タグの shadowcolor 属性に相当

		// 影を描画するか
		shadow: true, // deffont タグの shadow 属性に相当

		// 影の表示位置
		shadowpos: '1px 1px 3px' // deffont タグの shadowpos 属性に相当
	},

	defstyle: {
		// 行間
		lineheight: 5, // defstyle タグの lineheight 属性に相当

		// 字間
		pitch: 0, //  defstyle タグの pitch 属性に相当

		// 文字揃え
		align: 'left'
	},

	// 文字表示アニメーションの表示方法を設定します
	// animateBeginからanimateEndに向かって、パラメータを変化させながら文字表示を行います
	// nowaitに設定されているときはアニメーションを行いません
	//
	// 注意: 実験的な機能です
	animateBegin: {
		opacity: 0
		// scale: 0,
		// rotate: -180
	},

	animateEnd: {
		opacity: 1
		// scale: 1,
		// rotate: 0
	},
	animateTime: 0, // 200,

	// モバイル環境でも文字表示アニメーションを行うかどうか
	// (端末によって、文字表示がスムーズに行えなくなる場合があります)
	animateMobile: false
};

/**
 * 文字表示スピード設定
 */
almight.chspeed = {
	fast: 20,
	normal: 40,
	slow : 60
};

/**
 * サウンド設定
 */
almight.sound = {
	seCount: 5
};

/**
 * その他、高度な設定
 */

// リソースフォルダまでの相対パス
almight.resourcePath = '../game/';

