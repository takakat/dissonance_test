// ========================================================================
// experiment.js [最終修正版]
// ========================================================================

// jsPsychの初期化
const jsPsych = initJsPsych();

// ========================================================================
// ▼▼▼ データ保存の設定（ここから） ▼▼▼
// ========================================================================
function saveData(data){
  // ★★★ 必ず、ご自身のGoogle Apps Scriptの「ウェブアプリのURL」に置き換えてください ★★★
  const url = "https://script.google.com/macros/s/AKfycbzwIw-rqtvRh3ztjwY51ABupII8AKfgNs2W-JtwEuNUKYx89iXnA4oWc0oOrBE5Fv4AAQ/exec"; // 例：ご自身のURLに

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  };

  // サーバーにデータを送信
  fetch(url, options);
}
// ========================================================================
// ▲▲▲ データ保存の設定（ここまで） ▲▲▲

// 実験全体のタイムライン
let timeline = [];

// ---- 0. 刺激リストと画像の事前読み込み ----
const stimuli_list = [
    { image_file: 'stimuli/painting1.jpg' },
    { image_file: 'stimuli/painting2.jpg' },
    { image_file: 'stimuli/painting3.jpg' }
];
// (本番では、ここを15〜20枚に増やしてください)

// 選定された低評価作品のパスを保存するグローバル変数
let target_stimulus_path; 

const preload = {
    type: jsPsychPreload,
    images: stimuli_list.map(s => s.image_file),
    auto_preload: true
};
timeline.push(preload);


// ---- 1. 同意取得 ----
const consent_screen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>研究へのご協力ありがとうございます。</p>
        <p>（ここに同意説明文を記述します）</p>
        <p>準備ができたら、Enterキーを押して開始してください。</p>
    `
};
timeline.push(consent_screen);


// ---- 2. 事前スクリーニング ----
const screening_instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>これから、いくつかの絵画を順番に見ていただきます。</p><p>それぞれの絵画が全体としてどのくらい好きか、直感でお答えください。</p>"
};
timeline.push(screening_instructions);

const screening_procedure = {
    timeline: [
        {
            type: jsPsychImageSliderResponse,
            stimulus: jsPsych.timelineVariable('image_file'),
            labels: ['全く好きではない', '普通', '極めて好きである'],
            min: 0,
            max: 10,
            prompt: "<p>この作品が全体としてどのくらい好きですか？</p>",
            data: {
                task: 'screening',
                stimulus: jsPsych.timelineVariable('image_file')
            }
        }
    ],
    timeline_variables: stimuli_list,
    randomize_order: true
};
timeline.push(screening_procedure);


// ---- 3. 低評価作品の選定と事前評価 ----
const selection_and_baseline = {
    timeline: [
        // 3-1. 低評価作品を自動で選定する
        {
            type: jsPsychCallFunction,
            func: () => {
                const screening_data = jsPsych.data.get().filter({task: 'screening'});
                // 最も評価が低かった作品を探す
                const target_stimulus_data = screening_data.values().reduce((min, p) => p.response < min.response ? p : min);
                target_stimulus_path = target_stimulus_data.stimulus; // グローバル変数にパスを保存
            }
        },
        // 3-2. 選定された作品を提示し、詳細な事前評価
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: "<p>ありがとうございます。では、次にもう一度だけ作品を見て、より詳しく評価をお願いします。</p>"
        },
        {
            type: jsPsychImageSliderResponse,
            stimulus: () => target_stimulus_path, 
            prompt: "<p>この作品が全体としてどのくらい好きですか？</p>",
            labels: ['全く好きではない', '普通', '極めて好きである'], min: 0, max: 10,
            data: { task: 'pre_evaluation_liking', stimulus: () => target_stimulus_path }
        },
        {
            type: jsPsychSurveyLikert,
            preamble: () => `<img src="${target_stimulus_path}" width="400px"><p>この作品の印象についてお答えください。</p>`,
            questions: [
                { prompt: "美しい - 醜い", name: 'SD_beautiful_ugly', labels: ['1', '2', '3', '4', '5', '6', '7'] },
                { prompt: "好き - 嫌い", name: 'SD_like_dislike', labels: ['1', '2', '3', '4', '5', '6', '7'] }
                // （本番ではここにSD法の項目を全て追加します）
            ],
            data: { task: 'pre_evaluation_sd', stimulus: () => target_stimulus_path }
        }
    ]
};
timeline.push(selection_and_baseline);


// ---- 4. ランダム割り当てと介入 ----
const group = jsPsych.randomization.sampleWithoutReplacement(['A', 'B', 'C'], 1)[0];

const intervention_instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>次に、文章を作成する課題に取り組んでいただきます。課題はシステムが自動で割り当てます。</p>"
};
timeline.push(intervention_instructions);

const intervention_A = {
    type: jsPsychSurveyText,
    questions: [{
        prompt: () => `<img src="${target_stimulus_path}" width="400px"><p><strong>【課題A】</strong>この作品の魅力を推薦する文章を作成してください。</p>`,
        rows: 8, columns: 60, name: 'writing_task'
    }],
    data: { task: 'intervention', group: 'A' }
};

const intervention_B = {
    type: jsPsychSurveyText,
    questions: [{
        prompt: () => `<img src="${target_stimulus_path}" width="400px"><p><strong>【課題B】</strong>この作品を客観的に解説する文章を作成してください。</p>`,
        rows: 8, columns: 60, name: 'writing_task'
    }],
    data: { task: 'intervention', group: 'B' }
};

const intervention_C = {
    type: jsPsychSurveyText,
    questions: [{
        prompt: `<p><strong>【課題C】</strong>あなたが最近読んだ本や観た映画のあらすじを要約してください。</p>`,
        rows: 8, columns: 60, name: 'writing_task'
    }],
    data: { task: 'intervention', group: 'C' }
};

// 条件分岐で各群の課題を実行
timeline.push({ timeline: [intervention_A], conditional_function: () => group === 'A' });
timeline.push({ timeline: [intervention_B], conditional_function: () => group === 'B' });
timeline.push({ timeline: [intervention_C], conditional_function: () => group === 'C' });


// ---- 5. 感情評価（A, B群のみ） ----
const affect_check = {
    type: jsPsychSurveyLikert,
    questions: [
        { prompt: "課題に取り組んでいる間、「不快感」を感じましたか？", name: 'affect_discomfort', labels: ['全く感じなかった', '少し', 'ある程度', 'かなり', '非常に強く感じた'] },
        { prompt: "課題に取り組んでいる間、「楽しさ」を感じましたか？", name: 'affect_fun', labels: ['全く感じなかった', '少し', 'ある程度', 'かなり', '非常に強く感じた'] },
    ],
    data: { task: 'affect_check' },
    randomize_question_order: true
};

const affect_procedure = {
    timeline: [affect_check],
    conditional_function: () => group === 'A' || group === 'B'
};
timeline.push(affect_procedure);


// ---- 6. 事後評価（バグ修正済み） ----
const post_evaluation_instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>実験はこれで最終段階です。</p>
        <p>最後に、いくつかの作品をもう一度お見せしますので、現在のあなたの第一印象で評価してください。</p>
        <p>準備ができたら、Enterキーを押してください。</p>
    `
};
timeline.push(post_evaluation_instructions);

