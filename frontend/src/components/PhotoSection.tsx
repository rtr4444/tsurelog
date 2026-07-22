type PhotoItem = {
  file: File;
  previewUrl: string;
};

interface PhotoSectionProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
}

/**
 * 釣果写真の選択、複数プレビュー表示、および個別削除を行うコンポーネント
 */
export default function PhotoSection({ photos, setPhotos }: PhotoSectionProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    const newImages = newFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newImages].slice(0, 10));
    e.target.value = '';
  };

  const handleDelete = (targetIndex: number) => {
    const imageToDelete = photos[targetIndex];

    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.previewUrl);
    }

    setPhotos((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  return (
    <section className="form-section">
      <h2 className="section-title">📸 釣果写真</h2>

      <label className="file-select-btn">
        📷 写真を選択する
        <input
          type="file"
          id="file-input"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden-file-input"
        />
      </label>

      <div className="image-grid">
        {photos.map((image, index) => (
          <div key={index} className="image-wrapper">
            <div className="image-placeholder">
              <img src={image.previewUrl} alt={`preview-${index}`} />

              <div className="photo-delete-btn" onClick={() => handleDelete(index)}>
                ×
              </div>
            </div>
          </div>
        ))}

        {Array.from({ length: Math.max(0, 10 - photos.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="image-wrapper">
            <div className="image-placeholder">未選択</div>
          </div>
        ))}
      </div>
    </section>
  );
}
