# Google Play Developer API Service Account Setup Guide

Setting up API access for the Google Play Developer Console requires two main parts: creating a Service Account in the
Google Cloud Console, and linking that account with specific permissions in the Google Play Console.

---

## 🛠️ Part 1: Google Cloud Console Setup (Create the Service Account)

To generate the private key JSON file required by this MCP server, follow these steps:

1. **Open Google Cloud Console**:
   Go to the [Google Cloud Console](https://console.cloud.google.com/).

2. **Select or Create a Project**:
    * Select the Google Cloud project associated with your Google Play Developer Account.
    * If you don't have one, create a new project (e.g., `play-console-mcp`).

3. **Navigate to Service Accounts**:
    * Open the sidebar navigation menu.
    * Go to **IAM & Admin** > **Service Accounts**.

4. **Create Service Account**:
    * Click the **Create Service Account** button at the top.
    * Enter a **Service Account name** (e.g., `play-console-mcp-agent`).
    * Enter a description so you know its purpose.
    * Click **Create and Continue**.
    * On the **Grant roles** page, you can click **Continue** (no Cloud roles are required; permissions are configured
      inside the Play Console).
    * Click **Done** to complete creation.

5. **Generate the JSON Private Key**:
    * Click on the newly created Service Account email address in the list.
    * Switch to the **Keys** tab at the top.
    * Click **Add Key** > **Create new key**.
    * Select **JSON** as the key type.
    * Click **Create**.
    * A JSON file containing your private key will download automatically. **Keep this file secure!** Do not commit it
      to public version control.

---

## 🏪 Part 2: Google Play Console Linkage (Grant Permissions)

Google Play Console requires you to manually invite the service account email and assign permissions for specific apps.

1. **Open Google Play Console**:
   Go to the [Google Play Console](https://play.google.com/console/).

2. **Navigate to Users & Permissions**:
    * From the left-hand navigation sidebar, click on **Users and permissions**.

3. **Invite the Service Account**:
    * Click the **Invite new users** button.
    * In the **Email address** field, paste the service account email (found in your downloaded JSON key under the
      `client_email` key, e.g., `play-console-mcp-agent@project.iam.gserviceaccount.com`).

4. **Assign Permissions**:
    * **To restrict access to specific apps (Recommended)**:
        * Go to the **App permissions** tab.
        * Click **Add app** and select your application.
        * Select the permissions checkmarks described below.
    * **To apply permissions account-wide**:
        * Go to the **Account permissions** tab.
        * Select the permissions checkmarks described below.

5. **Select Required Checkmarks**:
   To enable the MCP server tools, you must grant the following permissions:

   | MCP Tools | Required Play Console Permission Checkmark |
            | :--- | :--- |
   | **Vitals & Analytics** (`query_crash_rate`, `query_anr_rate`) | *View app information and download bulk reports (read-only)* |
   | **Listing & Details** (`get_store_listing`, `list_inapp_products`, etc.) | *View app information and download bulk reports (read-only)* |
   | **Replying to Reviews** (`reply_review`) | *Reply to reviews* |
   | **Store Presence Updates** (`update_store_listing`, `update_data_safety`) | *Manage store presence* |
   | **Staging Releases** (`create_edit`, `upload_aab`, `assign_track`) | *Manage draft releases* |
   | **Releasing App to Tracks** (`commit_edit`) | *Release apps to testing tracks* |

6. **Send Invitation**:
    * Click the **Invite user** button at the bottom right.
    * The Service Account email is added to the permissions roster instantly (since it is a service account, no
      invitation acceptance is needed; it is active immediately).

---

## 🧪 Part 3: Verify Setup

To verify that the Service Account key and permissions are configured correctly, run the built-in setup helper flag:

```bash
npx @w3wide/play-console-mcp --key-file /path/to/downloaded-key.json --package-name com.your.app.package --setup
```

This will run local credential syntax parsing, check path settings, and perform a live Google OAuth handshake to verify
token generation.
