export const downloadFile = (accessToken, file) => {
    fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = file.name || 'downloaded_file'; // Default file name
  
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