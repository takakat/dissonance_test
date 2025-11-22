// =========================================================
// experiment.js : Final Step (完成版)
// =========================================================

const jsPsych = initJsPsych({
    on_finish: function() {
        // 実験終了時にCSVをダウンロード（ローカル保存）
        // ※本番時はここを削除し、DataPipeのみにします
        jsPsych.data.get().localSave('csv', 'dissonance_experiment_data.csv');
    }
});

// ★DataPipe ID (本番用IDをここに入れる)
const DATAPIPE_ID = ""; 

let timeline = [];

// ---------------------------------------------------------
// 1. 設定・変数定義
// ---------------------------------------------------------

// 画像ファイルリスト (imgフォルダ内)
const stimuli_data = [
    { id: 'art_1', path: 'img/painting_05.jpg' },
    { id: 'art_2', path: 'img/painting_06.jpg' },
    { id: 'art_3', path: 'img/painting_07.jpg' }
];
const preload_images = stimuli_data.map(data => data.path);

// SD法尺度 (事前・事後共通)
const sd_scale = [
    { prompt: "醜い - 美しい", name: "beauty", labels: ["醜い", "2", "3", "4", "5", "6", "美しい"] },
    { prompt: "嫌い - 好き",   name: "like",   labels: ["嫌い", "2", "3", "4", "5", "6", "好き"] },
    { prompt: "悪い - 良い",   name: "good",   labels: ["悪い", "2", "3", "4", "5", "6", "良い"] },
    { prompt: "つまらない - 面白い", name: "interest", labels: ["つまらない", "2", "3", "4", "5", "6", "面白い"] }
];

// 事後評価で追加する質問「推奨意図」
const recommend_scale = [
    { prompt: "この作品を友人に勧めたいですか？", name: "recommend", labels: ["全く勧めない", "2", "3", "4", "5", "6", "強く勧める"] }
];

// 操作チェック用質問 (不快感・葛藤)
const manipulation_check_scale = [
    { prompt: "先ほどの文章作成課題を行っている時、「書きにくい」「不快だ」といった葛藤を感じましたか？", 
      name: "discomfort", 
      labels: ["全く感じなかった", "2", "3", "4", "5", "6", "強く感じた"] }
];

// 状態管理変数
let TARGET_DATA = { id: null, path: null, score: 100 };
let CONDITION = null; // 'A'(Positive), 'B'(Objective), 'C'(Control)

// ---------------------------------------------------------
// 2. 初期化 (Preload & Assignment)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychPreload,
    images: preload_images,
    message: '実験データを読み込み中...'
});

// 参加者ID生成
const subject_id = jsPsych.randomization.randomID(10);
jsPsych.data.addProperties({subject_id: subject_id});

// 群割り当て (本来はDataPipeで行うが、簡易的にランダム生成)
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '準備中...',
    trial_duration: 500,
    on_finish: function() {
        const r = Math.random();
        if (r < 0.33) CONDITION = 'A';
        else if (r < 0.66) CONDITION = 'B';
        else CONDITION = 'C';
        
        jsPsych.data.addProperties({ condition: CONDITION });
        console.log("Assigned Condition:", CONDITION);
    }
});

// ---------------------------------------------------------
// 3. Phase 1: 事前評価 (Pre-test)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>事前評価</h3>
            <p>これから表示される絵画の印象を直感的に評価してください。</p>
            <p>スペースキーで開始</p>
        </div>
    `
});

const pre_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" style="width:400px; margin-bottom:10px;">`;
        },
        questions: sd_scale,
        scale_width: 600,
        on_finish: function(data) {
            // スコア計算
            const vals = Object.values(data.response);
            let sum = 0; for(let v of vals) sum += v;
            
            data.phase = 'pre'; // ★事前データであることをタグ付け
            data.eval_score = sum / 4;
            data.img_id = jsPsych.evaluateTimelineVariable('id');
            data.img_path = jsPsych.evaluateTimelineVariable('path');
        }
    }],
    timeline_variables: stimuli_data,
    randomize_order: true
};
timeline.push(pre_evaluation_loop);

// ---------------------------------------------------------
// 4. ターゲット選定
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: 'データ処理中...',
    trial_duration: 500,
    on_finish: function() {
        // 事前評価データだけを抽出
        const all_data = jsPsych.data.get().filter({phase: 'pre'}).values();
        // スコアが低い順にソート
        all_data.sort((a, b) => a.eval_score - b.eval_score);
        
        if(all_data.length > 0){
            TARGET_DATA.id = all_data[0].img_id;
            TARGET_DATA.path = all_data[0].img_path;
            TARGET_DATA.score = all_data[0].eval_score;
            
            // 分析用にターゲット情報を全データに付与
            jsPsych.data.addProperties({ target_id: TARGET_DATA.id });
        }
    }
});

