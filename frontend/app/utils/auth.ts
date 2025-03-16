const AUTH_COOKIE_NAME = "auth_token";

const AUTH_MESSAGE = "Sign this message to authenticate with our dApp";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const isAuthenticated = (): boolean => {
  // return !!getCookie(AUTH_COOKIE_NAME);
  return false;
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
    body: JSON.stringify({ address, signature }),
  });

  if (!response.ok) throw new Error("Failed to verify signature");
  const data = await response.json();
  if (data.csrfToken) {
    // setCsrfToken(data.csrfToken);
  }
  return data;
};
