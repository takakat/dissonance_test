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

// ★修正: 全項目を必須入力(required: true)にする
sd_scale_source.forEach(q => q.required = true);
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
    labels: create_labels("これを選択", "不可"),
    required: true
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
    <div style="text-align: left; font-size: 0.95em; line-height: 1.6;">
        <h3 style="text-align:center;">研究協力のお願い（説明文書）</h3>
        
        <p><strong>1. 研究の目的</strong><br>
        本研究は、「芸術作品に対する言語表現」と「一般的な言語表現」の思考プロセスを比較・調査することを
        目的としています。人々が絵画のような複雑な視覚情報から受けた印象をどのように言葉にするのか、また、
        そのプロセスが一般的なテキスト情報（文章）記述するプロセスとどのように異なるのかを分析します。</p>

        <p><strong>2. 研究の方法</strong><br>
        この実験では、まず複数の絵画（15～20枚）が提示されますので、それぞれの作品に対するあなたの印象を、いくつかの評価尺度（SD法）を用いてお答えいただきます。次に、文章を作成する課題に取り組んでいただきます。課題はランダムに割り当てられます。一部の方は、先ほど評価した作品の中から1枚が選ばれ、その作品について記述していただきます。それ以外の方は、作品とは無関係な一般的な文章を記述していただきます。課題の直後には、課題中のご自身の状態について（例：集中度など）の短いアンケートにお答えいただきます。最後に、実験の最初と同じの作品の中から5～10枚をランダムな順序で再度提示しますので、作品に対する印象を再度評価していただきます。<br>
        所要時間は約45分です。</p>

        <p><strong>3. 参加の任意性と撤回の自由</strong><br>
        本研究への参加はあなたの自由意志によるものです。参加を断っても不利益を被ることはありません。<br>
        また、実験の途中であっても、ブラウザを閉じることでいつでも参加を取りやめる（同意を撤回する）ことができます。<br>
        その場合、入力されたデータは破棄され、研究に使用されることはありません。</p>

        <p><strong>4. 個人情報の保護（匿名性）</strong><br>
        本研究では、個人を特定できる情報（氏名、住所など）は一切収集しません。<br>
        収集されたデータは統計的に処理され、学術目的（学会発表、論文投稿など）でのみ使用されます。</p>

        <p><strong>5. 予想される利益と不利益</strong><br>
        実験による身体的・精神的な危険や不利益は想定されていませんが、作業中に疲労等を感じた場合は直ちに中止してください。</p>


        <p><strong>7. 問い合わせ先</strong><br>
        京都工芸繊維大学工芸科学部設計工学域情報工学課程ブレインサイエンス研究室<br>
        研究責任者：梶村昇吾<br>
        研究担当者: 藤井貴久<br>
        連絡先: b2122051@edu.kit.ac.jp</p>
        
        <hr>
        <p style="font-weight:bold;">
            上記の説明内容をよく読み、理解した上で、本研究に参加することに同意いただける場合は、<br>
            本日の日付を入力し、チェックボックスにチェックを入れてください。
        </p>
    </div>
