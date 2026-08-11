'use client';

import { useRouter } from 'next/navigation';

interface Props {
  fileId: string;
}

export default function DirectDownloadButton({ fileId }: Props) {
  const router = useRouter();

  const handleDownload = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/download/${fileId}`);

      if (!response.ok) {
        let detail = '';

        try {
          const error = await response.json() as { detail?: string };
          detail = error.detail ?? '';
        } catch {
          // Keep the generic error behavior for non-JSON responses.
        }

        if (detail === 'File not found') {
          router.push('/download/not-found');
          return;
        }

        throw new Error(detail || 'Download failed');
      }

      const disposition = response.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^\"]+)"?/);
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');

      link.href = objectUrl;
      link.download = match?.[1] ?? 'download';
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <button className="primary-button full-button" onClick={handleDownload}>
      Download file ↗
    </button>
  );
}
