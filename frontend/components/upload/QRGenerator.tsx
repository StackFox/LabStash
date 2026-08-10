'use client'
import { QRCodeSVG } from 'qrcode.react'

interface QRProps {
    fileId: string;
    shortCode: string;
}

const QRGenerator = ({ fileId }: QRProps) => {
    const downloadUrl = `${process.env.NEXT_PUBLIC_HOST_URL}/download/${fileId}`

    return (
        <div className='mb-9'>
            <QRCodeSVG
                value={downloadUrl}
                size={200}
                level="M"
                marginSize={2}
                className='mx-auto my-3'
            />
            <p>Scan to download on your phone</p>
        </div>
    )
}

export default QRGenerator;