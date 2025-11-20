export interface CameraDevice {
  deviceId: string;
  label: string;
}

export const getCameraDevices = async (): Promise<CameraDevice[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === "videoinput")
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
      }));
  } catch (error) {
    console.error("Error enumerating camera devices:", error);
    return [];
  }
};

export const requestCameraPermission = async (
  deviceId?: string
): Promise<MediaStream | null> => {
  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "user" },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Camera permission granted");
    return stream;
  } catch (error) {
    console.error("Error requesting camera permission:", error);
    return null;
  }
};

export const stopCameraStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    console.log("Camera stream stopped");
  }
};
