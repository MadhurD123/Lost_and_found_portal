export interface User {
  userId: string;
  username: string;
  email: string;
  department?: string;
  studentId?: string;
  isAdmin: boolean;
}

export type LostStatus = 'Searching' | 'Matched' | 'Returned';
export type FoundStatus = 'Available' | 'Claimed' | 'Returned';
export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LostItem {
  _id: string;
  username: string;
  userId: string;
  itemName: string;
  description: string;
  category: string;
  locationLost: string;
  dateLost: string;
  image?: string;
  contactEmail: string;
  status: LostStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface FoundItem {
  _id: string;
  username: string;
  userId: string;
  itemName: string;
  description: string;
  category: string;
  locationFound: string;
  dateFound: string;
  image?: string;
  contactEmail: string;
  status: FoundStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ClaimRequest {
  _id: string;
  itemId: string;
  itemType: 'Lost' | 'Found';
  claimantUsername: string;
  claimantEmail: string;
  message: string;
  requestStatus: ClaimStatus;
  itemName: string;
  itemPoster: string;
  createdAt: string;
}

export interface MatchSuggestion {
  matchId: string;
  itemName: string;
  category: string;
  location: string;
  date: string;
  similarityScore: number;
  reason: string;
}

export interface ChartStats {
  counts: {
    lost: number;
    found: number;
    claims: number;
    usersCount: number;
  };
  lostStatus: {
    Searching: number;
    Matched: number;
    Returned: number;
  };
  foundStatus: {
    Available: number;
    Claimed: number;
    Returned: number;
  };
  claimRequests: {
    Pending: number;
    Approved: number;
    Rejected: number;
  };
  categoryDistribution: Record<string, number>;
}
