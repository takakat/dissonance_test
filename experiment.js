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

// 3. プリロード
const preload = {
  type: jsPsychPreload,
  images: imageList
};

// 4. スライダー評価（1回目）のテンプレート
const sliderTrial = {
  type: jsPsychImageSliderResponse,
  stimulus: jsPsych.timelineVariable('image_path'),
  labels: ['全くそう思わない', 'どちらでもない', '非常にそう思う'],
  min: 0,
  max: 100,
  slider_start: 50,
  require_movement: true,
  prompt: '<p>この画像を見て、どの程度「美しい」と感じますか？</p>',
  data: {
    task: 'rating' // 1回目の評価
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
  type: jsPsychHtmlForm, // ★ jsPsychHtmlForm を使用
  
  html: function() {
    // 最低評価の画像を探す
    const ratingData = jsPsych.data.get().filter({task: 'rating'});
    let lowestTrial = null;
    ratingData.values().forEach(trial => {
      if (lowestTrial === null || trial.response < lowestTrial.response) {
        lowestTrial = trial;
      }
    });

    if (lowestTrial) {
      writingTargetImage = lowestTrial.stimulus;
      writingTargetScore = lowestTrial.response;
    } else {
      writingTargetImage = 'N/A';
      writingTargetScore = 'N/A';
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