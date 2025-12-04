// =========================================================
// experiment.js : 上下分割・テキスト復元版
// =========================================================

const jsPsych = initJsPsych({
    on_finish: function() { }
});

// ★DataPipe ID
const DATAPIPE_ID = "FSbN2d1AkLUZ"; 

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

// ★追加: 保存する列の順番をここで定義（固定）します
const sd_keys = [
    "beauty", "like", "good", "interest", // 評価性
    "dynamic", "strong", "showy",         // 活動性
    "bright", "fun", "warm",              // 明るさ
    "soft", "loose",                      // やわらかさ
    "attention_check"                     // アテンションチェック
];

const manip_keys = [
    "happy", "good_mood", "optimistic", "friendly", "energetic", // Positive
    "uncomfortable", "uneasy", "bothered"                        // Negative
];

// SD法尺度 (定義後シャッフル)
// 0と10の下に改行(<br>)を入れて形容詞を表示し、文字サイズを少し小さくします
function create_labels(left_text, right_text) {
    const style = "font-size: 0.8em; font-weight: normal; display: block; margin-top: 5px;";
    return [
        `0<br><span style="${style}">${left_text}</span>`,
        "1", "2", "3", "4", "5", "6", "7", "8", "9",
        `10<br><span style="${style}">${right_text}</span>`
    ];
}

// SD法尺度 (11段階)
// プロンプトはシンプルにし、ラベル側で意味を提示します
const sd_scale_source = [
    // [評価性]
    { prompt: "醜い - 美しい", name: "beauty", labels: create_labels("醜い", "美しい") },
    { prompt: "嫌い - 好き",   name: "like",   labels: create_labels("嫌い", "好き") },
    { prompt: "悪い - 良い",   name: "good",   labels: create_labels("悪い", "良い") },
    { prompt: "つまらない - 面白い", name: "interest", labels: create_labels("つまらない", "面白い") },
    // [活動性]
    { prompt: "静的 - 動的",   name: "dynamic", labels: create_labels("静的", "動的") },
    { prompt: "弱い - 強い",   name: "strong",  labels: create_labels("弱い", "強い") },
    { prompt: "地味な - 派手な", name: "showy", labels: create_labels("地味な", "派手な") },
    // [明るさ]
    { prompt: "暗い - 明るい", name: "bright", labels: create_labels("暗い", "明るい") },
    { prompt: "寂しい - 楽しい", name: "fun",   labels: create_labels("寂しい", "楽しい") },
    { prompt: "冷たい - 暖かい", name: "warm",  labels: create_labels("冷たい", "暖かい") },
    // [やわらかさ]
    { prompt: "固い - 柔らかな", name: "soft",  labels: create_labels("固い", "柔らかな") },
    { prompt: "緊張した - ゆるんだ", name: "loose", labels: create_labels("緊張した", "ゆるんだ") }
];
// 通常項目の順序をシャッフルして固定
const sd_scale_fixed = jsPsych.randomization.shuffle(sd_scale_source);

// ★修正: 感情・不協和測定用尺度 (8項目)
// 操作チェック（感情指標）
// ここは7段階(0-6)ですが、同様に両端に意味をつけます
const manip_labels = [
    "0<br><span style='font-size:0.8em'>全く<br>当てはまらない</span>", 
    "1", "2", "3", "4", "5", 
    "6<br><span style='font-size:0.8em'>非常に<br>よく当てはまる</span>"
];
// 日本語訳を当て、7段階で測定します。
const manipulation_check_scale = [
    { prompt: "先ほどの文章作成課題を行っている時、「書きにくい」「不快だ」といった葛藤を感じましたか？", 
      name: "discomfort", 
      labels: manip_labels }
];

// アテンションチェック項目
const attention_check_item = {
    prompt: "<span style='color:#d9534f; font-weight:bold;'>【確認】この項目では「0」（一番左）を選んでください</span>",
    name: "attention_check",
    // ここも同じフォーマットで揃えます
    labels: create_labels("これを選択", "不可")
};

let TARGET_DATA = { id: null, path: null, score: 100 };
let CONDITION = null; 

// ★アテンションチェックを入れる対象の画像をランダムに決定
// 事前・事後それぞれで1枚ずつ選ぶ
const pre_check_target_id = jsPsych.randomization.sampleWithoutReplacement(stimuli_data.map(s => s.id), 1)[0];
const post_check_target_id = jsPsych.randomization.sampleWithoutReplacement(stimuli_data.map(s => s.id), 1)[0];

console.log(`Pre-check target: ${pre_check_target_id}`);
console.log(`Post-check target: ${post_check_target_id}`);

// ---------------------------------------------------------
// 2. 初期化
// ---------------------------------------------------------
timeline.push({
    type: jsPsychPreload,
    images: preload_images,
    message: 'データを読み込み中...'
});

// 参加者ID
const subject_id = jsPsych.randomization.randomID(10);

