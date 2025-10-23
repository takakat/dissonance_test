// jsPsychの初期化
const jsPsych = initJsPsych();

// ========================================================================
// ▼▼▼ データ保存の設定（重要） ▼▼▼
// ========================================================================
function saveData(data){
  // ★★★ 必ず、ご自身のGoogle Apps Scriptの「ウェブアプリのURL」に置き換えてください ★★★
  const url = "https://script.google.com/macros/s/AKfycbzwIw-rqtvRh3ztjwY51ABupII8AKfgNs2W-JtwEuNUKYx89iXnA4oWc0oOrBE5Fv4AAQ/exec"; 
  
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


// 実験全体のタイムライン
let timeline = [];

// ---- 0. 刺激リストと画像の事前読み込み ----
const stimuli_list = [
    { image_file: 'stimuli/painting1.jpg' },
    { image_file: 'stimuli/painting2.jpg' },
    { image_file: 'stimuli/painting3.jpg' }
];

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
let target_stimulus_path; // 選定された低評価作品のパスを保存する変数

const selection_and_baseline = {
    timeline: [
        {
            type: jsPsychCallFunction,
            func: () => {
                const screening_data = jsPsych.data.get().filter({task: 'screening'});
                // 最も評価が低かった作品を探す
                const target_stimulus_data = screening_data.values().reduce((min, p) => p.response < min.response ? p : min);
                target_stimulus_path = target_stimulus_data.stimulus; // パスを保存
            }
        },
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: "<p>ありがとうございます。では、次にもう一度だけ作品を見て、より詳しく評価をお願いします。</p>"
        },
        {
            type: jsPsychImageSliderResponse,
            stimulus: () => target_stimulus_path, // 選定された作品を表示
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


// ---- 6. 事後評価（おとり1枚＋対象1枚） ----
const post_evaluation_instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "<p>実験はこれで最終段階です。</p><p>最後に、いくつかの作品をもう一度お見せしますので、現在のあなたの第一印象で評価してください。</p>"
};
timeline.push(post_evaluation_instructions);

// おとり刺激を1つ選ぶ（本番ではもっと増やす）
let decoy_stimulus_path = stimuli_list.find(s => s.image_file !== target_stimulus_path).image_file;

// 事後評価の刺激リスト（おとり＋対象）を作成し、シャッフル
const post_eval_list = [
    { image: target_stimulus_path, type: 'target' },
    { image: decoy_stimulus_path, type: 'decoy' }
];
const shuffled_post_eval_list = jsPsych.randomization.shuffle(post_eval_list);

const post_evaluation_procedure = {
    timeline: [
        {
            type: jsPsychImageSliderResponse,
            stimulus: jsPsych.timelineVariable('image'),
            prompt: "<p>この作品が全体としてどのくらい好きですか？</p>",
            labels: ['全く好きではない', '普通', '極めて好きである'], min: 0, max: 10,
            data: {
                task: 'post_evaluation_liking',
                stimulus: jsPsych.timelineVariable('image'),
                stimulus_type: jsPsych.timelineVariable('type')
            }
        },
        // （本番ではここに事後評価のSD法も追加します）
    ],
    timeline_variables: shuffled_post_eval_list
};
timeline.push(post_evaluation_procedure);


// ---- 7. デブリーフィングとデータ送信 ----
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

// ---- 実験開始 ----
jsPsych.run(timeline).then(function() {
    // 全てのデータを取得
    const all_data = jsPsych.data.get().json();

    // データをGoogle Apps Scriptに送信
    saveData(JSON.parse(all_data));

    // 参加者向けの最終メッセージ
    // （本番ではクラウドソーシングの完了コードなどをここに表示します）
    document.body.innerHTML = '<p style="font-size: 20px; padding: 20px;">ご協力ありがとうございました。<br>データは正常に送信されました。<br>このウィンドウを閉じて終了してください。</p>';
});