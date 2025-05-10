export const downloadFile = (url: string, name: string) => {
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};
