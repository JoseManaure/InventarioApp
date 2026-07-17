import { setAuthToken } from "../api/api";

export function forceLogout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setAuthToken(null);

    // avisar a otras pestañas
    localStorage.setItem(
        "logout-event",
        Date.now().toString()
    );

    window.location.href = "/";

}