// =========================================================
// experiment.js : 上下分割・テキスト復元版
// =========================================================

const jsPsych = initJsPsych({
    on_finish: function() { }
});

// ★DataPipe ID
const DATAPIPE_ID = ""; 

let timeline = [];

// ---------------------------------------------------------
// 1. 設定・変数定義
// ---------------------------------------------------------

// 画像ファイルリスト
const stimuli_data = [
    { id: 'art_1', path: 'img/painting_01.jpg' },
    { id: 'art_2', path: 'img/painting_02.jpg' },
    { id: 'art_3', path: 'img/painting_03.jpg' }
];
const preload_images = stimuli_data.map(data => data.path);

// SD法尺度 (定義後シャッフル)
const sd_scale_source = [
    // [評価性]
    { prompt: "醜い - 美しい",   name: "beauty",   labels: ["醜い", "2", "3", "4", "5", "6", "美しい"] },
    { prompt: "嫌い - 好き",     name: "like",     labels: ["嫌い", "2", "3", "4", "5", "6", "好き"] },
    { prompt: "悪い - 良い",     name: "good",     labels: ["悪い", "2", "3", "4", "5", "6", "良い"] },
    { prompt: "つまらない - 面白い", name: "interest", labels: ["つまらない", "2", "3", "4", "5", "6", "面白い"] },
    // [活動性]
    { prompt: "静的 - 動的",     name: "dynamic",  labels: ["静的", "2", "3", "4", "5", "6", "動的"] },
    { prompt: "弱い - 強い",     name: "strong",   labels: ["弱い", "2", "3", "4", "5", "6", "強い"] },
    { prompt: "地味な - 派手な", name: "showy",    labels: ["地味な", "2", "3", "4", "5", "6", "派手な"] },
    // [明るさ]
    { prompt: "暗い - 明るい",   name: "bright",   labels: ["暗い", "2", "3", "4", "5", "6", "明るい"] },
    { prompt: "寂しい - 楽しい", name: "fun",      labels: ["寂しい", "2", "3", "4", "5", "6", "楽しい"] },
    { prompt: "冷たい - 暖かい", name: "warm",     labels: ["冷たい", "2", "3", "4", "5", "6", "暖かい"] },
    // [やわらかさ]
    { prompt: "固い - 柔らかな", name: "soft",     labels: ["固い", "2", "3", "4", "5", "6", "柔らかな"] },
    { prompt: "緊張した - ゆるんだ", name: "loose", labels: ["緊張した", "2", "3", "4", "5", "6", "ゆるんだ"] }
];
const sd_scale = jsPsych.randomization.shuffle(sd_scale_source);

// 操作チェック
const manipulation_check_scale = [
    { prompt: "先ほどの文章作成課題を行っている時、「書きにくい」「不快だ」といった葛藤を感じましたか？", 
      name: "discomfort", 
      labels: ["全く感じなかった", "2", "3", "4", "5", "6", "強く感じた"] }
];

let TARGET_DATA = { id: null, path: null, score: 100 };
let CONDITION = null; 

// ---------------------------------------------------------
// 2. 初期化
// ---------------------------------------------------------
timeline.push({
    type: jsPsychPreload,
    images: preload_images,
    message: 'データを読み込み中...'
});

const subject_id = jsPsych.randomization.randomID(10);
jsPsych.data.addProperties({subject_id: subject_id});

// 群割り当て
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '実験の準備中...',
    trial_duration: 500,
    on_finish: function() {
        const r = Math.random();
        if (r < 0.33) CONDITION = 'A';
        else if (r < 0.66) CONDITION = 'B';
        else CONDITION = 'C';
        jsPsych.data.addProperties({ condition: CONDITION });
        console.log("Condition:", CONDITION);
    }
});

// ---------------------------------------------------------
// 3. Phase 1: 事前評価
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>Phase 1: 事前評価</h3>
            <p>これからいくつかの絵画が表示されます。</p>
            <p>画面上部に表示される絵画を見ながら、直感的に印象を評価してください。</p>
            <p>スペースキーを押して開始してください。</p>
        </div>
    `
});

const pre_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        // ★ここに「上下固定レイアウト」のクラスを適用
        css_classes: ['sticky-top-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" class="fixed-img">`;
        },
        questions: sd_scale,
        scale_width: 600,
        on_finish: function(data) {
            const res = data.response;
            let sum = (res.beauty||0) + (res.like||0) + (res.good||0) + (res.interest||0);
            data.phase = 'pre'; 
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
    stimulus: 'データ保存中...',
    trial_duration: 500,
    on_finish: function() {
        const all_data = jsPsych.data.get().filter({phase: 'pre'}).values();
        all_data.sort((a, b) => a.eval_score - b.eval_score);
        
        if(all_data.length > 0){
            TARGET_DATA.id = all_data[0].img_id;
            TARGET_DATA.path = all_data[0].img_path;
            TARGET_DATA.score = all_data[0].eval_score;
            jsPsych.data.addProperties({ target_id: TARGET_DATA.id });
        }
    }
});

