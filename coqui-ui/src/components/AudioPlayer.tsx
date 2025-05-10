import { PauseCircleIcon, PlayCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

const AudioPlayer = ({ src }: { src: string }) => {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play();
    }
  };

  return (
    <>
      <button onClick={handlePlay}>
        {playing && <PauseCircleIcon className="w-10 h-10" />}
        {!playing && <PlayCircleIcon className="w-10 h-10" />}
      </button>
      <audio
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        ref={ref}
        src={src}
      />
    </>
  );
};

export default AudioPlayer;
