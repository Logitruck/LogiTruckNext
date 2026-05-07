# Building Block: Voice Session Lifecycle

## Pattern Summary

Voice input in LogiTruck is implemented as an audio recording component embedded in the chat UI. The lifecycle: request OS audio permissions, configure the `expo-av` Audio mode, start recording to a local URI, track duration via status callbacks, stop and unload the recording, then hand off the URI and duration to the chat send flow. The recorded file is treated as a media attachment — same upload path as images.

---

## Problem Being Solved

Native mobile audio recording requires OS permission grants, device audio mode configuration (IOS silent mode, Android ducking), and careful resource cleanup (the `Recording` object must be explicitly unloaded before starting a new one). Without proper lifecycle management, the audio session gets stuck in a recording state that blocks other app audio.

---

## Where This Pattern Appears in the Codebase

| File | Role |
|---|---|
| `LogiDriver/src/core/chat/IMChat/BottomAudioRecorder.js` | Full audio recording lifecycle — permissions, start, stop, send |
| `LogiTruckNet/src/core/chat/IMChat/BottomAudioRecorder.js` | Identical implementation in the second app |
| `LogiDriver/src/screens/AssistantScreen/AssistantScreen.js` | AI chat screen that can navigate to `PersonalChat` with `isChatBot: true` |

Both `BottomAudioRecorder.js` files are identical. The pattern is shared across both apps without divergence.

---

## Audio Mode Configuration

Must be called before every recording session to configure the device audio pipeline:

```js
// BottomAudioRecorder.js
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,  // pause music apps
  playsInSilentModeIOS: true,                          // record even in silent mode
  shouldDuckAndroid: true,                             // lower other audio during recording
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  playThroughEarpieceAndroid: false,
  staysActiveInBackground: false,
});
```

**Why this matters:** Without `allowsRecordingIOS: true`, the microphone is not available on iOS. Without `playsInSilentModeIOS: true`, users in silent mode never see recording start. This call must happen before every `startAsync()`.

---

## Recording Object Lifecycle

```js
const recording = useRef(null);  // persists across renders, does not trigger re-renders

const beginRecording = async () => {
  setIsLoading(true);

  await Audio.setAudioModeAsync({ ... });  // configure audio mode first

  // Clean up any existing recording object before creating a new one
  if (recording.current !== null) {
    recording.current.setOnRecordingStatusUpdate(null);
    recording.current = null;
  }

  const newRecording = new Audio.Recording();
  await newRecording.prepareToRecordAsync(recordingSettings.current);  // allocate resources
  newRecording.setOnRecordingStatusUpdate(updateScreenForRecordingStatus);  // attach callback

  recording.current = newRecording;
  await recording.current.startAsync();  // begin capturing audio

  setIsLoading(false);
};

const stopRecording = async () => {
  try {
    await recording.current.stopAndUnloadAsync();  // release resources
  } catch {
    // Already unloaded — safe to ignore
  }
};
```

The `Recording` object is stored in a `useRef` because it is a mutable resource, not React state — changing it does not and should not trigger a re-render.

---

## Recording Status Callback

```js
const updateScreenForRecordingStatus = (status) => {
  const durationMillis = status.durationMillis || (+new Date() - recordStartTime.current);

  if (status.canRecord) {
    setIsRecording(status.isRecording);
    setRecordingDuration(durationMillis);
    duration.current = durationMillis;  // ref for send path
  } else if (status.isDoneRecording) {
    setIsRecording(false);
    setRecordingDuration(durationMillis);
    duration.current = durationMillis;
  }
};
```

`duration.current` (a ref) tracks duration for the send path. `recordingDuration` (state) drives the timer display. Separating them avoids a stale closure problem where `onRecordSend` would read a `duration` state value from the time the callback was created.

---

## State Machine

```
idle
  → onRecordStart() pressed
    → isLoading = true
    → Audio.setAudioModeAsync() called
    → recording.prepareToRecordAsync() called
    → recording.startAsync() called
    → isLoading = false
    → isRecording = true

  → recording active
    → status callbacks fire → recordingDuration updates (timer display)

  → onRecordStop() (cancel):
    → isLoading = true → isRecording = false → isLoading = false
    → stopRecording() called → stopAndUnloadAsync()
    → recordingDuration = null → idle

  → onRecordSend() (confirm):
    → isLoading = true
    → stopRecording() called → stopAndUnloadAsync()
    → audioSource = { uri: recording.getURI(), type: 'audio', duration: duration.current }
    → recordingDuration = null → isLoading = false → idle
    → onSend(audioSource) called ← parent (chat UI) handles upload
```

