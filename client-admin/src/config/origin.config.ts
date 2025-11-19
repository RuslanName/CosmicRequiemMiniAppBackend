export const getAllowedHosts = (allowedHostsEnv?: string): string[] => {
  return allowedHostsEnv
    ? allowedHostsEnv.split(',').map((h: string) => h.trim())
    : [];
};

