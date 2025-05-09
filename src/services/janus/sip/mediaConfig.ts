
interface MediaConfig {
  audioRecv: boolean;
  audioSend: boolean;
  removeAudio: boolean;
}

export class MediaConfigHandler {
  getCallMediaConstraints(): MediaStreamConstraints {
    const audioInput = localStorage.getItem('selectedAudioInput');

    return {
      audio: audioInput ? { deviceId: { exact: audioInput } } : true,
      video: false
    };
  }

  getCallMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      audioSend: true,
      removeAudio: false
    };
  }

  getAnswerMediaConfig(): MediaConfig {
    return {
      audioRecv: true,
      audioSend: true,
      removeAudio: false
    };
  }
}
