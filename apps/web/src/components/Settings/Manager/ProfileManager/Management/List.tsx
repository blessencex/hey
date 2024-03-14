import type {
  LastLoggedInProfileRequest,
  Profile,
  ProfilesManagedRequest
} from '@hey/lens';

import Loader from '@components/Shared/Loader';
import UserProfile from '@components/Shared/UserProfile';
import { UsersIcon } from '@heroicons/react/24/outline';
import {
  ManagedProfileVisibility,
  useHideManagedProfileMutation,
  useProfilesManagedQuery,
  useUnhideManagedProfileMutation
} from '@hey/lens';
import { Button, EmptyState, ErrorMessage } from '@hey/ui';
import errorToast from '@lib/errorToast';
import { type FC, useEffect } from 'react';
import { useInView } from 'react-cool-inview';
import toast from 'react-hot-toast';
import { useAccount } from 'wagmi';

interface ListProps {
  managed?: boolean;
}

const List: FC<ListProps> = ({ managed = false }) => {
  const { address } = useAccount();

  const lastLoggedInProfileRequest: LastLoggedInProfileRequest = {
    for: address
  };

  const profilesManagedRequest: ProfilesManagedRequest = {
    for: address,
    hiddenFilter: managed
      ? ManagedProfileVisibility.NoneHidden
      : ManagedProfileVisibility.HiddenOnly
  };

  const { data, error, fetchMore, loading, refetch } = useProfilesManagedQuery({
    variables: {
      lastLoggedInProfileRequest,
      profilesManagedRequest
    }
  });

  const [hideManagedProfile, { loading: hiding }] =
    useHideManagedProfileMutation();
  const [unhideManagedProfile, { loading: unhiding }] =
    useUnhideManagedProfileMutation();

  useEffect(() => {
    refetch();
  }, [managed, refetch]);

  const profilesManaged = data?.profilesManaged.items;
  const pageInfo = data?.profilesManaged?.pageInfo;
  const hasMore = pageInfo?.next;

  const { observe } = useInView({
    onChange: async ({ inView }) => {
      if (!inView || !hasMore) {
        return;
      }

      return await fetchMore({
        variables: {
          lastLoggedInProfileRequest,
          profilesManagedRequest: {
            ...profilesManagedRequest,
            cursor: pageInfo.next
          }
        }
      });
    }
  });

  if (loading) {
    return <Loader className="pb-5" />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        title={
          managed
            ? 'Failed to load managed profiles'
            : 'Failed to load un-managed profiles'
        }
      />
    );
  }

  if (profilesManaged?.length === 0) {
    return (
      <EmptyState
        hideCard
        icon={<UsersIcon className="size-8" />}
        message={
          managed
            ? 'You are not managing any profiles!'
            : 'You are not un-managing any profiles!'
        }
      />
    );
  }

  const toggleManagement = async (profileId: string) => {
    try {
      if (managed) {
        await hideManagedProfile({ variables: { request: { profileId } } });
        toast.success('Profile is now un-managed');

        return refetch();
      } else {
        await unhideManagedProfile({ variables: { request: { profileId } } });
        toast.success('Profile is now managed');

        return refetch();
      }
    } catch (error) {
      errorToast(error);
    }
  };

  return (
    <div className="space-y-4">
      {profilesManaged?.map((profile) => (
        <div className="flex items-center justify-between" key={profile.id}>
          <UserProfile profile={profile as Profile} />
          <Button
            disabled={hiding || unhiding}
            onClick={() => toggleManagement(profile.id)}
            outline
            size="sm"
            variant="danger"
          >
            {managed ? 'Un-manage' : 'Manage'}
          </Button>
        </div>
      ))}
      {hasMore ? <span ref={observe} /> : null}
    </div>
  );
};

export default List;