import DirectDownloadClient from '@/components/download/DirectDownloadClient';

interface Props { params: Promise<{ file_id: string }> }

export default async function DirectDownloadPage({ params }: Props) {
  const { file_id } = await params;
  return <DirectDownloadClient identifier={file_id} />;
}
