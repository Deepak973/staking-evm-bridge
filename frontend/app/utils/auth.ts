const AUTH_COOKIE_NAME = "auth_token";

const AUTH_MESSAGE = "Sign this message to authenticate.";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split("; ");

  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
};

export const getAuthMessage = (): string => {
  return AUTH_MESSAGE;
};

export const verifySignature = async (address: string, signature: string) => {
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ address, signature }),
  });

  if (!response.ok) throw new Error("Failed to verify signature");
  const data = await response.json();

  return data;
};

export const signOutUser = async () => {
  const csrfToken = getCookie("csrf_token_client");
  console.log("csrfToken", csrfToken);
  const response = await fetch(`${API_URL}/api/auth/signout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken || "",
    },
  });
  if (!response.ok) throw new Error("Failed to sign out");
  const data = await response.json();

  return data;
};
