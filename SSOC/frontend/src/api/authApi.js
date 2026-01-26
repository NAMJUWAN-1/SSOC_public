import {
  setAccessToken,
  setUserId,
  getAccessToken,
} from "./tokenManager";

const API_BASE_URL = "http://localhost:8000";

export async function loginWithMattermost(loginId, password) {
  const res = await fetch(
    `${API_BASE_URL}/api/auth/mm/login/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login_id: loginId,
        password,
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Login failed");
  }

  const data = await res.json();

  if (!data.access || !data.user?.user_id) {
    throw new Error("Invalid login response");
  }

  setAccessToken(data.access);
  setUserId(data.user.user_id);

  return {
    accessToken: data.access,
    user: data.user,
  };
}

export async function fetchUserById(userId) {
  const token = getAccessToken();

  const res = await fetch(
    `${API_BASE_URL}/api/users?user_id=${userId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Fetch user failed");
  }

  return await res.json();
}
