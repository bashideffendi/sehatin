import { redirect } from "next/navigation";

// Legacy /settings route — moved to /aku per new IA.
// Keep this stub so old links/bookmarks don't 404.
export default function SettingsRedirect() {
  redirect("/aku");
}