// ★完了コード生成
const completion_code = jsPsych.randomization.randomID(8).toUpperCase();



jsPsych.data.addProperties({
    subject_id: subject_id,
    completion_code: completion_code ,
    pre_check_target_id: pre_check_target_id,   // どの画像でチェックしたか記録
    post_check_target_id: post_check_target_id
});

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




// =========================================================
// 0. 同意画面 (Consent Form)
// =========================================================

// ★後でここに同意文をコピペしてください
const consent_text_content = `
    <p><strong>研究参加への同意</strong></p>
    <p>本研究は、言語表現と思考プロセスに関する心理学的実験です。</p>
    <p><strong>【実験の手順】</strong><br>
    画面の指示に従い、画像の評価や文章の作成を行っていただきます。<br>
    </p>
    <p><strong>【匿名性の保持】</strong><br>
    収集されたデータは統計的に処理され、個人が特定されることはありません。</p>
    <p><strong>【参加の自由】</strong><br>
    本実験への参加は任意です。実験途中であっても、ブラウザを閉じることでいつでも不利益なく参加を中止できます。</p>
    <p>ここに説明文</p>
`;

const consent_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        return `
            <div class="instruction-text" style="max-width: 800px; margin: 0 auto;">
                <h3>実験参加への同意</h3>
                
                <div style="border: 1px solid #ccc; padding: 20px; height: 300px; overflow-y: scroll; background: #fff; text-align: left; margin-bottom: 20px; border-radius: 4px;">
                    ${consent_text_content}
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                    <label style="font-size: 1.2em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <input type="checkbox" id="consent_checkbox" style="transform: scale(1.5);">
                        <span>上記の内容を理解し、実験参加に同意します。</span>
                    </label>
                </div>
            </div>
        `;
    },
    choices: ['実験を開始する'],
    // 画面が表示された直後の処理
    on_load: function() {
        // 1. 開始ボタンを取得
        const btn = document.querySelector('.jspsych-btn');
        
        // 2. 最初はボタンを押せないようにする（無効化）
        btn.disabled = true;
        btn.style.opacity = "0.5"; // 薄くして押せない感を出す

        // 3. チェックボックスの動作を監視
        const checkbox = document.getElementById('consent_checkbox');
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // チェックされたらボタンを有効化
                btn.disabled = false;
                btn.style.opacity = "1";
            } else {
                // チェックが外れたらまた無効化
                btn.disabled = true;
                btn.style.opacity = "0.5";
            }
        });
    }
};

// タイムラインの最初に追加
timeline.push(consent_trial);


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
        css_classes: ['sticky-top-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" class="fixed-img">`;
        },
        
        // ★ここで動的に質問リストを生成する
        questions: function() {
            const current_id = jsPsych.evaluateTimelineVariable('id');
            
            // 通常の尺度（シャッフル済みの固定順序）をコピー
            let current_questions = [...sd_scale_fixed];

            // もし「チェック対象の画像」だったら、チェック項目を混ぜる
            if (current_id === pre_check_target_id) {
                // ランダムな位置（0〜12番目）にチェック項目を挿入
                const insert_index = Math.floor(Math.random() * (current_questions.length + 1));
                current_questions.splice(insert_index, 0, attention_check_item);
            }
            
            return current_questions;
        },
        
        scale_width: 800,
        on_finish: function(data) {
            const res = data.response;
            // ★修正: データを1つずつ取り出して個別の列に保存
            // ★修正: 固定リスト(sd_keys)の順番通りにデータを保存
            // 該当する回答がない場合（チェック項目が無い回など）は空欄または無視されます
            sd_keys.forEach(key => {
                if(res[key] !== undefined) {
                    data[key] = res[key];
                }
            });
            // 通常項目の合計スコアを計算（チェック項目は無視）
            let sum = (res.beauty||0) + (res.like||0) + (res.good||0) + (res.interest||0);
            
            data.phase = 'pre';
            data.eval_score = sum / 4;
            data.img_id = jsPsych.evaluateTimelineVariable('id');
            data.img_path = jsPsych.evaluateTimelineVariable('path');
            
            // チェック項目が含まれていた場合、正解したかどうかも記録しておくと便利
            if (res.attention_check !== undefined) {
                // 一番左（index 0）が正解
                data.passed_check = (res.attention_check === 0);
            }
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
        preamble: '<div style="margin: 20px 0;"><h3>現在の気分について</h3><p>今のあなたの気分として、以下の項目がどの程度当てはまるかお答えください。</p></div>',
        questions: [
            { prompt: "幸せな", name: "happy", labels: manip_labels },
            { prompt: "気分が良い", name: "good_mood", labels: manip_labels },
            { prompt: "楽観的な", name: "optimistic", labels: manip_labels },
            { prompt: "親しみを感じる", name: "friendly", labels: manip_labels },
            { prompt: "活気に満ちた", name: "energetic", labels: manip_labels },
            { prompt: "居心地が悪い", name: "uncomfortable", labels: manip_labels },
            { prompt: "落ち着かない", name: "uneasy", labels: manip_labels },
            { prompt: "煩わしい", name: "bothered", labels: manip_labels }
        ],
        scale_width: 800,
        randomize_question_order: true, 
        on_finish: function(data) { 
            data.phase = 'manipulation_check';
            const res = data.response;
            // ★修正: 固定リスト(manip_keys)の順序で保存
            manip_keys.forEach(key => {
                if(res[key] !== undefined) {
                    data[key] = res[key];
                }
            });
        }
    }],
   // conditional_function: function() { return CONDITION !== 'C'; }
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
        css_classes: ['sticky-top-layout'],
        
        preamble: function() {
            const p = jsPsych.evaluateTimelineVariable('path');
            return `<img src="${p}" class="fixed-img">`;
        },
        
        // ★事後も同様に動的に質問を生成
        questions: function() {
            const current_id = jsPsych.evaluateTimelineVariable('id');
            let current_questions = [...sd_scale_fixed]; // コピー

            // 事後チェック対象の画像なら、チェック項目を混ぜる
            if (current_id === post_check_target_id) {
                const insert_index = Math.floor(Math.random() * (current_questions.length + 1));
                current_questions.splice(insert_index, 0, attention_check_item);
            }
            
            return current_questions;
        },
        
        scale_width: 800,
        on_finish: function(data) {
            const res = data.response;
            // ★修正: 固定リスト(sd_keys)の順番通りにデータを保存
            sd_keys.forEach(key => {
                if(res[key] !== undefined) {
                    data[key] = res[key];
                }
            });
            let sum = (res.beauty||0) + (res.like||0) + (res.good||0) + (res.interest||0);
            
            data.phase = 'post'; 
            data.eval_score = sum / 4;
            data.img_id = jsPsych.evaluateTimelineVariable('id');
            data.is_target = (data.img_id === TARGET_DATA.id);
            
            // 事後チェック項目の正誤記録
            if (res.attention_check !== undefined) {
                data.passed_check = (res.attention_check === 0);
            }
        }
    }],
    timeline_variables: stimuli_data, 
    randomize_order: true
};
timeline.push(post_evaluation_loop);

