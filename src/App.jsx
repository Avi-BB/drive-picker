import GoogleDrivePicker from "google-drive-picker";
import { downloadFile } from "./utils/downloadFile";

const App = () => {
  const [openPicker] = GoogleDrivePicker();
  const clientId = import.meta.env.CLIENT_ID;
  const developerKey = import.meta.env.DEVELOPER_KEY;
  const handleOAuth2Authentication = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?gsiwebsdk=3&client_id=${clientId}&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.file&redirect_uri=storagerelay%3A%2F%2Fhttp%2Flocalhost%3A3000%3Fid%3Dauth327369&prompt=select_account&response_type=token&include_granted_scopes=true&enable_granular_consent=true&service=lso&o2v=2&ddm=0&flowName=GeneralOAuthFlow`;

    const handleAuthWindowMessage = (event) => {
      if (event.origin === window.location.origin) {
        const data = event.data;
        console.log("AUTH DATA RES: ", data);

        // Check if the response contains the access token
        if (data.access_token) {
          const accessToken = data.access_token;
          handlePickerOpen(accessToken);
          window.removeEventListener("message", handleAuthWindowMessage);
        } else if (data.error) {
          console.error("Authentication error:", data.error);
          window.removeEventListener("message", handleAuthWindowMessage);
        } else {
          console.warn("Unexpected response format:", data);
        }
      }
    };

    window.addEventListener("message", handleAuthWindowMessage);
    const windowFeatures = "left=100,top=100,width=600,height=600";
    const authWindow = window.open(authUrl, "mozillaWindow", windowFeatures);

    if (!authWindow) {
      // The window couldn't be opened, likely due to a popup blocker
      console.error("Failed to open authentication window");
      return;
    }

    const handleAuthResult = (event) => {
      console.log("Auth Result", { event });
      const data = JSON.parse(event?.data);
      console.log({ data }, event.origin === window.location.origin);
      if (data.params.authResult.access_token) {
        console.log({ accessToken: data.params.authResult.access_token });
        handlePickerOpen(data.params.authResult.access_token);
      }
    };

    window.addEventListener("message", handleAuthResult);
  };

  const handlePickerOpen = (accessToken) => {
    openPicker({
      clientId: clientId,
      developerKey: developerKey,
      viewId: "DOCS",
      token: accessToken,
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: false,
      customScopes: ["https://www.googleapis.com/auth/drive.file"],
      callbackFunction: (data) => {
        console.log({ data });
        if (data.action === "cancel") {
          console.log("User clicked cancel/close button");
        } else if (data.docs) {
          const file = data.docs[0];
          downloadFile(accessToken, file);
        }
      },
    });
  };

  return (
    <>
      <div className="App">
        <h1>Google Drive File Download</h1>
        <button onClick={handleOAuth2Authentication}>
          Authenticate and Open Google Drive Picker
        </button>
      </div>
    </>
  );
};

export default App;