// ---------------------------------------------------------
// 5. Phase 2: 介入 (記述課題)
// ---------------------------------------------------------
// ※ここも画像を見ながら行うため、上下固定レイアウトを適用します
timeline.push({
    type: jsPsychSurveyText,
    css_classes: ['sticky-top-layout'], // 画像固定クラス適用
    
    preamble: function() {
        let html = `<div>`;
        if (CONDITION !== 'C') {
            // C群以外はターゲット画像を表示
            html += `<img src="${TARGET_DATA.path}" class="fixed-img"><br>`;
        } else {
            // C群は画像なし（またはダミー）
            html += `<div style="height:50px;"></div>`; 
        }
        
        html += `<div style="text-align:left; max-width:800px; margin:20px auto;">`;
        html += `<h3>記述課題</h3>`;
        
        if (CONDITION === 'A') { 
            html += `<p style="color:#0056b3; font-weight:bold;">この作品の「良い点・魅力的な点」を3つ挙げ、<br>友人に推薦する文章を書いてください。</p>`;
            html += `<p style="font-size:0.9em;">※自分がこの作品をとても気に入っているつもりで書いてください。</p>`;
        } 
        else if (CONDITION === 'B') { 
            html += `<p style="color:#333; font-weight:bold;">この作品の「色使い・構図・描かれている対象」について、<br>客観的に解説する文章を書いてください。</p>`;
            html += `<p style="font-size:0.9em;">※個人的な感情は入れず、事実のみを記述してください。</p>`;
        } 
        else { 
            html += `<div style="background:#f9f9f9; padding:15px; border:1px solid #ddd;">
                <p><strong>課題用テキスト:</strong></p>
                <p>近年、人工知能（AI）技術の急速な発展により、私たちの生活様式は大きく変化しています。特に生成AIの登場は、文章作成や画像生成といったクリエイティブな領域にも影響を与えており、教育現場やビジネスシーンでの活用議論が活発化しています。</p>
            </div>`;
            html += `<p style="font-weight:bold;">上記の文章を読み、内容を要約してください。</p>`;
        }
        html += `</div></div>`;
        return html;
    },
    questions: [{ prompt: "", rows: 6, columns: 60, required: true, name: 'essay' }],
    button_label: '送信して次へ',
    on_finish: function(data) { data.phase = 'intervention'; }
});

// ---------------------------------------------------------
// 6. Phase 3: 操作チェック
// ---------------------------------------------------------
const manip_check = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: '今の課題についてお伺いします。',
        questions: manipulation_check_scale,
        on_finish: function(data) { data.phase = 'manipulation_check'; }
    }],
    conditional_function: function() { return CONDITION !== 'C'; }
};
timeline.push(manip_check);

// ---------------------------------------------------------
// 7. Phase 4: 事後評価
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>Phase 3: 事後評価</h3>
            <p>最後に、もう一度いくつかの絵画についてお伺いします。</p>
            <p>今のあなたの率直な印象を回答してください。</p>
            <p>スペースキーで開始</p>
        </div>
    `
});

const post_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        // ★ここも「上下固定レイアウト」
        css_classes: ['sticky-top-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" class="fixed-img">`;
        },
        questions: sd_scale,
        scale_width: 600,
        on_finish: function(data) {
            const res = data.response;
            let sum = (res.beauty||0) + (res.like||0) + (res.good||0) + (res.interest||0);
            data.phase = 'post'; 
            data.eval_score = sum / 4;
            data.img_id = jsPsych.evaluateTimelineVariable('id');
            data.is_target = (data.img_id === TARGET_DATA.id);
        }
    }],
    timeline_variables: stimuli_data, 
    randomize_order: true
};
timeline.push(post_evaluation_loop);

// ---------------------------------------------------------
// 8. 終了処理（デブリーフィング復元）
// ---------------------------------------------------------

const save_data_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size:24px;">データを保存しています...</p>',
    trial_duration: 1000, 
    on_finish: function() {
        jsPsych.data.get().localSave('csv', 'dissonance_experiment_data.csv');
    }
};
timeline.push(save_data_trial);

if(DATAPIPE_ID !== "") {
    timeline.push({
        type: jsPsychPipe,
        action: "save",
        experiment_id: DATAPIPE_ID,
        filename: `${subject_id}.csv`,
        data_string: ()=>jsPsych.data.get().csv()
    });
}

// ★ここが復元したデブリーフィングです
const debriefing = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>実験終了：ご協力ありがとうございました</h3>
            <p><strong>研究の目的について</strong><br>
            事前説明では「言語表現と思考プロセスの研究」とお伝えしましたが、実際には「自分の好みと異なる文章を書くことで、その対象への評価がどう変化するか（認知的不協和理論）」を調査する実験でした。</p>
            <p>正確な結果を得るため、意図的な隠蔽（カバーストーリーの使用）があったことをお詫び申し上げます。</p>
            <hr>
            <p style="color: red; font-weight: bold;">※自動的にデータ(CSVファイル)がダウンロードされます。</p>
            <p>ダウンロードを確認できたら、ブラウザを閉じて終了してください。</p>
        </div>
    `,
    choices: "NO_KEYS" 
};
timeline.push(debriefing);

// 実行
jsPsych.run(timeline);