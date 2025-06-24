export interface MailAccount {
  id: string;
  address: string;
  quota: number;
  used: number;
  isDisabled: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MailMessage {
  id: string;
  accountId: string;
  msgid: string;
  from: {
    address: string;
    name: string;
  };
  to: Array<{
    address: string;
    name: string;
  }>;
  subject: string;
  intro: string;
  seen: boolean;
  isDeleted: boolean;
  hasAttachments: boolean;
  size: number;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MailMessageDetail extends MailMessage {
  cc: Array<{
    address: string;
    name: string;
  }>;
  bcc: Array<{
    address: string;
    name: string;
  }>;
  flagged: boolean;
  verifications: string[];
  retention: boolean;
  retentionDate: string;
  text: string;
  html: string[];
}

export interface AuthToken {
  id: string;
  token: string;
}

export interface Domain {
  id: string;
  domain: string;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}