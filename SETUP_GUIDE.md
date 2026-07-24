# Google Play Developer API — Service Account Setup Guide

Setting up API access requires two steps: creating a Service Account (via Google Cloud Console or `gcloud` CLI), and granting it permissions inside the Google Play Console.

---

## 🛠️ Part 1: Create the Service Account

Choose one of the two methods below.

---

### Method A: Google Cloud Console (Web UI)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a project linked to your Play Developer account.
3. Navigate to **IAM & Admin** > **Service Accounts**.
4. Click **Create Service Account**.
   - Name: e.g. `play-console-mcp-agent`
   - Click **Create and Continue** > skip role assignment > **Done**.
5. Click the new service account email in the list.
6. Open the **Keys** tab > **Add Key** > **Create new key** > **JSON** > **Create**.
7. A `key.json` file will download. **Keep it secure — never commit it to version control.**

---

### Method B: gcloud CLI (Faster)

If you have the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed, run these commands:

```bash
# Set your project ID
export PROJECT_ID="your-gcloud-project-id"
export SA_NAME="play-console-mcp-agent"

# Create the service account
gcloud iam service-accounts create $SA_NAME \
  --display-name="Play Console MCP Agent" \
  --project=$PROJECT_ID

# Export the JSON private key
gcloud iam service-accounts keys create key.json \
  --iam-account=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com
```

Your `key.json` will be generated in the current directory. Use its path with `--key-file` or set it in `GOOGLE_APPLICATION_CREDENTIALS`.

> **Note**: No Cloud IAM roles are required on the service account itself. All permissions are configured in the Play Console (Part 2 below).

---

## 🏪 Part 2: Grant Permissions in Google Play Console

Google Play Console permissions must be set **manually via the web UI** — there is no API or gcloud command for this.

### Steps

1. Go to the [Google Play Console](https://play.google.com/console/).
2. From the left sidebar, click **Users and permissions**.
3. Click **Invite new users**.
4. Paste the service account email (from `client_email` in your `key.json`).
   - Format: `play-console-mcp-agent@your-project.iam.gserviceaccount.com`
5. Select the required permissions (see table below).
6. Click **Invite user** — access is active immediately (no email confirmation needed).

---

### Required Permissions by Tool

Grant permissions either **per app** (App permissions tab → Add app) or **account-wide** (Account permissions tab).

| Permission in Play Console | Tools Enabled |
| :--- | :--- |
| **View app information and download bulk reports** *(read-only)* | `query_crash_rate`, `query_anr_rate`, `get_store_listing`, `list_all_listings`, `get_app_details`, `list_store_images`, `get_track`, `list_tracks`, `list_reviews`, `get_review`, `list_inapp_products`, `list_subscriptions` |
| **Reply to reviews** | `reply_review` |
| **Manage store presence** | `update_store_listing`, `update_app_details`, `update_data_safety`, `upload_store_image`, `delete_store_image`, `delete_all_store_images` |
| **Manage draft releases** | `create_edit`, `upload_aab`, `assign_track`, `validate_edit` |
| **Release apps to testing tracks** | `commit_edit` |

> **Tip**: For read-only monitoring workflows (crash/ANR vitals, reviews), only grant **"View app information"**. Add more permissions only if you need write access.

### Minimum Permissions by Use Case

| Use Case | Permissions Needed |
| :--- | :--- |
| Monitor crash/ANR vitals only | View app information |
| Read + reply to reviews | View app information + Reply to reviews |
| Update store listing text/images | View app information + Manage store presence |
| Full release pipeline (build → publish) | View app information + Manage store presence + Manage draft releases + Release apps to testing tracks |

---

## 🧪 Part 3: Verify Setup

Run the built-in setup checker to validate your credentials and Google API connectivity:

```bash
npx @w3wide/play-console-mcp \
  --key-file /path/to/key.json \
  --package-name com.your.app.package \
  --setup
```

This will:
- Parse and validate the JSON key format
- Check for required environment variables
- Perform a live Google OAuth token generation test

---

## ⚙️ Part 4: Configure the MCP Server

Add to your AI agent's MCP config (e.g. Claude Code, Cursor):

```json
{
  "mcpServers": {
    "play-console": {
      "command": "npx",
      "args": [
        "@w3wide/play-console-mcp",
        "--key-file", "/absolute/path/to/key.json",
        "--package-name", "com.your.app.package"
      ]
    }
  }
}
```

Or use environment variables in a `.env` file:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
DEFAULT_PACKAGE_NAME=com.your.app.package
```
