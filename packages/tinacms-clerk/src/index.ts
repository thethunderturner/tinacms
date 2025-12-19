import { createClerkClient } from '@clerk/backend';
import type { IncomingMessage, ServerResponse } from 'http';

export const ClerkBackendAuthentication = ({
  secretKey,
  allowList,
  orgId,
}: {
  secretKey: string;
  // Ensure the user is the in allowList
  allowList?: string[];
  // Ensure the user is a member of the provided orgId
  orgId?: string;
}) => {
  const clerk = createClerkClient({ secretKey });

  return {
    isAuthorized: async (req: IncomingMessage, _res: ServerResponse) => {
      const token = req.headers['authorization'];
      const tokenWithoutBearer = token?.replace('Bearer ', '').trim();

      const requestState = await clerk.authenticateRequest(req, {
        headerToken: tokenWithoutBearer,
      });

      if (requestState.status === 'signed-in') {
        const userId = requestState.toAuth().userId;

        if (userId) {
          const user = await clerk.users.getUser(userId);

          if (orgId) {
            const membershipList = (
              await clerk.organizations.getOrganizationMembershipList({
                organizationId: orgId,
              })
            ).map((x) => x.publicUserData?.userId);

            if (!membershipList.includes(user.id)) {
              return {
                isAuthorized: false as const,
                errorMessage:
                  'User not authorized. Not a member of the provided organization.',
                errorCode: 401,
              };
            }
          }

          const primaryEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
          );

          if (primaryEmail && !allowList) {
            return { isAuthorized: true as const };
          }
          if (primaryEmail && allowList?.includes(primaryEmail.emailAddress)) {
            return { isAuthorized: true as const };
          }
        }
      }

      if (requestState.reason === 'unexpected-error') {
        console.error(requestState.message);
      }

      return {
        isAuthorized: false as const,
        errorMessage: 'User not authorized',
        errorCode: 401,
      };
    },
  };
};
