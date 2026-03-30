import { redirect } from "next/navigation";

/** Redirects the root route to the dashboard. */
export default function RootPage() {
  redirect("/dashboard");
}
