// Lifetime cap on AI calls (translations, transcriptions, photo word
// extraction) per account. Shared between the server route that enforces it
// and the client that displays/matches the exact message.
export const API_CALL_LIMIT = 150;

export const QUOTA_EXCEEDED_MESSAGE =
  "Oops, you've used up your translation limit. If you'd like more, email Nastya at sadovnikova.nastya@gmail.com";
