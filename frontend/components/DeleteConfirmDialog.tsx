'use client';

import { useEffect, useRef } from 'react';

interface Props {
    open: boolean;
    busy?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteConfirmDialog({ open, busy = false, onCancel, onConfirm }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className="delete-dialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            onCancel={onCancel}
            onClose={onCancel}
        >
            <div className="delete-dialog-content">
                <p className="eyebrow">One last check</p>
                <h2 id="delete-dialog-title">Delete this upload?</h2>
                <p id="delete-dialog-description">This removes the files immediately and cannot be undone.</p>
                <div className="delete-dialog-actions">
                    <button className="text-button" type="button" onClick={onCancel} disabled={busy}>Keep it</button>
                    <button className="secondary-button delete-confirm-button" type="button" onClick={onConfirm} disabled={busy}>
                        {busy ? 'Deleting…' : 'Delete upload'}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