---

## Send Payload Shape

```js
const audioSource = {
  uri: recording.current.getURI(),  // local file URI (file://...)
  type: 'audio',
  duration: duration.current,       // milliseconds
};

onSend(audioSource);  // handed to parent chat component
```

The parent chat component is responsible for uploading the URI to Firebase Storage and inserting the message. The recording component only provides the local file reference.

---

## Recording Settings

```js
const RECORDING_OPTIONS_PRESET_HIGH_QUALITY = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.aac',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};
```

Uses AAC/MPEG-4 on both platforms at 44.1kHz stereo 128kbps. This produces files in the 500KB–2MB range per minute of audio, compatible with Whisper API transcription if added later.

---

## Component Props

```js
function BottomAudioRecorder({ visible, onSend, theme, appearance, localized }) {
  // visible: boolean — controls whether the recorder is shown
  // onSend: (audioSource) => void — called when recording is confirmed
  // theme, appearance, localized — from dopebase system
}
```

The component renders `null` when `visible` is `false`. The parent chat component controls visibility (typically toggled by a microphone button).

---

## Duration Display

```js
const getMMSSFromMillis = (millis) => {
  const totalSeconds = millis / 1000;
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  return `${padWithZero(minutes)}:${padWithZero(seconds)}`;
};
```

Displayed as `MM:SS` format. Updated on every status callback while recording.

---

## Extension Path: Voice-to-Text

If Whisper transcription is added in the future, the `onSend` callback's `audioSource.uri` is the input. The upload + transcription flow would be:

```
onSend(audioSource)
  → upload uri to Firebase Storage → get downloadURL
  → POST downloadURL to Cloud Function
    → fetch audio bytes
    → POST to OpenAI Whisper API
    → return transcription text
  → insert message with both audioURL and transcriptionText
```

The recording component itself does not need to change — the extension point is in the parent's `onSend` handler.

---

## AI Chat Bot Session (AssistantScreen)

```js
// LogiDriver/src/screens/AssistantScreen/AssistantScreen.js
const onBotItemPress = useCallback(() => {
  const channelID = id1 < id2 ? id1 + id2 : id2 + id1;  // deterministic channel ID
  const channel = {
    id: channelID,
    participants: [currentUser, mockAssistant],
  };
  navigation.navigate('PersonalChat', { channel, isChatBot: true });
}, [navigation]);
```

The AI chatbot uses the same `PersonalChat` screen as human-to-human chat, controlled by the `isChatBot` flag. The chat screen routes messages differently when `isChatBot: true` — to the AI callable instead of to another user's channel.

---

## Anti-patterns (do not generate)

| Anti-pattern | Why |
|---|---|
| Storing `recording` object in `useState` | Triggers unnecessary re-renders on every status update |
| Not calling `setAudioModeAsync` before `startAsync` | iOS will fail silently in silent mode |
| Not calling `stopAndUnloadAsync` before starting a new recording | Previous recording object holds audio session resources |
| Calling `recording.getURI()` before `stopAndUnloadAsync` | URI may not be finalised until recording is stopped |
| Ignoring `isDoneRecording` status callback | Recording can end without `stopAsync` (e.g., buffer full, system interrupt) |
| Reading `duration` from state inside the send handler | Stale closure — use `duration.current` ref |

---

## Testing Guidance

```
GIVEN the user presses Record
WHEN the component is in idle state
THEN Audio.setAudioModeAsync is called and recording starts

GIVEN the user presses Cancel
WHEN recording is active
THEN stopAndUnloadAsync is called and no audio is sent to onSend

GIVEN the user presses Send
WHEN recording has captured audio
THEN stopAndUnloadAsync is called and onSend is called with { uri, type: 'audio', duration }

GIVEN audio mode configuration fails (e.g., permission denied)
WHEN beginRecording throws
THEN isLoading is reset to false and recording state remains idle
```

---

## Factory Governance

- Factory generates audio recording components into `/tmp` clone only
- All `expo-av` Audio mode configuration must happen inside `beginRecording`, not at module level
- The `Recording` object must be stored in `useRef`, not `useState`
- `stopAndUnloadAsync` must be called with a `try/catch` — it can throw if the recording was already unloaded
- Duration tracking must use a `useRef` for the send path and `useState` only for display
- Generated components are reviewed and integrated by Claude Code before production use
