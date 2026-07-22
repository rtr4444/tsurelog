interface TimeImporterProps {
  startDatetime: string;
  setStartDatetime: React.Dispatch<React.SetStateAction<string>>;
  endDatetime: string;
  setEndDatetime: React.Dispatch<React.SetStateAction<string>>;
  setTimelineList: React.Dispatch<React.SetStateAction<any[]>>;
}

/**
 * 釣行時間のファイルを読み込み、開始/終了日時のセット、および中間の時間から釣果タイムラインを自動生成するコンポーネント
 */
export default function TimeImporter({
  startDatetime,
  setStartDatetime,
  endDatetime,
  setEndDatetime,
  setTimelineList,
}: TimeImporterProps) {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    try {
      const text = await files[0].text();
      const rawText = text.trim();

      if (!rawText) {
        alert('テキストが空です。');
        return;
      }

      const lines = rawText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '');

      const dateLines = lines
        .map((line) => Date.parse(line))
        .filter((parsedDate) => !isNaN(parsedDate));

      if (dateLines.length < 2) {
        alert('データが少なすぎます。最低２行以上必要です。');
        return;
      }

      const jstOffset = 9 * 60 * 60 * 1000;
      const toJSTString = (value: number) => new Date(value + jstOffset).toISOString().slice(0, 16);

      const startValue = dateLines[0];
      const endValue = dateLines.slice(-1)[0];

      setStartDatetime(toJSTString(startValue));
      setEndDatetime(toJSTString(endValue));

      if (dateLines.length > 2) {
        const middleDates = dateLines.slice(1, -1);

        const autoTimelineItems = middleDates.map((timeValue) => ({
          id: crypto.randomUUID(),
          checked: false,
          date: toJSTString(timeValue),
          fishType: '',
          size: '',
          rigType: '',
          weight: '',
          hookSize: '',
        }));

        setTimelineList((prev) => [...prev, ...autoTimelineItems]);
      }
    } catch (error) {
      console.error('File reading error:', error);
      alert('ファイルの読み込み中にエラーが発生しました。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="time-importer-wrapper">
      <section className="form-section">
        <h2 className="section-title">⌚ 釣行時間</h2>
        <label className="file-select-btn">
          📝 ファイル取込
          <input type="file" id="time-file-input" accept=".txt" onChange={handleFileChange} />
        </label>

        <div className="date-input-group">
          <label htmlFor="start-datetime" className="date-label">
            開始：
          </label>
          <input
            type="datetime-local"
            id="start-datetime"
            className="datetime-picker"
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
          />
        </div>

        <div className="date-input-group mt-4">
          <label htmlFor="end-datetime" className="date-label">
            終了：
          </label>
          <input
            type="datetime-local"
            id="end-datetime"
            className="datetime-picker"
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
          />
        </div>
      </section>
    </div>
  );
}