// ---------------------------------------------------------
// 5. Phase 2: 介入 (Writing Task)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychSurveyText,
    preamble: function() {
        let html = `<div style="margin-bottom: 20px;">`;
        
        // C群以外はターゲット画像を表示
        if (CONDITION !== 'C') {
            html += `<img src="${TARGET_DATA.path}" style="width:350px; border:1px solid #ccc;"><br>`;
        }
        
        html += `<h3 style="margin-top:15px;">記述課題</h3>`;
        
        if (CONDITION === 'A') { // 肯定
            html += `<p style="color:#0056b3; font-weight:bold;">この作品の「良い点・魅力的な点」を3つ挙げ、<br>友人に推薦する文章を書いてください。</p>`;
            html += `<p style="font-size:0.9em;">※自分がこの作品をとても気に入っているつもりで書いてください。</p>`;
        } 
        else if (CONDITION === 'B') { // 客観
            html += `<p style="color:#333; font-weight:bold;">この作品の「色使い・構図・描かれている対象」について、<br>客観的に解説する文章を書いてください。</p>`;
            html += `<p style="font-size:0.9em;">※個人的な感情は入れず、事実のみを記述してください。</p>`;
        } 
        else { // C: 統制
            html += `<div style="text-align:left; background:#f9f9f9; padding:10px; font-size:0.9em;">
                <p><strong>課題文:</strong> 生成AIの発展はクリエイティブ領域に変革をもたらし...</p>
            </div>`;
            html += `<p>上記の文章を要約してください。</p>`;
        }
        html += `</div>`;
        return html;
    },
    questions: [{ prompt: "", rows: 5, columns: 50, required: true, name: 'essay' }],
    button_label: '送信',
    on_finish: function(data) { data.phase = 'intervention'; }
});

// ---------------------------------------------------------
// 6. Phase 3: 操作チェック (A/B群のみ)
// ---------------------------------------------------------
const manip_check = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: '今の課題についてお伺いします。',
        questions: manipulation_check_scale,
        on_finish: function(data) { data.phase = 'manipulation_check'; }
    }],
    conditional_function: function() {
        // C群の場合はスキップ
        return CONDITION !== 'C';
    }
};
timeline.push(manip_check);

// ---------------------------------------------------------
// 7. Phase 4: 事後評価 (Post-test)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>事後評価</h3>
            <p>最後に、もう一度いくつかの絵画についてお伺いします。</p>
            <p>今のあなたの率直な印象を回答してください。</p>
            <p>スペースキーで開始</p>
        </div>
    `
});

const post_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" style="width:400px; margin-bottom:10px;">`;
        },
        // SD法 + 推奨意図(recommend_scale) を結合して提示
        questions: sd_scale.concat(recommend_scale), 
        scale_width: 600,
        on_finish: function(data) {
            // スコア計算 (SD法部分のみ)
            const res = data.response;
            // beauty, like, good, interest の4つを合計
            let sum = (res.beauty || 0) + (res.like || 0) + (res.good || 0) + (res.interest || 0);
            
            data.phase = 'post'; // ★事後データ
            data.eval_score = sum / 4;
            data.img_id = jsPsych.evaluateTimelineVariable('id');
            
            // ターゲット画像かどうかを記録（分析時に超便利）
            data.is_target = (data.img_id === TARGET_DATA.id);
        }
    }],
    timeline_variables: stimuli_data, // 事前と同じ画像セットを使う
    randomize_order: true
};
timeline.push(post_evaluation_loop);

// ---------------------------------------------------------
// 8. デブリーフィング & 終了
// ---------------------------------------------------------

// DataPipe送信 (IDがある場合のみ)
if(DATAPIPE_ID !== "") {
    timeline.push({
        type: jsPsychPipe,
        action: "save",
        experiment_id: DATAPIPE_ID,
        filename: `${subject_id}.csv`,
        data_string: ()=>jsPsych.data.get().csv()
    });
}


// ★修正: データを保存するための専用トライアルを追加
const save_data_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size:24px;">データを保存しています...</p>',
    trial_duration: 1000, // 1秒間表示
    on_finish: function() {
        // ここでCSVダウンロードを実行
        jsPsych.data.get().localSave('csv', 'dissonance_experiment_data.csv');
    }
};
timeline.push(save_data_trial);


// 最後の画面
const debriefing = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>実験終了：ご協力ありがとうございました</h3>
            <p><strong>研究の目的について</strong><br>
            事前説明では「言語表現の研究」とお伝えしましたが、実際には「自分の好みと異なる文章を書くことで、その対象への評価がどう変化するか（認知的不協和）」を調査する実験でした。</p>
            <p>意図的な隠蔽があったことをお詫び申し上げます。</p>
            <hr>
            <p style="color: red; font-weight: bold;">※自動的にデータ(CSVファイル)がダウンロードされます。</p>
            <p>ダウンロードを確認できたら、ブラウザを閉じて終了してください。</p>
        </div>
    `,
    choices: "NO_KEYS" // ここで止まる
};
timeline.push(debriefing);

// 実行
jsPsych.run(timeline);