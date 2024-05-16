import GoogleDrivePicker from "google-drive-picker";
import { useEffect, useState } from "react";

const App = () => {
  const [openPicker] = GoogleDrivePicker();
  const [gapi, setGapi] = useState(null);
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const clientId = import.meta.env.CLIENT_ID;
  const developerKey = import.meta.env.DEVELOPER_KEY;
  useEffect(() => {
    const loadGapi =  () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
       script.onload = async () => {
        setGapi(window.gapi);
        await initClient(window.gapi);
        setGapiLoaded(true);
        handleAuthStatusChange(
          window.gapi.auth2.getAuthInstance().isSignedIn.get()
        );
      };
      document.body.appendChild(script);
    };

    loadGapi();
  }, []);

  const initClient = async (gapi) => {
    await gapi.load("client:auth2", async () => {
      gapi.client.init({
        clientId:
         clientId,
        discoveryDocs: [
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
        ],
        scope: "https://www.googleapis.com/auth/drive.file",
      });

      const auth2 = await gapi.auth2.getAuthInstance();
      await auth2.isSignedIn.listen(handleAuthStatusChange);
    });
  };

  const handleAuthStatusChange = (isSignedIn) => {
    console.log({ isSignedIn });
    if (isSignedIn && gapi) {
      const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
      const accessToken = currentUser.getAuthResponse().access_token;
      console.log({ currentUser, accessToken });
      handlePickerOpen(accessToken);
    }
  };

  const handlePickerOpen = (accessToken) => {
    openPicker({
      clientId:
       clientId,
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
          const fileId = data.docs[0].id;
          downloadFile(accessToken, fileId);
        }
      },
    });
  };

  const downloadFile = (accessToken, fileId) => {
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'downloaded_file.pdf'; // Default file name
  
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match && match[1]) {
            fileName = match[1];
          }
        }
  
        return response.blob().then((blob) => ({
          blob,
          fileName,
        }));
      })
      .then(({ blob, fileName }) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Error downloading file:', error);
      });
  };
  return (
    <>
      <div className="App">
        <h1>Google Drive File Download</h1>
        <button
          onClick={() =>
            gapiLoaded && gapi && gapi.auth2.getAuthInstance().signIn()
          }
        >
          Authenticate and Open Google Drive Picker
        </button>
      </div>
    </>
  );
};

export default App;
