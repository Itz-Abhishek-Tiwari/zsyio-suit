import { userQueries, type UserListFilters } from "./user.queries";
import { userInvitations } from "./user.invitations";
import { userManagement } from "./user.management";

export type { UserListFilters };

export const userRepository = {
  ...userQueries,
  ...userInvitations,
  ...userManagement,
};
