import { redirect } from "next/navigation";
import { DEFAULT_PROFILE_SLUG } from "../config/app.config";

export default function NarrativeRootPage(): never {
  redirect(`/${DEFAULT_PROFILE_SLUG}`);
}
