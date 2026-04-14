import { useMemo } from 'react';
import { useTranslations } from '../../core/dopebase';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
import useVendorRequestsList from '../../carrier/hooks/useVendorRequestsList';
import useAssignedJobs from '../../carrier/hooks/useCarrierJobsList';

type ContextType = 'offer' | 'job';

type ChatParticipant = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profilePictureURL?: string;
  role?: string;
  userID?: string;
  usersID?: string;
  [key: string]: any;
};

type BaseContextRaw = {
  id: string;
  type: ContextType;
  participants: ChatParticipant[];
  chatChannelID?: string;
  [key: string]: any;
};

export type ContextItem = {
  id: string;
  title: string;
  subtitle?: string;
  searchText?: string;
  raw: BaseContextRaw;
};

const normalizeParticipant = (item: any): ChatParticipant | null => {
  if (!item) {
    return null;
  }

  const source = item.raw || item;
  const id =
    source?.id ||
    source?.userID ||
    source?.usersID ||
    source?.uid ||
    item?.id ||
    item?.userID ||
    item?.usersID;

  if (!id) {
    return null;
  }

  const firstName = source?.firstName || item?.firstName || '';
  const lastName = source?.lastName || item?.lastName || '';

  return {
    id,
    userID: source?.userID || item?.userID || id,
    usersID: source?.usersID || item?.usersID || source?.userID || item?.userID || id,
    firstName,
    lastName,
    fullName:
      source?.fullName ||
      item?.fullName ||
      source?.displayName ||
      item?.displayName ||
      `${firstName} ${lastName}`.trim(),
    email: source?.email || item?.email || '',
    profilePictureURL:
      source?.profilePictureURL || item?.profilePictureURL || '',
    role:
      source?.role ||
      item?.role ||
      source?.userRole ||
      item?.userRole ||
      '',
    ...item,
    ...source,
  };
};

const dedupeParticipants = (participants: ChatParticipant[]) => {
  const map = new Map<string, ChatParticipant>();

  participants.forEach(participant => {
    if (participant?.id && !map.has(participant.id)) {
      map.set(participant.id, participant);
    }
  });

  return Array.from(map.values());
};

const buildOfferTitle = (request: any, fallback: string) => {
  const originTitle =
    request?.origin?.title ||
    request?.origin?.name ||
    request?.origin?.address ||
    '';

  const destinationTitle =
    request?.destination?.title ||
    request?.destination?.name ||
    request?.destination?.address ||
    '';

  const routeTitle = [originTitle, destinationTitle].filter(Boolean).join(' → ');

  return routeTitle || request?.name || request?.projectName || fallback;
};

const buildJobTitle = (job: any, fallback: string) => {
  const explicitName = job?.name || job?.title || '';

  const pickupTitle =
    job?.pickupAlias ||
    job?.origin?.title ||
    job?.origin?.name ||
    job?.origin?.address ||
    '';

  const dropoffTitle =
    job?.dropoffAlias ||
    job?.destination?.title ||
    job?.destination?.name ||
    job?.destination?.address ||
    '';

  const routeTitle = [pickupTitle, dropoffTitle].filter(Boolean).join(' → ');

  return explicitName || routeTitle || fallback;
};

const buildOfferParticipants = (
  request: any,
  currentParticipant: ChatParticipant[],
) => {
  const requester = normalizeParticipant(request?.createdBy);
  const finder = normalizeParticipant(request?.executedBy);
  const assignedDispatcher = normalizeParticipant(request?.assignedDispatcher);
  const assignedDriver = normalizeParticipant(request?.assignedDriver);

  const rawParticipants = Array.isArray(request?.participants)
    ? request.participants.map(normalizeParticipant).filter(Boolean)
    : [];

  return dedupeParticipants(
    [
      ...currentParticipant,
      requester,
      finder,
      assignedDispatcher,
      assignedDriver,
      ...rawParticipants,
    ].filter(Boolean) as ChatParticipant[],
  );
};

