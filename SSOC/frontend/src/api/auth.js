import api from "./axios"

export const startMattermostOAuth = () => {
  window.location.href =
    `${import.meta.env.VITE_API_BASE_URL}/api/auth/mm/login`
}

export const handleOAuthCallback = async (code, state) => {
  const response = await api.post("/api/auth/mm/callback", {
    code,
    state,
  })
  return response.data
}
