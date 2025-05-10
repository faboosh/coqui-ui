import { Download } from "lucide-react";
import { downloadFile } from "../util/downloadFile";
import { routes } from "../api";

const DownloadButton = ({
  id,
  url,
  promptText,
}: {
  id?: string;
  url?: string;
  promptText: string;
}) => {
  if (!id && !url) return null;

  const audioUrl = id ? routes.audio.playbackUrl(id) : (url as string);

  const generateFileName = (promptText: string) => {
    const text = promptText
      .replace(/[^a-z\d\s]/gi, "")
      .replace(/\s/gi, "-")
      .slice(0, 50)
      .toLowerCase();
    return `${text}.wav`;
  };

  return (
    <button
      onClick={() => downloadFile(audioUrl, generateFileName(promptText))}
    >
      <Download />
    </button>
  );
};

export default DownloadButton;
