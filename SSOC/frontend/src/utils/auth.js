export const setAuthenticated = () => {
  localStorage.setItem("isAuthenticated", "true")
}

export const clearAuthenticated = () => {
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("isProfileCompleted")
}

export const isAuthenticated = () => {
  return localStorage.getItem("isAuthenticated") === "true"
}

export const setProfileCompleted = () => {
  localStorage.setItem("isProfileCompleted", "true")
}

export const isProfileCompleted = () => {
  return localStorage.getItem("isProfileCompleted") === "true"
}
