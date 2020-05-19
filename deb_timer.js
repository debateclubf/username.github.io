/*
	deb_timer.js
	HIROE  2012
 */


/*
  デフォルトの時間フォーマットを設定する。
  3つの数字は、それぞれ立論・反駁・質疑・準備の時間（単位は分）
  どれか一つだけ有効にすること。
 */
var time_format = Array(6, 4, 3, 8); // JDA 大会などのフォーマット
//var time_format = Array(8, 5, 4, 10); // ESS の政策ディベートで多く用いられているフォーマット
//var time_format = Array(8, 4, 4, 10); // 1993年以前の KUEL や SIDT などで用いられていたフォーマット
//var time_format = Array(10, 5, 4, 10); // 1993年以前の NAFAT や TIDL などで用いられていたフォーマット
//var time_format = Array(9, 6, 4, 10); // 1993年以前の NAFAT-extra で一時用いられていたフォーマット。（NDT 準拠？）


// テーブルのサイズを設定。
var table_width = 480;
var table_height = 272;


// -----------------------------------------------
// クラスの定義
// -----------------------------------------------


/*
 １個のタイマー（カウンター）を表わすオブジェクト
 */
function OneTimer() {
    this.InitVal = 0; // 初期値
    this.Remain = 0; // 残り秒数
};

// 初期値を設定する。
OneTimer.prototype.SetInitVal = function(val)
{
    this.InitVal = val;
}

// 残り秒数を変化させる
OneTimer.prototype.Add = function(val)
{
    this.Remain += val;
    if (this.Remain <= 0) {
        this.Remain = 0;
    }
}

// 残り秒数を -1 する。
OneTimer.prototype.Decrement = function()
{
    if (this.Remain <= 0) {
        this.Remain = 0;
    }
    else {
        --this.Remain;
    }
}

// 残り秒数を返す
OneTimer.prototype.GetRemainSeconds = function()
{
    return this.Remain;
}

// 残り秒数を「分:秒」の形式の文字列に変換して返す
OneTimer.prototype.GetRemainSecondsString = function()
{
    var str = new String("");
    str += Math.floor(this.Remain / 60); // 分
    str += ":";
    var sec = this.Remain % 60;
    str += ("0"+sec).slice(-2);
    return str;
}

// 時間切れになったかどうか
OneTimer.prototype.IsTimeOver = function()
{
    return (this.Remain <= 0);
}

// 残り秒数を初期値に戻す。
OneTimer.prototype.Initialize = function()
{
    this.Remain = this.InitVal;
}


/*
  全タイマー及び表示エリアIDなどを一まとめにしたクラス
 */
function DebateTimer(area_ids, digit_ids, preloaded_images, bg_disp_id, button_ids, bg_colors)
{
    var doc = document;

    this.Doc = doc;
    this.DispBgObj = doc.getElementById(bg_disp_id); // 代表表示エリアの背景
    this.BgColors = bg_colors;
    this.PreloadedImages = preloaded_images;

    this.ActiveTimer = -1; // アクティブなタイマー（-1: どれも非アクティブ）
    this.DisplayedTimer = -1; // 代表画面に表示されるタイマー（-1:どれも非表示）

    var i;

    // タイマー及びオブジェクトの配列を生成
    var num = button_ids.length;
    this.Timers = new Array(num);
    this.AreaObjs = new Array(num);
    this.ButtonObjs = new Array(num);
    this.NoToTimeType = new Array(num);
    for (i = 0 ; i < num ; i++) {
        this.Timers[i]     = new OneTimer();
        this.AreaObjs[i]   = doc.getElementById(area_ids[i]);
        this.ButtonObjs[i] = doc.getElementById(button_ids[i]);
        this.NoToTimeType[i] = 0;
    }

    // 代表表示エリアの数字の各桁を表わすオブジェクトを生成
    num = digit_ids.length;
    this.DigitObjs = new Array(num);
    for (i = 0 ; i < num ; i++) {
        this.DigitObjs[i] = doc.getElementById(digit_ids[i]);
    }
};

