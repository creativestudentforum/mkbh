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
  batch: string;
  department: string;
  student_id: string;
  current_company: string;
  job_title: string;
  location: string;
  linkedin_url: string;
  facebook_url: string;
  twitter_url: string;
  website_url: string;
  created_at: string;
  updated_at: string;
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
}
