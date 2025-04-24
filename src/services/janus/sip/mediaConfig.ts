
interface MediaConfig {
  audioRecv: boolean;
  videoRecv: boolean;
  audioSend: boolean;
  videoSend: boolean;
  removeAudio: boolean;
  removeVideo: boolean;
}

export class MediaConfigHandler {
  getCallMediaConstraints(): MediaStreamConstraints {
    const audioInput = localStorage.getItem('selectedAudioInput');
    const videoInput = localStorage.getItem('selectedVideoInput');

    return {
      audio: audioInput ? { deviceId: { exact: audioInput } } : true,
      video: videoInput ? { deviceId: { exact: videoInput } } : false
    };
  }

  getCallMediaConfig(videoInput: string | null): MediaConfig {
    return {
      audioRecv: true,
      videoRecv: true,
      audioSend: true,
      videoSend: !!videoInput,
      removeAudio: false,
      removeVideo: !videoInput
    };
  }

  getAnswerMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      videoRecv: true,
      audioSend: true,
      videoSend: true,
      removeAudio: false,
      removeVideo: false
    };
  }
}