// アクティブなタイマーを -val する。
DebateTimer.prototype.Decrement = function(val)
{
    if (this.ActiveTimer >= 0) {
        //this.Timers[this.ActiveTimer].Decrement();
        this.Timers[this.ActiveTimer].Add(-val);
        var str = this.Timers[this.ActiveTimer].GetRemainSecondsString();
        this.AreaObjs[this.ActiveTimer].value = str;
    }
}

// アクティブなタイマーを切り替える。-1 なら、どのタイマーも非アクティブ。-2 なら、大きく表示されているタイマーを on/off する。
DebateTimer.prototype.SwitchActiveTimer = function(no)
{
    if (no < -2 || this.Timers.length <= no) {
        return;
    }

    if (no == -2) {
        no = this.DisplayedTimer;
    }

    // 今までアクティブだったタイマーのボタンを“開始”に書き換える。
    if (this.ActiveTimer >= 0) {
        this.ButtonObjs[this.ActiveTimer].innerHTML = StrStartStop[0];
    }

    // 前回と異なるボタンか、no==-1 の場合は、タイマーストップ
    if (no == -1 || no == this.ActiveTimer) {
        // タイマーを非アクティブに。
        this.ActiveTimer = -1;
    }
    // それ以外なら、タイマースタート。
    else {
        // no番目のタイマーをアクティブに。
        this.ActiveTimer = no;
        // 表示するタイマーも同じ値に。
        this.DisplayedTimer = no;
        // 新たにアクティブになるタイマーのボタンを“停止”に書き換える。
        this.ButtonObjs[this.ActiveTimer].innerHTML = StrStartStop[1];
        // 背景色も変更。
        this.DispBgObj.style.backgroundColor = this.BgColors[no];
        // タイマーの値も表示
        this.Display();
    }
}

// 指定した番号のタイマーを増減する。値は画面に反映される。
DebateTimer.prototype.Add = function(no, val)
{
    if (0 <= no && no < this.Timers.length) {
        this.Timers[no].Add(val);
        var str = this.Timers[no].GetRemainSecondsString();
        this.AreaObjs[no].value = str;
        this.Display();
    }
}


// 指定したタイマーに対して、初期値を設定すると共に値を初期値に戻す。
DebateTimer.prototype.Initialize = function(no, val)
{
    if (0 <= no && no < this.Timers.length) {
        // 初期値を設定
        this.Timers[no].SetInitVal(val);
        // 初期値に戻す。
        this.Timers[no].Initialize();
        // 画面表示
        var str = this.Timers[no].GetRemainSecondsString();
        this.AreaObjs[no].value = str;
        this.Display();
    }
}

// 全部のタイマーを初期値に戻す。
DebateTimer.prototype.InitializeAll = function()
{
    if (window.confirm("本当に初期化しますか？")) {
        // タイマーを停める。
        this.SwitchActiveTimer(-1);
        var no;
        for (no = 0 ; no < this.Timers.length ; ++no) {
            // 初期値に戻す。
            this.Timers[no].Initialize();
            // 画面表示
            var str = this.Timers[no].GetRemainSecondsString();
            this.AreaObjs[no].value = str;
            this.Display();
        }
        // 代表表示エリアを初期化。
        this.InitLargeDispArea();
    }
}


// アクティブなタイマーが時間切れかどうか
DebateTimer.prototype.IsTimeOver = function()
{
    if (this.ActiveTimer >= 0) {
        return this.Timers[this.ActiveTimer].IsTimeOver();
    }
    else {
        return false;
    }
}


// 選択されているタイマーの値を代表表示エリアに表示する。
DebateTimer.prototype.Display = function()
{
    if (this.DisplayedTimer >= 0) {
        var str = this.Timers[this.DisplayedTimer].GetRemainSecondsString();
        var ent = str.split(":");

        // コロンなしの「分秒」文字列を生成。さらに、分が一桁の場合は先頭に "*" を追加。
        var min_sec_str = ("*" + ent[0] + ent[1]).slice(-4);

        // 各桁を表示する。
        for (var i = 0 ; i < min_sec_str.length ; i++) {
            var digit_str = min_sec_str.substr(i, 1);
            if (digit_str == "*") {
                this.DigitObjs[i].style.visibility= 'hidden'; // その桁は非表示
            }
            else {
                this.DigitObjs[i].style.visibility= 'visible'; // その桁は表示
                var digit = parseInt(digit_str);
                this.DigitObjs[i].src = this.PreloadedImages[digit].src;
            }
        }
    }
}