// ---------------------------------------------------------
// 8. 終了処理（デブリーフィング復元）
// ---------------------------------------------------------

// 削除する列のリスト
const ignore_columns = [
    'stimulus', 
    'question_order', 
    'success', 
    'timeout', 
    'failed_images', 
    'failed_audio', 
    'failed_video', 
    'plugin_version', 
    'internal_node_id', 
    'trial_type'
];

const save_data_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size:24px;">データを保存しています...</p>',
    trial_duration: 1000, 
    on_finish: function() {
       jsPsych.data.get()
            .ignore(ignore_columns)
            .localSave('csv', 'dissonance_experiment_data.csv');
    }
};
timeline.push(save_data_trial);

if(DATAPIPE_ID !== "") {
    timeline.push({
        type: jsPsychPipe,
        action: "save",
        experiment_id: DATAPIPE_ID,
        filename: `${subject_id}.csv`,
        data_string: ()=>jsPsych.data.get().ignore(ignore_columns).csv()
    });
}

// ★ここが復元したデブリーフィングです
const debriefing = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
        return `
            <div class="instruction-text">
                <h3>実験終了：ご協力ありがとうございました</h3>
                <p><strong>研究の目的について</strong><br>
                事前説明では「言語表現と思考プロセスの研究」とお伝えしましたが、実際には「自分の好みと異なる文章を書くことで、その対象への評価がどう変化するか（認知的不協和理論）」を調査する実験でした。<br>
                正確な結果を得るため、意図的な隠蔽（カバーストーリーの使用）があったことをお詫び申し上げます。</p>
                
                <hr style="border: 2px solid #333; margin: 30px 0;">
                
                <div style="background-color: #f0f8ff; padding: 20px; border: 2px solid #0056b3; border-radius: 8px; text-align: center;">
                    <p style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">実験完了コード</p>
                    <p style="font-size: 36px; font-weight: bold; letter-spacing: 3px; color: #d32f2f; background: #fff; display: inline-block; padding: 5px 20px; border: 1px solid #ccc; user-select: all;">
                        ${completion_code}
                    </p>
                    <p style="font-size: 14px; margin-top: 10px;">
                        上記のコードを必ず<strong>コピー、またはメモ</strong>をしてください。<br>
                        <br>
                        コードを記録しましたら、ブラウザを閉じて終了してください。
                    </p>
                </div>

                <p style="margin-top: 30px;">※自動的にデータ(CSV)がダウンロードされます。</p>
            </div>
        `;
    },
    choices: "NO_KEYS" 
};
timeline.push(debriefing);

// 実行
jsPsych.run(timeline);