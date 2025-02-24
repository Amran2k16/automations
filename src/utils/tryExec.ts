// Simple promise wrapper similar to Go's error handling
export const tryExec = async (cmd: Promise<any>, errMsg: string) => {
  try {
    return [await cmd, null];
  } catch (err) {
    return [null, `${errMsg}: ${err}`];
  }
};
