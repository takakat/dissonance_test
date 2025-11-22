// =========================================================
// experiment.js : Step 3 (介入課題の実装)
// =========================================================

const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

const DATAPIPE_ID = ""; 
let timeline = [];

// ---------------------------------------------------------
// 1. 設定・変数
// ---------------------------------------------------------

// 画像ファイル (imgフォルダ内のファイル名と一致させる)
const stimuli_data = [
    { id: 'art_1', path: 'img/painting_05.jpg' },
    { id: 'art_2', path: 'img/painting_06.jpg' },
    { id: 'art_3', path: 'img/painting_07.jpg' }
];

// プリロード用リスト
const preload_images = stimuli_data.map(data => data.path);

// SD法尺度
const sd_scale = [
    { prompt: "醜い - 美しい", name: "beauty", labels: ["醜い", "2", "3", "4", "5", "6", "美しい"] },
    { prompt: "嫌い - 好き",   name: "like",   labels: ["嫌い", "2", "3", "4", "5", "6", "好き"] },
    { prompt: "悪い - 良い",   name: "good",   labels: ["悪い", "2", "3", "4", "5", "6", "良い"] },
    { prompt: "つまらない - 面白い", name: "interest", labels: ["つまらない", "2", "3", "4", "5", "6", "面白い"] }
];

// 状態管理用変数
let TARGET_DATA = { id: null, path: null, score: 100 };
let CONDITION = null; // 'A', 'B', 'C' のいずれかが入る

// ---------------------------------------------------------
// 2. プリロード & 群割り当て
// ---------------------------------------------------------
const preload = {
    type: jsPsychPreload,
    images: preload_images,
    message: '読み込み中...',
};
timeline.push(preload);

// ★群割り当て (テスト用にランダム割り当て)
// 本番ではDataPipeを使いますが、今は動作確認用にMath.randomを使います
const assignment = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '実験の準備をしています...',
    trial_duration: 1000,
    on_finish: function() {
        const rand = Math.random();
        if (rand < 0.33) {
            CONDITION = 'A'; // 肯定 (Positive)
        } else if (rand < 0.66) {
            CONDITION = 'B'; // 客観 (Objective)
        } else {
            CONDITION = 'C'; // 統制 (Control)
        }
        // データに記録
        jsPsych.data.addProperties({ condition: CONDITION });
        console.log("割り当てられた群:", CONDITION);
    }
};
timeline.push(assignment);

// ---------------------------------------------------------
// 3. Step 2: 事前評価 (Pre-test)
// ---------------------------------------------------------
const instruction_pre = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>Phase 1: 事前評価</h3>
            <p>これから表示される絵画の印象を評価してください。</p>
            <p>スペースキーで開始</p>
        </div>
    `
};
timeline.push(instruction_pre);

const evaluation_trial = {
    type: jsPsychSurveyLikert,
    preamble: function() {
        // ★ユーザー様修正箇所: evaluateTimelineVariableを使用
        const current_path = jsPsych.evaluateTimelineVariable('path');
        return `<img src="${current_path}" style="width:400px; margin-bottom:20px;">`;
    },
    questions: sd_scale,
    randomize_question_order: false,
    scale_width: 600,
    on_finish: function(data) {
        const responses = data.response; 
        const scores = Object.values(responses); 
        let sum = 0;
        for(let i=0; i<4; i++) { sum += scores[i]; }
        data.eval_score = sum / 4;
        
        // タイムライン変数からIDとパスを保存
        data.img_id = jsPsych.evaluateTimelineVariable('id');
        data.img_path = jsPsych.evaluateTimelineVariable('path');
    }
};

const evaluation_loop = {
    timeline: [evaluation_trial],
    timeline_variables: stimuli_data,
    randomize_order: true
};
timeline.push(evaluation_loop);

// ---------------------------------------------------------
// 4. ターゲット選定
// ---------------------------------------------------------
const selection_process = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '次の課題を準備中...',
    trial_duration: 1000,
    on_finish: function() {
        const all_data = jsPsych.data.get().filter({trial_type: 'survey-likert'}).values();
        // スコア昇順 (低い順)
        all_data.sort((a, b) => a.eval_score - b.eval_score);
        if(all_data.length > 0){
            TARGET_DATA.id = all_data[0].img_id;
            TARGET_DATA.path = all_data[0].img_path;
            TARGET_DATA.score = all_data[0].eval_score;
        }
    }
};
timeline.push(selection_process);

// ---------------------------------------------------------
// 5. Step 3: 介入課題 (Intervention)
// ---------------------------------------------------------

// ライティング課題画面
const writing_task = {
    type: jsPsychSurveyText,
    preamble: function() {
        // 条件に応じて表示内容を変える
        let html = `<div style="margin-bottom: 20px;">`;

        // A群・B群はターゲット画像を表示
        if (CONDITION === 'A' || CONDITION === 'B') {
            html += `<img src="${TARGET_DATA.path}" style="width:400px; border:1px solid #ccc;"><br>`;
        }
        
        // 教示文の分岐
        html += `<h3 style="margin-top:20px;">記述課題</h3>`;
        
        if (CONDITION === 'A') { // 肯定
            html += `<p style="font-weight:bold; color:#0056b3;">この作品の「良い点・魅力的な点」を3つ挙げ、友人に推薦する文章を書いてください。</p>`;
            html += `<p>※自分がこの作品をとても気に入っているつもりで書いてください。</p>`;
        } 
        else if (CONDITION === 'B') { // 客観
            html += `<p style="font-weight:bold; color:#333;">この作品の「色使い・構図・描かれている対象」について、客観的に解説する文章を書いてください。</p>`;
            html += `<p>※個人的な感情は入れず、事実のみを記述してください。</p>`;
        } 
        else { // C: 統制 (画像なし)
            html += `<div style="text-align:left; background:#f9f9f9; padding:15px; border:1px solid #ddd;">
                <p><strong>課題用テキスト:</strong></p>
                <p>近年、人工知能（AI）技術の急速な発展により、私たちの生活様式は大きく変化しています。特に生成AIの登場は、文章作成や画像生成といったクリエイティブな領域にも影響を与えており、教育現場やビジネスシーンでの活用議論が活発化しています。</p>
            </div>`;
            html += `<p style="font-weight:bold;">上記の文章を読み、内容を100文字程度で要約してください。</p>`;
        }

        html += `</div>`;
        return html;
    },
    questions: [
        { prompt: "以下のボックスに入力してください（文字数制限なし）", rows: 6, columns: 60, required: true, name: 'essay' }
    ],
    button_label: '送信して次へ',
    on_finish: function(data) {
        // 入力内容を確認用にコンソール出力
        console.log("Condition:", CONDITION);
        console.log("Input:", data.response.essay);
    }
};

timeline.push(writing_task);

// ---------------------------------------------------------
// 終了画面
// ---------------------------------------------------------
const end_screen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        return `
            <div class="instruction-text">
                <h3>Step 3 完了</h3>
                <p>あなたの条件: <strong>${CONDITION}群</strong></p>
                <p>介入対象画像: <strong>${TARGET_DATA.id}</strong></p>
                <p>データが正常に保存されました。</p>
                <p>スペースキーで終了</p>
            </div>
        `;
    },
    choices: [' ']
};
timeline.push(end_screen);

// 実行
jsPsych.run(timeline);