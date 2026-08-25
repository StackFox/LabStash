import asyncio
from unittest.mock import Mock, patch
import time

import pytest
from fastapi import HTTPException

from routes.delete_now import delete_files
from routes.download import download_file


class ConnectionContext:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc_value, traceback):
        return False


def make_connection(file_rows=None, locked_session=None):
    connection = Mock()
    connection.execute.return_value.fetchall.return_value = file_rows or []
    connection.execute.return_value.fetchone.return_value = locked_session
    return connection


def run_route(identifier):
    return asyncio.run(delete_files(identifier))


def run_download(identifier):
    return asyncio.run(download_file(identifier))


def test_missing_upload_is_idempotent():
    connection = make_connection()

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=None
    ):
        result = run_route("MISSING1")

    assert result == {"status": "already_deleted"}
    connection.commit.assert_not_called()


def test_expired_upload_is_deleted():
    session = {"id": "upload-1", "expires_at": 0}
    connection = make_connection([{"storage_path": "upload-1/file-1"}], session)

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ), patch("routes.delete_now.delete_object") as delete_object:
        result = run_route("ABC123")

    delete_object.assert_called_once_with("upload-1/file-1")
    assert result == {"status": "deleted", "upload_id": "upload-1"}
    assert connection.execute.call_args_list[0].args == (
        "SELECT * FROM uploads WHERE id = %s FOR UPDATE",
        ("upload-1",),
    )
    assert connection.execute.call_args_list[1].args == (
        "SELECT storage_path FROM files WHERE upload_id = %s",
        ("upload-1",),
    )
    connection.commit.assert_called_once_with()


def test_storage_failure_retains_database_rows_and_attempts_all_objects():
    session = {"id": "upload-1", "expires_at": 0}
    file_rows = [
        {"storage_path": "upload-1/file-1"},
        {"storage_path": "upload-1/file-2"},
    ]
    connection = make_connection(file_rows, session)

    def fail_first(path):
        if path.endswith("file-1"):
            raise RuntimeError("R2 unavailable")

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ), patch("routes.delete_now.delete_object", side_effect=fail_first) as delete_object:
        with pytest.raises(HTTPException) as error:
            run_route("ABC123")

    assert error.value.status_code == 503
    assert isinstance(error.value.__cause__, RuntimeError)
    assert [call.args[0] for call in delete_object.call_args_list] == [
        "upload-1/file-1",
        "upload-1/file-2",
    ]
    connection.rollback.assert_called_once_with()
    connection.commit.assert_not_called()
    assert not any("DELETE FROM" in call.args[0] for call in connection.execute.call_args_list)


def test_success_deletes_every_object_and_database_rows():
    session = {"id": "upload-1", "expires_at": 0}
    file_rows = [
        {"storage_path": "upload-1/file-1"},
        {"storage_path": "upload-1/file-2"},
    ]
    connection = make_connection(file_rows, session)

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ), patch("routes.delete_now.delete_object") as delete_object:
        result = run_route("550e8400-e29b-41d4-a716-446655440000")

    assert result == {"status": "deleted", "upload_id": "upload-1"}
    assert [call.args[0] for call in delete_object.call_args_list] == [
        "upload-1/file-1",
        "upload-1/file-2",
    ]
    sql_calls = [call.args[0] for call in connection.execute.call_args_list]
    assert sql_calls[-2:] == [
        "DELETE FROM files WHERE upload_id = %s",
        "DELETE FROM uploads WHERE id = %s",
    ]
    assert connection.execute.call_args_list[-2].args[1] == ("upload-1",)
    assert connection.execute.call_args_list[-1].args[1] == ("upload-1",)
    connection.commit.assert_called_once_with()