const post_evaluation_procedure = {
    // timeline_variablesを「関数」に変更
    timeline_variables: function() {
        // この関数は、このブロックが始まる瞬間に実行されます

        // 1. おとり刺激を決定する
        let decoy_options = stimuli_list.filter(s => s.image_file !== target_stimulus_path);

        // 2. おとりリストからランダムに1つ選ぶ (もしおとりがなくてもクラッシュしないようにする)
        let chosen_decoy = decoy_options.length > 0 ? jsPsych.randomization.sampleWithoutReplacement(decoy_options, 1)[0] : null;

        // 3. 事後評価リストを作成
        let post_eval_list = [];
        post_eval_list.push({ stimulus_path: target_stimulus_path, type: 'target' });

        if(chosen_decoy){
            post_eval_list.push({ stimulus_path: chosen_decoy.image_file, type: 'decoy' });
        }

        // 4. リストをシャッフルして返す
        return jsPsych.randomization.shuffle(post_eval_list);
    },
    timeline: [
        {
            type: jsPsychImageSliderResponse,
            stimulus: jsPsych.timelineVariable('stimulus_path'), // 'stimulus_path' を使用
            prompt: "<p>この作品が全体としてどのくらい好きですか？</p>",
            labels: ['全く好きではない', '普通', '極めて好きである'], min: 0, max: 10,
            data: {
                task: 'post_evaluation_liking',
                stimulus: jsPsych.timelineVariable('stimulus_path'), 
                stimulus_type: jsPsych.timelineVariable('type')
            }
        },
        // (本番ではここに事後評価のSD法も追加します)
    ]
};
timeline.push(post_evaluation_procedure);


// ---- 7. デブリーフィングとデータ送信 ----
// (データ送信は最後のjsPsych.run()の後で行う)
const debrief_screen = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>ご協力ありがとうございました。</p>
        <p>（ここに実験の真の目的を説明するデブリーフィング文を記述します）</p>
        <p><b>データは自動的に送信されます。</b></p>
        <p>Enterキーを押して実験を終了してください。</p>
    `
};
timeline.push(debrief_screen);


// ---- 実験開始とデータ送信 ----
jsPsych.run(timeline).then(function() {
    // 全てのデータを取得
    const all_data = jsPsych.data.get().json();

    // データをGoogle Apps Scriptに送信
    saveData(JSON.parse(all_data));

    // 参加者向けの最終メッセージ
    document.body.innerHTML = '<p style="font-size: 20px; padding: 20px;">ご協力ありがとうございました。<br>データは正常に送信されました。<br>このウィンドウを閉じて終了してください。</p>';
});