import api from "./api/axiosConfig";

export const loginUser = (data) => api.post("login/", data);
export const registerUser = (data) => api.post("register/", data);
export const getProfile = () => api.get("profile/");
export const updateProfile = (data) => api.put("profile/update/", data);
export const getPosts = () => api.get("posts/");
export const likePost = (postId) => api.post(`posts/${postId}/like/`);
export const getFriendRequests = () => api.get("friends/requests/");
export const sendFriendRequest = (toUser) => api.post("friends/requests/", { to_user: toUser });
export const respondFriendRequest = (requestId, action) => api.post(`friends/requests/${requestId}/respond/`, { action });

export default api;