def test_no_files_still_deletes_upload_row_and_commits():
    session = {"id": "upload-1", "expires_at": 0}
    connection = make_connection(locked_session=session)

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ):
        result = run_route("ABC123")

    assert result == {"status": "deleted", "upload_id": "upload-1"}
    assert connection.execute.call_args_list[-2].args == (
        "DELETE FROM files WHERE upload_id = %s",
        ("upload-1",),
    )
    assert connection.execute.call_args_list[-1].args == (
        "DELETE FROM uploads WHERE id = %s",
        ("upload-1",),
    )
    connection.commit.assert_called_once_with()


def test_route_forwards_supplied_identifiers_to_resolver():
    session = {"id": "upload-1", "expires_at": 0}
    connection = make_connection(locked_session=session)
    identifier = "550e8400-e29b-41d4-a716-446655440000"

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ) as resolve_session:
        run_route(identifier)

    resolve_session.assert_called_once_with(connection, identifier)


def test_deleted_between_resolve_and_lock_is_idempotent():
    session = {"id": "upload-1", "expires_at": 0}
    connection = make_connection(locked_session=None)

    with patch("routes.delete_now.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.delete_now.resolve_session", return_value=session
    ):
        result = run_route("ABC123")

    assert result == {"status": "already_deleted"}
    assert connection.execute.call_args_list[0].args == (
        "SELECT * FROM uploads WHERE id = %s FOR UPDATE",
        ("upload-1",),
    )
    connection.commit.assert_not_called()


def make_download_connection(locked_session, file_rows, updated_session):
    connection = Mock()
    lock_result = Mock()
    lock_result.fetchone.return_value = locked_session
    files_result = Mock()
    files_result.fetchall.return_value = file_rows
    update_result = Mock()
    update_result.fetchone.return_value = updated_session
    connection.execute.side_effect = [lock_result, files_result, update_result]
    return connection


def test_download_locks_upload_before_storage_checks_and_zip_creation():
    resolved_session = {"id": "upload-1", "expires_at": int(time.time()) + 60}
    locked_session = {
        "id": "upload-1",
        "short_code": "LOCKED1",
        "expires_at": int(time.time()) + 60,
    }
    connection = make_download_connection(
        locked_session,
        [{"storage_path": "upload-1/file-1", "original_filename": "file.txt"}],
        {"download_count": 1, "max_downloads": 1},
    )

    with patch("routes.download.get_connection", return_value=ConnectionContext(connection)), patch(
        "routes.download.resolve_session", return_value=resolved_session
    ), patch("routes.download.object_exists", return_value=True), patch(
        "routes.download.create_zip", return_value=Mock(name="zip_stream")
    ) as create_zip, patch("routes.download.stream_zip", return_value=iter([b"zip"])), patch(
        "routes.download.time.time", return_value=time.time()
    ):
        response = run_download("ABC123")

    assert response.media_type == "application/zip"
    assert response.headers["content-disposition"] == 'attachment; filename="labstash-LOCKED1.zip"'
    assert connection.execute.call_args_list[0].args == (
        "SELECT * FROM uploads WHERE id = %s FOR UPDATE",
        ("upload-1",),
    )
    create_zip.assert_called_once_with([("upload-1/file-1", "file.txt")])
    connection.commit.assert_called_once_with()


def test_download_zip_failure_rolls_back_counter_increment_without_second_transaction():
    locked_session = {
        "id": "upload-1",
        "short_code": "ABC123",
        "expires_at": int(time.time()) + 60,
    }
    connection = make_download_connection(
        locked_session,
        [{"storage_path": "upload-1/file-1", "original_filename": "file.txt"}],
        {"download_count": 1, "max_downloads": 1},
    )

    with patch("routes.download.get_connection", return_value=ConnectionContext(connection)) as get_connection, patch(
        "routes.download.resolve_session", return_value=locked_session
    ), patch("routes.download.object_exists", return_value=True), patch(
        "routes.download.create_zip", side_effect=RuntimeError("R2 unavailable")
    ):
        with pytest.raises(RuntimeError, match="R2 unavailable"):
            run_download("ABC123")

    connection.rollback.assert_called_once_with()
    connection.commit.assert_not_called()
    get_connection.assert_called_once_with()
