import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { NOTE_TEMPLATES } from "@zsyio/editor";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    return { templates: NOTE_TEMPLATES };
  });
}
