import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useProfiles() {
  const [profiles, setProfiles] = useState<string[]>([]);

  useEffect(() => {
    api
      .getProfiles()
      .then(setProfiles)
      .catch(() => setProfiles(["default"]));
  }, []);

  return profiles;
}
