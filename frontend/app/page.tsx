import FileUploader from '@/components/upload/FileUploader';

export default function Home() {
  return (
    <div className="mx-auto flex flex-col items-center my-auto">
      <div className="mx-auto flex items-center p-4">
        <h1>LabStash</h1>
      </div>
      <h2>Temporary file storage | No sign up required</h2>
      <FileUploader />
    </div>
  );
}