const buildJobParticipants = (
  job: any,
  currentParticipant: ChatParticipant[],
) => {
  const assignedFinder = normalizeParticipant(job?.assignedFinder);
  const assignedDispatcher = normalizeParticipant(job?.assignedDispatcher);
  const assignedDriver = normalizeParticipant(job?.assignedDriver);

  const rawParticipants = Array.isArray(job?.participants)
    ? job.participants.map(normalizeParticipant).filter(Boolean)
    : [];

  return dedupeParticipants(
    [
      ...currentParticipant,
      assignedFinder,
      assignedDispatcher,
      assignedDriver,
      ...rawParticipants,
    ].filter(Boolean) as ChatParticipant[],
  );
};

const useManagerContextItems = () => {
  const { localized } = useTranslations();
  const currentUser = useCurrentUser();

  const { requests, loading: requestsLoading } = useVendorRequestsList();
  const { jobs, loading: jobsLoading } = useAssignedJobs();

  const currentParticipant = useMemo(() => {
    const normalized = normalizeParticipant(currentUser);
    return normalized ? [normalized] : [];
  }, [currentUser]);

  const offerItems = useMemo<ContextItem[]>(() => {
    if (!requests) {
      return [];
    }

    return requests
      .filter((request: any) => !!request?.id)
      .map((request: any) => {
        const title = buildOfferTitle(request, localized('Offer'));
        const vendorStatus = request?.vendorStatus || request?.status || '';
        const contractStatus =
          request?.contract_status || request?.contractStatus || '';

        const subtitleParts = [
          vendorStatus ? `${localized('Status')}: ${vendorStatus}` : null,
          contractStatus ? `${localized('Contract')}: ${contractStatus}` : null,
        ].filter(Boolean);

        const participants = buildOfferParticipants(request, currentParticipant);

        return {
          id: request.id,
          title,
          subtitle: subtitleParts.join(' • ') || undefined,
          searchText: [
            title,
            vendorStatus,
            contractStatus,
            request?.id,
            request?.projectName,
            request?.origin?.title,
            request?.destination?.title,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
          raw: {
            ...request,
            type: 'offer',
            participants,
          },
        };
      });
  }, [currentParticipant, localized, requests]);

  const jobItems = useMemo<ContextItem[]>(() => {
    if (!jobs) {
      return [];
    }

    return jobs
      .filter((job: any) => !!job?.id)
      .map((job: any) => {
        const title = buildJobTitle(job, localized('Job'));
        const status = job?.status || '';
        const tripStatus = job?.tripStatus || '';

        const driverName =
          job?.assignedDriver?.fullName ||
          `${job?.assignedDriver?.firstName ?? ''} ${job?.assignedDriver?.lastName ?? ''}`.trim();

        const subtitleParts = [
          status ? `${localized('Status')}: ${status}` : null,
          tripStatus && tripStatus !== status
            ? `${localized('Trip')}: ${tripStatus}`
            : null,
          driverName ? `${localized('Driver')}: ${driverName}` : null,
        ].filter(Boolean);

        const participants = buildJobParticipants(job, currentParticipant);

        return {
          id: job.id,
          title,
          subtitle: subtitleParts.join(' • ') || undefined,
          searchText: [
            title,
            status,
            tripStatus,
            job?.id,
            job?.name,
            job?.pickupAlias,
            job?.dropoffAlias,
            job?.origin?.title,
            job?.destination?.title,
            driverName,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase(),
          raw: {
            ...job,
            type: 'job',
            participants,
          },
        };
      });
  }, [currentParticipant, jobs, localized]);

  const contextItems = useMemo<ContextItem[]>(() => {
    return [...offerItems, ...jobItems];
  }, [offerItems, jobItems]);

  return {
    contextItems,
    loading: requestsLoading || jobsLoading,
  };
};

export default useManagerContextItems;