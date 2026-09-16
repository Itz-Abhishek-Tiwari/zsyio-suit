import { AccessDenied } from "@zsyio/ui";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <AccessDenied
        title="403 - Access Forbidden"
        description="You do not have permission to access this page or resource."
        showSecondaryButton
        secondaryHref="/tasks"
        secondaryLabel="My Tasks"
      />
    </div>
  );
}
