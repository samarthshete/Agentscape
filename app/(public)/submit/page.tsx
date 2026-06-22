import { redirect } from "next/navigation";

// Publishing now lives in the dashboard (the /dashboard auth gate sends signed-out
// visitors to /login). Kept so old links don't 404.
export default function SubmitPage() {
  redirect("/dashboard");
}