`;

const consent_trial = {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
        // 今日の日付を YYYY-MM-DD 形式で取得 (デフォルト値用)
        const today = new Date().toISOString().split('T')[0];
        
        return `
            <div class="instruction-text" style="max-width: 800px; margin: 0 auto;">
                <div style="border: 1px solid #ccc; padding: 20px; height: 400px; overflow-y: scroll; background: #fff; text-align: left; margin-bottom: 20px; border-radius: 4px;">
                    ${consent_text_content}
                </div>
                
                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
                    <div style="margin-bottom: 15px;">
                        <label style="font-weight: bold; margin-right: 10px;">同意日:</label>
                        <input type="date" id="consent_date" value="${today}" style="padding: 5px; font-size: 1em;">
                    </div>

                    <div style="text-align: center;">
                        <label style="font-size: 1.2em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <input type="checkbox" id="consent_checkbox" style="transform: scale(1.5);">
                            <span>上記の内容を理解し、実験参加に同意します。</span>
                        </label>
                    </div>
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
    css_classes: ['sticky-top-layout'], 
    
    preamble: function() {
        let html = `<div>`;
        
        // 条件C以外は画像を表示
        if (CONDITION !== 'C') {
            html += `<img src="${TARGET_DATA.path}" class="fixed-img"><br>`;
        } else {
            html += `<div style="height:50px;"></div>`; 
        }
        
        html += `<div style="text-align:left; max-width:800px; margin:20px auto;">`;
        html += `<h3>記述課題</h3>`;

        // ★追加: 文字数制限の注意書き
        html += `<p style="font-weight:bold; color:#d9534f; border: 1px solid #d9534f; padding: 10px; background: #fff0f0;">
                 ※この課題では、最低150文字以上の記述が必要です。<br>
                 文字数が150文字を超えるまで「送信して次へ」ボタンは押せません。
                 </p>`;
        
        if (CONDITION === 'A') { // 実験群(CAA)
            html += `<p style="color:#0056b3; font-weight:bold;">
                「この作品の魅力や、他者に推薦できる優れた点」についての推薦文を作成していただきます。
                </p>`;
            html += `<p>
                以下の入力欄に、この絵画を肯定的に評価し、他者に推薦するためのユニークな論点を最低3つ挙げ、それぞれについて具体的に説明してください。
                </p>`;
        } 
        else if (CONDITION === 'B') { // 統制群(客観記述)
            html += `<p style="color:#333; font-weight:bold;">
                あなたの個人的な感想や「良い・悪い」といった評価は含めず、「作品の構成要素」を客観的に記述してください。
                </p>`;
            html += `<p>
                描かれている人物や物、色彩の配置、筆のタッチなど、目に見える事実に基づいた客観的な特徴を3つ以上取り上げて説明してください。
                </p>`;
        } 
        else { // 無関係統制群(C) - 想起課題
            html += `<div style="background:#f9f9f9; padding:15px; border:1px solid #ddd;">
                <p><strong>課題:</strong></p>
                <p>今まで見た中で一番印象に残っている絵画について思い浮かべてください。それはどのような絵画か、またなぜ印象に残っているのかを具体的に記述してください。</p>
            </div>`;
        }
        html += `</div></div>`;
        return html;
    },
    
    // 入力欄（少し広めにしています）
    questions: [{ prompt: "", rows: 10, columns: 80, required: true, name: 'essay' }],
    button_label: '送信して次へ（150文字以上で有効化）',

    // ★追加: 文字数カウントとボタン制御のロジック
    on_load: function() {
        const textarea = document.querySelector('textarea');
        const button = document.getElementById('jspsych-survey-text-next');
        
        const counterDiv = document.createElement('div');
        counterDiv.style.marginTop = "10px";
        counterDiv.style.fontWeight = "bold";
        counterDiv.style.textAlign = "right";
        counterDiv.innerHTML = "現在の文字数: <span id='char-count' style='color:red; font-size:1.2em;'>0</span> / 150文字 (空白除く)";
        
        textarea.parentElement.appendChild(counterDiv);

        button.disabled = true;
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";

        textarea.addEventListener('input', function() {
            // ★ここがポイント: 正規表現 /\s+/g で空白文字(スペース,改行,タブ)を全て削除
            const textWithoutSpace = this.value.replace(/\s+/g, '');
            const currentLength = textWithoutSpace.length;
            
            const countSpan = document.getElementById('char-count');
            countSpan.textContent = currentLength;

            if (currentLength >= 150) {
                button.disabled = false;
                button.style.opacity = "1";
                button.style.cursor = "pointer";
                countSpan.style.color = "green";
                button.value = "送信して次へ"; 
            } else {
                button.disabled = true;
                button.style.opacity = "0.5";
                button.style.cursor = "not-allowed";
                countSpan.style.color = "red";
                button.value = `あと ${150 - currentLength} 文字必要です`;
            }
        });
    },

    on_finish: function(data) { 
        data.phase = 'intervention'; 
        data.essay = data.response.essay;
        // 保存データにも「空白抜きの文字数」を記録しておくと便利です
        data.char_count = data.essay.replace(/\s+/g, '').length;
    }
});

// ---------------------------------------------------------
// 6. Phase 3: 操作チェック
// ---------------------------------------------------------
const manip_check = {
    timeline: [{
        type: jsPsychSurveyLikert,
        preamble: '<div style="margin: 20px 0;"><h3>現在の気分について</h3><p>今のあなたの気分として、以下の項目がどの程度当てはまるかお答えください。</p></div>',
        questions: [
            { prompt: "幸せな", name: "happy", labels: manip_labels, required: true },
            { prompt: "気分が良い", name: "good_mood", labels: manip_labels, required: true },
            { prompt: "楽観的な", name: "optimistic", labels: manip_labels, required: true },
            { prompt: "親しみを感じる", name: "friendly", labels: manip_labels, required: true },
            { prompt: "活気に満ちた", name: "energetic", labels: manip_labels, required: true },
            { prompt: "居心地が悪い", name: "uncomfortable", labels: manip_labels, required: true },
            { prompt: "落ち着かない", name: "uneasy", labels: manip_labels, required: true },
            { prompt: "煩わしい", name: "bothered", labels: manip_labels, required: true }
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