interface Props {
  params: Promise<{
    file_id: string
  }>
}

const DownloadPage = async ({ params }: Props) => {
  const { file_id } = await params

  return (
    <div>
      <h1>Your file is ready</h1>

      <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/download/${file_id}`}>
        Download
      </a>
    </div>
  )
}

export default DownloadPage
