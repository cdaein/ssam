const globalState: Record<string, any> = {
  time: 0,
  // deltaTime: 0,
  // playhead: 0,
  // frame: 0,
  // // from states
  // // lastStartTime: 0,
  // firstLoopRenderTime: 0,
  // pausedDuration: 0,
  // pausedStartTime: 0,
  // lastTimestamp: 0,
  // startTime: 0,
  // timestamp: 0,
  count: 0,
};

export const getGlobalState = () => {
  return globalState;
};

export const updateGlobalState = (newState: Record<string, any>) => {
  for (const key in newState) {
    if (globalState[key] === undefined) {
      throw new Error("no key found");
      // REVIEW: for now, just ignore
      continue;
    }
    globalState[key] = newState[key];
  }
};
