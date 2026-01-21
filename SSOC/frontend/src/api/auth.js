import api from "./axios"

export const login = (data) =>
  api.post("/api/auth/login/", data)

export const logout = () =>
  api.post("/api/auth/logout/")
