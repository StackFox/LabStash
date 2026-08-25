import { QRCodeSVG } from 'qrcode.react'

interface QRProps {
    uploadId: string;
}

const QRGenerator = ({ uploadId }: QRProps) => {
    const downloadUrl = `${process.env.NEXT_PUBLIC_HOST_URL}/d/${uploadId}`

    return (
        <div className="qr-wrapper">
            <QRCodeSVG
                value={downloadUrl}
                size={200}
                level="M"
                marginSize={2}
            />
            <p>Scan to download on your phone</p>
        </div>
    )
}

export default QRGenerator;
