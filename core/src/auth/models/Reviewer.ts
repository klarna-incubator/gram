export type Reviewer = {
  sub: string;
  name: string;
  mail: string;
  recommended: boolean;
  slackUrl?: string;
  calendarLink?: string;
};
