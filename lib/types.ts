export type UserRole = "alumni" | "admin";
export type UserType = "alumni" | "teacher";
export type UserStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  phone: string;
  role: UserRole;
  user_type: UserType;
  status: UserStatus;
  rejection_reason: string;
  public_code: string;
  is_featured: boolean;
  achievement: string;
  batch: string;
  department: string;
  student_id: string;
  current_company: string;
  job_title: string;
  location: string;
  linkedin_url: string;
  blood_group: string | null;
  is_blood_donor: boolean;
  last_donation_date: string | null;
  profession: string;
  company: string;
  city: string;
  country: string;
  date_of_birth: string | null;
  show_phone: boolean;
  show_birthday: boolean;
  show_email: boolean;
  show_bio: boolean;
  show_professional_info: boolean;
  show_location: boolean;
  show_social_links: boolean;
  facebook_url: string;
  twitter_url: string;
  website_url: string;
  created_at: string;
  updated_at: string;
}

export interface AlumniDirectoryProfile {
  id: string;
  full_name: string;
  batch: string;
  department: string;
  avatar_url: string | null;
  profession: string;
  company: string;
  city: string;
  country: string;
  linkedin_url: string;
  blood_group: string | null;
  phone: string | null;
  bio: string;
  facebook_url: string;
  website_url: string;
  created_at: string;
  is_featured: boolean;
  achievement: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  department: string;
  designation: string;
  phone: string;
  bio: string;
  specialization: string;
  linkedin_url: string;
  website_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
  event_rsvp_counts?: EventRsvpCounts[] | EventRsvpCounts | null;
  event_rsvps?: EventRsvp[] | null;
}

export type RsvpStatus = "going" | "maybe" | "not_going";

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  guests: number;
  created_at: string;
  profiles?: {
    full_name: string;
    batch: string;
    phone: string | null;
  } | null;
}

export interface EventRsvpCounts {
  event_id: string;
  going: number;
  guests: number;
}

export interface BloodDonor {
  id: string;
  full_name: string;
  batch: string;
  blood_group: string;
  city: string;
  phone: string;
  avatar_url: string | null;
  last_donation_date: string | null;
  available: boolean;
}

export interface Batch {
  year: string;
  coordinator_id: string | null;
  group_photo_url: string | null;
  description: string;
  created_at: string;
}

export interface BatchStats {
  year: string;
  members: number;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  event_id: string | null;
  cover_url: string | null;
  created_at: string;
  photo_count?: number;
}

export interface Photo {
  id: string;
  album_id: string;
  url: string;
  caption: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface AlumniRosterEntry {
  id: string;
  full_name: string;
  batch: string;
  department: string;
  phone: string | null;
  email: string | null;
  claimed_by: string | null;
  created_at: string;
}

export interface BirthdayProfile {
  id: string;
  full_name: string;
  batch: string;
  avatar_url: string | null;
}

export type FundKind = "income" | "expense";
export type FundStatus = "pending" | "verified" | "rejected";

export interface FundEntry {
  id: string;
  kind: FundKind;
  category: string;
  title: string;
  amount: number;
  entry_date: string;
  member_id: string | null;
  method: string | null;
  trx_id: string | null;
  status: FundStatus;
  receipt_url: string | null;
  note: string;
  created_at: string;
  profiles?: {
    full_name: string;
    batch: string;
    phone: string | null;
  } | null;
}

export interface FundSummary {
  income: number;
  expense: number;
}

export interface Memorial {
  id: string;
  full_name: string;
  batch: string;
  date_of_death: string | null;
  bio: string;
  photo_url: string | null;
  created_at: string;
}
