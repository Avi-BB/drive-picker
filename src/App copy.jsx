import GoogleDrivePicker from "google-drive-picker";
import { useEffect, useState } from "react";
import { downloadFile } from "./utils/downloadFile";

const App = () => {
  const [openPicker] = GoogleDrivePicker();
  const [gapi, setGapi] = useState(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasStorageDataCleared, setHasStorageDataCleared] = useState(false);
  const [isInitializingClient, setIsInitializingClient] = useState(false);

  useEffect(() => {
    const loadGapi = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("client:auth2", async () => {
          setGapi(window.gapi);
          setGapiLoaded(true);
          initClient();
        });
      };
      document.body.appendChild(script);
    };

    loadGapi();
  }, []);

  const initClient = async () => {
    if (!isInitializingClient && window.gapi) {
      setIsInitializingClient(true);

      try {
        await window.gapi.client.init({
          clientId: "419729442733-5rmi3p1v8fvd4pld03lct3re9q1omg7i.apps.googleusercontent.com",
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
          scope: "https://www.googleapis.com/auth/drive.file",
          plugin_name: 'D',
        });

        const auth2 = window.gapi.auth2.getAuthInstance();
        await auth2.isSignedIn.listen(handleAuthStatusChange);
        console.log({AUTH: auth2.isSignedIn.get()})
        handleAuthStatusChange(auth2.isSignedIn.get());
      } catch (error) {
        console.error("Error initializing Google API client:", error);
        // Clear browser storage data and retry client initialization if it hasn't been cleared before
        if (!hasStorageDataCleared) {
          clearBrowserStorageData();
          setHasStorageDataCleared(true);
        }
      } finally {
        setIsInitializingClient(false);
      }
    } else {
      console.error("Google API not loaded yet.");
    }
  };

  const clearBrowserStorageData = () => {
    // Clear cookies
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie.replace(/^ */, "").split("=")[0] + "=;expires=" + new Date(0).toUTCString();
    });

    // Clear localStorage
    window.localStorage.clear();

    // Clear sessionStorage
    window.sessionStorage.clear();
  };
console.log({isSignedIn})
  const handleAccessDrive = async () => {
    if (!isSignedIn) {
      await window.gapi.auth2.getAuthInstance().signIn();
    } else {
      handlePickerOpen(accessToken);
    }
  };

  const handleAuthStatusChange = (isSignedIn) => {
    setIsSignedIn(isSignedIn);
    if (isSignedIn && gapi) {
      const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
      const token = currentUser.getAuthResponse().access_token;
      setAccessToken(token);
      handlePickerOpen(token);
    }
  };

  const handlePickerOpen = (accessToken) => {
    openPicker({
      clientId: "419729442733-5rmi3p1v8fvd4pld03lct3re9q1omg7i.apps.googleusercontent.com",
      developerKey: "AIzaSyDCAwF5RJUdbhf5u9d5w02JnAntMws_cg4",
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
          const fileId = data.docs[0].id;
          downloadFile(accessToken, fileId);
        }
      },
    });
  };

  return (
    <>
      <div className="App">
        <h1>Google Drive File Download</h1>
        <button onClick={() => gapiLoaded && handleAccessDrive()}>
          Authenticate and Open Google Drive Picker
        </button>
      </div>
    </>
  );
};

export default App;