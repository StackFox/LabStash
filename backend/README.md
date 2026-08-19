## LabStash Backend

TODO:

1. create and display a short-unique code when a user uploads a document ✅
2. add /download endpoint to allow the user to enter their unique code and download the file ✅
3. add qr code after upload ✅
4. add "file not found page" at the frontend ✅
5. add customisable timer ✅
6. increase MAX_FILE_SIZE limit for first few users ✅
7. add short_code validation at /download page ✅
8. update /api/download endpoint to track the number of downloads in app.db ✅
9.  add feature for the user to limit the number of maximum downloads for the file the're uploading ✅
10. add multiple file uploads options [IMPORTANT] ✅
    - DATABASE Schema update ✅
    - app/database.py ✅
    - app/routes/upload.py ✅
    - app/scheduler.py ✅
    - app/routes/download.py ✅
  
11. count max_downloads once per file [More complex and potential risk] ❌
12. delete files from r2 as soon as MAX_DOWNLOAD limit is reached.
13. add caching for manifest retrieval ✅
14. add download files as zip at backend ✅
15. can also use redis for caching ✅

## issues

- download rate limit is attached to /api/files/{identifier} which means whenever a user clicks on "Find files" button it increments the download_count in uploads table. So, the donwload_count is incremented whether or not the user downloads the file.  [fixed]