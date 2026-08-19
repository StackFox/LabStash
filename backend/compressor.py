from pathlib import PurePath
from tempfile import SpooledTemporaryFile
from typing import BinaryIO, Iterable, Iterator
from zipfile import ZIP_DEFLATED, ZipFile

from services.r2 import download_bytes


def _archive_name(filename: str, used_names: set[str]) -> str:
    candidate = PurePath(filename).name or "file"
    if candidate not in used_names:
        used_names.add(candidate)
        return candidate

    path = PurePath(candidate)
    suffix = ''.join(path.suffixes)
    stem = candidate[:-len(suffix)] if suffix else candidate
    counter = 2
    while True:
        renamed = f"{stem} ({counter}){suffix}"
        if renamed not in used_names:
            used_names.add(renamed)
            return renamed
        counter += 1


def create_zip(files: Iterable[tuple[str, str]]) -> BinaryIO:
    """Create a ZIP stream from (storage_path, original_filename) pairs."""
    zip_buffer = SpooledTemporaryFile(max_size=8 * 1024 * 1024, mode="w+b")
    used_names: set[str] = set()

    with ZipFile(zip_buffer, "w", compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for storage_path, original_filename in files:
            archive.writestr(_archive_name(original_filename, used_names), download_bytes(storage_path))

    zip_buffer.seek(0)
    return zip_buffer


def stream_zip(zip_buffer: BinaryIO, chunk_size: int = 1024 * 1024) -> Iterator[bytes]:
    try:
        while chunk := zip_buffer.read(chunk_size):
            yield chunk
    finally:
        zip_buffer.close()
