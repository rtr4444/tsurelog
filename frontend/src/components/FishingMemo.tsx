interface MemoProps {
  memo: string;
  setMemo: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * 釣行のフリーメモ・備考を入力するテキストエリアコンポーネント
 */
export default function FishingMemo({ memo, setMemo }: MemoProps) {
  return (
    <section className="form-section">
      <h2 className="section-title">メモ・備考</h2>

      <div className="memo-container">
        <textarea
          className="memo-textarea"
          placeholder="当日の天気やタイドグラフの状況、ベイトの種類、ヒットルアーのアクションなど、自由にメモを残してください（最大1000文字）"
          maxLength={1000}
          rows={6}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        <div className="memo-counter">
          <span>{memo.length}</span> / 1000文字
        </div>
      </div>
    </section>
  );
}
