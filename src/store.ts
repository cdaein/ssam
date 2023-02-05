const globalState: Record<string, any> = {
  // from states
  startTime: 0,
  lastStartTime: 0,
  pausedStartTime: 0,
  pausedDuration: 0,
  timestamp: 0,
  lastTimestamp: 0,
  frameInterval: null,
  firstLoopRender: true,
  firstLoopRenderTime: 0,
  // from props
  playhead: 0,
  frame: 0,
  time: 0,
  deltaTime: 0,

  count: 0,
};

export const getGlobalState = () => {
  return globalState;
};

export const updateGlobalState = (newState: Record<string, any>) => {
  for (const key in newState) {
    if (globalState[key] === undefined) {
      throw new Error(`${key} is not found`);
    }
    globalState[key] = newState[key];
  }
};
