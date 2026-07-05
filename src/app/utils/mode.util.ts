import config from "../config";


export const isTestMode = (): boolean => {
  return config.ai.mode === "TEST";
};

export const isProdMode = (): boolean => {
  return config.ai.mode === "PROD";
};

export const getSearchMode = (): "TEST" | "PROD" => {
  return config.ai.mode;
};
