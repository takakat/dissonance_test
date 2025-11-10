// ★★★ ステップ1でコピーしたGASのURLを貼り付ける ★★★
// (ご自身のGASのURLに書き換えてください)
const scriptURL = 'https://script.google.com/macros/s/AKfycbzwIw-rqtvRh3ztjwY51ABupII8AKfgNs2W-JtwEuNUKYx89iXnA4oWc0oOrBE5Fv4AAQ/exec';


// 1. jsPsychの初期化
const jsPsych = initJsPsych({
  on_finish: function() {
    
    // (A) 参加者の画面を「保存中」にする
    document.body.innerHTML = `
      <div style="width: 80%; max-width: 600px; margin: 100px auto; text-align: center; line-height: 1.6;">
        <h2>データを保存しています...</h2>
        <p>このページを閉じずに、しばらくお待ちください。</p>
      </div>
    `;

    // (B) 送信するデータを準備する
    jsPsych.data.addProperties({
      participant_id: participantID
    });
    
    const allData = jsPsych.data.get(); 
    const dataToSend = {
      participant_id: participantID,
      experiment_data: allData.values() 
    };

    // (C) fetch API でデータをPOST送信する
    fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors', 
      body: JSON.stringify(dataToSend)
    })
    .then(response => {
      // (D) 送信成功時の処理
      document.body.innerHTML = `
        <div style="width: 80%; max-width: 600px; margin: 100px auto; text-align: center; line-height: 1.6;">
          <h2>実験は終了です。</h2>
          <p>ご協力ありがとうございました。</p>
          <p>このウィンドウを閉じて構いません。</p>
        </div>
      `;
    })
    .catch(error => {
      // (E) 送信失敗時の処理（バックアップ）
      console.error('Error sending data:', error);
      document.body.innerHTML = `
        <div style="width: 80%; max-width: 600px; margin: 100px auto; text-align: center; line-height: 1.6;">
          <h2>データの送信エラー</h2>
          <p>申し訳ありませんが、データの自動送信に失敗しました。</p>
          <p>お手数ですが、以下のテキストボックスの内容をすべてコピーし、実験実施者にお送りください。</p>
          <textarea style="width: 100%; height: 200px; margin-top: 20px;"></textarea>
          <p>コピーが完了したら、このウィンドウを閉じてください。</p>
        </div>
      `;
      document.querySelector('textarea').value = jsPsych.data.get().csv();
    });
  }
});

// 参加者IDの生成
const participantID = jsPsych.randomization.randomID(10);


// 2. 画像リスト
const imageList = [
  'img/pic1.jpg',
  'img/pic2.jpg',
  'img/pic3.jpg',
  'img/pic4.jpg'
];

// SD法の項目定義（例）
const sdItems = [
  { left: '醜い', right: '美しい', name: 'sd_beautiful' },
  { left: 'つまらない', right: '面白い', name: 'sd_interesting' },
  { left: '嫌い', right: '好き', name: 'sd_like' },
  { left: '悪い', right: '良い', name: 'sd_good' },
  { left: '地味な', right: '派手な', name: 'sd_flashy' },
  { left: '静的', right: '動的', name: 'sd_dynamic' },
  { left: '不安定な', right: '安定した', name: 'sd_stable' },
  { left: '平凡な', right: '個性的な', name: 'sd_unique' },
  { left: '暗い', right: '明るい', name: 'sd_bright' },
  { left: '冷たい', right: '暖かい', name: 'sd_warm' },
  { left: '重い', right: '軽い', name: 'sd_light' },
  { left: '固い', right: '柔らかな', name: 'sd_soft' },
  { left: '緊張した', right: 'ゆるんだ', name: 'sd_relaxed' },
  { left: '鈍い', right: '鋭い', name: 'sd_sharp' }
];

// 3. プリロード
const preload = {
  type: jsPsychPreload,
  images: imageList
};

// 4. スライダー評価（1回目）のテンプレート
const sliderTrial = {
  type: jsPsychSurveyHtmlForm, // ★プラグインを変更
  
  html: function() {
    // 現在の試行の画像パスを取得
    const imgPath = jsPsych.timelineVariable('image_path');
    
    // SD法のスライダーHTMLを生成
    let slidersHTML = '';
    sdItems.forEach(item => {
      slidersHTML += `
        <div class="sd-item">
          <span class="sd-label left">${item.left}</span>
          <input type="range" name="${item.name}" min="0" max="100" value="50" class="sd-slider" required>
          <span class="sd-label right">${item.right}</span>
        </div>
      `;
    });

    // 全体のHTMLを返す
    return `
      <style>
        .container { display: flex; max-width: 900px; margin: 0 auto; gap: 40px; text-align: left; }
        .left-col { flex: 1; position: sticky; top: 20px; height: fit-content; }
        .right-col { flex: 1.5; display: flex; flex-direction: column; gap: 30px; padding-top: 20px; }
        .sticky-image { width: 100%; height: auto; border: 1px solid #ccc; }
        
        /* SD法スライダー用のCSS */
        .sd-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .sd-label { flex: 1; text-align: center; font-size: 14px; }
        .sd-label.left { text-align: right; }
        .sd-label.right { text-align: left; }
        .sd-slider { flex: 3; margin: 0 15px; }
      </style>

      <div class="container">
        <div class="left-col">
          <img src="${imgPath}" class="sticky-image">
        </div>
        <div class="right-col">
          <p>この作品についての印象を、各スケールでお答えください。</p>
          ${slidersHTML}
        </div>
      </div>
    `;
  },
  button_label: '次へ',
  data: {
    task: 'rating',
    image_path: jsPsych.timelineVariable('image_path')
  },
  on_finish: function(data) {
    // jsPsychSurveyHtmlFormは回答を data.response という1つのオブジェクトにまとめるので、
    // 分析しやすいように、個別のカラムに展開して保存し直す（任意だが推奨）
    
    // data.response = { sd_bright: "75", sd_warm: "20", ... }
    const responses = data.response;
    
    // スコアを数値に変換して、データプロパティのトップレベルに追加
    data.sd_bright = Number(responses.sd_bright);
    data.sd_warm = Number(responses.sd_warm);
    data.sd_beautiful = Number(responses.sd_beautiful);
    
    // 以前のコードとの互換性のため、'美しい'のスコアを 'response' にも入れておく
    data.response = Number(responses.sd_beautiful);
  }
};

