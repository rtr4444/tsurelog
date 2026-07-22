import { useState } from 'react';
import { useNavigate } from 'react-router';
import '../css/register_catch.css';
import { PageHeader } from '../components/ui/PageHeader';
import TimeImporter from '../components/TimeImporter';
import PhotoSection from '../components/PhotoSection';
import FishingPointSelect from '../components/FishingPointSelect';
import FishingTimeline from '../components/FishingTimeline';
import FishingMemo from '../components/FishingMemo';
import { getPresignedUrls, uploadPhotoToS3, submitFinalReport } from '../api/fishingReport';
import type {
  TimelineItem,
  PhotoItem,
  FinalFishingReport,
} from '../../../package/shared-types/types';

/**
 * 釣果レポートの新規登録を行うコンポーネント
 */
export default function RegisterFishingReport() {
  const navigate = useNavigate();
  const pageHeader = { header: '🐡 釣果登録', link: '/' };

  const [startDatetime, setStartDatetime] = useState<string>('');
  const [endDatetime, setEndDatetime] = useState<string>('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [newPointName, setNewPointName] = useState<string>('');
  const [timelineList, setTimelineList] = useState<TimelineItem[]>([]);
  const [memo, setMemo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDatetime || !endDatetime) {
      alert('釣行時間を入力、またはファイルから取り込んでください。');
      return;
    }

    if (!selectedPoint) {
      alert('釣り場ポイントを選択してください。');
      return;
    }

    if (selectedPoint === 'other' && !newPointName.trim()) {
      alert('新しいポイント名を入力してください。');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedS3Paths: string[] = [];

      if (photos.length > 0) {
        const targetFiles = photos.map((p) => p.file);
        const presignedDataList = await getPresignedUrls(targetFiles);

        await Promise.all(
          presignedDataList.map(async (presignedData) => {
            const matchedFile = targetFiles.find((f) => f.name === presignedData.fileName);
            if (!matchedFile)
              throw new Error(`ファイルが見つかりません: ${presignedData.fileName}`);
            await uploadPhotoToS3(matchedFile, presignedData.uploadUrl);
          }),
        );
        uploadedS3Paths = presignedDataList.map((d) => d.s3Path);
      }

      const finalReportData: FinalFishingReport = {
        time: { start: startDatetime, end: endDatetime },
        photoKeys: uploadedS3Paths,
        point: {
          code: selectedPoint,
          customName: selectedPoint === 'other' ? newPointName : null,
        },
        fishTimeline: timelineList.map((item) => ({
          id: item.id,
          date: item.date,
          fishType: item.fishType,
          size: item.size,
          rigType: item.rigType,
          weight: item.weight,
          hookSize: item.hookSize,
        })),
        memo: memo,
      };

      await submitFinalReport(finalReportData);

      alert('釣果レポートの登録が完了しました');
      navigate('/');
    } catch (error) {
      console.error('Failed to register report:', error);
      alert('登録に失敗しました。時間をおいて再度お試しください');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader header={pageHeader.header} link={pageHeader.link} />

      <form onSubmit={handleSubmitReport}>
        <main className="form-container">
          <TimeImporter
            startDatetime={startDatetime}
            setStartDatetime={setStartDatetime}
            endDatetime={endDatetime}
            setEndDatetime={setEndDatetime}
            setTimelineList={setTimelineList}
          />

          <PhotoSection photos={photos} setPhotos={setPhotos} />

          <FishingPointSelect
            selectedPoint={selectedPoint}
            setSelectedPoint={setSelectedPoint}
            newPointName={newPointName}
            setNewPointName={setNewPointName}
          />

          <FishingTimeline timelineList={timelineList} setTimelineList={setTimelineList} />

          <FishingMemo memo={memo} setMemo={setMemo} />

          <div className="form-submit-area">
            <button type="submit" className="btn-submit-form" disabled={isSubmitting}>
              {isSubmitting ? '⚓ データを送信中...' : '⚓ この内容で釣果を登録する'}
            </button>
          </div>
        </main>
      </form>
    </div>
  );
}
