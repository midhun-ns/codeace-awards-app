const STORAGE_KEY = "codeace_voter_id";

export function getVoterId(): string {
  let voterId = localStorage.getItem(STORAGE_KEY);
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, voterId);
  }
  return voterId;
}
