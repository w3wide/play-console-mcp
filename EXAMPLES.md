# Google Play Console MCP Server Examples

This guide demonstrates how an AI agent uses the tools exposed by this MCP server to execute common Google Play Console workflows.

---

## 🚀 Workflow 1: Releasing a New App Bundle (AAB)

To release a new version of an app, the agent executes four tool calls in a strict logical sequence.

### Step 1: Create a new Edit Session
Every update requires an active edit transaction session.

*   **Tool**: `create_edit`
*   **Arguments**:
    ```json
    {}
    ```
*   **Response**:
    ```json
    {
        "id": "1827364590"
    }
    ```

### Step 2: Upload the Android App Bundle (AAB)
Upload the binary file using the edit session ID returned in Step 1.

*   **Tool**: `upload_aab`
*   **Arguments**:
    ```json
    {
        "editId": "1827364590",
        "aabPath": "./dist/release.aab"
    }
    ```
*   **Response**:
    ```json
    {
        "versionCode": 42,
        "sha1": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
    }
    ```

### Step 3: Assign the Version Code to a Release Track
Assign the uploaded version code to a specific track (e.g., `internal`, `alpha`, `beta`, or `production`).

*   **Tool**: `assign_track`
*   **Arguments**:
    ```json
    {
        "editId": "1827364590",
        "track": "internal",
        "versionCode": 42,
        "userFraction": 1.0,
        "releaseNotes": "Bug fixes and performance improvements."
    }
    ```
*   **Response**:
    ```json
    {
        "track": "internal",
        "releases": [
            {
                "versionCodes": [42],
                "status": "completed",
                "releaseNotes": [
                    {
                        "language": "en-US",
                        "text": "Bug fixes and performance improvements."
                    }
                ]
            }
        ]
    }
    ```

### Step 4: Commit and Publish the Edit Session
Apply all the staged changes made in the edit session to the Play Store.

*   **Tool**: `commit_edit`
*   **Arguments**:
    ```json
    {
        "editId": "1827364590"
    }
    ```
*   **Response**:
    ```json
    {
        "id": "1827364590",
        "expiryTimeSeconds": "1782639400"
    }
    ```

---

## 💬 Workflow 2: Checking and Replying to App Reviews

Engage with users by listing recent reviews and posting developer replies.

### Step 1: List Recent Reviews

*   **Tool**: `list_reviews`
*   **Arguments**:
    ```json
    {
        "maxResults": 3
    }
    ```
*   **Response**:
    ```json
    {
        "reviews": [
            {
                "reviewId": "gp:A01B02C...",
                "authorName": "Jane Doe",
                "comments": [
                    {
                        "userComment": {
                            "text": "The app crashes on the login screen after the latest update.",
                            "lastModified": {
                                "seconds": "1721864000"
                            },
                            "starRating": 1,
                            "androidOsVersion": 34,
                            "device": "redfin"
                        }
                    }
                ]
            }
        ]
    }
    ```

### Step 2: Post a Developer Reply

*   **Tool**: `reply_review`
*   **Arguments**:
    ```json
    {
        "reviewId": "gp:A01B02C...",
        "replyText": "Hi Jane, we are sorry for the issue. We have identified a login crash and pushed a hotfix (v1.0.2) to resolve it. Please update the app."
    }
    ```
*   **Response**:
    ```json
    {
        "result": {
            "replyText": "Hi Jane, we are sorry for the issue. We have identified a login crash and pushed a hotfix (v1.0.2) to resolve it. Please update the app.",
            "lastEdited": {
                "seconds": "1721864500"
            }
        }
    }
    ```

---

## 📊 Workflow 3: Monitoring Android Vitals (Crashes and ANRs)

Track stability metrics to detect regressions after releasing a new build.

### Step 1: Query Daily Crash Rates

*   **Tool**: `query_crash_rate`
*   **Arguments**:
    ```json
    {
        "pageSize": 5
    }
    ```
*   **Response**:
    ```json
    {
        "rows": [
            {
                "startTime": "2026-07-24T00:00:00Z",
                "crashRate": 0.0125,
                "distinctUsers": 12500
            }
        ]
    }
    ```

### Step 2: Query Daily ANR (App Not Responding) Rates

*   **Tool**: `query_anr_rate`
*   **Arguments**:
    ```json
    {
        "pageSize": 5
    }
    ```
*   **Response**:
    ```json
    {
        "rows": [
            {
                "startTime": "2026-07-24T00:00:00Z",
                "anrRate": 0.0045,
                "distinctUsers": 12500
            }
        ]
    }
    ```
