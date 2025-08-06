
/**
 * Simplified audio streams hook - audio handling centralized in SipCallManager
 */
export const useAudioStreams = (isCallActive: boolean) => {
  // Audio is now handled directly by SipCallManager's ontrack handler
  // This hook is kept for compatibility but doesn't perform competing audio operations
  console.log("useAudioStreams: Call active state:", isCallActive, "(audio handled by SipCallManager)");
};