// 5. 1回目の評価ループ
const trials = {
  timeline: [sliderTrial],
  timeline_variables: imageList.map(img => {
    return { image_path: img };
  }),
  randomize_order: true
};

// 6. ライティング課題（2カラム・スクロール追従）
let writingTargetImage = '';
let writingTargetScore = 0;

const writingTrial = {
  type: jsPsychSurveyHtmlForm,
  
  html: function() {
    // 評価データの取得方法を修正
    const ratingData = jsPsych.data.get().filter({task: 'rating'}).values();
    let lowestTrial = null;
    let lowestScore = Infinity;

    // 各試行のデータを確認
    ratingData.forEach(trial => {
      // sd_beautiful の値を使用して比較
      if (trial.sd_beautiful < lowestScore) {
        lowestScore = trial.sd_beautiful;
        lowestTrial = {
          stimulus: trial.image_path,// 画像パスを保存
          response: trial.sd_beautiful // 美しさの評価を保存
        };
      }
    });

    // データが見つからない場合のエラーハンドリング
    if (!lowestTrial) {
      console.error('評価データが見つかりません');
      writingTargetImage = 'N/A';
      writingTargetScore = 'N/A';
    } else {
      writingTargetImage = lowestTrial.stimulus;
      writingTargetScore = lowestTrial.response;
    }

    // 2カラムレイアウトのHTMLを返す
    return `
      <style>
        .container {
          display: flex;
          max-width: 900px;
          margin: 0 auto;
          gap: 40px;
          text-align: left;
        }
        .left-col {
          flex: 1;
          position: sticky; /* ★スクロール追従 */
          top: 20px;
          height: fit-content;
        }
        .right-col {
          flex: 1.5;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .sticky-image {
          width: 100%;
          height: auto;
          border: 1px solid #ccc;
          box-shadow: 2px 2px 8px rgba(0,0,0,0.1);
        }
        label {
          font-weight: bold;
          display: block;
          margin-bottom: 8px;
        }
        textarea, input[type="text"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-sizing: border-box; /* パディングを含めた幅にする */
        }
      </style>

      <div class="container">
        <div class="left-col">
          <p>あなたが最も低く評価した作品（評価：${writingTargetScore}）</p>
          <img src="${writingTargetImage}" class="sticky-image">
        </div>

        <div class="right-col">
          <h3>以下の質問にお答えください</h3>
          
          <div>
            <label for="q1">1. この作品のどこが最も気になりましたか？</label>
            <textarea id="q1" name="q1_concern" rows="6" required></textarea>
          </div>

          <div>
            <label for="q2">2. もしあなたが作者なら、どの色を変更しますか？</label>
            <textarea id="q2" name="q2_color_change" rows="4"></textarea>
          </div>

          <div>
            <label for="q3">3. この作品にタイトルをつけるとしたら？</label>
            <input type="text" id="q3" name="q3_title_suggestion">
          </div>

           <div style="height: 400px; background: #f9f9f9; padding: 20px; border-radius: 8px;">
             <label>4. （その他の質問...）</label>
             <p>ここにさらに多くの質問が並び、画面が縦に長くなっても、左側の絵画は常に画面内に留まります。</p>
           </div>

        </div>
      </div>
    `;
  },
  button_label: '回答を送信する',
  data: function() {
    return {
      task: 'writing',
      target_image: writingTargetImage,
      target_score: writingTargetScore
    };
  }
};

// 7. 再評価前の説明文
const reratingInstruction = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 600px; margin: auto; line-height: 1.6;">
      <p>アンケートへのご回答、ありがとうございました。</p>
      <p>最後に、もう一度すべての作品を評価していただきます。</p>
      <br>
      <p>準備ができたら、何かキーを押して開始してください。</p>
    </div>
  `
};

// 8. スライダー評価（2回目・再評価）のテンプレート
const reratingTrial = {
  type: jsPsychImageSliderResponse,
  stimulus: jsPsych.timelineVariable('image_path'),
  labels: ['全くそう思わない', 'どちらでもない', '非常にそう思う'],
  min: 0,
  max: 100,
  slider_start: 50,
  require_movement: true,
  prompt: '<p><b>(再評価)</b> この画像を見て、どの程度「美しい」と感じますか？</p>',
  data: {
    task: 'rerating' // 2回目の評価
  }
};

// 9. 2回目の評価ループ
const trials_rerating = {
  timeline: [reratingTrial],
  timeline_variables: imageList.map(img => {
    return { image_path: img };
  }),
  randomize_order: true
};


// 10. 実験の実行
jsPsych.run([
  preload,
  trials,
  writingTrial,
  reratingInstruction,
  trials_rerating
]);