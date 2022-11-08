import {
  VALIDITY_IN_DAYS,
  VALIDITY_WARNING_THRESHOLD,
} from "../components/model/constants";

export function useReviewExpiration(reviewApprovedAt) {
  const now = new Date();
  const validUntil = new Date(reviewApprovedAt);
  validUntil.setDate(validUntil.getDate() + VALIDITY_IN_DAYS);

  const warningDate = new Date(validUntil);
  warningDate.setDate(warningDate.getDate() - VALIDITY_WARNING_THRESHOLD);

  const aboutToExpire = reviewApprovedAt && warningDate <= now;
  const hasExpired = !reviewApprovedAt || now > validUntil;
  return { hasExpired, validUntil, aboutToExpire };
}
