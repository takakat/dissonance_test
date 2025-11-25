// =========================================================
// experiment.js : 上下分割・画像固定レイアウト版
// =========================================================

const jsPsych = initJsPsych({
    on_finish: function() { }
});

const DATAPIPE_ID = "FSbN2d1AkLUZ"; 
let timeline = [];

// ---------------------------------------------------------
// 1. 設定
// ---------------------------------------------------------

// 絵画データ（各絵画に個別のCSSクラスを割り当て可能）
const stimuli_data = [
    { id: 'art_1', path: 'img/painting_01.jpg', cssClass: 'img-art-1' },
    { id: 'art_2', path: 'img/painting_02.jpg', cssClass: 'img-art-2' },
    { id: 'art_3', path: 'img/painting_03.jpg', cssClass: 'img-art-3' }
];
const preload_images = stimuli_data.map(data => data.path);

// SD法尺度
const sd_scale_source = [
    { prompt: "醜い - 美しい",   name: "beauty",   labels: ["醜い", "2", "3", "4", "5", "6", "美しい"] },
    { prompt: "嫌い - 好き",     name: "like",     labels: ["嫌い", "2", "3", "4", "5", "6", "好き"] },
    { prompt: "悪い - 良い",     name: "good",     labels: ["悪い", "2", "3", "4", "5", "6", "良い"] },
    { prompt: "つまらない - 面白い", name: "interest", labels: ["つまらない", "2", "3", "4", "5", "6", "面白い"] },
    { prompt: "静的 - 動的",     name: "dynamic",  labels: ["静的", "2", "3", "4", "5", "6", "動的"] },
    { prompt: "弱い - 強い",     name: "strong",   labels: ["弱い", "2", "3", "4", "5", "6", "強い"] },
    { prompt: "地味な - 派手な", name: "showy",    labels: ["地味な", "2", "3", "4", "5", "6", "派手な"] },
    { prompt: "暗い - 明るい",   name: "bright",   labels: ["暗い", "2", "3", "4", "5", "6", "明るい"] },
    { prompt: "寂しい - 楽しい", name: "fun",      labels: ["寂しい", "2", "3", "4", "5", "6", "楽しい"] },
    { prompt: "冷たい - 暖かい", name: "warm",     labels: ["冷たい", "2", "3", "4", "5", "6", "暖かい"] },
    { prompt: "固い - 柔らかな", name: "soft",     labels: ["固い", "2", "3", "4", "5", "6", "柔らかな"] },
    { prompt: "緊張した - ゆるんだ", name: "loose", labels: ["緊張した", "2", "3", "4", "5", "6", "ゆるんだ"] }
];
const sd_scale = jsPsych.randomization.shuffle(sd_scale_source);

const manipulation_check_scale = [
    { prompt: "文章作成課題中、「書きにくい」「不快だ」といった葛藤を感じましたか？", name: "discomfort", labels: ["全く感じなかった", "2", "3", "4", "5", "6", "強く感じた"] }
];

let TARGET_DATA = { id: null, path: null, score: 100, cssClass: null };
let CONDITION = null; 

// ---------------------------------------------------------
// 2. 初期化
// ---------------------------------------------------------
timeline.push({
    type: jsPsychPreload,
    images: preload_images,
    message: 'Loading...'
});

const subject_id = jsPsych.randomization.randomID(10);
jsPsych.data.addProperties({subject_id: subject_id});

timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: 'Loading...',
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
// 3. Phase 1: 事前評価 (Pre-test)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>事前評価</h3>
            <p>上部に表示される絵画を見ながら、下部の項目について直感的に評価してください。</p>
            <p>絵画は画面上部に常に表示されています。</p>
            <p>評価項目が多い場合は、下部をスクロールして回答してください。</p>
            <p><strong>スペースキーで開始</strong></p>
        </div>
    `,
    choices: [' ']
});

const pre_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        css_classes: ['split-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            const cssClass = jsPsych.evaluateTimelineVariable('cssClass');
            return `<img src="${p}" class="fixed-img ${cssClass}">`;
        },
        questions: sd_scale,
        scale_width: 700,
        randomize_question_order: false,
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
    stimulus: 'Processing...',
    trial_duration: 500,
    on_finish: function() {
        const all_data = jsPsych.data.get().filter({phase: 'pre'}).values();
        all_data.sort((a, b) => a.eval_score - b.eval_score);
        
        if(all_data.length > 0){
            TARGET_DATA.id = all_data[0].img_id;
            TARGET_DATA.path = all_data[0].img_path;
            TARGET_DATA.score = all_data[0].eval_score;
            
            const targetStimulus = stimuli_data.find(s => s.id === TARGET_DATA.id);
            if(targetStimulus) {
                TARGET_DATA.cssClass = targetStimulus.cssClass;
            }
            
            jsPsych.data.addProperties({ target_id: TARGET_DATA.id });
            console.log("Target selected:", TARGET_DATA);
        }
    }
});

// ---------------------------------------------------------
// 5. Phase 2: 介入 (記述課題)
// ---------------------------------------------------------
timeline.push({
    type: jsPsychSurveyText,
    preamble: function() {
        let html = `<div style="text-align:center; padding:20px;">`;
        if (CONDITION !== 'C') {
            const imgClass = TARGET_DATA.cssClass || '';
            html += `<img src="${TARGET_DATA.path}" class="fixed-img ${imgClass}" style="max-width:600px; max-height:400px; margin:0 auto 25px; display:block;"><br>`;
        }
        html += `<h3 style="margin-top:15px; font-size:24px;">記述課題</h3>`;
        
        if (CONDITION === 'A') { 
            html += `<p style="color:#0056b3; font-weight:bold; max-width:700px; margin:15px auto; font-size:17px; line-height:1.7;">この作品の「良い点・魅力的な点」を3つ挙げ、<br>友人に推薦する文章を書いてください。</p>`;
        } else if (CONDITION === 'B') { 
            html += `<p style="color:#333; font-weight:bold; max-width:700px; margin:15px auto; font-size:17px; line-height:1.7;">この作品の「色使い・構図・描かれている対象」について、<br>客観的に解説する文章を書いてください。</p>`;
        } else { 
            html += `<div style="text-align:left; background:#f9f9f9; padding:20px; font-size:15px; max-width:750px; margin:15px auto; border-radius:8px; border:1px solid #ddd;">
                <p><strong>課題文:</strong> 生成AIの発展は...</p>
            </div><p style="margin-top:20px; font-size:16px;">上記の文章を要約してください。</p>`;
        }
        html += `</div>`;
        return html;
    },
    questions: [{ prompt: "", rows: 8, columns: 80, required: true, name: 'essay' }],
    button_label: '送信',
    on_finish: function(data) { data.phase = 'intervention'; }
});

// ---------------------------------------------------------
// 6. Phase 3: 操作チェック
// ---------------------------------------------------------
const manip_check = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: '<h3 style="text-align:center; margin-bottom:30px; font-size:22px;">今の課題についてお伺いします</h3>',
        questions: manipulation_check_scale,
        scale_width: 700,
        on_finish: function(data) { data.phase = 'manipulation_check'; }
    }],
    conditional_function: function() { return CONDITION !== 'C'; }
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
            <p>もう一度、上部の絵画を見ながら印象を評価してください。</p>
            <p>絵画は画面上部に常に表示されています。</p>
            <p>下部をスクロールして全ての項目に回答してください。</p>
            <p><strong>スペースキーで開始</strong></p>
        </div>
    `,
    choices: [' ']
});

const post_evaluation_loop = {
    timeline: [{
        type: jsPsychSurveyLikert,
        css_classes: ['split-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            const cssClass = jsPsych.evaluateTimelineVariable('cssClass');
            return `<img src="${p}" class="fixed-img ${cssClass}">`;
        },
        questions: sd_scale,
        scale_width: 700,
        randomize_question_order: false,
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
// 8. 終了
// ---------------------------------------------------------
const save_data_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="text-align:center; font-size:20px; margin-top:50px;">データを保存しています...</p>',
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

const debriefing = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div class="instruction-text">
            <h3>実験終了</h3>
            <p>ご協力ありがとうございました。</p>
            <p>データは正常に保存されました。</p>
            <p><strong>ブラウザを閉じて終了してください。</strong></p>
        </div>
    `,
    choices: "NO_KEYS" 
};
timeline.push(debriefing);

jsPsych.run(timeline);