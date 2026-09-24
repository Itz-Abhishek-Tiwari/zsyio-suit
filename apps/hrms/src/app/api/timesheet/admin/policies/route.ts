import { NextRequest } from "next/server";
import { requireUser, withApiHandler } from "@zsyio/auth/api-helpers";
import { leaveService } from "@/server/services/leave.service";
import { hrSettingsService } from "@/server/services/hr-settings.service";
import { updateLeavePoliciesSchema, updateHrSettingsSchema } from "@zsyio/validators";

export async function GET() {
  return withApiHandler(async () => {
    await requireUser();
    const [policies, settings] = await Promise.all([
      leaveService.getLeavePolicies(),
      hrSettingsService.getSettings(),
    ]);
    return { policies, settings };
  });
}

export async function PUT(req: NextRequest) {
  return withApiHandler(async () => {
    const user = await requireUser();
    const body = await req.json();

    let updatedPolicies = undefined;
    let updatedSettings = undefined;

    if (body.policies) {
      const parsedPolicies = updateLeavePoliciesSchema.parse({ policies: body.policies });
      updatedPolicies = await leaveService.updateLeavePolicies(user, parsedPolicies);
    }

    if (body.settings) {
      const parsedSettings = updateHrSettingsSchema.parse(body.settings);
      updatedSettings = await hrSettingsService.updateSettings(user, parsedSettings);
    }

    const [policies, settings] = await Promise.all([
      updatedPolicies || leaveService.getLeavePolicies(),
      updatedSettings || hrSettingsService.getSettings(),
    ]);

    return { policies, settings };
  });
}