// 指定したタイマーに対して初期値を設定する。2番目の引数の意味は、以下の通り：
// 0:立論の時間を使用   1:反駁の時間を使用   2:質疑応答の時間を使用   3:準備の時間を使用
// no = -1 とすると、SelectedTimer を初期化する。
DebateTimer.prototype.SetInitVal = function(no, time_type)
{
    if (no < -1 || this.Timers.length <= no) return;

    if (no >= 0) {
        // no = -1 で呼び出したときに備え、no と time_type との対応テーブルを作成しておく。
        this.NoToTimeType[no] = time_type;
        // no に対応したタイマーに値をセット。
        var obj = this.Doc.format_select;
        switch (time_type) {
        case 0:
            var idx = obj.minutes_const.selectedIndex;
            var min = obj.minutes_const.options[idx].value;
            this.Initialize(no, min * 60);
            break;
        case 1:
            var idx = obj.minutes_reb.selectedIndex;
            var min = obj.minutes_reb.options[idx].value;
            this.Initialize(no, min * 60);
            break;
        case 2:
            var idx = obj.minutes_exam.selectedIndex;
            var min = obj.minutes_exam.options[idx].value;
            this.Initialize(no, min * 60);
            break;
        case 3:
            var idx = obj.minutes_prep.selectedIndex;
            var min = obj.minutes_prep.options[idx].value;
            this.Initialize(no, min * 60);
            break;
        default:
            break;
        }
    }
    else {
        // no = -1 なら、真の no と time_type を取得してから再起呼び出し。
        no = this.DisplayedTimer;
        if (no >= 0) {
            time_type = this.NoToTimeType[no];
            this.SetInitVal(no, time_type);
        }
    }
}


// [+] [-]ボタンが押されたときに、指定したタイマーの値を増減する。
// 2番目の引数の意味は、0:プラス   1:マイナス
DebateTimer.prototype.ChangeVal = function(no, plus_minus)
{
    if (no < 0 || this.Timers.length <= no) return;

    var obj = this.Doc.format_select;
    var idx = obj.step_seconds.selectedIndex;
    var val = parseInt(obj.step_seconds.options[idx].value);
    switch (plus_minus) {
    case 0:
        this.Add(no, val);
        break;
    case 1:
        this.Add(no, -val);
        break;
    default:
        break;
    }
}


// 代表表示エリアを 0:00 かつ白背景に初期化。
// 全タイマーが非アクティブのときのみ動作。
DebateTimer.prototype.InitLargeDispArea = function()
{
    if (this.ActiveTimer == -1) {
        // どのタイマーも代表表示エリアには表示しない。
        this.DisplayedTimer = -1;

        // 表示を 00:00 に。
        for (var i = 0 ; i < this.DigitObjs.length ; i++) {
            this.DigitObjs[i].style.visibility= 'visible'; // その桁は表示
            this.DigitObjs[i].src = this.PreloadedImages[0].src;
        }
        // コロンも表示する。
        this.Doc.getElementById("digit_separator").src = this.PreloadedImages[10].src;
        // 背景色も変更。
        this.DispBgObj.style.backgroundColor = "ffffff";
    }
}


// -----------------------------------------------
// 関数の定義
// -----------------------------------------------



/*
 定期的に呼ばれる関数
 */
function UpdateTimer()
{
    // 現在時刻を表示する。
    var date = new Date();
    var str = ("0"+date.getHours()).slice(-2) + ":";
    str += ("0"+date.getMinutes()).slice(-2) + ":";
    str += ("0"+date.getSeconds()).slice(-2);
    obj_time_now.value = str;

    var total_time = parseInt(date.getTime() / 1000); // 1970年からの経過時間
    if (begin_time < 0) {
        begin_time = total_time - 1;
    }

    // 経過時間とコールの回数との差分を計算する。（正の場合は、遅延が発生している。）
    var delay = total_time - begin_time - call_count;

    // タイマーを減少
    debate_timer.Decrement(delay);
    // 呼ばれた回数を変更
    call_count += delay;

    // 代表数字エリアに表示。
    if (debate_timer.ActiveTimer >= 0) {
        debate_timer.Display();
    }

    // 時間切れかどうかをチェック
    if (debate_timer.IsTimeOver()) {
         //alert('Time up!');
         // 音を出す
         var obj = doc.getElementById("play_sound");
         obj.play();
    }
}



