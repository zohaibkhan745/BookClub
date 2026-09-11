import pytest
from unittest.mock import patch

def test_upload_url_generation(client, mock_user_auth):
    with patch("app.utils.r2_storage.generate_presigned_put_url") as mock_generate:
        mock_generate.return_value = {
            "upload_url": "https://mock-s3-url.com",
            "public_url": "https://pub.com/img.jpg",
            "key": "mock/key.jpg"
        }
        
        # Mock r2_storage.is_r2_configured to return True so we don't get 503
        with patch("app.utils.r2_storage.is_r2_configured", return_value=True):
            response = client.post(
                "/api/v1/storage/upload-url",
                json={
                    "fileName": "test_cover.jpg",
                    "contentType": "image/jpeg",
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "original" in data["data"]
            assert "thumbnail" in data["data"]
            
            # We expect the URL generator to be called twice (original + thumbnail)
            assert mock_generate.call_count == 2

def test_delete_file_path_traversal(client, mock_user_auth):
    # Try deleting a file outside the books directory
    with patch("app.utils.r2_storage.is_r2_configured", return_value=True):
        response = client.request(
            "DELETE",
            "/api/v1/storage/file",
            json={
                "key": "../secrets/config.json"
            }
        )
        
        assert response.status_code == 403
        assert "FORBIDDEN" in response.json()["detail"]["code"]

def test_delete_file_success(client, mock_user_auth):
    with patch("app.utils.r2_storage.delete_file") as mock_delete:
        mock_delete.return_value = True
        
        with patch("app.utils.r2_storage.is_r2_configured", return_value=True):
            response = client.request(
                "DELETE",
                "/api/v1/storage/file",
                json={
                    "key": f"originals/{mock_user_auth['id']}/123.jpg"
                }
            )
            
            assert response.status_code == 200
            assert mock_delete.called