// -----------------------------------------------
// グローバル変数の設定
// -----------------------------------------------


var doc = document;

// 現在時刻表示欄のオブジェクトを取得
var obj_time_now = doc.getElementById("timer_now");


// 表示エリアのIDからなる配列
var AreaIds = new Array("timer_const", "timer_exam", "timer_reb",
                        "timer_aff", "timer_neg");

// 背景エリアのIDからなる配列
var BgAreaIds = new Array("bg_const", "bg_exam", "bg_reb",
                          "bg_aff", "bg_neg", "bg_now");

// Start/Stop ボタンの ID からなる配列
var ButtonIds = new Array("start_const", "start_exam", "start_reb",
                          "start_aff", "start_neg");

// 背景色かならる配列
var BgColors = new Array("#fffff0", "#f0ffff", "#fff0ff", "#d0d0ff",
                         "#ffd0d0", "#d0ffd0", "#e0e0e0");

// スタート/ストップボタンに書いてある文字
var StrStartStop = new Array("開始", "停止");
//var StrStartStop = new Array("Start", "Stop");

// 「画面に合わせる」ボタンに書いてある文字
var StrFitScreen = new Array("画面に合わせる", "元に戻す");


// 代表表示画面の数字の各桁の ID
var DigitIds = new Array("digit_min10", "digit_min01", "digit_sec10", "digit_sec01");

// 代表表示画面に表示する数字のタイプ
var digit_prefix = "7seg_"; // 7セグメント形式


// プリロード画像のオブジェクトを生成する。
var PreloadedImages = new Image(11);
for (var i = 0 ; i < 11 ; i++) {
    var filename = (i < 10) ? (digit_prefix + i + ".png") : (digit_prefix + "colon.png");
    PreloadedImages[i] = new Image();
    PreloadedImages[i].src = filename;
}


// タイマーのオブジェクトを生成。
var debate_timer = new DebateTimer(AreaIds, DigitIds, PreloadedImages, "bg_disp_time", ButtonIds, BgColors);


// UpdateTimer() を呼んだ回数を格納する変数
var call_count = 0;
// 初めて UpdateTimer() を呼んだときの時刻（1970年からの経過秒）を格納する変数
var begin_time = -1;



/*
  フォームの初期値などを設定
 */

document.getElementById("id_table").style.width = "" + table_width + "px";
document.getElementById("id_table").style.height = "" + table_height + "px";




// 立論・反駁などの時間を設定する。
with (doc.format_select) {
    minutes_const.selectedIndex = time_format[0] - 1;
    minutes_reb.selectedIndex   = time_format[1] - 1;
    minutes_exam.selectedIndex  = time_format[2] - 1;
    minutes_prep.selectedIndex  = time_format[3] - 1;
    step_seconds.selectedIndex = 3;
}


debate_timer.SetInitVal(0, 0);
debate_timer.SetInitVal(1, 2);
debate_timer.SetInitVal(2, 1);
debate_timer.SetInitVal(3, 3);
debate_timer.SetInitVal(4, 3);


// Start/Stop ボタンの表示を「開始」に。
for (var i = 0 ; i < ButtonIds.length ; i++) {
    var obj = doc.getElementById(ButtonIds[i]);
    obj.innerHTML = StrStartStop[0];
}


// 背景エリアの背景色も設定する。
for (var i = 0 ; i < BgAreaIds.length ; i++) {
    var bg_color = BgColors[i];
    var obj = doc.getElementById(BgAreaIds[i]);
    obj.style.backgroundColor = bg_color;
}
// 代表表示エリアも初期化。
debate_timer.InitLargeDispArea();

// 時間割り込み間隔を 1000[ms] に設定
setInterval(UpdateTimer, 1000);
